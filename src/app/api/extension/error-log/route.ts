import { NextResponse } from "next/server";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// ponytail: sink is console.error so Vercel's own runtime-log aggregation
// (Logs tab / get_runtime_errors) is the store - no new DB table/RLS to add.
// Upgrade to a Supabase table if we need querying/alerting beyond that.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({} as Record<string, unknown>));
  console.error("[extension-error]", JSON.stringify({
    title: String(body.title ?? "").slice(0, 200),
    message: String(body.message ?? "").slice(0, 2000),
    details: body.details
      ? String(typeof body.details === "string" ? body.details : JSON.stringify(body.details)).slice(0, 2000)
      : null,
    email: String(body.email ?? "").slice(0, 200),
    version: String(body.version ?? "").slice(0, 50),
  }));
  return NextResponse.json({ ok: true }, { status: 200, headers: corsHeaders });
}
