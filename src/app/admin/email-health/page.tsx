"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { useT } from "@/components/I18nProvider";
import { useConfirm } from "@/components/ConfirmDialog";
import { getAdminHeaders, getAdminCache, setAdminCache } from "@/lib/admin-cache";
import { Icon } from "@/lib/iconify";

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
  const { t, locale } = useT();
  const confirm = useConfirm();
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
      if (!res.ok) throw new Error(json.error || t("adminEmail.errCheck"));

      setData(json);
      setAdminCache("admin_email_health_data", json);
      if (!testRecipient && json.csTargetEmail) {
        setTestRecipient(json.csTargetEmail);
      }
    } catch (err: unknown) {
      if (!cached) showToast((err as Error)?.message || t("adminEmail.errCheck"), "error");
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
          message: json.error || t("adminEmail.errProbe"),
          latencyMs: json.latencyMs,
        });
        showToast(json.error || t("adminEmail.errProbeToast"), "error");
      } else {
        setProbeResult({
          ok: true,
          message: t("adminEmail.probeOk", { id: json.messageId }),
          latencyMs: json.latencyMs,
        });
        showToast(t("adminEmail.probeSentToast"), "success");
      }
    } catch (err: unknown) {
      const msg = (err as Error)?.message || t("adminEmail.errEndpoint");
      setProbeResult({ ok: false, message: msg });
      showToast(msg, "error");
    } finally {
      setSendingProbe(false);
    }
  }

  async function handleBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!broadcastSubject.trim() || !broadcastBody.trim()) return;
    const ok = await confirm({
      title: t("admin.broadcastConfirmTitle"),
      message: t("admin.broadcastConfirmBody"),
      confirmLabel: t("admin.broadcastSend"),
      danger: true,
    });
    if (!ok) return;

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
      if (!res.ok) throw new Error(json.error || t("adminEmail.errBroadcast"));

      showToast(t("adminEmail.broadcastSentToast", { count: json.sentCount }), "success");
      setBroadcastSubject("");
      setBroadcastBody("");
    } catch (err: unknown) {
      showToast((err as Error)?.message || t("adminEmail.errBroadcastToast"), "error");
    } finally {
      setBroadcasting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span className="flex items-center gap-2"><Icon icon="lucide:mail" className="w-4 h-4 shrink-0 text-violet-500" /> {t("adminEmail.title")}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            {t("adminEmail.desc")}
          </p>
        </div>
        <button
          type="button"
          onClick={loadHealth}
          disabled={loading}
          className="self-start sm:self-auto px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer inline-flex items-center gap-1.5"
        >
          {loading ? t("adminEmail.refreshing") : (
            <>
              <Icon icon="lucide:refresh-cw" className="w-3.5 h-3.5 shrink-0" />
              <span>{t("adminEmail.retestEndpoint")}</span>
            </>
          )}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            {t("adminEmail.apiStatus")}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                data?.apiReachable ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {loading ? "..." : data?.apiReachable ? t("adminEmail.online") : t("adminEmail.offline")}
            </p>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {t("adminEmail.keyLabel", { key: data?.maskedKey || t("adminEmail.notConfigured") })}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            {t("adminEmail.pingLatency")}
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {loading ? "..." : `${data?.latencyMs || 0} ms`}
          </p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 block">
            {t("adminEmail.roundtrip")}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            {t("adminEmail.sender")}
          </span>
          <p className="text-xs font-bold text-slate-900 dark:text-white mt-1 truncate">
            {loading ? "..." : data?.fromEmail}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block truncate">
            {t("adminEmail.senderHint")}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            {t("adminEmail.csInbox")}
          </span>
          <p className="text-xs font-bold text-slate-900 dark:text-white mt-1 truncate">
            {loading ? "..." : data?.csTargetEmail}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block truncate">
            {t("adminEmail.csInboxHint")}
          </span>
        </div>
      </div>

      {/* Two columns: Domains Status & Live Test Probe */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resend Verified Domains */}
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-200">
              {t("adminEmail.domainsRegistered", { count: data?.domains?.length || 0 })}
            </h3>
            <span className="text-[10px] text-slate-400">{t("adminEmail.dkimSpf")}</span>
          </div>

          <div className="p-4 flex-1">
            {loading ? (
              <p className="text-xs text-slate-400 text-center py-6">{t("adminEmail.checkingDomains")}</p>
            ) : !data?.domains || data.domains.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 space-y-1">
                <p>{t("adminEmail.noDomains")}</p>
                <p className="text-[11px] text-slate-400">
                  {t("adminEmail.fallbackNow")} <code className="font-mono text-slate-600 dark:text-zinc-400">onboarding@resend.dev</code>
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                {data.domains.map((dom) => (
                  <div key={dom.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white font-mono">{dom.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {t("adminEmail.addedOn", { date: new Date(dom.created_at).toLocaleDateString(locale === "id" ? "id-ID" : "en-US") })}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        dom.status === "verified"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                      }`}
                    >
                      {dom.status === "verified" ? (
                        <>
                          <Icon icon="lucide:check" className="w-3 h-3 shrink-0" />
                          <span>VERIFIED</span>
                        </>
                      ) : (
                        dom.status.toUpperCase()
                      )}
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
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-200 flex items-center gap-2">
              <span className="flex items-center gap-1.5"><Icon icon="lucide:flask-conical" className="w-3.5 h-3.5 shrink-0 text-violet-500" /> {t("adminEmail.probeTitle")}</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
              {t("adminEmail.probeDesc")}
            </p>
          </div>

          <form onSubmit={handleSendProbe} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                {t("adminEmail.probeRecipient")}
              </label>
              <input
                type="email"
                required
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="contact.akusaraproject@gmail.com"
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-400">
                {t("adminEmail.probeFooter")}
              </span>
              <button
                type="submit"
                disabled={sendingProbe || !testRecipient.trim() || !data?.configured}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs shadow-[#2563EB]/25 disabled:opacity-50 transition-colors"
              >
                {sendingProbe ? (
                  t("adminEmail.sendingProbe")
                ) : (
                  <>
                    <span>{t("adminEmail.sendProbe")}</span>
                    <Icon icon="lucide:send" className="w-3.5 h-3.5 shrink-0 brightness-0 invert" />
                  </>
                )}
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
                <span className="inline-flex items-center gap-1.5">
                  <Icon
                    icon={probeResult.ok ? "lucide:check-circle" : "lucide:x-circle"}
                    className="w-3.5 h-3.5 shrink-0"
                  />
                  <span>{probeResult.ok ? t("adminEmail.probeSuccess") : t("adminEmail.probeFailed")}</span>
                </span>
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
            <span className="flex items-center gap-1.5"><Icon icon="lucide:megaphone" className="w-3.5 h-3.5 shrink-0 text-amber-500" /> {t("adminEmail.broadcastTitle")}</span>
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
            {t("adminEmail.broadcastDesc")}
          </p>
        </div>

        <form onSubmit={handleBroadcast} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
              {t("adminEmail.subject")}
            </label>
            <input
              type="text"
              required
              value={broadcastSubject}
              onChange={(e) => setBroadcastSubject(e.target.value)}
              placeholder={t("adminEmail.subjectPlaceholder")}
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
              {t("adminEmail.body")}
            </label>
            <textarea
              required
              rows={4}
              value={broadcastBody}
              onChange={(e) => setBroadcastBody(e.target.value)}
              placeholder={t("adminEmail.bodyPlaceholder")}
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 font-mono text-[11px] leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-400">
              {t("adminEmail.broadcastFooter")}
            </span>
            <button
              type="submit"
              disabled={broadcasting || !broadcastSubject.trim() || !broadcastBody.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs shadow-[#2563EB]/25 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {broadcasting ? (
                t("adminEmail.sendingBroadcast")
              ) : (
                <>
                  <span>{t("adminEmail.sendBroadcast")}</span>
                  <Icon icon="lucide:send" className="w-3.5 h-3.5 shrink-0 brightness-0 invert" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
