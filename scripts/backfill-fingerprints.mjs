// Backfill captures.error_fingerprint for rows created before the column existed.
//
// Runs in Node rather than SQL because the fingerprint is defined by
// src/lib/fingerprint.ts - stack-frame parsing and route normalisation that
// would have to be reimplemented (and could then drift) in plpgsql.
//
// Touches existing production data, so:
//   - dry run by default; --apply is required to write anything
//   - only ever fills NULL, never overwrites a fingerprint already there
//   - batched, with a per-batch count so progress is visible and verifiable
//   - the exact same function the insert path uses, so backfilled rows group
//     with new ones instead of forming a parallel set of groups
//
//   node scripts/backfill-fingerprints.mjs            # dry run, reports only
//   node scripts/backfill-fingerprints.mjs --apply    # writes
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const BATCH = 200;

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => /^[A-Z_0-9]+=/.test(l))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");

// Load the real fingerprint module so this cannot diverge from the insert path.
const src = readFileSync(new URL("../src/lib/fingerprint.ts", import.meta.url), "utf8");
const transpiled = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const ctx = { exports: {}, URL, console };
vm.runInNewContext(transpiled, ctx);
const { captureFingerprint } = ctx.exports;
if (typeof captureFingerprint !== "function") throw new Error("captureFingerprint not exported");

// Historic rows store dev_logs three different ways, and only one of them is
// directly readable:
//   - object  : a Drive reference ({driveFileId}) - the logs are NOT in the
//               column, so these cannot be backfilled without fetching 274
//               files from Drive. Left alone on purpose; see the summary.
//   - string  : gzip, "gz:"-prefixed - decompressed here
//   - array   : plain log rows
const { gunzipSync } = await import("node:zlib");

function inflateDevLogs(value) {
  if (typeof value !== "string") return value;
  if (!value.startsWith("gz:")) return value;
  try {
    const buf = Buffer.from(value.slice(3), "base64");
    return JSON.parse(gunzipSync(buf).toString("utf8"));
  } catch {
    return null;
  }
}

const db = createClient(url, key, { auth: { persistSession: false } });

let scanned = 0;
let computed = 0;
let written = 0;
let noSignal = 0;
let driveOnly = 0;
let lastId = null;

for (;;) {
  // Keyset page on id so a write during the run cannot shift the window.
  let q = db
    .from("captures")
    .select("id, dev_logs, site_url")
    .is("error_fingerprint", null)
    .order("id", { ascending: true })
    .limit(BATCH);
  if (lastId) q = q.gt("id", lastId);

  const { data, error } = await q;
  if (error) throw new Error(`read failed: ${error.message}`);
  if (!data || data.length === 0) break;

  for (const row of data) {
    scanned++;

    // A Drive-only reference carries no logs in the column; count it separately
    // so the summary does not claim these rows simply had no error.
    const isDriveRef =
      row.dev_logs &&
      typeof row.dev_logs === "object" &&
      !Array.isArray(row.dev_logs) &&
      row.dev_logs.driveFileId &&
      !Array.isArray(row.dev_logs.topErrors);

    let fp = null;
    try {
      fp = captureFingerprint({
        devLogs: inflateDevLogs(row.dev_logs),
        siteUrl: row.site_url,
      });
    } catch {
      fp = null; // a malformed old row must not stop the run
    }
    if (!fp) {
      if (isDriveRef) driveOnly++;
      else noSignal++;
      continue;
    }
    computed++;
    if (APPLY) {
      // .is(null) again on the write: belt and braces against a concurrent
      // insert path having filled it between the read and here.
      const { error: upErr } = await db
        .from("captures")
        .update({ error_fingerprint: fp })
        .eq("id", row.id)
        .is("error_fingerprint", null);
      if (upErr) {
        console.warn(`  skip ${row.id}: ${upErr.message}`);
      } else {
        written++;
      }
    }
  }

  lastId = data[data.length - 1].id;
  console.log(
    `scanned=${scanned} groupable=${computed} no-error=${noSignal} drive-only=${driveOnly}` +
      (APPLY ? ` written=${written}` : " (dry run)"),
  );
  if (data.length < BATCH) break;
}

console.log("\n--- summary ---");
console.log(`rows scanned        : ${scanned}`);
console.log(`fingerprint computed: ${computed}`);
console.log(`no error to group on: ${noSignal}  (stay NULL, by design)`);
console.log(`logs live in Drive    : ${driveOnly}  (cannot backfill without fetching each file)`);
console.log(APPLY ? `rows written        : ${written}` : "DRY RUN - nothing written. Re-run with --apply.");
