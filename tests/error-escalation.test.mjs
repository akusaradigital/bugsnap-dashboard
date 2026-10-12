import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const here = path.dirname(fileURLToPath(import.meta.url));

const src = readFileSync(path.resolve(here, "../src/lib/error-escalation.ts"), "utf8");
const transpiled = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;

const ctx = { exports: {} };
vm.runInNewContext(transpiled, ctx);
const { shouldEscalate, buildEscalationPayload } = ctx.exports;

test("never-escalated + count >= threshold returns true", () => {
  assert.equal(shouldEscalate(5, 5, null), true);
  assert.equal(shouldEscalate(10, 5, null), true);
});

test("already escalated at count 5, now still 5 returns false (no re-fire without getting worse)", () => {
  assert.equal(shouldEscalate(5, 5, 5), false);
});

test("already escalated at 5, now 8 returns true (got worse, re-fire)", () => {
  assert.equal(shouldEscalate(8, 5, 5), true);
});

test("count below threshold returns false regardless of history", () => {
  assert.equal(shouldEscalate(3, 5, null), false);
  assert.equal(shouldEscalate(4, 5, 2), false);
  assert.equal(shouldEscalate(0, 5, null), false);
});

test("payload builder constructs valid Slack and Discord shapes with proper interpolations", () => {
  const payload = buildEscalationPayload({
    title: "TypeError: cannot read null",
    siteUrl: "https://example.com/checkout",
    occurrences: 12,
    affectedUsers: 4,
    captureUrl: "https://bugsnap.akusaraproject.my.id/v/cap-123",
    fingerprint: "checkout:TypeError:cannot_read_null",
  });

  assert.ok(payload.content.includes("12×"));
  assert.ok(payload.content.includes("4 people"));
  assert.ok(payload.content.includes("**TypeError: cannot read null**"));
  assert.ok(payload.content.includes("https://bugsnap.akusaraproject.my.id/v/cap-123"));

  assert.ok(payload.text.includes("12×"));
  assert.ok(payload.text.includes("4 people"));
  assert.ok(payload.text.includes("TypeError: cannot read null"));
  assert.ok(payload.text.includes("https://bugsnap.akusaraproject.my.id/v/cap-123"));

  assert.equal(Array.isArray(payload.embeds), true);
  assert.equal(payload.embeds.length, 1);
  const embed = payload.embeds[0];
  assert.equal(embed.url, "https://bugsnap.akusaraproject.my.id/v/cap-123");
  assert.equal(embed.color, 0xef4444);

  const fieldsMap = Object.fromEntries(embed.fields.map((f) => [f.name, f.value]));
  assert.equal(fieldsMap["Occurrences"], "12");
  assert.equal(fieldsMap["Reported by"], "4 people");
  assert.equal(fieldsMap["Site"], "https://example.com/checkout");
  assert.equal(fieldsMap["Fingerprint"], "checkout:TypeError:cannot_read_null");
});

test("payload builder handles singular user formatting and missing siteUrl gracefully", () => {
  const payload = buildEscalationPayload({
    title: null,
    occurrences: 5,
    affectedUsers: 1,
    captureUrl: "https://bugsnap.akusaraproject.my.id/v/cap-single",
    fingerprint: "fp-single",
  });

  assert.ok(payload.content.includes("1 person"));
  assert.ok(payload.content.includes("Untitled Capture"));
  const embed = payload.embeds[0];
  const siteField = embed.fields.find((f) => f.name === "Site");
  assert.equal(siteField, undefined);
});
