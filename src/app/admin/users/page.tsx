"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/Toast";
import { useT } from "@/components/I18nProvider";
import { getAdminHeaders } from "@/lib/admin-cache";
import { Icon } from "@/lib/iconify";
import { Dropdown } from "@/components/Dropdown";
import { AdminPagination } from "@/components/AdminPagination";
import { useConfirm } from "@/components/ConfirmDialog";

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

interface CommentInfo {
  id: string;
  capture_id: string;
  author_name: string | null;
  body: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const { showToast } = useToast();
  const { t } = useT();
  const confirm = useConfirm();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selected user for 360 view
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [userWorkspaces, setUserWorkspaces] = useState<WorkspaceInfo[]>([]);
  const [userCaptures, setUserCaptures] = useState<CaptureInfo[]>([]);
  const [userTotalCaptures, setUserTotalCaptures] = useState(0);
  const [userComments, setUserComments] = useState<CommentInfo[]>([]);

  // Action states
  const [togglingUser, setTogglingUser] = useState<string | null>(null);
  const [openRowMenu, setOpenRowMenu] = useState<string | null>(null);
  const [planModalUser, setPlanModalUser] = useState<UserItem | null>(null);
  const [selectedNewPlan, setSelectedNewPlan] = useState<string>("free");
  const [selectedDuration, setSelectedDuration] = useState<string>("permanent");
  const [savingPlan, setSavingPlan] = useState(false);
  const [syncingSubscription, setSyncingSubscription] = useState(false);
  const [sendingReengagement, setSendingReengagement] = useState(false);

