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
    const body = await req.json().catch(() => ({}));
    const version = typeof body?.version === "string" ? body.version.slice(0, 30) : "1.0.0";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : null;

    const supabase = createServiceClient();
    let targetUserId: string | null = null;

    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user?.id) targetUserId = user.id;
    }

    if (!targetUserId && email) {
      const { data: userRecord } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      if (userRecord?.id) targetUserId = userRecord.id;
    }

    if (targetUserId) {
      // Update last seen & version in a single lightweight row update
      // ponytail: zero telemetry table entries; purely updates user presence state
      await supabase
        .from("users")
        .update({
          extension_last_seen: new Date().toISOString(),
          extension_version: version,
        })
        .eq("id", targetUserId);
    }

    return NextResponse.json({ ok: true, timestamp: Date.now() }, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = (err as Error)?.message || "Heartbeat error";
    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders });
  }
}
