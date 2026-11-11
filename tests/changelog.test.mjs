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

    assert.equal(latestDashboard?.version, "v0.14.5", "Latest dashboard version should be v0.14.4");
    assert.equal(latestExtension?.version, "v1.0.74", "Latest extension version should be v1.0.74");
    assert.equal(latestMcp?.version, "v0.3.2", "Latest mcp version should be v0.3.2");
  });
});
