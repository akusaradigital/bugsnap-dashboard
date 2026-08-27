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
    assert.match(editor, /JSON\.stringify\(\{ access_token: accessToken, workspaceId:/);
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
    assert.match(background, /fetchUserInfo\(accessToken\)/);
    assert.match(background, /token-login/);
    assert.match(background, /remove\(\['oauth_token', 'oauth_expiry', 'user_email', 'user_avatar'\]\)/);
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
