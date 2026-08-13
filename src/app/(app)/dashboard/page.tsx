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

function driveFileId(driveUrl: string): string | null {
  const m = driveUrl.match(/[?&]id=([^&]+)/) || driveUrl.match(/\/d\/([^/]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

function driveThumbUrl(driveUrl: string, size = 120): string | null {
  const id = driveFileId(driveUrl);
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w${size}` : null;
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
  const [thumbFailed, setThumbFailed] = useState<Record<string, boolean>>({});
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

  const totalCount = stats?.totals?.total_count ?? 0;
  const videoCount = stats?.totals?.video_count ?? 0;
  const screenshotCount = stats?.totals?.screenshot_count ?? 0;

  const storageUsageMb = (screenshotCount * 0.2) + (videoCount * 4.5);
  const storageUsageText = storageUsageMb > 1024
    ? `${(storageUsageMb / 1024).toFixed(1)} GB`
    : `${storageUsageMb.toFixed(1)} MB`;

  const contributors = (stats?.top_contributors ?? []).map((c) => ({ email: c.email, count: c.count }));
  const thisWeekCount = stats?.week?.new_this_week_owner ?? 0;
  const recent = stats?.recent ?? [];

  const days: { label: string; count: number }[] = (stats?.week?.day_counts ?? []).map((d) => ({
    label: d.label,
    count: d.owner_count ?? 0,
  }));
  const maxDayCount = Math.max(1, ...days.map((d) => d.count));

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-border bg-subtle p-5 animate-pulse flex flex-col gap-3">
              <div className="w-12 h-12 bg-subtle rounded-xl" />
              <div className="w-1/2 h-3 bg-subtle rounded mt-2" />
              <div className="w-2/3 h-8 bg-subtle rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 rounded-2xl border border-border bg-subtle p-6 animate-pulse space-y-4">
            <div className="w-1/3 h-4 bg-subtle rounded" />
            <div className="h-44 bg-subtle rounded-xl" />
          </div>
          <div className="lg:col-span-2 rounded-2xl border border-border bg-subtle p-6 animate-pulse space-y-4">
            <div className="w-1/3 h-4 bg-subtle rounded" />
            <div className="h-44 bg-subtle rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("dash.welcome", { name: session.name.split(" ")[0] })} 👋
          </h1>
          <p className="text-sm text-muted mt-1">{t("dash.subtitle")}</p>
        </div>
        <Link
          href="/captures"
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all hover:shadow-md"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {t("dash.viewAll")}
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            labelKey: "dash.totalCaptures",
            value: totalCount,
            icon: (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            ),
            accent: "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/40",
            hoverAccent: "hover:border-indigo-400 hover:shadow-indigo-50/50",
          },
          {
            labelKey: "dash.recordings",
            value: videoCount,
            icon: (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            ),
            accent: "bg-rose-50 dark:bg-rose-950/30 text-rose-500 dark:text-rose-400 border-rose-200 dark:border-rose-800/40",
            hoverAccent: "hover:border-rose-400 hover:shadow-rose-50/50",
          },
          {
            labelKey: "dash.screenshots",
            value: screenshotCount,
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ),
            accent: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40",
            hoverAccent: "hover:border-emerald-400 hover:shadow-emerald-50/50",
          },
          {
            labelKey: "dash.storage",
            value: storageUsageText,
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            ),
            accent: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40",
            hoverAccent: "hover:border-amber-400 hover:shadow-amber-50/50",
          },
        ].map((stat) => (
          <div
            key={stat.labelKey}
            className={`rounded-2xl border border-border bg-subtle p-5 flex flex-col justify-between hover:shadow-lg transition-all duration-300 ${stat.hoverAccent}`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">{t(stat.labelKey)}</span>
              <span className={`w-9 h-9 rounded-xl flex items-center justify-center border ${stat.accent}`}>
                {stat.icon}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold tracking-tight text-foreground">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Activity Chart */}
        <div className="lg:col-span-3 rounded-2xl border border-border bg-subtle p-6 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-foreground">{t("dash.weekly")}</h2>
              <p className="text-xs text-muted mt-0.5">{t("dash.last7")}</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted font-medium bg-subtle px-2.5 py-1 rounded-lg border border-border">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              {t("dash.totalCaptures")}
            </div>
          </div>

          <div className="relative h-44 flex flex-col justify-end mt-2">
            {/* Chart Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-7">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-full border-t border-dashed border-border/80" />
              ))}
            </div>

            {/* Bars container */}
            <div className="flex items-end gap-3.5 h-36 relative z-10">
              {days.map((d) => (
                <div key={d.label} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none bg-neutral-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm mb-1 absolute bottom-full">
                    {d.count} caps
                  </div>
                  {d.count > 0 ? (
                    <div
                      className="w-full max-w-[36px] rounded-t-lg bg-gradient-to-t from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 hover:scale-105 shadow-sm hover:shadow-md transition-all duration-200"
                      style={{ height: `${Math.max(8, (d.count / maxDayCount) * 110)}px` }}
                    />
                  ) : (
                    <div className="w-full max-w-[36px] rounded-t-lg bg-neutral-100 dark:bg-neutral-800 h-1" />
                  )}
                  <span className="text-[11px] text-muted font-medium mt-1">{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-subtle p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-foreground">{t("dash.recent")}</h2>
              <p className="text-xs text-muted mt-0.5">Your workspace uploads</p>
            </div>
            <Link href="/captures" className="text-xs text-indigo-600 font-bold hover:underline">
              {t("dash.viewAllShort")}
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="py-12 text-center space-y-3 flex-1 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-subtle flex items-center justify-center text-muted">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-foreground">{t("dash.none")}</p>
              <p className="text-xs text-muted max-w-[200px] leading-relaxed">{t("dash.tryExt")}</p>
            </div>
          ) : (
            <div className="space-y-3.5 overflow-y-auto max-h-[190px] pr-1 flex-1 mt-2">
              {recent.map((c) => {
                const thumb = driveThumbUrl(c.drive_url, 120);
                const showThumb = thumb && !thumbFailed[c.id];
                return (
                  <Link
                    key={c.id}
                    href={`/v/${c.id}`}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-subtle/60 border border-transparent hover:border-border transition-all group"
                  >
                    {/* Tiny Thumbnail */}
                    <div className="w-14 h-9 rounded-lg bg-subtle shrink-0 overflow-hidden flex items-center justify-center relative border border-border">
                      {showThumb ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={thumb!}
                            alt=""
                            referrerPolicy="no-referrer"
                            onError={() => setThumbFailed((prev) => ({ ...prev, [c.id]: true }))}
                            className="w-full h-full object-cover"
                          />
                          {c.type === "video" && (
                            <div className="absolute inset-0 bg-black/15 flex items-center justify-center">
                              <span className="w-4 h-4 rounded-full bg-background/95 flex items-center justify-center shadow-sm">
                                <svg className="w-2.5 h-2.5 text-indigo-600 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <span>{c.type === "video" ? "🎥" : "📷"}</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate group-hover:text-indigo-600 transition-colors">
                        {c.title}
                      </p>
                      <p className="text-[10px] text-muted mt-0.5">
                        {timeAgo(c.created_at, t)}
                      </p>
                    </div>

                    <svg className="w-4 h-4 text-muted group-hover:text-foreground shrink-0 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Team Analytics */}
      {recent.length > 0 && (
        <div className="rounded-2xl border border-border bg-subtle p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/60">
            <div>
              <h2 className="text-base font-bold text-foreground">{t("dash.team")}</h2>
              <p className="text-xs text-muted mt-0.5">Workspace-wide collaborations</p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-800/40">
              {t("dash.allTime")}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Column 1: Capture Types */}
            <div className="pr-4 md:border-r border-border/60 space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                {t("dash.types")}
              </p>
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted flex items-center gap-1.5">🎥 {t("dash.videos")}</span>
                    <span className="font-bold text-foreground">{videoCount}</span>
                  </div>
                  <div className="w-full bg-subtle h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full"
                      style={{ width: `${totalCount > 0 ? (videoCount / totalCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted flex items-center gap-1.5">📷 {t("dash.shots")}</span>
                    <span className="font-bold text-foreground">{screenshotCount}</span>
                  </div>
                  <div className="w-full bg-subtle h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${totalCount > 0 ? (screenshotCount / totalCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-3 border-t border-dashed border-border/60">
                  <span className="font-semibold text-foreground">{t("dash.totalCaptures")}</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-800/40">
                    {totalCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Column 2: Weekly Recap */}
            <div className="pr-4 md:border-r border-border/60 space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                {t("dash.week")}
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs border border-border p-2.5 rounded-xl bg-subtle/30">
                  <span className="text-muted">{t("dash.newThisWeek")}</span>
                  <span className="font-bold text-foreground bg-subtle px-2 py-0.5 rounded border border-border shadow-sm">
                    {thisWeekCount}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs border border-border p-2.5 rounded-xl bg-subtle/30">
                  <span className="text-muted">{t("dash.busiest")}</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-800/40">
                    {days.reduce((a, b) => (b.count > a.count ? b : a), days[0])?.label || "None"}
                  </span>
                </div>
              </div>
            </div>

            {/* Column 3: Leaderboard */}
            <div className="space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                {t("dash.board")}
              </p>
              <div className="space-y-3 max-h-36 overflow-y-auto pr-1">
                {contributors.map((c) => (
                  <div key={c.email} className="flex items-center justify-between text-xs p-1 hover:bg-subtle/40 rounded-lg transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-6 h-6 rounded-full ${getAvatarColor(c.email)} text-white text-[10px] font-bold flex items-center justify-center shrink-0`}>
                        {getOwnerInitial(c.email)}
                      </span>
                      <span className="text-foreground font-semibold truncate" title={c.email}>
                        {c.email.split("@")[0]}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-800/40 shrink-0">
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
