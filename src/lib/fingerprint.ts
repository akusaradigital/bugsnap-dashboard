// Error fingerprinting: collapses the same bug reported by many people into one
// identity, so a capture list can be prioritised by frequency instead of read
// one screenshot at a time.
//
// The fingerprint is derived from the capture's dev_logs, NOT from its title or
// screenshot: two testers hitting one bug write different titles, and the pixels
// differ by viewport. What matches is the error itself.
//
// Pure functions only - no DB, no network, no React. The insert route calls
// captureFingerprint() and stores the result; everything else reads it back.

/** A dev_logs console entry, as written by the extension's injected logger. */
interface ConsoleLogLike {
  type?: string;
  level?: string;
  message?: string;
  text?: string;
  stack?: string | null;
}

/** A dev_logs network entry. */
interface NetworkLogLike {
  type?: string;
  method?: string;
  status?: number;
  url?: string;
}

type DevLogLike = ConsoleLogLike & NetworkLogLike;

/**
 * Strip the parts of an error message that differ between two reports of the
 * SAME bug. Without this, "Cannot read id of undefined at 14:03" and the same
 * error at 14:09 fingerprint differently and never group.
 *
 * Order matters: the broad number rule runs last so the specific shapes (uuid,
 * hex, quoted strings) are already placeholders and cannot be partly eaten.
 */
export function normalizeErrorMessage(raw: string): string {
  if (!raw || typeof raw !== "string") return "";

  let s = raw.trim();

  // Drop a leading log-level prefix the page may have added itself.
  s = s.replace(/^\s*(?:uncaught\s+)?(?:error|warning|warn)\s*[:\-]\s*/i, "");

  // Volatile identifiers, longest/most specific first.
  s = s.replace(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
    "<uuid>",
  );
  // ISO-8601 timestamps (with optional time and zone).
  s = s.replace(
    /\b\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?\b/g,
    "<ts>",
  );
  // Bare clock times ("at 14:03:22").
  s = s.replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, "<ts>");
  // Long hex blobs (object ids, hashes, request ids).
  s = s.replace(/\b[0-9a-f]{16,}\b/gi, "<hex>");
  // Quoted payloads: the shape is the signal, the content is not.
  s = s.replace(/"(?:\\.|[^"\\]){0,200}"/g, '"<str>"');
  s = s.replace(/'(?:\\.|[^'\\]){0,200}'/g, "'<str>'");
  // URLs inside the message - keep the fact there was one, drop which.
  s = s.replace(/\bhttps?:\/\/[^\s)"']+/gi, "<url>");
  // Standalone numbers (row counts, retry counters, ports, offsets).
  s = s.replace(/\b\d+\b/g, "<n>");

  // Collapse whitespace so formatting differences do not split a group.
  s = s.replace(/\s+/g, " ").trim();

  return s.toLowerCase();
}

/**
 * The first stack frame that belongs to the application rather than to a
 * framework or our own instrumentation. That frame is what actually identifies
 * where a bug lives; a React-internal frame would group unrelated bugs together.
 *
 * Returns "" when nothing usable remains - callers must treat the stack as
 * absent rather than fabricating a frame.
 */
export function topAppFrame(stack: string | null | undefined): string {
  if (!stack || typeof stack !== "string") return "";

  // Frames belonging to instrumentation or vendor runtime: never a bug's home.
  // bugsnap-internal is the sourceURL sentinel our injected console wrapper uses.
  //
  // Framework bundles are matched by bare filename too, not only by a path
  // prefix: a production stack says "at commit (react-dom.production.min.js:1:1)"
  // with no leading slash, so a /react-dom pattern missed it and the vendor
  // frame was accepted as the app frame - which would group unrelated bugs.
  const NOISE =
    /chrome-extension:\/\/|moz-extension:\/\/|safari-extension:\/\/|edge-extension:\/\/|bugsnap-internal|injected_logger|rrweb|record_controls|node_modules|webpack-internal|\(native\)|\(<anonymous>\)|\breact(?:-dom|-native)?[.-]|\bvue(?:\.runtime)?[.-]|\bangular[.-]|\bsvelte[.-]|\bzone\.js|\bpolyfills[.-]|\bjquery[.-]|\bvendors?[.-~]|\bchunk-[\w]+\.js|\.min\.js\b/i;

  for (const line of stack.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || !/^at\b|@/.test(trimmed)) continue;
    if (NOISE.test(trimmed)) continue;

    // Prefer "file.ext:line" and deliberately drop the column: a one-character
    // edit shifts the column and would otherwise split an existing group.
    const fileLine = trimmed.match(
      /([\w.-]+\.(?:[jt]sx?|mjs|cjs|vue|svelte)):(\d+)(?::\d+)?/i,
    );
    if (fileLine) return `${fileLine[1]}:${fileLine[2]}`.toLowerCase();

    // No file:line (minified or unusual format): fall back to the function name.
    const fnName = trimmed.match(/^at\s+([\w$.<>]+)/);
    if (fnName && fnName[1] !== "Object.<anonymous>") {
      return fnName[1].toLowerCase();
    }
  }

  return "";
}

/**
 * Whether a path segment looks machine-generated rather than authored.
 *
 * Split on the separators humans use, then judge each sub-token: a random token
 * mixes upper case, lower case and digits in a run of real length. "image",
 * "order-history" and "v2" survive; "6th6CbQ8nNf" and "8f3Kd9xQ2b" do not.
 */
