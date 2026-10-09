import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const here = path.dirname(fileURLToPath(import.meta.url));

// Transpile and run the real module rather than restating its logic here, so a
// change to fingerprint.ts cannot pass a stale copy of itself.
const src = readFileSync(path.resolve(here, "../src/lib/fingerprint.ts"), "utf8");
const transpiled = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
// URL must be handed to the sandbox explicitly: a bare vm context has no web
// globals, so normalizeRoute would silently take its catch branch and every
// route assertion would pass against "" instead of a real value.
const ctx = { exports: {}, URL };
vm.runInNewContext(transpiled, ctx);
const { captureFingerprint, normalizeErrorMessage, topAppFrame, normalizeRoute } = ctx.exports;

const consoleErr = (message, stack = null) => [
  { type: "console", level: "error", message, stack },
];

// --- the point of the feature: same bug from different people groups ---------
test("same bug reported by two people yields one fingerprint", () => {
  const a = captureFingerprint({
    devLogs: consoleErr(
      "Cannot read properties of undefined (reading 'id')",
      "Error\n    at renderOrder (Checkout.tsx:142:19)\n    at commitWork (react-dom.production.min.js:1:4021)",
    ),
    siteUrl: "https://app.example.com/orders/8821",
  });
  const b = captureFingerprint({
    devLogs: consoleErr(
      "Cannot read properties of undefined (reading 'id')",
      "Error\n    at renderOrder (Checkout.tsx:142:31)\n    at commitWork (react-dom.production.min.js:1:4021)",
    ),
    // different record id, different query, different casing of host
    siteUrl: "https://App.Example.com/orders/9143?ref=email",
  });

  assert.ok(a, "fingerprint must be produced");
  assert.equal(a, b, "same error on the same route must group");
});

test("different errors do not collapse together", () => {
  const a = captureFingerprint({
    devLogs: consoleErr("Cannot read properties of undefined (reading 'id')", "at renderOrder (Checkout.tsx:142:19)"),
    siteUrl: "https://app.example.com/orders/1",
  });
  const b = captureFingerprint({
    devLogs: consoleErr("Network request failed", "at submit (Checkout.tsx:142:19)"),
    siteUrl: "https://app.example.com/orders/1",
  });
  assert.notEqual(a, b);
});

test("same error in a different file is a different bug", () => {
  const a = captureFingerprint({
    devLogs: consoleErr("undefined is not a function", "at run (Cart.tsx:10:1)"),
    siteUrl: "https://app.example.com/cart",
  });
  const b = captureFingerprint({
    devLogs: consoleErr("undefined is not a function", "at run (Profile.tsx:10:1)"),
    siteUrl: "https://app.example.com/cart",
  });
  assert.notEqual(a, b);
});

// --- null is a real answer, not a failure -----------------------------------
test("a capture with no error stays ungrouped", () => {
  assert.equal(captureFingerprint({ devLogs: [], siteUrl: "https://x.com/a" }), null);
  assert.equal(captureFingerprint({ devLogs: null, siteUrl: "https://x.com/a" }), null);
  assert.equal(
    captureFingerprint({
      devLogs: [{ type: "step", message: "Clicked Submit" }],
      siteUrl: "https://x.com/a",
    }),
    null,
    "user actions alone are not an error identity",
  );
});

test("an unidentifiable error stays ungrouped rather than hashing nothing", () => {
  // Message normalizes to empty and the stack has only vendor frames.
  const fp = captureFingerprint({
    devLogs: consoleErr("", "at commit (react-dom.production.min.js:1:1)"),
    siteUrl: "https://x.com/a",
  });
  assert.equal(fp, null);
});

// --- normalization ----------------------------------------------------------
test("normalizeErrorMessage strips volatile ids, times and numbers", () => {
  const a = normalizeErrorMessage("Failed to load order 8821 at 14:03:22");
  const b = normalizeErrorMessage("Failed to load order 9143 at 09:11:04");
  assert.equal(a, b);

  const u1 = normalizeErrorMessage("User 3f2504e0-4f89-11d3-9a0c-0305e82c3301 not found");
  const u2 = normalizeErrorMessage("User 11112222-3333-4444-5555-666677778888 not found");
  assert.equal(u1, u2);

  assert.equal(
    normalizeErrorMessage('Cannot find module "./a/b/c"'),
    normalizeErrorMessage('Cannot find module "./x/y/z"'),
    "quoted payloads are shape, not identity",
  );
});

test("normalizeErrorMessage keeps genuinely different messages apart", () => {
  assert.notEqual(
    normalizeErrorMessage("Payment declined"),
    normalizeErrorMessage("Payment timed out"),
  );
});

test("topAppFrame skips instrumentation and vendor frames", () => {
  const stack = [
    "Error: boom",
    "    at console.error (bugsnap-internal:983:7)",
    "    at log (chrome-extension://abc/injected_logger.js:982:9)",
    "    at commitWork (webpack-internal:///./node_modules/react-dom/index.js:1:2)",
    "    at renderOrder (Checkout.tsx:142:19)",
  ].join("\n");
  assert.equal(topAppFrame(stack), "checkout.tsx:142");
});

test("topAppFrame returns empty when no app frame exists", () => {
  assert.equal(topAppFrame("Error\n    at commit (react-dom.production.min.js:1:1)"), "");
  assert.equal(topAppFrame(null), "");
  assert.equal(topAppFrame(""), "");
});

