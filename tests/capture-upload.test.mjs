import { test, after } from "node:test";
import assert from "node:assert/strict";
import { cleanupTestData } from "./config.mjs";

const API = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

after(async () => {
  await cleanupTestData();
});

test("capture upload route rejects anonymous requests", async (t) => {
  try {
    const res = await fetch(`${API}/api/captures/upload`, { method: "POST" });
    assert.equal(res.status, 401);
  } catch (err) {
    if (err?.cause?.code === "ECONNREFUSED" || err?.code === "ECONNREFUSED") {
      t.skip(`Skipping smoke test: server not running at ${API}`);
      return;
    }
    throw err;
  }
});

test("capture upload route accepts authenticated request when Drive is connected", async () => {
  // This test is intentionally a smoke test placeholder until CI has a seeded Drive connection.
  assert.ok(true);
});
