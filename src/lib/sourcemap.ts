import "server-only";

// Resolve a minified stack frame back to its original source position.
//
// Why this exists: a capture's stack reads "main.a3f9.js:1:48213", which tells
// neither a developer nor the AI summary anything. When the site publishes its
// source map, that same frame becomes "Checkout.tsx:142" - which is the whole
// difference between a report someone can act on and one they cannot.
//
// Deliberate limits, because this fetches URLs that come from capture data:
//   - every outbound request goes through assertPublicUrl (SSRF guard)
//   - hard byte cap, so a huge .map cannot exhaust server memory
//   - per-request timeout, so a slow host cannot hold a route open
//   - best-effort by design: a site without published maps is the common case,
//     and must degrade to the original frame rather than fail the caller
//
// Only the VLQ decoding and mapping lookup are implemented here; pulling in a
// full source-map library would add a dependency for the one thing we need.

import { assertPublicUrl } from "@/lib/safe-url";

/** A frame parsed out of a stack trace. */
export interface MinifiedFrame {
  /** Script URL as it appeared in the stack. */
  file: string;
  /** 1-based line, as stack traces report it. */
  line: number;
  /** 1-based column, as stack traces report it. */
  column: number;
  /** Function name from the stack, when present. */
  fn?: string;
}

/** A frame after mapping back to original source. */
export interface ResolvedFrame {
  file: string;
  line: number;
  column: number;
  /** Original authored name when the map provides one. */
  name?: string;
  /** The source line itself, when the map embeds sourcesContent. */
  sourceLine?: string;
}

const MAX_MAP_BYTES = 8 * 1024 * 1024; // 8 MiB: generous for real apps, bounded for us
const FETCH_TIMEOUT_MS = 4000;
const MAX_MAPS_PER_CALL = 3; // one capture rarely spans more than a couple of bundles

export const MAX_CACHE_ENTRIES = 100;
export const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes: bounded lifetime to eventually pick up redeploys

/**
 * Parse the frames of a V8-style stack trace.
 * Chrome is the only browser the extension supports, so only its two shapes
 * are handled: "at fn (url:line:col)" and the bare "at url:line:col".
 */
export function parseStackFrames(stack: string): MinifiedFrame[] {
  if (!stack || typeof stack !== "string") return [];
  const frames: MinifiedFrame[] = [];

  for (const raw of stack.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line.startsWith("at ")) continue;

    const withFn = line.match(/^at\s+(.+?)\s+\((.+):(\d+):(\d+)\)$/);
    const bare = line.match(/^at\s+(.+):(\d+):(\d+)$/);

    if (withFn) {
      frames.push({ fn: withFn[1], file: withFn[2], line: Number(withFn[3]), column: Number(withFn[4]) });
    } else if (bare) {
      frames.push({ file: bare[1], line: Number(bare[2]), column: Number(bare[3]) });
    }
  }
  return frames;
}

/** Base64-VLQ alphabet, index = value. */
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const B64_INDEX: Record<string, number> = {};
for (let i = 0; i < B64.length; i++) B64_INDEX[B64[i]] = i;

/**
 * Decode one base64-VLQ segment into its signed integers.
 * Returns null on malformed input rather than throwing: a corrupt map must
 * degrade to "unresolved", never break the request.
 */
function decodeVlq(segment: string): number[] | null {
  const out: number[] = [];
  let shift = 0;
  let value = 0;

  for (const ch of segment) {
    const digit = B64_INDEX[ch];
    if (digit === undefined) return null;

    const hasContinuation = digit & 32;
    value += (digit & 31) << shift;

    if (hasContinuation) {
      shift += 5;
    } else {
      const negative = value & 1;
      value >>= 1;
      out.push(negative ? (value === 0 ? -0x80000000 : -value) : value);
      value = 0;
      shift = 0;
    }
  }
  return out;
}

