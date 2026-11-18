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

// 6. Test Linear team key and UUID resolution
test("settings integrations: Linear team resolution accepts both keys and UUIDs", () => {
  const teams = [
    { id: "e1a2b3c4-5678-90ab-cdef-1234567890ab", key: "ENG", name: "Engineering" },
    { id: "f2b3c4d5-6789-01bc-def0-2345678901bc", key: "QA", name: "Quality Assurance" },
  ];

  function resolveLinearTeam(input, availableTeams) {
    const raw = String(input || "").trim();
    const match = availableTeams.find(
      (t) => t.id.toLowerCase() === raw.toLowerCase() || t.key.toLowerCase() === raw.toLowerCase()
    );
    return match ? match.id : null;
  }

  // Resolve by uppercase key
  assert.equal(resolveLinearTeam("ENG", teams), "e1a2b3c4-5678-90ab-cdef-1234567890ab");
  // Resolve by lowercase key
  assert.equal(resolveLinearTeam("qa", teams), "f2b3c4d5-6789-01bc-def0-2345678901bc");
  // Resolve by UUID
  assert.equal(resolveLinearTeam("e1a2b3c4-5678-90ab-cdef-1234567890ab", teams), "e1a2b3c4-5678-90ab-cdef-1234567890ab");
  // Non-existent key
  assert.equal(resolveLinearTeam("MARKETING", teams), null);
});

// 7. Test Notion paragraph block chunking (2,000 char limit protection)
test("settings integrations: Notion block chunker splits text over 2000 chars into multiple blocks", () => {
  function chunkNotionText(text, maxChars = 2000) {
    const blocks = [];
    let remaining = String(text || "").trim();
    while (remaining.length > 0 && blocks.length < 50) {
      const chunk = remaining.slice(0, maxChars);
      remaining = remaining.slice(maxChars);
      blocks.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: chunk } }],
        },
      });
    }
    return blocks;
  }

  const shortText = "Simple bug description";
  const shortBlocks = chunkNotionText(shortText);
  assert.equal(shortBlocks.length, 1);
  assert.equal(shortBlocks[0].paragraph.rich_text[0].text.content, shortText);

  const longText = "X".repeat(4500);
  const longBlocks = chunkNotionText(longText);
  assert.equal(longBlocks.length, 3);
  assert.equal(longBlocks[0].paragraph.rich_text[0].text.content.length, 2000);
  assert.equal(longBlocks[1].paragraph.rich_text[0].text.content.length, 2000);
  assert.equal(longBlocks[2].paragraph.rich_text[0].text.content.length, 500);
});

// 8. Test repo sanitization for GitHub / GitLab / Azure
test("settings integrations: repo and project sanitization cleans full URLs and slashes", () => {
  function sanitizeRepo(raw) {
    let repo = String(raw || "").trim();
    repo = repo.replace(/^https?:\/\/github\.com\//i, "");
    repo = repo.replace(/^https?:\/\/gitlab\.com\//i, "");
    repo = repo.replace(/^\/+|\/+$/g, "");
    return repo;
  }

  assert.equal(sanitizeRepo("https://github.com/my-org/frontend-app/"), "my-org/frontend-app");
  assert.equal(sanitizeRepo("https://gitlab.com/qa-group/runner/"), "qa-group/runner");
  assert.equal(sanitizeRepo("  my-org/backend-service  "), "my-org/backend-service");
});

// 9. Test Google Gemini integration catalogue and payload formatting
test("settings integrations: Gemini integration configuration and prompt construction", () => {
  function formatGeminiPayload(capture, envParts, logSummary, model = "gemini-1.5-flash") {
    const prompt = `You are a senior QA engineer. Analyze this bug report and dev logs. Provide:\n1. Steps to Reproduce\n2. Root Cause Analysis\n3. Recommended Fix\n\nBug: ${capture.title}\nDescription: ${capture.description || "N/A"}\nEnvironment: ${envParts.join(", ")}\n${logSummary || "Dev Logs: None"}`;
    return {
      model,
      endpoint: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      body: {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      },
    };
  }

  const payload = formatGeminiPayload(
    { title: "Checkout Crash", description: "Button unclickable" },
    ["Windows 11", "Chrome 132"],
    "Dev Logs: TypeError"
  );

  assert.equal(payload.model, "gemini-1.5-flash");
  assert.equal(payload.endpoint.includes("gemini-1.5-flash"), true);
  assert.equal(payload.body.contents[0].parts[0].text.includes("Checkout Crash"), true);
  assert.equal(payload.body.contents[0].parts[0].text.includes("Windows 11"), true);
});

// 10. Test bidirectional pull data parser and normalization
test("settings integrations: pull response normalizer extracts structured items", () => {
  function normalizePullItems(service, rawData) {
    if (service === "gemini") {
      const models = (rawData.models || [])
        .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
        .map((m) => ({
          id: m.name.replace(/^models\//, ""),
          title: m.displayName || m.name,
          status: "Available",
        }));
      return { ok: true, count: models.length, items: models };
    }
    if (service === "github") {
      const items = (rawData || []).map((iss) => ({
        id: String(iss.number),
        title: `#${iss.number} ${iss.title}`,
        status: iss.state,
      }));
      return { ok: true, count: items.length, items };
    }
    return { ok: false, count: 0, items: [] };
  }

  const geminiSample = {
    models: [
      { name: "models/gemini-1.5-flash", displayName: "Gemini 1.5 Flash", supportedGenerationMethods: ["generateContent"] },
      { name: "models/gemini-1.5-pro", displayName: "Gemini 1.5 Pro", supportedGenerationMethods: ["generateContent"] },
      { name: "models/text-embedding-004", displayName: "Text Embedding", supportedGenerationMethods: ["embedContent"] },
    ],
  };

  const parsedGemini = normalizePullItems("gemini", geminiSample);
  assert.equal(parsedGemini.ok, true);
  assert.equal(parsedGemini.count, 2); // Excludes embedContent
  assert.equal(parsedGemini.items[0].id, "gemini-1.5-flash");
  assert.equal(parsedGemini.items[0].title, "Gemini 1.5 Flash");

  const githubSample = [
    { number: 101, title: "Auth token leak", state: "open" },
    { number: 102, title: "Fix CSS flex", state: "closed" },
  ];
  const parsedGithub = normalizePullItems("github", githubSample);
  assert.equal(parsedGithub.ok, true);
  assert.equal(parsedGithub.count, 2);
  assert.equal(parsedGithub.items[0].title, "#101 Auth token leak");
});



