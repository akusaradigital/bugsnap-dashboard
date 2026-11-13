"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { useT } from "@/components/I18nProvider";
import { useConfirm } from "@/components/ConfirmDialog";
import { getAdminHeaders, getAdminCache, setAdminCache } from "@/lib/admin-cache";
import { Icon } from "@/lib/iconify";

interface PingService {
  id: string;
  name: string;
  icon: string;
  category: string;
  status: "healthy" | "degraded" | "down" | "not_configured";
  latencyMs: number;
  message: string;
}

interface OrphanData {
  targetUserId?: string;
  totalDriveFiles: number;
  linkedCaptureFiles: number;
  orphanCount: number;
  orphans: Array<{ id: string; name: string; size?: number; mimeType?: string }>;
}

interface DriveConnectionRow {
  userId: string;
  email: string;
  googleEmail: string | null;
  status: "connected" | "reconnect_required" | "not_connected";
  message: string;
  updatedAt: string | null;
}

interface CaptureAtRisk {
  id: string;
  title: string | null;
  ownerEmail: string;
}

interface DriveHealthData {
  connections: DriveConnectionRow[];
  capturesAtRisk: CaptureAtRisk[];
}

const RETENTION_OPTIONS = [
  { days: 30, label: "30 Days", ratio: 0.45, avgMb: 4.8 },
  { days: 60, label: "60 Days", ratio: 0.28, avgMb: 5.2 },
  { days: 90, label: "90 Days", ratio: 0.16, avgMb: 5.5 },
  { days: 180, label: "180 Days", ratio: 0.08, avgMb: 6.0 },
] as const;

const SERVICE_ICONS: Record<string, string> = {
  supabase: "lucide:database",
  google_drive: "lucide:hard-drive",
  gdrive: "lucide:hard-drive",
  resend: "lucide:mail",
  turnstile: "lucide:shield-check",
  openai: "lucide:bot",
  ai: "lucide:bot",
};

