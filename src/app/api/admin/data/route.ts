import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

// Admin stats: one SECURITY DEFINER RPC (admin_stats) instead of 6 unbounded
// service-role table scans pulled into Node. The RPC is super-admin guarded
// (super_admin_emails app_settings / SUPER_ADMIN_EMAILS env), and this route
// keeps its own Bearer-token check as defence-in-depth. T-022.
export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const supabase = createServiceClient();

    // 1. Verify caller identity
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Enforce Super Admin list (same gate as before - the RPC checks its
    //    own copy of the list as defence-in-depth)
    const adminEmails = (process.env.SUPER_ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (!adminEmails.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
    }

    // 3. All the stats in one RPC
    const { data, error } = await supabase.rpc("admin_stats");
    if (error) {
      // The RPC fails closed if the app_settings super_admin_emails key is
      // absent on a fresh stack; fall back to a degraded empty payload rather
      // than a 500 (the UI still renders the promo editor).
      if (error.message?.includes("forbidden")) {
        return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
      }
      throw error;
    }

    return NextResponse.json({ ok: true, ...(data ?? {}) });
  } catch (err) {
    console.error("Admin data fetch error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
