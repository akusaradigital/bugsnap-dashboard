"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useT } from "@/components/I18nProvider";
import { useToast } from "@/components/Toast";

interface AdminStats {
  totalUsers: number;
  totalWorkspaces: number;
  totalCaptures: number;
  totalViews: number;
  totalComments: number;
}

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  plan: string | null;
  created_at: string;
  workspace_count: number;
  capture_count: number;
  suspended?: boolean;
}

interface TopWorkspace {
  id: string;
  name: string;
  owner_email: string;
  capture_count: number;
}

interface Promo {
  enabled: boolean;
  message: string;
}

interface DriftReport {
  ok: boolean;
  missing_projects_table?: boolean;
  missing_capture_source_column?: boolean;
  missing_capture_project_id_column?: boolean;
  missing_integrity_rpc?: boolean;
}

interface IntegrityReport {
  ok: boolean;
  orphan_captures_count: number;
  orphan_comments_count: number;
  orphan_projects_count: number;
  missing_sources_count: number;
  broken_drive_links_count: number;
  missing_default_projects_count: number;
}

interface DriveOrphanPreview {
  id: string;
  name: string;
  webViewLink: string | null;
  createdTime: string | null;
}

export default function AdminDashboardPage() {
  const { t } = useT();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ stats: AdminStats; users: AdminUser[]; topWorkspaces: TopWorkspace[]; promo: Promo; drift?: DriftReport | null; integrity?: IntegrityReport | null } | null>(null);
  const [search, setSearch] = useState("");

  // Promo Banner state
  const [promoMessage, setPromoMessage] = useState("");
  const [promoEnabled, setPromoEnabled] = useState(false);
  const [savingPromo, setSavingPromo] = useState(false);
  const [promoSaved, setPromoSaved] = useState(false);

  // Broadcast Email state
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<string | null>(null);
  const [orphanLoading, setOrphanLoading] = useState(false);
  const [orphanCleaning, setOrphanCleaning] = useState(false);
  const [orphanResult, setOrphanResult] = useState<string | null>(null);
  const [orphanSummary, setOrphanSummary] = useState<{ totalDriveFiles: number; linkedCaptureFiles: number; orphanCount: number } | null>(null);
  const [orphanFiles, setOrphanFiles] = useState<DriveOrphanPreview[]>([]);
  const [dbHealth, setDbHealth] = useState<{ status: string; latencyMs: number } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data: authData } = await supabase.auth.getSession();
        const token = authData.session?.access_token;
        if (!token) throw new Error(t("admin.notLoggedIn"));

        const res = await fetch("/api/admin/data", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 403) {
          throw new Error(t("admin.accessRestricted"));
        }

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || t("admin.loadFailed"));

        if (!cancelled) {
          setData(json);
          setPromoMessage(json.promo?.message || "");
          setPromoEnabled(!!json.promo?.enabled);
        }

        fetch("/api/health")
          .then((r) => r.json())
          .then((h) => {
            if (!cancelled && h.status) setDbHealth({ status: h.status, latencyMs: h.latencyMs });
          })
          .catch(() => {});
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("common.error"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [t]);

  const [actingUserId, setActingUserId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function toggleSuspend(userId: string, suspended: boolean) {
    setActingUserId(userId);
    setActionError(null);
    try {
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;
      if (!token) throw new Error(t("admin.notLoggedIn"));

      const res = await fetch("/api/admin/toggle-suspend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: userId, suspended }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("admin.updateFailed"));

      // Update local state for instant UI feedback
      setData((prev) => prev ? { ...prev, users: prev.users.map((u) => u.id === userId ? { ...u, suspended } : u) } : prev);
      showToast(suspended ? "User suspended" : "User unsuspended", "success");
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : t("admin.updateFailed"));
      showToast("Could not update user", "error");
    } finally {
      setActingUserId(null);
    }
  }

  async function savePromo() {
    setSavingPromo(true);
    setPromoSaved(false);
    try {
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;
      if (!token) throw new Error(t("admin.notLoggedIn"));

      const res = await fetch("/api/admin/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: promoMessage, enabled: promoEnabled }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("admin.promoSaveFailed"));
      setPromoSaved(true);
      setTimeout(() => setPromoSaved(false), 3000);
      showToast("Promo banner saved", "success");
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : t("admin.promoSaveFailed"));
      showToast("Could not save promo banner", "error");
    } finally {
      setSavingPromo(false);
    }
  }

  async function sendBroadcast() {
    if (!data) return;
    const confirmed = window.confirm(t("admin.broadcastConfirm", { count: data.stats.totalUsers }));
    if (!confirmed) return;

    setSendingBroadcast(true);
    setBroadcastResult(null);
    try {
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;
      if (!token) throw new Error(t("admin.notLoggedIn"));

      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject: broadcastSubject, html: broadcastBody.replace(/\n/g, "<br>") }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("admin.broadcastFailed"));
      setBroadcastResult(t("admin.broadcastSent", { count: json.sentCount }));
      setBroadcastSubject("");
      setBroadcastBody("");
      showToast(`Broadcast sent to ${json.sentCount} users`, "success");
    } catch (err: unknown) {
      setBroadcastResult(err instanceof Error ? err.message : t("admin.broadcastFailed"));
      showToast("Could not send broadcast", "error");
    } finally {
      setSendingBroadcast(false);
    }
  }

  async function scanDriveOrphans() {
    setOrphanLoading(true);
    setOrphanResult(null);
    try {
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;
      if (!token) throw new Error(t("admin.notLoggedIn"));
      const res = await fetch("/api/admin/drive-orphans", { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Drive scan failed");
      setOrphanSummary({ totalDriveFiles: json.totalDriveFiles, linkedCaptureFiles: json.linkedCaptureFiles, orphanCount: json.orphanCount });
      setOrphanFiles((json.orphans || []) as DriveOrphanPreview[]);
      setOrphanResult(`Found ${json.orphanCount} orphaned Drive files.`);
      showToast(`Found ${json.orphanCount} orphaned Drive files`, "success");
    } catch (err: unknown) {
      setOrphanResult(err instanceof Error ? err.message : "Drive scan failed");
      showToast("Drive scan failed", "error");
    } finally {
      setOrphanLoading(false);
    }
  }

  async function trashDriveOrphans() {
    if (!orphanFiles.length) return;
    const confirmed = window.confirm(`Trash ${orphanFiles.length} orphaned Drive files?`);
    if (!confirmed) return;
    setOrphanCleaning(true);
    setOrphanResult(null);
    try {
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;
      if (!token) throw new Error(t("admin.notLoggedIn"));
      const res = await fetch("/api/admin/drive-orphans", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fileIds: orphanFiles.map((file) => file.id) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Drive cleanup failed");
      setOrphanResult(`Trashed ${json.trashed} orphaned Drive files. ${json.failed} failed.`);
      setOrphanFiles((prev) => prev.filter((file) => !(json.results as Array<{ id: string; ok: boolean }>).some((item) => item.ok && item.id === file.id)));
      setOrphanSummary((prev) => prev ? { ...prev, orphanCount: Math.max(0, prev.orphanCount - Number(json.trashed || 0)) } : prev);
      showToast(`Trashed ${json.trashed} orphaned Drive files`, "success");
    } catch (err: unknown) {
      setOrphanResult(err instanceof Error ? err.message : "Drive cleanup failed");
      showToast("Drive cleanup failed", "error");
    } finally {
      setOrphanCleaning(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto animate-pulse">
        <div>
          <div className="h-6 w-48 bg-subtle rounded mb-2" />
          <div className="h-4 w-full max-w-96 bg-subtle rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[0, 1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-subtle rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/40 p-6 rounded-xl text-center">
          <svg className="w-10 h-10 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-lg font-bold">{t("admin.accessDenied")}</h2>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const filteredUsers = data.users.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      u.email.toLowerCase().includes(q) ||
      (u.full_name || "").toLowerCase().includes(q)
    );
  });

  return (
    <main className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("admin.title")}</h1>
        <p className="text-sm text-muted mt-1">{t("admin.subtitle")}</p>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        {[
          { label: t("admin.totalUsers"), value: data.stats.totalUsers },
          { label: t("admin.workspaces"), value: data.stats.totalWorkspaces },
          { label: t("admin.captures"), value: data.stats.totalCaptures },
          { label: t("admin.totalViews"), value: data.stats.totalViews },
          { label: t("admin.comments"), value: data.stats.totalComments },
        ].map((s) => (
          <div key={s.label} className="bg-subtle border border-border rounded-xl p-4 shadow-sm flex flex-col justify-center">
            <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {(data as { drift?: DriftReport | null; integrity?: IntegrityReport | null } | null)?.drift && (
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-subtle border border-border rounded-xl p-4 shadow-sm space-y-2">
              <h2 className="text-sm font-bold text-foreground">Schema drift</h2>
              <p className="text-xs text-muted">{(data?.drift?.ok ? 'OK' : 'Needs attention')}</p>
              <pre className="text-[10px] text-muted whitespace-pre-wrap">{JSON.stringify(data?.drift, null, 2)}</pre>
            </div>
            <div className="bg-subtle border border-border rounded-xl p-4 shadow-sm space-y-2">
              <h2 className="text-sm font-bold text-foreground">Integrity audit</h2>
              <p className="text-xs text-muted">{(data?.integrity?.ok ? 'OK' : 'Needs attention')}</p>
              <pre className="text-[10px] text-muted whitespace-pre-wrap">{JSON.stringify(data?.integrity, null, 2)}</pre>
            </div>
          </div>
        )}
        {/* PROMO BANNER */}
        <div className="bg-subtle border border-border rounded-xl p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-foreground">{t("admin.promoTitle")}</h2>
            <p className="text-[11px] text-muted mt-0.5">{t("admin.promoHint")}</p>
          </div>
          <div>
            <textarea
              value={promoMessage}
              onChange={(e) => setPromoMessage(e.target.value)}
              placeholder={t("admin.promoPlaceholder")}
              className="w-full text-xs rounded-lg border border-border p-3 outline-none focus:border-indigo-500 resize-none h-20"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={promoEnabled}
                onChange={(e) => setPromoEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-border text-indigo-600 focus:ring-indigo-500"
              />
              {t("admin.enableBanner")}
            </label>
            <button
              onClick={savePromo}
              disabled={savingPromo}
              className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {savingPromo ? t("v.saving") : promoSaved ? t("admin.saved") : t("admin.save")}
            </button>
          </div>
        </div>

        {/* EMAIL BROADCAST */}
        <div className="bg-subtle border border-border rounded-xl p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-foreground">{t("admin.broadcastTitle")}</h2>
            <p className="text-[11px] text-muted mt-0.5">{t("admin.broadcastHint", { count: data.stats.totalUsers })}</p>
          </div>
          <div className="space-y-2">
            <input
              type="text"
              placeholder={t("admin.subjectPlaceholder")}
              value={broadcastSubject}
              onChange={(e) => setBroadcastSubject(e.target.value)}
              className="w-full text-xs rounded-lg border border-border px-3 py-2 outline-none focus:border-indigo-500"
            />
            <textarea
              placeholder={t("admin.bodyPlaceholder")}
              value={broadcastBody}
              onChange={(e) => setBroadcastBody(e.target.value)}
              className="w-full text-xs rounded-lg border border-border p-3 outline-none focus:border-indigo-500 resize-none h-20"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="text-[10px] text-indigo-600 font-semibold max-w-[150px] truncate">
              {broadcastResult || ""}
            </div>
            <button
              onClick={sendBroadcast}
              disabled={sendingBroadcast || !broadcastSubject || !broadcastBody}
              className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {sendingBroadcast ? t("admin.sending") : t("admin.sendEmail")}
            </button>
          </div>
        </div>

        {/* TOP WORKSPACES */}
        <div className="bg-subtle border border-border rounded-xl p-0 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-subtle/30">
            <h2 className="text-sm font-bold text-foreground">{t("admin.topWorkspaces")}</h2>
            <p className="text-[11px] text-muted mt-0.5">{t("admin.byCaptures")}</p>
          </div>
          <ul className="divide-y divide-border/50 flex-1 overflow-y-auto">
            {data.topWorkspaces.map((w) => (
              <li key={w.id} className="flex items-center justify-between px-4 py-2.5">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-foreground truncate">{w.name}</div>
                  <div className="text-[10px] text-muted truncate">{w.owner_email}</div>
                </div>
                <div className="flex items-center gap-1.5 ml-2 shrink-0">
                  <span className="text-xs font-bold text-indigo-600">{w.capture_count}</span>
                  <span className="text-[10px] text-muted">{t("admin.capLabel")}</span>
                </div>
              </li>
            ))}
            {data.topWorkspaces.length === 0 && (
              <li className="px-4 py-6 text-center text-xs text-muted">{t("admin.noWorkspaces")}</li>
            )}
          </ul>
        </div>
      </div>

      <div className="bg-subtle border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-foreground">Drive orphan cleanup</h2>
            <p className="text-[11px] text-muted mt-0.5">Preview Drive files that are no longer linked to any BugSnap capture, then move them to Drive trash manually.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={scanDriveOrphans} disabled={orphanLoading || orphanCleaning} className="px-4 py-1.5 text-xs font-semibold bg-subtle border border-border text-foreground rounded-lg hover:bg-subtle disabled:opacity-50 transition-colors">{orphanLoading ? "Scanning..." : "Scan Drive"}</button>
            <button onClick={trashDriveOrphans} disabled={orphanCleaning || orphanFiles.length === 0} className="px-4 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">{orphanCleaning ? "Trashing..." : "Trash orphans"}</button>
          </div>
        </div>
        {orphanSummary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-border bg-white dark:bg-background p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Drive files</p><p className="text-lg font-bold text-foreground mt-1">{orphanSummary.totalDriveFiles}</p></div>
            <div className="rounded-lg border border-border bg-white dark:bg-background p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Linked captures</p><p className="text-lg font-bold text-foreground mt-1">{orphanSummary.linkedCaptureFiles}</p></div>
            <div className="rounded-lg border border-border bg-white dark:bg-background p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Orphans</p><p className="text-lg font-bold text-foreground mt-1">{orphanSummary.orphanCount}</p></div>
          </div>
        )}
        {orphanResult && <div className="text-xs text-muted">{orphanResult}</div>}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="max-h-72 overflow-y-auto divide-y divide-border/60 bg-white dark:bg-background">
            {orphanFiles.length === 0 ? (
              <div className="px-4 py-8 text-sm text-muted text-center">No orphan files loaded.</div>
            ) : orphanFiles.map((file) => (
              <div key={file.id} className="px-4 py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-[11px] text-muted break-all">{file.id}</p>
                  {file.createdTime && <p className="text-[11px] text-muted mt-0.5">{new Date(file.createdTime).toLocaleString()}</p>}
                </div>
                {file.webViewLink && <a href={file.webViewLink} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs font-semibold text-indigo-600 hover:underline">Open</a>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {actionError && (
        <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/40 rounded-xl p-3 text-sm">
          {actionError}
        </div>
      )}

      {/* USERS TABLE */}
      <div className="bg-subtle border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-subtle/30">
          <h2 className="text-sm font-semibold text-foreground">{t("admin.registeredUsers")}</h2>
          <div className="relative w-full sm:w-64">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={t("admin.searchByEmail")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-border outline-none focus:border-indigo-500 w-full"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-subtle/50 text-[11px] uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">{t("admin.user")}</th>
                <th className="px-4 py-3 font-semibold">{t("admin.plan")}</th>
                <th className="px-4 py-3 font-semibold">{t("admin.status")}</th>
                <th className="px-4 py-3 font-semibold">{t("admin.joined")}</th>
                <th className="px-4 py-3 font-semibold text-right">{t("admin.wsCount")}</th>
                <th className="px-4 py-3 font-semibold text-right">{t("admin.capCount")}</th>
                <th className="px-4 py-3 font-semibold text-right">{t("admin.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted text-sm">
                    {t("admin.noUsers", { query: search })}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-subtle/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{user.email}</div>
                      {user.full_name && <div className="text-[11px] text-muted">{user.full_name}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        user.plan === 'pro' ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40' : 'bg-subtle text-muted border-border'
                      }`}>
                        {(user.plan || "free").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        user.suspended ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/40' : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
                      }`}>
                        {user.suspended ? t("admin.suspended") : t("admin.active")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">{user.workspace_count}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">{user.capture_count}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        disabled={actingUserId === user.id}
                        onClick={() => toggleSuspend(user.id, !user.suspended)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors disabled:opacity-50 ${
                          user.suspended
                            ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600'
                            : 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/40 bg-subtle hover:bg-red-50 dark:hover:bg-red-950/30'
                        }`}
                      >
                        {actingUserId === user.id ? t("admin.updating") : (user.suspended ? t("admin.activate") : t("admin.suspend"))}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER DB HEALTH */}
      <div className="flex items-center justify-between text-xs text-muted pt-2 border-t border-border/60">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dbHealth?.status === "healthy" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
          <span>Live Database: <strong className="text-foreground">{dbHealth?.status === "healthy" ? "Connected" : "Checking..."}</strong></span>
          {dbHealth && <span className="text-[11px] font-mono text-muted">({dbHealth.latencyMs}ms)</span>}
        </div>
        <span>BugSnap Admin Engine v0.3.2</span>
      </div>
    </main>
  );
}
