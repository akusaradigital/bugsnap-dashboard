import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/admin-auth";

export const runtime = "nodejs";

// Split out of /api/admin/data - that endpoint's 13-query overview payload
// was being re-fetched in full by /admin/system just to read these two RPCs.
export async function GET(req: Request) {
  const { authorized, supabase } = await checkAdminAuth(req);
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
    const [{ data: drift }, { data: integrity }] = await Promise.all([
      supabase.rpc("run_schema_drift_check"),
      supabase.rpc("run_integrity_audit"),
    ]);

    return NextResponse.json({ ok: true, drift: drift ?? null, integrity: integrity ?? null });
  } catch (err: unknown) {
    console.error("Admin schema-audit GET error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Failed to run schema audit" },
      { status: 500 }
    );
  }
}
