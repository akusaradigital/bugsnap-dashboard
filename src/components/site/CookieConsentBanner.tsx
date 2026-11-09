"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/lib/iconify";
import { useT } from "@/components/I18nProvider";

export function CookieConsentBanner() {
  const { t } = useT();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("bugsnap_cookie_consent");
      if (!consent) {
        setVisible(true);
      }
    } catch {
      // Ignore if localStorage unavailable
    }
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem("bugsnap_cookie_consent", "acknowledged");
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Privacy and Cookie Notice"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-3 duration-300"
    >
      <div className="rounded-2xl border border-site-border bg-site-surface p-4 shadow-xl text-xs space-y-3">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-red-600/15 text-red-700 dark:text-red-300 flex items-center justify-center shrink-0 mt-0.5">
            <Icon icon="lucide:shield-check" className="w-4 h-4" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <h4 className="font-bold text-site-text text-[11px] uppercase tracking-wider">
              {t("cookie.title")}
            </h4>
            <p className="text-site-text-2 text-[11px] leading-relaxed">
              {t("cookie.desc")}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-site-border-subtle">
          <Link
            href="/privacy"
            className="text-[11px] text-site-text-2 hover:text-site-text hover:underline px-2 py-1"
          >
            {t("cookie.privacy")}
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3 py-1.5 rounded-lg bg-[#89BD49] hover:bg-[#6B9A35] text-white font-bold text-[11px] transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            {t("cookie.gotIt")}
          </button>
        </div>
      </div>
    </div>
  );
}
