import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("E2E Audit: Breadcrumb Pill Cleanup & Browser Store Parity", () => {
  const root = path.resolve(".");

  it("ensures WelcomeContent has removed heroBadge pill and sparkles clutter", () => {
    const welcome = fs.readFileSync(path.join(root, "src/app/welcome/WelcomeContent.tsx"), "utf8");
    assert(!welcome.includes("welcome.heroBadge"), "welcome.heroBadge must be completely removed");
    assert(!welcome.includes("Extension Installed & Ready"), "Literal text 'Extension Installed & Ready' must be removed from hero");
    assert(!welcome.includes("lucide:sparkles"), "Sparkles icon pill must be removed from welcome hero");
    assert(welcome.includes('aria-label="Breadcrumb"'), "Clean breadcrumb nav must be present");
  });

  it("ensures IntegrationsDocsContent has no Setup Guides pill in breadcrumb", () => {
    const content = fs.readFileSync(path.join(root, "src/app/docs/integrations/IntegrationsDocsContent.tsx"), "utf8");
    assert(!content.includes("Setup Guides"), "Setup Guides pill badge must be removed from breadcrumb");
    assert(content.includes('aria-label="Breadcrumb"'), "Clean breadcrumb nav must be present");
  });

  it("ensures McpDocsContent has no 3D cube or Docs badge in breadcrumb", () => {
    const content = fs.readFileSync(path.join(root, "src/app/docs/mcp/McpDocsContent.tsx"), "utf8");
    assert(!content.includes("3D isometric green stacked cubes"), "3D isometric cubes comment/SVG must be removed from breadcrumb");
    assert(!content.includes(">Docs<"), "Docs badge text must be removed from breadcrumb");
    assert(content.includes('aria-label="Breadcrumb"'), "Clean breadcrumb nav must be present");
  });

  it("ensures VisualCompareContent has no eyebrow pill under breadcrumb", () => {
    const content = fs.readFileSync(path.join(root, "src/app/visual-compare/VisualCompareContent.tsx"), "utf8");
    assert(!content.includes("vc.eyebrow"), "vc.eyebrow pill badge must be removed");
    assert(content.includes('aria-label="Breadcrumb"'), "Clean breadcrumb nav must be present");
    // Ensure breadcrumb is directly followed by H1 section without an eyebrow badge
    const afterBreadcrumb = content.slice(content.indexOf('aria-label="Breadcrumb"'));
    const h1Idx = afterBreadcrumb.indexOf("<h1");
    const intermediate = afterBreadcrumb.slice(0, h1Idx);
    assert(!intermediate.includes("rounded-full"), "No pill badge allowed between breadcrumb and H1 headline");
  });

  it("ensures BrowserProgressContent has no pulsing status badge pill", () => {
    const content = fs.readFileSync(path.join(root, "src/app/extension/[browser]/BrowserProgressContent.tsx"), "utf8");
    assert(!content.includes("storeProgress.badge"), "storeProgress.badge pill must be removed");
    assert(!content.includes("Pulsing Dot Badge"), "Pulsing Dot Badge comment/element must be removed");
  });

  it("ensures InProgressView has no top beacon badge pill", () => {
    const content = fs.readFileSync(path.join(root, "src/components/InProgressView.tsx"), "utf8");
    assert(!content.includes("inProgress.badge"), "inProgress.badge pill must be removed from InProgressView");
    assert(!content.includes("Top Status Beacon Badge"), "Top Status Beacon Badge comment/element must be removed");
  });

  it("ensures CHROME_STORE_URL is configured to the verified store ID", () => {
    const constants = fs.readFileSync(path.join(root, "src/lib/constants.ts"), "utf8");
    assert(
      constants.includes("https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf"),
      "CHROME_STORE_URL must point to the verified extension store ID"
    );
  });

  it("ensures HelpMenu links to official Chrome Web Store and live Firefox Add-ons listing", () => {
    const helpMenu = fs.readFileSync(path.join(root, "src/components/HelpMenu.tsx"), "utf8");
    assert(helpMenu.includes("logos:chrome-web-store"), "HelpMenu must render logos:chrome-web-store for Chrome Web Store");
    assert(helpMenu.includes("FIREFOX_STORE_URL"), "HelpMenu must link Firefox via FIREFOX_STORE_URL");
    assert(!helpMenu.includes("/extension/edge"), "HelpMenu must not link Edge after Edge support removal");
  });

  it("ensures SiteFooter links to the live Firefox Add-ons store via constants, Edge hidden", () => {
    const footer = fs.readFileSync(path.join(root, "src/components/site/SiteFooter.tsx"), "utf8");
    assert(footer.includes("FIREFOX_STORE_URL"), "SiteFooter must use FIREFOX_STORE_URL");
    // Microsoft Edge is intentionally hidden from UI until the feature is ready across all pages.
    assert(!footer.includes("EDGE_STORE_URL"), "SiteFooter must not reference removed EDGE_STORE_URL");
    const constants = fs.readFileSync(path.join(root, "src/lib/constants.ts"), "utf8");
    assert(
      constants.includes('FIREFOX_STORE_URL = "https://addons.mozilla.org/addon/bugsnap/"'),
      "FIREFOX_STORE_URL must point to the live Mozilla Add-ons listing now that BugSnap is published"
    );
  });

  it("ensures required vector assets exist in public/", () => {
    const cws = path.join(root, "public/icons/chrome-web-store.svg");
    const progress = path.join(root, "public/illustrations/browser-progress.svg");
    assert(fs.existsSync(cws), "chrome-web-store.svg must exist in public/icons/");
    assert(fs.existsSync(progress), "browser-progress.svg must exist in public/illustrations/");
    const cwsContent = fs.readFileSync(cws, "utf8");
    assert(cwsContent.includes("<svg"), "chrome-web-store.svg must be a valid SVG");
  });

  it("ensures Firefox store-progress translations exist in both locales", () => {
    const marketingPath = path.join(root, "src/lib/i18n/marketing.ts");
    const marketing = fs.readFileSync(marketingPath, "utf8");

    const requiredKeys = [
      "storeProgress.firefoxTitle",
      "storeProgress.firefoxDesc",
      "storeProgress.firefoxStatus",
      "storeProgress.firefoxSubStatus",
      "storeProgress.firefoxTipTitle",
      "storeProgress.firefoxTip",
      "storeProgress.installFirefox",
      "storeProgress.specTitle",
      "storeProgress.specV3",
      "storeProgress.specDrive",
      "storeProgress.specPrivacy",
      "storeProgress.specMulti",
      "storeProgress.liveOnChrome",
      "storeProgress.liveOnChromeDesc",
      "storeProgress.installChrome",
      "storeProgress.ctaTryChrome",
      "storeProgress.viewDocs",
      "storeProgress.backHome",
      "inProgress.title",
      "inProgress.desc",
      "inProgress.statusActive",
      "inProgress.freeNotice",
      "inProgress.backHome",
      "inProgress.goToDashboard",
      "inProgress.exploreDocs",
    ];

    for (const key of requiredKeys) {
      assert(marketing.includes(`"${key}":`), `marketing.ts must include translation key: ${key}`);
    }
  });

  it("ensures exact required copy exists in Indonesian translations", () => {
    const marketing = fs.readFileSync(path.join(root, "src/lib/i18n/marketing.ts"), "utf8");
    assert(
      marketing.includes("Fitur ini sedang didevelop, mohon menunggu"),
      "Must include exact requested copy: 'Fitur ini sedang didevelop, mohon menunggu'"
    );
  });
});
