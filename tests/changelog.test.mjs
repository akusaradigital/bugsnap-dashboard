import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { parseChangelog } from "../src/lib/changelog.ts";

describe("Changelog Parser & Markdown Integrity", () => {
  const changelogPath = path.resolve("CHANGELOG.md");

  it("ensures CHANGELOG.md exists in repository", () => {
    assert(fs.existsSync(changelogPath), "CHANGELOG.md must exist in bugsnap-dashboard root");
  });

  it("parses CHANGELOG.md and covers all three ecosystem projects", () => {
    const raw = fs.readFileSync(changelogPath, "utf8");
    const releases = parseChangelog(raw);

    assert(releases.length >= 3, `Expected at least 3 releases, found ${releases.length}`);

    const projects = new Set(releases.map((r) => r.project));
    assert(projects.has("dashboard"), "Must contain bugsnap-dashboard releases");
    assert(projects.has("extension"), "Must contain bugsnap-extension releases");
    assert(projects.has("mcp"), "Must contain bugsnap-mcp releases");
  });

  it("validates release date and version extraction", () => {
    const raw = fs.readFileSync(changelogPath, "utf8");
    const releases = parseChangelog(raw);

    for (const rel of releases) {
      assert(/^\d{4}-\d{2}-\d{2}$/.test(rel.date), `Release ${rel.id} has invalid date format: '${rel.date}'`);
      assert(rel.version.length > 0, `Release ${rel.id} must have a parsed version`);
      assert(rel.items.length > 0, `Release ${rel.id} must have parsed items`);

      for (const item of rel.items) {
        assert(item.text.length > 0, "Item text cannot be empty");
        assert(
          ["feat", "fix", "perf", "docs", "chore", "other"].includes(item.type),
          `Unknown item type: '${item.type}'`
        );
      }
    }
  });

  it("verifies latest releases match known active versions", () => {
    const raw = fs.readFileSync(changelogPath, "utf8");
    const releases = parseChangelog(raw);

    const latestDashboard = releases.find((r) => r.project === "dashboard");
    const latestExtension = releases.find((r) => r.project === "extension");
    const latestMcp = releases.find((r) => r.project === "mcp");

    // Compare against each project's real version source, not a hardcoded number,
    // so a new release only needs its changelog entry and the source bump.
    const dashboardPkg = JSON.parse(fs.readFileSync(path.resolve("package.json"), "utf8")).version;
    const extensionRoot = path.resolve(process.cwd(), "..", "bugsnap-extension");
    const extensionManifest = JSON.parse(fs.readFileSync(path.join(extensionRoot, "manifest.json"), "utf8")).version;
    const mcpRoot = path.resolve(process.cwd(), "..", "bugsnap-mcp");
    const mcpPkg = JSON.parse(fs.readFileSync(path.join(mcpRoot, "package.json"), "utf8")).version;

    assert.equal(latestDashboard?.version, `v${dashboardPkg}`, `Latest dashboard changelog version should match package.json (${dashboardPkg})`);
    assert.equal(latestExtension?.version, `v${extensionManifest}`, `Latest extension changelog version should match manifest.json (${extensionManifest})`);
    assert.equal(latestMcp?.version, `v${mcpPkg}`, `Latest mcp changelog version should match package.json (${mcpPkg})`);
  });
});
