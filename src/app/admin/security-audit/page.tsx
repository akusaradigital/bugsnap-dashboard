"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { useT } from "@/components/I18nProvider";
import { SecurityEvent } from "@/lib/security-audit";
import { getAdminHeaders, getAdminCache, setAdminCache } from "@/lib/admin-cache";

interface AuditStats {
  total: number;
  honeypot: number;
  spam_email: number;
  turnstile_fail: number;
  admin_login: number;
  admin_action: number;
}

export default function AdminSecurityAuditPage() {
  const { showToast } = useToast();
  const { t } = useT();
  const cached = getAdminCache<{ logs: SecurityEvent[]; stats: AuditStats }>("admin_security_data");
  const [loading, setLoading] = useState(!cached);
  const [logs, setLogs] = useState<SecurityEvent[]>(cached?.logs || []);
  const [stats, setStats] = useState<AuditStats>(
    cached?.stats || { total: 0, honeypot: 0, spam_email: 0, turnstile_fail: 0, admin_login: 0, admin_action: 0 }
  );
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadLogs() {
    if (!logs.length) setLoading(true);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/security-audit", { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("admin.loadFailed"));

      const newLogs = json.logs || [];
      const newStats = json.stats || { total: 0, honeypot: 0, spam_email: 0, turnstile_fail: 0, admin_login: 0, admin_action: 0 };
      setLogs(newLogs);
      setStats(newStats);
      setAdminCache("admin_security_data", { logs: newLogs, stats: newStats });
    } catch (err: unknown) {
      if (!logs.length) showToast((err as Error)?.message || t("admin.loadFailed"), "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleClearLogs() {
    if (!confirm("Are you sure you want to clear all security and audit logs? This action cannot be undone.")) return;
    setClearing(true);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/security-audit", { method: "DELETE", headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to clear logs");

      setLogs([]);
      setStats({ total: 0, honeypot: 0, spam_email: 0, turnstile_fail: 0, admin_login: 0, admin_action: 0 });
      setAdminCache("admin_security_data", {
        logs: [],
        stats: { total: 0, honeypot: 0, spam_email: 0, turnstile_fail: 0, admin_login: 0, admin_action: 0 },
      });
      showToast("Security logs cleared successfully", "success");
    } catch (err: unknown) {
      showToast((err as Error)?.message || "Failed to clear logs", "error");
    } finally {
      setClearing(false);
    }
  }

  const filteredLogs = logs.filter((l) => {
    if (typeFilter !== "all" && l.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (l.title || "").toLowerCase().includes(q);
      const matchDetail = (l.detail || "").toLowerCase().includes(q);
      const matchIp = (l.ip || "").toLowerCase().includes(q);
      if (!matchTitle && !matchDetail && !matchIp) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>🛡️ {t("admin.auditTitle")}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            {t("admin.auditDesc")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadLogs}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
          >
            {loading ? t("admin.refreshing") : t("admin.refreshMetrics")}
          </button>
          <button
            type="button"
            onClick={handleClearLogs}
            disabled={clearing || logs.length === 0}
            className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900 bg-white dark:bg-zinc-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold text-rose-600 dark:text-rose-400 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {clearing ? "Clearing..." : "Clear Logs 🗑"}
          </button>
        </div>
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total Events", value: stats.total, color: "text-slate-900 dark:text-white", border: "border-slate-200 dark:border-zinc-800" },
          { label: "Admin Actions", value: stats.admin_action, color: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-200 dark:border-indigo-900/50" },
          { label: "Bot Honeypots", value: stats.honeypot, color: "text-rose-600 dark:text-rose-400", border: "border-rose-200 dark:border-rose-900/50" },
          { label: "Disposable Emails", value: stats.spam_email, color: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-900/50" },
          { label: "Turnstile Fails", value: stats.turnstile_fail, color: "text-purple-600 dark:text-purple-400", border: "border-purple-200 dark:border-purple-900/50" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border ${s.border} bg-white dark:bg-zinc-900 p-3.5 shadow-sm`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">{s.label}</span>
            <p className={`text-2xl font-black ${s.color} mt-1`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 px-3 py-2 outline-none"
          >
            <option value="all">All Event Types</option>
            <option value="admin_action">⚡ Admin Actions</option>
            <option value="honeypot_trap">🪤 Honeypot Bot Trap</option>
            <option value="spam_email">🚫 Disposable Email Block</option>
            <option value="turnstile_fail">🛡️ Turnstile Fail</option>
            <option value="admin_login_success">🔑 Admin Login Success</option>
            <option value="admin_login_failed">⚠️ Admin Login Failed</option>
          </select>
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search IP, title, details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Incident / Action</th>
                <th className="py-3 px-4">Telemetry Detail</th>
                <th className="py-3 px-4">Origin IP</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    {t("common.loading")}
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No security or admin actions recorded matching this filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        {log.type === "admin_action" && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
                            ⚡ ADMIN ACTION
                          </span>
                        )}
                        {log.type === "honeypot_trap" && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                            🪤 HONEYPOT
                          </span>
                        )}
                        {log.type === "spam_email" && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                            🚫 DISPOSABLE
                          </span>
                        )}
                        {log.type === "turnstile_fail" && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400">
                            🛡️ TURNSTILE
                          </span>
                        )}
                        {log.type === "admin_login_success" && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                            🔑 LOGIN OK
                          </span>
                        )}
                        {log.type === "admin_login_failed" && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                            ⚠️ LOGIN FAIL
                          </span>
                        )}
                        {log.type === "rate_limit" && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400">
                            ⏱️ RATE LIMIT
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {log.title}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-zinc-300 font-mono text-[11px] max-w-md break-words">
                        {log.detail}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-500 dark:text-zinc-400">
                        {log.ip || "—"}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap text-slate-400 font-mono text-[11px]">
                        {new Date(log.created_at).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "short",
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
