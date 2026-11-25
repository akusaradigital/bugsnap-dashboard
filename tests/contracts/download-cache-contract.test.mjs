import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dashboardRoot = path.join(here, "..", "..");
const extensionRoot = path.join(dashboardRoot, "..", "bugsnap-extension");

const read = (...parts) => fs.readFileSync(path.join(...parts), "utf8");

test("google-drive/download delegates Cache-Control to resolveDownloadCacheControl", () => {
  const routeSrc = read(dashboardRoot, "src", "app", "api", "google-drive", "download", "route.ts");
  const helperSrc = read(dashboardRoot, "src", "lib", "download-cache.ts");

  assert.match(routeSrc, /resolveDownloadCacheControl\(cap\)/);
  assert.doesNotMatch(routeSrc, /const cacheControl\s*=\s*"private, max-age=3600/);

  // Public captures must emit public s-maxage; private/restricted must stay private
  assert.match(helperSrc, /if \(cap\.burn_after_read\)\s*\{\s*return "private, no-store";/);
  assert.match(helperSrc, /return "private, max-age=3600, stale-while-revalidate=86400";/);
  assert.match(helperSrc, /return `public, s-maxage=\$\{sMaxAge\}, max-age=3600, stale-while-revalidate=86400`;/);
});

test("extension heartbeat route skips Supabase Auth lookup for non-JWT tokens", () => {
  const hbRoute = read(dashboardRoot, "src", "app", "api", "extension", "heartbeat", "route.ts");
  assert.match(hbRoute, /token\.split\("\."\)\.length === 3/);
});

test("extension background.js throttles heartbeat and avoids duplicate 15m auth polls", () => {
  const bgPath = path.join(extensionRoot, "background.js");
  if (!fs.existsSync(bgPath)) return;
  const bgSrc = fs.readFileSync(bgPath, "utf8");

  assert.match(bgSrc, /SERVER_HEARTBEAT_INTERVAL_MS\s*=\s*12 \* 60 \* 60 \* 1000/);
  assert.match(bgSrc, /shouldSendServerHeartbeat/);
  assert.doesNotMatch(bgSrc, /fetch\(configUrl,\s*\{\s*cache:\s*"no-cache"\s*\}\)/);

  // SESSION_IDLE_ALARM must not re-invoke validateAuthHeartbeat every 15 minutes
  const idleBlockStart = bgSrc.indexOf("if (alarm.name === SESSION_IDLE_ALARM)");
  const idleBlockEnd = bgSrc.indexOf("if (alarm.name === RETENTION_HEARTBEAT_ALARM)");
  assert.ok(idleBlockStart > 0 && idleBlockEnd > idleBlockStart);
  const idleBlock = bgSrc.slice(idleBlockStart, idleBlockEnd);
  assert.doesNotMatch(idleBlock, /validateAuthHeartbeat\(/);

  assert.match(bgSrc, /last_userinfo_check_at/);
  assert.match(bgSrc, /existingExpiry - Date\.now\(\) > 300000/);
});

test("MediaViewer skips doomed Drive thumbnail probe on restricted captures and health caches briefly", () => {
  const mvSrc = read(dashboardRoot, "src", "components", "MediaViewer.tsx");
  const utilsSrc = read(dashboardRoot, "src", "lib", "capture-utils.ts");
  const healthSrc = read(dashboardRoot, "src", "app", "api", "health", "route.ts");

  assert.match(mvSrc, /if \(isImage && needsSig\)/);
  assert.match(utilsSrc, /driveThumbUrl\(driveUrl: string \| null \| undefined, size = 600\)/);
  assert.match(healthSrc, /public, s-maxage=15, stale-while-revalidate=30/);
});

test("captures list prefetches /v/[id] and branding on card hover", () => {
  const capturesPage = read(dashboardRoot, "src", "app", "(app)", "captures", "page.tsx");
  assert.match(capturesPage, /const prefetchCapture = useCallback/);
  assert.match(capturesPage, /router\.prefetch\(`\/v\/\$\{id\}`\)/);
  assert.match(capturesPage, /prefetchCapture\(item\.id\)/);
});
