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
          for (const m of content.matchAll(/lucide:([a-zA-Z0-9_-]+)/g)) used.add(m[1]);
        }
      }
    }

    walk(path.resolve("src"));
    const missing = [...used].filter((icon) => !subset.icons?.[icon] && !subset.aliases?.[icon]);
    assert.deepEqual(
      missing,
      [],
      `Missing icons in src/lib/lucide-icons.json: ${missing.join(", ")}. Run 'node scripts/build-icons.mjs' to update.`
    );
  });

  it("keeps admin quick-access icons aligned with their navigation routes", () => {
    const nav = fs.readFileSync(path.resolve("src/app/admin/adminNav.ts"), "utf8");
    const overview = fs.readFileSync(path.resolve("src/app/admin/page.tsx"), "utf8");
    // The quick-access hub was removed from admin/page.tsx; the guard only applies while
    // such a block exists, so a future re-introduction is still checked for icon alignment.
    const marker = "{/* MASTER ADMIN HUBS QUICK ACCESS */}";
    if (!overview.includes(marker)) return;
    const quickAccess = overview.slice(overview.indexOf(marker));
    const blocks = [...quickAccess.matchAll(/<Link\s+href="(\/admin(?:\/[^\"]*)?)"([\s\S]*?)<\/Link>/g)];
    assert(blocks.length > 0, "Expected admin quick-access links");

    for (const [, href, block] of blocks) {
      const iconExpression = block.match(/<Icon\s+icon=\{([^}]+)\}/)?.[1];
      assert(iconExpression, `Quick-access link '${href}' must use the shared icon registry`);
      const routeBlock = nav.split("export const ADMIN_NAV_HUBS")[0];
      const route = routeBlock.match(new RegExp(`href: "${href.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}",\\s*icon: ([^,]+)`));
      assert(route, `Admin quick-access href '${href}' must exist in ADMIN_NAV_ROUTES`);
      assert.equal(iconExpression.trim(), route[1].trim(), `Quick-access icon for '${href}' must match ADMIN_NAV_ROUTES`);
    }
  });

  it("ensures APP_ICONS registry icons exist in offline bundle", () => {
    const iconsTs = fs.readFileSync(path.resolve("src/lib/icons.ts"), "utf8");
    const icons = [...iconsTs.matchAll(/lucide:([a-zA-Z0-9_-]+)/g)].map((match) => match[1]);
    assert(icons.length > 0, "APP_ICONS should contain icons");
    for (const icon of icons) {
      assert(subset.icons?.[icon] || subset.aliases?.[icon], `Icon '${icon}' from APP_ICONS missing in offline bundle`);
    }
  });
});
