"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/lib/iconify";
import { supabase } from "@/lib/supabase";
import { useT } from "@/components/I18nProvider";
import { fetchDriveStatus } from "@/lib/google-drive-values";
import { Dropdown } from "@/components/Dropdown";

interface DayCount {
  day: number; // 1 to 31
  label: string;
  count: number;
  videoCount: number;
  screenshotCount: number;
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

function formatBytes(bytes: number | null): string {
  if (!Number.isFinite(bytes) || bytes == null || bytes < 0) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let val = bytes;
  let i = 0;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  const isInteger = Math.abs(val - Math.round(val)) < 0.05;
  const decimals = isInteger || i === 0 ? 0 : 1;
  return `${val.toFixed(decimals)} ${units[i]}`;
}

function getBrowserIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("brave")) return "logos:brave";
  if (n.includes("chrome")) return "logos:chrome";
  if (n.includes("edge") || n.includes("edg")) return "logos:microsoft-edge";
  if (n.includes("firefox")) return "logos:firefox";
  if (n.includes("safari")) return "logos:safari";
  return "lucide:globe";
}

function getOsIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("win")) return "logos:windows";
  if (n.includes("mac") || n.includes("ios") || n.includes("apple") || n.includes("darwin")) return "logos:apple";
  if (n.includes("linux")) return "logos:linux";
  if (n.includes("android")) return "logos:android";
  return "lucide:cpu";
}

