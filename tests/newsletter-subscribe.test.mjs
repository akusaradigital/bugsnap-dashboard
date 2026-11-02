import test from "node:test";
import assert from "node:assert/strict";

function validateSubscriptionEmail(email) {
  if (!email || typeof email !== "string") {
    return { valid: false, error: "REQUIRED" };
  }
  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: "INVALID_FORMAT" };
  }
  return { valid: true, email: trimmed };
}

test("newsletter subscription: valid email passes", () => {
  const result = validateSubscriptionEmail("developer@example.com");
  assert.equal(result.valid, true);
  assert.equal(result.email, "developer@example.com");
});

test("newsletter subscription: invalid format rejected", () => {
  assert.equal(validateSubscriptionEmail("invalid-email").valid, false);
  assert.equal(validateSubscriptionEmail("user@").valid, false);
  assert.equal(validateSubscriptionEmail("@domain.com").valid, false);
  assert.equal(validateSubscriptionEmail("").valid, false);
  assert.equal(validateSubscriptionEmail(null).valid, false);
});

test("newsletter subscription: normalizes email to lowercase and trims whitespace", () => {
  const result = validateSubscriptionEmail("  User.Dev@Example.COM  ");
  assert.equal(result.valid, true);
  assert.equal(result.email, "user.dev@example.com");
});
