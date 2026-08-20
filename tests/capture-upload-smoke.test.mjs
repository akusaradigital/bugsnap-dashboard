import { test } from "node:test";
import assert from "node:assert/strict";

const API = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

test("capture upload route rejects anonymous requests", async () => {
  const res = await fetch(`${API}/api/captures/upload`, { method: "POST" });
  assert.equal(res.status, 401);
});
