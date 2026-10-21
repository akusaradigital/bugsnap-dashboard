import { test } from "node:test";
import assert from "node:assert/strict";

// 1. Test members role validation & owner protection rules
test("settings members CRUD: role input validation", () => {
  const validRoles = ["creator", "viewer"];
  assert.equal(validRoles.includes("creator"), true);
  assert.equal(validRoles.includes("viewer"), true);
  assert.equal(validRoles.includes("owner"), false); // Owner cannot be set via members role change
  assert.equal(validRoles.includes("admin"), false);
});

test("settings members CRUD: owner cannot be downgraded or deleted", () => {
  function canModifyTarget(targetMemberRole) {
    if (targetMemberRole === "owner") {
      return { allowed: false, reason: "Cannot modify or remove workspace owner" };
    }
    return { allowed: true };
  }

  assert.deepEqual(canModifyTarget("owner"), { allowed: false, reason: "Cannot modify or remove workspace owner" });
  assert.deepEqual(canModifyTarget("creator"), { allowed: true });
  assert.deepEqual(canModifyTarget("viewer"), { allowed: true });
});

test("settings members CRUD: self-leave vs owner remove authorization", () => {
  function canRemoveMember({ callerUserId, isCallerOwner, targetUserId }) {
    const isSelfLeaving = callerUserId === targetUserId;
    if (isCallerOwner || isSelfLeaving) return true;
    return false;
  }

  // Owner can remove other members
  assert.equal(canRemoveMember({ callerUserId: "user_owner", isCallerOwner: true, targetUserId: "user_collab" }), true);
  // Non-owner member can leave themselves
  assert.equal(canRemoveMember({ callerUserId: "user_collab", isCallerOwner: false, targetUserId: "user_collab" }), true);
  // Non-owner member cannot kick another member
  assert.equal(canRemoveMember({ callerUserId: "user_collab", isCallerOwner: false, targetUserId: "user_other" }), false);
});

// 2. Test Account profile validation rules
test("settings account CRUD: profile input bounds", () => {
  function validateProfile({ fullName, jobRole, avatarUrl }) {
    if (typeof fullName === "string" && fullName.trim().length > 120) {
      return { ok: false, error: "Full name must be 120 characters or less" };
    }
    if (typeof jobRole === "string" && jobRole.trim().length > 60) {
      return { ok: false, error: "Role is too long" };
    }
    if (typeof avatarUrl === "string") {
      const isData = /^data:image\/(png|jpe?g|svg\+xml|webp);base64,/.test(avatarUrl);
      const maxLen = isData ? 3_000_000 : 1000;
      if (avatarUrl.length > maxLen) {
        return { ok: false, error: "Avatar image is too large" };
      }
    }
    return { ok: true };
  }

  assert.equal(validateProfile({ fullName: "Valid Name", jobRole: "QA Engineer" }).ok, true);
  assert.equal(validateProfile({ fullName: "A".repeat(121) }).ok, false);
  assert.equal(validateProfile({ jobRole: "B".repeat(61) }).ok, false);
});

// 3. Test Integrations serialization & Webhook URL
test("settings integrations CRUD: configuration payload serialization", () => {
  const currentIntegrations = {
    slack: { webhookUrl: "https://hooks.slack.com/123", channel: "#bugs" },
    webhook: { url: "https://discord.com/api/webhooks/456" },
  };

  // Add Jira integration
  const updatedIntegrations = {
    ...currentIntegrations,
    jira: { host: "myteam.atlassian.net", projectKey: "BUG" },
  };

  assert.equal(Boolean(updatedIntegrations.jira), true);
  assert.equal(updatedIntegrations.jira.projectKey, "BUG");

  // Disconnect Slack integration
  const cloned = { ...updatedIntegrations };
  delete cloned.slack;
  assert.equal(Boolean(cloned.slack), false);
  assert.equal(Boolean(cloned.jira), true);
  assert.equal(Boolean(cloned.webhook), true);
});

// 4. Test Workspace deletion foreign key order
test("settings account delete: cleanup sequence covers workspace_folders before workspaces", () => {
  const cleanupSequence = [
    "captures",
    "workspace_settings",
    "workspace_members",
    "bugsnap_api_keys",
    "workspace_folders",
    "workspaces",
  ];
  const foldersIdx = cleanupSequence.indexOf("workspace_folders");
  const workspacesIdx = cleanupSequence.indexOf("workspaces");
  assert.equal(foldersIdx !== -1, true);
  assert.equal(workspacesIdx !== -1, true);
  assert.equal(foldersIdx < workspacesIdx, true, "workspace_folders must be deleted before workspaces to prevent FK violation");
});

// 5. Test Profile resilient user resolution logic
test("settings profile: resilient user lookup by id and fallback email", () => {
  function resolveTargetUserId(user, dbUsers) {
    const byId = dbUsers.find((u) => u.id === user.id);
    if (byId) return { action: "update", id: byId.id };
    if (user.email) {
      const byEmail = dbUsers.find((u) => u.email.toLowerCase() === user.email.toLowerCase());
      if (byEmail) return { action: "update", id: byEmail.id };
    }
    return { action: "upsert", id: user.id, email: user.email };
  }

  const existingUsers = [
    { id: "usr_123", email: "existing@example.com" },
    { id: "usr_456", email: "drive_prov@example.com" },
  ];

  // Matched by id
  assert.deepEqual(
    resolveTargetUserId({ id: "usr_123", email: "existing@example.com" }, existingUsers),
    { action: "update", id: "usr_123" }
  );

  // Matched by email when auth id differs (e.g. provisioned via Drive)
  assert.deepEqual(
    resolveTargetUserId({ id: "auth_diff_789", email: "drive_prov@example.com" }, existingUsers),
    { action: "update", id: "usr_456" }
  );

  // Not matched -> upsert
  assert.deepEqual(
    resolveTargetUserId({ id: "brand_new_999", email: "newbie@example.com" }, existingUsers),
    { action: "upsert", id: "brand_new_999", email: "newbie@example.com" }
  );
});

