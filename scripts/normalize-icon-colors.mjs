// One-time audit fix: normalize every generic UI icon to the BugSnap brand
// palette (BRAND.md) so no icon carries an arbitrary/off-brand hardcoded
// color. Semantic icons (error/warning/success) keep their meaning; every
// other icon becomes brand blue. Third-party brand logos (chrome, slack,
// windows, etc.) are excluded - those must keep their real multi-color marks.
import fs from "node:fs";
import path from "node:path";

const ICONS_DIR = path.resolve("public/icons");

const BLUE = "#2563EB";
const RED = "#EF4444";
const AMBER = "#F59E0B";
const GREEN = "#89BD49";

// Files intentionally excluded (third-party multi-color brand logos, or
// already-correct single-purpose assets handled separately).
const SKIP = new Set([
  "apple.svg", "logos-apple.svg", "logos-windows.svg", "windows.svg",
  "android.svg", "logos-android.svg",
  "chrome.svg", "chrome-web-store.svg", "logos-chrome.svg", "logos-chrome-web-store.svg",
  "cloudflare.svg", "google.svg",
  "linux.svg", "linux-tux.svg",
  "logos-safari.svg", "safari.svg", "slack.svg",
  "lucide-chrome.svg", // this is actually a Chrome-browser themed icon color, re-mapped separately below
  "custom-folder-filled.svg", // user-selectable folder color, not a UI icon
  "lucide-x-white.svg", // intentional white variant for dark buttons
]);

// Semantic overrides: icon file -> target color
const SEMANTIC = {
  // Error / destructive
  "lucide-ban.svg": RED,
  "lucide-shield-alert.svg": RED,
  "trash.svg": RED,
  // Warning
  "lucide-circle-alert.svg": AMBER, // shared by alert-triangle / alert-circle / circle-alert
  "lucide-crown.svg": AMBER,
  // Success
  "check.svg": GREEN,
};

let changed = 0;
let skipped = 0;

for (const file of fs.readdirSync(ICONS_DIR)) {
  if (!file.endsWith(".svg")) continue;
  if (SKIP.has(file)) { skipped++; continue; }

  const fullPath = path.join(ICONS_DIR, file);
  let content = fs.readFileSync(fullPath, "utf8");

  // Only touch single-color (monochrome) icons: skip any file with more
  // than one distinct non-"none" hex color (multi-color brand marks).
  const colors = new Set(
    [...content.matchAll(/(?:stroke|fill)="(#[0-9A-Fa-f]{3,8})"/g)]
      .map((m) => m[1].toLowerCase())
      .filter((c) => c !== "none")
  );
  if (colors.size > 1) { skipped++; continue; }
  if (colors.size === 0) { skipped++; continue; }

  const target = SEMANTIC[file] || BLUE;
  const before = content;
  content = content.replace(/(?:stroke|fill)="#[0-9A-Fa-f]{3,8}"/g, (m) => {
    const isFill = m.startsWith("fill");
    return `${isFill ? "fill" : "stroke"}="${target}"`;
  });

  if (content !== before) {
    fs.writeFileSync(fullPath, content, "utf8");
    changed++;
  }
}

console.log(`Normalized ${changed} icon file(s), skipped ${skipped} (brand logos / multi-color / excluded).`);
