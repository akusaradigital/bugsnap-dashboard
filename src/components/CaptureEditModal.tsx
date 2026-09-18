"use client";

// The capture edit modal. Split out of captures/page.tsx - it shares nothing
// with the list beyond the Capture type and the two callbacks.
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useT } from "@/components/I18nProvider";
import { useToast } from "@/components/Toast";
import { Dropdown } from "@/components/Dropdown";
import { ShimmerLockBadge } from "@/components/ShimmerLockBadge";
import {
  type Capture,
  EXPIRY_OPTIONS,
  STATUS_OPTIONS,
  TAG_OPTIONS,
  expiryToOption,
} from "@/lib/capture-utils";

interface EditModalProps {
  capture: Capture;
  onClose: () => void;
  onSaved: (updated: Capture) => void;
}

export default function EditModal({ capture, onClose, onSaved }: EditModalProps) {
  const { t } = useT();
  const { showToast } = useToast();
  const [title, setTitle] = useState(capture.title);
  const [description, setDescription] = useState(capture.description || "");
  const [password, setPassword] = useState(capture.password || "");
  const [tag, setTag] = useState(capture.tag || "");
  const [status, setStatus] = useState(capture.status || "open");
  const [expiry, setExpiry] = useState<string>(() =>
    expiryToOption(capture.expires_at, capture.created_at)
  );
  const [burnAfterRead, setBurnAfterRead] = useState(capture.burn_after_read || false);
  const [allowedDomainsText, setAllowedDomainsText] = useState(() => (capture.allowed_domains || []).join(", "));
  const [allowedIpsText, setAllowedIpsText] = useState(() => (capture.allowed_ips || []).join(", "));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);

    const originalExpiry = expiryToOption(capture.expires_at, capture.created_at);
    let expiresAt: string | null = null;
    if (expiry === "never") {
      expiresAt = null;
    } else if (expiry === originalExpiry) {
      expiresAt = capture.expires_at ?? null;
    } else if (expiry === "24h") {
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    } else if (expiry === "7d") {
      expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    const allowed_domains = allowedDomainsText.trim() 
      ? allowedDomainsText.split(",").map(d => d.trim().toLowerCase()).filter(Boolean)
      : null;

    const allowed_ips = allowedIpsText.trim()
      ? allowedIpsText.split(",").map(ip => ip.trim()).filter(Boolean)
      : null;

    const { data, error } = await supabase
      .from("captures")
      .update({
        title: title.trim() || capture.title,
        description: description.trim() || null,
        password: password.trim() || null,
        expires_at: expiresAt,
        tag: tag || null,
        status: status || null,
        burn_after_read: burnAfterRead,
        allowed_domains,
        allowed_ips,
      })
      .eq("id", capture.id)
      // .select() so an RLS-skipped row is visible: PostgREST returns no error
      // for rows it silently declines, and without this the modal closes saying
      // "saved" while every edit is lost on the next refresh.
      .select("id");

    if (!error && (!data || data.length === 0)) {
      setError(t("cap.saveError"));
      showToast(t("cap.saveError"), "error");
      setSaving(false);
      return;
    }

    if (error) {
      console.warn("Error updating capture:", error);
      setError(t("cap.saveError"));
      showToast("Save failed", "error");
      setSaving(false);
      return;
    }
    onSaved({
      ...capture,
      title: title.trim() || capture.title,
      description: description.trim() || null,
      password: password.trim() || null,
      expires_at: expiresAt,
      tag: tag || null,
      status: status || null,
      burn_after_read: burnAfterRead,
      allowed_domains,
      allowed_ips,
    } as Capture);
    showToast("Capture saved", "success");
    onClose();
  }

  const inputClasses =
    "w-full text-sm rounded-lg border border-border px-3 py-2 outline-none focus:border-[#89BD49] focus:ring-1 focus:ring-[#89BD49]/20 bg-subtle text-foreground placeholder:text-muted";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-subtle shadow-xl border border-border flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-base font-bold text-foreground">{t("cap.editTitle")}</h2>
          <button
            onClick={onClose}
            aria-label={t("common.close")}
            className="text-muted hover:text-foreground transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted mb-1.5">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
              {t("cap.titleLabel")}
            </label>
            <input className={inputClasses} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted mb-1.5">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M9 13h6M9 17h6" /></svg>
              {t("cap.descLabel")}
            </label>
            <textarea
              className={`${inputClasses} min-h-[72px] resize-none`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("cap.descPlaceholder")}
            />
          </div>

          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-foreground mb-1">{t("cap.linkSettings")}</h3>
            <p className="text-xs text-muted mb-4">{t("cap.linkSettingsHint")}</p>

            <div className="space-y-4">
              {/* Tag */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted mb-1.5">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17c0 .53.21 1.04.59 1.41l8.83 8.83a2 2 0 0 0 2.83 0l7.17-7.17a2 2 0 0 0 0-2.83Z" /><circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" /></svg>
              {t("cap.tagLabel")}
            </label>
                <Dropdown
                  variant="field"
                  value={tag}
                  onChange={setTag}
                  options={[{ value: "", label: t("cap.noTag") }, ...TAG_OPTIONS.map((t) => ({ value: t, label: t }))]}
                />
              </div>
              {/* Status */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted mb-1.5">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M22 12h-3M5 12H2" /></svg>
              {t("cap.statusLabel")}
            </label>
                <Dropdown
                  variant="field"
                  value={status}
                  onChange={setStatus}
                  options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted mb-1.5">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              {t("cap.passwordLabel")}
            </label>
                <input
                  className={inputClasses}
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("cap.passwordPlaceholder")}
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted mb-1.5">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              {t("cap.expiresLabel")}
            </label>
                <div className="inline-flex rounded-lg border border-border bg-subtle p-1 w-full">
                  {EXPIRY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setExpiry(opt.value)}
                      className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        expiry === opt.value
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      {t(opt.labelKey)}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted mt-1.5">
                  {expiry === "never"
                    ? t("cap.neverExpires")
                    : t("cap.expiresOn", { date: new Date(
                        Date.now() + (expiry === "24h" ? 24 : 168) * 60 * 60 * 1000
                      ).toLocaleDateString() })}
                </p>
              </div>

              {/* Advanced Security */}
              <div className="border-t border-border pt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-foreground">{t("cap.advancedProtection")}</h4>
                  <ShimmerLockBadge label="PRO" />
                </div>

                {/* Burn after reading */}
                <label className="flex items-center gap-2.5 text-xs text-foreground select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={burnAfterRead}
                    onChange={(e) => setBurnAfterRead(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-[#89BD49] focus:ring-[#89BD49]/20"
                  />
                  <div>
                    <p className="font-medium">{t("cap.burnAfterRead")}</p>
                    <p className="text-[10px] text-muted leading-tight mt-0.5">{t("cap.burnHint")}</p>
                  </div>
                </label>

                {/* Domain Whitelist */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-muted">{t("cap.domainWhitelist")}</label>
                  </div>
                  <input
                    type="text"
                    value={allowedDomainsText}
                    onChange={(e) => setAllowedDomainsText(e.target.value)}
                    placeholder={t("cap.domainPlaceholder")}
                    className={inputClasses}
                  />
                  <p className="text-[9px] text-muted leading-tight mt-1">{t("cap.domainHint")}</p>
                </div>

                {/* IP Whitelist */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-muted">{t("cap.ipWhitelist")}</label>
                  </div>
                  <input
                    type="text"
                    value={allowedIpsText}
                    onChange={(e) => setAllowedIpsText(e.target.value)}
                    placeholder={t("cap.ipPlaceholder")}
                    className={inputClasses}
                  />
                  <p className="text-[9px] text-muted leading-tight mt-1">{t("cap.ipHint")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Sticky Footer Actions */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
          {error && <p className="mr-auto text-xs text-red-600 dark:text-red-400">{error}</p>}
          <button
            onClick={onClose}
            className="rounded-lg border border-border bg-subtle px-4 py-2 text-sm font-medium text-foreground hover:bg-subtle transition-colors"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-[#89BD49] px-4 py-2 text-sm font-medium text-white hover:bg-[#6B9A35] disabled:opacity-60 shadow-xs shadow-[#89BD49]/25 transition-colors"
          >
            {saving ? t("settings.saving") : t("cap.saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
}
