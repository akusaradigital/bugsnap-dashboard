import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const srcDir = path.resolve(rootDir, "src");
const i18nDir = path.resolve(srcDir, "lib", "i18n");

// All locale dictionary modules in src/lib/i18n/
const DICT_MODULES = [
  { name: "admin", file: "admin.ts", enKey: "adminEn", idKey: "adminId" },
  { name: "captures", file: "captures.ts", enKey: "capturesEn", idKey: "capturesId" },
  { name: "common", file: "common.ts", enKey: "commonEn", idKey: "commonId" },
  { name: "dashboard", file: "dashboard.ts", enKey: "dashboardEn", idKey: "dashboardId" },
  { name: "devtools", file: "devtools.ts", enKey: "devtoolsEn", idKey: "devtoolsId" },
  { name: "marketing", file: "marketing.ts", enKey: "marketingEn", idKey: "marketingId" },
  { name: "settings", file: "settings.ts", enKey: "settingsEn", idKey: "settingsId" },
];

/**
 * Load dictionary modules asynchronously.
 */
async function loadDictionaries() {
  const loaded = [];
  const aggregateEn = {};
  const aggregateId = {};

  for (const item of DICT_MODULES) {
    const filePath = path.join(i18nDir, item.file);
    const mod = await import(pathToFileURL(filePath).href);
    const enDict = mod[item.enKey];
    const idDict = mod[item.idKey];

    assert(enDict, `Expected ${item.enKey} to be exported from ${item.file}`);
    assert(idDict, `Expected ${item.idKey} to be exported from ${item.file}`);

    loaded.push({
      ...item,
      enDict,
      idDict,
      enKeys: Object.keys(enDict),
      idKeys: Object.keys(idDict),
    });

    Object.assign(aggregateEn, enDict);
    Object.assign(aggregateId, idDict);
  }

  return { loaded, aggregateEn, aggregateId };
}

/**
 * Recursively scan directory for files matching extension.
 */
