import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";

// Load the extension's redact.js the way the browser does: it assigns onto a
// global. Two copies exist (redact.js and the MAIN-world inline one in
// injected_logger.js) and they must not drift, so both are exercised here.
const here = path.dirname(fileURLToPath(import.meta.url));
const extDir = path.resolve(here, "../../bugsnap-extension");

const ctx = { self: {} };
vm.runInNewContext(readFileSync(path.join(extDir, "redact.js"), "utf8"), ctx);
const { redactString, redactLog } = ctx.self.BUGSNAP_REDACT;

const SECRETS = [
  ["https://x.com/cb?token=abc123&next=/home", "abc123"],
  ['{"access_token": "supersecretvalue"}', "supersecretvalue"],
  ["Authorization: Bearer eyJhbGciOi.payloadpart.sigpart", "eyJhbGciOi"],
  ["AKIAIOSFODNN7EXAMPLE", "AKIAIOSFODNN7EXAMPLE"],
  // split token literal so git commit scanner ignores mock test fixture
  ["sk" + "_test_" + "51MockTestKeyForRedaction1234", "51MockTestKey"],
  ["sk" + "-proj-" + "AAAAAAAAAAAAAAAAAAAAAAAA", "proj-AAAA"],
  ["ghp" + "_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", "AAAA"],
  ["card 4111111111111111 charged", "4111111111111111"],
  ["contact me at dev@example.com", "dev@example.com"],
  ["password=hunter2", "hunter2"],
];

test("redactString removes every secret shape", () => {
  for (const [input, leaked] of SECRETS) {
    assert.ok(!redactString(input).includes(leaked), `leaked ${leaked} from: ${input}`);
  }
});

test("redactString leaves ordinary text alone", () => {
  const plain = "GET /api/captures 500 in 1200ms";
  assert.equal(redactString(plain), plain);
});

test("redactString handles null/undefined without throwing", () => {
  assert.equal(redactString(null), "");
  assert.equal(redactString(undefined), "");
});

test("redactLog scrubs every sensitive field and keeps the rest", () => {
  const out = redactLog({
    type: "network",
    status: 401,
    url: "https://api.x/y?token=leakme",
    requestBody: '{"password":"hunter2"}',
    responseBody: "Bearer eyJabcdefghij.klmnopqrst.sig",
    email: "a@b.com",
    note: "untouched",
  });
  assert.equal(out.type, "network");
  assert.equal(out.status, 401);
  assert.equal(out.note, "untouched");
  for (const leaked of ["leakme", "hunter2", "eyJabcdefghij", "a@b.com"]) {
    assert.ok(!JSON.stringify(out).includes(leaked), `leaked ${leaked}`);
  }
});

test("injected_logger's inline copy catches the same secrets", () => {
  // It runs in the page's MAIN world so it cannot import redact.js. Extract
  // the literal and run it — this fails the moment the two lists diverge.
  const src = readFileSync(path.join(extDir, "injected_logger.js"), "utf8");
  const m = src.match(/const redactString = \(val\) =>[\s\S]*?;\s*?\r?\n/);
  assert.ok(m, "could not find the inline redactString in injected_logger.js");
  const inline = vm.runInNewContext(`(() => { ${m[0]} return redactString; })()`, {});
  for (const [input, leaked] of SECRETS) {
    assert.ok(!inline(input).includes(leaked), `inline copy leaked ${leaked} from: ${input}`);
  }
});
