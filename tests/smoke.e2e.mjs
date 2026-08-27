import assert from "node:assert/strict";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function run() {
  console.log(`Running E2E Smoke Tests against ${BASE_URL}...`);

  // 1. Health endpoint check
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  assert.equal(healthRes.status, 200, "Health endpoint should return 200 OK");
  const healthJson = await healthRes.json();
  assert.ok(
    healthJson.status === "healthy" || healthJson.status === "degraded",
    `Health status should be healthy or degraded, got: ${healthJson.status}`
  );
  console.log(`✔ /api/health passed (status: ${healthJson.status})`);

  // 2. Landing page check
  const homeRes = await fetch(`${BASE_URL}/`);
  assert.equal(homeRes.status, 200, "Landing page should return 200 OK");
  const homeHtml = await homeRes.text();
  assert.ok(homeHtml.includes("BugSnap"), "Landing HTML should contain BugSnap brand");
  console.log("✔ Landing page (/) passed");

  // 3. Custom 404 Page check
  const notFoundRes = await fetch(`${BASE_URL}/unrecognized-route-xyz-404`);
  assert.equal(notFoundRes.status, 404, "404 route should return 404 status");
  const notFoundHtml = await notFoundRes.text();
  assert.ok(notFoundHtml.includes("Page not found") || notFoundHtml.includes("404"), "404 page should render custom not-found message");
  console.log("✔ Custom 404 page passed");

  console.log("All E2E Smoke Tests PASSED successfully!");
}

run().catch((err) => {
  console.error("E2E Smoke Tests FAILED:", err);
  process.exit(1);
});
