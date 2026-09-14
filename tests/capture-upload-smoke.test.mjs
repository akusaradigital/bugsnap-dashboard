import { test } from "node:test";
import assert from "node:assert/strict";

const API = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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
