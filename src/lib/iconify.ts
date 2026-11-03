"use client";

import { addCollection, addIcon } from "@iconify/react";
import lucideData from "./lucide-icons.json";
import thirdPartyLogos from "./third-party-logos.json";

// Register curated Lucide icons offline so they render synchronously without API requests
// and without bundling the full 600KB+ icons dataset.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
addCollection(lucideData as any);

// The source SVG strings are preserved verbatim; only the outer SVG wrapper is removed
// by Iconify at render time, retaining defs, gradients, transforms, and path data.
const logos = {
  chrome: thirdPartyLogos.chrome,
  "microsoft-edge": thirdPartyLogos["microsoft-edge"],
  firefox: thirdPartyLogos.firefox,
  "google-drive": thirdPartyLogos["google-drive"],
  "cloudflare-icon": thirdPartyLogos.cloudflare,
  safari: thirdPartyLogos.safari,
  apple: thirdPartyLogos.apple,
  android: thirdPartyLogos.android,
  "slack-icon": thirdPartyLogos.slack,
  windows: thirdPartyLogos.windows,
  linux: thirdPartyLogos["linux-tux"],
};

for (const [name, svg] of Object.entries(logos)) {
  const viewBox = svg.match(/\bviewBox=["']([^"']+)["']/i)?.[1];
  const body = svg.replace(/^\s*<svg\b[^>]*>/i, "").replace(/<\/svg>\s*$/i, "");
  const numbers = viewBox?.split(/[\s,]+/).map(Number);
  if (!numbers || numbers.length !== 4 || numbers.some((value) => !Number.isFinite(value)) || !body) {
    throw new Error(`Invalid vendored logo SVG: ${name}`);
  }
  addIcon(`logos:${name}`, { width: numbers[2], height: numbers[3], body });
}

// Filled folder icon (used when a folder has a custom color — Google Drive style)
addIcon("custom:folder-filled", {
  width: 24,
  height: 24,
  body: `<path fill="currentColor" d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>`,
});

// Ascending 3-bar chart icon matching status dashboard metric
addIcon("custom:chart-bars", {
  width: 24,
  height: 24,
  body: `<rect x="3" y="14" width="4.5" height="7" rx="1.5" fill="currentColor"/><rect x="9.75" y="9" width="4.5" height="12" rx="1.5" fill="currentColor"/><rect x="16.5" y="4" width="4.5" height="17" rx="1.5" fill="currentColor"/>`,
});

export { Icon } from "@iconify/react";
