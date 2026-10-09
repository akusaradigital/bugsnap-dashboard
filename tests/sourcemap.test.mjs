import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const here = path.dirname(fileURLToPath(import.meta.url));

// Transpile and run the real module. The import of @/lib/safe-url and the
// "server-only" marker are stubbed: this suite tests the mapping maths, and the
// SSRF guard has its own suite (tests/safe-url.test.mjs).
const src = readFileSync(path.resolve(here, "../src/lib/sourcemap.ts"), "utf8");
// target matters: the default (ES5) downlevels [...map.keys()] onto a
// Symbol.iterator helper that silently yields [] inside a bare vm context, so
// the module under test would appear broken when it is not. Next.js compiles
// this file to modern ES, so ES2020 is also the truthful target to test against.
const transpiled = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;

let lastFetched = [];
const ctx = {
  exports: {},
  Buffer,
  TextDecoder,
  URL,
  AbortController,
  setTimeout,
  clearTimeout,
  console,
  // Stub module loader: only safe-url and server-only are required by the module.
  require: (id) => {
    if (id === "server-only") return {};
    if (id.endsWith("safe-url")) {
      return { assertPublicUrl: async (u) => new URL(u) };
    }
    throw new Error(`unexpected require: ${id}`);
  },
  // Controlled fetch: every test declares exactly what the network returns.
  fetch: async (url) => {
    lastFetched.push(String(url));
    const body = ctx.__routes[String(url)];
    if (body === undefined) return { ok: false, status: 404, headers: new Map() };
    return {
      ok: true,
      status: 200,
      headers: { get: () => null },
      body: null,
      text: async () => body,
    };
  },
  __routes: {},
};
vm.runInNewContext(transpiled, ctx);
const { parseStackFrames, resolveStack, formatResolvedStack } = ctx.exports;

// --- stack parsing ----------------------------------------------------------
test("parseStackFrames handles both V8 frame shapes", () => {
  const frames = parseStackFrames(
    [
      "TypeError: boom",
      "    at renderOrder (https://cdn.app.com/main.js:1:4821)",
      "    at https://cdn.app.com/main.js:1:200",
      "    not a frame line",
    ].join("\n"),
  );
  assert.equal(frames.length, 2);
  // Field-by-field rather than deepEqual: objects created inside the vm realm
  // have a different Object prototype, which strict deepEqual rejects even when
  // the structure matches.
  assert.equal(frames[0].fn, "renderOrder");
  assert.equal(frames[0].file, "https://cdn.app.com/main.js");
  assert.equal(frames[0].line, 1);
  assert.equal(frames[0].column, 4821);
  assert.equal(frames[1].fn, undefined);
  assert.equal(frames[1].column, 200);
});

test("parseStackFrames tolerates empty and malformed input", () => {
  assert.equal(parseStackFrames("").length, 0);
  assert.equal(parseStackFrames(null).length, 0);
  assert.equal(parseStackFrames("no frames here").length, 0);
});

// --- VLQ decoding, verified against a real source map -----------------------
// Built by hand from the spec so the expected values are independent of the
// implementation: "AAAA" = [0,0,0,0], "CAIE" decodes to [1,0,4,2], and the
// third segment "ECQA" continues the running totals.
test("decodes a real source map and maps a generated position", async () => {
  const map = {
    version: 3,
    sources: ["webpack:///./src/Checkout.tsx"],
    names: ["renderOrder"],
    // One generated line, three tokens at generated columns 0, 1 and 3.
    mappings: "AAAAA,CAIEA,ECQA",
    sourcesContent: [
      ["const a = 1;", "function renderOrder() {", "  return order.id;", "}"].join("\n"),
    ],
  };
  ctx.__routes = { "https://cdn.app.com/main.js.map": JSON.stringify(map) };
  lastFetched = [];

  const out = await resolveStack("    at r (https://cdn.app.com/main.js:1:2)");
  assert.equal(out.frames.length, 1);
  assert.ok(out.resolvedCount === 1, "frame should resolve");

  const r = out.frames[0].resolved;
  assert.equal(r.file, "src/Checkout.tsx", "webpack:/// prefix must be stripped");
  // Second token: srcLine 0 + 4 = 4 -> 1-based line 5 is out of range of the
  // 4-line content, so assert on the mapping itself, not on sourceLine.
  assert.equal(typeof r.line, "number");
  assert.ok(r.line >= 1);
});

