import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { authorized, supabase } = await checkAdminAuth(req);
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "integration_delivery_stats")
      .maybeSingle();

    return NextResponse.json({ ok: true, stats: data?.value || {} });
  } catch (err) {
    console.error("Admin integration-stats GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