export default function AdminSystemPage() {
  const { t, locale } = useT();
  const confirm = useConfirm();
  const { showToast } = useToast();

  const cachedServices = getAdminCache<PingService[]>("admin_system_services");
  const cachedAudit = getAdminCache<{ integrityData: unknown; driftData: unknown }>("admin_system_audit");

  // Integrations Ping State
  const [pingLoading, setPingLoading] = useState(!cachedServices);
  const [services, setServices] = useState<PingService[]>(cachedServices || []);
  const [lastPing, setLastPing] = useState<string | null>(null);

  // Google Drive Orphan State
  const [scanningDrive, setScanningDrive] = useState(false);
  const [cleaningDrive, setCleaningDrive] = useState(false);
  const [orphanData, setOrphanData] = useState<OrphanData | null>(null);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [targetUserIdInput, setTargetUserIdInput] = useState("");

  // Storage Retention Policy Simulator State
  const [retentionDays, setRetentionDays] = useState<number>(60);

  // Schema integrity
  const [integrityData, setIntegrityData] = useState<unknown>(cachedAudit?.integrityData || null);
  const [driftData, setDriftData] = useState<unknown>(cachedAudit?.driftData || null);
  const [loadingAudit, setLoadingAudit] = useState(!cachedAudit);

  // Google Drive connection health (on-demand only - each row costs one Google round trip)
  const cachedDriveHealth = getAdminCache<DriveHealthData>("admin_drive_health");
  const [driveHealth, setDriveHealth] = useState<DriveHealthData | null>(cachedDriveHealth);
  const [checkingDriveHealth, setCheckingDriveHealth] = useState(false);

  useEffect(() => {
    runPing();
    loadAudit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runPing(fresh = false) {
    if (!services.length) setPingLoading(true);
    try {
      const headers = await getAdminHeaders();
      const url = fresh ? "/api/admin/integrations/ping?fresh=true" : "/api/admin/integrations/ping";
      const res = await fetch(url, { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("adminSys.errPing"));

      const newServices = json.services || [];
      setServices(newServices);
      setAdminCache("admin_system_services", newServices);
      setLastPing(new Date().toLocaleTimeString("id-ID"));
    } catch (err: unknown) {
      if (!services.length) showToast((err as Error)?.message || t("adminSys.errPingToast"), "error");
    } finally {
      setPingLoading(false);
    }
  }

  async function loadAudit() {
    if (!integrityData) setLoadingAudit(true);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/schema-audit", { headers });
      const json = await res.json();
      if (res.ok) {
        setIntegrityData(json.integrity);
        setDriftData(json.drift);
        setAdminCache("admin_system_audit", { integrityData: json.integrity, driftData: json.drift });
      }
    } catch {
      // silent
    } finally {
      setLoadingAudit(false);
    }
  }

  async function checkDriveHealth() {
    setCheckingDriveHealth(true);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/drive-health", { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("adminSys.errDrive"));
      const data: DriveHealthData = { connections: json.connections || [], capturesAtRisk: json.capturesAtRisk || [] };
      setDriveHealth(data);
      setAdminCache("admin_drive_health", data);
    } catch (err: unknown) {
      showToast((err as Error)?.message || t("adminSys.errDriveToast"), "error");
    } finally {
      setCheckingDriveHealth(false);
    }
  }

  async function handleScanDrive() {
    setScanningDrive(true);
    setDriveError(null);
    try {
      const headers = await getAdminHeaders();
      const targetId = targetUserIdInput.trim();
      const query = targetId ? `?userId=${encodeURIComponent(targetId)}` : "";
      const res = await fetch(`/api/admin/drive-orphans${query}`, { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("adminSys.errScan"));

      setOrphanData(json);
      showToast(`Pemindaian selesai. Ditemukan ${json.orphanCount} file orphan.`, "info");
    } catch (err: unknown) {
      const msg = (err as Error)?.message || t("adminSys.errScanToast");
      setDriveError(msg);
      showToast(msg, "error");
    } finally {
      setScanningDrive(false);
    }
  }

  async function handleCleanDrive() {
    if (!orphanData || orphanData.orphans.length === 0) return;
    const fileIds = orphanData.orphans.map((f) => f.id);
    const ok = await confirm({
      title: t("admin.cleanDriveConfirmTitle"),
      message: t("admin.cleanDriveConfirm", { count: fileIds.length }),
      confirmLabel: t("admin.cleanDriveSend"),
      danger: true,
    });
    if (!ok) return;

    setCleaningDrive(true);
    try {
      const headers = await getAdminHeaders();
      const targetUserId = orphanData.targetUserId || targetUserIdInput.trim() || undefined;
      const res = await fetch("/api/admin/drive-orphans", {
        method: "POST",
        headers,
        body: JSON.stringify({ fileIds, userId: targetUserId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("adminSys.errClean"));

      showToast(`Berhasil membersihkan ${json.trashed} file dari Drive!`, "success");
      handleScanDrive();
    } catch (err: unknown) {
      showToast((err as Error)?.message || t("adminSys.errCleanToast"), "error");
    } finally {
      setCleaningDrive(false);
    }
  }

  const healthyCount = services.filter((s) => s.status === "healthy").length;
  const issueCount = services.filter((s) => s.status === "degraded" || s.status === "down").length;

  // Retention Simulator Calculations
  const selectedRetention = RETENTION_OPTIONS.find((o) => o.days === retentionDays) || RETENTION_OPTIONS[1];
  const baseDriveFiles = orphanData?.totalDriveFiles && orphanData.totalDriveFiles > 0 ? orphanData.totalDriveFiles : 1240;
  const orphanCount = orphanData?.orphanCount || 0;
  const simulatedAffectedFiles = Math.round(baseDriveFiles * selectedRetention.ratio) + orphanCount;
  const simulatedReclaimedMb = Math.round(simulatedAffectedFiles * selectedRetention.avgMb);
  const simulatedReclaimedDisplay =
    simulatedReclaimedMb >= 1024
      ? `${(simulatedReclaimedMb / 1024).toFixed(1)} GB`
      : `${simulatedReclaimedMb} MB`;
  const simulatedReductionPct = Math.min(95, Math.round((simulatedAffectedFiles / (baseDriveFiles + orphanCount)) * 100));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span className="flex items-center gap-2"><Icon icon="lucide:hard-drive" className="w-4 h-4 shrink-0 text-[#2563EB] dark:text-[#3B82F6]" /> {t("adminSys.title")}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            {t("adminSys.desc")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastPing && <span className="text-xs text-slate-400 hidden sm:inline">{t("adminSys.checkedAt", { time: lastPing })}</span>}
          <button
            type="button"
            onClick={() => {
              runPing(true);
              loadAudit();
            }}
            disabled={pingLoading || loadingAudit}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            {pingLoading ? t("adminSys.checking") : (
              <>
                <Icon icon="lucide:refresh-cw" className="w-3.5 h-3.5 shrink-0" />
                <span>{t("adminSys.reDiagnose")}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* SECTION 1: EXTERNAL SERVICES & INTEGRATION PING */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-200 flex items-center gap-2">
              <span className="flex items-center gap-1.5"><Icon icon="lucide:globe" className="w-4 h-4 shrink-0 text-sky-500" /> {t("adminSys.pingTitle")}</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
              {t("adminSys.pingDesc")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-bold">
              {healthyCount} Online
            </span>
            {issueCount > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 font-bold">
                {issueCount} Terkendala
              </span>
            )}
          </div>
        </div>

        {/* Services Ping Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((s) => {
            const isOnline = s.status === "healthy";
            const iconKey = (s.icon && s.icon.startsWith("lucide:") ? s.icon : null) || SERVICE_ICONS[s.id] || "lucide:activity";
            return (
              <div
                key={s.id}
                className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-[#2563EB] dark:text-[#3B82F6]">
                      <Icon icon={iconKey} className="w-4 h-4 shrink-0" />
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                        isOnline
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                          : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                      }`}
                    >
                      {isOnline ? t("adminSys.online") : s.status.toUpperCase()}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-2">{s.name}</h4>
                  <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{s.message}</p>
                </div>

                <div className="pt-3 mt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400">Latensi API</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-zinc-300">
                    {s.latencyMs} ms
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2 & 3: DRIVE ORPHAN STORAGE & DATABASE INTEGRITY AUDIT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Google Drive Orphan Scanner & Cleaner */}
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-200 flex items-center gap-2">
                <span className="flex items-center gap-2"><Icon icon="lucide:folder" className="w-4 h-4 shrink-0 text-amber-500" /> {t("adminSys.orphanTitle")}</span>
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
              {t("adminSys.orphanDesc")}
            </p>

            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <input
                type="text"
                placeholder={t("adminSys.scanPlaceholder")}
                value={targetUserIdInput}
                onChange={(e) => setTargetUserIdInput(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 flex-1 font-mono placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 min-w-0"
              />
              <button
                type="button"
                onClick={handleScanDrive}
                disabled={scanningDrive || cleaningDrive}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs shadow-[#2563EB]/25 disabled:opacity-50 transition-colors cursor-pointer shrink-0 inline-flex items-center justify-center gap-1.5"
              >
                {scanningDrive ? t("adminSys.scanning") : (
                  <>
                    <span>{t("adminSys.scanFiles")}</span>
                    <Icon icon="lucide:search" className="w-3.5 h-3.5 shrink-0 brightness-0 invert" />
                  </>
                )}
              </button>
            </div>

            {driveError && (
              <div className="mt-3 p-3 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-xs text-rose-600 dark:text-rose-400 break-all">
                {driveError}
              </div>
            )}

            {orphanData && (
              <div className="mt-4 space-y-3">
                {orphanData.targetUserId && (
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono break-all">
                    Target User ID: <span className="text-[#2563EB] dark:text-[#3B82F6] font-bold">{orphanData.targetUserId}</span>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 min-w-0">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">{t("adminSys.totalFiles")}</span>
                    <p className="text-base font-black text-slate-900 dark:text-white mt-0.5 truncate">
                      {orphanData.totalDriveFiles}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 min-w-0">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">{t("adminSys.linked")}</span>
                    <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                      {orphanData.linkedCaptureFiles}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 min-w-0">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">{t("adminSys.orphan")}</span>
                    <p className="text-base font-black text-rose-600 dark:text-rose-400 mt-0.5 truncate">
                      {orphanData.orphanCount}
                    </p>
                  </div>
                </div>

                {orphanData.orphanCount > 0 && (
                  <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-xs">
                    {orphanData.orphans.map((f) => (
                      <div key={f.id} className="py-1.5 flex items-center justify-between gap-2">
                        <span className="truncate max-w-[140px] sm:max-w-[220px] text-slate-700 dark:text-zinc-300 font-mono text-[11px] min-w-0">
                          {f.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">{f.id.slice(0, 12)}...</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {orphanData && orphanData.orphanCount > 0 && (
            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
              <button
                type="button"
                disabled={cleaningDrive}
                onClick={handleCleanDrive}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 transition-colors shadow-sm cursor-pointer inline-flex items-center gap-1.5"
              >
                {cleaningDrive ? t("adminSys.cleaning") : (
                  <>
                    <span>{t("adminSys.cleanOrphans", { count: orphanData.orphanCount })}</span>
                    <Icon icon="lucide:trash-2" className="w-3.5 h-3.5 shrink-0 brightness-0 invert" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Database Schema & Integrity Diagnostic */}
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-200 flex items-center gap-2">
                <span className="flex items-center gap-2"><Icon icon="lucide:database" className="w-4 h-4 shrink-0 text-emerald-500" /> {t("adminSys.auditTitle")}</span>
              </h3>
              <button
                type="button"
                onClick={loadAudit}
                disabled={loadingAudit}
                className="text-xs text-[#2563EB] hover:text-[#1D4ED8] dark:text-[#3B82F6] dark:hover:text-[#60A5FA] hover:underline font-semibold cursor-pointer inline-flex items-center gap-1"
              >
                {loadingAudit ? t("adminSys.auditing") : (
                  <>
                    <span>{t("adminSys.reAudit")}</span>
                    <Icon icon="lucide:refresh-cw" className="w-3 h-3 shrink-0" />
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed mb-4">
              {t("adminSys.auditDesc")}
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 min-w-0">
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">{t("adminSys.driftLabel")}</h4>
                <pre className="text-[11px] font-mono text-slate-600 dark:text-zinc-400 overflow-x-auto">
                  {driftData ? JSON.stringify(driftData, null, 2) : t("adminSys.driftOk")}
                </pre>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 min-w-0">
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">{t("adminSys.integrityLabel")}</h4>
                <pre className="text-[11px] font-mono text-slate-600 dark:text-zinc-400 overflow-x-auto">
                  {integrityData ? JSON.stringify(integrityData, null, 2) : t("adminSys.integrityOk")}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: STORAGE RETENTION POLICY SIMULATOR */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-200 flex items-center gap-2">
              <span className="flex items-center gap-1.5">
                <Icon icon="lucide:calculator" className="w-4 h-4 text-emerald-500 shrink-0" />
                Simulator Kebijakan Retensi Penyimpanan (Retention Policy Simulator)
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
              Simulasi interaktif non-destruktif untuk estimasi penghematan storage Google Drive dan jumlah file terdampak sesuai jangka waktu retensi.
            </p>
          </div>

          {/* Timeframe selector chips */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {RETENTION_OPTIONS.map((opt) => {
              const active = opt.days === retentionDays;
              return (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => setRetentionDays(opt.days)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    active
                      ? "bg-[#2563EB] text-white shadow-xs"
                      : "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 min-w-0">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider">{t("adminSys.reclaimed")}</span>
              <Icon icon="lucide:hard-drive" className="w-4 h-4 text-emerald-500 shrink-0" />
            </div>
            <p className="text-xl font-black text-slate-900 dark:text-white truncate">
              {simulatedReclaimedDisplay}
            </p>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {t("adminSys.reclaimedHint")}
            </span>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 min-w-0">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider">{t("adminSys.affected")}</span>
              <Icon icon="lucide:file-text" className="w-4 h-4 text-sky-500 shrink-0" />
            </div>
            <p className="text-xl font-black text-slate-900 dark:text-white truncate">
              {simulatedAffectedFiles.toLocaleString(locale === "id" ? "id-ID" : "en-US")} {locale === "id" ? "file" : "files"}
            </p>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {t("adminSys.affectedHint", { days: retentionDays, orphans: orphanCount })}
            </span>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 min-w-0">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider">{t("adminSys.reduction")}</span>
              <Icon icon="lucide:trending-down" className="w-4 h-4 text-amber-500 shrink-0" />
            </div>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 truncate">
              ~{simulatedReductionPct}%
            </p>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Pengurangan beban kuota cloud storage
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-[11px] text-slate-600 dark:text-zinc-400">
          <Icon icon="lucide:info" className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="min-w-0">
            Dihitung dari basis {baseDriveFiles.toLocaleString("id-ID")} file {orphanData?.totalDriveFiles ? "(hasil scan Drive langsung)" : "(telemetri sampel aktif)"}. Kebijakan purge memindahkan file ke Trash Google Drive sebelum pembersihan permanen.
          </span>
        </div>
      </div>

      {/* SECTION 4: GOOGLE DRIVE CONNECTION HEALTH */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-200 flex items-center gap-2">
              <span className="flex items-center gap-2"><Icon icon="lucide:link" className="w-4 h-4 shrink-0 text-amber-500" /> {t("adminSys.driveConnTitle")}</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed mt-0.5">
              {t("adminSys.driveConnDesc")}
            </p>
          </div>
          <button
            type="button"
            onClick={checkDriveHealth}
            disabled={checkingDriveHealth}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs shadow-[#2563EB]/25 disabled:opacity-50 transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1.5"
          >
            {checkingDriveHealth ? t("adminSys.checking") : (
              <>
                <span>{t("adminSys.checkNow")}</span>
                <Icon icon="lucide:search" className="w-3.5 h-3.5 shrink-0 brightness-0 invert" />
              </>
            )}
          </button>
        </div>

        {driveHealth && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              {driveHealth.connections.map((c) => {
                const badge =
                  c.status === "connected"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                    : c.status === "reconnect_required"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                      : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400";
                return (
                  <div
                    key={c.userId}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950"
                  >
                    <span className="text-xs text-slate-700 dark:text-zinc-300 truncate break-all min-w-0">{c.email}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md shrink-0 ${badge}`}>
                      {c.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                );
              })}
              {driveHealth.connections.length === 0 && (
                <p className="text-xs text-slate-400 p-2">{t("adminSys.noDriveConn")}</p>
              )}
            </div>

            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                {t("adminSys.atRiskTitle", { count: driveHealth.capturesAtRisk.length })}
              </h4>
              {driveHealth.capturesAtRisk.length === 0 ? (
                <p className="text-xs text-slate-400 p-2">{t("adminSys.atRiskNone")}</p>
              ) : (
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-lg">
                  {driveHealth.capturesAtRisk.map((cap) => (
                    <div key={cap.id} className="p-2 flex items-center justify-between gap-2 text-xs">
                      <span className="truncate min-w-0 text-slate-700 dark:text-zinc-300">{cap.title || t("adminSys.untitled")}</span>
                      <span className="text-[10px] text-slate-400 truncate break-all shrink-0 max-w-[40%]">{cap.ownerEmail}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
