import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { isRequestAdminAuthenticated } from "@/lib/admin-auth";
import { SecurityEvent } from "@/lib/security-audit";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!(await isRequestAdminAuthenticated(req))) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
    const db = createServiceClient();
    const { data } = await db
      .from("security_audit_logs")
      .select("id, type, title, detail, ip, created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    const logs: SecurityEvent[] = (data ?? []) as SecurityEvent[];

    // Counted server-side over the whole table, not over the 500 rows above —
    // otherwise the totals quietly plateau once history exceeds the page.
    const countOf = async (types: string[]) =>
      (await db.from("security_audit_logs").select("id", { count: "exact", head: true }).in("type", types)).count ?? 0;

    const [total, honeypot, spam_email, turnstile_fail, admin_login, admin_action] = await Promise.all([
      db.from("security_audit_logs").select("id", { count: "exact", head: true }).then((r) => r.count ?? 0),
      countOf(["honeypot_trap"]),
      countOf(["spam_email"]),
      countOf(["turnstile_fail"]),
      countOf(["admin_login_success", "admin_login_failed"]),
      countOf(["admin_action"]),
    ]);
    const stats = { total, honeypot, spam_email, turnstile_fail, admin_login, admin_action };

    return NextResponse.json({ ok: true, stats, logs });
  } catch (err) {
    console.error("[Admin Security Audit API] GET Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!(await isRequestAdminAuthenticated(req))) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
    const db = createServiceClient();
    // .neq on the PK is how supabase-js expresses "delete all" — it refuses an
    // unfiltered delete, and no id is ever the empty string.
    await db.from("security_audit_logs").delete().neq("id", "");

    return NextResponse.json({ ok: true, message: "Security logs cleared" });
  } catch (err) {
    console.error("[Admin Security Audit API] DELETE Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
