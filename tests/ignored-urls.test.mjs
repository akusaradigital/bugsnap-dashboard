import test from "node:test";
import assert from "node:assert/strict";

const TRACKER_PATTERNS = [
  /\.supabase\.co/i,
  /bugsnap\.akusaraproject\.my\.id/i,
  /googleapis\.com/i,
  /googleusercontent\.com/i,
  /accounts\.google\.com/i,
  /apis\.google\.com/i,
  /atlassian\.com/i,
  /atlassian\.net/i,
  /google-analytics\.com/i,
  /analytics\.google\.com/i,
  /googletagmanager\.com/i,
  /sentry\.io/i,
  /mixpanel\.com/i,
  /hotjar\.com/i,
  /hotjar\.io/i,
  /amplitude\.com/i,
  /\bstatsig\b/i,
  /statsig\.com/i,
  /segment\.io/i,
  /doubleclick\.net/i,
  /facebook\.net/i,
  /browser-intake-datadoghq\.com/i,
  /analytics/i,
  /telemetry/i,
  /tracking/i,
];

function isIgnoredUrl(url) {
  if (!url) return false;
  const lower = String(url).toLowerCase().trim();
  if (
    lower.startsWith("chrome-extension://") ||
    lower.startsWith("moz-extension://") ||
    lower.startsWith("safari-extension://") ||
    lower.startsWith("edge-extension://") ||
    lower.startsWith("chrome://") ||
    lower.startsWith("edge://") ||
    lower.startsWith("about:") ||
    lower.startsWith("blob:chrome-extension://") ||
    lower.includes("/record_bar.html") ||
    lower.includes("record_controls.js")
  ) {
    return true;
  }
  return TRACKER_PATTERNS.some((pattern) => pattern.test(url));
}

test("isIgnoredUrl filters internal dashboard and cloud services", () => {
  const ignored = [
    "https://kkmvanwgywrqsudvspge.supabase.co/rest/v1/rpc/get_view_count",
    "https://kkmvanwgywrqsudvspge.supabase.co/rest/v1/workspace_settings?select=integrations",
    "https://bugsnap.akusaraproject.my.id/c/abc-123",
    "https://bugsnap.akusaraproject.my.id/api/capture",
    "https://www.googleapis.com/drive/v3/files",
    "https://accounts.google.com/o/oauth2/v2/auth",
    "chrome-extension://abcdef/record_bar.html",
    "blob:chrome-extension://abcdef/xyz",
  ];
  for (const url of ignored) {
    assert.equal(isIgnoredUrl(url), true, `Expected ${url} to be ignored`);
  }
});

test("isIgnoredUrl allows normal user website network requests", () => {
  const allowed = [
    "https://my-saas.com/api/users",
    "https://checkout.stripe.com/pay",
    "https://example.com/assets/app.js",
    "https://api.github.com/repos/owner/repo",
  ];
  for (const url of allowed) {
    assert.equal(isIgnoredUrl(url), false, `Expected ${url} to NOT be ignored`);
  }
});
