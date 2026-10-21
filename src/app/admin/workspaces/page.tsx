"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { useT } from "@/components/I18nProvider";
import { getAdminHeaders } from "@/lib/admin-cache";
import { Icon } from "@/lib/iconify";

interface WorkspaceItem {
  id: string;
  name: string;
  slug?: string;
  owner_user_id: string;
  owner_email: string;
  created_at: string;
  member_count: number;
  capture_count: number;
  is_vip?: boolean;
  ai_token_limit_override?: number | null;
}

interface MemberInfo {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  email: string;
  full_name: string | null;
  plan: string;
}

interface CaptureInfo {
  id: string;
  title: string;
  type: string;
  created_at: string;
  size?: number;
  views_count?: number;
}

export default function AdminWorkspacesPage() {
  const { showToast } = useToast();
  const { t } = useT();

  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selected workspace detail modal
  const [selectedWs, setSelectedWs] = useState<WorkspaceItem | null>(null);
  const [wsDetailLoading, setWsDetailLoading] = useState(false);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [recentCaptures, setRecentCaptures] = useState<CaptureInfo[]>([]);
  const [totalSizeBytes, setTotalSizeBytes] = useState(0);
  const [vipOverride, setVipOverride] = useState(false);
  const [tokenLimitOverride, setTokenLimitOverride] = useState<string>("");
  const [savingVip, setSavingVip] = useState(false);

  // Transfer Ownership Modal
  const [transferWs, setTransferWs] = useState<WorkspaceItem | null>(null);
  const [newOwnerEmail, setNewOwnerEmail] = useState("");
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    loadWorkspaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function loadWorkspaces() {
    setLoading(true);
    try {
      const headers = await getAdminHeaders();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        search: searchQuery.trim(),
      });

      const res = await fetch(`/api/admin/workspaces?${params.toString()}`, { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("admin.loadFailed"));

      setWorkspaces(json.workspaces || []);
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
    loadWorkspaces();
  }

  async function openWorkspaceDetail(ws: WorkspaceItem) {
    setSelectedWs(ws);
    setVipOverride(Boolean(ws.is_vip));
    setTokenLimitOverride(ws.ai_token_limit_override != null ? String(ws.ai_token_limit_override) : "");
    setWsDetailLoading(true);
    setMembers([]);
    setRecentCaptures([]);
    setTotalSizeBytes(0);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/workspaces?workspaceId=${ws.id}`, { headers });
      const json = await res.json();
      if (res.ok) {
        setMembers(json.members || []);
        setRecentCaptures(json.recentCaptures || []);
        setTotalSizeBytes(json.totalSizeBytes || 0);
        if (json.workspace) {
          setVipOverride(Boolean(json.workspace.is_vip));
          setTokenLimitOverride(
            json.workspace.ai_token_limit_override != null ? String(json.workspace.ai_token_limit_override) : ""
          );
        }
      }
    } catch {
      // silent
    } finally {
      setWsDetailLoading(false);
    }
  }

  async function handleSaveVipOverride() {
    if (!selectedWs) return;
    setSavingVip(true);
    try {
      const headers = await getAdminHeaders();
      const rawLimit = tokenLimitOverride.trim();
      const parsedLimit = rawLimit ? parseInt(rawLimit, 10) : null;
      const res = await fetch("/api/admin/workspaces", {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: selectedWs.id,
          action: "set_vip_override",
          is_vip: vipOverride,
          ai_token_limit_override: parsedLimit && !isNaN(parsedLimit) ? parsedLimit : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("admin.vipOverrideFailed"));

      const finalLimit = parsedLimit && !isNaN(parsedLimit) ? parsedLimit : null;
      setWorkspaces((prev) =>
        prev.map((w) =>
          w.id === selectedWs.id
            ? {
                ...w,
                is_vip: vipOverride,
                ai_token_limit_override: finalLimit,
              }
            : w
        )
      );
      setSelectedWs((prev) =>
        prev
          ? {
              ...prev,
              is_vip: vipOverride,
              ai_token_limit_override: finalLimit,
            }
          : null
      );
      showToast(t("admin.vipOverrideSaved"), "success");
    } catch (err: unknown) {
      showToast((err as Error)?.message || t("admin.vipOverrideFailed"), "error");
    } finally {
      setSavingVip(false);
    }
  }

  async function handleTransferOwnership(e: React.FormEvent) {
    e.preventDefault();
    if (!transferWs || !newOwnerEmail.trim()) return;

    setTransferring(true);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/workspaces", {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: transferWs.id,
          action: "transfer_owner",
          new_owner_email: newOwnerEmail.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to transfer ownership");

      setWorkspaces((prev) =>
        prev.map((w) =>
          w.id === transferWs.id ? { ...w, owner_email: newOwnerEmail.trim() } : w
        )
      );
      showToast("Workspace ownership transferred successfully", "success");
      setTransferWs(null);
      setNewOwnerEmail("");
    } catch (err: unknown) {
      showToast((err as Error)?.message || "Failed to transfer ownership", "error");
    } finally {
      setTransferring(false);
    }
  }

  async function handleDeleteWorkspace(ws: WorkspaceItem) {
    if (!confirm(t("admin.deleteWorkspaceConfirm", { name: ws.name }))) {
      return;
    }

    try {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/workspaces?workspaceId=${ws.id}`, {
        method: "DELETE",
        headers,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete workspace");

      setWorkspaces((prev) => prev.filter((w) => w.id !== ws.id));
      if (selectedWs?.id === ws.id) setSelectedWs(null);
      showToast("Workspace deleted successfully", "success");
    } catch (err: unknown) {
      showToast((err as Error)?.message || "Failed to delete workspace", "error");
    }
  }

  function formatBytes(bytes: number) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span className="flex items-center gap-2"><Icon icon="lucide:building-2" className="w-4 h-4 shrink-0 text-[#6B9A35] dark:text-[#A8D666]" /> {t("admin.workspacesTitle")}</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-normal">
              {totalCount.toLocaleString()} {t("admin.workspaces")}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            {t("admin.workspacesDesc")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadWorkspaces()}
          disabled={loading}
          className="self-start sm:self-auto px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-colors shadow-xs cursor-pointer"
        >
          {loading ? t("admin.refreshing") : t("admin.refreshMetrics")}
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5 w-full sm:w-80">
          <input
            type="text"
            placeholder={t("admin.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-w-0 text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 outline-none focus:border-[#89BD49] focus:ring-1 focus:ring-[#89BD49]/20 text-slate-900 dark:text-white"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-[#89BD49] hover:bg-[#6B9A35] text-white rounded-lg text-xs font-semibold shadow-xs shadow-[#89BD49]/25 transition-colors cursor-pointer shrink-0"
          >
            {t("common.search")}
          </button>
        </form>
      </div>

      {/* Workspaces Table */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">{t("admin.thWorkspace")}</th>
                <th className="py-3 px-4">{t("admin.thOwnerEmail")}</th>
                <th className="py-3 px-4">{t("admin.membersCount")}</th>
                <th className="py-3 px-4">{t("admin.capturesCount")}</th>
                <th className="py-3 px-4">{t("admin.thCreated")}</th>
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
              ) : workspaces.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    {t("admin.noWorkspaces")}
                  </td>
                </tr>
              ) : (
                workspaces.map((ws) => (
                  <tr key={ws.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{ws.name}</span>
                        {ws.is_vip && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                            <Icon icon="lucide:crown" className="w-2.5 h-2.5 shrink-0" />
                            <span>{t("admin.vipBadge")}</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{ws.id.slice(0, 12)}…</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-zinc-300 font-mono">
                      {ws.owner_email || "-"}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                        <Icon icon="lucide:users" className="w-3 h-3 shrink-0" />
                        <span>{ws.member_count}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#89BD49]/10 dark:bg-[#89BD49]/20 text-[#6B9A35] dark:text-[#A8D666] border border-[#89BD49]/30 dark:border-[#89BD49]/40">
                        <Icon icon="lucide:video" className="w-3 h-3 shrink-0" />
                        <span>{ws.capture_count}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-zinc-400">
                      {new Date(ws.created_at).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openWorkspaceDetail(ws)}
                          className="px-2 py-1 rounded text-xs font-semibold border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors inline-flex items-center justify-center"
                          title="View Details"
                        >
                          <Icon icon="lucide:eye" className="w-3.5 h-3.5 shrink-0" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTransferWs(ws);
                            setNewOwnerEmail(ws.owner_email || "");
                          }}
                          className="px-2.5 py-1 rounded text-xs font-semibold border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors inline-flex items-center gap-1"
                          title={t("admin.transferOwner")}
                        >
                          <Icon icon="lucide:arrow-right-left" className="w-3 h-3 shrink-0" />
                          <span>Owner</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteWorkspace(ws)}
                          className="px-2 py-1 rounded text-xs font-semibold border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors inline-flex items-center justify-center"
                          title={t("admin.deleteWorkspace")}
                        >
                          <Icon icon="lucide:trash-2" className="w-3.5 h-3.5 shrink-0" />
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
              {t("admin.pageOf", { page: String(page), totalPages: String(totalPages) })}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded border border-slate-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                {t("admin.prev")}
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded border border-slate-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                {t("admin.next")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transfer Ownership Modal */}
      {transferWs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form
            onSubmit={handleTransferOwnership}
            className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-4"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t("admin.transferOwner")} - {transferWs.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Masukkan email pengguna terdaftar yang akan dijadikan pemilik utama workspace ini.
            </p>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 block mb-1">
                New Owner Email
              </label>
              <input
                type="email"
                required
                value={newOwnerEmail}
                onChange={(e) => setNewOwnerEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2.5 outline-none focus:border-[#89BD49] focus:ring-1 focus:ring-[#89BD49]/20 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTransferWs(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                disabled={transferring}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#89BD49] hover:bg-[#6B9A35] text-white shadow-xs shadow-[#89BD49]/25 transition-colors disabled:opacity-50"
              >
                {transferring ? t("common.loading") : t("admin.transferOwner")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 360 Workspace Detail Modal */}
      {selectedWs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="flex items-center gap-1.5"><Icon icon="lucide:building-2" className="w-4 h-4 shrink-0 text-[#6B9A35] dark:text-[#A8D666]" /> {selectedWs.name}</span>
                  {selectedWs.is_vip && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                      <Icon icon="lucide:crown" className="w-2.5 h-2.5 shrink-0" />
                      <span>{t("admin.vipBadge")}</span>
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono mt-0.5 break-all">
                  Owner: {selectedWs.owner_email || "-"} (ID: {selectedWs.id})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWs(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                aria-label="Close"
              >
                <Icon icon="lucide:x" className="w-4 h-4 shrink-0" />
              </button>
            </div>

            {wsDetailLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">{t("common.loading")}</div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-bold block">{t("admin.membersCount")}</span>
                    <span className="font-bold text-slate-800 dark:text-zinc-200 text-sm">{members.length}</span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-bold block">{t("admin.capturesCount")}</span>
                    <span className="font-bold text-slate-800 dark:text-zinc-200 text-sm">{selectedWs.capture_count}</span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-bold block">{t("admin.storageUsed")}</span>
                    <span className="font-bold text-slate-800 dark:text-zinc-200 text-sm">{formatBytes(totalSizeBytes)}</span>
                  </div>
                </div>

                {/* VIP Status & AI Token Quota Override */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/60 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                        <Icon icon="lucide:crown" className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>{t("admin.vipOverrideTitle")}</span>
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                        {t("admin.vipOverrideDesc")}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={vipOverride}
                        onChange={(e) => setVipOverride(e.target.checked)}
                        className="w-4 h-4 rounded text-[#89BD49] focus:ring-[#89BD49] border-slate-300 dark:border-zinc-700 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        {t("admin.isVipLabel")}
                      </span>
                    </label>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 block mb-1">
                        {t("admin.aiTokenLimitOverride")}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={tokenLimitOverride}
                        onChange={(e) => setTokenLimitOverride(e.target.value)}
                        placeholder={t("admin.aiTokenLimitUnlimited")}
                        className="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 outline-none focus:border-[#89BD49] text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      disabled={savingVip}
                      onClick={handleSaveVipOverride}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#89BD49] hover:bg-[#6B9A35] text-white shadow-xs disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Icon icon="lucide:save" className="w-3.5 h-3.5 shrink-0" />
                      <span>{savingVip ? t("common.loading") : t("common.save")}</span>
                    </button>
                  </div>
                </div>

                {/* Team Members list */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-2">
                    {t("admin.teamMembers", { count: String(members.length) })}
                  </h4>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {members.length === 0 ? (
                      <p className="text-slate-400 italic">{t("admin.noMembers")}</p>
                    ) : (
                      members.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between p-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
                        >
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white">{m.full_name || m.email}</span>
                            <span className="text-[11px] text-slate-400 font-mono ml-2">({m.email})</span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded uppercase font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                            {m.role}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Recent Captures */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-2">
                    Recent Captures
                  </h4>
                  {recentCaptures.length === 0 ? (
                    <p className="text-slate-400 italic">No captures in this workspace</p>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {recentCaptures.map((cap) => (
                        <div
                          key={cap.id}
                          className="flex items-center justify-between p-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
                        >
                          <div>
                            <span className="font-medium text-slate-900 dark:text-white">{cap.title || "Untitled"}</span>
                            <span className="text-[10px] text-slate-400 ml-2">({cap.type})</span>
                          </div>
                          <a
                            href={`/v/${cap.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-semibold text-[#6B9A35] hover:text-[#557A2B] dark:text-[#A8D666] dark:hover:text-[#C2E688] hover:underline"
                          >
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