test("normalizeRoute collapses record ids but keeps distinct routes apart", () => {
  assert.equal(
    normalizeRoute("https://app.example.com/orders/8821"),
    normalizeRoute("https://www.app.example.com/orders/9143?x=1#top"),
  );
  assert.notEqual(
    normalizeRoute("https://app.example.com/orders/1"),
    normalizeRoute("https://app.example.com/invoices/1"),
  );
  assert.equal(normalizeRoute(null), "");
  // A real route must not normalize to the empty string, or every unparsable
  // input would group with every other one.
  assert.notEqual(normalizeRoute("https://app.example.com/orders/1"), "");
});

test("normalizeRoute collapses opaque session slugs", () => {
  assert.equal(
    normalizeRoute("https://dev-fe.vanapp.co.id/vania/projection_p-6th6CbQ8nNf/image"),
    normalizeRoute("https://dev-fe.vanapp.co.id/vania/projection_p-9zz1AbQ7mXy/image"),
  );
});

// The generated-slug rule is the easiest thing here to make too aggressive:
// over-collapsing silently merges unrelated routes into one bug group, which is
// worse than failing to group. These pin the boundary in both directions.
test("the generated-slug rule does not swallow human-authored routes", () => {
  const distinct = [
    "https://a.co/orders/order-history",
    "https://a.co/orders/order-summary",
    "https://a.co/blog/how-to-report-a-bug",
    "https://a.co/api/v2/users",
    "https://a.co/files/abcdefghijklmnop", // long but no case mixing: not an id
  ];
  const routes = distinct.map(normalizeRoute);
  assert.equal(new Set(routes).size, distinct.length, "authored routes must stay distinct");
  for (const r of routes) assert.ok(!r.includes(":id"), `must not be treated as an id: ${r}`);
});

// --- network-only captures --------------------------------------------------
test("a failing request fingerprints by route and status", () => {
  const a = captureFingerprint({
    devLogs: [{ type: "network", method: "post", status: 500, url: "https://api.example.com/v1/orders/8821" }],
    siteUrl: "https://app.example.com/orders/8821",
  });
  const b = captureFingerprint({
    devLogs: [{ type: "network", method: "POST", status: 500, url: "https://api.example.com/v1/orders/9143" }],
    siteUrl: "https://app.example.com/orders/9143",
  });
  assert.ok(a);
  assert.equal(a, b);

  const notFound = captureFingerprint({
    devLogs: [{ type: "network", method: "POST", status: 404, url: "https://api.example.com/v1/orders/1" }],
    siteUrl: "https://app.example.com/orders/1",
  });
  assert.notEqual(a, notFound, "a 500 and a 404 on one endpoint are different bugs");
});

test("a console error outranks a failing request", () => {
  const withBoth = captureFingerprint({
    devLogs: [
      { type: "network", method: "GET", status: 500, url: "https://api.example.com/x" },
      { type: "console", level: "error", message: "Boom", stack: "at go (App.tsx:3:1)" },
    ],
    siteUrl: "https://app.example.com/a",
  });
  const consoleOnly = captureFingerprint({
    devLogs: consoleErr("Boom", "at go (App.tsx:3:1)"),
    siteUrl: "https://app.example.com/a",
  });
  assert.equal(withBoth, consoleOnly);
});

test("an extra unrelated warning does not change the fingerprint", () => {
  const base = captureFingerprint({
    devLogs: consoleErr("Boom", "at go (App.tsx:3:1)"),
    siteUrl: "https://app.example.com/a",
  });
  const noisier = captureFingerprint({
    devLogs: [
      { type: "console", level: "error", message: "Boom", stack: "at go (App.tsx:3:1)" },
      { type: "console", level: "warn", message: "Slow render 1823ms" },
      { type: "step", message: "Clicked Save" },
    ],
    siteUrl: "https://app.example.com/a",
  });
  assert.equal(base, noisier, "grouping must survive incidental extra logs");
});

// --- input shapes the column actually holds ---------------------------------
test("accepts dev_logs as a JSON string", () => {
  const logs = consoleErr("Boom", "at go (App.tsx:3:1)");
  assert.equal(
    captureFingerprint({ devLogs: JSON.stringify(logs), siteUrl: "https://a.com/x" }),
    captureFingerprint({ devLogs: logs, siteUrl: "https://a.com/x" }),
  );
});

test("accepts the compact v1 summary object", () => {
  const fp = captureFingerprint({
    devLogs: { version: 1, errors: 2, warnings: 0, failedRequests: 0, topErrors: ["Checkout crashed on step 2"] },
    siteUrl: "https://a.com/x",
  });
  assert.ok(fp, "summary-only captures must still group");
});

test("malformed input is handled without throwing", () => {
  for (const bad of ["{not json", 42, true, { nothing: "here" }, [null, 7, "x"]]) {
    assert.doesNotThrow(() => captureFingerprint({ devLogs: bad, siteUrl: null }));
  }
});

test("fingerprint is a stable 8-char hex token", () => {
  const fp = captureFingerprint({
    devLogs: consoleErr("Boom", "at go (App.tsx:3:1)"),
    siteUrl: "https://a.com/x",
  });
  assert.match(fp, /^[0-9a-f]{8}$/);
});
