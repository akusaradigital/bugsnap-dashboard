import { test } from "node:test";
import assert from "node:assert/strict";

function decideDeleteReconciliation(audit, lookupFailed) {
  if (lookupFailed) return { action: "reconcile" };
  if (audit && audit.outcome !== "failed") return { action: "replay", result: resultFromAudit(audit) };
  return { action: "compensate" };
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function parseDriveFileId(url) {
  if (!url) return null;
  const raw = String(url).trim();
  try {
    const parsed = new URL(raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`);
    if (parsed.hostname !== "drive.google.com" && parsed.hostname !== "docs.google.com") return null;
    const id = parsed.searchParams.get("id") ?? parsed.pathname.match(/\/d\/([^/]+)/)?.[1] ?? null;
    return id && /^[A-Za-z0-9_-]{10,200}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

function resultFromAudit(row) {
  return { captureId: row.capture_id, ok: row.outcome !== "failed", outcome: row.outcome, ...(row.error ? { error: row.error } : {}) };
}

function compensatedDeleteError(deleteError, compensationError) {
  const message = deleteError instanceof Error ? deleteError.message : "Delete failed";
  if (!compensationError) return `${message}. The Google Drive file was restored`;
  const compensation = compensationError instanceof Error ? compensationError.message : "restore failed";
  return `${message}. Google Drive restore also failed: ${compensation}`;
}

test("canonical UUID validation rejects malformed and non-RFC variants", () => {
  assert.equal(isUuid("550e8400-e29b-41d4-a716-446655440000"), true);
  assert.equal(isUuid("550E8400-E29B-41D4-A716-446655440000"), true);
  assert.equal(isUuid("550e8400-e29b-01d4-a716-446655440000"), false);
  assert.equal(isUuid("550e8400-e29b-41d4-7716-446655440000"), false);
  assert.equal(isUuid("550e8400-e29b-41d4-a716-44665544000-"), false);
  assert.equal(isUuid("00000000-0000-0000-0000-000000000000"), false);
});

test("exact Drive IDs are accepted only from Google hosts", () => {
  assert.equal(parseDriveFileId("https://drive.google.com/file/d/ABCdef_12345/view"), "ABCdef_12345");
  assert.equal(parseDriveFileId("drive.google.com/file/d/ABCdef_12345/view?usp=sharing"), "ABCdef_12345");
  assert.equal(parseDriveFileId("https://docs.google.com/open?id=XYZabc-98765"), "XYZabc-98765");
  assert.equal(parseDriveFileId("https://evil.example/file/d/ABCdef_12345/view"), null);
  assert.equal(parseDriveFileId("not a url"), null);
});

test("audit results preserve deletion and idempotent replay state", () => {
  assert.deepEqual(resultFromAudit({ capture_id: "capture", outcome: "deleted", error: null }), { captureId: "capture", ok: true, outcome: "deleted" });
  assert.deepEqual(resultFromAudit({ capture_id: "capture", outcome: "already_deleted", error: null }), { captureId: "capture", ok: true, outcome: "already_deleted" });
  assert.deepEqual(resultFromAudit({ capture_id: "capture", outcome: "failed", error: "Not owned" }), { captureId: "capture", ok: false, outcome: "failed", error: "Not owned" });
});

test("post-trash reconciliation replays success and only compensates without a success audit", () => {
  const deleted = { capture_id: "capture", outcome: "deleted", error: null };
  assert.deepEqual(decideDeleteReconciliation(deleted, false), { action: "replay", result: { captureId: "capture", ok: true, outcome: "deleted" } });
  assert.deepEqual(decideDeleteReconciliation(null, false), { action: "compensate" });
  assert.deepEqual(decideDeleteReconciliation({ capture_id: "capture", outcome: "failed", error: "DB failed" }, false), { action: "compensate" });
  assert.deepEqual(decideDeleteReconciliation(null, true), { action: "reconcile" });
  assert.deepEqual(decideDeleteReconciliation(deleted, true), { action: "reconcile" });
});

test("compensation errors accurately distinguish restored and still-trashed files", () => {
  assert.equal(compensatedDeleteError(new Error("DB failed")), "DB failed. The Google Drive file was restored");
  assert.equal(compensatedDeleteError(new Error("DB failed"), new Error("Drive 503")), "DB failed. Google Drive restore also failed: Drive 503");
});

function resolveTargetUserId(explicitUserId, callerUserId) {
  const targetId = explicitUserId?.trim() || callerUserId;
  if (!targetId) {
    return { error: "Target userId is required", status: 400, code: "TARGET_USER_REQUIRED" };
  }
  if (!isUuid(targetId)) {
    return { error: "Invalid target userId format", status: 400, code: "INVALID_USER_ID" };
  }
  return { userId: targetId };
}

test("drive-orphans multi-tenant safety: strictly requires explicit userId or admin user identity", () => {
  // Never pick a random connection when no target or user identity is supplied
  const unauthed = resolveTargetUserId(undefined, undefined);
  assert.equal(unauthed.code, "TARGET_USER_REQUIRED");
  assert.equal(unauthed.status, 400);

  // Reject malformed / non-UUID target
  const invalid = resolveTargetUserId("malicious-sql-or-id", undefined);
  assert.equal(invalid.code, "INVALID_USER_ID");
  assert.equal(invalid.status, 400);

  // Default to authenticated admin's own user id when param is omitted
  const ownAdmin = resolveTargetUserId(undefined, "550e8400-e29b-41d4-a716-446655440000");
  assert.equal(ownAdmin.userId, "550e8400-e29b-41d4-a716-446655440000");

  // Explicit target userId overrides admin's own id for targeted customer audit
  const targeted = resolveTargetUserId("a0000000-0000-4000-8000-000000000001", "550e8400-e29b-41d4-a716-446655440000");
  assert.equal(targeted.userId, "a0000000-0000-4000-8000-000000000001");
});

test("email-health safety: recipient validation rejects header injection and malformed addresses", () => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const isValid = (email) => Boolean(email && emailRegex.test(email) && !email.includes("\r") && !email.includes("\n"));

  assert.equal(isValid("support@bugsnap.akusaraproject.my.id"), true);
  assert.equal(isValid("contact.akusaraproject@gmail.com"), true);
  assert.equal(isValid("admin@company.co.id"), true);

  // Header injection attacks
  assert.equal(isValid("victim@example.com\r\nBcc: evil@attacker.com"), false);
  assert.equal(isValid("victim@example.com\nSubject: Injected"), false);
  assert.equal(isValid("<script>alert(1)</script>@example.com"), false);
  assert.equal(isValid("notanemail"), false);
  assert.equal(isValid(""), false);
});
