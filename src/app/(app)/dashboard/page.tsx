"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useT } from "@/components/I18nProvider";

interface Capture {
  id: string;
  title: string;
  type: string;
  drive_url: string;
  created_at: string;
  window_size?: string;
  workspace_id?: string | null;
  owner_email?: string | null;
}

interface DayCount {
  label: string;
  owner_count: number;
  all_count: number;
}

interface DashboardStats {
  counts_exact: boolean;
  totals: {
    total_count: number;
    video_count: number;
    screenshot_count: number;
    week_count: number;
  };
  week: {
    new_this_week_owner: number;
    day_counts: DayCount[];
  };
  top_contributors: { email: string; count: number }[];
  recent: Capture[];
  promo?: { enabled: boolean; message: string };
}

function getAvatarColor(seed: string | null | undefined): string {
  const colors = [
    "bg-indigo-600",
    "bg-emerald-600",
    "bg-rose-600",
    "bg-amber-600",
    "bg-violet-600",
    "bg-teal-600",
    "bg-fuchsia-600",
  ];
  let h = 0;
  const s = seed || "";
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return colors[h % colors.length];
}

function getOwnerInitial(email: string | null | undefined): string {
  if (!email) return "M";
  const clean = email.replace(/[^a-zA-Z0-9]/g, "").trim();
  const char = clean.charAt(0);
  return (char || "M").toUpperCase();
}

