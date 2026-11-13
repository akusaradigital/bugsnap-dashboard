"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";
import { Icon, withAssetVersion } from "@/lib/iconify";
import { FIREFOX_STORE_URL } from "@/lib/constants";

interface BrowserProgressContentProps {
  browser: "firefox";
}

const SPEC_KEYS = [
  "storeProgress.specV3",
  "storeProgress.specDrive",
  "storeProgress.specPrivacy",
  "storeProgress.specMulti",
] as const;

export function BrowserProgressContent({}: BrowserProgressContentProps) {
  const { t } = useT();

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-14 space-y-8 sm:space-y-12">
      {/* Top back navigation */}
      <div className="flex items-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-site-text-2 hover:text-site-text transition-colors group"
        >
          
          <span>{t("storeProgress.backHome")}</span>
        </Link>
      </div>

      {/* Hero Header Section */}
      <div className="flex flex-col items-center text-center space-y-4 max-w-2xl mx-auto">
        {/* Browser Icon + Title */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-1">
          <Icon icon="logos:firefox" className="w-12 h-12 sm:w-16 sm:h-16 shrink-0" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-site-text tracking-tight min-w-0 break-words">
            {t("storeProgress.firefoxTitle")}
          </h1>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm md:text-base text-site-text-2 leading-relaxed max-w-xl mx-auto">
          {t("storeProgress.firefoxDesc")}
        </p>

        {/* Status Pill */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
            <Icon
              icon="tabler:check"
              className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
            />
            <span>{t("storeProgress.firefoxStatus")}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-site-surface-2 text-site-text-2 border border-site-border">
            <span>{t("storeProgress.firefoxSubStatus")}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto pt-3">
          <a
            href={FIREFOX_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#89BD49] hover:bg-[#6B9A35] dark:bg-[#89BD49] dark:hover:bg-[#6B9A35] text-white font-semibold text-sm transition-all shadow-xs"
          >
            <Icon icon="logos:firefox" className="w-5 h-5 shrink-0" />
            <span>{t("storeProgress.installFirefox")}</span>
            <Icon icon="tabler:external-link" className="w-4 h-4 shrink-0" />
          </a>
        </div>
      </div>

      {/* Tip Callout Card */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 sm:p-6 flex items-start gap-3 sm:gap-4 shadow-2xs">
        <Icon
          icon="tabler:info-circle"
          className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
        />
        <div className="space-y-1 min-w-0">
          <h2 className="text-sm sm:text-base font-bold text-site-text">
            {t("storeProgress.firefoxTipTitle")}
          </h2>
          <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed break-words">
            {t("storeProgress.firefoxTip")}
          </p>
        </div>
      </div>

      {/* Illustration Card */}
      <div className="w-full rounded-2xl overflow-hidden bg-site-surface border border-site-border p-2 sm:p-4 flex items-center justify-center shadow-xs">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={withAssetVersion("/illustrations/browser-progress.svg")}
          alt="Browser extension progress illustration"
          width={800}
          height={480}
          className="w-full h-auto max-h-[380px] object-contain rounded-xl"
          loading="eager"
        />
      </div>

      {/* Feature / Spec Parity List */}
      <div className="rounded-2xl border border-site-border bg-site-surface p-4 sm:p-8 space-y-5 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#89BD49]/10 text-[#5B8C2A] dark:text-[#A8D666] flex items-center justify-center shrink-0">
            <Icon icon="tabler:shield-check" className="w-5 h-5" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-site-text min-w-0 truncate">
            {t("storeProgress.specTitle")}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {SPEC_KEYS.map((key) => (
            <div
              key={key}
              className="flex items-start gap-3 p-3.5 sm:p-4 rounded-xl bg-site-surface-2 border border-site-border min-w-0"
            >
              <div className="w-5 h-5 rounded-full bg-[#89BD49] dark:bg-[#89BD49] text-white dark:text-slate-900 flex items-center justify-center shrink-0 mt-0.5">
                <Icon icon="tabler:check" className="w-3 h-3 stroke-[3] brightness-0 invert" />
              </div>
              <p className="text-xs sm:text-sm text-site-text leading-snug break-words flex-1 min-w-0">
                {t(key)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