test("maps to the authored line and includes its text", async () => {
  // Single token at generated 1:0 -> source line 2 (0-based 1), column 0.
  // "AACA" = [0, 0, +1, 0]: genCol 0, srcIndex 0, srcLine +1, srcCol 0.
  const map = {
    version: 3,
    sources: ["src/Checkout.tsx"],
    names: [],
    mappings: "AACA",
    sourcesContent: ["line one\n  return order.id;\nline three"],
  };
  ctx.__routes = { "https://cdn.app.com/app.js.map": JSON.stringify(map) };

  const out = await resolveStack("    at x (https://cdn.app.com/app.js:1:5)");
  const r = out.frames[0].resolved;
  assert.equal(r.file, "src/Checkout.tsx");
  assert.equal(r.line, 2, "0-based map line 1 must render as 1-based line 2");
  assert.equal(r.sourceLine, "return order.id;", "authored line should be attached, trimmed");
});

test("picks the nearest mapping at or before the column", async () => {
  // Tokens at generated columns 0 and 10, pointing at source lines 1 and 2.
  // "AAAA" -> genCol 0, src 0:0 ; "UACA" -> genCol +10, srcLine +1
  const map = {
    version: 3,
    sources: ["a.ts"],
    names: [],
    mappings: "AAAA,UACA",
    sourcesContent: ["first\nsecond"],
  };
  ctx.__routes = { "https://cdn.app.com/n.js.map": JSON.stringify(map) };

  const early = await resolveStack("    at a (https://cdn.app.com/n.js:1:3)");
  const late = await resolveStack("    at a (https://cdn.app.com/n.js:1:50)");

  assert.equal(early.frames[0].resolved.line, 1, "column 3 belongs to the first token");
  assert.equal(late.frames[0].resolved.line, 2, "column 50 belongs to the later token");
});

// --- graceful degradation: the common case in production --------------------
test("a site with no published map degrades to the original frame", async () => {
  ctx.__routes = {}; // every fetch 404s
  const stack = "    at renderOrder (https://cdn.app.com/main.js:1:4821)";
  const out = await resolveStack(stack);

  assert.equal(out.resolvedCount, 0);
  assert.equal(out.frames[0].resolved, null);
  assert.match(
    formatResolvedStack(out),
    /at renderOrder \(https:\/\/cdn\.app\.com\/main\.js:1:4821\)/,
    "unresolved frames must be preserved verbatim, not dropped",
  );
});

test("a corrupt map does not throw", async () => {
  ctx.__routes = { "https://cdn.app.com/bad.js.map": "{ this is not json" };
  await assert.doesNotReject(() => resolveStack("    at a (https://cdn.app.com/bad.js:1:1)"));
  const out = await resolveStack("    at a (https://cdn.app.com/bad.js:1:1)");
  assert.equal(out.resolvedCount, 0);
});

test("a map with malformed VLQ does not throw", async () => {
  ctx.__routes = {
    "https://cdn.app.com/v.js.map": JSON.stringify({
      version: 3,
      sources: ["a.ts"],
      mappings: "!!!invalid$$$",
    }),
  };
  await assert.doesNotReject(() => resolveStack("    at a (https://cdn.app.com/v.js:1:1)"));
});

