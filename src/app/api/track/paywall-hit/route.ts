import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) {
      return NextResponse.json({ ok: false, message: "Unauthenticated" }, { status: 401, headers: corsHeaders });
    }

    const supabase = createServiceClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return NextResponse.json({ ok: false, message: "Invalid session" }, { status: 401, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({}));
    const feature = typeof body?.feature === "string" ? body.feature.slice(0, 100) : "unknown_feature";

    // Atomically increment paywall_hits or update directly on the user row
    // ponytail: single-row increment, zero log table growth
    const { data: currentUser } = await supabase
      .from("users")
      .select("paywall_hits")
      .eq("id", user.id)
      .maybeSingle();

    const nextHits = (currentUser?.paywall_hits || 0) + 1;

    await supabase
      .from("users")
      .update({
        paywall_hits: nextHits,
        last_paywall_feature: feature,
        last_paywall_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    return NextResponse.json({ ok: true, hits: nextHits }, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = (err as Error)?.message || "Tracking failed";
    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders });
  }
}
