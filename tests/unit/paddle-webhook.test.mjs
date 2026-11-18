/**
 * Tests Paddle Billing (v2) signature verification logic used in
 * src/app/api/paddle-webhook/route.ts.
 *
 * Run: node --test tests/paddle-webhook.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

function verifyPaddleSignature(payload, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false;

  const parts = {};
  for (const part of signatureHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx > 0) {
      parts[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
    }
  }

  const ts = parts.ts;
  const h1 = parts.h1;
  if (!ts || !h1 || !/^\d+$/.test(ts)) return false;

  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;

  const expectedHex = crypto.createHmac("sha256", secret).update(`${ts}:${payload}`).digest("hex");
  const expected = Buffer.from(expectedHex);
  const actual = Buffer.from(h1);

  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

const SECRET = "pdl_ntfset_01h8q0_test_webhook_secret";

test("a valid Paddle signature passes verification", () => {
  const payload = JSON.stringify({ event_type: "transaction.completed" });
  const ts = Math.floor(Date.now() / 1000);
  const h1 = crypto.createHmac("sha256", SECRET).update(`${ts}:${payload}`).digest("hex");
  const header = `ts=${ts};h1=${h1}`;

  assert.equal(verifyPaddleSignature(payload, header, SECRET), true);
});

test("tampered payload fails verification", () => {
  const payload = JSON.stringify({ event_type: "transaction.completed" });
  const ts = Math.floor(Date.now() / 1000);
  const h1 = crypto.createHmac("sha256", SECRET).update(`${ts}:${payload}`).digest("hex");
  const header = `ts=${ts};h1=${h1}`;

  assert.equal(verifyPaddleSignature(payload + "tampered", header, SECRET), false);
});

test("signature older than 300s (replay attack) fails verification", () => {
  const payload = JSON.stringify({ event_type: "transaction.completed" });
  const expiredTs = Math.floor(Date.now() / 1000) - 350;
  const h1 = crypto.createHmac("sha256", SECRET).update(`${expiredTs}:${payload}`).digest("hex");
  const header = `ts=${expiredTs};h1=${h1}`;

  assert.equal(verifyPaddleSignature(payload, header, SECRET), false);
});

test("signature with invalid secret fails verification", () => {
  const payload = JSON.stringify({ event_type: "transaction.completed" });
  const ts = Math.floor(Date.now() / 1000);
  const h1 = crypto.createHmac("sha256", SECRET).update(`${ts}:${payload}`).digest("hex");
  const header = `ts=${ts};h1=${h1}`;

  assert.equal(verifyPaddleSignature(payload, header, "wrong_secret"), false);
});

test("malformed signature header fails verification", () => {
  const payload = JSON.stringify({ event_type: "transaction.completed" });
  assert.equal(verifyPaddleSignature(payload, "invalid_header", SECRET), false);
  assert.equal(verifyPaddleSignature(payload, "", SECRET), false);
  assert.equal(verifyPaddleSignature(payload, null, SECRET), false);
});
