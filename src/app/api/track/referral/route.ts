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
      return NextResponse.json({ ok: false }, { status: 401, headers: corsHeaders });
    }

    const supabase = createServiceClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return NextResponse.json({ ok: false }, { status: 401, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({}));
    const captureId = typeof body?.captureId === "string" ? body.captureId.trim() : "";

    if (!captureId) {
      return NextResponse.json({ ok: false, message: "Missing captureId" }, { status: 400, headers: corsHeaders });
    }

    // Check if user already has an attributed capture
    const { data: currentUser } = await supabase
      .from("users")
      .select("referred_by_capture_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!currentUser?.referred_by_capture_id) {
      // Attribute user to this shared capture
      await supabase
        .from("users")
        .update({ referred_by_capture_id: captureId })
        .eq("id", user.id);
    }

    return NextResponse.json({ ok: true }, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = (err as Error)?.message || "Referral attribution failed";
    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders });
  }
}
