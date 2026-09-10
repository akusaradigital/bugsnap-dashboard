"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { useT } from "@/components/I18nProvider";
import { getAdminHeaders } from "@/lib/admin-cache";

interface UserItem {
  id: string;
  email: string;
  full_name: string | null;
  plan: string;
  plan_expires_at?: string | null;
  effective_plan?: string;
  is_disposable?: boolean;
  created_at: string;
  suspended: boolean;
  google_drive_connected?: boolean;
}

interface UserDetail extends UserItem {
  theme?: string;
  job_role?: string;
  google_drive_email?: string;
  stripe_search_url?: string;
  paddle_search_url?: string;
}

interface WorkspaceInfo {
  id: string;
  name: string;
  role: string;
  is_owner: boolean;
  created_at: string;
}

interface CaptureInfo {
  id: string;
  title: string;
  type: string;
  created_at: string;
  size?: number;
  views_count?: number;
  is_public?: boolean;
}

export default function AdminUsersPage() {
  const { showToast } = useToast();
  const { t } = useT();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selected user for 360 view
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [userWorkspaces, setUserWorkspaces] = useState<WorkspaceInfo[]>([]);
  const [userCaptures, setUserCaptures] = useState<CaptureInfo[]>([]);
  const [userTotalCaptures, setUserTotalCaptures] = useState(0);

  // Action states
  const [togglingUser, setTogglingUser] = useState<string | null>(null);
  const [planModalUser, setPlanModalUser] = useState<UserItem | null>(null);
  const [selectedNewPlan, setSelectedNewPlan] = useState<string>("free");
  const [selectedDuration, setSelectedDuration] = useState<string>("permanent");
  const [savingPlan, setSavingPlan] = useState(false);
  const [syncingSubscription, setSyncingSubscription] = useState(false);

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, planFilter, statusFilter]);

  async function loadUsers() {
    setLoading(true);
    try {
      const headers = await getAdminHeaders();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        plan: planFilter,
        status: statusFilter,
        search: searchQuery.trim(),
      });

      const res = await fetch(`/api/admin/users?${params.toString()}`, { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("admin.loadFailed"));

      setUsers(json.users || []);
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
    loadUsers();
  }

  async function openUserDetail(user: UserItem) {
    setSelectedUser(user);
    setUserDetailLoading(true);
    setUserWorkspaces([]);
    setUserCaptures([]);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/users?userId=${user.id}`, { headers });
      const json = await res.json();
      if (res.ok && json.user) {
        setSelectedUser(json.user);
        setUserWorkspaces(json.workspaces || []);
        setUserCaptures(json.recentCaptures || []);
        setUserTotalCaptures(json.totalCaptures || 0);
      }
    } catch {
      // silent
    } finally {
      setUserDetailLoading(false);
    }
  }

  async function handleToggleSuspend(user: UserItem) {
    const nextState = !user.suspended;
    const confirmMsg = nextState
      ? `Suspend user ${user.email}?`
      : `Unsuspend user ${user.email}?`;

    if (!confirm(confirmMsg)) return;

    setTogglingUser(user.id);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, action: "toggle_suspend", suspended: nextState }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to toggle suspend");

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, suspended: nextState } : u))
      );
      if (selectedUser?.id === user.id) {
        setSelectedUser((prev) => (prev ? { ...prev, suspended: nextState } : null));
      }
      showToast(nextState ? t("admin.suspended") : t("admin.active"), "success");
    } catch (err: unknown) {
      showToast((err as Error)?.message || "Failed to update status", "error");
    } finally {
      setTogglingUser(null);
    }
  }

  async function handleSavePlan() {
    if (!planModalUser) return;
    setSavingPlan(true);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: planModalUser.id,
          action: "set_plan",
          plan: selectedNewPlan,
          expires_in: selectedDuration,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update plan");

      const updatedExpiry = json.user?.plan_expires_at || null;
      setUsers((prev) =>
        prev.map((u) =>
          u.id === planModalUser.id ? { ...u, plan: selectedNewPlan, plan_expires_at: updatedExpiry } : u
        )
      );
      if (selectedUser?.id === planModalUser.id) {
        setSelectedUser((prev) =>
          prev ? { ...prev, plan: selectedNewPlan, plan_expires_at: updatedExpiry } : null
        );
      }
      showToast(t("admin.planChanged"), "success");
      setPlanModalUser(null);
    } catch (err: unknown) {
      showToast((err as Error)?.message || "Failed to change plan", "error");
    } finally {
      setSavingPlan(false);
    }
  }

  async function handleSyncSubscription(user: UserItem) {
    setSyncingSubscription(true);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, action: "sync_subscription" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to sync subscription");
      if (json.synced && json.plan) {
        showToast(json.message || "Subscription synced!", "success");
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, plan: json.plan, plan_expires_at: null } : u))
        );
        if (selectedUser?.id === user.id) {
          setSelectedUser((prev) => (prev ? { ...prev, plan: json.plan, plan_expires_at: null } : null));
        }
      } else {
        showToast(json.message || "No active gateway subscription found", "info");
      }
    } catch (err: unknown) {
      showToast((err as Error)?.message || "Failed to sync", "error");
    } finally {
      setSyncingSubscription(false);
    }
  }

  async function handleSendResetPassword(user: UserItem) {
    if (!confirm(`Send password reset email to ${user.email}?`)) return;
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, action: "reset_password" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to send reset email");

      showToast(t("admin.resetPasswordSent", { email: user.email }), "success");
    } catch (err: unknown) {
      showToast((err as Error)?.message || "Failed to send reset email", "error");
    }
  }

  async function handleDeleteUser(user: UserItem) {
    const confirmMsg = t("admin.deleteUserConfirm", { email: user.email });
    if (!confirm(confirmMsg)) return;

    try {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/users?userId=${user.id}`, {
        method: "DELETE",
        headers,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete user");

      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      if (selectedUser?.id === user.id) setSelectedUser(null);
      showToast(t("admin.userDeleted"), "success");
    } catch (err: unknown) {
      showToast((err as Error)?.message || "Failed to delete user", "error");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>👥 {t("admin.manageUsers")}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-normal">
              {totalCount.toLocaleString()} {t("admin.user")}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            {t("admin.subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadUsers()}
          disabled={loading}
          className="self-start sm:self-auto px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-colors shadow-xs cursor-pointer"
        >
          {loading ? t("admin.refreshing") : t("admin.refreshMetrics")}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={planFilter}
            onChange={(e) => {
              setPlanFilter(e.target.value);
              setPage(1);
            }}
            className="flex-1 sm:flex-none min-w-[120px] text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 px-3 py-2 outline-none"
          >
            <option value="all">{t("admin.allPlans")}</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="team">Team</option>
            <option value="enterprise">Enterprise</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="flex-1 sm:flex-none min-w-[120px] text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 px-3 py-2 outline-none"
          >
            <option value="all">{t("admin.allStatuses")}</option>
            <option value="active">{t("admin.active")}</option>
            <option value="suspended">{t("admin.suspended")}</option>
          </select>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5 w-full sm:w-80">
          <input
            type="text"
            placeholder={t("admin.searchUserPlaceholder")}
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

      {/* Users Table */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">{t("admin.user")}</th>
                <th className="py-3 px-4">{t("admin.plan")}</th>
                <th className="py-3 px-4">{t("admin.joined")}</th>
                <th className="py-3 px-4">{t("admin.status")}</th>
                <th className="py-3 px-4 text-right">{t("admin.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    {t("common.loading")}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    {t("admin.noUsers", { query: searchQuery || "-" })}
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{u.full_name || "Tanpa Nama"}</span>
                        {u.google_drive_connected && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 font-mono">
                            Drive ✓
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono flex items-center gap-1.5 mt-0.5">
                        <span>{u.email}</span>
                        {u.is_disposable && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800" title="Disposable/Throwaway Email Domain">
                            Temp Mail
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex flex-col items-start gap-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setPlanModalUser(u);
                            setSelectedNewPlan(u.plan || "free");
                            setSelectedDuration("permanent");
                          }}
                          className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 hover:ring-1 hover:ring-indigo-400 cursor-pointer transition-all"
                          title={t("admin.changePlan")}
                        >
                          {u.plan || "free"} ✎
                        </button>
                        {u.plan_expires_at && (
                          <span className="text-[9px] text-slate-400">
                            {new Date(u.plan_expires_at).getTime() < Date.now() ? "expired" : `exp: ${new Date(u.plan_expires_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-zinc-400">
                      {new Date(u.created_at).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {u.suspended ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                          {t("admin.suspended")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                          {t("admin.active")}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openUserDetail(u)}
                          className="px-2 py-1 rounded text-xs font-semibold border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          👁
                        </button>
                        <button
                          type="button"
                          disabled={togglingUser === u.id}
                          onClick={() => handleToggleSuspend(u)}
                          className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
                            u.suspended
                              ? "border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              : "border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                          }`}
                        >
                          {togglingUser === u.id ? "..." : u.suspended ? t("admin.activate") : t("admin.suspend")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendResetPassword(u)}
                          className="px-2 py-1 rounded text-xs font-semibold border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                          title={t("admin.resetPassword")}
                        >
                          🔑
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u)}
                          className="px-2 py-1 rounded text-xs font-semibold border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title={t("admin.deleteAccount")}
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
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

      {/* Plan Override Modal */}
      {planModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t("admin.changePlan")} — {planModalUser.email}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Ubah paket langganan secara manual untuk akun ini. Perubahan akan langsung aktif di database.
            </p>

            <div className="space-y-2">
              {(["free", "pro", "team", "enterprise"] as const).map((p) => (
                <label
                  key={p}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedNewPlan === p
                      ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 font-bold text-indigo-700 dark:text-indigo-300"
                      : "border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span className="capitalize">{p}</span>
                  <input
                    type="radio"
                    name="plan"
                    value={p}
                    checked={selectedNewPlan === p}
                    onChange={(e) => setSelectedNewPlan(e.target.value)}
                    className="accent-indigo-600"
                  />
                </label>
              ))}
            </div>

            {selectedNewPlan !== "free" && (
              <div className="pt-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                  Durasi Paket (Comp / Gift / Trial)
                </label>
                <select
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 text-slate-800 dark:text-zinc-200"
                >
                  <option value="permanent">Permanen / Langganan Rutin (Tanpa Expire)</option>
                  <option value="7d">7 Hari (Trial / Demo)</option>
                  <option value="30d">1 Bulan (30 Hari)</option>
                  <option value="90d">3 Bulan (Quarterly Gift)</option>
                  <option value="180d">6 Bulan</option>
                  <option value="365d">1 Tahun (365 Hari)</option>
                </select>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPlanModalUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                disabled={savingPlan}
                onClick={handleSavePlan}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
              >
                {savingPlan ? t("common.loading") : t("admin.savePlan")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 360° User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{t("admin.userProfileTitle")}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {selectedUser.plan}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono mt-0.5">
                  {selectedUser.email} (ID: {selectedUser.id})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-base"
              >
                ✕
              </button>
            </div>

            {userDetailLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">{t("common.loading")}</div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Status Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Status</span>
                    <span className={`font-bold ${selectedUser.suspended ? "text-rose-600" : "text-emerald-600"}`}>
                      {selectedUser.suspended ? "Suspended" : "Active"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">{t("admin.googleDrive")}</span>
                    <span className="font-bold text-slate-800 dark:text-zinc-200">
                      {selectedUser.google_drive_connected ? "Connected ✓" : "Not Linked"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">{t("admin.userWorkspaces")}</span>
                    <span className="font-bold text-slate-800 dark:text-zinc-200">
                      {userWorkspaces.length}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">{t("admin.capturesCount")}</span>
                    <span className="font-bold text-slate-800 dark:text-zinc-200">
                      {userTotalCaptures}
                    </span>
                  </div>
                </div>

                {/* Billing & Subscription Gateway Reconcile */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 block">
                        Billing & Subscription Status
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                        Paket: <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase">{selectedUser.plan}</span>
                        {selectedUser.plan_expires_at ? (
                          <span className="ml-1 text-slate-400">
                            (Expires: {new Date(selectedUser.plan_expires_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })})
                          </span>
                        ) : (
                          <span className="ml-1 text-slate-400">(Permanent / Regular)</span>
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={syncingSubscription}
                      onClick={() => handleSyncSubscription(selectedUser)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-xs"
                      title="Tarik status langganan live dari Stripe/Paddle"
                    >
                      {syncingSubscription ? "Syncing..." : "⚡ Sync from Gateway"}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-zinc-800/60">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Direct Gateway Search:</span>
                    <a
                      href={selectedUser.stripe_search_url || `https://dashboard.stripe.com/customers?query=${encodeURIComponent(selectedUser.email)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <span>Stripe Dashboard</span>
                      <span className="text-[10px]">↗</span>
                    </a>
                    <span className="text-slate-300 dark:text-zinc-700">•</span>
                    <a
                      href={selectedUser.paddle_search_url || "https://vendors.paddle.com/customers"}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <span>Paddle Dashboard</span>
                      <span className="text-[10px]">↗</span>
                    </a>
                  </div>
                </div>

                {/* Workspaces List */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-2">
                    {t("admin.userWorkspaces")}
                  </h4>
                  {userWorkspaces.length === 0 ? (
                    <p className="text-slate-400 italic">No workspaces</p>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {userWorkspaces.map((ws) => (
                        <div
                          key={ws.id}
                          className="flex items-center justify-between p-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
                        >
                          <span className="font-semibold text-slate-900 dark:text-white">{ws.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                            {ws.role} {ws.is_owner ? "(Owner)" : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Captures */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-2">
                    {t("admin.userCaptures")}
                  </h4>
                  {userCaptures.length === 0 ? (
                    <p className="text-slate-400 italic">No captures recorded</p>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {userCaptures.map((cap) => (
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
                            className="text-[11px] font-semibold text-indigo-600 hover:underline"
                          >
                            View →
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