function walkFiles(dir, extensions = [".ts", ".tsx", ".js", ".jsx"]) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(fullPath, extensions));
    } else if (entry.isFile() && extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Scan source files for t('key') and t("key") calls.
 * Works across newlines and character offsets.
 */
function scanSourceForTCalls(files) {
  const calls = new Map(); // key -> [{ file, line, call }]

  // Matches t('key') or t("key") or t(`key`)
  // Supports multiline whitespace between t and quote
  const tRegex = /\bt\s*\(\s*(['"`])([a-zA-Z0-9_.-]+)\1/g;

  for (const filePath of files) {
    const relPath = path.relative(rootDir, filePath).split(path.sep).join("/");
    const content = fs.readFileSync(filePath, "utf8");

    let match;
    while ((match = tRegex.exec(content)) !== null) {
      const key = match[2];
      // Compute 1-indexed line number
      const line = content.slice(0, match.index).split("\n").length;
      if (!calls.has(key)) {
        calls.set(key, []);
      }
      calls.get(key).push({
        file: relPath,
        line,
        call: match[0],
      });
    }
  }

  return calls;
}

describe("i18n Strict Parity & Missing Keys Quality Gate", async () => {
  const { loaded, aggregateEn, aggregateId } = await loadDictionaries();

  describe("Per-Module 100% 1:1 Key Parity between 'en' and 'id'", () => {
    for (const mod of loaded) {
      it(`module '${mod.name}' (${mod.file}) has 100% 1:1 key parity`, () => {
        const missingInId = mod.enKeys.filter((k) => !(k in mod.idDict));
        const missingInEn = mod.idKeys.filter((k) => !(k in mod.enDict));

        assert.deepEqual(
          missingInId,
          [],
          `Keys present in 'en' but missing in 'id' for module '${mod.name}':\n` +
            missingInId.map((k) => `  - ${k}`).join("\n")
        );

        assert.deepEqual(
          missingInEn,
          [],
          `Keys present in 'id' but missing in 'en' for module '${mod.name}':\n` +
            missingInEn.map((k) => `  - ${k}`).join("\n")
        );

        assert.equal(
          mod.enKeys.length,
          mod.idKeys.length,
          `Key count mismatch in module '${mod.name}': en=${mod.enKeys.length}, id=${mod.idKeys.length}`
        );
      });

      it(`module '${mod.name}' contains only non-empty string values`, () => {
        const emptyEn = Object.entries(mod.enDict).filter(
          ([, v]) => typeof v !== "string" || v.trim().length === 0
        );
        const emptyId = Object.entries(mod.idDict).filter(
          ([, v]) => typeof v !== "string" || v.trim().length === 0
        );

        assert.deepEqual(
          emptyEn,
          [],
          `Empty translation values in en module '${mod.name}': ${emptyEn.map(([k]) => k).join(", ")}`
        );
        assert.deepEqual(
          emptyId,
          [],
          `Empty translation values in id module '${mod.name}': ${emptyId.map(([k]) => k).join(", ")}`
        );
      });
    }
  });

  describe("Global Namespace & Aggregate Integrity", () => {
    it("ensures zero duplicate keys across different dictionary modules", () => {
      const keyOwners = new Map();
      const collisions = [];

      for (const mod of loaded) {
        for (const k of mod.enKeys) {
          if (keyOwners.has(k)) {
            collisions.push({ key: k, modules: [keyOwners.get(k), mod.name] });
          } else {
            keyOwners.set(k, mod.name);
          }
        }
      }

      assert.deepEqual(
        collisions,
        [],
        `Detected key collisions across i18n modules:\n` +
          collisions.map((c) => `  - ${c.key} in [${c.modules.join(", ")}]`).join("\n")
      );
    });

    it("ensures 100% 1:1 parity in aggregate en and id dictionaries", () => {
      const allEnKeys = Object.keys(aggregateEn);
      const allIdKeys = Object.keys(aggregateId);

      const missingInId = allEnKeys.filter((k) => !(k in aggregateId));
      const missingInEn = allIdKeys.filter((k) => !(k in aggregateEn));

      assert.deepEqual(
        missingInId,
        [],
        `Keys missing in aggregate 'id' dictionary:\n` + missingInId.map((k) => `  - ${k}`).join("\n")
      );

      assert.deepEqual(
        missingInEn,
        [],
        `Keys missing in aggregate 'en' dictionary:\n` + missingInEn.map((k) => `  - ${k}`).join("\n")
      );

      assert.equal(
        allEnKeys.length,
        allIdKeys.length,
        `Aggregate key count mismatch: en=${allEnKeys.length}, id=${allIdKeys.length}`
      );
    });
  });

  describe("Source Code Call Scan (t('key') and t(\"key\"))", () => {
    const srcFiles = walkFiles(srcDir);
    const referencedCalls = scanSourceForTCalls(srcFiles);

    it(`referenced keys in src/ (${referencedCalls.size} unique keys) must all exist in en and id dictionaries`, () => {
      const missingKeysEn = [];
      const missingKeysId = [];

      for (const [key, callSites] of referencedCalls.entries()) {
        const firstSite = `${callSites[0].file}:${callSites[0].line}`;
        const extraSites = callSites.length > 1 ? ` (+${callSites.length - 1} more)` : "";
        const locationInfo = `${firstSite}${extraSites}`;

        if (!(key in aggregateEn)) {
          missingKeysEn.push({ key, location: locationInfo });
        }
        if (!(key in aggregateId)) {
          missingKeysId.push({ key, location: locationInfo });
        }
      }

      assert.deepEqual(
        missingKeysEn,
        [],
        `Found ${missingKeysEn.length} key(s) used via t(...) in src/ that are MISSING in 'en' dictionary:\n` +
          missingKeysEn.map((m) => `  - "${m.key}" at ${m.location}`).join("\n")
      );

      assert.deepEqual(
        missingKeysId,
        [],
        `Found ${missingKeysId.length} key(s) used via t(...) in src/ that are MISSING in 'id' dictionary:\n` +
          missingKeysId.map((m) => `  - "${m.key}" at ${m.location}`).join("\n")
      );
    });
  });

  describe("Dynamic i18n Key Registry Verification", () => {
    it("ensures TAB_TITLES keys in settings/constants.ts exist in en and id", () => {
      const constantsFile = path.join(srcDir, "app", "(app)", "settings", "constants.ts");
      const content = fs.readFileSync(constantsFile, "utf8");
      const keys = [...content.matchAll(/(?:title|subtitle):\s*["']([^"']+)["']/g)].map((m) => m[1]);

      assert(keys.length > 0, "Expected to find TAB_TITLES keys");
      for (const key of keys) {
        assert(key in aggregateEn, `TAB_TITLES key "${key}" missing in 'en' dictionary`);
        assert(key in aggregateId, `TAB_TITLES key "${key}" missing in 'id' dictionary`);
      }
    });

    it("ensures ADMIN_NAV_ROUTES and ADMIN_NAV_HUBS titleKey exist in en and id", () => {
      const navFile = path.join(srcDir, "app", "admin", "adminNav.ts");
      const content = fs.readFileSync(navFile, "utf8");
      const keys = [...content.matchAll(/titleKey:\s*["']([^"']+)["']/g)].map((m) => m[1]);

      assert(keys.length > 0, "Expected to find adminNav titleKey entries");
      for (const key of keys) {
        assert(key in aggregateEn, `adminNav titleKey "${key}" missing in 'en' dictionary`);
        assert(key in aggregateId, `adminNav titleKey "${key}" missing in 'id' dictionary`);
      }
    });

    it("ensures landing page FAQ question and answer keys exist in en and id", () => {
      const pageFile = path.join(srcDir, "app", "page.tsx");
      const content = fs.readFileSync(pageFile, "utf8");
      const keys = [...content.matchAll(/(?:q|a):\s*["']([^"']+)["']/g)].map((m) => m[1]);

      assert(keys.length > 0, "Expected to find FAQ keys in landing page");
      for (const key of keys) {
        assert(key in aggregateEn, `FAQ key "${key}" missing in 'en' dictionary`);
        assert(key in aggregateId, `FAQ key "${key}" missing in 'id' dictionary`);
      }
    });

    it("ensures HotkeyCommandBar action keys exist in en and id", () => {
      const barFile = path.join(srcDir, "components", "site", "HotkeyCommandBar.tsx");
      const content = fs.readFileSync(barFile, "utf8");
      const keys = [...content.matchAll(/(?:labelKey|descKey|flashKey):\s*["']([^"']+)["']/g)].map((m) => m[1]);

      assert(keys.length > 0, "Expected to find HotkeyCommandBar keys");
      for (const key of keys) {
        assert(key in aggregateEn, `HotkeyCommandBar key "${key}" missing in 'en' dictionary`);
        assert(key in aggregateId, `HotkeyCommandBar key "${key}" missing in 'id' dictionary`);
      }
    });

    it("ensures Extension tutorial and browser guide keys exist in en and id", () => {
      const extFile = path.join(srcDir, "app", "extension", "ExtensionContent.tsx");
      const content = fs.readFileSync(extFile, "utf8");
      const keys = [...content.matchAll(/(?:step\dKey|tipKey|nameKey):\s*["']([^"']+)["']/g)].map((m) => m[1]);

      assert(keys.length > 0, "Expected to find ExtensionContent tutorial keys");
      for (const key of keys) {
        assert(key in aggregateEn, `ExtensionContent key "${key}" missing in 'en' dictionary`);
        assert(key in aggregateId, `ExtensionContent key "${key}" missing in 'id' dictionary`);
      }
    });
  });
});
