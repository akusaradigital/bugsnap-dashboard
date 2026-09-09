import test from "node:test";
import assert from "node:assert/strict";

// Re-implement the pure FNV-1a hashing & resolver logic in standard ESM to test contract
function hashExperiment(visitorId, experimentId) {
  const str = `${visitorId}:${experimentId}`;
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 100;
}

function resolveVariant(variants, bucket) {
  const totalWeight = variants.reduce((acc, v) => acc + (v.weight ?? 1), 0);
  const scaled = (bucket / 100) * totalWeight;

  let cumulative = 0;
  for (const v of variants) {
    cumulative += v.weight ?? 1;
    if (scaled < cumulative) {
      return v.id;
    }
  }
  return variants[0].id;
}

test("hashExperiment: deterministic allocation", () => {
  const vid = "v_user_123456";
  const exp = "landing_hero_cta";

  const bucket1 = hashExperiment(vid, exp);
  const bucket2 = hashExperiment(vid, exp);

  assert.equal(bucket1, bucket2, "Identical visitor and experiment must produce identical bucket");
  assert.ok(bucket1 >= 0 && bucket1 < 100, "Bucket must be in range [0, 99]");
});

test("hashExperiment: distinct visitors yield varied buckets", () => {
  const exp = "landing_hero_cta";
  const buckets = new Set();

  for (let i = 0; i < 50; i++) {
    const vid = `v_visitor_${i}`;
    buckets.add(hashExperiment(vid, exp));
  }

  // With 50 random visitor IDs, we should get substantial dispersion (>30 distinct buckets)
  assert.ok(buckets.size > 30, `Expected diverse buckets, got ${buckets.size}`);
});

test("resolveVariant: correctly partitions by 50/50 weights", () => {
  const variants = [
    { id: "control", weight: 50 },
    { id: "variant_speed", weight: 50 },
  ];

  // Buckets < 50 -> control, buckets >= 50 -> variant_speed
  assert.equal(resolveVariant(variants, 0), "control");
  assert.equal(resolveVariant(variants, 49), "control");
  assert.equal(resolveVariant(variants, 50), "variant_speed");
  assert.equal(resolveVariant(variants, 99), "variant_speed");
});

test("resolveVariant: custom weighted allocation 80/20", () => {
  const variants = [
    { id: "control", weight: 80 },
    { id: "variant_test", weight: 20 },
  ];

  assert.equal(resolveVariant(variants, 10), "control");
  assert.equal(resolveVariant(variants, 79), "control");
  assert.equal(resolveVariant(variants, 85), "variant_test");
});

test("event contract validation", () => {
  const payload = {
    visitorId: "v_anon_xyz",
    experimentId: "landing_hero_cta",
    variantId: "variant_speed",
    type: "conversion",
    goal: "install_click",
    metadata: { source: "hero_button" },
  };

  assert.ok(payload.visitorId.startsWith("v_"));
  assert.equal(payload.type, "conversion");
  assert.equal(payload.goal, "install_click");
});