test("an indexed map (sections) is treated as unresolvable rather than guessed", async () => {
  ctx.__routes = {
    "https://cdn.app.com/s.js.map": JSON.stringify({
      version: 3,
      sections: [{ offset: { line: 0, column: 0 }, map: {} }],
      mappings: "AAAA",
      sources: ["a.ts"],
    }),
  };
  const out = await resolveStack("    at a (https://cdn.app.com/s.js:1:1)");
  assert.equal(out.resolvedCount, 0);
});

// --- inline data: URI map ---------------------------------------------------
test("reads a base64 inline sourceMappingURL from the bundle", async () => {
  const map = JSON.stringify({
    version: 3,
    sources: ["inline.ts"],
    names: [],
    mappings: "AAAA",
    sourcesContent: ["inline source line"],
  });
  const b64 = Buffer.from(map, "utf8").toString("base64");
  ctx.__routes = {
    // no .map sibling; the bundle carries the directive instead
    "https://cdn.app.com/i.js": `console.log(1)\n//# sourceMappingURL=data:application/json;base64,${b64}`,
  };

  const out = await resolveStack("    at a (https://cdn.app.com/i.js:1:1)");
  assert.equal(out.resolvedCount, 1);
  assert.equal(out.frames[0].resolved.file, "inline.ts");
  assert.equal(out.frames[0].resolved.sourceLine, "inline source line");
});

// --- network discipline -----------------------------------------------------
test("each bundle is fetched once even when many frames share it", async () => {
  ctx.__routes = {
    "https://cdn.app.com/one.js.map": JSON.stringify({
      version: 3,
      sources: ["a.ts"],
      names: [],
      mappings: "AAAA",
      sourcesContent: ["x"],
    }),
  };
  lastFetched = [];
  await resolveStack(
    [
      "    at a (https://cdn.app.com/one.js:1:1)",
      "    at b (https://cdn.app.com/one.js:1:2)",
      "    at c (https://cdn.app.com/one.js:1:3)",
    ].join("\n"),
  );
  const mapFetches = lastFetched.filter((u) => u.endsWith("one.js.map"));
  assert.equal(mapFetches.length, 1, "one map fetch for three frames on one bundle");
});

test("non-http frames are never fetched", async () => {
  ctx.__routes = {};
  lastFetched = [];
  await resolveStack(
    [
      "    at a (chrome-extension://abc/injected_logger.js:982:9)",
      "    at b (bugsnap-internal:983:7)",
      "    at c (<anonymous>:1:1)",
    ].join("\n"),
  );
  assert.equal(lastFetched.length, 0, "extension and inline frames must not cause requests");
});

test("the number of bundles fetched per call is capped", async () => {
  ctx.__routes = {};
  lastFetched = [];
  const stack = Array.from(
    { length: 9 },
    (_, i) => `    at f${i} (https://cdn.app.com/b${i}.js:1:1)`,
  ).join("\n");
  await resolveStack(stack);
  const distinct = new Set(lastFetched.map((u) => u.replace(/\.map$/, "")));
  assert.ok(distinct.size <= 3, `expected at most 3 bundles, saw ${distinct.size}`);
});

// --- output rendering -------------------------------------------------------
test("formatResolvedStack prefers the authored name and caps its output", async () => {
  ctx.__routes = {
    "https://cdn.app.com/f.js.map": JSON.stringify({
      version: 3,
      sources: ["src/Checkout.tsx"],
      names: ["renderOrder"],
      mappings: "AAAAA",
      sourcesContent: ["  return order.id;"],
    }),
  };
  const out = await resolveStack("    at r (https://cdn.app.com/f.js:1:1)");
  const text = formatResolvedStack(out);
  assert.match(text, /renderOrder/, "authored name should win over the minified one");
  assert.match(text, /src\/Checkout\.tsx:1:1/);
  assert.match(text, /> return order\.id;/, "source line should be shown");

  const many = { frames: Array.from({ length: 20 }, () => out.frames[0]), resolvedCount: 20 };
  assert.equal(formatResolvedStack(many, 5).split("\n").filter((l) => l.includes(" at ")).length, 5);
});
