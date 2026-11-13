"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import { useT } from "@/components/I18nProvider";
import { getAdminHeaders } from "@/lib/admin-cache";
import { INTEGRATIONS } from "@/lib/integrations";
import { Icon } from "@/lib/iconify";
import { AdminAiConfigCard } from "./AdminAiConfigCard";

interface IntegrationDeliveryEntry {
  success: number;
  fail: number;
  lastFailAt: string | null;
  lastFailMessage: string | null;
}

const INTEGRATION_NAMES = Object.fromEntries(INTEGRATIONS.map((i) => [i.id, i.name]));
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

interface AiStats {
  totalSummaries: number;
  estimatedTokens: number;
  estimatedCostUsd: string;
  recentSummaries: Array<{
    id: string;
    title: string;
    type: string;
    created_at: string;
    creator_email: string;
  }>;
  topDrivers?: Array<{
    user_id: string;
    email: string;
    full_name: string;
    plan: string;
    effective_plan: string;
    ai_count: number;
    estimated_tokens: number;
    estimated_cost_usd: string;
    is_leech: boolean;
  }>;
}

interface ApiKeysStats {
  totalKeys: number;
  activeKeys: number;
  keysList: Array<{
    id: string;
    name: string;
    key_prefix: string;
    created_at: string;
    last_used_at: string | null;
    is_active: boolean;
    workspace_name: string;
  }>;
}

