#!/usr/bin/env node
/**
 * scripts/audit-drive-connections.mjs
 *
 * Audits all Google Drive connections in Supabase to verify that:
 * 1. The refresh_token decrypts correctly.
 * 2. Google OAuth accepts the refresh_token (not revoked).
 * 3. The granted scope includes "drive.file" (user didn't skip the consent checkbox).
 *
 * Usage:
 *   node scripts/audit-drive-connections.mjs            # Dry-run report
 *   node scripts/audit-drive-connections.mjs --fix      # Purges defective connections from DB
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createHash, createDecipheriv } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// 1. Load .env.local if present
const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const k = trimmed.slice(0, eqIdx).trim();
      const v = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
const ENCRYPTION_KEY = process.env.GOOGLE_DRIVE_ENCRYPTION_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !ENCRYPTION_KEY) {
  console.error("Missing required environment variables in .env.local or process environment.");
  process.exit(1);
}

const shouldFix = process.argv.includes("--fix");

function decrypt(value) {
  const hashKey = createHash("sha256").update(ENCRYPTION_KEY.trim(), "utf8").digest();
  const data = Buffer.from(value, "base64url");
  if (data.length < 29) throw new Error("Invalid encrypted value");
  const decipher = createDecipheriv("aes-256-gcm", hashKey, data.subarray(0, 12));
  decipher.setAuthTag(data.subarray(12, 28));
  return Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString("utf8");
}

async function verifyGoogleToken(refreshToken) {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID.trim(),
        client_secret: GOOGLE_CLIENT_SECRET.trim(),
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    const body = await res.json();
    if (!res.ok) {
      return { ok: false, error: body.error_description || body.error || `HTTP ${res.status}` };
    }
    const scope = typeof body.scope === "string" ? body.scope : "";
    const hasDriveScope = scope.includes("drive.file");
    return { ok: true, hasDriveScope, scope };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function main() {
  console.log(`\n=== BugSnap Google Drive Connection Audit (${shouldFix ? "FIX MODE" : "DRY RUN"}) ===\n`);

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: rows, error } = await db
    .from("google_drive_connections")
    .select("user_id, google_email, refresh_token, updated_at");

  if (error) {
    console.error("Failed to fetch google_drive_connections:", error.message);
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.log("No Google Drive connections found in database.");
    return;
  }

  console.log(`Found ${rows.length} total connection(s). Verifying with Google OAuth...\n`);

  let healthyCount = 0;
  let missingScopeCount = 0;
  let revokedCount = 0;
  const toPurge = [];

  for (const row of rows) {
    const userLabel = `${row.google_email || "no-email"} (${row.user_id})`;
    let plainRefreshToken;
    try {
      plainRefreshToken = decrypt(row.refresh_token);
    } catch {
      console.log(`❌ [DECRYPT FAILED] ${userLabel}`);
      revokedCount++;
      toPurge.push({ id: row.user_id, reason: "decrypt_failed" });
      continue;
    }

    const test = await verifyGoogleToken(plainRefreshToken);
    if (!test.ok) {
      console.log(`❌ [REVOKED/INVALID] ${userLabel} - ${test.error}`);
      revokedCount++;
      toPurge.push({ id: row.user_id, reason: test.error });
    } else if (!test.hasDriveScope) {
      console.log(`⚠️ [MISSING DRIVE SCOPE] ${userLabel} - User unchecked Drive permission box!`);
      missingScopeCount++;
      toPurge.push({ id: row.user_id, reason: "missing_drive_scope" });
    } else {
      console.log(`✅ [HEALTHY] ${userLabel}`);
      healthyCount++;
    }
  }

  console.log("\n--- Audit Summary ---");
  console.log(`Total Connections: ${rows.length}`);
  console.log(`Healthy:           ${healthyCount}`);
  console.log(`Missing Scope:     ${missingScopeCount}`);
  console.log(`Revoked/Invalid:   ${revokedCount}`);

  if (toPurge.length > 0) {
    if (shouldFix) {
      console.log(`\nPurging ${toPurge.length} defective connection(s) from database...`);
      for (const item of toPurge) {
        const { error: delErr } = await db
          .from("google_drive_connections")
          .delete()
          .eq("user_id", item.id);
        if (delErr) {
          console.error(`Failed to delete user ${item.id}:`, delErr.message);
        } else {
          console.log(`  Purged: user_id ${item.id} (${item.reason})`);
        }
      }
      console.log("\nPurge complete. Affected users will be asked to reconnect on their next session.");
    } else {
      console.log(`\n⚠️  Found ${toPurge.length} connection(s) that should be purged.`);
      console.log("Run again with '--fix' to automatically remove them from Supabase:\n");
      console.log("  node scripts/audit-drive-connections.mjs --fix\n");
    }
  } else {
    console.log("\nAll connections are healthy! No cleanup required.");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