interface RawSourceMap {
  version?: number;
  mappings?: string;
  sources?: string[];
  sourcesContent?: (string | null)[];
  names?: string[];
  sourceRoot?: string;
  sections?: unknown;
}

interface DecodedMapping {
  genLine: number; // 0-based
  genColumn: number; // 0-based
  srcIndex: number;
  srcLine: number; // 0-based
  srcColumn: number; // 0-based
  nameIndex: number;
}

/**
 * Decode the `mappings` field into a flat list.
 * Only mappings with a source reference are kept - a generated-column-only
 * entry carries no original position and would resolve to nothing useful.
 */
function decodeMappings(mappings: string): DecodedMapping[] {
  const result: DecodedMapping[] = [];
  let genLine = 0;
  let prevSrcIndex = 0;
  let prevSrcLine = 0;
  let prevSrcColumn = 0;
  let prevNameIndex = 0;

  for (const lineGroup of mappings.split(";")) {
    let genColumn = 0;
    if (lineGroup) {
      for (const segment of lineGroup.split(",")) {
        if (!segment) continue;
        const fields = decodeVlq(segment);
        if (!fields || fields.length === 0) continue;

        genColumn += fields[0];
        if (fields.length >= 4) {
          prevSrcIndex += fields[1];
          prevSrcLine += fields[2];
          prevSrcColumn += fields[3];
          if (fields.length >= 5) prevNameIndex += fields[4];

          result.push({
            genLine,
            genColumn,
            srcIndex: prevSrcIndex,
            srcLine: prevSrcLine,
            srcColumn: prevSrcColumn,
            nameIndex: fields.length >= 5 ? prevNameIndex : -1,
          });
        }
      }
    }
    genLine++;
  }
  return result;
}

/**
 * Find the mapping that covers a generated position: on the same line, the
 * last entry at or before the column. Minifiers emit one mapping per token,
 * so an exact column match is the exception, not the rule.
 */
function lookupMapping(
  mappings: DecodedMapping[],
  line0: number,
  column0: number,
): DecodedMapping | null {
  let best: DecodedMapping | null = null;
  for (const m of mappings) {
    if (m.genLine !== line0) continue;
    if (m.genColumn > column0) continue;
    if (!best || m.genColumn > best.genColumn) best = m;
  }
  return best;
}

/** Strip a webpack/vite style prefix so the path reads like a repo path. */
function tidySourcePath(path: string): string {
  return path
    .replace(/^webpack:\/\/\/?/, "")
    .replace(/^(?:\.\.\/)+/, "")
    .replace(/^\.\//, "");
}

async function fetchText(url: string, maxBytes: number): Promise<string | null> {
  let safe: URL;
  try {
    safe = await assertPublicUrl(url);
  } catch {
    return null; // not publicly routable, or not http(s)
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(safe.toString(), {
      signal: controller.signal,
      redirect: "follow",
      cache: "no-store",
      headers: { Accept: "application/json, text/plain, */*" },
    });
    if (!res.ok) return null;

    // Trust the declared length when present, but still cap while reading:
    // Content-Length is advisory and may be absent or wrong.
    const declared = Number(res.headers.get("content-length") || 0);
    if (declared && declared > maxBytes) return null;

    const reader = res.body?.getReader();
    if (!reader) {
      const text = await res.text();
      return text.length > maxBytes ? null : text;
    }

    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => {});
        return null;
      }
      chunks.push(value);
    }
    return new TextDecoder().decode(
      chunks.reduce((acc, c) => {
        const merged = new Uint8Array(acc.length + c.length);
        merged.set(acc);
        merged.set(c, acc.length);
        return merged;
      }, new Uint8Array()),
    );
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Locate a script's source map URL.
 * Tries the conventional "<script>.map" first, then the sourceMappingURL
 * comment in the script itself - the convention hits far more often and avoids
 * downloading the whole bundle.
 */
