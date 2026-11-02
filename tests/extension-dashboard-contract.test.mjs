import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dashboardRoot = path.join(here, "..");
const extensionRoot = path.join(dashboardRoot, "..", "bugsnap-extension");

const read = (...parts) => fs.readFileSync(path.join(...parts), "utf8");
const hasExtensionSibling = fs.existsSync(path.join(extensionRoot, "background.js"));
const background = hasExtensionSibling ? read(extensionRoot, "background.js") : null;
const editor = hasExtensionSibling ? read(extensionRoot, "editor.js") : null;
const captureRoute = read(dashboardRoot, "src", "app", "api", "extension", "captures", "route.ts");
const contextRoute = read(dashboardRoot, "src", "app", "api", "extension", "workspace-context", "route.ts");

const captureFields = [
  "p_title", "p_type", "p_drive_url", "p_dev_logs", "p_window_size",
  "p_description", "p_duration", "p_os", "p_browser", "p_site_url",
  "p_folder_name", "p_workspace_id",
];

test("extension capture payload matches dashboard whitelist and response", () => {
  for (const field of captureFields) {
    if (background) assert.match(background, new RegExp(`\\b${field}\\s*:`), `extension must send ${field}`);
    assert.match(captureRoute, new RegExp(`\\b${field}\\s*:`), `dashboard must forward ${field}`);
  }
  if (background) {
    assert.match(background, /JSON\.stringify\(\{ access_token: token, capture: payload \}\)/);
    assert.match(background, /const captureId = captureResult\?\.id/);
  }
  assert.match(captureRoute, /p_owner_email:\s*email/);
  assert.doesNotMatch(captureRoute, /p_owner_email:\s*input\.p_owner_email/);
  assert.match(captureRoute, /NextResponse\.json\(\{ id: data \}\)/);
});

test("workspace context request and response match editor consumption", () => {
  if (editor) {
    assert.match(editor, /JSON\.stringify\(\{\s*access_token:\s*accessToken,\s*workspaceId:/);
    assert.match(editor, /Array\.isArray\(context\.workspaces\)/);
    assert.match(editor, /Array\.isArray\(context\.folders\)/);
  }
  assert.match(contextRoute, /access_token\?: unknown; workspaceId\?: unknown/);
  assert.match(contextRoute, /workspaces: list/);
  assert.match(contextRoute, /selectedWorkspaceId/);
  assert.match(contextRoute, /folders/);
});

test("Google token identity is authoritative across dashboard endpoints", () => {
  assert.match(captureRoute, /emailFromGoogleToken\(accessToken\)/);
  assert.match(contextRoute, /emailFromGoogleToken\(accessToken\)/);
  if (background) {
    assert.match(background, /oauth2\/v3\/userinfo/);
    assert.match(background, /drive-connect/);
  }
});

test("expired tokens are refreshed before retrying dashboard requests", () => {
  if (background) {
    assert.match(background, /supabaseResp\.status === 401/);
    assert.match(background, /getValidToken\(true\)/);
  }
  if (editor) {
    assert.match(editor, /response\.status === 401/);
    assert.match(editor, /getValidatedGoogleToken\(true\)/);
  }
});

test("Two-way web and extension auth sync protocol contract", () => {
  const rootLayout = read(dashboardRoot, "src", "app", "layout.tsx");
  const syncBridge = read(dashboardRoot, "src", "components", "ExtensionSyncBridge.tsx");

  // ExtensionSyncBridge in RootLayout exists
  assert.match(rootLayout, /export default function RootLayout/);
  assert.match(rootLayout, /<ExtensionSyncBridge\s*\/>/);

  // Broadcasts sync_session / sync_logout on Supabase auth state change
  assert.match(syncBridge, /supabase\.auth\.onAuthStateChange\(/);
  assert.match(syncBridge, /SIGNED_OUT/);
  assert.match(syncBridge, /action:\s*"sync_session"/);
  assert.match(syncBridge, /action:\s*"sync_logout"/);

  // Handles extension_logout with session cleanup and redirect
  assert.match(syncBridge, /action === "extension_logout"/);
  assert.match(syncBridge, /supabase\.auth\.signOut\(\)/);
  assert.match(syncBridge, /window\.location\.assign\(["']\/login["']\)/);

  // Origin security check: ExtensionSyncBridge only dispatches to window.location.origin (no wildcard)
  assert.match(syncBridge, /window\.postMessage\([\s\S]*?window\.location\.origin/);
  assert.doesNotMatch(syncBridge, /postMessage\([^,]+,\s*["']\*["']\)/);

  // If extension sibling exists, verify content.js, background.js, and popup contracts
  if (hasExtensionSibling) {
    const content = read(extensionRoot, "content.js");
    const popupHtml = read(extensionRoot, "popup.html");
    const popupJs = read(extensionRoot, "popup.js");

    // Two-way sync contracts in content.js and background.js
    assert.match(content, /sync_session/);
    assert.match(content, /sync_logout/);
    assert.match(content, /extension_logged_out/);
    assert.match(content, /sync_web_session/);
    assert.match(content, /disconnect_drive/);

    assert.match(background, /sync_web_session/);
    assert.match(background, /disconnect_drive/);
    assert.match(background, /extension_logged_out/);

    // Origin security check: content.js postMessage only dispatches to BUGSNAP_WEB_ORIGIN
    assert.match(content, /const BUGSNAP_WEB_ORIGIN\b[\s\S]*?https:\/\/bugsnap\.akusaraproject\.my\.id/);
    assert.match(content, /window\.postMessage\([\s\S]*?BUGSNAP_WEB_ORIGIN\)/);
    assert.match(content, /e\.origin !== BUGSNAP_WEB_ORIGIN/);
    assert.doesNotMatch(content, /window\.postMessage\([^,]+,\s*["']\*["']\)/);

    // Expired session state card elements (auth-warning, Your session has expired, btnLogin) match
    assert.match(popupHtml, /id=["']auth-warning["']/, "extension popup must define auth-warning element");
    assert.match(popupHtml, /Your session has expired/, "extension popup must present session expired heading");
    assert.match(popupHtml, /id=["']btn-auth-connect["']/, "extension popup must contain auth connect button");
    assert.match(popupJs, /btnLogin/, "extension popup.js must define btnLogin token");
    assert.match(popupJs, /authWarningTitle:\s*"Your session has expired"/, "extension popup.js must define session expired translation");
    assert.match(popupJs, /authWarning/, "extension popup.js must control authWarning element");
  }
});