  // Close the row action menu when clicking anywhere else.
  useEffect(() => {
    if (!openRowMenu) return;
    const close = () => setOpenRowMenu(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [openRowMenu]);

  // Per-page cache keyed by filters, so going back to a page is instant.
  const pageCache = useRef(new Map<string, { users: UserItem[]; totalPages: number; total: number }>());

  function pageKey(p: number, size: number, plan: string, status: string, search: string) {
    return `${p}|${size}|${plan}|${status}|${search}`;
  }

  async function fetchPage(p: number, size: number, plan: string, status: string, search: string) {
    const key = pageKey(p, size, plan, status, search);
    const cachedPage = pageCache.current.get(key);
    if (cachedPage) return cachedPage;

    const headers = await getAdminHeaders();
    const params = new URLSearchParams({
      page: p.toString(),
      limit: String(size),
      plan,
      status,
      search,
    });
    const res = await fetch(`/api/admin/users?${params.toString()}`, { headers });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || t("admin.loadFailed"));

    const result = {
      users: (json.users || []) as UserItem[],
      totalPages: json.pagination?.totalPages || 1,
      total: json.pagination?.total || 0,
    };
    pageCache.current.set(key, result);
    return result;
  }

  // Keep the previous rows visible while the next page loads (no blank flash).
  async function loadUsers() {
    setLoading(true);
    try {
      const search = searchQuery.trim();
      const result = await fetchPage(page, pageSize, planFilter, statusFilter, search);
      setUsers(result.users);
      setTotalPages(result.totalPages);
      setTotalCount(result.total);

      // Prefetch the next page so clicking Next feels instant.
      if (page < result.totalPages) {
        fetchPage(page + 1, pageSize, planFilter, statusFilter, search).catch(() => {});
      }
    } catch (err: unknown) {
      showToast((err as Error)?.message || t("admin.loadFailed"), "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, planFilter, statusFilter]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    pageCache.current.clear();
    if (page !== 1) {
      setPage(1);
    } else {
      loadUsers();
    }
  }

  async function openUserDetail(user: UserItem) {
    setSelectedUser(user);
    setUserDetailLoading(true);
    setUserWorkspaces([]);
    setUserCaptures([]);
    setUserComments([]);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/users?userId=${user.id}`, { headers });
      const json = await res.json();
      if (res.ok && json.user) {
        setSelectedUser(json.user);
        setUserWorkspaces(json.workspaces || []);
        setUserCaptures(json.recentCaptures || []);
        setUserTotalCaptures(json.totalCaptures || 0);
        setUserComments(json.recentComments || []);
      }
    } catch {
      // silent
    } finally {
      setUserDetailLoading(false);
    }
  }

  async function handleToggleSuspend(user: UserItem) {
    const nextState = !user.suspended;
    const ok = await confirm({
      title: nextState ? t("admin.suspendConfirmTitle") : t("admin.unsuspendConfirmTitle"),
      message: user.email,
      danger: nextState,
    });
    if (!ok) return;

    setTogglingUser(user.id);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, action: "toggle_suspend", suspended: nextState }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("adminUsers.errToggle"));

      pageCache.current.clear();
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, suspended: nextState } : u))
      );
      if (selectedUser?.id === user.id) {
        setSelectedUser((prev) => (prev ? { ...prev, suspended: nextState } : null));
      }
      showToast(nextState ? t("admin.suspended") : t("admin.active"), "success");
    } catch (err: unknown) {
      showToast((err as Error)?.message || t("adminUsers.errStatus"), "error");
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
      if (!res.ok) throw new Error(json.error || t("adminUsers.errPlan"));

      const updatedExpiry = json.user?.plan_expires_at || null;
      pageCache.current.clear();
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
      showToast((err as Error)?.message || t("adminUsers.errPlanToast"), "error");
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
      if (!res.ok) throw new Error(json.error || t("adminUsers.errSync"));
      if (json.synced && json.plan) {
        showToast(json.message || t("adminUsers.syncedToast"), "success");
        pageCache.current.clear();
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, plan: json.plan, plan_expires_at: null } : u))
        );
        if (selectedUser?.id === user.id) {
          setSelectedUser((prev) => (prev ? { ...prev, plan: json.plan, plan_expires_at: null } : null));
        }
      } else {
        showToast(json.message || t("adminUsers.noGateway"), "info");
      }
    } catch (err: unknown) {
      showToast((err as Error)?.message || t("adminUsers.errSyncToast"), "error");
    } finally {
      setSyncingSubscription(false);
    }
  }

  async function handleSendReengagement(user: UserItem) {
    setSendingReengagement(true);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, action: "send_reengagement" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("admin.reengagementFailed"));
      showToast(t("admin.reengagementSent"), "success");
    } catch (err: unknown) {
      showToast((err as Error)?.message || t("admin.reengagementFailed"), "error");
    } finally {
      setSendingReengagement(false);
    }
  }

  async function handleSendResetPassword(user: UserItem) {
    const ok = await confirm({
      title: t("admin.resetPasswordConfirmTitle"),
      message: user.email,
    });
    if (!ok) return;
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, action: "reset_password" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("adminUsers.errReset"));

      showToast(t("admin.resetPasswordSent", { email: user.email }), "success");
    } catch (err: unknown) {
      showToast((err as Error)?.message || t("adminUsers.errResetToast"), "error");
    }
  }

  async function handleDeleteUser(user: UserItem) {
    const ok = await confirm({
      title: t("admin.deleteUserConfirmTitle"),
      message: t("admin.deleteUserConfirm", { email: user.email }),
      danger: true,
    });
    if (!ok) return;

    try {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/users?userId=${user.id}`, {
        method: "DELETE",
        headers,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("adminUsers.errDelete"));

      pageCache.current.clear();
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      if (selectedUser?.id === user.id) setSelectedUser(null);
      showToast(t("admin.userDeleted"), "success");
    } catch (err: unknown) {
      showToast((err as Error)?.message || t("adminUsers.errDeleteToast"), "error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span className="flex items-center gap-2"><Icon icon="lucide:users" className="w-4 h-4 shrink-0 text-[#2563EB] dark:text-[#3B82F6]" /> {t("admin.manageUsers")}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            {totalCount.toLocaleString()} {t("admin.user")} · {t("admin.subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            pageCache.current.clear();
            loadUsers();
          }}
          disabled={loading}
          className="self-start sm:self-auto px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-colors shadow-xs cursor-pointer"
        >
          {loading ? t("admin.refreshing") : t("admin.refreshMetrics")}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Dropdown
            value={planFilter}
            onChange={(val) => {
              setPlanFilter(val);
              setPage(1);
            }}
            options={[
              { value: "all", label: t("admin.allPlans") },
              { value: "free", label: t("adminUsers.planFree") },
              { value: "pro", label: t("adminUsers.planPro") },
              { value: "pro_plus", label: t("adminUsers.planProPlus") },
              { value: "enterprise", label: t("adminUsers.planEnterprise") },
            ]}
            variant="field-white"
          />

          <Dropdown
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            options={[
              { value: "all", label: t("admin.allStatuses") },
              { value: "active", label: t("admin.active") },
              { value: "suspended", label: t("admin.suspended") },
              { value: "stuck", label: t("admin.statusStuck") },
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
            placeholder={t("admin.searchUserPlaceholder")}
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
            <tbody className={`divide-y divide-slate-100 dark:divide-zinc-800 transition-opacity ${loading && users.length > 0 ? "opacity-50" : ""}`}>
              {loading && users.length === 0 ? (
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
                      <div className="font-bold text-slate-900 dark:text-white">
                        {u.full_name || t("adminUsers.noName")}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono mt-0.5">
                        {u.email}
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
                          className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300 hover:text-[#2563EB] dark:hover:text-[#3B82F6] cursor-pointer transition-colors"
                          title={t("admin.changePlan")}
                        >
                          {u.plan || "free"}
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
                      <div className="relative flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          disabled={togglingUser === u.id}
                          onClick={() => handleToggleSuspend(u)}
                          title={u.suspended ? t("admin.activate") : t("admin.suspend")}
                          aria-label={u.suspended ? t("admin.activate") : t("admin.suspend")}
                          className={`p-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-50 ${
                            u.suspended
                              ? "text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                              : "text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40"
                          }`}
                        >
                          <Icon
                            icon={togglingUser === u.id ? "lucide:loader-2" : u.suspended ? "lucide:play" : "lucide:pause"}
                            className={`w-4 h-4 ${togglingUser === u.id ? "animate-spin" : ""}`}
                            aria-hidden="true"
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpenRowMenu(openRowMenu === u.id ? null : u.id)}
                          aria-label={t("adminUsers.moreActions")}
                          aria-expanded={openRowMenu === u.id}
                          className="p-1 rounded text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <Icon icon="lucide:ellipsis" className="w-4 h-4" />
                        </button>
                        {openRowMenu === u.id && (
                          <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl p-1 text-xs">
                            <button
                              type="button"
                              onClick={() => { setOpenRowMenu(null); openUserDetail(u); }}
                              className="w-full text-left px-3 py-2 rounded-lg text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                            >
                              {t("adminUsers.viewDetail")}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setOpenRowMenu(null); handleSendResetPassword(u); }}
                              className="w-full text-left px-3 py-2 rounded-lg text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                            >
                              {t("admin.resetPassword")}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setOpenRowMenu(null); handleDeleteUser(u); }}
                              className="w-full text-left px-3 py-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            >
                              {t("admin.deleteAccount")}
                            </button>
                          </div>
                        )}
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
              disabled={loading}
              prevLabel={t("admin.prev")}
              nextLabel={t("admin.next")}
            />
          </div>
        )}
      </div>

      {/* Plan Override Modal */}
      {planModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t("admin.changePlan")} - {planModalUser.email}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Ubah paket langganan secara manual untuk akun ini. Perubahan akan langsung aktif di database.
            </p>

            <div className="space-y-2">
              {(["free", "pro", "pro_plus", "enterprise"] as const).map((p) => (
                <label
                  key={p}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedNewPlan === p
                      ? "border-[#2563EB] bg-blue-50 dark:bg-blue-950/20 font-bold text-[#2563EB] dark:text-[#3B82F6]"
                      : "border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span className="capitalize">{p === "pro_plus" ? t("adminUsers.planProPlus") : p}</span>
                  <input
                    type="radio"
                    name="plan"
                    value={p}
                    checked={selectedNewPlan === p}
                    onChange={(e) => setSelectedNewPlan(e.target.value)}
                    className="accent-[#2563EB]"
                  />
                </label>
              ))}
            </div>

            {selectedNewPlan !== "free" && (
              <div className="pt-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                  Durasi Paket (Comp / Gift / Trial)
                </label>
                <Dropdown
                  value={selectedDuration}
                  onChange={(val) => setSelectedDuration(val)}
                  options={[
                    { value: "permanent", label: t("adminUsers.durPermanent") },
                    { value: "7d", label: t("adminUsers.durTrial") },
                    { value: "30d", label: t("adminUsers.dur30") },
                    { value: "90d", label: t("adminUsers.dur90") },
                    { value: "180d", label: "6 Bulan" },
                    { value: "365d", label: "1 Tahun (365 Hari)" },
                  ]}
                  variant="field"
                />
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
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs shadow-[#2563EB]/25 transition-colors disabled:opacity-50"
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
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{t("admin.userProfileTitle")}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-blue-50 dark:bg-blue-950/20 text-[#2563EB] dark:text-[#3B82F6] border border-blue-200 dark:border-blue-900/40">
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
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
                aria-label={t("adminUsers.close")}
              >
                <Icon icon="lucide:x" className="w-4 h-4 shrink-0" />
              </button>
            </div>

            {userDetailLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">{t("common.loading")}</div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Status Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-bold block">Status</span>
                    <span className={`font-bold ${selectedUser.suspended ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {selectedUser.suspended ? t("adminUsers.statusSuspended") : t("adminUsers.statusActive")}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-bold block">{t("admin.googleDrive")}</span>
                    <span className="font-bold text-slate-800 dark:text-zinc-200 inline-flex items-center gap-1">
                      {selectedUser.google_drive_connected ? (
                        <>
                          <span>{t("adminUsers.driveConnected")}</span>
                          <Icon icon="lucide:check" className="w-3 h-3 text-emerald-500 shrink-0" />
                        </>
                      ) : (
                        t("adminUsers.driveNotLinked")
                      )}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-bold block">{t("admin.userWorkspaces")}</span>
                    <span className="font-bold text-slate-800 dark:text-zinc-200">
                      {userWorkspaces.length}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-bold block">{t("admin.capturesCount")}</span>
                    <span className="font-bold text-slate-800 dark:text-zinc-200">
                      {userTotalCaptures}
                    </span>
                  </div>
                </div>

                {/* Stuck User Re-engagement Action */}
                {userTotalCaptures === 0 && (
                  <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-950/60 bg-amber-50/50 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                          {t("admin.stuckUserBadge")}
                        </span>
                        <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                          0 Captures
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                        Pengguna terdaftar belum pernah membuat rekaman/tangkapan bug.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={sendingReengagement}
                      onClick={() => handleSendReengagement(selectedUser)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-xs disabled:opacity-50 transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
                    >
                      <Icon icon="lucide:mail" className="w-3.5 h-3.5 shrink-0" />
                      <span>{sendingReengagement ? t("common.loading") : t("admin.sendReengagement")}</span>
                    </button>
                  </div>
                )}

                {/* Billing & Subscription Gateway Reconcile */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 block">
                        Billing & Subscription Status
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                        Paket: <span className="font-bold text-[#2563EB] dark:text-[#3B82F6] uppercase">{selectedUser.plan}</span>
                        {selectedUser.plan_expires_at ? (
                          <span className="ml-1 text-slate-400">
                            (Expires: {new Date(selectedUser.plan_expires_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })})
                          </span>
                        ) : (
                          <span className="ml-1 text-slate-400">{t("adminUsers.permanentRegular")}</span>
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={syncingSubscription}
                      onClick={() => handleSyncSubscription(selectedUser)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs shadow-[#2563EB]/25 disabled:opacity-50 transition-all flex items-center gap-1.5"
                      title={t("adminUsers.gatewayTitle")}
                    >
                      {syncingSubscription ? t("adminUsers.syncing") : (
                        <>
                          <Icon icon="lucide:zap" className="w-3.5 h-3.5 shrink-0 brightness-0 invert" />
                          <span>{t("adminUsers.syncGateway")}</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-zinc-800/60">
                    <span className="text-[10px] uppercase font-bold text-slate-400">{t("adminUsers.gatewaySearch")}</span>
                    <a
                      href={selectedUser.stripe_search_url || `https://dashboard.stripe.com/customers?query=${encodeURIComponent(selectedUser.email)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] dark:text-[#3B82F6] dark:hover:text-[#60A5FA] hover:underline flex items-center gap-1"
                    >
                      <span>Stripe Dashboard</span>
                      <Icon icon="lucide:external-link" className="w-3 h-3 shrink-0" />
                    </a>
                    <span className="text-slate-300 dark:text-zinc-700">•</span>
                    <a
                      href={selectedUser.paddle_search_url || "https://vendors.paddle.com/customers"}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] dark:text-[#3B82F6] dark:hover:text-[#60A5FA] hover:underline flex items-center gap-1"
                    >
                      <span>Paddle Dashboard</span>
                      <Icon icon="lucide:external-link" className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                </div>

                {/* Workspaces List */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-2">
                    {t("admin.userWorkspaces")}
                  </h4>
                  {userWorkspaces.length === 0 ? (
                    <p className="text-slate-400 italic">{t("adminUsers.noWorkspaces")}</p>
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
                    <p className="text-slate-400 italic">{t("adminUsers.noCaptures")}</p>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {userCaptures.map((cap) => (
                        <div
                          key={cap.id}
                          className="flex items-center justify-between p-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
                        >
                          <div>
                            <span className="font-medium text-slate-900 dark:text-white">{cap.title || t("adminUsers.untitled")}</span>
                            <span className="text-[10px] text-slate-400 ml-2">({cap.type})</span>
                          </div>
                          <a
                            href={`/v/${cap.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] dark:text-[#3B82F6] dark:hover:text-[#60A5FA] hover:underline"
                          >
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Comments */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-2">
                    {t("admin.userComments")}
                  </h4>
                  {userComments.length === 0 ? (
                    <p className="text-slate-400 italic">{t("admin.userNoComments")}</p>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {userComments.map((c) => (
                        <div
                          key={c.id}
                          className="p-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 min-w-0"
                        >
                          <div className="flex items-center justify-between gap-2 min-w-0">
                            <span className="font-medium text-slate-900 dark:text-white truncate">
                              {c.author_name || t("adminUsers.anonymous")}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {new Date(c.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-zinc-400 mt-1 line-clamp-2 break-words">
                            {c.body}
                          </p>
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