// Mini trend chart for stat cards - a filled-area sparkline driven by real
// per-day counts (never fabricated data). Each card gets its own gradient id
// so multiple instances on the same page don't share (and fight over) defs.
function StatSparkline({ data, color, gradientId }: { data: number[]; color: string; gradientId: string }) {
  if (!data || data.length < 2) return null;
  const width = 96;
  const height = 36;
  const max = Math.max(...data, 1);
  const step = width / (data.length - 1);

  const points = data.map((val, idx) => ({
    x: idx * step,
    y: height - (val / max) * (height - 6) - 3,
  }));
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  return (
    <svg className="overflow-visible shrink-0" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DashboardAnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 sm:p-12 max-w-6xl mx-auto flex flex-col items-center justify-center gap-3 min-h-[300px]" role="status" aria-label="Loading dashboard">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-subtle border border-border text-xs text-muted shadow-xs">
            <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin text-[#2563EB] dark:text-[#3B82F6] shrink-0" aria-hidden="true" />
            <span className="font-medium">Loading dashboard…</span>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const { t, locale } = useT();
  const searchParams = useSearchParams();
  const wsParam = searchParams.get("ws");
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [dailyCounts, setDailyCounts] = useState<number[]>([]);
  const [dailyVideoCounts, setDailyVideoCounts] = useState<number[]>([]);
  const [dailyScreenshotCounts, setDailyScreenshotCounts] = useState<number[]>([]);
  const [monthlyLoading, setMonthlyLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<{ name: string; email: string }>({
    name: "User",
    email: "",
  });

  const [driveQuota, setDriveQuota] = useState<{ usedBytes: number | null; totalBytes: number | null } | null>(null);

  const [qaData, setQaData] = useState<{
    browserBreakdown: Array<{ name: string; count: number; percent: number; color: string }>;
    osBreakdown: Array<{ name: string; count: number; percent: number; color: string }>;
    loading: boolean;
  }>({
    browserBreakdown: [],
    osBreakdown: [],
    loading: true,
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
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        const currentUserId = sessionData.session?.user?.id;
        if (!token) return;

        const cached = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("bs_drive_quota") : null;
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Date.now() - parsed.timestamp < 180000 && parsed.userId === currentUserId && parsed.data?.quota) {
              if (!cancelled) setDriveQuota(parsed.data.quota);
              return;
            }
          } catch {}
        }
        const json = (await fetchDriveStatus(token)) as { quota?: { usedBytes: number | null; totalBytes: number | null } } | null;
        if (!json) return;
        if (!cancelled && json.quota) {
          setDriveQuota(json.quota);
          try {
            sessionStorage.setItem("bs_drive_quota", JSON.stringify({ timestamp: Date.now(), data: json, userId: currentUserId }));
          } catch {}
        }
      } catch (err) {
        console.warn("Error fetching drive status:", err);
      }
    })();

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

    // Fetch workspace client environment telemetry
    (async () => {
      let q = supabase
        .from("captures")
        .select("browser, os")
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

      const browserMap = new Map<string, number>();
      const osMap = new Map<string, number>();

      for (const item of data) {
        const b = (item.browser || "Unknown").toLowerCase();
        let bKey = "Other";
        if (b.includes("brave")) bKey = "Brave";
        else if (b.includes("chrome") && !b.includes("edg")) bKey = "Chrome";
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

      const totalBrowsers = Math.max(1, Array.from(browserMap.values()).reduce((a, b) => a + b, 0));
      const browserColors: Record<string, string> = {
        Chrome: "bg-blue-500",
        Edge: "bg-cyan-500",
        Safari: "bg-sky-500",
        Firefox: "bg-orange-500",
        Brave: "bg-orange-600",
        Other: "bg-zinc-400",
      };
      const browserBreakdown = Array.from(browserMap.entries())
        .map(([name, count]) => ({
          name,
          count,
          percent: Math.round((count / totalBrowsers) * 100),
          color: browserColors[name] || "bg-zinc-400",
        }))
        .sort((a, b) => b.count - a.count);

      const totalOs = Math.max(1, Array.from(osMap.values()).reduce((a, b) => a + b, 0));
      const osColors: Record<string, string> = {
        Windows: "bg-blue-500",
        "macOS / iOS": "bg-slate-700 dark:bg-slate-300",
        Linux: "bg-amber-500",
        Android: "bg-emerald-500",
        Other: "bg-zinc-400",
      };
      const osBreakdown = Array.from(osMap.entries())
        .map(([name, count]) => ({
          name,
          count,
          percent: Math.round((count / totalOs) * 100),
          color: osColors[name] || "bg-zinc-400",
        }))
        .sort((a, b) => b.count - a.count);

      if (!cancelled) {
        setQaData({
          browserBreakdown,
          osBreakdown,
          loading: false,
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
        .select("created_at, type")
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
      const videoCounts = new Array(daysInMonth).fill(0);
      const screenshotCounts = new Array(daysInMonth).fill(0);
      if (data) {
        for (const item of data) {
          if (item.created_at) {
            const d = new Date(item.created_at).getDate(); // 1 to 31
            if (d >= 1 && d <= daysInMonth) {
              counts[d - 1]++;
              if (item.type === "video") {
                videoCounts[d - 1]++;
              } else {
                screenshotCounts[d - 1]++;
              }
            }
          }
        }
      }

      if (!cancelled) {
        setDailyCounts(counts);
        setDailyVideoCounts(videoCounts);
        setDailyScreenshotCounts(screenshotCounts);
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

  const storageUsageText = driveQuota && driveQuota.usedBytes != null
    ? formatBytes(driveQuota.usedBytes)
    : "-";
  const storageSubtext = driveQuota && driveQuota.totalBytes != null
    ? `${formatBytes(driveQuota.usedBytes)} / ${formatBytes(driveQuota.totalBytes)}`
    : t("dash.driveBackup");

  // Intl already knows every locale's month names - 24 i18n keys would just
  // restate what the platform ships. Keyed on `locale` so switching language
  // relabels the chart without a reload.
  const MONTH_NAMES = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", { month: "long" });
    return Array.from({ length: 12 }, (_, m) => fmt.format(new Date(2000, m, 1)));
  }, [locale]);

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const days: DayCount[] = Array.from({ length: daysInMonth }, (_, idx) => ({
    day: idx + 1,
    label: String(idx + 1),
    count: dailyCounts[idx] || 0,
    videoCount: dailyVideoCounts[idx] || 0,
    screenshotCount: dailyScreenshotCounts[idx] || 0,
  }));
  const maxDayCount = Math.max(1, ...days.map((d) => d.count));

  // Stat-card sparklines reuse the same real per-day rows the Monthly
  // Activity chart already fetched for the selected month - no extra query,
  // no fabricated points. For the current month, only days elapsed so far
  // have data; for a past month every day is already final. Trailing slice
  // to the last 14 populated days keeps the line readable either way.
  const elapsedDays = selectedYear === currentYear && selectedMonth === currentMonth ? now.getDate() : daysInMonth;
  const trendSlice = (arr: number[]) => arr.slice(0, elapsedDays).slice(-14);
  const captureTrend = trendSlice(dailyCounts);
  const videoTrend = trendSlice(dailyVideoCounts);
  const screenshotTrend = trendSlice(dailyScreenshotCounts);

  if (loading) {
    return (
      <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 min-w-0 w-full overflow-x-hidden" role="status" aria-label={locale === "id" ? "Memuat analitik..." : "Loading analytics..."}>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-xs text-[#2563EB] dark:text-[#3B82F6] font-medium">
          <Icon icon="lucide:loader-2" className="w-3.5 h-3.5 animate-spin shrink-0 text-[#2563EB] dark:text-[#3B82F6]" aria-hidden="true" />
          <span>{locale === "id" ? "Memuat analitik..." : "Loading analytics..."}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-border bg-subtle p-5 animate-pulse flex flex-col gap-3">
              <div className="w-12 h-12 bg-border/40 rounded-xl" />
              <div className="w-1/2 h-3 bg-border/40 rounded mt-2" />
              <div className="w-2/3 h-8 bg-border/40 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 rounded-2xl border border-border bg-subtle p-6 animate-pulse space-y-4">
            <div className="w-1/3 h-4 bg-border/40 rounded" />
            <div className="h-44 bg-border/40 rounded-xl" />
          </div>
          <div className="lg:col-span-2 rounded-2xl border border-border bg-subtle p-6 animate-pulse space-y-4">
            <div className="w-1/3 h-4 bg-border/40 rounded" />
            <div className="h-44 bg-border/40 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-sky-100 to-sky-200 dark:from-blue-950/40 dark:via-blue-950/30 dark:to-blue-900/30 border border-blue-100 dark:border-blue-900/40 px-5 py-6 sm:px-8 sm:py-7">
        {/* Decorative background: dot grid + flowing wave shapes, clipped to the banner. */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div
            className="absolute inset-y-0 left-1/3 w-40 opacity-30 dark:opacity-20"
            style={{
              backgroundImage: "radial-gradient(circle, #2563EB 1px, transparent 1px)",
              backgroundSize: "12px 12px",
            }}
          />
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 1024 220"
            preserveAspectRatio="none"
            fill="none"
          >
            <path d="M560 0 C 700 70, 640 150, 800 220 L1024 220 L1024 0 Z" fill="#93C5FD" fillOpacity="0.6" />
            <path d="M660 0 C 790 60, 740 170, 900 220 L1024 220 L1024 0 Z" fill="#60A5FA" fillOpacity="0.75" />
            <path d="M760 0 C 870 50, 830 180, 980 220 L1024 220 L1024 0 Z" fill="#3B82F6" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              {t("dash.welcome", { name: session.name })}
              <span aria-hidden="true">👋</span>
            </h1>
            <p className="text-sm text-muted mt-1.5">{t("dash.subtitle")}</p>
          </div>

          <Link
            href="/captures"
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-95 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs shadow-[#2563EB]/25 transition-all hover:shadow-md touch-manipulation shrink-0"
          >
            <span>{t("dash.viewAll")}</span>
            <Icon icon="lucide:arrow-right" className="w-4 h-4 brightness-0 invert" />
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            labelKey: "dash.totalCaptures",
            value: totalCount,
            subtext: stats?.totals?.week_count
              ? `+${stats.totals.week_count} ${t("dash.week")}`
              : null,
            icon: <Icon icon="lucide:camera" className="w-5 h-5 shrink-0" />,
            accent: "bg-blue-50 dark:bg-blue-950/20 text-[#2563EB] dark:text-[#3B82F6] border-blue-200 dark:border-blue-900/40",
            hoverAccent: "hover:shadow-xs",
            trend: captureTrend,
            trendColor: "#2563EB",
          },
          {
            labelKey: "dash.recordings",
            value: videoCount,
            subtext: t("dash.videoRatio", {
              pct: totalCount > 0 ? Math.round((videoCount / totalCount) * 100) : 0,
            }),
            icon: <Icon icon="lucide:mic" className="w-5 h-5 shrink-0" />,
            accent: "bg-purple-50 dark:bg-purple-950/30 text-purple-500 dark:text-purple-400 border-purple-200 dark:border-purple-800/40",
            hoverAccent: "hover:shadow-purple-50/50 dark:hover:shadow-none",
            trend: videoTrend,
            trendColor: "#A855F7",
          },
          {
            labelKey: "dash.screenshots",
            value: screenshotCount,
            subtext: t("dash.shotRatio", {
              pct: totalCount > 0 ? Math.round((screenshotCount / totalCount) * 100) : 0,
            }),
            icon: <Icon icon="lucide:crop" className="w-5 h-5 shrink-0" />,
            accent: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40",
            hoverAccent: "hover:shadow-emerald-50/50 dark:hover:shadow-none",
            trend: screenshotTrend,
            trendColor: "#10B981",
          },
          {
            labelKey: "dash.storage",
            value: storageUsageText,
            subtext: storageSubtext,
            icon: <Icon icon="lucide:database" className="w-5 h-5 shrink-0" />,
            accent: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40",
            hoverAccent: "hover:shadow-amber-50/50 dark:hover:shadow-none",
            // Google Drive only reports the current quota snapshot, not a
            // per-day history, so storage has no real trend to chart -
            // real-only data means this card simply has none.
            trend: null as number[] | null,
            trendColor: "#D97706",
          },
        ].map((stat) => (
          <div
            key={stat.labelKey}
            className={`rounded-2xl border border-border bg-subtle p-5 flex items-center justify-between gap-3 hover:shadow-md transition-all duration-300 ${stat.hoverAccent}`}
          >
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-foreground truncate">{t(stat.labelKey)}</h2>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground truncate mt-1">{stat.value}</p>
              <div className="mt-2 text-[11px] text-muted">
                <span>{stat.subtext}</span>
              </div>
            </div>
            {stat.trend && stat.trend.length >= 2 && (
              <StatSparkline data={stat.trend} color={stat.trendColor} gradientId={`spark-${stat.labelKey}`} />
            )}
          </div>
        ))}
      </div>

      <div className="space-y-6 sm:space-y-8">
          {/* Daily Activity Chart for Selected Month */}
          <div className="rounded-2xl border border-border bg-subtle p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-base font-bold text-foreground">{t("dash.monthly")}</h2>
                <p className="text-xs text-muted mt-0.5">
                  {t("dash.monthActivity", { month: MONTH_NAMES[selectedMonth], year: selectedYear })}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Month Selector */}
                <Dropdown
                  value={String(selectedMonth)}
                  onChange={(val) => setSelectedMonth(Number(val))}
                  options={MONTH_NAMES.map((name, idx) => ({ value: String(idx), label: name }))}
                  variant="toolbar"
                  className="min-w-[125px]"
                />

                {/* Year Selector */}
                <Dropdown
                  value={String(selectedYear)}
                  onChange={(val) => setSelectedYear(Number(val))}
                  options={Array.from({ length: 6 }, (_, i) => currentYear - 3 + i).map((yr) => ({
                    value: String(yr),
                    label: String(yr),
                  }))}
                  variant="toolbar"
                  className="min-w-[85px]"
                />
              </div>
            </div>

            <div className="overflow-x-auto pb-2 -mx-2 px-2 sm:overflow-visible sm:pb-0 sm:mx-0 sm:px-0 [scrollbar-width:thin]">
              <div className="relative h-48 flex flex-col justify-end mt-2 min-w-[500px] sm:min-w-0">
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
                        <div className={`opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none bg-subtle text-foreground text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-border shadow-xl mb-2 absolute bottom-full ${tooltipPos} z-30 whitespace-nowrap flex items-center gap-1.5`}>
                          <span>{t("dash.screenshotLabel")}: {d.screenshotCount}</span>
                          <span className="text-muted">|</span>
                          <span>{t("dash.screenrecordLabel")}: {d.videoCount}</span>
                          <div className={`absolute top-full ${arrowPos} -mt-1 border-4 border-transparent border-t-subtle`} />
                        </div>
                        {d.count > 0 ? (
                          <div
                            className="w-full max-w-[20px] rounded-t-md bg-[#2563EB] hover:bg-[#1D4ED8] hover:scale-110 shadow-xs hover:shadow-md transition-all duration-200"
                            style={{ height: `${Math.max(8, (d.count / maxDayCount) * 125)}px` }}
                          />
                        ) : (
                          <div className="w-full max-w-[20px] rounded-t-sm bg-neutral-200 dark:bg-neutral-700/60 h-1.5 group-hover:bg-neutral-300 dark:group-hover:bg-neutral-600 transition-colors" />
                        )}
                        <span className="text-[9px] sm:text-[10px] text-muted font-medium mt-1 select-none">{d.label}</span>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Environment Breakdown Card (Full Width with 2 Columns: Browsers & OS) */}
          <div className="rounded-2xl border border-border bg-subtle p-4 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
              <div>
                <h2 className="text-base font-bold text-foreground">{t("qa.title")}</h2>
                <p className="text-xs text-muted mt-0.5">{t("qa.subtitle")}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {/* Column 1: Browser Distribution */}
              <div className="min-w-0 md:pr-8 md:border-r md:border-border">
                <div className="flex items-center justify-between mb-3.5 gap-2">
                  <span className="text-sm font-semibold text-foreground flex items-center gap-1.5 min-w-0">
                    <Icon icon="lucide:globe" className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{t("qa.browserTitle")}</span>
                  </span>
                  <span className="text-xs text-muted font-mono shrink-0">
                    {qaData.browserBreakdown.reduce((sum, b) => sum + b.count, 0)} {t("dash.totalCaptures").toLowerCase()}
                  </span>
                </div>

                {qaData.browserBreakdown.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted">{t("qa.noBrowser")}</div>
                ) : (
                  <div className="space-y-3">
                    {qaData.browserBreakdown.map((b) => (
                      <div key={b.name} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-medium text-foreground flex items-center gap-2 min-w-0">
                            <Icon icon={getBrowserIcon(b.name)} className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span className="truncate">{b.name}</span>
                          </span>
                          <span className="text-muted font-mono shrink-0 ml-2">{b.percent}% ({b.count})</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                          <div className={`h-full ${b.color} rounded-full transition-all duration-500`} style={{ width: `${b.percent}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Column 2: Operating Systems */}
              <div className="min-w-0">
                <div className="flex items-center justify-between mb-3.5 gap-2">
                  <span className="text-sm font-semibold text-foreground flex items-center gap-1.5 min-w-0">
                    <Icon icon="lucide:monitor" className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{t("qa.osTitle")}</span>
                  </span>
                  <span className="text-xs text-muted font-mono shrink-0">
                    {qaData.osBreakdown.reduce((sum, os) => sum + os.count, 0)} {t("dash.totalCaptures").toLowerCase()}
                  </span>
                </div>

                {qaData.osBreakdown.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted">{t("qa.noOs")}</div>
                ) : (
                  <div className="space-y-3">
                    {qaData.osBreakdown.map((os) => (
                      <div key={os.name} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-medium text-foreground flex items-center gap-2 min-w-0">
                            <Icon icon={getOsIcon(os.name)} className="w-4 h-4 shrink-0 text-foreground" aria-hidden="true" />
                            <span className="truncate">{os.name}</span>
                          </span>
                          <span className="text-muted font-mono shrink-0 ml-2">{os.percent}% ({os.count})</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                          <div className={`h-full ${os.color} rounded-full transition-all duration-500`} style={{ width: `${os.percent}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <p className="text-[11px] text-muted mt-5 pt-3.5 border-t border-border/60">
              {t("qa.envHint")}
            </p>
          </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-border bg-subtle p-4 sm:p-6 shadow-xs">
          <h2 className="text-base font-bold text-foreground mb-4">
            {t("dash.quickActions")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Link
              href="/captures"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground border border-border hover:bg-background transition-colors"
            >
              <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 dark:bg-blue-950/30 text-[#2563EB] dark:text-[#3B82F6] shrink-0">
                <Icon icon="lucide:layout-grid" className="w-4 h-4" aria-hidden="true" />
              </span>
              <span className="flex-1 truncate">{t("dash.viewAll")}</span>
              <Icon icon="lucide:chevron-right" className="w-4 h-4 text-muted shrink-0" aria-hidden="true" />
            </Link>
            <Link
              href="/folders"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground border border-border hover:bg-background transition-colors"
            >
              <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 dark:bg-blue-950/30 text-[#2563EB] dark:text-[#3B82F6] shrink-0">
                <Icon icon="lucide:folder" className="w-4 h-4" aria-hidden="true" />
              </span>
              <span className="flex-1 truncate">{t("dash.manageFolders")}</span>
              <Icon icon="lucide:chevron-right" className="w-4 h-4 text-muted shrink-0" aria-hidden="true" />
            </Link>
            <Link
              href="/settings?tab=integrations"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground border border-border hover:bg-background transition-colors"
            >
              <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 dark:bg-blue-950/30 text-[#2563EB] dark:text-[#3B82F6] shrink-0">
                <Icon icon="lucide:cloud" className="w-4 h-4" aria-hidden="true" />
              </span>
              <span className="flex-1 truncate">{t("dash.checkStorage")}</span>
              <Icon icon="lucide:chevron-right" className="w-4 h-4 text-muted shrink-0" aria-hidden="true" />
            </Link>
            {/* Upgrade to Pro - hidden from UI for now (billing not ready), kept
                in the DOM per instruction so re-enabling is just removing `hidden`. */}
            <Link
              href="/upgrade"
              className="hidden items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium border border-blue-200 dark:border-blue-900/40 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-950/30 hover:shadow-md transition-all duration-300"
            >
              <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-100 dark:bg-amber-950/40 text-amber-500 dark:text-amber-400 shrink-0">
                <Icon icon="lucide:crown" className="w-4 h-4" aria-hidden="true" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-foreground font-bold truncate">{t("layout.upgradeToPro")}</span>
                <span className="block text-[11px] text-muted truncate">{t("dash.upgradeCardDesc")}</span>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
