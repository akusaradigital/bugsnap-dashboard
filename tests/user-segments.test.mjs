import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const here = path.dirname(fileURLToPath(import.meta.url));

// -----------------------------------------------------------------------------
// user-segments.ts - shared "hot prospect" / "abandoned checkout" predicates
// (revenue/route.ts and data/route.ts both import these instead of
// re-filtering users by hand, after the two had already drifted).
// -----------------------------------------------------------------------------
const srcPath = path.resolve(here, "../src/lib/user-segments.ts");
const src = readFileSync(srcPath, "utf8");
const transpiled = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const ctx = { exports: {} };
vm.runInNewContext(transpiled, ctx);
const { isHotProspect, isAbandonedCheckout } = ctx.exports;

test("isHotProspect: free user who hit a paywall is a hot prospect", () => {
  assert.equal(isHotProspect({ plan: "free", paywall_hits: 3 }), true);
});

test("isHotProspect: paying user with paywall hits is not a prospect", () => {
  assert.equal(isHotProspect({ plan: "pro", paywall_hits: 5 }), false);
});

test("isHotProspect: free user with zero hits is not a prospect", () => {
  assert.equal(isHotProspect({ plan: "free", paywall_hits: 0 }), false);
  assert.equal(isHotProspect({ plan: "free" }), false);
});

test("isAbandonedCheckout: explicit abandoned status counts regardless of plan", () => {
  assert.equal(isAbandonedCheckout({ checkout_status: "abandoned", plan: "pro" }), true);
});

test("isAbandonedCheckout: initiated + free counts as abandoned", () => {
  assert.equal(isAbandonedCheckout({ checkout_status: "initiated", plan: "free" }), true);
});

test("isAbandonedCheckout: initiated + paying plan does not count", () => {
  assert.equal(isAbandonedCheckout({ checkout_status: "initiated", plan: "pro" }), false);
});

test("isAbandonedCheckout: completed checkout never counts", () => {
  assert.equal(isAbandonedCheckout({ checkout_status: "completed", plan: "free" }), false);
});
