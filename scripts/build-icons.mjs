import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const full = require("@iconify-json/lucide/icons.json");

const SAFETY_UTILITIES = [
  "copy", "external-link", "trash-2", "trash", "edit", "edit-2", "edit-3", "eye", "eye-off",
  "filter", "maximize", "minimize", "volume", "volume-2", "volume-x", "wifi", "wifi-off",
  "tag", "clock", "alert-circle", "check-check", "calendar", "share-2", "archive"
];

const used = new Set(SAFETY_UTILITIES);

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (/\.(ts|tsx|js|mjs)$/.test(f)) {
      const content = fs.readFileSync(p, "utf8");
      for (const m of content.matchAll(/lucide:([a-zA-Z0-9_-]+)/g)) {
        used.add(m[1]);
      }
    }
  }
}

walk("src");

const subset = {
  prefix: "lucide",
  icons: {},
  aliases: {},
  width: full.width || 24,
  height: full.height || 24,
};

for (const name of used) {
  if (full.icons[name]) {
    subset.icons[name] = full.icons[name];
  } else if (full.aliases && full.aliases[name]) {
    const parent = full.aliases[name].parent;
    subset.aliases[name] = full.aliases[name];
    if (full.icons[parent]) {
      subset.icons[parent] = full.icons[parent];
    } else {
      console.warn("Missing parent for alias:", name, "->", parent);
    }
  } else {
    console.warn("Icon not found in lucide dataset:", name);
  }
}

const outPath = path.resolve("src/lib/lucide-icons.json");
fs.writeFileSync(outPath, JSON.stringify(subset, null, 2), "utf8");
console.log(`Generated ${outPath}: ${Object.keys(subset.icons).length} icons, ${Object.keys(subset.aliases).length} aliases (${(fs.statSync(outPath).size / 1024).toFixed(1)} KB)`);
