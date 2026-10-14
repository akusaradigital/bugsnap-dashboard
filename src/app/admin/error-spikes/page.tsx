"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { getAdminHeaders, getAdminCache, setAdminCache } from "@/lib/admin-cache";
import { Icon } from "@/lib/iconify";
import { useT } from "@/components/I18nProvider";

interface ErrorSpike {
  fingerprint: string;
  count: number;
  workspaceCount: number;
  sampleSiteUrl: string | null;
  sampleCaptureId: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
}

interface ErrorSpikesData {
  spikes: ErrorSpike[];
  totalOccurrences: number;
  distinctFingerprints: number;
}

export default function AdminErrorSpikesPage() {
  const { t } = useT();
  const { showToast } = useToast();
  const cached = getAdminCache<ErrorSpikesData>("admin_error_spikes_data");
  const [loading, setLoading] = useState(!cached);
  const [data, setData] = useState<ErrorSpikesData | null>(cached);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadSpikes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSpikes() {
    if (!cached) setLoading(true);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/error-spikes", { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat lonjakan error.");

      setData(json);
      setAdminCache("admin_error_spikes_data", json);
    } catch (err: unknown) {
      if (!cached) showToast((err as Error)?.message || "Gagal memuat data lonjakan error", "error");
    } finally {
      setLoading(false);
    }
  }

  const spikes = data?.spikes || [];
  const filtered = spikes.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.fingerprint.toLowerCase().includes(q) ||
      (s.sampleSiteUrl && s.sampleSiteUrl.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Icon icon="lucide:alert-triangle" className="w-6 h-6 text-rose-500 shrink-0" />
            <span>{t("admin.errorSpikes")}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            {t("admin.errorSpikesDesc")}
          </p>
        </div>

        <button
          onClick={loadSpikes}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
        >
          <Icon icon="lucide:refresh-cw" className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>{loading ? t("admin.refreshing") : t("admin.refreshMetrics")}</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm min-w-0">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">{t("admin.spikeFingerprint")}</span>
            <Icon icon="lucide:fingerprint" className="w-4 h-4 text-[#89BD49]" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {data?.distinctFingerprints ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">Unique error signatures (24h)</p>
        </div>

        <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm min-w-0">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">{t("admin.spikeCount")}</span>
            <Icon icon="lucide:activity" className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {data?.totalOccurrences ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">Total error captures recorded</p>
        </div>

        <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm min-w-0">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">{t("admin.spikeWorkspaces")}</span>
            <Icon icon="lucide:layers" className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {spikes.filter((s) => s.workspaceCount >= 2).length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">Cross-tenant surges (≥2 workspaces)</p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Icon
            icon="lucide:search"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search fingerprint or site URL..."
            className="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-9 pr-3 py-2 outline-none focus:border-[#89BD49] text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Spikes Table */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-zinc-950/50 text-slate-600 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800 font-semibold">
              <tr>
                <th className="py-3 px-4">{t("admin.spikeFingerprint")}</th>
                <th className="py-3 px-4">{t("admin.spikeCount")}</th>
                <th className="py-3 px-4">{t("admin.spikeWorkspaces")}</th>
                <th className="py-3 px-4">{t("admin.spikeSample")}</th>
                <th className="py-3 px-4">{t("admin.spikeFirstSeen")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-700 dark:text-zinc-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-zinc-500">
                    <Icon icon="lucide:check-circle" className="w-8 h-8 mx-auto text-[#89BD49] mb-2" />
                    <p className="text-xs">{t("admin.noSpikes")}</p>
                  </td>
                </tr>
              ) : (
                filtered.map((spike) => {
                  const isCrossTenant = spike.workspaceCount >= 2;
                  return (
                    <tr key={spike.fingerprint} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40">
                      <td className="py-3 px-4 font-mono text-[11px] break-all max-w-[220px]">
                        <span className="font-semibold text-slate-900 dark:text-white">{spike.fingerprint}</span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            spike.count >= 10
                              ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400"
                              : spike.count >= 5
                              ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400"
                              : "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                          }`}
                        >
                          {spike.count}×
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isCrossTenant
                              ? "bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400"
                              : "text-slate-500 dark:text-zinc-400"
                          }`}
                        >
                          {spike.workspaceCount} ws
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-[260px] truncate text-slate-500 dark:text-zinc-400">
                        {spike.sampleCaptureId ? (
                          <a
                            href={`/c/${spike.sampleCaptureId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#89BD49] hover:underline flex items-center gap-1 truncate"
                          >
                            <span className="truncate">{spike.sampleSiteUrl || "View capture"}</span>
                            <Icon icon="lucide:external-link" className="w-3 h-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="truncate">{spike.sampleSiteUrl || "-"}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-400 dark:text-zinc-500 text-[11px]">
                        {new Date(spike.firstSeenAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