function looksGenerated(segment: string): boolean {
  for (const token of segment.split(/[-_.]/)) {
    if (token.length < 10) continue;
    if (!/\d/.test(token)) continue;
    if (!/[a-z]/.test(token)) continue;
    if (!/[A-Z]/.test(token)) continue;
    return true;
  }
  return false;
}

/**
 * Route identity for a URL: host + path with volatile path segments replaced.
 * /orders/8821 and /orders/9143 are the same route, so the same bug on two
 * different records groups rather than fragmenting per record id.
 */
export function normalizeRoute(siteUrl: string | null | undefined): string {
  if (!siteUrl || typeof siteUrl !== "string") return "";
  try {
    const withScheme = /^https?:\/\//i.test(siteUrl) ? siteUrl : `https://${siteUrl}`;
    const u = new URL(withScheme);
    const host = u.hostname.toLowerCase().replace(/^www\./, "");

    const path = u.pathname
      .split("/")
      .map((seg) => {
        if (!seg) return seg;
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seg)) return ":id";
        if (/^\d+$/.test(seg)) return ":id";
        if (/^[0-9a-f]{16,}$/i.test(seg)) return ":id";
        // Opaque generated ids (session keys, "projection_p-6th6CbQ8nNf").
        // Keyed on a high-entropy run rather than on the whole segment, because
        // real ids are often prefixed ("order_8f3Kd9xQ2b"). A hyphen alone is
        // not disqualifying - "order-history" survives because no sub-token
        // mixes letter case and digits the way a random token does.
        if (looksGenerated(seg)) return ":id";
        return seg.toLowerCase();
      })
      .join("/")
      .replace(/\/+$/, "");

    // Query string and hash are deliberately excluded: same route, same bug.
    return host + (path || "/");
  } catch {
    return "";
  }
}

/**
 * Pick the single error a capture should be identified by: the first console
 * error, else the first warning, else the first failing request.
 *
 * One signal per capture on purpose - fingerprinting the whole log array would
 * mean one extra unrelated warning breaks the grouping.
 */
function primarySignal(
  logs: DevLogLike[],
): { kind: "console"; message: string; stack: string } | { kind: "network"; key: string } | null {
  const isConsole = (l: DevLogLike) => l.type === "console";
  const text = (l: DevLogLike) => String(l.message || l.text || "");

  const errors = logs.filter(
    (l) => isConsole(l) && String(l.level || "").toLowerCase() === "error",
  );
  const warnings = logs.filter((l) => {
    const lvl = String(l.level || "").toLowerCase();
    return isConsole(l) && (lvl === "warn" || lvl === "warning");
  });

  const chosen = errors[0] || warnings[0];
  if (chosen && (text(chosen) || chosen.stack)) {
    return { kind: "console", message: text(chosen), stack: String(chosen.stack || "") };
  }

  const failed = logs.find(
    (l) => l.type === "network" && (Number(l.status) >= 400 || Number(l.status) === 0),
  );
  if (failed) {
    const method = String(failed.method || "GET").toUpperCase();
    const status = Number(failed.status) || 0;
    // Route-normalized so the same broken endpoint groups across record ids.
    return { kind: "network", key: `${method} ${normalizeRoute(failed.url)} ${status}` };
  }

  return null;
}

/** Accepts the raw dev_logs column, which may be an array, the v1 summary object, or a JSON string. */
function toLogArray(devLogs: unknown): DevLogLike[] {
  let value = devLogs;

  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (Array.isArray(value)) {
    return value.filter((l): l is DevLogLike => Boolean(l) && typeof l === "object");
  }
  // The compact v1 summary object carries topErrors[] instead of full rows.
  if (value && typeof value === "object") {
    const summary = value as { topErrors?: unknown };
    if (Array.isArray(summary.topErrors)) {
      return summary.topErrors
        .filter((m): m is string => typeof m === "string" && m.trim() !== "")
        .map((m) => ({ type: "console", level: "error", message: m }));
    }
  }
  return [];
}

/**
 * FNV-1a (32-bit), hex, 8 chars. Chosen over SHA-256 because this value is a
 * grouping key, never a security boundary - it must not be mistaken for one.
 * Collisions only ever merge two distinct bugs in one workspace's list, which
 * is why the fingerprint is always stored scoped to a workspace.
 */
function hash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/**
 * The capture's grouping key, or null when there is no error to group on.
 *
 * null is a real and common answer: a capture of a layout glitch has no console
 * error. Those must stay ungrouped rather than all collapsing into one bucket,
 * which is why this returns null instead of hashing an empty string.
 */
export function captureFingerprint(input: {
  devLogs: unknown;
  siteUrl?: string | null;
}): string | null {
  const logs = toLogArray(input.devLogs);
  if (logs.length === 0) return null;

  const signal = primarySignal(logs);
  if (!signal) return null;

  const route = normalizeRoute(input.siteUrl);

  if (signal.kind === "network") {
    return hash(`v1|net|${signal.key}`);
  }

  const message = normalizeErrorMessage(signal.message);
  const frame = topAppFrame(signal.stack);

  // Require something durable to group on. A stack with no app frame and a
  // message that normalized to nothing is not an identity.
  if (!message && !frame) return null;

  return hash(`v1|js|${message}|${frame}|${route}`);
}
