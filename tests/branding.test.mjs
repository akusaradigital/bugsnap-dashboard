import { test } from "node:test";
import assert from "node:assert/strict";

// Test Branding fallback resolution logic
test("branding endpoint: resolves defaults when capture or workspace is missing", () => {
  function resolveBranding(capture, settings) {
    if (!capture?.workspace_id) {
      return {
        brandName: "BugSnap",
        logoUrl: "",
        hideWatermark: false,
      };
    }

    return {
      brandName: settings?.brand_name || "BugSnap",
      logoUrl: settings?.custom_logo_url || "",
      hideWatermark: Boolean(settings?.hide_watermark),
    };
  }

  // 1. Missing capture / workspace
  assert.deepEqual(resolveBranding(null, null), {
    brandName: "BugSnap",
    logoUrl: "",
    hideWatermark: false,
  });

  // 2. Workspace present with custom brand & watermark hidden
  assert.deepEqual(
    resolveBranding(
      { workspace_id: "ws_123" },
      { brand_name: "Acme Corp", custom_logo_url: "https://acme.com/logo.png", hide_watermark: true }
    ),
    {
      brandName: "Acme Corp",
      logoUrl: "https://acme.com/logo.png",
      hideWatermark: true,
    }
  );

  // 3. Workspace present with partial settings
  assert.deepEqual(
    resolveBranding({ workspace_id: "ws_123" }, { brand_name: "", custom_logo_url: null, hide_watermark: false }),
    {
      brandName: "BugSnap",
      logoUrl: "",
      hideWatermark: false,
    }
  );
});

// Test Capture View (/v/[id]) header watermark and footer suppression rules
test("branding display logic: watermark and footer visibility rules", () => {
  function computeVisibility(brand) {
    return {
      showWatermarkBadge: !brand.hideWatermark,
      showCaptureFooter: !brand.hideWatermark,
      brandHeaderLabel: brand.name || "BugSnap",
      hasCustomLogo: Boolean(brand.logo && brand.logo.trim().length > 0),
    };
  }

  // Case A: Default BugSnap brand (watermark visible)
  const defaultView = computeVisibility({ name: "BugSnap", logo: "", hideWatermark: false });
  assert.equal(defaultView.showWatermarkBadge, true);
  assert.equal(defaultView.showCaptureFooter, true);
  assert.equal(defaultView.hasCustomLogo, false);

  // Case B: Custom brand with watermark hidden
  const whitelabelView = computeVisibility({
    name: "Enterprise Studio",
    logo: "https://example.com/logo.svg",
    hideWatermark: true,
  });
  assert.equal(whitelabelView.showWatermarkBadge, false);
  assert.equal(whitelabelView.showCaptureFooter, false);
  assert.equal(whitelabelView.hasCustomLogo, true);
  assert.equal(whitelabelView.brandHeaderLabel, "Enterprise Studio");
});
