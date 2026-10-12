// Single source of truth for admin nav routes, shared by layout.tsx (sidebar)
// and CommandPalette.tsx (Ctrl+K) so the two can't drift out of sync.

import { APP_ICONS } from "@/lib/icons";

export type AdminNavHub = "overview" | "users" | "revenue" | "operations" | "system";

export interface AdminNavRoute {
  id: string;
  href: string;
  icon: string;
  titleKey: string;
  keywords: string[];
  hub: AdminNavHub;
  badgeKey?: "support";
}

export const ADMIN_NAV_ROUTES: AdminNavRoute[] = [
  {
    id: "overview",
    href: "/admin",
    icon: APP_ICONS.nav.dashboard,
    titleKey: "nav.dashboard",
    keywords: ["overview", "stats", "metrics", "ringkasan", "pulse"],
    hub: "overview",
  },
  {
    id: "users",
    href: "/admin/users",
    icon: APP_ICONS.nav.users,
    titleKey: "admin.manageUsers",
    keywords: ["users", "pengguna", "accounts", "pelanggan", "members"],
    hub: "users",
  },
  {
    id: "workspaces",
    href: "/admin/workspaces",
    icon: APP_ICONS.nav.workspaces,
    titleKey: "admin.navWorkspaces",
    keywords: ["workspaces", "teams", "organisasi", "ruang kerja"],
    hub: "users",
  },
  {
    id: "captures",
    href: "/admin/captures",
    icon: APP_ICONS.nav.captures,
    titleKey: "admin.navCaptures",
    keywords: ["captures", "tangkapan", "videos", "screenshots", "media"],
    hub: "users",
  },
  {
    id: "revenue",
    href: "/admin/revenue",
    icon: APP_ICONS.nav.revenue,
    titleKey: "admin.navRevenue",
    keywords: ["revenue", "sales", "mrr", "pendapatan", "stripe", "subscribers", "leads"],
    hub: "revenue",
  },
  {
    id: "ai",
    href: "/admin/ai-analytics",
    icon: APP_ICONS.nav.aiAnalytics,
    titleKey: "admin.navAiAnalytics",
    keywords: ["ai", "tokens", "analytics", "claude", "gpt", "biaya"],
    hub: "revenue",
  },
  {
    id: "support",
    href: "/admin/support",
    icon: APP_ICONS.nav.support,
    titleKey: "admin.supportInbox",
    keywords: ["support", "tickets", "bantuan", "inbox", "cs", "issues"],
    hub: "operations",
    badgeKey: "support",
  },
  {
    id: "extension",
    href: "/admin/extension",
    icon: APP_ICONS.nav.extensionFleet,
    titleKey: "admin.extensionFleet",
    keywords: ["extension", "chrome", "fleet", "versions", "versi", "heartbeat"],
    hub: "operations",
  },
  {
    id: "email",
    href: "/admin/email-health",
    icon: APP_ICONS.nav.emailHealth,
    titleKey: "admin.emailHealth",
    keywords: ["email", "resend", "health", "surat", "deliverability"],
    hub: "operations",
  },
  {
    id: "supabase",
    href: "/admin/supabase",
    icon: APP_ICONS.nav.supabase,
    titleKey: "admin.navSupabase",
    keywords: ["supabase", "database", "storage", "quota", "tables", "vacuum", "connections", "db"],
    hub: "system",
  },
  {
    id: "system",
    href: "/admin/system",
    icon: APP_ICONS.nav.system,
    titleKey: "admin.systemDrive",
    keywords: ["system", "drive", "google", "sistem", "database", "supabase", "health"],
    hub: "system",
  },
  {
    id: "security",
    href: "/admin/security-audit",
    icon: APP_ICONS.nav.securityAudit,
    titleKey: "admin.auditTitle",
    keywords: ["security", "audit", "logs", "keamanan", "access"],
    hub: "system",
  },
];

export const ADMIN_NAV_HUBS: Record<
  AdminNavHub,
  { titleKey: string; href: string; icon: string; badgeKey?: "support" }
> = {
  overview: { titleKey: "admin.hubOverview", href: "/admin", icon: APP_ICONS.nav.dashboard },
  users: { titleKey: "admin.hubUsers", href: "/admin/users", icon: APP_ICONS.nav.users },
  revenue: { titleKey: "admin.hubRevenue", href: "/admin/revenue", icon: APP_ICONS.nav.revenue },
  operations: { titleKey: "admin.hubOperations", href: "/admin/support", icon: APP_ICONS.nav.support, badgeKey: "support" },
  system: { titleKey: "admin.hubSystem", href: "/admin/supabase", icon: APP_ICONS.nav.system },
};

export const ADMIN_NAV_HUB_ORDER: AdminNavHub[] = ["overview", "users", "revenue", "operations", "system"];
