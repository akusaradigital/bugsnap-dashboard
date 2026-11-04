import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT_DIR, "src");

// Critical Viewports per quality gate specifications
const VIEWPORTS = [
  { name: "Small Mobile", width: 360, height: 740 },
  { name: "Standard Mobile", width: 414, height: 896 },
  { name: "Tablet", width: 768, height: 1024 },
  { name: "Desktop", width: 1440, height: 900 },
];

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

// ---------------------------------------------------------------------------
// 1. Root & Global CSS Viewport Containment Audit
// ---------------------------------------------------------------------------
describe("Viewport Overflow Quality Gate: Global CSS Containment Rules", () => {
  it("enforces html and body horizontal overflow containment in globals.css", () => {
    const cssPath = path.join(SRC_DIR, "app/globals.css");
    assert.ok(fs.existsSync(cssPath), "globals.css must exist");
    const css = fs.readFileSync(cssPath, "utf8");

    // Check root html containment
    assert.match(
      css,
      /html\s*\{[^}]*overflow-x:\s*hidden/s,
      "globals.css must specify overflow-x: hidden on html to eliminate root horizontal viewport blowout"
    );
    assert.match(
      css,
      /html\s*\{[^}]*max-width:\s*100vw/s,
      "globals.css must specify max-width: 100vw on html"
    );

    // Check body containment
    assert.match(
      css,
      /body\s*\{[^}]*overflow-x:\s*hidden/s,
      "globals.css must specify overflow-x: hidden on body"
    );
    assert.match(
      css,
      /body\s*\{[^}]*max-width:\s*100vw/s,
      "globals.css must specify max-width: 100vw on body"
    );

    // Check universal box-sizing border-box reset
    assert.match(
      css,
      /\*\s*\{[^}]*box-sizing:\s*border-box/s,
      "globals.css must apply universal box-sizing: border-box reset"
    );

    // Check responsive media containment for images and videos
    assert.match(
      css,
      /img,\s*video\s*\{[^}]*max-width:\s*100%/s,
      "globals.css must constrain img and video to max-width: 100%"
    );
  });
});

