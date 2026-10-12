import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/admin-auth";
import { getDriveConnectionHealth } from "@/lib/google-drive";

export const runtime = "nodejs";

// On-demand only (admin clicks "Run Check") - never auto-polled, since each
// connection costs one Google OAuth + Drive API round trip.
export async function GET(req: Request) {
  const { authorized, supabase } = await checkAdminAuth(req);
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
    const { data: rows, error } = await supabase
      .from("google_drive_connections")
      .select("user_id, google_email, updated_at");
    if (error) throw error;

    const userIds = (rows || []).map((r) => r.user_id).filter(Boolean);
    const emailMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: users } = await supabase.from("users").select("id, email").in("id", userIds);
      (users || []).forEach((u) => {
        emailMap[u.id] = u.email;
      });
    }

    const connections = await Promise.all(
      (rows || []).map(async (r) => {
        const health = await getDriveConnectionHealth(r.user_id);
        return {
          userId: r.user_id,
          email: emailMap[r.user_id] || "-",
          googleEmail: r.google_email,
          status: health.status,
          message: health.message,
          updatedAt: r.updated_at,
        };
      })
    );

    const atRiskUserIds = new Set(
      connections.filter((c) => c.status !== "connected").map((c) => c.userId)
    );

    let capturesAtRisk: Array<{ id: string; title: string | null; ownerEmail: string }> = [];
    if (atRiskUserIds.size > 0) {
      const { data: captures } = await supabase
        .from("captures")
        .select("id, title, user_id")
        .in("user_id", Array.from(atRiskUserIds));
      capturesAtRisk = (captures || []).map((c) => ({
        id: c.id,
        title: c.title,
        ownerEmail: emailMap[c.user_id as string] || "-",
      }));
    }

    return NextResponse.json({ ok: true, connections, capturesAtRisk });
  } catch (err: unknown) {
    console.error("Admin drive-health GET error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Failed to check Drive connection health" },
      { status: 500 }
    );
  }
}
