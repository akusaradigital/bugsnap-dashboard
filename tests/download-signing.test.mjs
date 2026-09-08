/**
 * Guards the download signature in src/lib/download-signing.ts, which is what
 * gates members-only capture streaming for <img>/<video>. Mirrored here (the
 * lib is "server-only" and cannot be imported from a plain node test), so keep
 * the two copies in step.
 *
 * Run:  node --test tests/download-signing.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

const SECRET = "test-secret";

function hmac(fileId, exp) {
  return crypto.createHmac("sha256", SECRET).update(`${fileId}|${exp}`).digest("base64url");
}

function signDownload(fileId, ttl = 3600) {
  const exp = Math.floor(Date.now() / 1000) + ttl;
  return { sig: hmac(fileId, exp), exp };
}

function verifyDownloadSig(fileId, sig, exp) {
  if (!SECRET || !sig || !exp) return false;
  const expNum = Number(exp);
  if (!Number.isFinite(expNum) || expNum < Date.now() / 1000) return false;
  const expected = Buffer.from(hmac(fileId, expNum), "utf-8");
  const given = Buffer.from(sig, "utf-8");
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

test("a fresh signature verifies", () => {
  const { sig, exp } = signDownload("file-abc123");
  assert.equal(verifyDownloadSig("file-abc123", sig, exp), true);
});

test("a signature does not transfer to another file id", () => {
  const { sig, exp } = signDownload("file-abc123");
  assert.equal(verifyDownloadSig("file-other99", sig, exp), false);
});

test("extending exp invalidates the signature", () => {
  const { sig, exp } = signDownload("file-abc123");
  assert.equal(verifyDownloadSig("file-abc123", sig, exp + 86400), false);
});

test("an expired signature is rejected", () => {
  const { sig, exp } = signDownload("file-abc123", -10);
  assert.equal(verifyDownloadSig("file-abc123", sig, exp), false);
});

test("missing or malformed inputs are rejected", () => {
  const { sig, exp } = signDownload("file-abc123");
  assert.equal(verifyDownloadSig("file-abc123", null, exp), false);
  assert.equal(verifyDownloadSig("file-abc123", sig, null), false);
  assert.equal(verifyDownloadSig("file-abc123", sig, "not-a-number"), false);
  assert.equal(verifyDownloadSig("file-abc123", "short", exp), false);
});
