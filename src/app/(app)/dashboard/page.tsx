"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useT } from "@/components/I18nProvider";

interface DayCount {
  day: number; // 1 to 31
  label: string;
  count: number;
}

interface DashboardStats {
  counts_exact: boolean;
  totals: {
    total_count: number;
    video_count: number;
    screenshot_count: number;
    week_count: number;
  };
  promo?: { enabled: boolean; message: string };
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
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [dailyCounts, setDailyCounts] = useState<number[]>([]);
  const [monthlyLoading, setMonthlyLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<{ name: string; email: string }>({
    name: "User",
    email: "",
  });

  const [qaData, setQaData] = useState<{
    statusCounts: { open: number; inProgress: number; fixed: number; closed: number };
    resolutionRate: number;
    topBuggyPages: Array<{ domain: string; path: string; count: number }>;
    browserBreakdown: Array<{ name: string; count: number; percent: number; color: string }>;
    osBreakdown: Array<{ name: string; count: number; percent: number; color: string }>;
    loading: boolean;
  }>({
    statusCounts: { open: 0, inProgress: 0, fixed: 0, closed: 0 },
    resolutionRate: 0,
    topBuggyPages: [],
    browserBreakdown: [],
    osBreakdown: [],
    loading: true
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

    // Fetch workspace defect intelligence
    (async () => {
      let q = supabase
        .from("captures")
        .select("id, title, status, tag, site_url, browser, os, created_at")
        .order("created_at", { ascending: false })
        .limit(300);

      if (wsParam && wsParam !== "all") {
        q = q.eq("workspace_id", wsParam);
      }

      const { data, error } = await q;
      if (error || !data) {
        if (!cancelled) setQaData((prev) => ({ ...prev, loading: false }));
        return;
      }

      const statusCounts = { open: 0, inProgress: 0, fixed: 0, closed: 0 };
      const urlMap = new Map<string, { domain: string; path: string; count: number }>();
      const browserMap = new Map<string, number>();
      const osMap = new Map<string, number>();

      for (const item of data) {
        const st = (item.status || "open").toLowerCase();
        if (st === "fixed") statusCounts.fixed++;
        else if (st === "in-progress" || st === "inprogress") statusCounts.inProgress++;
        else if (st === "closed") statusCounts.closed++;
        else statusCounts.open++;

        if (item.site_url) {
          try {
            const parsed = new URL(item.site_url);
            const domain = parsed.hostname;
            const path = parsed.pathname.length > 1 ? parsed.pathname : "/";
            const key = `${domain}${path}`;
            const existing = urlMap.get(key);
            if (existing) existing.count++;
            else urlMap.set(key, { domain, path, count: 1 });
          } catch {
            const domain = item.site_url.slice(0, 30);
            const existing = urlMap.get(domain);
            if (existing) existing.count++;
            else urlMap.set(domain, { domain, path: "", count: 1 });
          }
        }

        const b = (item.browser || "Unknown").toLowerCase();
        let bKey = "Other";
        if (b.includes("chrome") && !b.includes("edg")) bKey = "Chrome";
        else if (b.includes("edg")) bKey = "Edge";
        else if (b.includes("safari") && !b.includes("chrome")) bKey = "Safari";
        else if (b.includes("firefox")) bKey = "Firefox";
        browserMap.set(bKey, (browserMap.get(bKey) || 0) + 1);

        const o = (item.os || "Unknown").toLowerCase();
        let oKey = "Other";
        if (o.includes("win")) oKey = "Windows";
        else if (o.includes("mac") || o.includes("darwin") || o.includes("ios") || o.includes("iphone")) oKey = "macOS / iOS";
        else if (o.includes("linux")) oKey = "Linux";
        else if (o.includes("android")) oKey = "Android";
        osMap.set(oKey, (osMap.get(oKey) || 0) + 1);
      }

      const totalStatus = statusCounts.open + statusCounts.inProgress + statusCounts.fixed + statusCounts.closed;
      const resolved = statusCounts.fixed + statusCounts.closed;
      const resolutionRate = totalStatus > 0 ? Math.round((resolved / totalStatus) * 100) : 100;

      const topBuggyPages = Array.from(urlMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const totalBrowsers = Math.max(1, Array.from(browserMap.values()).reduce((a, b) => a + b, 0));
      const browserColors: Record<string, string> = {
        Chrome: "bg-blue-500",
        Edge: "bg-cyan-500",
        Safari: "bg-sky-500",
        Firefox: "bg-orange-500",
        Other: "bg-zinc-400"
      };
      const browserBreakdown = Array.from(browserMap.entries())
        .map(([name, count]) => ({
          name,
          count,
          percent: Math.round((count / totalBrowsers) * 100),
          color: browserColors[name] || "bg-zinc-400"
        }))
        .sort((a, b) => b.count - a.count);

      const totalOs = Math.max(1, Array.from(osMap.values()).reduce((a, b) => a + b, 0));
      const osColors: Record<string, string> = {
        Windows: "bg-indigo-500",
        "macOS / iOS": "bg-purple-500",
        Linux: "bg-amber-500",
        Android: "bg-emerald-500",
        Other: "bg-zinc-400"
      };
      const osBreakdown = Array.from(osMap.entries())
        .map(([name, count]) => ({
          name,
          count,
          percent: Math.round((count / totalOs) * 100),
          color: osColors[name] || "bg-zinc-400"
        }))
        .sort((a, b) => b.count - a.count);

      if (!cancelled) {
        setQaData({
          statusCounts,
          resolutionRate,
          topBuggyPages,
          browserBreakdown,
          osBreakdown,
          loading: false
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [wsParam]);

  // Fetch daily captures for selected month and year
  useEffect(() => {
    let cancelled = false;
    setMonthlyLoading(true);

    (async () => {
      // Days in selected month (e.g. 28, 29, 30, or 31)
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const startMonthStr = String(selectedMonth + 1).padStart(2, "0");
      const startDate = `${selectedYear}-${startMonthStr}-01T00:00:00.000Z`;

      // Next month start date
      const nextYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
      const nextMonthStr = String((selectedMonth + 1) % 12 + 1).padStart(2, "0");
      const endDate = `${nextYear}-${nextMonthStr}-01T00:00:00.000Z`;

      let query = supabase
        .from("captures")
        .select("created_at")
        .gte("created_at", startDate)
        .lt("created_at", endDate);

      if (wsParam && wsParam !== "all") {
        query = query.eq("workspace_id", wsParam);
      }

      const { data, error } = await query;
      if (error) {
        console.warn("Error fetching daily captures:", error);
        if (!cancelled) setMonthlyLoading(false);
        return;
      }

      const counts = new Array(daysInMonth).fill(0);
      if (data) {
        for (const item of data) {
          if (item.created_at) {
            const d = new Date(item.created_at).getDate(); // 1 to 31
            if (d >= 1 && d <= daysInMonth) {
              counts[d - 1]++;
            }
          }
        }
      }

      if (!cancelled) {
        setDailyCounts(counts);
        setMonthlyLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedYear, selectedMonth, wsParam]);

  const totalCount = stats?.totals?.total_count ?? 0;
  const videoCount = stats?.totals?.video_count ?? 0;
  const screenshotCount = stats?.totals?.screenshot_count ?? 0;

  const storageUsageMb = (screenshotCount * 0.2) + (videoCount * 4.5);
  const storageUsageText = storageUsageMb > 1024
    ? `${(storageUsageMb / 1024).toFixed(1)} GB`
    : `${storageUsageMb.toFixed(1)} MB`;

  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const days: DayCount[] = Array.from({ length: daysInMonth }, (_, idx) => ({
    day: idx + 1,
    label: String(idx + 1),
    count: dailyCounts[idx] || 0,
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

      {/* Daily Activity Chart for Selected Month (Full Width) */}
      <div className="rounded-2xl border border-border bg-subtle p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-base font-bold text-foreground">{t("dash.monthly")}</h2>
            <p className="text-xs text-muted mt-0.5">
              {t("dash.monthActivity", { month: MONTH_NAMES[selectedMonth], year: selectedYear })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Month Selector */}
            <div className="flex items-center gap-1.5 bg-background border border-border rounded-xl px-2.5 py-1 text-xs font-semibold shadow-xs">
              <span className="text-muted">{t("dash.selectMonth")}:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent font-bold text-foreground outline-hidden cursor-pointer"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx} className="bg-background text-foreground">
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Selector */}
            <div className="flex items-center gap-1.5 bg-background border border-border rounded-xl px-2.5 py-1 text-xs font-semibold shadow-xs">
              <span className="text-muted">{t("dash.selectYear")}:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent font-bold text-foreground outline-hidden cursor-pointer"
              >
                {Array.from({ length: 6 }, (_, i) => currentYear - 3 + i).map((yr) => (
                  <option key={yr} value={yr} className="bg-background text-foreground">
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted font-medium bg-subtle px-2.5 py-1 rounded-lg border border-border">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              {t("dash.totalCaptures")}
            </div>
          </div>
        </div>

        <div className="relative h-48 flex flex-col justify-end mt-2">
          {/* Chart Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-7">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-full border-t border-dashed border-border/80" />
            ))}
          </div>

          {/* Bars container */}
          {monthlyLoading ? (
            <div className="flex items-end gap-1 sm:gap-1.5 md:gap-2 h-40 relative z-10 px-1 w-full">
              {days.map((d) => (
                <div key={d.day} className="flex-1 min-w-0 flex flex-col items-center gap-1.5 h-full justify-end animate-pulse">
                  <div className="w-full max-w-[18px] rounded-t-md bg-neutral-200 dark:bg-neutral-800 h-6" />
                  <span className="text-[9px] text-muted font-medium mt-1">{d.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-end gap-1 sm:gap-1.5 md:gap-2 h-40 relative z-10 px-1 w-full">
              {days.map((d) => {
                const edge = d.day <= 3 ? "left" : d.day > days.length - 3 ? "right" : "center";
                const tooltipPos =
                  edge === "left" ? "left-0" : edge === "right" ? "right-0" : "left-1/2 -translate-x-1/2";
                const arrowPos =
                  edge === "left" ? "left-3" : edge === "right" ? "right-3" : "left-1/2 -translate-x-1/2";
                return (
                <div key={d.day} className="flex-1 min-w-0 flex flex-col items-center gap-1.5 group h-full justify-end relative cursor-pointer">
                  {/* Tooltip on hover */}
                  <div className={`opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none bg-neutral-900 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-xl mb-2 absolute bottom-full ${tooltipPos} z-30 whitespace-nowrap`}>
                    {MONTH_NAMES[selectedMonth]} {d.day}: <span className="font-bold text-indigo-300">{d.count}</span>
                    <div className={`absolute top-full ${arrowPos} -mt-1 border-4 border-transparent border-t-neutral-900`} />
                  </div>
                  {d.count > 0 ? (
                    <div
                      className="w-full max-w-[20px] rounded-t-md bg-gradient-to-t from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 hover:scale-110 shadow-xs hover:shadow-md transition-all duration-200"
                      style={{ height: `${Math.max(8, (d.count / maxDayCount) * 125)}px` }}
                    />
                  ) : (
                    <div className="w-full max-w-[20px] rounded-t-sm bg-neutral-100 dark:bg-neutral-800/60 h-1.5 group-hover:bg-neutral-300 dark:group-hover:bg-neutral-700 transition-colors" />
                  )}
                  <span className="text-[9px] sm:text-[10px] text-muted font-medium mt-1 select-none">{d.label}</span>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* QA Intelligence & Workspace Insights */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">QA Intelligence & Defect Analytics</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                Live Telemetry
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Resolution health metrics, defect hotspots, and platform environment breakdown
            </p>
          </div>
          <Link
            href="/captures"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>Triage captures</span>
            <span>→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Card 1: Resolution Health */}
          <div className="rounded-2xl border border-border bg-subtle p-5 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">Defect Resolution Health</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/40">
                  {qaData.resolutionRate}% Resolved
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-extrabold tracking-tight text-foreground">{qaData.resolutionRate}%</span>
                <span className="text-xs text-muted">health score</span>
              </div>

              {/* Stacked Resolution Bar */}
              <div className="h-3 w-full rounded-full bg-neutral-200 dark:bg-neutral-800 flex overflow-hidden mb-4">
                {qaData.statusCounts.fixed + qaData.statusCounts.closed > 0 && (
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{
                      width: `${((qaData.statusCounts.fixed + qaData.statusCounts.closed) / Math.max(1, qaData.statusCounts.open + qaData.statusCounts.inProgress + qaData.statusCounts.fixed + qaData.statusCounts.closed)) * 100}%`
                    }}
                    title={`Fixed/Closed: ${qaData.statusCounts.fixed + qaData.statusCounts.closed}`}
                  />
                )}
                {qaData.statusCounts.inProgress > 0 && (
                  <div
                    className="bg-amber-500 h-full transition-all duration-500"
                    style={{
                      width: `${(qaData.statusCounts.inProgress / Math.max(1, qaData.statusCounts.open + qaData.statusCounts.inProgress + qaData.statusCounts.fixed + qaData.statusCounts.closed)) * 100}%`
                    }}
                    title={`In Progress: ${qaData.statusCounts.inProgress}`}
                  />
                )}
                {qaData.statusCounts.open > 0 && (
                  <div
                    className="bg-rose-500 h-full transition-all duration-500"
                    style={{
                      width: `${(qaData.statusCounts.open / Math.max(1, qaData.statusCounts.open + qaData.statusCounts.inProgress + qaData.statusCounts.fixed + qaData.statusCounts.closed)) * 100}%`
                    }}
                    title={`Open: ${qaData.statusCounts.open}`}
                  />
                )}
              </div>
            </div>

            {/* Status Legend */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/60 text-xs">
              <div className="flex flex-col">
                <span className="text-[11px] text-muted flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Open
                </span>
                <span className="text-sm font-bold text-foreground mt-0.5">{qaData.statusCounts.open}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-muted flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  In Progress
                </span>
                <span className="text-sm font-bold text-foreground mt-0.5">{qaData.statusCounts.inProgress}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-muted flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Fixed
                </span>
                <span className="text-sm font-bold text-foreground mt-0.5">{qaData.statusCounts.fixed + qaData.statusCounts.closed}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Top Buggy Pages */}
          <div className="rounded-2xl border border-border bg-subtle p-5 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">Defect Hotspots (Top URLs)</span>
                <span className="text-xs text-muted font-mono">{qaData.topBuggyPages.length} active</span>
              </div>

              {qaData.topBuggyPages.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted">
                  No site URLs recorded in recent captures
                </div>
              ) : (
                <div className="space-y-2.5">
                  {qaData.topBuggyPages.map((page, idx) => (
                    <Link
                      key={idx}
                      href={`/captures?search=${encodeURIComponent(page.domain)}`}
                      className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-background border border-transparent hover:border-border transition-all group"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {page.domain}
                        </p>
                        {page.path && (
                          <p className="text-[10px] text-muted font-mono truncate">
                            {page.path}
                          </p>
                        )}
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold shrink-0 border border-rose-100 dark:border-rose-900/50">
                        {page.count} {page.count === 1 ? "issue" : "issues"}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <p className="text-[11px] text-muted mt-3 pt-3 border-t border-border/60">
              Click any domain to filter and triage its captures
            </p>
          </div>

          {/* Card 3: Platform & Environment Distribution */}
          <div className="rounded-2xl border border-border bg-subtle p-5 flex flex-col justify-between shadow-xs">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted mb-3 block">Environment Breakdown</span>
              
              {/* Browsers */}
              <div className="mb-4">
                <span className="text-[11px] font-semibold text-muted mb-2 block">Browser Distribution</span>
                {qaData.browserBreakdown.length === 0 ? (
                  <div className="text-xs text-muted">No browser telemetry recorded</div>
                ) : (
                  <div className="space-y-2">
                    {qaData.browserBreakdown.slice(0, 4).map((b) => (
                      <div key={b.name} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-foreground">{b.name}</span>
                          <span className="text-muted font-mono">{b.percent}% ({b.count})</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                          <div className={`h-full ${b.color} rounded-full transition-all duration-500`} style={{ width: `${b.percent}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Operating Systems */}
              <div>
                <span className="text-[11px] font-semibold text-muted mb-2 block">Operating Systems</span>
                <div className="flex flex-wrap gap-2">
                  {qaData.osBreakdown.map((os) => (
                    <span
                      key={os.name}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background border border-border text-xs text-foreground font-medium"
                    >
                      <span className={`w-2 h-2 rounded-full ${os.color}`} />
                      <span>{os.name}</span>
                      <span className="text-muted font-mono font-bold text-[10px]">{os.percent}%</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-muted mt-3 pt-3 border-t border-border/60">
              Captured automatically via extension client user-agent
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
