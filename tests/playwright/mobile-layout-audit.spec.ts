import { test, expect, type Page } from "@playwright/test";

const WIDTHS = [360, 390, 414, 440];
const ROUTES = [
  "/",
  "/features",
  "/how-it-works",
  "/solutions",
  "/extension",
  "/pricing",
  "/docs",
  "/blog",
  "/blog/how-to-report-bugs-effectively",
  "/help",
  "/security",
  "/contact",
  "/about",
  "/privacy",
  "/terms",
  "/status",
  "/login",
  "/admin/login",
  "/upgrade",
  "/route-does-not-exist-404",
  "/v/8cd0c35b-8683-43e7-940b-2fec6c4fd8ef",
];

async function checkMobileOverflow(page: Page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const clientWidth = doc.clientWidth;
    const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);

    const offenders = Array.from(document.querySelectorAll("*"))
      .filter((el) => {
        const r = el.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) return false;
        const tag = el.tagName.toLowerCase();
        if (["script", "style", "head", "meta", "link", "noscript"].includes(tag)) return false;
        return r.right > clientWidth + 1;
      })
      .map((el) => {
        const e = el as HTMLElement;
        const rect = e.getBoundingClientRect();
        return {
          tag: e.tagName.toLowerCase(),
          className: (e.className || "").toString().slice(0, 80),
          id: e.id || "",
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          clientWidth,
          text: (e.innerText || "").slice(0, 40).replace(/\n/g, " "),
        };
      })
      .slice(0, 10);

    return {
      scrollWidth,
      clientWidth,
      overflow: scrollWidth > clientWidth,
      offenders,
    };
  });
}

test.describe("Mobile Viewport 360px-440px Layout & Overflow Audit", () => {
  for (const route of ROUTES) {
    for (const width of WIDTHS) {
      test(`${route} at ${width}px has zero horizontal overflow`, async ({ page }) => {
        await page.setViewportSize({ width, height: 750 });
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(600); // Wait for dynamic hydration / motion reveal

        const result = await checkMobileOverflow(page);
        if (result.overflow) {
          console.error(`OVERFLOW on ${route} at ${width}px: scrollWidth=${result.scrollWidth}, clientWidth=${result.clientWidth}`, result.offenders);
        }
        expect(result.overflow, `Horizontal overflow detected on ${route} at ${width}px! Offenders: ${JSON.stringify(result.offenders)}`).toBe(false);
      });
    }
  }

  test("Mobile hamburger menu drawer opens and closes without overflow at 360px", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 750 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    const hamburger = page.locator('button[aria-label="Toggle Navigation Menu"]');
    await expect(hamburger).toBeVisible();

    // Open drawer
    await hamburger.click();
    await page.waitForTimeout(300);

    let result = await checkMobileOverflow(page);
    expect(result.overflow, `Drawer opened caused horizontal overflow! ${JSON.stringify(result.offenders)}`).toBe(false);

    // Close drawer
    await hamburger.click();
    await page.waitForTimeout(300);

    result = await checkMobileOverflow(page);
    expect(result.overflow, `Drawer closed caused horizontal overflow! ${JSON.stringify(result.offenders)}`).toBe(false);
  });

  test("Pricing toggle works on mobile 360px without overflow", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 750 });
    await page.goto("/pricing", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    // Click annual toggle
    const annualBtn = page.getByRole("button", { name: /yearly|tahunan|annual/i }).first();
    if (await annualBtn.isVisible()) {
      await annualBtn.click();
      await page.waitForTimeout(300);
      const result = await checkMobileOverflow(page);
      expect(result.overflow).toBe(false);
    }
  });

  test("Role switcher tabs switch without overflow at 360px", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 750 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    // Scroll down to role switcher if needed
    const roleButtons = page.locator("button").filter({ hasText: /developer|qa|product|support/i });
    const count = await roleButtons.count();
    if (count > 1) {
      await roleButtons.nth(1).click();
      await page.waitForTimeout(300);
      const result = await checkMobileOverflow(page);
      expect(result.overflow).toBe(false);
    }
  });

  test("Capture detail page (/v/[id]) DevTools tabs and media viewer at 360px", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 750 });
    await page.goto("/v/8cd0c35b-8683-43e7-940b-2fec6c4fd8ef", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    // Check baseline overflow on capture view
    let result = await checkMobileOverflow(page);
    expect(result.overflow, `Capture page overflow: ${JSON.stringify(result.offenders)}`).toBe(false);

    // Switch DevTools tabs (Console, Network, Storage, System) if present
    const devToolsTabs = page.locator("button").filter({ hasText: /console|network|storage|system/i });
    const tabCount = await devToolsTabs.count();
    for (let i = 0; i < tabCount; i++) {
      await devToolsTabs.nth(i).click();
      await page.waitForTimeout(200);
      result = await checkMobileOverflow(page);
      expect(result.overflow, `DevTools tab ${i} overflow: ${JSON.stringify(result.offenders)}`).toBe(false);
    }
  });
});
