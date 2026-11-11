"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/lib/iconify";
import { useT } from "@/components/I18nProvider";

type CookiePreferences = {
  analytics: boolean;
  marketing: boolean;
};

const DEFAULT_PREFERENCES: CookiePreferences = {
  analytics: true,
  marketing: true,
};

export function CookieConsentBanner() {
  const { t } = useT();
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("bugsnap_cookie_consent");
      const saved = localStorage.getItem("bugsnap_cookie_preferences");
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<CookiePreferences>;
        setPreferences({
          analytics: parsed.analytics === true,
          marketing: parsed.marketing === true,
        });
      }
      if (!consent) setVisible(true);
    } catch {
      // Ignore if localStorage unavailable or malformed
    }
  }, []);

  const saveConsent = (nextPreferences: CookiePreferences) => {
    try {
      localStorage.setItem("bugsnap_cookie_consent", "acknowledged");
      localStorage.setItem("bugsnap_cookie_preferences", JSON.stringify(nextPreferences));
    } catch {
      // Ignore if localStorage unavailable
    }
    setVisible(false);
    setShowPreferences(false);
  };

  if (!visible) return null;

  return (
    <>
      <div
        role="region"
        aria-label={t("cookie.ariaLabel")}
        className="fixed bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto sm:w-[480px] z-50 animate-in fade-in slide-in-from-bottom-3 duration-300"
      >
        <div className="rounded-2xl border border-[#2563EB] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.18)] dark:border-blue-400 dark:bg-zinc-950">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB] dark:bg-blue-950/50 dark:text-blue-300">
              <Icon icon="lucide:cookie" width={24} height={24} className="h-6 w-6" />
            </div>
            <div className="min-w-0 pt-0.5">
              <h2 className="text-xl font-bold leading-tight text-slate-900 dark:text-white">
                {t("cookie.title")}
              </h2>
              <p className="mt-2 text-base leading-relaxed text-slate-500 dark:text-zinc-400">
                {t("cookie.desc")}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setShowPreferences(true)}
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              {t("cookie.manage")}
            </button>
            <button
              type="button"
              onClick={() => saveConsent({ analytics: true, marketing: true })}
              className="min-h-11 rounded-xl bg-[#2563EB] px-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-[#1D4ED8]"
            >
              {t("cookie.accept")}
            </button>
          </div>
        </div>
      </div>

      {showPreferences && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-[2px]">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-preferences-title"
            className="flex max-h-[min(720px,calc(100vh-2rem))] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-zinc-800">
              <h2 id="cookie-preferences-title" className="text-xl font-bold text-slate-900 dark:text-white">
                {t("cookie.preferencesTitle")}
              </h2>
              <button
                type="button"
                onClick={() => setShowPreferences(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-white"
                aria-label={t("cookie.close")}
              >
                <Icon icon="lucide:x" className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto p-5 sm:p-6">
              <div className="rounded-xl border border-slate-200 p-5 dark:border-zinc-800">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">{t("cookie.essentialTitle")}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-zinc-400">{t("cookie.essentialDesc")}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked="true"
                    aria-label={t("cookie.alwaysActive")}
                    disabled
                    className="relative mt-0.5 h-8 w-14 shrink-0 cursor-not-allowed rounded-full bg-slate-300 p-1 opacity-90 dark:bg-zinc-700"
                  >
                    <span className="block h-6 w-6 translate-x-6 rounded-full bg-white shadow-sm" />
                  </button>
                </div>
              </div>

              <PreferenceRow
                title={t("cookie.analyticsTitle")}
                description={t("cookie.analyticsDesc")}
                enabled={preferences.analytics}
                onChange={() => setPreferences((current) => ({ ...current, analytics: !current.analytics }))}
              />
              <PreferenceRow
                title={t("cookie.marketingTitle")}
                description={t("cookie.marketingDesc")}
                enabled={preferences.marketing}
                onChange={() => setPreferences((current) => ({ ...current, marketing: !current.marketing }))}
              />
            </div>

            <div className="border-t border-slate-200 p-5 dark:border-zinc-800 sm:p-6">
              <button
                type="button"
                onClick={() => saveConsent(preferences)}
                className="min-h-12 w-full rounded-xl bg-[#2563EB] px-4 text-base font-bold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-[#1D4ED8]"
              >
                {t("cookie.savePreferences")}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function PreferenceRow({
  title,
  description,
  enabled,
  onChange,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-5 dark:border-zinc-800">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-zinc-400">{description}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={onChange}
          className={`relative mt-0.5 h-8 w-14 shrink-0 rounded-full p-1 transition-colors ${enabled ? "bg-[#2563EB]" : "bg-slate-300 dark:bg-zinc-700"}`}
        >
          <span className={`block h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${enabled ? "translate-x-6" : "translate-x-0"}`} />
        </button>
      </div>
    </div>
  );
}