async function resolveMapUrl(scriptUrl: string): Promise<{ url: string; body: string } | null> {
  const conventional = `${scriptUrl.split("#")[0].split("?")[0]}.map`;
  const direct = await fetchText(conventional, MAX_MAP_BYTES);
  if (direct && direct.trimStart().startsWith("{")) {
    return { url: conventional, body: direct };
  }

  const script = await fetchText(scriptUrl, MAX_MAP_BYTES);
  if (!script) return null;

  // Only the last directive counts, per the source map spec.
  // An exec loop rather than matchAll: this project compiles to ES5, where
  // spreading an iterator is a type error.
  const directive = /[#@]\s*sourceMappingURL=(\S+)/g;
  let lastRef: string | null = null;
  for (let m = directive.exec(script); m !== null; m = directive.exec(script)) {
    lastRef = m[1];
  }
  if (!lastRef) return null;

  const ref = lastRef.trim();

  // Inline data: URI - no second request needed.
  if (ref.startsWith("data:")) {
    const comma = ref.indexOf(",");
    if (comma === -1) return null;
    const meta = ref.slice(0, comma);
    const payload = ref.slice(comma + 1);
    try {
      const body = meta.includes("base64")
        ? Buffer.from(payload, "base64").toString("utf8")
        : decodeURIComponent(payload);
      return body.length > MAX_MAP_BYTES ? null : { url: scriptUrl, body };
    } catch {
      return null;
    }
  }

  let absolute: string;
  try {
    absolute = new URL(ref, scriptUrl).toString();
  } catch {
    return null;
  }
  const body = await fetchText(absolute, MAX_MAP_BYTES);
  return body ? { url: absolute, body } : null;
}

interface DecodedSourceMapBundle {
  mappings: DecodedMapping[];
  map: RawSourceMap;
}

interface CacheEntry {
  data: DecodedSourceMapBundle | null;
  expiresAt: number;
}

const sourceMapCache = new Map<string, CacheEntry>();

function getCachedSourceMap(
  file: string,
): { hit: true; data: DecodedSourceMapBundle | null } | { hit: false } {
  const entry = sourceMapCache.get(file);
  if (!entry) return { hit: false };

  if (Date.now() > entry.expiresAt) {
    sourceMapCache.delete(file);
    return { hit: false };
  }

  // LRU refresh: delete and re-insert to move to the end of the iteration order
  sourceMapCache.delete(file);
  sourceMapCache.set(file, entry);
  return { hit: true, data: entry.data };
}

function setCachedSourceMap(file: string, data: DecodedSourceMapBundle | null): void {
  if (sourceMapCache.has(file)) {
    sourceMapCache.delete(file);
  } else if (sourceMapCache.size >= MAX_CACHE_ENTRIES) {
    const oldest = sourceMapCache.keys().next().value;
    if (oldest !== undefined) {
      sourceMapCache.delete(oldest);
    }
  }
  sourceMapCache.set(file, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

/** Test-only helper: clear the in-process source map cache. */
export function __clearSourcemapCacheForTests(): void {
  sourceMapCache.clear();
}

/** Test-only helper: return current size of the in-process source map cache. */
export function __getSourcemapCacheSizeForTests(): number {
  return sourceMapCache.size;
}

/**
 * Resolve the frames of one stack trace.
 *
 * Returns a line-for-line rendering of the input frames: a frame that could not
 * be resolved is returned as it was, so the caller never has to reconcile two
 * differently-shaped lists. `resolvedCount` says how many actually improved,
 * which is what tells the caller whether this was worth anything.
 */
export async function resolveStack(stack: string): Promise<{
  frames: Array<{ raw: MinifiedFrame; resolved: ResolvedFrame | null }>;
  resolvedCount: number;
}> {
  const frames = parseStackFrames(stack);
  if (frames.length === 0) return { frames: [], resolvedCount: 0 };

  // Group by script so each bundle is fetched and decoded once, not per frame.
  const byFile = new Map<string, MinifiedFrame[]>();
  for (const f of frames) {
    if (!/^https?:\/\//i.test(f.file)) continue; // skip inline/eval/extension frames
    const list = byFile.get(f.file);
    if (list) list.push(f);
    else byFile.set(f.file, [f]);
  }

  const decodedByFile = new Map<
    string,
    { mappings: DecodedMapping[]; map: RawSourceMap } | null
  >();

  // Array.from rather than spreading the iterator: ES5 target (see above).
  for (const file of Array.from(byFile.keys()).slice(0, MAX_MAPS_PER_CALL)) {
    const cached = getCachedSourceMap(file);
    if (cached.hit) {
      decodedByFile.set(file, cached.data);
      continue;
    }

    const found = await resolveMapUrl(file);
    if (!found) {
      setCachedSourceMap(file, null);
      decodedByFile.set(file, null);
      continue;
    }
    try {
      const map = JSON.parse(found.body) as RawSourceMap;
      // Indexed maps (`sections`) are rare and need separate handling; treat
      // them as unresolvable rather than guessing at offsets.
      if (!map.mappings || typeof map.mappings !== "string" || map.sections) {
        setCachedSourceMap(file, null);
        decodedByFile.set(file, null);
        continue;
      }
      const bundle: DecodedSourceMapBundle = { mappings: decodeMappings(map.mappings), map };
      setCachedSourceMap(file, bundle);
      decodedByFile.set(file, bundle);
    } catch {
      setCachedSourceMap(file, null);
      decodedByFile.set(file, null);
    }
  }

  let resolvedCount = 0;
  const out = frames.map((raw) => {
    const decoded = decodedByFile.get(raw.file);
    if (!decoded) return { raw, resolved: null };

    // Stack traces are 1-based; source maps are 0-based.
    const hit = lookupMapping(decoded.mappings, raw.line - 1, raw.column - 1);
    if (!hit) return { raw, resolved: null };

    const sources = decoded.map.sources || [];
    const rawPath = sources[hit.srcIndex];
    if (!rawPath) return { raw, resolved: null };

    const root = decoded.map.sourceRoot ? `${decoded.map.sourceRoot.replace(/\/$/, "")}/` : "";
    const file = tidySourcePath(root + rawPath);

    const name =
      hit.nameIndex >= 0 ? decoded.map.names?.[hit.nameIndex] : undefined;

    // The authored line itself, when the map embeds its sources.
    let sourceLine: string | undefined;
    const content = decoded.map.sourcesContent?.[hit.srcIndex];
    if (typeof content === "string") {
      const lines = content.split(/\r?\n/);
      const text = lines[hit.srcLine];
      if (typeof text === "string") sourceLine = text.trim().slice(0, 200);
    }

    resolvedCount++;
    return {
      raw,
      resolved: {
        file,
        line: hit.srcLine + 1,
        column: hit.srcColumn + 1,
        ...(name ? { name } : {}),
        ...(sourceLine ? { sourceLine } : {}),
      },
    };
  });

  return { frames: out, resolvedCount };
}

/**
 * Render a resolved stack back to text for the AI prompt.
 * Unresolved frames keep their original form so nothing is silently dropped.
 */
export function formatResolvedStack(
  resolved: Awaited<ReturnType<typeof resolveStack>>,
  maxLines = 8,
): string {
  return resolved.frames
    .slice(0, maxLines)
    .map(({ raw, resolved: r }) => {
      if (!r) {
        const where = `${raw.file}:${raw.line}:${raw.column}`;
        return raw.fn ? `    at ${raw.fn} (${where})` : `    at ${where}`;
      }
      const who = r.name || raw.fn || "";
      const where = `${r.file}:${r.line}:${r.column}`;
      const head = who ? `    at ${who} (${where})` : `    at ${where}`;
      return r.sourceLine ? `${head}\n        > ${r.sourceLine}` : head;
    })
    .join("\n");
}
