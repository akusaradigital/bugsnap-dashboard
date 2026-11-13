"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/Toast";
import { useT } from "@/components/I18nProvider";
import { Icon } from "@/lib/iconify";
import { Dropdown } from "@/components/Dropdown";
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
  funnel?: {
    signups: number;
    driveConnected: number;
    firstCapture: number;
    firstView: number;
    firstComment: number;
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
    expiresAt?: string | null;
    targetPlan?: string | null;
  };
  needsAttention?: {
    openTickets: number;
    hotProspects: number;
    abandonedCarts: number;
  };
}

// Mini sparkline. One neutral color for every KPI, so the cards don't compete.
function Sparkline({ data }: { data: number[] }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const width = 90;
  const height = 30;
  const step = width / (data.length - 1 || 1);

  const points = data
    .map((val, idx) => {
      const x = idx * step;
      const y = height - (val / max) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className="overflow-visible shrink-0" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
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
  const [promoExpiresAt, setPromoExpiresAt] = useState(cached?.promo?.expiresAt ? cached.promo.expiresAt.slice(0, 16) : "");
  const [promoTargetPlan, setPromoTargetPlan] = useState(cached?.promo?.targetPlan || "all");
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
      if (!res.ok) throw new Error(json.error || t("adminMisc.errMetrics"));

      setData(json);
      setAdminCache("admin_overview_data", json);
      setPromoMessage(json.promo?.message || "");
      setPromoEnabled(Boolean(json.promo?.enabled));
      setPromoExpiresAt(json.promo?.expiresAt ? json.promo.expiresAt.slice(0, 16) : "");
      setPromoTargetPlan(json.promo?.targetPlan || "all");
    } catch (err: unknown) {
      if (!data) setError((err as Error)?.message || t("adminMisc.errData"));
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
        body: JSON.stringify({
          message: promoMessage,
          enabled: promoEnabled,
          expires_at: promoExpiresAt ? new Date(promoExpiresAt).toISOString() : null,
          target_plan: promoTargetPlan,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("adminMisc.errBanner"));

      showToast(t("admin.promoSavedSuccess"), "success");
    } catch (err: unknown) {
      showToast((err as Error)?.message || t("adminMisc.errBannerToast"), "error");
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

  const funnel = data?.funnel;
  const funnelStages = funnel
    ? [
        { label: t("admin.funnelSignups"), count: funnel.signups },
        { label: t("admin.funnelDriveConnected"), count: funnel.driveConnected },
        { label: t("admin.funnelFirstCapture"), count: funnel.firstCapture },
        { label: t("admin.funnelFirstView"), count: funnel.firstView },
        { label: t("admin.funnelFirstComment"), count: funnel.firstComment },
      ]
    : [];

  // 7-day chart: captures and views
  const chartHeight = 220;
  const chartWidth = 600;
  const paddingX = 40;
  const paddingY = 25;
  const availableWidth = chartWidth - paddingX * 2;
  const availableHeight = chartHeight - paddingY * 2;

  const maxVal = Math.max(...capturePoints, ...viewPoints, 5);
  const stepX = availableWidth / (daily.length - 1 || 1);

  const capturePathPoints = daily.map((d, i) => ({
    x: paddingX + i * stepX,
    y: paddingY + availableHeight - ((d.captures || 0) / maxVal) * availableHeight,
    label: d.label,
  }));
  const viewPathPoints = daily.map((d, i) => ({
    x: paddingX + i * stepX,
    y: paddingY + availableHeight - ((d.views || 0) / maxVal) * availableHeight,
  }));

  const capturePolyline = capturePathPoints.map((p) => `${p.x},${p.y}`).join(" ");
  const viewPolyline = viewPathPoints.map((p) => `${p.x},${p.y}`).join(" ");

  const openTickets = data?.needsAttention?.openTickets ?? 0;
  const hotProspects = data?.needsAttention?.hotProspects ?? 0;
  const abandonedCarts = data?.needsAttention?.abandonedCarts ?? 0;
  const totalAttention = openTickets + hotProspects + abandonedCarts;

  const kpis = [
    {
      label: t("admin.totalViews"),
      value: stats?.totalViews ?? 0,
      caption: t("admin.recentViews14", { count: stats?.recentViewsCount ?? 0 }),
      points: viewPoints,
    },
    {
      label: t("admin.captures"),
      value: stats?.totalCaptures ?? 0,
      caption: t("admin.recentCaptures14", { count: stats?.recentCapturesCount ?? 0 }),
      points: capturePoints,
    },
    {
      label: t("admin.workspaces"),
      value: stats?.totalWorkspaces ?? 0,
      caption: t("admin.workspacesSub"),
      points: workspacePoints,
    },
    {
      label: t("admin.totalUsers"),
      value: stats?.totalUsers ?? 0,
      caption: t("admin.usersSub"),
      points: userPoints,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
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
          className="self-start sm:self-auto px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
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
            {t("error.tryAgain")}
          </button>
        </div>
      )}

      {/* Needs attention: one plain line, each number links to its inbox */}
      {data?.needsAttention && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-zinc-400">
          <span className="font-semibold text-slate-900 dark:text-white">{t("admin.needsAttentionTitle")}</span>
          {totalAttention === 0 ? (
            <span>{t("admin.allClearToday")}</span>
          ) : (
            <>
              <Link href="/admin/support" className="hover:text-[#2563EB] dark:hover:text-[#3B82F6]">
                {t("admin.openTicketsLabel")}: <strong className="text-slate-900 dark:text-white">{openTickets}</strong>
              </Link>
              <Link href="/admin/revenue" className="hover:text-[#2563EB] dark:hover:text-[#3B82F6]">
                {t("admin.hotProspectsLabel")}: <strong className="text-slate-900 dark:text-white">{hotProspects}</strong>
              </Link>
              <Link href="/admin/revenue" className="hover:text-[#2563EB] dark:hover:text-[#3B82F6]">
                {t("admin.abandonedCartsLabel")}: <strong className="text-slate-900 dark:text-white">{abandonedCarts}</strong>
              </Link>
            </>
          )}
        </div>
      )}

      {/* KPI: number, 14-day caption, one sparkline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">{kpi.label}</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{kpi.value.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">{kpi.caption}</p>
            </div>
            <Sparkline data={kpi.points} />
          </div>
        ))}
      </div>

      {/* Main row: chart + plan distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t("admin.chartTitle")}</h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">{t("admin.chartSubtitle")}</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 bg-[#2563EB]" />
                <span>{t("admin.chartCaptures")}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 bg-slate-400 dark:bg-zinc-500" />
                <span>{t("admin.chartViews")}</span>
              </span>
            </div>
          </div>

          <div className="w-full overflow-x-auto pt-2">
            <svg className="w-full min-w-[500px]" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
              {[0, 0.5, 1].map((ratio) => {
                const y = paddingY + availableHeight * (1 - ratio);
                return (
                  <g key={ratio}>
                    <line x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" className="dark:stroke-zinc-800" />
                    <text x={paddingX - 8} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8">
                      {Math.round(ratio * maxVal)}
                    </text>
                  </g>
                );
              })}
              <polyline fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={viewPolyline} />
              <polyline fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={capturePolyline} />
              {capturePathPoints.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="3.5" fill="#2563eb" />
                  <text x={p.x} y={chartHeight - 6} textAnchor="middle" fontSize="9" fill="#64748b">
                    {p.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
            <span>{t("admin.chart7DayCaptures", { count: capturePoints.reduce((a, b) => a + b, 0) })}</span>
            <span>{t("admin.chart7DayViews", { count: viewPoints.reduce((a, b) => a + b, 0) })}</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t("admin.planDistTitle")}</h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">{t("admin.planDistSubtitle")}</p>
          </div>
          <div className="space-y-3">
            {[
              { label: t("adminUsers.planFree"), count: plans.free },
              { label: t("adminMisc.planPro"), count: plans.pro },
              { label: "Team", count: plans.team },
              { label: t("adminMisc.planEnterprise"), count: plans.enterprise },
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
                  <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-[#2563EB]" style={{ width: `${Math.max(pct, 2)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Onboarding funnel */}
      {funnelStages.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t("admin.funnelTitle")}</h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">{t("admin.funnelSubtitle")}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {funnelStages.map((stage, i) => {
              const base = funnelStages[0].count || 1;
              const pctOfTotal = Math.round((stage.count / base) * 100);
              const prevCount = i > 0 ? funnelStages[i - 1].count || 1 : stage.count || 1;
              const pctOfPrev = i > 0 ? Math.round((stage.count / prevCount) * 100) : 100;
              return (
                <div key={stage.label} className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block truncate">{stage.label}</span>
                  <p className="text-xl font-black text-slate-900 dark:text-white">{stage.count}</p>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-[#2563EB]" style={{ width: `${Math.max(pctOfTotal, 2)}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 block">
                    {pctOfTotal}% {t("admin.funnelOfSignups")}
                    {i > 0 ? ` · ${pctOfPrev}% ${t("admin.funnelOfPrevStage")}` : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom row: top workspaces + promo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-200">
              {t("admin.topWsTitle")}
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400">
              {t("admin.wsCountLabel", { count: data?.topWorkspaces?.length || 0 })}
            </span>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-zinc-800 flex-1 overflow-y-auto max-h-72">
            {!data?.topWorkspaces || data.topWorkspaces.length === 0 ? (
              <li className="p-6 text-center text-xs text-slate-500 dark:text-zinc-400">{t("admin.noWsLoaded")}</li>
            ) : (
              data.topWorkspaces.map((w) => (
                <li key={w.id || w.name} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{w.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">{w.owner_email}</p>
                  </div>
                  <div className="flex items-baseline gap-1 shrink-0 ml-3">
                    <span className="text-xs font-black text-slate-900 dark:text-white">{w.capture_count}</span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400">{t("admin.capLabel")}</span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-200">
              {t("admin.promoBannerTitle")}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">{t("admin.promoBannerSubtitle")}</p>
          </div>

          <textarea
            rows={3}
            value={promoMessage}
            onChange={(e) => setPromoMessage(e.target.value)}
            placeholder={t("admin.promoBannerPlaceholder")}
            className="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 outline-none focus:border-[#2563EB] resize-none leading-relaxed"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                {t("admin.promoExpiresAt")}
              </label>
              <input
                type="datetime-local"
                value={promoExpiresAt}
                onChange={(e) => setPromoExpiresAt(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 outline-none focus:border-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                {t("admin.promoTargetPlan")}
              </label>
              <Dropdown
                value={promoTargetPlan}
                onChange={(val) => setPromoTargetPlan(val)}
                options={[
                  { value: "all", label: t("admin.promoTargetAll") },
                  { value: "free", label: t("admin.promoTargetFree") },
                  { value: "pro", label: t("admin.promoTargetPro") },
                  { value: "pro_plus", label: t("admin.promoTargetProPlus") },
                  { value: "enterprise", label: t("admin.promoTargetEnterprise") },
                ]}
                variant="field"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={promoEnabled}
                onChange={(e) => setPromoEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 dark:border-zinc-700 text-[#2563EB] focus:ring-[#2563EB]"
              />
              <span>{t("admin.enableBanner")}</span>
            </label>

            <button
              type="button"
              onClick={savePromo}
              disabled={savingPromo}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Icon icon="lucide:check" className="w-3.5 h-3.5 shrink-0 brightness-0 invert" />
              <span>{savingPromo ? t("admin.savingBanner") : t("admin.saveBanner")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
