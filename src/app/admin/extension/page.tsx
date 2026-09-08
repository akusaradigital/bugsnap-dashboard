"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { getAdminHeaders, getAdminCache, setAdminCache } from "@/lib/admin-cache";

interface ExtensionConfig {
  minVersion: string;
  latestVersion: string;
  forceUpdate: boolean;
  updateUrl: string;
  maintenanceMode: boolean;
  announcement: string;
}

interface ExtensionError {
  id: string;
  title: string;
  message: string;
  details: string | null;
  email: string;
  version: string;
  created_at: string;
}

export default function AdminExtensionFleetPage() {
  const { showToast } = useToast();
  const cached = getAdminCache<{ config: ExtensionConfig; errors: ExtensionError[] }>("admin_extension_data");
  const [loading, setLoading] = useState(!cached);
  const [saving, setSaving] = useState(false);

  const [config, setConfig] = useState<ExtensionConfig>(
    cached?.config || {
      minVersion: "1.0.24",
      latestVersion: "1.0.24",
      forceUpdate: false,
      updateUrl: "https://chromewebstore.google.com",
      maintenanceMode: false,
      announcement: "",
    }
  );

  const [errors, setErrors] = useState<ExtensionError[]>(cached?.errors || []);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    if (!cached) setLoading(true);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/extension", { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat konfigurasi extension fleet.");

      const newConfig = json.config || config;
      const newErrors = Array.isArray(json.errors) ? json.errors : [];
      setConfig(newConfig);
      setErrors(newErrors);
      setAdminCache("admin_extension_data", { config: newConfig, errors: newErrors });
    } catch (err: unknown) {
      if (!cached) showToast((err as Error)?.message || "Gagal memuat data extension fleet", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/extension", {
        method: "POST",
        headers,
        body: JSON.stringify(config),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan konfigurasi extension.");

      setAdminCache("admin_extension_data", { config, errors });
      showToast("Konfigurasi extension fleet berhasil disimpan!", "success");
    } catch (err: unknown) {
      showToast((err as Error)?.message || "Gagal menyimpan", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>🧩 Extension Version Fleet & Force Update Control</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
              Fitur 4
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Kendalikan versi ekstensi Chrome, paksa pembaruan (force update), dan pantau crash telemetry.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="self-start sm:self-auto px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-colors"
        >
          {loading ? "Menyegarkan..." : "Segarkan Status ⟳"}
        </button>
      </div>

      {/* Main Grid: Form Control & Error Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form Config */}
        <form onSubmit={handleSave} className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-200">
              Kebijakan Versi & Force Update
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Versi Ekstensi Terbaru (Latest Release)
                </label>
                <input
                  type="text"
                  required
                  value={config.latestVersion}
                  onChange={(e) => setConfig({ ...config, latestVersion: e.target.value })}
                  placeholder="1.0.24"
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 outline-none focus:border-indigo-500 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Nomor rilis versi terbaru di Chrome Web Store.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Versi Minimal Yang Diizinkan (Min Required)
                </label>
                <input
                  type="text"
                  required
                  value={config.minVersion}
                  onChange={(e) => setConfig({ ...config, minVersion: e.target.value })}
                  placeholder="1.0.20"
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 outline-none focus:border-indigo-500 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Pengguna dengan versi di bawah ini akan diwajibkan update.
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Tautan Chrome Web Store (Update Link)
              </label>
              <input
                type="url"
                required
                value={config.updateUrl}
                onChange={(e) => setConfig({ ...config, updateUrl: e.target.value })}
                placeholder="https://chromewebstore.google.com/detail/..."
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            {/* Toggles */}
            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 space-y-3">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.forceUpdate}
                  onChange={(e) => setConfig({ ...config, forceUpdate: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Paksa Pembaruan (Force Update Mode)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Jika aktif, ekstensi yang berada di bawah versi minimal akan memblokir proses capture/rekam dan menampilkan dialog wajib update ke Chrome Web Store.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-rose-200 dark:border-rose-950/60 bg-rose-50/30 dark:bg-rose-950/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.maintenanceMode}
                  onChange={(e) => setConfig({ ...config, maintenanceMode: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block">
                    Mode Darurat Pemeliharaan (Emergency Maintenance)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Aktifkan saat server atau Supabase sedang maintenance darurat agar ekstensi tidak melakukan request upload yang berpotensi error.
                  </span>
                </div>
              </label>
            </div>

            {/* Announcement Box */}
            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Pesan Notifikasi Fleet (Pop-up Announcement)
              </label>
              <textarea
                rows={2}
                value={config.announcement}
                onChange={(e) => setConfig({ ...config, announcement: e.target.value })}
                placeholder="Contoh: Fitur rekaman AI Bug Summary telah diperbarui ke model terbaru!"
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors shadow-sm"
              >
                {saving ? "Menyimpan Konfigurasi..." : "Simpan Kebijakan Fleet ✓"}
              </button>
            </div>
          </div>
        </form>

        {/* Right 1 Col: Recent Fleet Crash Reports */}
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden flex flex-col h-[520px]">
          <div className="p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-200 flex items-center gap-1.5">
              <span>⚠️ Crash & Error Logs</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                {errors.length}
              </span>
            </h3>
            <span className="text-[10px] text-slate-400">Terbaru dari ekstensi</span>
          </div>

          <div className="p-3 overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-zinc-800 space-y-3">
            {errors.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Tidak ada laporan error ekstensi saat ini. Fleet dalam keadaan prima.
              </div>
            ) : (
              errors.map((err) => (
                <div key={err.id} className="pt-3 first:pt-0 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-rose-600 dark:text-rose-400 truncate pr-2">
                      {err.title || "Extension Error"}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      v{err.version}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 dark:text-zinc-300 font-mono bg-slate-50 dark:bg-zinc-950 p-2 rounded border border-slate-200 dark:border-zinc-850 break-words leading-relaxed">
                    {err.message}
                  </p>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                    <span className="truncate">{err.email || "Anonymous"}</span>
                    <span>{new Date(err.created_at).toLocaleTimeString("id-ID")}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