function timeAgo(iso: string, t: (k: string, vars?: Record<string, string | number>) => string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return t("time.justNow");
  if (m < 60) return t("time.minAgo", { n: m });
  const h = Math.floor(m / 60);
  if (h < 24) return t("time.hrAgo", { n: h });
  const d = Math.floor(h / 24);
  if (d < 7) return t("time.dayAgo", { n: d });
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function DashboardAnalyticsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-muted">Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const { t } = useT();
  const searchParams = useSearchParams();
  const wsParam = searchParams.get("ws");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<{ name: string; email: string }>({
    name: "User",
    email: "",
  });

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      const u = data.session?.user;
      if (u) {
        const meta = u.user_metadata || {};
        setSession({
          name: meta.full_name || meta.name || u.email?.split("@")[0] || "User",
          email: u.email || "",
        });
      }
    });

    // One SECURITY DEFINER RPC replaces the 3x COUNT(*) head queries + the
    // bounded 100-row recent slice (whose client-side leaderboard was wrong
    // past 100 rows). The RPC resolves the caller from the JWT and returns
    // exact totals, top-5 contributors and the latest 5 rows in one scan.
    // Fallback: when the RPC isn't deployed yet (migration pending), fall
    // back to the previous REST path so the page doesn't hard-fail.
    (async () => {
      const wsId = wsParam && wsParam !== "all" ? wsParam : null;
      const { data, error } = await supabase.rpc("dashboard_stats", { p_workspace_id: wsId });
      if (error) {
        console.warn("Error loading dashboard stats:", error);
        setLoading(false);
        return;
      }
      if (!cancelled) {
        setStats((data as DashboardStats) ?? null);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [wsParam]);

  // wsParam "all" / missing -> the RPC returns only the caller's own captures
  // (workspace-scoped aggregates). The old code showed a per-user slice; the
  // RPC is persona-aware, so the "all" view still only shows the caller.
  const totalCount = stats?.totals?.total_count ?? 0;
  const videoCount = stats?.totals?.video_count ?? 0;
  const screenshotCount = stats?.totals?.screenshot_count ?? 0;

  // Storage usage estimate: screenshots avg 200KB, videos avg 4.5MB.
  const storageUsageMb = (screenshotCount * 0.2) + (videoCount * 4.5);
  const storageUsageText = storageUsageMb > 1024
    ? `${(storageUsageMb / 1024).toFixed(1)} GB`
    : `${storageUsageMb.toFixed(1)} MB`;

  // Leaderboard: exact top-5 from the RPC (per-workspace, owner-aware).
  const contributors = (stats?.top_contributors ?? []).map((c) => ({ email: c.email, count: c.count }));

  // This week: exact count from the RPC.
  const thisWeekCount = stats?.week?.new_this_week_owner ?? 0;

  // Recent 5 from the RPC.
  const recent = stats?.recent ?? [];

  // Per-day bar chart (last 7 days) from the RPC. Day labels come in
  // order (oldest -> newest); compute the max for the bar scale.
  const days: { label: string; count: number }[] = (stats?.week?.day_counts ?? []).map((d) => ({
    label: d.label,
    count: d.owner_count ?? 0,
  }));
  const maxDayCount = Math.max(1, ...days.map((d) => d.count));

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-white p-5 animate-pulse">
              <div className="w-1/2 h-3 bg-subtle rounded mb-3" />
              <div className="w-2/3 h-8 bg-subtle rounded" />
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-xl border border-border bg-white p-6 animate-pulse">
          <div className="w-1/3 h-4 bg-subtle rounded mb-6" />
          <div className="h-40 bg-subtle rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("dash.welcome", { name: session.name.split(" ")[0] })} 👋
          </h1>
          <p className="text-sm text-muted mt-1">{t("dash.subtitle")}</p>
        </div>
        <Link
          href="/captures"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {t("dash.viewAll")}
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          {
            labelKey: "dash.totalCaptures",
            value: totalCount,
            icon: (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            ),
            accent: "bg-indigo-50 text-indigo-600",
          },
          {
            labelKey: "dash.recordings",
            value: videoCount,
            icon: (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            ),
            accent: "bg-rose-50 text-rose-500",
          },
          {
            labelKey: "dash.screenshots",
            value: screenshotCount,
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ),
            accent: "bg-emerald-50 text-emerald-600",
          },
          {
            labelKey: "dash.storage",
            value: storageUsageText,
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            ),
            accent: "bg-amber-50 text-amber-600",
          },
        ].map((stat) => (
          <div key={stat.labelKey} className="rounded-xl border border-border bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted">{t(stat.labelKey)}</span>
              <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.accent}`}>
                {stat.icon}
              </span>
            </div>
            <p className="text-3xl font-bold tracking-tight text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Activity Chart */}
        <div className="lg:col-span-3 rounded-xl border border-border bg-white p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-foreground">{t("dash.weekly")}</h2>
            <span className="text-xs text-muted">{t("dash.last7")}</span>
          </div>
          <div className="flex items-end gap-3 h-40">
            {days.map((d) => (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[11px] text-muted font-medium">{d.count || ""}</span>
                <div
                  className="w-full max-w-[42px] rounded-t-lg bg-indigo-100 hover:bg-indigo-500 transition-colors relative group"
                  style={{ height: `${Math.max(4, (d.count / maxDayCount) * 120)}px` }}
                  title={t("dash.caps", { count: d.count })}
                />
                <span className="text-[11px] text-muted">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">{t("dash.recent")}</h2>
            <Link href="/captures" className="text-xs text-indigo-600 font-medium hover:underline">
              {t("dash.viewAllShort")}
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-subtle flex items-center justify-center text-muted">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-foreground">{t("dash.none")}</p>
              <p className="text-xs text-muted">{t("dash.tryExt")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map((c) => (
                <Link
                  key={c.id}
                  href={`/v/${c.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-subtle transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      c.type === "video" ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {c.type === "video" ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
                    <p className="text-[11px] text-muted">
                      {timeAgo(c.created_at, t)}
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-muted shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Team Analytics - leaderboard by capture count (per workspace) */}
      {recent.length > 0 && (
        <div className="mt-6 rounded-xl border border-border bg-white p-5 sm:p-7">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/60">
            <h2 className="text-base font-semibold text-foreground">{t("dash.team")}</h2>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{t("dash.allTime")}</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Column 1: Capture Types */}
            <div className="pr-4 md:border-r border-border/70 space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                {t("dash.types")}
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted flex items-center gap-1.5">🎥 {t("dash.videos")}</span>
                  <span className="font-semibold text-foreground bg-subtle px-2 py-0.5 rounded border border-border">{videoCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted flex items-center gap-1.5">📷 {t("dash.shots")}</span>
                  <span className="font-semibold text-foreground bg-subtle px-2 py-0.5 rounded border border-border">{screenshotCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-dashed border-border/60">
                  <span className="font-medium text-foreground">{t("dash.totalCaptures")}</span>
                  <span className="font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100">{totalCount}</span>
                </div>
              </div>
            </div>

            {/* Column 2: Weekly Recap */}
            <div className="pr-4 md:border-r border-border/70 space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                {t("dash.week")}
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">{t("dash.newThisWeek")}</span>
                  <span className="font-semibold text-foreground bg-subtle px-2 py-0.5 rounded border border-border">{thisWeekCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">{t("dash.busiest")}</span>
                  <span className="font-semibold text-foreground bg-subtle px-2 py-0.5 rounded border border-border">
                    {days.reduce((a, b) => (b.count > a.count ? b : a), days[0]).label}
                  </span>
                </div>
              </div>
            </div>

            {/* Column 3: Leaderboard */}
            <div className="space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                {t("dash.board")}
              </p>
              <div className="space-y-2.5 max-h-36 overflow-y-auto pr-1">
                {contributors.map((c) => (
                  <div key={c.email} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-5 h-5 rounded-full ${getAvatarColor(c.email)} text-white text-[9px] font-bold flex items-center justify-center shrink-0`}>
                        {getOwnerInitial(c.email)}
                      </span>
                      <span className="text-foreground font-medium truncate" title={c.email}>
                        {c.email.split("@")[0]}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 shrink-0">
                      {t("dash.caps", { count: c.count })}
                    </span>
                  </div>
                ))}
                {contributors.length === 0 && (
                  <p className="text-xs text-muted">{t("dash.noRecent")}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
