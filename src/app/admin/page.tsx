"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/Toast";
import { useT } from "@/components/I18nProvider";
import { getAdminHeaders, getAdminCache, setAdminCache } from "@/lib/admin-cache";

interface DailyPoint {
  label: string;
  date: string;
  captures: number;
  views: number;
  workspaces?: number;
  users?: number;
}

interface AdminData {
  stats: {
    totalUsers: number;
    totalWorkspaces: number;
    totalCaptures: number;
    totalViews: number;
    totalComments: number;
    recentCapturesCount: number;
    recentViewsCount: number;
  };
  dailyActivity: DailyPoint[];
  planDistribution: {
    free: number;
    pro: number;
    team: number;
    enterprise: number;
  };
  mediaTypes: {
    screenshot: number;
    video: number;
    other: number;
  };
  topWorkspaces: Array<{
    id: string;
    name: string;
    owner_email: string;
    capture_count: number;
  }>;
  promo: {
    enabled: boolean;
    message: string;
  };
  needsAttention?: {
    openTickets: number;
    hotProspects: number;
    abandonedCarts: number;
  };
  systemPulse?: {
    database: string;
    stripe: string;
    googleDrive: string;
    emailService: string;
  };
}

// Mini Sparkline SVG component
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const min = 0;
  const width = 90;
  const height = 30;
  const step = width / (data.length - 1 || 1);

  const points = data
    .map((val, idx) => {
      const x = idx * step;
      const y = height - ((val - min) / (max - min)) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className="overflow-visible shrink-0" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export default function AdminOverviewPage() {
  const { showToast } = useToast();
  const { t } = useT();

  const cached = getAdminCache<AdminData>("admin_overview_data");
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AdminData | null>(cached);

  // Promo Banner State
  const [promoMessage, setPromoMessage] = useState(cached?.promo?.message || "");
  const [promoEnabled, setPromoEnabled] = useState(Boolean(cached?.promo?.enabled));
  const [savingPromo, setSavingPromo] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    if (!data) setLoading(true);
    setError(null);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/data", { headers });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat metrik real admin.");

      setData(json);
      setAdminCache("admin_overview_data", json);
      setPromoMessage(json.promo?.message || "");
      setPromoEnabled(Boolean(json.promo?.enabled));
    } catch (err: unknown) {
      if (!data) setError((err as Error)?.message || "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }

  async function savePromo() {
    setSavingPromo(true);
    try {
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;

      const res = await fetch("/api/admin/promo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: promoMessage, enabled: promoEnabled }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan banner");

      showToast(t("admin.promoSavedSuccess"), "success");
    } catch (err: unknown) {
      showToast((err as Error)?.message || "Gagal menyimpan banner", "error");
    } finally {
      setSavingPromo(false);
    }
  }

  const stats = data?.stats;
  const daily = data?.dailyActivity || [];
  const capturePoints = daily.map((d) => d.captures || 0);
  const viewPoints = daily.map((d) => d.views || 0);
  const workspacePoints = daily.map((d) => d.workspaces || 0);
  const userPoints = daily.map((d) => d.users || 0);

  const totalUsers = stats?.totalUsers || 0;
  const plans = data?.planDistribution || { free: 0, pro: 0, team: 0, enterprise: 0 };
  const media = data?.mediaTypes || { screenshot: 0, video: 0, other: 0 };

  // Calculate coordinates for main 7-day trend chart (SVG)
  const chartHeight = 220;
  const chartWidth = 600;
  const paddingX = 40;
  const paddingY = 25;
  const availableWidth = chartWidth - paddingX * 2;
  const availableHeight = chartHeight - paddingY * 2;

  const maxVal = Math.max(...capturePoints, ...viewPoints, 5);
  const stepX = availableWidth / (daily.length - 1 || 1);

  const capturePathPoints = daily.map((d, i) => {
    const x = paddingX + i * stepX;
    const y = paddingY + availableHeight - (d.captures / maxVal) * availableHeight;
    return { x, y, val: d.captures, label: d.label };
  });

  const viewPathPoints = daily.map((d, i) => {
    const x = paddingX + i * stepX;
    const y = paddingY + availableHeight - (d.views / maxVal) * availableHeight;
    return { x, y, val: d.views, label: d.label };
  });

  const capturePolyline = capturePathPoints.map((p) => `${p.x},${p.y}`).join(" ");
  const viewPolyline = viewPathPoints.map((p) => `${p.x},${p.y}`).join(" ");

  const openTickets = data?.needsAttention?.openTickets ?? 0;
  const hotProspects = data?.needsAttention?.hotProspects ?? 0;
  const abandonedCarts = data?.needsAttention?.abandonedCarts ?? 0;
  const totalAttention = openTickets + hotProspects + abandonedCarts;

  return (
    <div className="space-y-6">
      {/* Top Welcome & Refresh Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
            {t("admin.overviewTitle")}
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            {t("admin.overviewSubtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="self-start sm:self-auto px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-colors shadow-xs cursor-pointer"
        >
          {loading ? t("admin.refreshing") : t("admin.refreshMetrics")}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-xs text-rose-600 dark:text-rose-400 flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={loadData}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 cursor-pointer"
          >
            {t("errors.tryAgain")}
          </button>
        </div>
      )}

      {/* NEEDS ATTENTION TODAY ACTION STRIP */}
      {data?.needsAttention && (
        <div className="rounded-xl border border-amber-200/80 dark:border-amber-900/50 bg-gradient-to-r from-amber-50/90 via-white to-amber-50/40 dark:from-amber-950/20 dark:via-zinc-900/70 dark:to-amber-950/10 p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-sm">
              ⚡
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 dark:text-zinc-200">
                  {t("admin.needsAttentionTitle")}
                </span>
                {totalAttention === 0 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <span>✓</span> {t("admin.allClearToday")}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 hidden sm:inline">
                    {t("admin.needsAttentionDesc")}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
            {/* Open Tickets */}
            <Link
              href="/admin/support"
              className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg font-medium transition-all ${
                openTickets > 0
                  ? "bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/70 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-300 font-semibold shadow-2xs"
                  : "bg-slate-100 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800"
              }`}
            >
              <span>📥</span>
              <span>{t("admin.openTicketsLabel")}:</span>
              <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] sm:text-[11px] ${openTickets > 0 ? "bg-rose-600 text-white" : "bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300"}`}>
                {openTickets}
              </span>
            </Link>

            {/* Hot Prospects */}
            <Link
              href="/admin/revenue"
              className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg font-medium transition-all ${
                hotProspects > 0
                  ? "bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/70 dark:hover:bg-amber-900/80 text-amber-800 dark:text-amber-300 font-semibold shadow-2xs"
                  : "bg-slate-100 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800"
              }`}
            >
              <span>🔥</span>
              <span>{t("admin.hotProspectsLabel")}:</span>
              <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] sm:text-[11px] ${hotProspects > 0 ? "bg-amber-600 text-white" : "bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300"}`}>
                {hotProspects}
              </span>
            </Link>

            {/* Abandoned Carts */}
            <Link
              href="/admin/revenue"
              className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg font-medium transition-all ${
                abandonedCarts > 0
                  ? "bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-950/70 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 font-semibold shadow-2xs"
                  : "bg-slate-100 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800"
              }`}
            >
              <span>🛒</span>
              <span>{t("admin.abandonedCartsLabel")}:</span>
              <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] sm:text-[11px] ${abandonedCarts > 0 ? "bg-indigo-600 text-white" : "bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300"}`}>
                {abandonedCarts}
              </span>
            </Link>
          </div>
        </div>
      )}

      {/* SYSTEM & INTEGRATION PULSE BAR */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xs p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="font-bold text-slate-800 dark:text-zinc-200 text-xs">
            {t("admin.systemPulse")}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-6 text-[10px] sm:text-[11px]">
          {/* Supabase DB */}
          <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            <span>{t("admin.dbConnected")}:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {t("admin.statusHealthy")}
            </span>
          </div>

          {/* Stripe Billing */}
          <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-zinc-400">
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                data?.systemPulse?.stripe === "configured" ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            <span>{t("admin.stripeStatusLabel")}:</span>
            <span
              className={`font-bold ${
                data?.systemPulse?.stripe === "configured"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {data?.systemPulse?.stripe === "configured"
                ? t("admin.statusConfigured")
                : t("admin.statusPending")}
            </span>
          </div>

          {/* Google Drive */}
          <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-zinc-400">
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                data?.systemPulse?.googleDrive === "configured" ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            <span>{t("admin.driveStatusLabel")}:</span>
            <span
              className={`font-bold ${
                data?.systemPulse?.googleDrive === "configured"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {data?.systemPulse?.googleDrive === "configured"
                ? t("admin.statusConfigured")
                : t("admin.statusPending")}
            </span>
          </div>

          {/* Email Service */}
          <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-zinc-400">
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                data?.systemPulse?.emailService === "configured" ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            <span>Email (Resend):</span>
            <span
              className={`font-bold ${
                data?.systemPulse?.emailService === "configured"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {data?.systemPulse?.emailService === "configured"
                ? t("admin.statusConfigured")
                : t("admin.statusPending")}
            </span>
          </div>
        </div>
      </div>

      {/* 4 TOP STAT CARDS (STARADMIN DESIGN) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: VISITS / VIEWS */}
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              {t("admin.totalViews")}
            </span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats?.totalViews?.toLocaleString() ?? "0"}
            </p>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5 block">
              {t("admin.recentViews14", { count: stats?.recentViewsCount ?? 0 })}
            </span>
          </div>
          <Sparkline data={viewPoints} color="#2563eb" />
        </div>

        {/* CARD 2: TOTAL CAPTURES */}
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              {t("admin.captures")}
            </span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats?.totalCaptures?.toLocaleString() ?? "0"}
            </p>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5 block">
              {t("admin.recentCaptures14", { count: stats?.recentCapturesCount ?? 0 })}
            </span>
          </div>
          <Sparkline data={capturePoints} color="#4f46e5" />
        </div>

        {/* CARD 3: TOTAL WORKSPACES */}
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              {t("admin.workspaces")}
            </span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats?.totalWorkspaces?.toLocaleString() ?? "0"}
            </p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 block">
              {t("admin.workspacesSub")}
            </span>
          </div>
          <Sparkline data={workspacePoints} color="#10b981" />
        </div>

        {/* CARD 4: TOTAL USERS */}
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              {t("admin.totalUsers")}
            </span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats?.totalUsers?.toLocaleString() ?? "0"}
            </p>
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold mt-0.5 block">
              {t("admin.usersSub")}
            </span>
          </div>
          <Sparkline data={userPoints} color="#9333ea" />
        </div>
      </div>

      {/* MIDDLE SECTION: MAIN ACTIVITY CHART & USER DISTRIBUTION (STARADMIN LAYOUT) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLS: DUAL LINE CHART (PLATFORM USAGE ACTIVITY) */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t("admin.chartTitle")}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                {t("admin.chartSubtitle")}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                <span className="h-2 w-4 rounded-full bg-[#4f46e5]" />
                <span>{t("admin.chartCaptures")}</span>
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-4 rounded-full bg-[#10b981]" />
                <span>{t("admin.chartViews")}</span>
              </span>
            </div>
          </div>

          {/* SVG DUAL LINE CHART */}
          <div className="w-full overflow-x-auto pt-2">
            <svg
              className="w-full min-w-[500px]"
              height={chartHeight}
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            >
              {/* Horizontal grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = paddingY + availableHeight * (1 - ratio);
                return (
                  <g key={ratio}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke="#e2e8f0"
                      strokeDasharray="4 4"
                      className="dark:stroke-zinc-800"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3}
                      textAnchor="end"
                      fontSize="9"
                      fill="#94a3b8"
                      className="font-mono"
                    >
                      {Math.round(ratio * maxVal)}
                    </text>
                  </g>
                );
              })}

              {/* View Path (Emerald) */}
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={viewPolyline}
              />

              {/* Capture Path (Indigo) */}
              <polyline
                fill="none"
                stroke="#4f46e5"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={capturePolyline}
              />

              {/* Data points for Views */}
              {viewPathPoints.map((p, i) => (
                <circle key={`v-${i}`} cx={p.x} cy={p.y} r="3.5" fill="#10b981" />
              ))}

              {/* Data points for Captures */}
              {capturePathPoints.map((p, i) => (
                <g key={`c-${i}`}>
                  <circle cx={p.x} cy={p.y} r="3.5" fill="#4f46e5" />
                  {/* Date Label on X Axis */}
                  <text
                    x={p.x}
                    y={chartHeight - 6}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#64748b"
                    className="font-semibold"
                  >
                    {p.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
            <span>
              {t("admin.chart7DayCaptures", { count: capturePoints.reduce((a, b) => a + b, 0) })}
            </span>
            <span>
              {t("admin.chart7DayViews", { count: viewPoints.reduce((a, b) => a + b, 0) })}
            </span>
          </div>
        </div>

        {/* RIGHT 1 COL: USER DISTRIBUTION & METRICS */}
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t("admin.planDistTitle")}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
              {t("admin.planDistSubtitle")}
            </p>

            <div className="space-y-3 mt-4">
              {[
                { label: "Free Tier", count: plans.free, color: "bg-slate-400" },
                { label: "Pro Tier", count: plans.pro, color: "bg-indigo-600" },
                { label: "Team Tier", count: plans.team, color: "bg-blue-600" },
                { label: "Enterprise", count: plans.enterprise, color: "bg-purple-600" },
              ].map((tier) => {
                const pct = totalUsers > 0 ? Math.round((tier.count / totalUsers) * 100) : 0;
                return (
                  <div key={tier.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-zinc-300">{tier.label}</span>
                      <span className="font-mono text-slate-500 dark:text-zinc-400">
                        {tier.count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                      <div className={`h-full ${tier.color}`} style={{ width: `${Math.max(pct, 4)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Media Capture Types Breakdown */}
          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300">
              {t("admin.mediaFormats")}
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850">
                <span className="text-[10px] text-slate-400 block font-semibold">{t("admin.screenshots")}</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{media.screenshot}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850">
                <span className="text-[10px] text-slate-400 block font-semibold">{t("admin.videoRecords")}</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{media.video}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MASTER ADMIN HUBS QUICK ACCESS */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-200 flex items-center gap-2">
            <span>⚡ Master Administration Hubs</span>
          </h3>
          <span className="text-[11px] text-slate-400">Privileged Super Admin Modules</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <a
            href="/admin/users"
            className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-all text-left group"
          >
            <span className="text-xl">👥</span>
            <p className="text-xs font-bold text-slate-900 dark:text-white mt-1 group-hover:text-indigo-600 transition-colors">
              {t("admin.manageUsers")}
            </p>
            <span className="text-[10px] text-slate-400 block truncate">Plan & 360° Profile</span>
          </a>

          <a
            href="/admin/workspaces"
            className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-all text-left group"
          >
            <span className="text-xl">🏢</span>
            <p className="text-xs font-bold text-slate-900 dark:text-white mt-1 group-hover:text-indigo-600 transition-colors">
              {t("admin.navWorkspaces")}
            </p>
            <span className="text-[10px] text-slate-400 block truncate">Teams & Ownership</span>
          </a>

          <a
            href="/admin/captures"
            className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-all text-left group"
          >
            <span className="text-xl">📸</span>
            <p className="text-xs font-bold text-slate-900 dark:text-white mt-1 group-hover:text-indigo-600 transition-colors">
              {t("admin.navCaptures")}
            </p>
            <span className="text-[10px] text-slate-400 block truncate">Audit & Takedown</span>
          </a>

          <a
            href="/admin/revenue"
            className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-all text-left group"
          >
            <span className="text-xl">💰</span>
            <p className="text-xs font-bold text-slate-900 dark:text-white mt-1 group-hover:text-indigo-600 transition-colors">
              {t("admin.navRevenue")}
            </p>
            <span className="text-[10px] text-slate-400 block truncate">MRR & Stripe Health</span>
          </a>

          <a
            href="/admin/ai-analytics"
            className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-all text-left group"
          >
            <span className="text-xl">🤖</span>
            <p className="text-xs font-bold text-slate-900 dark:text-white mt-1 group-hover:text-indigo-600 transition-colors">
              {t("admin.navAiAnalytics")}
            </p>
            <span className="text-[10px] text-slate-400 block truncate">Tokens & API Keys</span>
          </a>

          <a
            href="/admin/security-audit"
            className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-all text-left group"
          >
            <span className="text-xl">🛡️</span>
            <p className="text-xs font-bold text-slate-900 dark:text-white mt-1 group-hover:text-indigo-600 transition-colors">
              {t("admin.auditTitle")}
            </p>
            <span className="text-[10px] text-slate-400 block truncate">Action Audit Trail</span>
          </a>
        </div>
      </div>

      {/* BOTTOM ROW: TOP WORKSPACES & PROMO ANNOUNCEMENT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Workspaces Table */}
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-200">
              {t("admin.topWsTitle")}
            </h3>
            <span className="text-[11px] text-slate-400">
              {t("admin.wsCountLabel", { count: data?.topWorkspaces?.length || 0 })}
            </span>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-zinc-800 flex-1 overflow-y-auto max-h-72">
            {!data?.topWorkspaces || data.topWorkspaces.length === 0 ? (
              <li className="p-6 text-center text-xs text-slate-400">{t("admin.noWsLoaded")}</li>
            ) : (
              data.topWorkspaces.map((w) => (
                <li key={w.id || w.name} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{w.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">{w.owner_email}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    <span className="text-xs font-black text-[#1f3bb3] dark:text-blue-400">{w.capture_count}</span>
                    <span className="text-[10px] text-slate-400">{t("admin.capLabel")}</span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Global Announcement Banner Settings */}
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-200">
              {t("admin.promoBannerTitle")}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
              {t("admin.promoBannerSubtitle")}
            </p>
          </div>

          <div>
            <textarea
              rows={3}
              value={promoMessage}
              onChange={(e) => setPromoMessage(e.target.value)}
              placeholder={t("admin.promoBannerPlaceholder")}
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 outline-none focus:border-[#1f3bb3] resize-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={promoEnabled}
                onChange={(e) => setPromoEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#1f3bb3] focus:ring-[#1f3bb3]"
              />
              <span>{t("admin.enableBanner")}</span>
            </label>

            <button
              type="button"
              onClick={savePromo}
              disabled={savingPromo}
              className="px-4 py-1.5 text-xs font-semibold bg-[#1f3bb3] text-white rounded-lg hover:bg-[#182f8f] disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
            >
              {savingPromo ? t("admin.savingBanner") : t("admin.saveBanner")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
