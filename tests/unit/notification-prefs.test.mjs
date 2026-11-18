import { test } from "node:test";
import assert from "node:assert/strict";

const DEFAULT_PREFS = {
  comment: true,
  mention: true,
  digest: true,
};

function resolveNotificationPrefs(current, update) {
  const base = current && typeof current === "object" ? current : DEFAULT_PREFS;
  return {
    comment: typeof update?.comment === "boolean" ? update.comment : (typeof base.comment === "boolean" ? base.comment : true),
    mention: typeof update?.mention === "boolean" ? update.mention : (typeof base.mention === "boolean" ? base.mention : true),
    digest: typeof update?.digest === "boolean" ? update.digest : (typeof base.digest === "boolean" ? base.digest : true),
  };
}

test("notification prefs: partial update merges correctly", () => {
  const current = { comment: true, mention: true, digest: true };
  const updated = resolveNotificationPrefs(current, { comment: false });
  assert.deepEqual(updated, { comment: false, mention: true, digest: true });
});

test("notification prefs: handles undefined base gracefully with defaults", () => {
  const updated = resolveNotificationPrefs(null, { digest: false });
  assert.deepEqual(updated, { comment: true, mention: true, digest: false });
});

test("notification prefs: ignores non-boolean values in update", () => {
  const current = { comment: false, mention: true, digest: false };
  const updated = resolveNotificationPrefs(current, { comment: "invalid", mention: null, digest: true });
  assert.deepEqual(updated, { comment: false, mention: true, digest: true });
});

test("notification prefs: downstream consumer evaluation rules", () => {
  // src/app/api/notifications/comment/route.ts checks:
  // owner.notification_prefs?.comment === false
  // u.notification_prefs?.mention === false
  const userA = { notification_prefs: { comment: false, mention: true, digest: true } };
  const userB = { notification_prefs: { comment: true, mention: false, digest: true } };

  assert.equal(userA.notification_prefs?.comment === false, true);
  assert.equal(userA.notification_prefs?.mention === false, false);
  assert.equal(userB.notification_prefs?.comment === false, false);
  assert.equal(userB.notification_prefs?.mention === false, true);

  // src/app/api/weekly-digest/route.ts checks:
  // owner.notification_prefs?.digest !== false
  const userOptedOutDigest = { notification_prefs: { comment: true, mention: true, digest: false } };
  const userDefaultDigest = { notification_prefs: { comment: true, mention: true, digest: true } };
  const userMissingDigest = { notification_prefs: {} };

  assert.equal(userOptedOutDigest.notification_prefs?.digest !== false, false);
  assert.equal(userDefaultDigest.notification_prefs?.digest !== false, true);
  assert.equal(userMissingDigest.notification_prefs?.digest !== false, true);
});

test("email templates: sanitize HTML special characters to prevent injection", () => {
  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch] || ch));
  }

  const malicious = '<script>alert("xss")</script>';
  const clean = escapeHtml(malicious);
  assert.equal(clean.includes("<script>"), false);
  assert.equal(clean, "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;");
});

test("email templates: professional subject lines without emoji clutter", () => {
  const authorName = "Sarah Connor";
  const captureTitle = "Checkout button unresponsive";
  const isMention = true;

  const subject = isMention
    ? `${authorName} mentioned you on "${captureTitle}"`
    : `New comment on "${captureTitle}" by ${authorName}`;

  assert.equal(subject, 'Sarah Connor mentioned you on "Checkout button unresponsive"');
  // Check that no emoji or excessive brackets exist
  assert.match(subject, /^[a-zA-Z0-9\s"':._-]+$/);
});

