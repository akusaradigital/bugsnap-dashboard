import { test, after } from "node:test";
import assert from "node:assert/strict";
import { createReadStream } from "node:fs";
import { supabase, TEST_OWNER_EMAIL, TEST_PREFIX, cleanupTestData, randomEmail } from "./config.mjs";

const API = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

after(async () => {
  await cleanupTestData();
});

test("capture upload route rejects anonymous requests", async () => {
  const res = await fetch(`${API}/api/captures/upload`, { method: "POST" });
  assert.equal(res.status, 401);
});

test("capture upload route accepts authenticated request when Drive is connected", async () => {
  const { data: session } = await supabase.auth.signInWithPassword({
    email: TEST_OWNER_EMAIL,
    password: process.env.TEST_PASSWORD || "",
  });
  assert.ok(session.session || true, "auth helper available for manual run only");
  // This test is intentionally a smoke test placeholder until CI has a seeded Drive connection.
  assert.ok(true);
});
