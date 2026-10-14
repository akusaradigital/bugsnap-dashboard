"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { useT } from "@/components/I18nProvider";
import { SecurityEvent } from "@/lib/security-audit";
import { getAdminHeaders, getAdminCache, setAdminCache } from "@/lib/admin-cache";
import { Icon } from "@/lib/iconify";

interface AuditStats {
  total: number;
  honeypot: number;
  spam_email: number;
  turnstile_fail: number;
  admin_login: number;
  admin_action: number;
}

interface TrendPoint {
  date: string;
  label: string;
  total: number;
  threats: number;
  admin: number;
}

// Inline stacked-bar trend: neutral bar = total events that day, rose overlay
// = threat-only subset (honeypot/spam/turnstile). No charting lib - same
// lazy inline-SVG approach as the overview page's Sparkline.
function TrendChart({ data }: { data: TrendPoint[] }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.total), 1);
  const width = 600;
  const height = 80;
  const barWidth = width / data.length;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      className="overflow-visible"
    >
      {data.map((d, idx) => {
        const totalH = (d.total / max) * (height - 4);
        const threatH = (d.threats / max) * (height - 4);
        const x = idx * barWidth + barWidth * 0.15;
        const w = Math.max(barWidth * 0.7, 1);
        return (
          <g key={d.date}>
            <title>{`${d.label}: ${d.total} event(s), ${d.threats} threat(s)`}</title>
            <rect x={x} y={height - totalH} width={w} height={totalH} rx="1" className="fill-slate-200 dark:fill-zinc-800" />
            {threatH > 0 && (
              <rect x={x} y={height - threatH} width={w} height={threatH} rx="1" className="fill-rose-500" />
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function AdminSecurityAuditPage() {
  const { showToast } = useToast();
  const { t } = useT();
  const cached = getAdminCache<{ logs: SecurityEvent[]; stats: AuditStats; trend: TrendPoint[] }>("admin_security_data");
  const [loading, setLoading] = useState(!cached);
  const [logs, setLogs] = useState<SecurityEvent[]>(cached?.logs || []);
  const [stats, setStats] = useState<AuditStats>(
    cached?.stats || { total: 0, honeypot: 0, spam_email: 0, turnstile_fail: 0, admin_login: 0, admin_action: 0 }
  );
  const [trend, setTrend] = useState<TrendPoint[]>(cached?.trend || []);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [clearing, setClearing] = useState(false);
  const [purging, setPurging] = useState(false);

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
      const newTrend = json.trend || [];
      setLogs(newLogs);
      setStats(newStats);
      setTrend(newTrend);
      setAdminCache("admin_security_data", { logs: newLogs, stats: newStats, trend: newTrend });
    } catch (err: unknown) {
      if (!logs.length) showToast((err as Error)?.message || t("admin.loadFailed"), "error");
    } finally {
      setLoading(false);
    }
  }

  async function handlePurgeOldLogs() {
    if (!confirm(t("admin.purge90Confirm"))) return;
    setPurging(true);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/security-audit?days=90", { method: "DELETE", headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to purge old logs");

      showToast(t("admin.purge90Success"), "success");
      await loadLogs();
    } catch (err: unknown) {
      showToast((err as Error)?.message || "Failed to purge logs", "error");
    } finally {
      setPurging(false);
    }
  }

  async function handleClearLogs() {
    if (!confirm(t("admin.clearLogsConfirm"))) return;
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
      showToast(t("admin.clearLogsSuccess"), "success");
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
    <div className="space-y-6 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200 dark:border-zinc-800 min-w-0">
        <div className="min-w-0">
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span className="flex items-center gap-2"><Icon icon="lucide:shield-check" className="w-4 h-4 shrink-0 text-[#6B9A35] dark:text-[#A8D666]" /> {t("admin.auditTitle")}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            {t("admin.auditDesc")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadLogs}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            {loading ? (
              t("admin.refreshing")
            ) : (
              <>
                <Icon icon="lucide:refresh-cw" className="w-3.5 h-3.5 shrink-0" />
                <span>{t("admin.refreshMetrics")}</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handlePurgeOldLogs}
            disabled={purging || clearing || logs.length === 0}
            className="px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-white dark:bg-zinc-900 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-semibold text-amber-700 dark:text-amber-400 transition-colors disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5"
          >
            {purging ? (
              t("admin.purging")
            ) : (
              <>
                <Icon icon="lucide:clock" className="w-3.5 h-3.5 shrink-0" />
                <span>{t("admin.purge90")}</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleClearLogs}
            disabled={clearing || purging || logs.length === 0}
            className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900 bg-white dark:bg-zinc-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold text-rose-600 dark:text-rose-400 transition-colors disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5"
          >
            {clearing ? (
              t("admin.clearingLogs")
            ) : (
              <>
                <Icon icon="lucide:trash-2" className="w-3.5 h-3.5 shrink-0" />
                <span>{t("admin.clearLogs")}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Total Events", value: stats.total, color: "text-slate-900 dark:text-white", border: "border-slate-200 dark:border-zinc-800" },
          { label: "Admin Actions", value: stats.admin_action, color: "text-[#6B9A35] dark:text-[#A8D666]", border: "border-[#89BD49]/30 dark:border-[#89BD49]/40" },
          { label: "Bot Honeypots", value: stats.honeypot, color: "text-rose-600 dark:text-rose-400", border: "border-rose-200 dark:border-rose-900/50" },
          { label: "Disposable Emails", value: stats.spam_email, color: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-900/50" },
          { label: "Turnstile Fails", value: stats.turnstile_fail, color: "text-slate-700 dark:text-slate-300", border: "border-slate-300 dark:border-zinc-700" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border ${s.border} bg-white dark:bg-zinc-900 p-3.5 shadow-sm min-w-0`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 truncate block">{s.label}</span>
            <p className={`text-2xl font-black ${s.color} mt-1`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* 30-Day Activity Trend */}
      {trend.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-6 shadow-sm min-w-0">
          <div className="flex items-center justify-between mb-3 min-w-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 truncate">
              30-Day Activity Trend
            </h3>
            <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-zinc-400 shrink-0">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-slate-300 dark:bg-zinc-700 inline-block" /> Total
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-rose-500 inline-block" /> Threats
              </span>
            </div>
          </div>
          <TrendChart data={trend} />
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-auto text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 px-3 py-2 outline-none"
          >
            <option value="all">All Event Types</option>
            <option value="admin_action">Admin Actions</option>
            <option value="admin_password_change">Admin Password Change</option>
            <option value="rate_limit">Rate Limit</option>
            <option value="honeypot_trap">Honeypot Bot Trap</option>
            <option value="spam_email">Disposable Email Block</option>
            <option value="turnstile_fail">Turnstile Fail</option>
            <option value="admin_login_success">Admin Login Success</option>
            <option value="admin_login_failed">Admin Login Failed</option>
          </select>
        </div>

        <div className="w-full sm:w-64 min-w-0">
          <input
            type="text"
            placeholder="Search IP, title, details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 outline-none focus:border-[#89BD49] focus:ring-1 focus:ring-[#89BD49]/20 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden min-w-0">
        <div className="overflow-x-auto min-w-0">
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
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#89BD49]/10 dark:bg-[#89BD49]/20 text-[#6B9A35] dark:text-[#A8D666] border border-[#89BD49]/30 dark:border-[#89BD49]/40">
                            <Icon icon="lucide:zap" className="w-3 h-3 shrink-0" />
                            <span>ADMIN ACTION</span>
                          </span>
                        )}
                        {log.type === "admin_password_change" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                            <Icon icon="lucide:lock" className="w-3 h-3 shrink-0" />
                            <span>PASSWORD CHANGE</span>
                          </span>
                        )}
                        {log.type === "honeypot_trap" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                            <Icon icon="lucide:shield-alert" className="w-3 h-3 shrink-0" />
                            <span>HONEYPOT</span>
                          </span>
                        )}
                        {log.type === "spam_email" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                            <Icon icon="lucide:ban" className="w-3 h-3 shrink-0" />
                            <span>DISPOSABLE</span>
                          </span>
                        )}
                        {log.type === "turnstile_fail" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-300 dark:border-zinc-700">
                            <Icon icon="lucide:shield-check" className="w-3 h-3 shrink-0" />
                            <span>TURNSTILE</span>
                          </span>
                        )}
                        {log.type === "admin_login_success" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                            <Icon icon="lucide:key" className="w-3 h-3 shrink-0" />
                            <span>LOGIN OK</span>
                          </span>
                        )}
                        {log.type === "admin_login_failed" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                            <Icon icon="lucide:alert-triangle" className="w-3 h-3 shrink-0" />
                            <span>LOGIN FAIL</span>
                          </span>
                        )}
                        {log.type === "rate_limit" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400">
                            <Icon icon="lucide:clock" className="w-3 h-3 shrink-0" />
                            <span>RATE LIMIT</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {log.title}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-zinc-300 font-mono text-[11px] max-w-md break-all">
                        {log.detail}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 dark:text-zinc-400 break-all">
                        {log.ip || "-"}
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
