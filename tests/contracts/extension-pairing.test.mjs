import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const src = readFileSync(path.join(root, "src/app/api/extension/pair/route.ts"), "utf8");

// Static guards: the pairing route must keep its security rules even when refactored.
test("pairing code is single-use: claim is an atomic update filtered on used_at IS NULL", () => {
  assert.match(src, /\.is\("used_at", null\)/, "claim must require used_at IS NULL");
  assert.match(src, /\.update\(\{ used_at:/, "claim must mark the code used in the same statement");
});

test("pairing code expires: claim rejects codes past expires_at", () => {
  assert.match(src, /\.gt\("expires_at", new Date\(\)\.toISOString\(\)\)/, "claim must check expires_at");
  assert.match(src, /CODE_TTL_MS = 5 \* 60 \* 1000/, "code lifetime is 5 minutes");
});

test("only a SHA-256 of the pairing code is stored, never the plaintext", () => {
  assert.match(src, /code_hash: sha256\(code\)/, "store hash, not the code");
  assert.doesNotMatch(src, /insert\(\{[^}]*code: code/, "plaintext code must not be inserted");
});

test("issuing a code requires a signed-in web session", () => {
  assert.match(src, /getAuthenticatedUser\(req\)/, "POST must authenticate the caller");
  assert.match(src, /status: 401/, "unauthenticated POST must return 401");
});

test("the device secret is stored hashed, not in plaintext", () => {
  assert.match(src, /extension_secret_hash: sha256\(deviceSecret\)/, "store secret hash only");
});

test("account switching: clears any existing connection for the device_id before pairing", () => {
  assert.match(src, /\.from\("extension_device_connections"\)\s*\.delete\(\)\s*\.eq\("device_id", deviceId\)/, "must clear existing connection for device_id");
});
