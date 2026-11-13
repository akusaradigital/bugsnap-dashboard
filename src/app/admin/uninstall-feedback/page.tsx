"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { getAdminHeaders, getAdminCache, setAdminCache } from "@/lib/admin-cache";
import { Icon } from "@/lib/iconify";
import { useT } from "@/components/I18nProvider";

interface UninstallFeedbackEntry {
  id: string;
  message: string;
  userEmail: string | null;
  extensionVersion: string | null;
  browser: string | null;
  os: string | null;
  locale: string | null;
  created_at: string;
}

export default function AdminUninstallFeedbackPage() {
  const { showToast } = useToast();
  const { t } = useT();
  const cached = getAdminCache<{ entries: UninstallFeedbackEntry[]; total: number }>("admin_uninstall_feedback_data");
  const [loading, setLoading] = useState(!cached);
  const [entries, setEntries] = useState<UninstallFeedbackEntry[]>(cached?.entries || []);
  const [total, setTotal] = useState(cached?.total || 0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<UninstallFeedbackEntry | null>(null);

  useEffect(() => {
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadEntries() {
    if (!entries.length) setLoading(true);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/uninstall-feedback", { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("adminMisc.errUninstall"));

      const newEntries = json.entries || [];
      const newTotal = json.total ?? newEntries.length;
      setEntries(newEntries);
      setTotal(newTotal);
      setAdminCache("admin_uninstall_feedback_data", { entries: newEntries, total: newTotal });
    } catch (err: unknown) {
      if (!entries.length) showToast((err as Error)?.message || t("adminMisc.errUninstallToast"), "error");
    } finally {
      setLoading(false);
    }
  }

  const filtered = entries.filter((e) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (e.message || "").toLowerCase().includes(q) ||
      (e.userEmail || "").toLowerCase().includes(q) ||
      (e.browser || "").toLowerCase().includes(q) ||
      (e.os || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Icon icon="lucide:log-out" className="w-4 h-4 shrink-0 text-rose-500" />
            {t("admin.uninstallFeedbackTitle")}
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            {t("admin.uninstallFeedbackDesc")}
          </p>
        </div>
        <button
          type="button"
          onClick={loadEntries}
          disabled={loading}
          className="self-start sm:self-auto px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-colors inline-flex items-center gap-1.5"
        >
          <Icon icon="lucide:refresh-cw" className="w-3.5 h-3.5 shrink-0" />
          <span>{loading ? t("admin.refreshing") : t("admin.refresh")}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            {t("admin.totalUninstallFeedback")}
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{total}</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            {t("admin.withEmailLabel")}
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {entries.filter((e) => e.userEmail).length}
          </p>
        </div>
      </div>

      <div className="w-full sm:w-64">
        <input
          type="text"
          placeholder={t("admin.searchFeedbackPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20"
        />
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">{t("admin.colMessage")}</th>
                <th className="py-3 px-4">{t("admin.colEmail")}</th>
                <th className="py-3 px-4">{t("admin.colBrowserOs")}</th>
                <th className="py-3 px-4">{t("admin.colVersion")}</th>
                <th className="py-3 px-4">{t("admin.colTime")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {loading && entries.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 px-4 text-center text-slate-400">
                    {t("admin.loading")}
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 px-4 text-center text-slate-400">
                    {t("admin.noUninstallFeedback")}
                  </td>
                </tr>
              )}
              {filtered.map((entry) => (
                <tr
                  key={entry.id}
                  onClick={() => setSelected(entry)}
                  className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 max-w-xs truncate text-slate-700 dark:text-zinc-300">{entry.message}</td>
                  <td className="py-3 px-4 text-slate-500 dark:text-zinc-400">
                    {entry.userEmail || <span className="italic text-slate-400">{t("admin.anonymous")}</span>}
                  </td>
                  <td className="py-3 px-4 text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                    {[entry.browser, entry.os].filter(Boolean).join(" / ") || "-"}
                  </td>
                  <td className="py-3 px-4 text-slate-500 dark:text-zinc-400 whitespace-nowrap">{entry.extensionVersion || "-"}</td>
                  <td className="py-3 px-4 text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                    {new Date(entry.created_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setSelected(null)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-50 w-auto sm:w-[min(32rem,calc(100vw-2rem))] max-h-[80vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t("admin.feedbackDetail")}</h3>
              <button type="button" onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200">
                <Icon icon="lucide:x" className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">{selected.message}</p>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-1.5 text-xs text-slate-500 dark:text-zinc-400">
              <div><strong>{t("admin.colEmail")}:</strong> {selected.userEmail || t("admin.anonymous")}</div>
              <div><strong>{t("admin.colBrowserOs")}:</strong> {[selected.browser, selected.os].filter(Boolean).join(" / ") || "-"}</div>
              <div><strong>{t("admin.colVersion")}:</strong> {selected.extensionVersion || "-"}</div>
              <div><strong>{t("admin.colTime")}:</strong> {new Date(selected.created_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
