"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/Toast";
import { useT } from "@/components/I18nProvider";
import { getAdminHeaders } from "@/lib/admin-cache";
import { Icon } from "@/lib/iconify";
import { Dropdown } from "@/components/Dropdown";
import { AdminPagination } from "@/components/AdminPagination";
import { useConfirm } from "@/components/ConfirmDialog";

interface CaptureItem {
  id: string;
  title: string;
  type: string;
  url?: string;
  site_url?: string;
  size?: number;
  duration?: number;
  is_public: boolean;
  views_count?: number;
  created_at: string;
  creator_email: string;
  workspace_name: string;
}

function AdminCapturesContent() {
  const { showToast } = useToast();
  const { t } = useT();
  const confirm = useConfirm();

  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [captures, setCaptures] = useState<CaptureItem[]>([]);
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") || "");
  const [typeFilter, setTypeFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadCaptures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, typeFilter, visibilityFilter]);

  async function loadCaptures() {
    setLoading(true);
    try {
      const headers = await getAdminHeaders();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: String(pageSize),
        search: searchQuery.trim(),
        type: typeFilter,
        visibility: visibilityFilter,
      });

      const res = await fetch(`/api/admin/captures?${params.toString()}`, { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("admin.loadFailed"));

      setCaptures(json.captures || []);
      setTotalPages(json.pagination?.totalPages || 1);
      setTotalCount(json.pagination?.total || 0);
    } catch (err: unknown) {
      showToast((err as Error)?.message || t("admin.loadFailed"), "error");
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    loadCaptures();
  }

  async function handleToggleVisibility(capture: CaptureItem) {
    const nextPublic = !capture.is_public;
    setActionLoading(capture.id);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/captures", {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          capture_id: capture.id,
          action: "toggle_visibility",
          is_public: nextPublic,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("adminMisc.errVisibility"));

      setCaptures((prev) =>
        prev.map((c) => (c.id === capture.id ? { ...c, is_public: nextPublic } : c))
      );
      showToast(nextPublic ? t("admin.visibilityUpdatedPublic") : t("admin.visibilityUpdatedPrivate"), "success");
    } catch (err: unknown) {
      showToast((err as Error)?.message || t("admin.visibilityUpdateFailed"), "error");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleTakedown(capture: CaptureItem) {
    const ok = await confirm({
      title: t("admin.takedownConfirmTitle"),
      message: t("admin.takedownConfirm", { title: capture.title || capture.id }),
      danger: true,
    });
    if (!ok) return;

    setActionLoading(capture.id);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/captures?captureId=${capture.id}`, {
        method: "DELETE",
        headers,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("admin.updateFailed"));

      setCaptures((prev) => prev.filter((c) => c.id !== capture.id));
      showToast(t("admin.takedownSuccess"), "success");
    } catch (err: unknown) {
      showToast((err as Error)?.message || t("admin.updateFailed"), "error");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span className="flex items-center gap-2"><Icon icon="lucide:camera" className="w-4 h-4 shrink-0 text-[#2563EB] dark:text-[#3B82F6]" /> {t("admin.capturesTitle")}</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-normal">
              {totalCount.toLocaleString()} {t("admin.captures")}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            {t("admin.capturesDesc")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadCaptures()}
          disabled={loading}
          className="self-start sm:self-auto px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-colors shadow-xs cursor-pointer"
        >
          {loading ? t("admin.refreshing") : t("admin.refreshMetrics")}
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Dropdown
            value={typeFilter}
            onChange={(val) => {
              setTypeFilter(val);
              setPage(1);
            }}
            options={[
              { value: "all", label: t("admin.allFormats") },
              { value: "video", label: t("admin.formatVideo") },
              { value: "screenshot", label: t("admin.formatScreenshot") },
            ]}
            variant="field-white"
          />

          <Dropdown
            value={visibilityFilter}
            onChange={(val) => {
              setVisibilityFilter(val);
              setPage(1);
            }}
            options={[
              { value: "all", label: t("admin.allAccess") },
              { value: "public", label: t("admin.accessPublic") },
              { value: "private", label: t("admin.accessPrivate") },
            ]}
            variant="field-white"
          />

          <Dropdown
            value={String(pageSize)}
            onChange={(val) => {
              setPageSize(Number(val));
              setPage(1);
            }}
            options={[
              { value: "10", label: "10" },
              { value: "20", label: "20" },
              { value: "50", label: "50" },
              { value: "100", label: "100" },
            ]}
            variant="field-white"
          />
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5 w-full sm:w-80">
          <input
            type="text"
            placeholder={t("admin.searchCapturesPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-w-0 text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 text-slate-900 dark:text-white"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold shadow-xs shadow-[#2563EB]/25 transition-colors cursor-pointer shrink-0"
          >
            {t("common.search")}
          </button>
        </form>
      </div>

      {/* Captures Table */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">{t("admin.thCapture")}</th>
                <th className="py-3 px-4">{t("admin.thCreatorWorkspace")}</th>
                <th className="py-3 px-4">{t("admin.thSiteUrl")}</th>
                <th className="py-3 px-4">{t("admin.thAccess")}</th>
                <th className="py-3 px-4">{t("admin.thViews")}</th>
                <th className="py-3 px-4">{t("admin.thCreated")}</th>
                <th className="py-3 px-4 text-right">{t("admin.thModeration")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    {t("common.loading")}
                  </td>
                </tr>
              ) : captures.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    {t("admin.noCapturesFound")}
                  </td>
                </tr>
              ) : (
                captures.map((cap) => (
                  <tr key={cap.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Icon
                          icon={cap.type.includes("video") ? "lucide:video" : "lucide:image"}
                          className="w-4 h-4 shrink-0 text-slate-500"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white max-w-xs truncate">
                            {cap.title || t("adminMisc.untitledCapture")}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {cap.id.slice(0, 14)}…
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-slate-800 dark:text-zinc-200 font-medium">
                        {cap.workspace_name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                        {cap.creator_email}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-zinc-400 max-w-xs truncate">
                      {cap.site_url ? (
                        <a
                          href={cap.site_url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline hover:text-[#2563EB] dark:hover:text-[#3B82F6] truncate block font-mono text-[11px]"
                        >
                          {cap.site_url}
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-zinc-300">
                      {cap.is_public ? t("admin.badgePublic") : t("admin.badgePrivate")}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap tabular-nums font-semibold text-slate-700 dark:text-zinc-300">
                      {cap.views_count || 0}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-zinc-400">
                      {new Date(cap.created_at).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`/v/${cap.id}`}
                          target="_blank"
                          rel="noreferrer"
                          title={t("admin.openSharePage")}
                          aria-label={t("admin.openSharePage")}
                          className="p-1.5 rounded-md text-slate-500 hover:text-[#2563EB] hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-[#3B82F6] dark:hover:bg-zinc-800"
                        >
                          <Icon icon="lucide:external-link" className="w-4 h-4" aria-hidden="true" />
                        </a>
                        <button
                          type="button"
                          disabled={actionLoading === cap.id}
                          onClick={() => handleToggleVisibility(cap)}
                          title={cap.is_public ? t("admin.makePrivate") : t("admin.makePublic")}
                          aria-label={cap.is_public ? t("admin.makePrivate") : t("admin.makePublic")}
                          className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
                        >
                          <Icon icon={cap.is_public ? "lucide:lock" : "lucide:globe"} className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading === cap.id}
                          onClick={() => handleTakedown(cap)}
                          title={t("admin.takedown")}
                          aria-label={t("admin.takedown")}
                          className="p-1.5 rounded-md text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 disabled:opacity-50 cursor-pointer"
                        >
                          <Icon icon="lucide:trash-2" className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-200 dark:border-zinc-800">
            <AdminPagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              prevLabel={t("admin.prev")}
              nextLabel={t("admin.next")}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminCapturesPage() {
  return (
    <Suspense fallback={null}>
      <AdminCapturesContent />
    </Suspense>
  );
}
