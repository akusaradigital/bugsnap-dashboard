import { test, expect, type Page } from "@playwright/test";

// Mobile audit for the occurrence badge on /v/[id] (CLAUDE.md §1.11).
//
// The rule that matters is the one that is easy to break and invisible in code
// review: horizontal overflow at 360px. A badge whose text cannot shrink pushes
// the whole metadata row wider than the viewport, and the page starts scrolling
// sideways. This asserts the document is never wider than the viewport, at every
// width in the required range.
//
// CAPTURE_ID is supplied by the audit run; without it the spec skips rather than
// silently passing against a page that never rendered a badge.
const CAPTURE_ID = process.env.AUDIT_CAPTURE_ID || "";
const WIDTHS = [360, 390, 414, 440];

async function horizontalOverflow(page: Page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      // Any element sticking out past the right edge, for a useful failure message.
      offenders: Array.from(document.querySelectorAll("*"))
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.right > doc.clientWidth + 1;
        })
        .slice(0, 5)
        .map((el) => {
          const e = el as HTMLElement;
          return `${e.tagName.toLowerCase()}.${(e.className || "").toString().split(" ").filter(Boolean).slice(0, 3).join(".")}`;
        }),
    };
  });
}

test.describe("occurrence badge mobile audit", () => {
  test.skip(!CAPTURE_ID, "AUDIT_CAPTURE_ID not set");

  for (const width of WIDTHS) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(`/v/${CAPTURE_ID}`, { waitUntil: "domcontentloaded" });
      // Not networkidle: the dev server holds an HMR websocket open, so it never
      // settles and every assertion below would time out instead of being checked.
      // Waiting for the capture title is the real signal that the page rendered.
      await page.locator("h2").first().waitFor({ state: "visible", timeout: 20_000 });

      const { scrollWidth, clientWidth, offenders } = await horizontalOverflow(page);
      expect(
        scrollWidth,
        `page scrolls sideways at ${width}px (scrollWidth ${scrollWidth} > clientWidth ${clientWidth}). Offenders: ${offenders.join(", ") || "none identified"}`,
      ).toBeLessThanOrEqual(clientWidth + 1);
    });
  }

  // The badge itself cannot be asserted from an anonymous session: the
  // occurrence RPC is SECURITY INVOKER, so RLS on captures denies it outright
  // ("permission denied for table captures") and the badge correctly stays
  // hidden rather than showing a cross-workspace number. That is the intended
  // security behaviour, so this checks the badge only when a session actually
  // renders it, and says so plainly when it does not.
  test("badge, when visible, stays inside the 360px viewport", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(`/v/${CAPTURE_ID}`, { waitUntil: "domcontentloaded" });
    await page.locator("h2").first().waitFor({ state: "visible", timeout: 20_000 });

    const badge = page
      .locator('span[title]:has-text("Reported"), span[title]:has-text("Dilaporkan")')
      .first();

    if ((await badge.count()) === 0) {
      test.skip(
        true,
        "occurrence badge requires an authenticated workspace member; anonymous RLS hides it by design",
      );
      return;
    }

    const box = await badge.boundingBox();
    expect(box, "badge must have a layout box").not.toBeNull();
    if (box) {
      expect(box.x, "badge must not start off-screen").toBeGreaterThanOrEqual(0);
      expect(
        box.x + box.width,
        "badge must not extend past the right edge at 360px",
      ).toBeLessThanOrEqual(360 + 1);
    }
  });
});
