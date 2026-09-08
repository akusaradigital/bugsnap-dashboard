"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { getAdminHeaders, getAdminCache, setAdminCache } from "@/lib/admin-cache";

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
  totalDriveFiles: number;
  linkedCaptureFiles: number;
  orphanCount: number;
  orphans: Array<{ id: string; name: string; size?: number; mimeType?: string }>;
}

export default function AdminSystemPage() {
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

  // Schema integrity
  const [integrityData, setIntegrityData] = useState<unknown>(cachedAudit?.integrityData || null);
  const [driftData, setDriftData] = useState<unknown>(cachedAudit?.driftData || null);
  const [loadingAudit, setLoadingAudit] = useState(!cachedAudit);

  useEffect(() => {
    runPing();
    loadAudit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runPing() {
    if (!services.length) setPingLoading(true);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/integrations/ping", { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal melakukan ping integrasi.");

      const newServices = json.services || [];
      setServices(newServices);
      setAdminCache("admin_system_services", newServices);
      setLastPing(new Date().toLocaleTimeString("id-ID"));
    } catch (err: unknown) {
      if (!services.length) showToast((err as Error)?.message || "Gagal memeriksa ping integrasi", "error");
    } finally {
      setPingLoading(false);
    }
  }

  async function loadAudit() {
    if (!integrityData) setLoadingAudit(true);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/data?includeAudit=true", { headers });
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

  async function handleScanDrive() {
    setScanningDrive(true);
    setDriveError(null);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/drive-orphans", { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memindai Google Drive");

      setOrphanData(json);
      showToast(`Pemindaian selesai. Ditemukan ${json.orphanCount} file orphan.`, "info");
    } catch (err: unknown) {
      const msg = (err as Error)?.message || "Gagal memindai Drive";
      setDriveError(msg);
      showToast(msg, "error");
    } finally {
      setScanningDrive(false);
    }
  }

  async function handleCleanDrive() {
    if (!orphanData || orphanData.orphans.length === 0) return;
    const fileIds = orphanData.orphans.map((f) => f.id);
    if (!confirm(`Apakah Anda yakin ingin memindahkan ${fileIds.length} file orphan ke Trash Google Drive?`)) return;

    setCleaningDrive(true);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/drive-orphans", {
        method: "POST",
        headers,
        body: JSON.stringify({ fileIds }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal membersihkan file orphan.");

      showToast(`Berhasil membersihkan ${json.trashed} file dari Drive!`, "success");
      handleScanDrive();
    } catch (err: unknown) {
      showToast((err as Error)?.message || "Gagal membersihkan Drive", "error");
    } finally {
      setCleaningDrive(false);
    }
  }

  const healthyCount = services.filter((s) => s.status === "healthy").length;
  const issueCount = services.filter((s) => s.status === "degraded" || s.status === "down").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>🛠️ Sistem & Integrasi Diagnostics</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Pusat pemantauan konektivitas API eksternal, pembersihan storage orphan Google Drive, dan audit integritas skema database.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastPing && <span className="text-xs text-slate-400 hidden sm:inline">Diperiksa: {lastPing}</span>}
          <button
            type="button"
            onClick={() => {
              runPing();
              loadAudit();
            }}
            disabled={pingLoading || loadingAudit}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-colors shadow-xs cursor-pointer"
          >
            {pingLoading ? "Memeriksa..." : "Diagnosa Ulang ⟳"}
          </button>
        </div>
      </div>

      {/* SECTION 1: EXTERNAL SERVICES & INTEGRATION PING */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-200 flex items-center gap-2">
              <span>🌐 Pemantauan Konektivitas API & Integrasi</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
              Status ketersediaan real-time dan latensi jaringan ke database, cloud storage, email, dan proteksi spam.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-bold">
              {healthyCount} Online
            </span>
            {issueCount > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 font-bold">
                {issueCount} Terkendala
              </span>
            )}
          </div>
        </div>

        {/* Services Ping Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((s) => {
            const isOnline = s.status === "healthy";
            return (
              <div
                key={s.id}
                className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{s.icon}</span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        isOnline
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                          : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                      }`}
                    >
                      {isOnline ? "ONLINE" : s.status.toUpperCase()}
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
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-200 flex items-center gap-2">
                <span>📁 Google Drive Orphan Storage Cleaner</span>
              </h3>
              <button
                type="button"
                onClick={handleScanDrive}
                disabled={scanningDrive || cleaningDrive}
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors cursor-pointer"
              >
                {scanningDrive ? "Memindai..." : "Pindai File 🔍"}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
              Mendeteksi rekaman di Google Drive yang datanya telah terhapus dari database BugSnap namun masih memakan kuota cloud storage.
            </p>

            {driveError && (
              <div className="mt-3 p-3 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-xs text-rose-600 dark:text-rose-400">
                {driveError}
              </div>
            )}

            {orphanData && (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Total File</span>
                    <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                      {orphanData.totalDriveFiles}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Terhubung</span>
                    <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {orphanData.linkedCaptureFiles}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Orphan</span>
                    <p className="text-base font-black text-rose-600 dark:text-rose-400 mt-0.5">
                      {orphanData.orphanCount}
                    </p>
                  </div>
                </div>

                {orphanData.orphanCount > 0 && (
                  <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-xs">
                    {orphanData.orphans.map((f) => (
                      <div key={f.id} className="py-1.5 flex items-center justify-between">
                        <span className="truncate max-w-[200px] text-slate-700 dark:text-zinc-300 font-mono text-[11px]">
                          {f.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{f.id.slice(0, 12)}...</span>
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
                className="px-4 py-2 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
              >
                {cleaningDrive ? "Memindahkan ke Trash..." : `Bersihkan ${orphanData.orphanCount} File Orphan 🗑`}
              </button>
            </div>
          )}
        </div>

        {/* Database Schema & Integrity Diagnostic */}
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-200 flex items-center gap-2">
                <span>🔍 Audit Integritas Database Supabase</span>
              </h3>
              <button
                type="button"
                onClick={loadAudit}
                disabled={loadingAudit}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
              >
                {loadingAudit ? "Memeriksa..." : "Audit Ulang ⟳"}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed mb-4">
              Verifikasi konsistensi relasi kunci asing (foreign key) dan integritas skema database produksi.
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">Schema Drift Check:</h4>
                <pre className="text-[11px] font-mono text-slate-600 dark:text-zinc-400 overflow-x-auto">
                  {driftData ? JSON.stringify(driftData, null, 2) : "Semua tabel dan relasi skema selaras (OK)."}
                </pre>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">Referential Integrity Check:</h4>
                <pre className="text-[11px] font-mono text-slate-600 dark:text-zinc-400 overflow-x-auto">
                  {integrityData ? JSON.stringify(integrityData, null, 2) : "Tidak ada foreign key yatim (OK)."}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
