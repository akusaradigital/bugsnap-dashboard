import { NextResponse } from "next/server";
import { isRequestAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export interface AdminNotificationItem {
  id: string;
  category: "support" | "security" | "extension" | "email" | "integrations" | "system";
  title: string;
  description: string;
  time: string;
  href: string;
  severity: "info" | "warning" | "error" | "success";
  unread: boolean;
}

export async function GET(req: Request) {
  const isAuth = await isRequestAdminAuthenticated(req);
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = createServiceClient();
    const notifications: AdminNotificationItem[] = [];

    // 1. Support Tickets Query
    const { data: openTickets, error: ticketError } = await db
      .from("support_tickets")
      .select("id, subject, category, created_at, user_email")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(5);

    if (!ticketError && openTickets && openTickets.length > 0) {
      notifications.push({
        id: `support-${openTickets[0].id}`,
        category: "support",
        title: `${openTickets.length} Tiket Baru Terbuka`,
        description: `Tiket terakhir: "${openTickets[0].subject}" dari ${openTickets[0].user_email}`,
        time: openTickets[0].created_at || new Date().toISOString(),
        href: "/admin/support",
        severity: "warning",
        unread: true,
      });
    }

    // 2. Security Audit Logs Query
    // The table, not app_settings: logSecurityEvent() has written to
    // security_audit_logs since 20260908150000, so the old key lookup found
    // nothing and admin threat alerts never fired.
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentThreats } = await db
      .from("security_audit_logs")
      .select("id, type, detail, created_at")
      .gte("created_at", oneDayAgo)
      .in("type", ["honeypot_trap", "turnstile_fail", "spam_email"])
      .order("created_at", { ascending: false })
      .limit(50);

    if (recentThreats && recentThreats.length > 0) {
      const first = recentThreats[0] as { id?: string; type: string; detail?: string; created_at?: string };
      notifications.push({
        id: `sec-${first.id || "recent"}`,
        category: "security",
        title: `${recentThreats.length} Ancaman Terdeteksi (24 Jam)`,
        description: `Aktivitas mencurigakan dicegah: ${first.type} (${first.detail || "blocked"})`,
        time: first.created_at || new Date().toISOString(),
        href: "/admin/security-audit",
        severity: "error",
        unread: true,
      });
    }

    // 3. Extension Fleet Status
    const { data: extData } = await db
      .from("app_settings")
      .select("value")
      .eq("key", "extension_config")
      .maybeSingle();

    if (extData?.value && typeof extData.value === "object") {
      const config = extData.value as { forceUpdate?: boolean; maintenanceMode?: boolean; minVersion?: string };
      if (config.maintenanceMode) {
        notifications.push({
          id: "ext-maintenance",
          category: "extension",
          title: "Mode Maintenance Ekstensi Aktif",
          description: "Seluruh permintaan ekstensi saat ini dalam mode maintenance.",
          time: new Date().toISOString(),
          href: "/admin/extension",
          severity: "warning",
          unread: true,
        });
      }
      if (config.forceUpdate) {
        notifications.push({
          id: "ext-force-update",
          category: "extension",
          title: "Force Update Diberlakukan",
          description: `Ekstensi diwajibkan update ke versi minimal ${config.minVersion || "terbaru"}.`,
          time: new Date().toISOString(),
          href: "/admin/extension",
          severity: "info",
          unread: false,
        });
      }
    }

    // 4. Integrations Health Probe
    try {
      const pingStart = Date.now();
      await db.from("users").select("id", { count: "exact", head: true });
      const latency = Date.now() - pingStart;

      if (latency > 1500) {
        notifications.push({
          id: "db-high-latency",
          category: "integrations",
          title: "Latensi Supabase Tinggi",
          description: `Koneksi database memerlukan waktu ${latency}ms untuk merespons.`,
          time: new Date().toISOString(),
          href: "/admin/system",
          severity: "warning",
          unread: false,
        });
      }
    } catch {
      notifications.push({
        id: "db-error",
        category: "integrations",
        title: "Koneksi Supabase DB Terkendala",
        description: "Gagal menyambung ke database Supabase.",
        time: new Date().toISOString(),
        href: "/admin/system",
        severity: "error",
        unread: true,
      });
    }

    // 5. System Status (Always a baseline status)
    if (notifications.length === 0) {
      notifications.push({
        id: "sys-healthy",
        category: "system",
        title: "Platform Berjalan Normal",
        description: "Tidak ada ancaman atau tiket terbuka yang memerlukan tindakan.",
        time: new Date().toISOString(),
        href: "/admin",
        severity: "success",
        unread: false,
      });
    }

    return NextResponse.json({
      ok: true,
      count: notifications.filter((n) => n.unread).length,
      notifications,
    });
  } catch (err: unknown) {
    console.error("[Admin Notifications] Error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Gagal memuat notifikasi admin." },
      { status: 500 }
    );
  }
}
