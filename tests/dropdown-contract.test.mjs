import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.resolve(__dirname, "../src");

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath, fileList);
    } else if (/\.(tsx|jsx|ts|js)$/.test(file)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

test("Dropdown Guard: zero unstyled native <select> elements allowed in dashboard src/", () => {
  const files = walkDir(SRC_DIR);
  const violations = [];

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const lines = content.split("\n");
    lines.forEach((line, index) => {
      // Catch any JSX <select ...> tags
      if (/<select(\s|>)/.test(line)) {
        const relativePath = path.relative(SRC_DIR, file).replace(/\\/g, "/");
        violations.push(`${relativePath}:${index + 1}: ${line.trim()}`);
      }
    });
  }

  assert.deepEqual(
    violations,
    [],
    `Found raw native <select> elements in dashboard src/. All dropdowns must use the unified <Dropdown /> component:\n${violations.join("\n")}`
  );
});
