import test from "node:test";
import assert from "node:assert/strict";

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "10minutemail.com",
  "10minutemail.net",
  "guerrillamail.com",
  "tempmail.com",
  "temp-mail.org",
  "throwawaymail.com",
  "yopmail.com",
  "trashmail.com",
  "sharklasers.com",
  "dispostable.com",
  "fakeinbox.com",
  "burnermail.io",
]);

function isDisposableEmail(email) {
  if (!email || typeof email !== "string") return false;
  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2) return false;
  const domain = parts[1];
  return DISPOSABLE_DOMAINS.has(domain);
}

test("detects known disposable domains", () => {
  assert.equal(isDisposableEmail("test@mailinator.com"), true);
  assert.equal(isDisposableEmail("user@temp-mail.org"), true);
  assert.equal(isDisposableEmail("spammer@10minutemail.com"), true);
  assert.equal(isDisposableEmail("burner@yopmail.com"), true);
  assert.equal(isDisposableEmail("throwaway@sharklasers.com"), true);
});

test("passes legitimate emails", () => {
  assert.equal(isDisposableEmail("user@gmail.com"), false);
  assert.equal(isDisposableEmail("ceo@company.co.id"), false);
  assert.equal(isDisposableEmail("admin@vanapp.co.id"), false);
  assert.equal(isDisposableEmail("dev@hotmail.com"), false);
  assert.equal(isDisposableEmail("work@outlook.com"), false);
});

test("handles malformed inputs safely without throwing", () => {
  assert.equal(isDisposableEmail(""), false);
  assert.equal(isDisposableEmail(null), false);
  assert.equal(isDisposableEmail(undefined), false);
  assert.equal(isDisposableEmail("notanemail"), false);
  assert.equal(isDisposableEmail("multiple@@at.com"), false);
});
