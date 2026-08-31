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
    </div>
  );
}
