// Visual audit of public pages: horizontal overflow, broken images, console errors.
// Run against the local dev server only (never production). Writes a JSON report
// under test-results/ (gitignored).
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BASE = process.env.AUDIT_BASE_URL || "http://localhost:3000";

const PAGES = [
  "/", "/features", "/how-it-works", "/extension", "/extension/firefox",
  "/solutions", "/blog", "/docs", "/docs/mcp", "/docs/integrations",
  "/visual-compare", "/about", "/help", "/security", "/status",
  "/contact", "/privacy", "/terms", "/login",
];

const VIEWPORTS = [
  { name: "360", width: 360, height: 740 },
  { name: "414", width: 414, height: 896 },
  { name: "768", width: 768, height: 1024 },
  { name: "1440", width: 1440, height: 900 },
];

const browser = await chromium.launch({ headless: true });
const report = [];

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  for (const route of PAGES) {
    const page = await context.newPage();
    const consoleErrors = [];
    page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 200)); });
    const entry = { route, viewport: vp.name, overflowPx: 0, brokenImages: [], consoleErrors: [], status: null };
    try {
      const res = await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 60000 });
      entry.status = res?.status() ?? null;
      const metrics = await page.evaluate(() => {
        const doc = document.documentElement;
        const overflowPx = Math.max(0, doc.scrollWidth - doc.clientWidth);
        const broken = [...document.images]
          .filter((img) => img.complete && img.naturalWidth === 0 && img.getAttribute("src"))
          .map((img) => img.getAttribute("src"));
        return { overflowPx, broken };
      });
      entry.overflowPx = metrics.overflowPx;
      entry.brokenImages = metrics.broken;
    } catch (err) {
      entry.status = "error";
      entry.error = String(err).slice(0, 200);
    }
    entry.consoleErrors = consoleErrors;
    report.push(entry);
    await page.close();
  }
  await context.close();
}

await browser.close();

const outDir = path.join(ROOT, "test-results");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "audit-public-pages.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

const problems = report.filter((r) => r.overflowPx > 0 || r.brokenImages.length || r.consoleErrors.length || r.status !== 200);
console.log(`Audited ${report.length} page/viewport combinations. Problems: ${problems.length}. Report: ${outFile}`);
for (const p of problems) {
  console.log(`- ${p.route} @${p.viewport}: status=${p.status} overflow=${p.overflowPx}px broken=${p.brokenImages.length} consoleErrors=${p.consoleErrors.length}`);
}