export default function AdminAiAnalyticsPage() {
  const { showToast } = useToast();
  const { t, locale } = useT();

  const [loading, setLoading] = useState(true);
  const [aiStats, setAiStats] = useState<AiStats | null>(null);
  const [apiKeysStats, setApiKeysStats] = useState<ApiKeysStats | null>(null);
  const [deliveryStats, setDeliveryStats] = useState<Record<string, IntegrationDeliveryEntry>>({});

  useEffect(() => {
    loadAiAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAiAnalytics() {
    setLoading(true);
    try {
      const headers = await getAdminHeaders();
      const [res, deliveryRes] = await Promise.all([
        fetch("/api/admin/ai-analytics", { headers }),
        fetch("/api/admin/integration-stats", { headers }),
      ]);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("admin.loadFailed"));

      setAiStats(json.aiStats || null);
      setApiKeysStats(json.apiKeysStats || null);

      const deliveryJson = await deliveryRes.json().catch(() => null);
      if (deliveryRes.ok && deliveryJson?.stats) setDeliveryStats(deliveryJson.stats);
    } catch (err: unknown) {
      showToast((err as Error)?.message || t("admin.loadFailed"), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span className="flex items-center gap-2"><Icon icon="lucide:bar-chart-2" className="w-4 h-4 shrink-0 text-[#2563EB] dark:text-[#3B82F6]" /> {t("admin.aiTitle")}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            {t("admin.aiDesc")}
          </p>
        </div>
        <button
          type="button"
          onClick={loadAiAnalytics}
          disabled={loading}
          className="self-start sm:self-auto px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-colors shadow-xs cursor-pointer"
        >
          {loading ? t("admin.refreshing") : t("admin.refreshMetrics")}
        </button>
      </div>

      {/* Model Provider & Endpoint Configuration for AI Polish (Primary above the fold) */}
      <AdminAiConfigCard />

      {/* 4 KPIs: number, one caption each, no colour accents */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">{t("admin.totalAiCalls")}</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {aiStats?.totalSummaries?.toLocaleString() || 0}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">{t("admin.aiTokensEstimated")}</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {aiStats?.estimatedTokens?.toLocaleString() || 0}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">{t("admin.aiCostEstimated")}</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {aiStats?.estimatedCostUsd || "$0.00"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">{t("admin.apiKeys")}</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {apiKeysStats?.activeKeys || 0}
            <span className="text-xs font-normal text-slate-500 dark:text-zinc-400"> / {apiKeysStats?.totalKeys || 0}</span>
          </p>
        </div>
      </div>

      {/* Top AI Cost Drivers / Leech Alert Section */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            {t("admin.aiTopDriversTitle")}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
            {t("admin.aiTopDriversDesc")}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">{t("admin.thUser")}</th>
                <th className="py-3 px-4">{t("admin.thPlan")}</th>
                <th className="py-3 px-4">{t("admin.aiInvocations")}</th>
                <th className="py-3 px-4">{t("admin.aiEstTokens")}</th>
                <th className="py-3 px-4">{t("admin.aiEstCost")}</th>
                <th className="py-3 px-4 text-right">{t("admin.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    {t("common.loading")}
                  </td>
                </tr>
              ) : (aiStats?.topDrivers || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    {t("admin.aiNoData")}
                  </td>
                </tr>
              ) : (
                (aiStats?.topDrivers || []).map((driver) => (
                  <tr key={driver.user_id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {driver.full_name || t("admin.noName")}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                        {driver.email}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300">
                        <span className="uppercase font-semibold">{driver.effective_plan}</span>
                        {driver.is_leech && (
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-rose-500"
                            title={t("admin.aiHighLeechHint")}
                            aria-label={t("admin.aiHighLeech")}
                          />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap tabular-nums text-slate-900 dark:text-white">
                      {driver.ai_count}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap tabular-nums text-slate-600 dark:text-zinc-400">
                      ~{driver.estimated_tokens.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap tabular-nums text-slate-900 dark:text-white">
                      {driver.estimated_cost_usd}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Link
                        href="/admin/users"
                        className="text-xs font-semibold text-slate-600 hover:text-[#2563EB] dark:text-zinc-400 dark:hover:text-[#3B82F6]"
                        title={t("admin.manageUser")}
                      >
                        {t("admin.manageUser")}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Integration Delivery Health */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            {t("admin.integrationHealthTitle")}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
            {t("admin.integrationHealthDesc")}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">{t("admin.thIntegration")}</th>
                <th className="py-3 px-4">{t("admin.thSuccess")}</th>
                <th className="py-3 px-4">{t("admin.thFail")}</th>
                <th className="py-3 px-4">{t("admin.thLastFailure")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {Object.keys(deliveryStats).length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    {t("admin.integrationNoData")}
                  </td>
                </tr>
              ) : (
                Object.entries(deliveryStats)
                  .sort(([, a], [, b]) => b.fail - a.fail || b.success - a.success)
                  .map(([service, entry]) => {
                    const recentFail =
                      !!entry.lastFailAt && Date.now() - new Date(entry.lastFailAt).getTime() <= SEVEN_DAYS_MS;
                    return (
                      <tr key={service} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap text-slate-900 dark:text-white">
                          <span className="inline-flex items-center gap-2 font-semibold">
                            {recentFail && (
                              <span
                                className="h-1.5 w-1.5 rounded-full bg-rose-500"
                                title={t("admin.integrationFailingHint")}
                                aria-label={t("admin.integrationFailing")}
                              />
                            )}
                            {INTEGRATION_NAMES[service] || service}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap tabular-nums text-slate-900 dark:text-white">
                          {entry.success}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap tabular-nums text-slate-900 dark:text-white">
                          {entry.fail}
                        </td>
                        <td className="py-3 px-4 min-w-0 max-w-[280px]">
                          {entry.lastFailAt ? (
                            <>
                              <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                                {new Date(entry.lastFailAt).toLocaleString(locale === "id" ? "id-ID" : "en-US", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                              {entry.lastFailMessage && (
                                <div className="text-[10px] text-slate-400 truncate" title={entry.lastFailMessage}>
                                  {entry.lastFailMessage}
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Columns: Recent AI Summaries & Active API Keys */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent AI Summaries Table */}
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-zinc-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {t("admin.aiRecentTitle")} ({aiStats?.recentSummaries?.length || 0})
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
              {t("admin.aiRecentDesc")}
            </p>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">{t("admin.thCapture")}</th>
                  <th className="py-3 px-4">{t("admin.thAuthor")}</th>
                  <th className="py-3 px-4">{t("admin.thDate")}</th>
                  <th className="py-3 px-4 text-right">{t("admin.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">
                      {t("common.loading")}
                    </td>
                  </tr>
                ) : (aiStats?.recentSummaries || []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">
                      {t("admin.aiRecentNoData")}
                    </td>
                  </tr>
                ) : (
                  (aiStats?.recentSummaries || []).map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 dark:text-white max-w-[200px] truncate">
                          {item.title || t("admin.untitledCapture")}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {item.id.slice(0, 10)}…
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-zinc-400 font-mono text-[11px]">
                        {item.creator_email}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-zinc-400 text-[11px]">
                        {new Date(item.created_at).toLocaleDateString(locale === "id" ? "id-ID" : "en-US", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <a
                          href={`/v/${item.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-slate-600 hover:text-[#2563EB] dark:text-zinc-400 dark:hover:text-[#3B82F6]"
                          title={t("admin.openCapture")}
                        >
                          {t("admin.openCapture")}
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* API Keys Table */}
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-zinc-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {t("admin.apiKeysTableTitle")} ({apiKeysStats?.keysList?.length || 0})
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
              {t("admin.apiKeysTableDesc")}
            </p>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">{t("admin.thKeyName")}</th>
                  <th className="py-3 px-4">{t("admin.thWorkspace")}</th>
                  <th className="py-3 px-4">{t("admin.thStatus")}</th>
                  <th className="py-3 px-4">{t("admin.thLastUsed")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">
                      {t("common.loading")}
                    </td>
                  </tr>
                ) : (apiKeysStats?.keysList || []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">
                      {t("admin.apiKeysNoData")}
                    </td>
                  </tr>
                ) : (
                  (apiKeysStats?.keysList || []).map((k) => (
                    <tr key={k.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {k.name || t("admin.defaultKey")}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {k.key_prefix}••••••••
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-zinc-400">
                        {k.workspace_name}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-zinc-300">
                          <span className={`h-1.5 w-1.5 rounded-full ${k.is_active ? "bg-emerald-500" : "bg-slate-400"}`} />
                          {k.is_active ? t("admin.statusActive") : t("admin.statusRevoked")}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-zinc-400 text-[11px]">
                        {k.last_used_at
                          ? new Date(k.last_used_at).toLocaleDateString(locale === "id" ? "id-ID" : "en-US", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : t("admin.neverUsed")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
