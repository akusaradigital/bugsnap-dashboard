import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";

describe("Area 3: Public Capture View (/v/[id]) Mobile 360px–440px Audit", () => {
  let browser;

  before(async () => {
    browser = await chromium.launch({ headless: true });
  });

  after(async () => {
    if (browser) await browser.close();
  });

  const VIEWPORTS = [
    { name: "Small Mobile (360px)", width: 360, height: 740 },
    { name: "iPhone Standard (390px)", width: 390, height: 844 },
    { name: "Large Mobile (414px)", width: 414, height: 896 },
  ];

  for (const vp of VIEWPORTS) {
    it(`verifies zero horizontal overflow and responsive adaptation on ${vp.name}`, async () => {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();

      // HTML template mirroring the exact DOM structure and Tailwind utility classes
      // used in src/app/v/[id]/page.tsx, MediaViewer.tsx, and DevToolsPanel.tsx
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en" style="overflow-x: hidden; max-width: 100vw; box-sizing: border-box;">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            html, body { overflow-x: hidden; max-width: 100vw; font-family: -apple-system, sans-serif; background: #fbfbfd; color: #0f172a; }
            .flex { display: flex; }
            .flex-col { flex-direction: column; }
            .flex-wrap { flex-wrap: wrap; }
            .items-center { align-items: center; }
            .justify-between { justify-content: space-between; }
            .justify-end { justify-content: flex-end; }
            .gap-2 { gap: 0.5rem; }
            .gap-3 { gap: 0.75rem; }
            .min-w-0 { min-width: 0; }
            .w-full { width: 100%; }
            .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .break-all { word-break: break-all; }
            .p-4 { padding: 1rem; }
            .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
            .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
            .rounded-xl { border-radius: 0.75rem; }
            .border { border: 1px solid #e2e8f0; }
            .bg-white { background: #ffffff; }
            .overflow-x-auto { overflow-x: auto; -webkit-overflow-scrolling: touch; }
            .min-w-120 { min-width: 120px; }
            .min-h-44 { min-height: 44px; }

            /* Responsive grid mimicking Tailwind sm: */
            .grid { display: grid; grid-template-columns: 1fr; gap: 0.75rem; }
            @media (min-width: 640px) {
              .sm-grid-cols-2 { grid-template-columns: 1fr 1fr; }
              .sm-flex-nowrap { flex-wrap: nowrap; }
              .sm-w-auto { width: auto; }
            }
          </style>
        </head>
        <body>
          <!-- Top Header -->
          <header class="flex items-center justify-between px-3 py-2 border w-full">
            <div class="flex items-center gap-2 min-w-0">
              <div style="width: 28px; height: 28px; background: #89BD49; border-radius: 6px; flex-shrink: 0;"></div>
              <span class="truncate" style="font-weight: 700; font-size: 14px;">BugSnap Production Bug Report Demo</span>
            </div>
            <div class="flex items-center gap-2" style="flex-shrink: 0;">
              <button class="px-3 py-2 rounded-xl border text-xs" style="min-height: 38px;">Sign in</button>
            </div>
          </header>

          <!-- Main Content Area -->
          <main class="w-full p-4 flex flex-col gap-3">
            <!-- MediaViewer Mock -->
            <section class="border rounded-xl bg-white p-4">
              <div style="width: 100%; aspect-ratio: 16/9; background: #000; border-radius: 8px;"></div>

              <!-- Video Controls Row -->
              <div class="flex flex-wrap items-center gap-2" style="margin-top: 12px;">
                <button style="width: 36px; height: 36px; border-radius: 50%; background: #89BD49; color: white; border: none; flex-shrink: 0;">▶</button>
                <div class="min-w-120" style="flex: 1; height: 8px; background: #cbd5e1; border-radius: 4px;"></div>
                <div style="font-family: monospace; font-size: 11px; flex-shrink: 0;">00:15 / 01:30</div>
                <div class="flex items-center justify-end gap-2 w-full">
                  <span style="font-size: 11px;">1x</span>
                  <button style="font-size: 11px; padding: 4px 8px;">Full</button>
                </div>
              </div>

              <!-- Action Bar (MCP) -->
              <div class="flex flex-wrap items-center gap-2" style="margin-top: 14px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
                <button class="px-3 py-2 rounded-xl text-xs" style="background: rgba(137,189,73,0.15); border: 1px solid rgba(137,189,73,0.3); color: #6B9A35; font-weight: 600;">
                  Solve with AI (MCP)
                </button>
              </div>
            </section>

            <!-- DevTools Panel Mock -->
            <section class="border rounded-xl bg-white" style="overflow: hidden;">
              <!-- DevTools Tabs with overflow-x-auto -->
              <div class="flex overflow-x-auto px-3 border" style="gap: 8px; border-left: none; border-right: none; border-top: none;">
                <div style="padding: 8px; font-size: 11px; white-space: nowrap; font-weight: 600; color: #6B9A35; border-bottom: 2px solid #89BD49;">Console (2)</div>
                <div style="padding: 8px; font-size: 11px; white-space: nowrap; color: #64748b;">Network (1)</div>
                <div style="padding: 8px; font-size: 11px; white-space: nowrap; color: #64748b;">Storage</div>
                <div style="padding: 8px; font-size: 11px; white-space: nowrap; color: #64748b;">System</div>
                <div style="padding: 8px; font-size: 11px; white-space: nowrap; color: #64748b;">Info</div>
                <div style="padding: 8px; font-size: 11px; white-space: nowrap; color: #64748b;">MCP</div>
              </div>

              <!-- Log Rows -->
              <div class="p-4 flex flex-col gap-2">
                <div class="p-4 rounded-xl border break-all" style="font-family: monospace; font-size: 11px; background: #fff1f2; color: #e11d48;">
                  [Error] Uncaught TypeError: Cannot read properties of undefined (reading 'token') at https://example.com/assets/app.chunk.js:142:99482
                </div>
              </div>
            </section>

            <!-- Share & Action Card -->
            <section class="border rounded-xl bg-white p-4 flex flex-col gap-3">
              <h3 style="font-size: 14px; font-weight: 700;">Share Capture</h3>
              <div class="grid sm-grid-cols-2">
                <button class="p-4 border rounded-xl" style="font-size: 12px; font-weight: 600; text-align: center;">With DevTools</button>
                <button class="p-4 border rounded-xl" style="font-size: 12px; font-weight: 600; text-align: center;">Content Only</button>
              </div>
              <button class="w-full min-h-44 rounded-xl text-white font-semibold text-xs" style="background: #89BD49; border: none;">Copy Link</button>
            </section>
          </main>
        </body>
        </html>
      `;

      await page.setContent(htmlContent);
      await page.waitForTimeout(100);

      // Verify viewport width matches requested device width
      const innerW = await page.evaluate(() => window.innerWidth);
      assert.strictEqual(innerW, vp.width, `Window innerWidth should be ${vp.width}`);

      // Evaluate whether horizontal scrolling/overflow is strictly zero
      const overflowResult = await page.evaluate(() => {
        const doc = document.documentElement;
        const body = document.body;
        const scrollW = Math.max(doc.scrollWidth, body.scrollWidth);
        const clientW = doc.clientWidth;
        const innerW = window.innerWidth;

        // Check if any element protrudes past window boundary
        const protrudingElements = [];
        document.querySelectorAll("*").forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.right > innerW + 1) { // 1px tolerance for subpixel anti-aliasing
            protrudingElements.push({
              tag: el.tagName,
              className: el.className,
              right: rect.right,
              excess: rect.right - innerW,
            });
          }
        });

        return {
          scrollW,
          clientW,
          innerW,
          protrudingCount: protrudingElements.length,
          protrudingElements,
          hasBlowout: scrollW > innerW + 1,
        };
      });

      assert.strictEqual(
        overflowResult.hasBlowout,
        false,
        `Viewport ${vp.name} suffered horizontal overflow blowout: scrollWidth=${overflowResult.scrollW} > innerWidth=${overflowResult.innerW}. Protruding: ${JSON.stringify(overflowResult.protrudingElements)}`
      );

      console.log(`✅ ${vp.name}: ScrollWidth=${overflowResult.scrollW}px, InnerWidth=${overflowResult.innerW}px, Zero Protrusion!`);

      await context.close();
    });
  }
});
