"use client";

// The capture edit modal. Split out of captures/page.tsx - it shares nothing
// with the list beyond the Capture type and the two callbacks.
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useT } from "@/components/I18nProvider";
import { useToast } from "@/components/Toast";
import { Dropdown } from "@/components/Dropdown";
import { Icon } from "@/lib/iconify";
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="edit-modal-title" className="relative w-full max-w-md rounded-xl bg-subtle shadow-xl border border-border flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-border shrink-0">
          <h2 id="edit-modal-title" className="text-base font-bold text-foreground">{t("cap.editTitle")}</h2>
          <button
            onClick={onClose}
            aria-label={t("common.close")}
            className="text-muted hover:text-foreground transition-colors"
          >
            <Icon icon="lucide:x" className="w-5 h-5 shrink-0" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          <div className="space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted mb-1.5">
              <Icon icon="lucide:pencil" className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              {t("cap.titleLabel")}
            </label>
            <input className={inputClasses} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted mb-1.5">
              <Icon icon="lucide:file-text" className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
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
              <Icon icon="lucide:tag" className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
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
              <Icon icon="lucide:crosshair" className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
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
              <Icon icon="lucide:lock" className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
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
              <Icon icon="lucide:clock" className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
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
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-end gap-2 px-4 sm:px-6 py-3.5 sm:py-4 border-t border-border shrink-0">
          {error && <p className="mr-auto text-xs text-red-600 dark:text-red-400 w-full sm:w-auto">{error}</p>}
          <button
            onClick={onClose}
            className="flex-1 sm:flex-initial rounded-lg border border-border bg-subtle px-4 py-2 text-sm font-medium text-foreground hover:bg-background transition-colors text-center"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 sm:flex-initial rounded-lg bg-[#89BD49] px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-[#6B9A35] hover:text-white disabled:opacity-60 shadow-xs shadow-[#89BD49]/25 transition-colors text-center"
          >
            {saving ? t("settings.saving") : t("cap.saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
}
