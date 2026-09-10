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
  const url = log.url || "";
  let cmd = `curl -X ${method} "${url}"`;
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


