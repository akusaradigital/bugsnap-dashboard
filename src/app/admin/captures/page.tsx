"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { useT } from "@/components/I18nProvider";
import { getAdminHeaders } from "@/lib/admin-cache";

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

export default function AdminCapturesPage() {
  const { showToast } = useToast();
  const { t } = useT();

  const [loading, setLoading] = useState(true);
  const [captures, setCaptures] = useState<CaptureItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadCaptures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, typeFilter, visibilityFilter]);

  async function loadCaptures() {
    setLoading(true);
    try {
      const headers = await getAdminHeaders();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
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
      if (!res.ok) throw new Error(json.error || "Failed to update visibility");

      setCaptures((prev) =>
        prev.map((c) => (c.id === capture.id ? { ...c, is_public: nextPublic } : c))
      );
      showToast(nextPublic ? "Capture made public" : "Capture forced to private", "success");
    } catch (err: unknown) {
      showToast((err as Error)?.message || "Failed to update visibility", "error");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleTakedown(capture: CaptureItem) {
    if (!confirm(`Are you sure you want to TAKEDOWN and permanently delete "${capture.title || capture.id}"? This cannot be undone.`)) {
      return;
    }

    setActionLoading(capture.id);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/captures?captureId=${capture.id}`, {
        method: "DELETE",
        headers,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to takedown capture");

      setCaptures((prev) => prev.filter((c) => c.id !== capture.id));
      showToast("Capture taken down successfully", "success");
    } catch (err: unknown) {
      showToast((err as Error)?.message || "Failed to takedown capture", "error");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>🛡️ {t("admin.capturesTitle")}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-normal">
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
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 px-3 py-2 outline-none"
          >
            <option value="all">All Formats</option>
            <option value="video">📹 Videos</option>
            <option value="screenshot">📸 Screenshots</option>
          </select>

          <select
            value={visibilityFilter}
            onChange={(e) => {
              setVisibilityFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 px-3 py-2 outline-none"
          >
            <option value="all">All Access</option>
            <option value="public">🌐 Public Link</option>
            <option value="private">🔒 Private Only</option>
          </select>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5 w-full sm:w-80">
          <input
            type="text"
            placeholder="Search title, site URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 cursor-pointer shrink-0"
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
                <th className="py-3 px-4">Capture</th>
                <th className="py-3 px-4">Creator / Workspace</th>
                <th className="py-3 px-4">Site URL</th>
                <th className="py-3 px-4">Access</th>
                <th className="py-3 px-4">Views</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Moderation</th>
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
                    No captures found.
                  </td>
                </tr>
              ) : (
                captures.map((cap) => (
                  <tr key={cap.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-base">
                          {cap.type.includes("video") ? "📹" : "📸"}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white max-w-xs truncate">
                            {cap.title || "Untitled Capture"}
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
                          className="hover:underline hover:text-indigo-600 truncate block font-mono text-[11px]"
                        >
                          {cap.site_url}
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {cap.is_public ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                          PUBLIC
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          PRIVATE
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-semibold text-slate-700 dark:text-zinc-300">
                      👁 {cap.views_count || 0}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-zinc-400">
                      {new Date(cap.created_at).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/v/${cap.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded text-xs font-semibold border border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                          title="View share page"
                        >
                          Open ↗
                        </a>
                        <button
                          type="button"
                          disabled={actionLoading === cap.id}
                          onClick={() => handleToggleVisibility(cap)}
                          className={`px-2 py-1 rounded text-xs font-semibold border transition-colors ${
                            cap.is_public
                              ? "border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                              : "border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                          }`}
                          title={cap.is_public ? t("admin.makePrivate") : "Make Public"}
                        >
                          {cap.is_public ? "🔒 Private" : "🌐 Public"}
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading === cap.id}
                          onClick={() => handleTakedown(cap)}
                          className="px-2 py-1 rounded text-xs font-semibold border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title={t("admin.takedown")}
                        >
                          🗑 Takedown
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded border border-slate-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                ← Prev
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded border border-slate-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