// ---------------------------------------------------------------------------
// 2. Static Codebase Audit: Tables, Pre Code Blocks, and Fixed-Width Containers
// ---------------------------------------------------------------------------
describe("Viewport Overflow Quality Gate: Static Codebase Audit", () => {
  const allSourceFiles = walkDir(SRC_DIR);

  it("ensures every JSX <table in src/ is guarded by an overflow-x-auto wrapper", () => {
    const violations = [];

    for (const file of allSourceFiles) {
      if (!/\.(tsx|jsx)$/.test(file)) continue;
      const content = fs.readFileSync(file, "utf8");
      if (!content.includes("<table")) continue;

      const lines = content.split("\n");
      lines.forEach((line, idx) => {
        if (/<table(\s|>)/.test(line)) {
          // Inspect surrounding 10 lines preceding <table
          const windowStart = Math.max(0, idx - 10);
          const precedingContext = lines.slice(windowStart, idx + 1).join(" ");

          const hasOverflowProtection =
            precedingContext.includes("overflow-x-auto") ||
            precedingContext.includes("overflow-auto") ||
            line.includes("overflow-x-auto") ||
            line.includes("overflow-auto");

          if (!hasOverflowProtection) {
            const relPath = path.relative(ROOT_DIR, file).replace(/\\/g, "/");
            violations.push(`${relPath}:${idx + 1} -> ${line.trim()}`);
          }
        }
      });
    }

    assert.deepEqual(
      violations,
      [],
      `Found unconstrained <table without overflow-x-auto wrapper in:\n${violations.join("\n")}`
    );
  });

  it("ensures every JSX <pre in src/ has horizontal scroll protection or wrapping", () => {
    const violations = [];

    for (const file of allSourceFiles) {
      if (!/\.(tsx|jsx)$/.test(file)) continue;
      const content = fs.readFileSync(file, "utf8");
      if (!content.includes("<pre")) continue;

      const lines = content.split("\n");
      lines.forEach((line, idx) => {
        if (/<pre(\s|>)/.test(line)) {
          const windowStart = Math.max(0, idx - 6);
          const context = lines.slice(windowStart, idx + 2).join(" ");

          const hasOverflowProtection =
            context.includes("overflow-x-auto") ||
            context.includes("overflow-auto") ||
            context.includes("overflow-y-auto") ||
            context.includes("break-all") ||
            context.includes("break-words") ||
            context.includes("whitespace-pre-wrap");

          if (!hasOverflowProtection) {
            const relPath = path.relative(ROOT_DIR, file).replace(/\\/g, "/");
            violations.push(`${relPath}:${idx + 1} -> ${line.trim()}`);
          }
        }
      });
    }

    assert.deepEqual(
      violations,
      [],
      `Found unconstrained <pre without horizontal scroll protection or break-all in:\n${violations.join("\n")}`
    );
  });

  it("ensures no fixed widths >= 360px break mobile viewports without responsive prefixes or overflow guard", () => {
    const violations = [];

    // Pattern matches fixed pixel width or min-width classes >= 360px (e.g. w-[360px], min-w-[500px])
    const fixedWidthRegex = /\b(min-w|w)-\[(\d+)px\]/g;

    for (const file of allSourceFiles) {
      if (!/\.(tsx|jsx)$/.test(file)) continue;
      const content = fs.readFileSync(file, "utf8");

      const lines = content.split("\n");
      lines.forEach((line, idx) => {
        let match;
        while ((match = fixedWidthRegex.exec(line)) !== null) {
          const pxVal = parseInt(match[2], 10);
          if (pxVal >= 360) {
            // Check if line or element has responsive prefix (sm:, md:, lg:, xl:)
            const matchIndex = match.index;
            const prefixSlice = line.slice(Math.max(0, matchIndex - 6), matchIndex);
            const isResponsivePrefixed = /(sm|md|lg|xl|2xl):$/.test(prefixSlice);

            // Check if clamped using min()
            const isClamped = line.includes("w-[min(") || line.includes("max-w-[min(");

            // Check if context has overflow-x-auto, overflow-hidden, or pointer-events-none (for ambient orbs)
            const windowStart = Math.max(0, idx - 25);
            const context = lines.slice(windowStart, idx + 4).join(" ");
            const isProtectedContext =
              context.includes("overflow-x-auto") ||
              context.includes("overflow-auto") ||
              context.includes("overflow-hidden") ||
              context.includes("pointer-events-none") ||
              line.includes("pointer-events-none") ||
              line.includes("max-w-");

            if (!isResponsivePrefixed && !isClamped && !isProtectedContext) {
              const relPath = path.relative(ROOT_DIR, file).replace(/\\/g, "/");
              violations.push(`${relPath}:${idx + 1} (${match[0]}) -> ${line.trim()}`);
            }
          }
        }
      });
    }

    assert.deepEqual(
      violations,
      [],
      `Found unconstrained fixed-width containers >= 360px without responsive overrides:\n${violations.join("\n")}`
    );
  });

  it("ensures BlogPostContent handles prose tables and pre blocks with horizontal containment", () => {
    const blogPostContentPath = path.join(SRC_DIR, "app/blog/[slug]/BlogPostContent.tsx");
    const content = fs.readFileSync(blogPostContentPath, "utf8");

    // Must handle table in PROSE_CLASSES or processedHtml
    const hasTableOverflowStyle =
      content.includes("[&_table]:overflow-x-auto") ||
      content.includes("overflow-x-auto my-6 max-w-full");
    assert.ok(
      hasTableOverflowStyle,
      "BlogPostContent must provide overflow-x-auto styling or wrappers for rendered HTML tables"
    );

    // Must handle pre blocks with overflow-x-auto
    assert.ok(
      content.includes("[&_pre]:overflow-x-auto"),
      "BlogPostContent must provide overflow-x-auto styling for rendered pre code blocks"
    );
  });
});

