/**
 * Unit tests for pure helper functions extracted from the app.
 * No DB required. These mirror the exact logic used in the dashboard.
 *
 * Run:  node --test tests/
 */
import { test } from "node:test";
import assert from "node:assert/strict";

// ---------------------------------------------------------------------------
// driveFileId / driveThumbUrl / drivePreviewUrl (from captures page)
// ---------------------------------------------------------------------------
function driveFileId(driveUrl) {
  const m = driveUrl.match(/[?&]id=([^&]+)/) || driveUrl.match(/\/d\/([^/]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

test("driveFileId: parses /d/ format", () => {
  assert.equal(
    driveFileId("https://drive.google.com/file/d/ABC123xyz/view?usp=sharing"),
    "ABC123xyz"
  );
});

test("driveFileId: parses ?id= format", () => {
  assert.equal(driveFileId("https://drive.google.com/open?id=XYZ789"), "XYZ789");
});

test("driveFileId: returns null for non-drive urls", () => {
  assert.equal(driveFileId("https://example.com/page"), null);
  assert.equal(driveFileId(""), null);
});

test("driveFileId: handles encoded ids", () => {
  assert.equal(driveFileId("https://drive.google.com/file/d/a%2Bb%2Fc/view"), "a+b/c");
});

// ---------------------------------------------------------------------------
// formatDuration (from captures page)
// ---------------------------------------------------------------------------
function formatDuration(sec) {
  if (!sec || isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

test("formatDuration: formats seconds", () => {
  assert.equal(formatDuration(0), "0:00");
  assert.equal(formatDuration(7), "0:07");
  assert.equal(formatDuration(59), "0:59");
  assert.equal(formatDuration(60), "1:00");
  assert.equal(formatDuration(83), "1:23");
  assert.equal(formatDuration(600), "10:00");
});

test("formatDuration: guards invalid input", () => {
  assert.equal(formatDuration(null), "0:00");
  assert.equal(formatDuration(undefined), "0:00");
  assert.equal(formatDuration(NaN), "0:00");
});

// ---------------------------------------------------------------------------
// Redaction (from editor.js) - privacy feature
// ---------------------------------------------------------------------------
function redactSensitiveData(str) {
  if (!str) return str;
  return str
    .replace(/(Bearer\s+)[A-Za-z0-9\-\._~+\/]+/gi, "$1***REDACTED***")
    .replace(/(password|secret|token|api_key|apikey)(["'=:\s]+)[^\s&"',]+/gi, "$1$2***REDACTED***");
}

test("redact: masks Bearer tokens", () => {
  const out = redactSensitiveData("Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abc");
  assert.ok(out.includes("***REDACTED***"), "token must be masked");
  assert.ok(!out.includes("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abc"), "raw token must be gone");
});

test("redact: masks password= values", () => {
  const out = redactSensitiveData("https://api.example.com/login?password=sup3rsecret&x=1");
  assert.ok(out.includes("***REDACTED***"));
  assert.ok(!out.includes("sup3rsecret"));
});

test("redact: masks secret and token keys", () => {
  assert.ok(!redactSensitiveData('"secret": "abc123"').includes("abc123"));
  assert.ok(!redactSensitiveData("token=xyz789").includes("xyz789"));
  assert.ok(!redactSensitiveData("api_key: 123456").includes("123456"));
});

test("redact: leaves normal text untouched", () => {
  const s = "User clicked the save button successfully";
  assert.equal(redactSensitiveData(s), s);
});

// ---------------------------------------------------------------------------
// Comment timestamp parsing (from Comments.tsx)
// ---------------------------------------------------------------------------
function parseTimestamp(input) {
  const m = input.trim().match(/^(?:(\d+):)?([0-5]?\d)$/);
  if (!m) return null;
  const minutes = m[1] ? parseInt(m[1], 10) : 0;
  return minutes * 60 + parseInt(m[2], 10);
}

test("parseTimestamp: parses m:ss and plain seconds", () => {
  // Regex accepts m:ss or 0-59 seconds only (e.g. "7", "23").
  assert.equal(parseTimestamp("7"), 7);
  assert.equal(parseTimestamp("1:23"), 83);
  assert.equal(parseTimestamp("0:07"), 7);
  assert.equal(parseTimestamp("10:00"), 600);
});

test("parseTimestamp: rejects invalid", () => {
  assert.equal(parseTimestamp("83"), null); // 83 seconds must be written as 1:23
  assert.equal(parseTimestamp("1:99"), null);
  assert.equal(parseTimestamp("abc"), null);
  assert.equal(parseTimestamp(""), null);
  assert.equal(parseTimestamp("12:34:56"), null);
});

// ---------------------------------------------------------------------------
// expiryToOption (from captures EditModal)
// ---------------------------------------------------------------------------
function expiryToOption(expiresAt, createdAt) {
  if (!expiresAt) return "never";
  const diffMs = new Date(expiresAt).getTime() - new Date(createdAt).getTime();
  if (diffMs <= 36 * 60 * 60 * 1000) return "24h";
  if (diffMs <= 10.5 * 24 * 60 * 60 * 1000) return "7d";
  return "never";
}

test("expiryToOption: classifies expiry windows", () => {
  const now = new Date().toISOString();
  assert.equal(expiryToOption(null, now), "never");
  assert.equal(
    expiryToOption(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), now),
    "24h"
  );
  assert.equal(
    expiryToOption(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), now),
    "7d"
  );
  assert.equal(
    expiryToOption(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), now),
    "never"
  );
});

// ---------------------------------------------------------------------------
// Rate Limiter & Security Token Sanitizer Helpers
// ---------------------------------------------------------------------------
test("redact: sanitizes authorization header variations safely", () => {
  const customHeader = "Authorization: Bearer my-secret-jwt-token-xyz123";
  const sanitized = redactSensitiveData(customHeader);
  assert.ok(sanitized.includes("***REDACTED***"));
  assert.ok(!sanitized.includes("my-secret-jwt-token-xyz123"));
});

test("canonical UUID validator rejects SQL and command injection strings", () => {
  const isValidUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
  assert.equal(isValidUUID("123e4567-e89b-12d3-a456-426614174000"), true);
  assert.equal(isValidUUID("123e4567-e89b-12d3-a456-426614174000' OR '1'='1"), false);
  assert.equal(isValidUUID("DROP TABLE users;--"), false);
  assert.equal(isValidUUID("../../../etc/passwd"), false);
});

// ---------------------------------------------------------------------------
// DevTools Helpers (cleanStackTrace, buildCurlCommand, isFirstPartyUrl)
// ---------------------------------------------------------------------------
function cleanStackTrace(stack) {
  if (!stack || typeof stack !== "string") return "";
  return stack
    .split(/\r?\n/)
    .filter((line) => {
      const lower = line.toLowerCase();
      return (
        !lower.includes("chrome-extension://") &&
        !lower.includes("moz-extension://") &&
        !lower.includes("safari-extension://") &&
        !lower.includes("edge-extension://") &&
        !lower.includes("injected_logger.js") &&
        !lower.includes("rrweb-record") &&
        !lower.includes("record_controls")
      );
    })
    .join("\n")
    .trim();
}

function buildCurlCommand(log) {
  const method = (log.method || "GET").toUpperCase();
  const safeUrl = (log.url || "").replace(/(["\\$`])/g, "\\$1");
  let cmd = `curl -X ${method} "${safeUrl}"`;
  if (log.requestBody) {
    const escaped = log.requestBody.replace(/'/g, "'\\''");
    cmd += ` -H "Content-Type: application/json" -d '${escaped}'`;
  }
  return cmd;
}

function isFirstPartyUrl(url, targetHost) {
  if (!url || !targetHost) return true;
  try {
    const host = new URL(url).hostname.toLowerCase();
    const target = targetHost.toLowerCase();
    return host === target || host.endsWith("." + target);
  } catch {
    return false;
  }
}

test("cleanStackTrace: strips extension and recorder frames from stack traces", () => {
  const dirtyStack = `Error: Cannot read properties of undefined
    at login (https://myapp.com/assets/auth.js:42:12)
    at HTMLButtonElement.dispatch (https://myapp.com/assets/vendor.js:100:5)
    at chrome-extension://abcdefghij/injected_logger.js:15:30
    at rrweb-record.min.js:200:10
    at record_controls.js:50:5`;

  const cleaned = cleanStackTrace(dirtyStack);
  assert.ok(cleaned.includes("https://myapp.com/assets/auth.js:42:12"));
  assert.ok(cleaned.includes("https://myapp.com/assets/vendor.js:100:5"));
  assert.ok(!cleaned.includes("chrome-extension://"));
  assert.ok(!cleaned.includes("injected_logger.js"));
  assert.ok(!cleaned.includes("rrweb-record"));
  assert.ok(!cleaned.includes("record_controls"));
});

test("buildCurlCommand: formats GET and POST requests with json payloads", () => {
  const getLog = { method: "GET", url: "https://api.myapp.com/v1/users" };
  assert.equal(buildCurlCommand(getLog), 'curl -X GET "https://api.myapp.com/v1/users"');

  const postLog = {
    method: "POST",
    url: "https://api.myapp.com/v1/checkout",
    requestBody: JSON.stringify({ item: "book", price: 10 }),
  };
  assert.equal(
    buildCurlCommand(postLog),
    'curl -X POST "https://api.myapp.com/v1/checkout" -H "Content-Type: application/json" -d \'{"item":"book","price":10}\''
  );

  const postWithQuote = {
    method: "POST",
    url: "https://api.myapp.com/v1/note",
    requestBody: "it's working",
  };
  assert.equal(
    buildCurlCommand(postWithQuote),
    'curl -X POST "https://api.myapp.com/v1/note" -H "Content-Type: application/json" -d \'it\'\\\'\'s working\''
  );

  const maliciousLog = {
    method: "GET",
    url: 'https://api.myapp.com/v1/search?q="$(whoami)"',
  };
  assert.equal(
    buildCurlCommand(maliciousLog),
    'curl -X GET "https://api.myapp.com/v1/search?q=\\"\\$(whoami)\\""'
  );
});

test("isFirstPartyUrl: accurately categorizes 1st-party vs 3rd-party domains", () => {
  const targetHost = "myapp.com";

  // Exact match and subdomains are 1st-party
  assert.equal(isFirstPartyUrl("https://myapp.com/api/test", targetHost), true);
  assert.equal(isFirstPartyUrl("https://api.myapp.com/v1/users", targetHost), true);
  assert.equal(isFirstPartyUrl("https://cdn.static.myapp.com/logo.png", targetHost), true);

  // External CDNs, APIs, and trackers are 3rd-party
  assert.equal(isFirstPartyUrl("https://checkout.stripe.com/c/pay", targetHost), false);
  assert.equal(isFirstPartyUrl("https://fonts.googleapis.com/css", targetHost), false);
  assert.equal(isFirstPartyUrl("https://notmyapp.com/api", targetHost), false);
  assert.equal(isFirstPartyUrl("https://fake-myapp.com", targetHost), false);
});

// ---------------------------------------------------------------------------
// Markdown Bug Report Generator & HAR Exporter
// ---------------------------------------------------------------------------
function buildMarkdownBugReport({
  capture,
  targetHost,
  detectedOs,
  detectedBrowser,
  createdAt,
  consoleErrors,
  networkErrors,
  actionLogs,
  storage,
  findPrecedingAction,
}) {
  const totalIssues = (consoleErrors || []).length + (networkErrors || []).length;
  const sections = [];

  sections.push(`## 🐛 Bug Report: ${capture.site_url || "Session Capture"}`);
  sections.push("");
  sections.push("### 📋 Environment");
  sections.push(`- **URL**: ${capture.site_url || "-"}`);
  if (targetHost) sections.push(`- **Target Host**: ${targetHost}`);
  sections.push(`- **OS**: ${detectedOs}`);
  sections.push(`- **Browser**: ${detectedBrowser}`);
  if (capture.window_size) sections.push(`- **Window Size**: ${capture.window_size}`);
  sections.push(`- **Captured At**: ${createdAt}`);
  if (capture.drive_url) sections.push(`- **Session Recording**: [View Recording](${capture.drive_url})`);

  sections.push("");
  sections.push(`### ⚠️ Issues Overview (${totalIssues} detected)`);
  sections.push(`- **Console Errors**: ${(consoleErrors || []).length}`);
  sections.push(`- **Failed Network Requests**: ${(networkErrors || []).length}`);

  if (consoleErrors && consoleErrors.length > 0) {
    sections.push("");
    sections.push("### 🚨 Console Errors");
    consoleErrors.slice(0, 5).forEach((err, idx) => {
      const msg = err.message || err.text || "Error";
      const preceding = findPrecedingAction ? findPrecedingAction(err) : null;
      sections.push(`${idx + 1}. \`${msg}\``);
      if (preceding) {
        const delta = preceding.deltaSec != null ? ` (${preceding.deltaSec < 1 ? "<1s" : `${preceding.deltaSec.toFixed(1)}s`} prior)` : "";
        sections.push(`   - ↳ *Triggered after*: ${preceding.message}${delta}`);
      }
    });
  }

  if (networkErrors && networkErrors.length > 0) {
    sections.push("");
    sections.push("### 🌐 Failed Network Requests");
    networkErrors.slice(0, 5).forEach((req, idx) => {
      const method = (req.method || "GET").toUpperCase();
      const status = req.status || "FAIL";
      const preceding = findPrecedingAction ? findPrecedingAction(req) : null;
      sections.push(`${idx + 1}. **${method} ${status}** \`${req.url || "-"}\``);
      if (preceding) {
        const delta = preceding.deltaSec != null ? ` (${preceding.deltaSec < 1 ? "<1s" : `${preceding.deltaSec.toFixed(1)}s`} prior)` : "";
        sections.push(`   - ↳ *Triggered after*: ${preceding.message}${delta}`);
      }
      sections.push("   ```bash");
      sections.push(`   ${buildCurlCommand(req)}`);
      sections.push("   ```");
    });
  }

  if (actionLogs && actionLogs.length > 0) {
    sections.push("");
    sections.push("### 👣 Steps to Reproduce (Recent Actions)");
    actionLogs.slice(-10).forEach((act, idx) => {
      const msg = act.message || act.url || act.type;
      sections.push(`${idx + 1}. ${msg}`);
    });
  }

  if (storage) {
    const localKeys = Object.keys(storage.localStorage || {});
    const sessionKeys = Object.keys(storage.sessionStorage || {});
    if (localKeys.length > 0 || sessionKeys.length > 0) {
      sections.push("");
      sections.push("### 💾 Storage Snapshot");
      if (localKeys.length > 0) {
        sections.push(`- **localStorage** (${localKeys.length} items): \`${localKeys.slice(0, 10).join("`, `")}${localKeys.length > 10 ? "..." : ""}\``);
      }
      if (sessionKeys.length > 0) {
        sections.push(`- **sessionStorage** (${sessionKeys.length} items): \`${sessionKeys.slice(0, 10).join("`, `")}${sessionKeys.length > 10 ? "..." : ""}\``);
      }
    }
  }

  sections.push("");
  sections.push("---");
  sections.push("*Generated via BugSnap DevTools*");

  return sections.join("\n");
}

function buildHarExport(networkLogs, siteUrl) {
  const startedDateTime = new Date().toISOString();
  const entries = (networkLogs || []).map((log, index) => {
    const duration = typeof log.duration === "number" && log.duration > 0 ? log.duration : 50;
    const status = log.status || (log.error ? 0 : 200);
    const reqBody = log.requestBody || "";
    const resBody = log.responseBody || "";

    return {
      _index: index,
      startedDateTime: log.timestamp ? new Date(Number(log.timestamp)).toISOString() : startedDateTime,
      time: duration,
      request: {
        method: (log.method || "GET").toUpperCase(),
        url: log.url || "",
        httpVersion: "HTTP/1.1",
        cookies: [],
        headers: reqBody ? [{ name: "Content-Type", value: "application/json" }] : [],
        queryString: [],
        postData: reqBody ? { mimeType: "application/json", text: reqBody } : undefined,
        headersSize: -1,
        bodySize: reqBody ? reqBody.length : 0,
      },
      response: {
        status,
        statusText: status === 200 ? "OK" : "Error",
        httpVersion: "HTTP/1.1",
        cookies: [],
        headers: resBody ? [{ name: "Content-Type", value: "application/json" }] : [],
        content: {
          size: resBody ? resBody.length : 0,
          mimeType: "application/json",
          text: resBody,
        },
        redirectURL: "",
        headersSize: -1,
        bodySize: resBody ? resBody.length : 0,
      },
      cache: {},
      timings: {
        blocked: -1,
        dns: -1,
        connect: -1,
        send: 0,
        wait: duration,
        receive: 0,
        ssl: -1,
      },
    };
  });

  const har = {
    log: {
      version: "1.2",
      creator: {
        name: "BugSnap DevTools",
        version: "1.0.0",
      },
      pages: [
        {
          startedDateTime,
          id: "page_1",
          title: siteUrl || "BugSnap Session",
          pageTimings: {
            onContentLoad: -1,
            onLoad: -1,
          },
        },
      ],
      entries,
    },
  };

  return JSON.stringify(har, null, 2);
}

test("buildMarkdownBugReport: generates structured Jira/GitHub/Linear markdown", () => {
  const mockCapture = {
    site_url: "https://myapp.com/dashboard",
    created_at: "2026-09-10T12:00:00Z",
    window_size: "1920x1080",
    drive_url: "https://drive.google.com/file/d/test123/view",
  };

  const mockConsoleErrors = [
    { type: "console", level: "error", message: "Uncaught TypeError: Cannot read properties of undefined" },
  ];

  const mockNetworkErrors = [
    { type: "network", method: "POST", status: 500, url: "https://myapp.com/api/save", requestBody: '{"name":"test"}' },
  ];

  const mockActionLogs = [
    { type: "step", message: "Clicked button: Save Changes" },
  ];

  const mockStorage = {
    localStorage: { user_id: "12345", session_token: "***REDACTED***" },
    sessionStorage: { tab_state: "active" },
  };

  const markdown = buildMarkdownBugReport({
    capture: mockCapture,
    targetHost: "myapp.com",
    detectedOs: "macOS",
    detectedBrowser: "Chrome",
    createdAt: "Sep 10, 2026",
    consoleErrors: mockConsoleErrors,
    networkErrors: mockNetworkErrors,
    actionLogs: mockActionLogs,
    storage: mockStorage,
    findPrecedingAction: () => ({ message: "Clicked button: Save Changes", deltaSec: 0.4 }),
  });

  assert.ok(markdown.includes("## 🐛 Bug Report: https://myapp.com/dashboard"));
  assert.ok(markdown.includes("- **OS**: macOS"));
  assert.ok(markdown.includes("- **Browser**: Chrome"));
  assert.ok(markdown.includes("### 🚨 Console Errors"));
  assert.ok(markdown.includes("Triggered after*: Clicked button: Save Changes"));
  assert.ok(markdown.includes("### 🌐 Failed Network Requests"));
  assert.ok(markdown.includes('curl -X POST "https://myapp.com/api/save"'));
  assert.ok(markdown.includes("### 👣 Steps to Reproduce (Recent Actions)"));
  assert.ok(markdown.includes("Clicked button: Save Changes"));
  assert.ok(markdown.includes("### 💾 Storage Snapshot"));
  assert.ok(markdown.includes("user_id"));
});

test("buildHarExport: produces valid HAR 1.2 schema with request and response details", () => {
  const networkLogs = [
    {
      method: "POST",
      url: "https://myapp.com/api/checkout",
      status: 200,
      duration: 120,
      requestBody: JSON.stringify({ amount: 50 }),
      responseBody: JSON.stringify({ success: true, orderId: "ord_123" }),
      timestamp: Date.now(),
    },
    {
      method: "GET",
      url: "https://myapp.com/api/profile",
      status: 404,
      duration: 45,
      timestamp: Date.now(),
    },
  ];

  const harJson = buildHarExport(networkLogs, "https://myapp.com");
  const parsed = JSON.parse(harJson);

  assert.equal(parsed.log.version, "1.2");
  assert.equal(parsed.log.creator.name, "BugSnap DevTools");
  assert.equal(parsed.log.pages.length, 1);
  assert.equal(parsed.log.entries.length, 2);

  const entry0 = parsed.log.entries[0];
  assert.equal(entry0.request.method, "POST");
  assert.equal(entry0.request.url, "https://myapp.com/api/checkout");
  assert.equal(entry0.request.postData.mimeType, "application/json");
  assert.equal(entry0.request.postData.text, JSON.stringify({ amount: 50 }));
  assert.equal(entry0.response.status, 200);
  assert.equal(entry0.response.content.text, JSON.stringify({ success: true, orderId: "ord_123" }));
  assert.equal(entry0.time, 120);

  const entry1 = parsed.log.entries[1];
  assert.equal(entry1.request.method, "GET");
  assert.equal(entry1.response.status, 404);
});

// ---------------------------------------------------------------------------
// Admin Auth & CSRF Helper Unit Tests
// ---------------------------------------------------------------------------
function resolveSuperAdminEmails(envValue) {
  const configured = (envValue || "contact.akusaraproject@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!configured.includes("contact.akusaraproject@gmail.com")) {
    configured.push("contact.akusaraproject@gmail.com");
  }
  return configured;
}

function checkSuperAdmin(email, envValue) {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return resolveSuperAdminEmails(envValue).includes(normalized);
}

test("admin-auth: default super admin email is always authorized", () => {
  assert.equal(checkSuperAdmin("contact.akusaraproject@gmail.com", ""), true);
  assert.equal(checkSuperAdmin(" CONTACT.AKUSARAPROJECT@GMAIL.COM ", ""), true);
  assert.equal(checkSuperAdmin("random.user@example.com", ""), false);
  assert.equal(checkSuperAdmin(null, ""), false);
  assert.equal(checkSuperAdmin(undefined, ""), false);
});

test("admin-auth: multiple configured super admin emails from env are authorized", () => {
  const envVal = "admin1@akusaraproject.my.id, ADMIN2@akusaraproject.my.id ";
  assert.equal(checkSuperAdmin("admin1@akusaraproject.my.id", envVal), true);
  assert.equal(checkSuperAdmin("admin2@akusaraproject.my.id", envVal), true);
  // Default primary email is still retained
  assert.equal(checkSuperAdmin("contact.akusaraproject@gmail.com", envVal), true);
  // Unauthorized email rejected
  assert.equal(checkSuperAdmin("intruder@evil.com", envVal), false);
});

function isCsrfOriginAllowed(pathname, method, origin, host) {
  if (pathname.startsWith("/api/admin/") && ["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        return originHost === host;
      } catch {
        return false;
      }
    }
  }
  return true;
}

test("middleware csrf: permits same-origin mutating requests to /api/admin/*", () => {
  assert.equal(
    isCsrfOriginAllowed("/api/admin/broadcast", "POST", "https://bugsnap.akusaraproject.my.id", "bugsnap.akusaraproject.my.id"),
    true
  );
  assert.equal(
    isCsrfOriginAllowed("/api/admin/toggle-suspend", "POST", "http://localhost:3000", "localhost:3000"),
    true
  );
});

test("middleware csrf: blocks cross-origin mutating requests to /api/admin/*", () => {
  assert.equal(
    isCsrfOriginAllowed("/api/admin/broadcast", "POST", "https://evil.attacker.com", "bugsnap.akusaraproject.my.id"),
    false
  );
  assert.equal(
    isCsrfOriginAllowed("/api/admin/change-password", "POST", "not-a-valid-url", "bugsnap.akusaraproject.my.id"),
    false
  );
});

// ---------------------------------------------------------------------------
// PostgREST Query Injection Sanitization
// ---------------------------------------------------------------------------
function sanitizePostgrestFilter(input) {
  if (!input || typeof input !== "string") return "";
  return input.replace(/[\\,[\]().]/g, "").trim().slice(0, 100);
}

test("sanitizePostgrestFilter: strips PostgREST delimiters and syntax modifiers", () => {
  // Strips commas (which would inject extra OR conditions)
  assert.equal(sanitizePostgrestFilter("foo,bar"), "foobar");
  assert.equal(sanitizePostgrestFilter("title,site_url.eq.evil"), "titlesite_urleqevil");

  // Strips parentheses and brackets (which alter logical grouping)
  assert.equal(sanitizePostgrestFilter("admin(id.eq.1)"), "adminideq1");
  assert.equal(sanitizePostgrestFilter("[tag]"), "tag");

  // Strips dots and backslashes
  assert.equal(sanitizePostgrestFilter("user.email"), "useremail");
  assert.equal(sanitizePostgrestFilter("path\\injection"), "pathinjection");

  // Preserves safe alphanumeric, spaces, dashes, underscores
  assert.equal(sanitizePostgrestFilter("bug report - 2026_09"), "bug report - 2026_09");

  // Bounds length to 100
  assert.equal(sanitizePostgrestFilter("a".repeat(150)).length, 100);

  // Handles falsy/empty/whitespace safely
  assert.equal(sanitizePostgrestFilter(""), "");
  assert.equal(sanitizePostgrestFilter(null), "");
  assert.equal(sanitizePostgrestFilter(undefined), "");
  assert.equal(sanitizePostgrestFilter("  [(,.)]  "), "");
});

// ---------------------------------------------------------------------------
// Admin Promo Validation
// ---------------------------------------------------------------------------
function validatePromoInput(body) {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid request body" };

  const discountVal = body.discount_percent ?? body.discount_percentage ?? body.discount;
  if (discountVal !== undefined && discountVal !== null && discountVal !== "") {
    const parsed = Number(discountVal);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 100) {
      return { ok: false, error: "Discount percentage must be between 1 and 100" };
    }
  }

  const maxUsesVal = body.max_uses ?? body.maxUses;
  if (maxUsesVal !== undefined && maxUsesVal !== null && maxUsesVal !== "") {
    const parsed = Number(maxUsesVal);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return { ok: false, error: "Max uses must be a positive integer" };
    }
  }

  const expiryVal = body.expires_at ?? body.expiry_date ?? body.expiresAt ?? body.expiryDate;
  if (expiryVal !== undefined && expiryVal !== null && expiryVal !== "") {
    const parsed = new Date(String(expiryVal));
    if (isNaN(parsed.getTime())) {
      return { ok: false, error: "Invalid expiry date" };
    }
  }

  return { ok: true };
}

test("validatePromoInput: validates discount, max_uses, and expiry", () => {
  // Valid payloads
  assert.equal(validatePromoInput({ message: "Sale", enabled: true }).ok, true);
  assert.equal(validatePromoInput({ discount_percent: 50, max_uses: 10, expires_at: "2026-12-31" }).ok, true);
  assert.equal(validatePromoInput({ discount: 100, maxUses: 1 }).ok, true);

  // Invalid discount percent
  assert.equal(validatePromoInput({ discount_percent: 0 }).ok, false);
  assert.equal(validatePromoInput({ discount_percent: 101 }).ok, false);
  assert.equal(validatePromoInput({ discount_percent: -5 }).ok, false);
  assert.equal(validatePromoInput({ discount_percent: "abc" }).ok, false);

  // Invalid max_uses
  assert.equal(validatePromoInput({ max_uses: 0 }).ok, false);
  assert.equal(validatePromoInput({ max_uses: -10 }).ok, false);
  assert.equal(validatePromoInput({ max_uses: 2.5 }).ok, false);

  // Invalid expiry date
  assert.equal(validatePromoInput({ expires_at: "not-a-date" }).ok, false);
});

// ---------------------------------------------------------------------------
// Admin Auth Token Security & Privilege Escalation Prevention
// ---------------------------------------------------------------------------
import crypto from "node:crypto";

function createTestAdminToken(username, secret, ttlMs = 8 * 60 * 60 * 1000) {
  const payload = {
    username,
    exp: Date.now() + ttlMs,
  };
  const jsonStr = JSON.stringify(payload);
  const b64Payload = Buffer.from(jsonStr, "utf-8").toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(b64Payload).digest("base64url");
  return `${b64Payload}.${signature}`;
}

function verifyTestAdminToken(token, secret) {
  if (!secret || !token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [b64Payload, signature] = parts;
  const expectedSig = crypto.createHmac("sha256", secret).update(b64Payload).digest("base64url");
  const sigBuf = Buffer.from(signature, "utf-8");
  const expBuf = Buffer.from(expectedSig, "utf-8");
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;

  try {
    const raw = Buffer.from(b64Payload, "base64url").toString("utf-8");
    const parsed = JSON.parse(raw);
    if (Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

test("admin-auth: HMAC tokens verify correctly and reject tampering or expiry", () => {
  const secret = "test-secret-key-1234567890abcdef";
  const token = createTestAdminToken("admin@example.com", secret);
  const payload = verifyTestAdminToken(token, secret);
  assert.equal(payload?.username, "admin@example.com");

  // Rejects wrong secret
  assert.equal(verifyTestAdminToken(token, "wrong-secret"), null);

  // Rejects tampered payload
  const [b64, sig] = token.split(".");
  const tamperedPayload = Buffer.from(JSON.stringify({ username: "hacker@evil.com", exp: Date.now() + 10000 })).toString("base64url");
  assert.equal(verifyTestAdminToken(`${tamperedPayload}.${sig}`, secret), null);

  // Rejects expired token
  const expiredToken = createTestAdminToken("admin@example.com", secret, -1000);
  assert.equal(verifyTestAdminToken(expiredToken, secret), null);
});

function validateAdminLoginResponse(body) {
  // Token must NEVER be exposed in JSON response; delivered only via httpOnly cookie
  return {
    hasTokenInBody: "token" in body,
    ok: body.ok === true,
    hasUsername: typeof body.username === "string" && body.username.length > 0,
  };
}

test("admin-auth: login JSON responses must omit token to prevent XSS leakage", () => {
  const secureResponse = {
    ok: true,
    username: "contact.akusaraproject@gmail.com",
    message: "Login admin via Google berhasil.",
  };
  const check = validateAdminLoginResponse(secureResponse);
  assert.equal(check.hasTokenInBody, false, "token must NOT be in response JSON");
  assert.equal(check.ok, true);
  assert.equal(check.hasUsername, true);

  const insecureResponse = {
    ok: true,
    username: "admin",
    token: "leaked.hmac.token",
    message: "Login admin berhasil.",
  };
  assert.equal(validateAdminLoginResponse(insecureResponse).hasTokenInBody, true);
});

function evaluateSuspendGuard({ callerUserId, callerEmail, targetUserId, targetUserEmail, suspended, isSuperAdmin }) {
  if (!targetUserId) {
    return { ok: false, status: 400, error: "Missing user_id" };
  }
  // Prevent self-suspension by user ID or email
  if (
    (callerUserId && targetUserId === callerUserId) ||
    (callerEmail && targetUserEmail && callerEmail.trim().toLowerCase() === targetUserEmail.trim().toLowerCase())
  ) {
    return { ok: false, status: 400, error: "You cannot suspend your own account" };
  }
  // Prevent suspending any Super Admin
  if (suspended && isSuperAdmin(targetUserEmail)) {
    return { ok: false, status: 400, error: "Super admin accounts cannot be suspended" };
  }
  return { ok: true };
}

test("admin toggle-suspend: prevents super admin suspension and self-suspension", () => {
  const isSuperAdmin = (email) => checkSuperAdmin(email, "superadmin@domain.com");

  // 1. Attempting to suspend primary super admin
  const guardSuperAdmin = evaluateSuspendGuard({
    callerUserId: "admin-1",
    callerEmail: "other@admin.com",
    targetUserId: "target-super",
    targetUserEmail: "contact.akusaraproject@gmail.com",
    suspended: true,
    isSuperAdmin,
  });
  assert.equal(guardSuperAdmin.ok, false);
  assert.equal(guardSuperAdmin.error, "Super admin accounts cannot be suspended");

  // 2. Attempting to suspend env-configured super admin
  const guardEnvSuperAdmin = evaluateSuspendGuard({
    callerUserId: "admin-1",
    callerEmail: "other@admin.com",
    targetUserId: "target-env-super",
    targetUserEmail: "superadmin@domain.com",
    suspended: true,
    isSuperAdmin,
  });
  assert.equal(guardEnvSuperAdmin.ok, false);
  assert.equal(guardEnvSuperAdmin.error, "Super admin accounts cannot be suspended");

  // 3. Attempting self-suspension by user ID
  const guardSelfId = evaluateSuspendGuard({
    callerUserId: "same-user-id",
    callerEmail: "admin@domain.com",
    targetUserId: "same-user-id",
    targetUserEmail: "regular@user.com",
    suspended: true,
    isSuperAdmin,
  });
  assert.equal(guardSelfId.ok, false);
  assert.equal(guardSelfId.error, "You cannot suspend your own account");

  // 4. Attempting self-suspension by cookie/email when callerUserId is null
  const guardSelfEmail = evaluateSuspendGuard({
    callerUserId: null,
    callerEmail: "admin@domain.com",
    targetUserId: "target-user-123",
    targetUserEmail: "admin@domain.com",
    suspended: true,
    isSuperAdmin,
  });
  assert.equal(guardSelfEmail.ok, false);
  assert.equal(guardSelfEmail.error, "You cannot suspend your own account");

  // 5. Valid suspension of normal user
  const guardNormalUser = evaluateSuspendGuard({
    callerUserId: "admin-1",
    callerEmail: "contact.akusaraproject@gmail.com",
    targetUserId: "user-456",
    targetUserEmail: "regular.user@example.com",
    suspended: true,
    isSuperAdmin,
  });
  assert.equal(guardNormalUser.ok, true);

  // 6. Unsuspending a user is permitted
  const guardUnsuspend = evaluateSuspendGuard({
    callerUserId: "admin-1",
    callerEmail: "contact.akusaraproject@gmail.com",
    targetUserId: "user-456",
    targetUserEmail: "regular.user@example.com",
    suspended: false,
    isSuperAdmin,
  });
  assert.equal(guardUnsuspend.ok, true);
});



