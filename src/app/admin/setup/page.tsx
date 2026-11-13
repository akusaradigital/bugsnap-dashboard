"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useToast } from "@/components/Toast";
import { useT } from "@/components/I18nProvider";
import { Icon } from "@/lib/iconify";
import { getAdminHeaders } from "@/lib/admin-cache";
import { Dropdown } from "@/components/Dropdown";
import type { SiteConfig } from "@/app/api/admin/setup/route";

interface ServiceCheck {
  id: string;
  name: string;
  category: string;
  isConfigured: boolean;
  status: "configured" | "missing" | "optional";
  description: string;
  requiredVars: string[];
}

interface CallbackUrls {
  googleOAuthRedirect: string;
  googleJsOrigin: string;
  paddleWebhook: string;
  stripeWebhook: string;
  mcpPublicApi: string;
  extensionConfigApi: string;
}

interface SetupData {
  config: SiteConfig;
  services: ServiceCheck[];
  readiness: {
    configured: number;
    total: number;
    percentage: number;
    isProductionReady: boolean;
  };
  callbackUrls: CallbackUrls;
}

type SetupTab = "checklist" | "settings" | "callbacks" | "env";

export default function AdminSetupPage() {
  const { showToast } = useToast();
  const { t } = useT();
  const [, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<SetupTab>("checklist");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<SetupData | null>(null);
  const [formConfig, setFormConfig] = useState<SiteConfig | null>(null);

  // Diagnostic Action States
  const [testingDb, setTestingDb] = useState(false);
  const [testingAi, setTestingAi] = useState(false);
  const [diagResult, setDiagResult] = useState<{ message: string; ok: boolean } | null>(null);

  // Copy Feedback State
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadSetupData = useCallback(async () => {
    setLoading(true);
    setDiagResult(null);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/setup", { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("adminSetup.errLoad"));

      startTransition(() => {
        setData(json);
        setFormConfig(json.config);
      });
    } catch (err: unknown) {
      showToast((err as Error)?.message || t("adminSetup.errLoadToast"), "error");
    } finally {
      setLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    loadSetupData();
  }, [loadSetupData]);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!formConfig) return;

    setSaving(true);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/setup", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formConfig),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("adminSetup.errSave"));

      showToast(t("adminSetup.savedToast"), "success");
      setFormConfig(json.config);
      if (data) {
        setData({ ...data, config: json.config });
      }
    } catch (err: unknown) {
      showToast((err as Error)?.message || t("adminSetup.errSaveToast"), "error");
    } finally {
      setSaving(false);
    }
  }

  async function runDiagnostic(action: "test_db" | "test_ai") {
    if (action === "test_db") setTestingDb(true);
    if (action === "test_ai") setTestingAi(true);
    setDiagResult(null);

    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/setup", {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || t("adminSetup.errDiag"));
      }

      setDiagResult({
        message: `${json.message} (${json.latencyMs}ms)`,
        ok: true,
      });
      showToast(json.message, "success");
    } catch (err: unknown) {
      const errMsg = (err as Error)?.message || t("adminSetup.diagFailed");
      setDiagResult({ message: errMsg, ok: false });
      showToast(errMsg, "error");
    } finally {
      if (action === "test_db") setTestingDb(false);
      if (action === "test_ai") setTestingAi(false);
    }
  }

  async function copyToClipboard(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      showToast(t("adminSetup.copiedToast"), "success");
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      showToast(t("adminSetup.copyFailedToast"), "error");
    }
  }

  const ENV_TEMPLATE = `# Core Database & Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
SUPABASE_PAT=sbp_...

# Google Drive & OAuth Integration (Required for Zero Server Storage)
GOOGLE_DRIVE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_DRIVE_CLIENT_SECRET=GOCSPX-...
GOOGLE_DRIVE_REDIRECT_URI=https://${formConfig?.siteDomain || "your-domain.com"}/api/google-drive/callback

# Super Admin Access (Required - Google-account whitelist, comma-separated)
SUPER_ADMIN_EMAILS=owner@yourdomain.com

# Transactional Email via Resend (Optional)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL="BugSnap Support <support@${formConfig?.siteDomain || "your-domain.com"}>"
CS_EMAIL=support@${formConfig?.siteDomain || "your-domain.com"}

# AI Diagnostics & Polish (Optional - can also be configured dynamically)
AI_POLISH_API_KEY=sk-or-v1-...

# Paddle Billing & Monetization (Optional)
NEXT_PUBLIC_PADDLE_ENV=production
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=live_...
PADDLE_WEBHOOK_SECRET_KEY=pdl_ntfset_...

# Security & Bot Protection (Optional)
NEXT_PUBLIC_TURNSTILE_SITEKEY=0x4AAAAAA...
CLOUDFLARE_TURNSTILE_SECRET_KEY=0x4AAAAAA...

# Maintenance Background Cron (Optional)
CRON_SECRET=your-random-cron-secret-token`;

  return (
    <div className="space-y-6 max-w-6xl mx-auto min-w-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-site-border-subtle">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-accent/10 text-accent border border-accent/20">
              <Icon icon="lucide:sliders" className="w-5 h-5 shrink-0" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-site-text truncate">
              {t("admin.setup.title")}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-site-text-2">
            {t("admin.setup.subtitle")}
          </p>
        </div>

        {/* Readiness Pill & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {data && (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              data.readiness.isProductionReady
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
            }`}>
              <span className={`w-2 h-2 rounded-full ${data.readiness.isProductionReady ? "bg-emerald-500" : "bg-amber-500"}`} />
              <span>{data.readiness.configured}/{data.readiness.total} Services ({data.readiness.percentage}%)</span>
            </div>
          )}

          <button
            type="button"
            onClick={loadSetupData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-site-border bg-site-surface hover:bg-site-surface-2 transition-colors text-site-text"
          >
            <Icon icon="lucide:refresh-cw" className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{t("adminSetup.refresh")}</span>
          </button>
        </div>
      </div>

      {/* Diagnostic Alert Result (if run) */}
      {diagResult && (
        <div className={`p-4 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-3 ${
          diagResult.ok
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
            : "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300"
        }`}>
          <div className="flex items-center gap-2">
            <Icon icon={diagResult.ok ? "lucide:check-circle" : "lucide:alert-circle"} className="w-4 h-4 shrink-0" />
            <span>{diagResult.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setDiagResult(null)}
            className="opacity-70 hover:opacity-100 text-xs underline"
          >
            {t("adminSetup.dismiss")}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-site-border-subtle overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("checklist")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "checklist"
              ? "border-accent text-accent"
              : "border-transparent text-site-text-2 hover:text-site-text"
          }`}
        >
          <Icon icon="lucide:check-circle-2" className="w-4 h-4" />
          <span>{t("admin.setup.tabChecklist")}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "settings"
              ? "border-accent text-accent"
              : "border-transparent text-site-text-2 hover:text-site-text"
          }`}
        >
          <Icon icon="lucide:globe" className="w-4 h-4" />
          <span>{t("admin.setup.tabCustomizer")}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("callbacks")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "callbacks"
              ? "border-accent text-accent"
              : "border-transparent text-site-text-2 hover:text-site-text"
          }`}
        >
          <Icon icon="lucide:link-2" className="w-4 h-4" />
          <span>{t("admin.setup.tabCallbacks")}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("env")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "env"
              ? "border-accent text-accent"
              : "border-transparent text-site-text-2 hover:text-site-text"
          }`}
        >
          <Icon icon="lucide:file-code" className="w-4 h-4" />
          <span>{t("admin.setup.tabEnv")}</span>
        </button>
      </div>

      {/* TAB 1: INFRASTRUCTURE CHECKLIST */}
      {activeTab === "checklist" && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-site-surface border border-site-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-site-text">{t("adminSetup.infraTitle")}</h3>
              <p className="text-xs text-site-text-2 mt-0.5">
                {t("adminSetup.infraDesc")}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => runDiagnostic("test_db")}
                disabled={testingDb}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-site-surface-2 border border-site-border hover:bg-site-surface text-site-text transition-colors shadow-xs"
              >
                <Icon icon="lucide:database" className={`w-3.5 h-3.5 ${testingDb ? "animate-spin" : ""}`} />
                <span>{t("adminSetup.testDb")}</span>
              </button>
              <button
                type="button"
                onClick={() => runDiagnostic("test_ai")}
                disabled={testingAi}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-site-surface-2 border border-site-border hover:bg-site-surface text-site-text transition-colors shadow-xs"
              >
                <Icon icon="lucide:bot" className={`w-3.5 h-3.5 ${testingAi ? "animate-spin" : ""}`} />
                <span>{t("adminSetup.testAi")}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.services.map((svc) => (
              <div
                key={svc.id}
                className="p-4 sm:p-5 rounded-2xl bg-site-surface border border-site-border flex flex-col justify-between gap-3 shadow-2xs hover:border-site-border-subtle transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-site-text-2">
                      {svc.category}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        svc.isConfigured
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : svc.status === "optional"
                          ? "bg-site-surface-2 text-site-text-2 border border-site-border-subtle"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      <Icon
                        icon={
                          svc.isConfigured
                            ? "lucide:check"
                            : svc.status === "optional"
                            ? "lucide:minus"
                            : "lucide:alert-circle"
                        }
                        className="w-3 h-3"
                      />
                      <span>
                        {svc.isConfigured
                          ? t("adminSetup.statusConfigured")
                          : svc.status === "optional"
                          ? t("adminSetup.statusOptional")
                          : t("adminSetup.statusMissing")}
                      </span>
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-site-text">{svc.name}</h4>
                  <p className="text-xs text-site-text-2 leading-relaxed">{svc.description}</p>
                </div>

                <div className="pt-2 border-t border-site-border-subtle space-y-1">
                  <span className="text-[10px] font-medium text-site-text-2 uppercase">Key Variables:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {svc.requiredVars.map((v) => (
                      <code
                        key={v}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-site-surface-2 text-site-text font-mono border border-site-border-subtle"
                      >
                        {v}
                      </code>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: WEBSITE CUSTOMIZER & TOGGLES */}
      {activeTab === "settings" && formConfig && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="p-4 sm:p-6 rounded-2xl bg-site-surface border border-site-border space-y-6 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-site-text">Platform Brand &amp; Domain</h3>
              <p className="text-xs text-site-text-2">
                {t("adminSetup.identityDesc")}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-site-text">Platform Name</label>
                <input
                  type="text"
                  value={formConfig.siteName}
                  onChange={(e) => setFormConfig({ ...formConfig, siteName: e.target.value })}
                  placeholder={t("adminSetup.phName")}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-site-border bg-site-surface-2 text-site-text focus:outline-hidden focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-site-text">Primary Domain</label>
                <input
                  type="text"
                  value={formConfig.siteDomain}
                  onChange={(e) => setFormConfig({ ...formConfig, siteDomain: e.target.value })}
                  placeholder={t("adminSetup.phDomain")}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-site-border bg-site-surface-2 text-site-text focus:outline-hidden focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-site-text">Support / Contact Email</label>
                <input
                  type="email"
                  value={formConfig.supportEmail}
                  onChange={(e) => setFormConfig({ ...formConfig, supportEmail: e.target.value })}
                  placeholder={t("adminSetup.phEmail")}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-site-border bg-site-surface-2 text-site-text focus:outline-hidden focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-site-text">Chrome Extension Store URL</label>
                <input
                  type="url"
                  value={formConfig.chromeExtensionUrl}
                  onChange={(e) => setFormConfig({ ...formConfig, chromeExtensionUrl: e.target.value })}
                  placeholder="https://chromewebstore.google.com/detail/..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-site-border bg-site-surface-2 text-site-text focus:outline-hidden focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-site-border-subtle space-y-4">
              <div>
                <h3 className="text-base font-bold text-site-text">Feature Toggles &amp; Access Controls</h3>
                <p className="text-xs text-site-text-2">
                  {t("adminSetup.accessDesc")}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-start gap-3 p-3.5 rounded-xl bg-site-surface-2 border border-site-border cursor-pointer hover:border-site-border-subtle transition-colors">
                  <input
                    type="checkbox"
                    checked={formConfig.allowPublicSignups}
                    onChange={(e) => setFormConfig({ ...formConfig, allowPublicSignups: e.target.checked })}
                    className="mt-0.5 rounded border-site-border text-accent focus:ring-accent"
                  />
                  <div className="space-y-0.5">
                    <span className="font-semibold text-xs text-site-text block">Allow Public User Signups</span>
                    <span className="text-[11px] text-site-text-2 block">
                      {t("adminSetup.signupsDesc")}
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-xl bg-site-surface-2 border border-site-border cursor-pointer hover:border-site-border-subtle transition-colors">
                  <input
                    type="checkbox"
                    checked={formConfig.requireGoogleDrive}
                    onChange={(e) => setFormConfig({ ...formConfig, requireGoogleDrive: e.target.checked })}
                    className="mt-0.5 rounded border-site-border text-accent focus:ring-accent"
                  />
                  <div className="space-y-0.5">
                    <span className="font-semibold text-xs text-site-text block">Zero Server Storage (Google Drive)</span>
                    <span className="text-[11px] text-site-text-2 block">
                      {t("adminSetup.driveReqDesc")}
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-xl bg-site-surface-2 border border-site-border cursor-pointer hover:border-site-border-subtle transition-colors">
                  <input
                    type="checkbox"
                    checked={formConfig.publicCapturesEnabled}
                    onChange={(e) => setFormConfig({ ...formConfig, publicCapturesEnabled: e.target.checked })}
                    className="mt-0.5 rounded border-site-border text-accent focus:ring-accent"
                  />
                  <div className="space-y-0.5">
                    <span className="font-semibold text-xs text-site-text block">Enable Public Share Links</span>
                    <span className="text-[11px] text-site-text-2 block">
                      {t("adminSetup.shareDesc")}
                    </span>
                  </div>
                </label>

                <div className="p-3.5 rounded-xl bg-site-surface-2 border border-site-border space-y-1.5">
                  <label className="font-semibold text-xs text-site-text block">Default Retention Window</label>
                  <Dropdown
                    value={String(formConfig.defaultRetentionDays)}
                    onChange={(val) => setFormConfig({ ...formConfig, defaultRetentionDays: Number(val) })}
                    options={[
                      { value: "0", label: t("adminSetup.retUnlimited") },
                      { value: "30", label: "30 Days Storage Window" },
                      { value: "60", label: "60 Days Storage Window" },
                      { value: "90", label: "90 Days Storage Window" },
                      { value: "180", label: "180 Days Storage Window" },
                    ]}
                    variant="field"
                  />
                  <span className="text-[10px] text-site-text-2 block">
                    Zero Server Storage means Google Drive files remain in the user&apos;s own account.
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-site-border-subtle space-y-4">
              <div>
                <h3 className="text-base font-bold text-site-text">Emergency &amp; Maintenance Mode</h3>
                <p className="text-xs text-site-text-2">
                  {t("adminSetup.maintDesc")}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-site-surface-2 border border-site-border space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formConfig.maintenanceMode}
                    onChange={(e) => setFormConfig({ ...formConfig, maintenanceMode: e.target.checked })}
                    className="rounded border-site-border text-accent focus:ring-accent"
                  />
                  <span className="font-semibold text-xs text-site-text">
                    {t("adminSetup.maintEnable")}
                  </span>
                </label>

                {formConfig.maintenanceMode && (
                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs text-site-text-2">Maintenance Notice Message</label>
                    <input
                      type="text"
                      value={formConfig.maintenanceMessage}
                      onChange={(e) => setFormConfig({ ...formConfig, maintenanceMessage: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-site-border bg-site-surface text-site-text focus:outline-hidden focus:ring-1 focus:ring-accent"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-accent text-accent-contrast hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
              >
                <Icon icon={saving ? "lucide:loader-2" : "lucide:save"} className={`w-4 h-4 ${saving ? "animate-spin" : ""}`} />
                <span>{saving ? t("adminSetup.saving") : t("adminSetup.saveSettings")}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: OAUTH & WEBHOOK CALLBACKS */}
      {activeTab === "callbacks" && data && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-site-surface border border-site-border">
            <h3 className="text-sm font-bold text-site-text">Authorized Callback &amp; Webhook URLs</h3>
            <p className="text-xs text-site-text-2 mt-0.5">
              {t("adminSetup.callbacksDesc")}
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                title: t("adminSetup.cbGoogleRedirectTitle"),
                desc: t("adminSetup.cbGoogleRedirectDesc"),
                url: data.callbackUrls.googleOAuthRedirect,
                key: "google_redirect",
              },
              {
                title: t("adminSetup.cbGoogleOriginTitle"),
                desc: t("adminSetup.cbGoogleOriginDesc"),
                url: data.callbackUrls.googleJsOrigin,
                key: "google_origin",
              },
              {
                title: t("adminSetup.cbPaddleTitle"),
                desc: t("adminSetup.cbPaddleDesc"),
                url: data.callbackUrls.paddleWebhook,
                key: "paddle_webhook",
              },
              {
                title: t("adminSetup.cbStripeTitle"),
                desc: t("adminSetup.cbStripeDesc"),
                url: data.callbackUrls.stripeWebhook,
                key: "stripe_webhook",
              },
              {
                title: t("adminSetup.cbMcpTitle"),
                desc: t("adminSetup.cbMcpDesc"),
                url: data.callbackUrls.mcpPublicApi,
                key: "mcp_api",
              },
            ].map((item) => (
              <div
                key={item.key}
                className="p-4 rounded-xl bg-site-surface border border-site-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <h4 className="font-semibold text-xs text-site-text">{item.title}</h4>
                  <p className="text-[11px] text-site-text-2">{item.desc}</p>
                  <code className="text-xs font-mono text-accent block pt-1 select-all break-all">
                    {item.url}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(item.url, item.key)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-site-border bg-site-surface-2 hover:bg-site-surface text-xs font-semibold text-site-text transition-colors shrink-0 self-start sm:self-auto"
                >
                  <Icon
                    icon={copiedKey === item.key ? "lucide:check" : "lucide:copy"}
                    className={`w-3.5 h-3.5 ${copiedKey === item.key ? "text-emerald-500" : ""}`}
                  />
                  <span>{copiedKey === item.key ? t("adminSetup.copied") : t("adminSetup.copyUrl")}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: .ENV.LOCAL GENERATOR */}
      {activeTab === "env" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-site-surface border border-site-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-site-text">{t("adminSetup.envTitle")}</h3>
              <p className="text-xs text-site-text-2 mt-0.5">
                {t("adminSetup.envDescLead")} <code className="font-mono">.env.local</code>.
              </p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(ENV_TEMPLATE, "env_template")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-accent-contrast text-xs font-bold hover:opacity-90 transition-opacity shrink-0"
            >
              <Icon
                icon={copiedKey === "env_template" ? "lucide:check" : "lucide:copy"}
                className="w-4 h-4"
              />
              <span>{copiedKey === "env_template" ? t("adminSetup.copiedTemplate") : t("adminSetup.copyEnv")}</span>
            </button>
          </div>

          <div className="relative rounded-2xl bg-site-surface-2 border border-site-border p-4 font-mono text-xs overflow-x-auto shadow-inner text-site-text max-h-[500px]">
            <pre className="whitespace-pre">{ENV_TEMPLATE}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
