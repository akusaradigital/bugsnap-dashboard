"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { getAdminHeaders, getAdminCache, setAdminCache } from "@/lib/admin-cache";

interface EmailHealthData {
  configured: boolean;
  maskedKey: string;
  fromEmail: string;
  csTargetEmail: string;
  apiReachable: boolean;
  latencyMs: number;
  domains: Array<{
    id: string;
    name: string;
    status: string;
    created_at: string;
  }>;
  error?: string | null;
}

export default function AdminEmailHealthPage() {
  const { showToast } = useToast();
  const cached = getAdminCache<EmailHealthData>("admin_email_health_data");
  const [loading, setLoading] = useState(!cached);
  const [data, setData] = useState<EmailHealthData | null>(cached);

  // Probe tester state
  const [testRecipient, setTestRecipient] = useState(cached?.csTargetEmail || "");
  const [sendingProbe, setSendingProbe] = useState(false);
  const [probeResult, setProbeResult] = useState<{ ok: boolean; message: string; latencyMs?: number } | null>(null);

  // Broadcast state
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);

  useEffect(() => {
    loadHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadHealth() {
    if (!cached) setLoading(true);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/email-health", { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memeriksa kesehatan email.");

      setData(json);
      setAdminCache("admin_email_health_data", json);
      if (!testRecipient && json.csTargetEmail) {
        setTestRecipient(json.csTargetEmail);
      }
    } catch (err: unknown) {
      if (!cached) showToast((err as Error)?.message || "Gagal memeriksa kesehatan email", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendProbe(e: React.FormEvent) {
    e.preventDefault();
    if (!testRecipient.trim()) return;

    setSendingProbe(true);
    setProbeResult(null);

    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/email-health", {
        method: "POST",
        headers,
        body: JSON.stringify({ recipient: testRecipient.trim() }),
      });
      const json = await res.json();

      if (!res.ok) {
        setProbeResult({
          ok: false,
          message: json.error || "Gagal mengirim email pengujian.",
          latencyMs: json.latencyMs,
        });
        showToast(json.error || "Gagal mengirim probe", "error");
      } else {
        setProbeResult({
          ok: true,
          message: `Berhasil dikirim! ID Pesan: ${json.messageId}`,
          latencyMs: json.latencyMs,
        });
        showToast("Email uji coba berhasil dikirim!", "success");
      }
    } catch (err: unknown) {
      const msg = (err as Error)?.message || "Koneksi ke endpoint gagal.";
      setProbeResult({ ok: false, message: msg });
      showToast(msg, "error");
    } finally {
      setSendingProbe(false);
    }
  }

  async function handleBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!broadcastSubject.trim() || !broadcastBody.trim()) return;
    if (!confirm("Kirim email broadcast ke seluruh pengguna terdaftar? Tindakan ini tidak dapat dibatalkan.")) return;

    setBroadcasting(true);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers,
        body: JSON.stringify({
          subject: broadcastSubject.trim(),
          body: broadcastBody.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mengirim broadcast.");

      showToast(`Broadcast berhasil dikirim ke ${json.sentCount} penerima!`, "success");
      setBroadcastSubject("");
      setBroadcastBody("");
    } catch (err: unknown) {
      showToast((err as Error)?.message || "Gagal mengirim broadcast", "error");
    } finally {
      setBroadcasting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>✉️ Email & Broadcast Hub</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Monitoring koneksi Resend API, status verifikasi DKIM/SPF domain, live delivery probe, dan broadcast email massal.
          </p>
        </div>
        <button
          type="button"
          onClick={loadHealth}
          disabled={loading}
          className="self-start sm:self-auto px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
        >
          {loading ? "Menyegarkan..." : "Uji Ulang Endpoint ⟳"}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Resend API Status
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                data?.apiReachable ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {loading ? "..." : data?.apiReachable ? "Online & Terhubung" : "Offline / Unreachable"}
            </p>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Kunci: {data?.maskedKey || "Belum dikonfigurasi"}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            API Ping Latency
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {loading ? "..." : `${data?.latencyMs || 0} ms`}
          </p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 block">
            Direct roundtrip to api.resend.com
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Email Pengirim (Sender)
          </span>
          <p className="text-xs font-bold text-slate-900 dark:text-white mt-1 truncate">
            {loading ? "..." : data?.fromEmail}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block truncate">
            Digunakan untuk kirim balasan CS
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Target Inbox CS
          </span>
          <p className="text-xs font-bold text-slate-900 dark:text-white mt-1 truncate">
            {loading ? "..." : data?.csTargetEmail}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block truncate">
            Penerima notifikasi laporan masuk
          </span>
        </div>
      </div>

      {/* Two columns: Domains Status & Live Test Probe */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resend Verified Domains */}
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-200">
              Domain Terdaftar di Resend ({data?.domains?.length || 0})
            </h3>
            <span className="text-[10px] text-slate-400">DKIM / SPF Verifikasi</span>
          </div>

          <div className="p-4 flex-1">
            {loading ? (
              <p className="text-xs text-slate-400 text-center py-6">Memeriksa domain Resend...</p>
            ) : !data?.domains || data.domains.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 space-y-1">
                <p>Belum ada domain kustom yang terdeteksi atau API key menggunakan fallback.</p>
                <p className="text-[11px] text-slate-400">
                  Email fallback saat ini: <code className="font-mono text-slate-600 dark:text-zinc-400">onboarding@resend.dev</code>
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                {data.domains.map((dom) => (
                  <div key={dom.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white font-mono">{dom.name}</p>
                      <p className="text-[10px] text-slate-400">
                        Ditambahkan: {new Date(dom.created_at).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        dom.status === "verified"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                      }`}
                    >
                      {dom.status === "verified" ? "✓ VERIFIED" : dom.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Email Diagnostic Probe */}
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-200">
              🧪 Live Delivery Probe Tester
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
              Kirimkan satu email diagnosis langsung untuk memverifikasi jalur pengiriman serverless ke kotak masuk penerima.
            </p>
          </div>

          <form onSubmit={handleSendProbe} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Alamat Email Penerima Uji Coba:
              </label>
              <input
                type="email"
                required
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="contact.akusaraproject@gmail.com"
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-400">
                Pesan berisi header diagnostik & timestamp server.
              </span>
              <button
                type="submit"
                disabled={sendingProbe || !testRecipient.trim() || !data?.configured}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors shadow-sm"
              >
                {sendingProbe ? "Mengirim Probe..." : "Kirim Email Diagnostik 🚀"}
              </button>
            </div>
          </form>

          {probeResult && (
            <div
              className={`p-3.5 rounded-lg text-xs border ${
                probeResult.ok
                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900"
                  : "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900"
              }`}
            >
              <div className="flex items-center justify-between font-bold mb-1">
                <span>{probeResult.ok ? "✓ Pengujian Sukses" : "✕ Pengujian Gagal"}</span>
                {probeResult.latencyMs && <span>{probeResult.latencyMs} ms</span>}
              </div>
              <p className="text-[11px] leading-relaxed break-words">{probeResult.message}</p>
            </div>
          )}
        </div>
      </div>

      {/* Broadcast Email Card - Unified in Email Hub */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-200 flex items-center gap-2">
            <span>📢 Broadcast Email Pengguna Platform</span>
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
            Kirimkan pengumuman resmi, rilis fitur baru, atau update maintenance langsung ke seluruh akun terdaftar.
          </p>
        </div>

        <form onSubmit={handleBroadcast} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
              Subjek Email
            </label>
            <input
              type="text"
              required
              value={broadcastSubject}
              onChange={(e) => setBroadcastSubject(e.target.value)}
              placeholder="Contoh: [Pembaruan] Fitur Baru BugSnap & Pemeliharaan Terjadwal"
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
              Isi Pesan Email (Format HTML didukung)
            </label>
            <textarea
              required
              rows={4}
              value={broadcastBody}
              onChange={(e) => setBroadcastBody(e.target.value)}
              placeholder="<p>Halo Pengguna BugSnap,</p><p>Kami memperbarui sistem...</p>"
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 outline-none focus:border-indigo-500 font-mono text-[11px] leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-400">
              Email dikirim via Resend ke seluruh pengguna aktif di database Supabase.
            </span>
            <button
              type="submit"
              disabled={broadcasting || !broadcastSubject.trim() || !broadcastBody.trim()}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
            >
              {broadcasting ? "Mengirimkan Broadcast..." : "Kirim Broadcast Email 🚀"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