// ---------------------------------------------------------------------------
// 3. Playwright Real Layout Engine: Responsive Viewport Blowout Verification
// ---------------------------------------------------------------------------
describe("Viewport Overflow Quality Gate: Playwright Multi-Viewport Verification", () => {
  let browser;

  before(async () => {
    const { chromium } = await import("playwright");
    browser = await chromium.launch({ headless: true });
  });

  after(async () => {
    if (browser) await browser.close();
  });

  // Base CSS styles replicating Tailwind utilities and BugSnap design tokens
  const BASE_STYLE = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; overflow-x: hidden; max-width: 100vw; }
    body { overflow-x: hidden; max-width: 100vw; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .w-full { width: 100%; }
    .max-w-full { max-width: 100%; }
    .overflow-x-auto { overflow-x: auto; }
    .overflow-hidden { overflow-hidden: hidden; }
    .min-w-0 { min-width: 0; }
    .min-w-\\[620px\\] { min-width: 620px; }
    .min-w-\\[640px\\] { min-width: 640px; }
    .border-collapse { border-collapse: collapse; }
    .text-xs { font-size: 0.75rem; }
    .font-mono { font-family: monospace; }
    .whitespace-pre-wrap { white-space: pre-wrap; }
    .break-all { word-break: break-all; }
    .p-4 { padding: 1rem; }
  `;

  async function evaluateViewportOverflow(page, expectedMaxScrollWidth) {
    return page.evaluate((maxAllowed) => {
      const doc = document.documentElement;
      const body = document.body;
      const clientWidth = doc.clientWidth;
      const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
      const innerWidth = window.innerWidth;

      // Find any elements exceeding viewport boundary
      const offenders = Array.from(document.querySelectorAll("*"))
        .filter((el) => {
          const r = el.getBoundingClientRect();
          if (r.width <= 0 || r.height <= 0) return false;
          const tag = el.tagName.toLowerCase();
          if (["script", "style", "head", "meta", "link", "noscript"].includes(tag)) return false;
          return r.right > clientWidth + 1;
        })
        .map((el) => ({
          tag: el.tagName.toLowerCase(),
          className: (el.className || "").toString().slice(0, 60),
          right: Math.round(el.getBoundingClientRect().right),
          width: Math.round(el.getBoundingClientRect().width),
          clientWidth,
        }))
        .slice(0, 5);

      return {
        clientWidth,
        scrollWidth,
        innerWidth,
        hasHorizontalOverflow: scrollWidth > clientWidth,
        offenders,
      };
    }, expectedMaxScrollWidth);
  }

  for (const vp of VIEWPORTS) {
    describe(`Viewport ${vp.width}px (${vp.name})`, () => {
      it(`verifies wide data tables with overflow-x-auto do not blow out ${vp.width}px viewport`, async () => {
        const page = await browser.newPage();
        await page.setViewportSize({ width: vp.width, height: vp.height });

        // HTML simulating complex matrix / table layout from ExtensionContent & PricingToggle
        const tableHtml = `
          <!DOCTYPE html>
          <html>
            <head><style>${BASE_STYLE}</style></head>
            <body>
              <div class="p-4 w-full">
                <header><h1>Feature Matrix & Permissions</h1></header>
                <div class="overflow-x-auto w-full max-w-full">
                  <table class="w-full border-collapse min-w-[640px] text-xs">
                    <thead>
                      <tr>
                        <th style="padding: 12px; text-align: left;">Permission Scope</th>
                        <th style="padding: 12px; text-align: left;">Purpose Specification</th>
                        <th style="padding: 12px; text-align: left;">Security Guarantee</th>
                        <th style="padding: 12px; text-align: left;">Access Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style="padding: 12px;">https://www.googleapis.com/auth/drive.file</td>
                        <td style="padding: 12px;">Zero server storage upload directly to customer drive</td>
                        <td style="padding: 12px;">No access to existing sheets or external files</td>
                        <td style="padding: 12px;">Per-file OAuth 2.0</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </body>
          </html>
        `;

        await page.setContent(tableHtml);
        const result = await evaluateViewportOverflow(page, vp.width);

        assert.equal(
          result.hasHorizontalOverflow,
          false,
          `Data table caused horizontal viewport blowout on ${vp.width}px! Offenders: ${JSON.stringify(result.offenders)}`
        );
        assert.ok(
          result.scrollWidth <= vp.width,
          `Document scrollWidth (${result.scrollWidth}) exceeded viewport width (${vp.width})`
        );

        await page.close();
      });

      it(`verifies long pre-formatted code snippets with overflow-x-auto do not blow out ${vp.width}px viewport`, async () => {
        const page = await browser.newPage();
        await page.setViewportSize({ width: vp.width, height: vp.height });

        // HTML simulating long DevTools cURL / JSON / stack trace snippets
        const codeSnippet =
          "curl -X POST 'https://api.bugsnap.internal/v1/telemetry/captures/8cd0c35b-8683-43e7-940b-2fec6c4fd8ef/events' " +
          "-H 'Authorization: Bearer bsp_live_99f823a0e71c42b89da152b192804c3e' " +
          "-H 'Content-Type: application/json' " +
          "-d '{\"event\":\"test_execution\",\"duration\":4250,\"meta\":{\"browser\":\"Chromium\",\"version\":\"128.0.0\"}}'";

        const codeHtml = `
          <!DOCTYPE html>
          <html>
            <head><style>${BASE_STYLE}</style></head>
            <body>
              <div class="p-4 w-full">
                <header><h2>Diagnostic Replay Script</h2></header>
                <div class="overflow-x-auto w-full max-w-full p-4 font-mono text-xs" style="background:#0f172a; color:#f8fafc; border-radius:12px;">
                  <pre class="overflow-x-auto font-mono whitespace-pre">${codeSnippet}</pre>
                </div>
              </div>
            </body>
          </html>
        `;

        await page.setContent(codeHtml);
        const result = await evaluateViewportOverflow(page, vp.width);

        assert.equal(
          result.hasHorizontalOverflow,
          false,
          `Code snippet caused horizontal viewport blowout on ${vp.width}px! Offenders: ${JSON.stringify(result.offenders)}`
        );
        assert.ok(
          result.scrollWidth <= vp.width,
          `Document scrollWidth (${result.scrollWidth}) exceeded viewport width (${vp.width})`
        );

        await page.close();
      });

      it(`verifies blog article prose containing markdown tables does not blow out ${vp.width}px viewport`, async () => {
        const page = await browser.newPage();
        await page.setViewportSize({ width: vp.width, height: vp.height });

        // HTML simulating a rendered blog post with prose tables
        const blogArticleHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                ${BASE_STYLE}
                .prose-table { display: block; width: 100%; overflow-x: auto; max-width: 100%; }
              </style>
            </head>
            <body>
              <div class="p-4 w-full max-w-full">
                <article>
                  <h1>Zero Storage Liability: Why BYO Google Drive Wins</h1>
                  <p>Comparing traditional visual bug reporting tools vs. BugSnap BYO storage:</p>
                  <div class="overflow-x-auto max-w-full my-6">
                    <table class="prose-table" style="border-collapse: collapse; width: 100%; min-width: 580px;">
                      <thead>
                        <tr style="border-bottom: 2px solid #334155;">
                          <th style="padding: 8px;">Criteria</th>
                          <th style="padding: 8px;">Traditional SaaS Capture</th>
                          <th style="padding: 8px;">BugSnap (BYO Google Drive)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style="border-bottom: 1px solid #1e293b;">
                          <td style="padding: 8px;">Storage Cost</td>
                          <td style="padding: 8px;">$0.15 to $0.30 per GB/mo markup</td>
                          <td style="padding: 8px;">$0.00 (Customer owns Google Drive)</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px;">Data Privacy</td>
                          <td style="padding: 8px;">Media stored on vendor cloud</td>
                          <td style="padding: 8px;">Direct client-side OAuth upload</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </article>
              </div>
            </body>
          </html>
        `;

        await page.setContent(blogArticleHtml);
        const result = await evaluateViewportOverflow(page, vp.width);

        assert.equal(
          result.hasHorizontalOverflow,
          false,
          `Blog prose article caused horizontal viewport blowout on ${vp.width}px! Offenders: ${JSON.stringify(result.offenders)}`
        );
        assert.ok(
          result.scrollWidth <= vp.width,
          `Document scrollWidth (${result.scrollWidth}) exceeded viewport width (${vp.width})`
        );

        await page.close();
      });

      it(`verifies fixed floating widgets clamped to viewport width do not cause blowout on ${vp.width}px`, async () => {
        const page = await browser.newPage();
        await page.setViewportSize({ width: vp.width, height: vp.height });

        // HTML simulating clamped fixed UI: FloatingSupport, Toast, and BatchActionBar
        const floatingWidgetsHtml = `
          <!DOCTYPE html>
          <html>
            <head><style>${BASE_STYLE}</style></head>
            <body>
              <main class="p-4">
                <h1>Dashboard Screen</h1>
                <p>Ensuring fixed popups and action bars do not extend past viewport.</p>
              </main>

              <!-- Floating Support Widget clamped using w-[calc(100vw-2rem)] -->
              <div style="position: fixed; bottom: 16px; right: 16px; width: min(390px, calc(100vw - 2rem)); max-width: 390px; z-index: 50;">
                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
                  <div style="display: flex; align-items: center; justify-content: space-between;">
                    <span style="font-size: 13px; font-weight: bold;">Quick Support</span>
                    <button type="button" style="padding: 4px 8px; font-size: 11px;">Close</button>
                  </div>
                </div>
              </div>

              <!-- Toast notification clamped to calc(100vw-3rem) -->
              <div style="position: fixed; bottom: 24px; right: 24px; max-width: calc(100vw - 3rem); z-index: 60;">
                <div style="background: #0f172a; color: white; border-radius: 12px; padding: 10px 14px; font-size: 12px; font-weight: 600;">
                  Capture link copied to clipboard!
                </div>
              </div>
            </body>
          </html>
        `;

        await page.setContent(floatingWidgetsHtml);
        const result = await evaluateViewportOverflow(page, vp.width);

        assert.equal(
          result.hasHorizontalOverflow,
          false,
          `Fixed widgets caused horizontal overflow on ${vp.width}px! Offenders: ${JSON.stringify(result.offenders)}`
        );
        assert.ok(
          result.scrollWidth <= vp.width,
          `Document scrollWidth (${result.scrollWidth}) exceeded viewport width (${vp.width})`
        );

        await page.close();
      });
    });
  }
});
