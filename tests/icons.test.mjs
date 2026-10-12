import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const subset = require("../src/lib/lucide-icons.json");

describe("Icon Collection Integrity", () => {
  it("includes all lucide icons referenced in src/", () => {
    const used = new Set();
    function walk(dir) {
      for (const f of fs.readdirSync(dir)) {
        const p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) {
          walk(p);
        } else if (/\.(ts|tsx)$/.test(f)) {
          const content = fs.readFileSync(p, "utf8");
          for (const m of content.matchAll(/lucide:([a-zA-Z0-9_-]+)/g)) {
            used.add(m[1]);
          }
        }
      }
    }

    walk(path.resolve("src"));

    const missing = [];
    for (const icon of used) {
      const hasIcon = Boolean(subset.icons && subset.icons[icon]);
      const hasAlias = Boolean(subset.aliases && subset.aliases[icon]);
      if (!hasIcon && !hasAlias) {
        missing.push(icon);
      }
    }

    assert.deepEqual(
      missing,
      [],
      `Missing icons in src/lib/lucide-icons.json: ${missing.join(", ")}. Run 'node scripts/build-icons.mjs' to update.`
    );
  });

  it("ensures APP_ICONS registry icons exist in offline bundle", () => {
    const iconsTs = fs.readFileSync(path.resolve("src/lib/icons.ts"), "utf8");
    const icons = [];
    for (const m of iconsTs.matchAll(/lucide:([a-zA-Z0-9_-]+)/g)) {
      icons.push(m[1]);
    }
    assert(icons.length > 0, "APP_ICONS should contain icons");
    for (const icon of icons) {
      const hasIcon = Boolean(subset.icons && subset.icons[icon]);
      const hasAlias = Boolean(subset.aliases && subset.aliases[icon]);
      assert(hasIcon || hasAlias, `Icon '${icon}' from APP_ICONS missing in offline bundle`);
    }
  });
});
