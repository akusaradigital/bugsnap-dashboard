import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { isRequestAdminAuthenticated } from "@/lib/admin-auth";
import { SecurityEvent } from "@/lib/security-audit";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!(await isRequestAdminAuthenticated(req))) {
    return NextResponse.json(
      { error: "Forbidden: Super Admin only" },
      { status: 403 },
    );
  }

  try {
    const db = createServiceClient();
    const { data } = await db
      .from("security_audit_logs")
      .select("id, type, title, detail, ip, created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    const logs: SecurityEvent[] = (data ?? []) as SecurityEvent[];

    // Counted server-side over the whole table, not over the 500 rows above -
    // otherwise the totals quietly plateau once history exceeds the page.
    const countOf = async (types: string[]) =>
      (
        await db
          .from("security_audit_logs")
          .select("id", { count: "exact", head: true })
          .in("type", types)
      ).count ?? 0;

    const [
      total,
      honeypot,
      spam_email,
      turnstile_fail,
      admin_login,
      admin_action,
    ] = await Promise.all([
      db
        .from("security_audit_logs")
        .select("id", { count: "exact", head: true })
        .then((r) => r.count ?? 0),
      countOf(["honeypot_trap"]),
      countOf(["spam_email"]),
      countOf(["turnstile_fail"]),
      countOf(["admin_login_success", "admin_login_failed"]),
      countOf(["admin_action"]),
    ]);
    const stats = {
      total,
      honeypot,
      spam_email,
      turnstile_fail,
      admin_login,
      admin_action,
    };

    // 30-day activity trend: day-bucketed total vs. threat-only counts.
    // Mirrors the dailyMap pattern in /api/admin/data/route.ts.
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: trendRows } = await db
      .from("security_audit_logs")
      .select("type, created_at")
      .gte("created_at", thirtyDaysAgo)
      .limit(5000);

    const trendMap: Record<
      string,
      { date: string; label: string; total: number; threats: number; admin: number }
    > = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const yyyyMmDd = d.toISOString().split("T")[0];
      const dayLabel = d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit" });
      trendMap[yyyyMmDd] = { date: yyyyMmDd, label: dayLabel, total: 0, threats: 0, admin: 0 };
    }
    const THREAT_TYPES = new Set(["honeypot_trap", "spam_email", "turnstile_fail"]);
    const ADMIN_TYPES = new Set(["admin_action", "admin_login_success", "admin_login_failed", "admin_password_change"]);
    (trendRows || []).forEach((row) => {
      if (!row.created_at) return;
      const day = row.created_at.split("T")[0];
      const bucket = trendMap[day];
      if (!bucket) return;
      bucket.total += 1;
      if (THREAT_TYPES.has(row.type)) bucket.threats += 1;
      if (ADMIN_TYPES.has(row.type)) bucket.admin += 1;
    });
    const trend = Object.values(trendMap);

    return NextResponse.json({ ok: true, stats, logs, trend });
  } catch (err) {
    console.error("[Admin Security Audit API] GET Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  if (!(await isRequestAdminAuthenticated(req))) {
    return NextResponse.json(
      { error: "Forbidden: Super Admin only" },
      { status: 403 },
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const daysParam = searchParams.get("days");
    const db = createServiceClient();

    if (daysParam) {
      const days = parseInt(daysParam, 10);
      if (Number.isFinite(days) && days > 0) {
        const cutoffIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        const { error } = await db
          .from("security_audit_logs")
          .delete()
          .lt("created_at", cutoffIso);

        if (error) throw error;

        return NextResponse.json({
          ok: true,
          message: `Security logs older than ${days} days purged`,
        });
      }
    }

    // .neq on the PK is how supabase-js expresses "delete all" - it refuses an
    // unfiltered delete, and no id is ever the empty string.
    const { error } = await db.from("security_audit_logs").delete().neq("id", "");
    if (error) throw error;

    return NextResponse.json({ ok: true, message: "Security logs cleared" });
  } catch (err) {
    console.error("[Admin Security Audit API] DELETE Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
