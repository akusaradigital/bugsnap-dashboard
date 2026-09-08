import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { isRateLimited, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// This endpoint is necessarily unauthenticated (the extension reports errors
// that may include "not signed in"), and it keeps only the latest 50 entries,
// so 50 junk posts used to erase the whole admin fleet view. Cap how fast any
// one client can push entries out.
const RATE_LIMIT = 5;
const RATE_WINDOW_S = 60;

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (await isRateLimited(`ext-error:${ip}`, RATE_LIMIT, RATE_WINDOW_S)) {
    return NextResponse.json({ ok: true, throttled: true }, { status: 429, headers: corsHeaders });
  }

  const body = await request.json().catch(() => ({} as Record<string, unknown>));
  const errEntry = {
    id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: String(body.title ?? "").slice(0, 200),
    message: String(body.message ?? "").slice(0, 2000),
    details: body.details
      ? String(typeof body.details === "string" ? body.details : JSON.stringify(body.details)).slice(0, 2000)
      : null,
    email: String(body.email ?? "").slice(0, 200),
    version: String(body.version ?? "unknown").slice(0, 50),
    created_at: new Date().toISOString(),
  };

  console.error("[extension-error]", JSON.stringify(errEntry));

  // Store for the Admin Fleet view. Plain insert: the old read-splice-upsert
  // on one app_settings row dropped reports that arrived together, and the
  // 50-entry cap threw away history. Retention is prune_admin_logs().
  try {
    const db = createServiceClient();
    await db.from("extension_error_logs").insert(errEntry);
  } catch (saveErr) {
    console.warn("[extension-error] failed to persist error:", saveErr);
  }

  return NextResponse.json({ ok: true }, { status: 200, headers: corsHeaders });
}
