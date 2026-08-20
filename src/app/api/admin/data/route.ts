import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Admin stats: one SECURITY DEFINER RPC (admin_stats) instead of 6 unbounded
// service-role table scans pulled into Node. The RPC is super-admin guarded
// (super_admin_emails app_settings / SUPER_ADMIN_EMAILS env), and this route
// keeps its own Bearer-token check as defence-in-depth. T-022.
export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const serviceClient = createServiceClient();

    // 1. Verify caller identity via service role
    const { data: { user }, error: authError } = await serviceClient.auth.getUser(token);
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

    // 3. Call admin_stats with the USER's JWT so auth.jwt()->>'email' resolves
    //    correctly inside the SECURITY DEFINER RPC (service-role JWT has no email).
    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } }
    );
    const { data, error } = await userClient.rpc("admin_stats");
    const { data: driftData } = await userClient.rpc("run_schema_drift_check");
    const { data: integrityData } = await userClient.rpc("run_integrity_audit");
    if (error) {
      if (error.message?.includes("forbidden")) {
        return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
      }
      throw error;
    }

    const raw = data as {
      stats?: { total_users?: number; total_workspaces?: number; total_captures?: number; total_views?: number; total_comments?: number };
      users?: { id: string; email: string; full_name?: string | null; plan?: string | null; created_at: string; suspended?: boolean }[];
      top_workspaces?: { name: string; owner_email: string; capture_count: number }[];
      promo?: { enabled: boolean; message: string };
    } | null;

    const s = raw?.stats ?? {};
    return NextResponse.json({
      ok: true,
      stats: {
        totalUsers: s.total_users ?? 0,
        totalWorkspaces: s.total_workspaces ?? 0,
        totalCaptures: s.total_captures ?? 0,
        totalViews: s.total_views ?? 0,
        totalComments: s.total_comments ?? 0,
      },
      users: (raw?.users ?? []).map((u) => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name ?? null,
        plan: u.plan ?? "free",
        created_at: u.created_at,
        suspended: u.suspended ?? false,
        workspace_count: 0,
        capture_count: 0,
      })),
      topWorkspaces: (raw?.top_workspaces ?? []).map((w) => ({
        id: "",
        name: w.name,
        owner_email: w.owner_email,
        capture_count: Number(w.capture_count),
      })),
      promo: raw?.promo ?? { enabled: false, message: "" },
      drift: driftData ?? null,
      integrity: integrityData ?? null,
    });
  } catch (err) {
    console.error("Admin data fetch error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
