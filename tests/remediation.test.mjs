import { test } from "node:test";
import assert from "node:assert/strict";

// ---------------------------------------------------------------------------
// 1. Context Integrations Sanitizer Contract
// ---------------------------------------------------------------------------
function sanitizeWorkspaceIntegrations(raw) {
  if (!raw || typeof raw !== "object") return {};
  const safe = {};
  if (typeof raw.drive_folder_name === "string") {
    safe.drive_folder_name = raw.drive_folder_name;
  }
  if (raw.aksora && typeof raw.aksora === "object") {
    safe.aksora = {
      url: typeof raw.aksora.url === "string" ? raw.aksora.url : undefined,
      apiKey: typeof raw.aksora.apiKey === "string" ? raw.aksora.apiKey : undefined,
    };
  }
  if (raw.snaptest && typeof raw.snaptest === "object") {
    safe.snaptest = {
      url: typeof raw.snaptest.url === "string" ? raw.snaptest.url : undefined,
      apiKey: typeof raw.snaptest.apiKey === "string" ? raw.snaptest.apiKey : undefined,
    };
  }
  return safe;
}

test("workspace-context: scrubs third-party tokens and preserves extension whitelist", () => {
  const dirtySettings = {
    drive_folder_name: "Sprint Captures",
    jira: {
      host: "https://myteam.atlassian.net",
      email: "lead@example.com",
      apiToken: "SUPER_SECRET_JIRA_TOKEN_XYZ",
    },
    gitlab: {
      url: "https://gitlab.com",
      privateToken: "glpat-SECRET_GITLAB_TOKEN_123",
      projectId: "987654",
    },
    slack: {
      webhookUrl: "https://hooks.slack.com/services/T00/B00/SECRET_WEBHOOK_URL",
      channel: "#dev-bugs",
    },
    linear: {
      apiKey: "lin_api_SECRET_LINEAR_TOKEN",
    },
    aksora: {
      url: "https://api.aksora.internal",
      apiKey: "ak_live_12345",
    },
    snaptest: {
      url: "https://snaptest.internal",
      apiKey: "st_live_67890",
    },
  };

  const sanitized = sanitizeWorkspaceIntegrations(dirtySettings);

  // Sensitive third-party secrets must NOT be present in output
  assert.equal("jira" in sanitized, false, "jira must be stripped");
  assert.equal("gitlab" in sanitized, false, "gitlab must be stripped");
  assert.equal("slack" in sanitized, false, "slack must be stripped");
  assert.equal("linear" in sanitized, false, "linear must be stripped");

  // Whitelisted fields must be preserved
  assert.equal(sanitized.drive_folder_name, "Sprint Captures");
  assert.deepEqual(sanitized.aksora, {
    url: "https://api.aksora.internal",
    apiKey: "ak_live_12345",
  });
  assert.deepEqual(sanitized.snaptest, {
    url: "https://snaptest.internal",
    apiKey: "st_live_67890",
  });
});

test("workspace-context: handles empty or malformed integration payloads safely", () => {
  assert.deepEqual(sanitizeWorkspaceIntegrations(null), {});
  assert.deepEqual(sanitizeWorkspaceIntegrations(undefined), {});
  assert.deepEqual(sanitizeWorkspaceIntegrations("non-object"), {});
  assert.deepEqual(sanitizeWorkspaceIntegrations({}), {});
});

// ---------------------------------------------------------------------------
// 2. Upload Size Limit (100MB Ceiling) Contract
// ---------------------------------------------------------------------------
const MAX_UPLOAD_SIZE = 100 * 1024 * 1024; // 100MB

function validateUploadSize(sizeInBytes) {
  if (typeof sizeInBytes !== "number" || sizeInBytes <= 0) {
    return { ok: false, status: 400, error: "Invalid file size" };
  }
  if (sizeInBytes > MAX_UPLOAD_SIZE) {
    return { ok: false, status: 413, error: "File size exceeds 100MB limit" };
  }
  return { ok: true };
}

test("upload route: enforces 100MB upload ceiling", () => {
  // Normal images and short videos (under 100MB)
  assert.equal(validateUploadSize(500 * 1024).ok, true); // 500 KB
  assert.equal(validateUploadSize(10 * 1024 * 1024).ok, true); // 10 MB
  assert.equal(validateUploadSize(100 * 1024 * 1024).ok, true); // Exactly 100 MB

  // Oversized files (> 100MB)
  const oversized1 = validateUploadSize(100 * 1024 * 1024 + 1);
  assert.equal(oversized1.ok, false);
  assert.equal(oversized1.status, 413);

  const oversizedHuge = validateUploadSize(500 * 1024 * 1024); // 500 MB
  assert.equal(oversizedHuge.ok, false);
  assert.equal(oversizedHuge.status, 413);
  assert.equal(oversizedHuge.error, "File size exceeds 100MB limit");
});

// ---------------------------------------------------------------------------
// 3. Notification Safe URL Allowlist Contract
// ---------------------------------------------------------------------------
function validateNotificationClickUrl(clickUrl) {
  return typeof clickUrl === "string" && /^(https?:|chrome-extension:)\/\//i.test(clickUrl.trim())
    ? clickUrl.trim()
    : null;
}

test("notification: allows safe http, https, and chrome-extension schemes", () => {
  const safe = [
    "https://bugsnap.akusaraproject.my.id/v/abc-123",
    "https://drive.google.com/file/d/123/view",
    "http://localhost:3000/captures",
    "chrome-extension://abcdefghijklmnopqrstuvwxyz/options.html",
    "  https://example.com/trimmed  ",
  ];
  for (const url of safe) {
    assert.ok(validateNotificationClickUrl(url), `expected ${url} to be allowed`);
  }
});

test("notification: rejects unsafe and malicious URL schemes", () => {
  const unsafe = [
    "javascript:alert(document.cookie)",
    "javascript://%0Aalert(1)",
    "data:text/html,<script>alert(1)</script>",
    "file:///etc/passwd",
    "file://C:/Windows/System32/calc.exe",
    "vbscript:msgbox(1)",
    "blob:https://example.com/uuid",
    "",
    null,
    undefined,
    12345,
  ];
  for (const url of unsafe) {
    assert.equal(validateNotificationClickUrl(url), null, `${url} must be rejected`);
  }
});

// ---------------------------------------------------------------------------
// 4. Trailing Debounce Contract for DOM Observers
// ---------------------------------------------------------------------------
test("trailing debounce: collapses rapid mutation calls to single final execution", async () => {
  let callCount = 0;
  let timer = null;

  function debouncedAction(fn, delay = 50) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn();
    }, delay);
  }

  // Rapidly fire 10 mutations within a short burst
  for (let i = 0; i < 10; i++) {
    debouncedAction(() => { callCount++; }, 40);
  }

  // Immediately after firing, count should still be 0 (debounced)
  assert.equal(callCount, 0);

  // Wait for timer to expire
  await new Promise((resolve) => setTimeout(resolve, 80));

  // Should have executed exactly once
  assert.equal(callCount, 1);
});
