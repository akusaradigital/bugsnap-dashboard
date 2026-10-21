"use client";

import Link from "next/link";
import { useT } from "@/components/I18nProvider";
import { Icon } from "@/lib/iconify";

const CHROME_WEB_STORE_URL = "https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf";

export function AuthRequiredCard({ title }: { title?: string }) {
  const { t } = useT();
  const heading = title || t("auth.requiredDefaultTitle");

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 text-foreground font-sans">
      <div className="w-full max-w-md bg-subtle border border-border rounded-2xl p-6 sm:p-8 text-center shadow-lg space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-day.svg" alt="BugSnap" className="w-9 h-9 object-contain dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-dark.svg" alt="BugSnap" className="w-9 h-9 object-contain hidden dark:block" />
          <span className="text-xl font-bold tracking-tight text-foreground">BugSnap</span>
        </div>

        {/* Lock Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-[#89BD49]/10 dark:bg-[#89BD49]/15 border border-[#89BD49]/30 flex items-center justify-center text-[#6B9A35] dark:text-[#A8D666]">
          <Icon icon="lucide:lock" className="w-8 h-8 shrink-0" aria-hidden="true" />
        </div>

        {/* Heading & Info */}
        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight text-foreground">{heading}</h1>
          <p className="text-xs sm:text-sm text-muted leading-relaxed">
            {t("auth.requiredDesc")}
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#89BD49] hover:bg-[#6B9A35] text-white text-sm font-semibold shadow-sm shadow-[#89BD49]/25 transition-colors"
          >
            <Icon icon="lucide:log-in" className="w-4 h-4 shrink-0" aria-hidden="true" />
            {t("auth.signInBugSnap")}
          </Link>

          <a
            href={CHROME_WEB_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-sm font-semibold transition-colors"
          >
            <Icon icon="logos:chrome" className="w-4 h-4 shrink-0" aria-hidden="true" />
            {t("auth.downloadExtension")}
          </a>
        </div>

        <p className="text-[11px] text-muted pt-2 border-t border-border/60">
          {t("auth.driveNotice")}
        </p>
      </div>
    </div>
  );
}
