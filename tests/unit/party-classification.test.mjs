import test from "node:test";
import assert from "node:assert/strict";

// Mirrors getTargetHost / isFirstPartyUrl in src/components/DevToolsPanel.tsx.
// Restated here rather than imported, matching tests/ignored-urls.test.mjs -
// the suite runs plain node --test with no TypeScript loader.
function getTargetHost(siteUrl) {
  if (!siteUrl) return "";
  try {
    const parsed = new URL(siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`);
    return parsed.hostname.replace(/^www\./i, "");
  } catch {
    return "";
  }
}

function isFirstPartyUrl(url, targetHost) {
  if (!url || !targetHost) return true;
  const target = targetHost.toLowerCase();
  try {
    const host = new URL(url, `https://${target}`).hostname.toLowerCase();
    if (!host) return true;
    return host === target || host.endsWith("." + target);
  } catch {
    return true;
  }
}

const target = getTargetHost("https://app.example.com/dashboard");

test("relative API paths are first-party, not third", () => {
  // The regression: new URL("/api/orders") throws, and the old catch returned
  // false, so every genuine first-party call was bucketed 3rd-party.
  assert.equal(isFirstPartyUrl("/api/orders", target), true);
  assert.equal(isFirstPartyUrl("/api/event_logging/v2/batch", target), true);
});

test("absolute same-host URLs are first-party", () => {
  assert.equal(isFirstPartyUrl("https://app.example.com/api/orders", target), true);
});

test("subdomains of the target are first-party", () => {
  assert.equal(isFirstPartyUrl("https://cdn.app.example.com/x.js", target), true);
});

test("unrelated hosts stay third-party", () => {
  assert.equal(isFirstPartyUrl("https://claude.ai/x", target), false);
  assert.equal(isFirstPartyUrl("https://a-cdn.anthropic.com/x", target), false);
});

test("www is normalized on the target side", () => {
  assert.equal(getTargetHost("https://www.example.com"), "example.com");
  assert.equal(isFirstPartyUrl("https://www.example.com/x", getTargetHost("https://example.com")), true);
  assert.equal(isFirstPartyUrl("https://example.com/x", getTargetHost("https://www.example.com")), true);
});

test("hostless schemes come from the page, so first-party", () => {
  assert.equal(isFirstPartyUrl("data:image/png;base64,AAAA", target), true);
  assert.equal(isFirstPartyUrl("blob:https://app.example.com/abc", target), true);
});

test("no target host means no classification, so keep the row visible", () => {
  assert.equal(isFirstPartyUrl("https://claude.ai/x", ""), true);
});

test("a host that merely ends with the target is not first-party", () => {
  // "notexample.com" must not match "example.com" via a naive suffix check.
  assert.equal(isFirstPartyUrl("https://notexample.com/x", "example.com"), false);
});
