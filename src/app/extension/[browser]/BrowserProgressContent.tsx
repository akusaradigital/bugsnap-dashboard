"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";
import { Icon } from "@/lib/iconify";
import { CHROME_STORE_URL } from "@/lib/constants";

interface BrowserProgressContentProps {
  browser: "firefox" | "edge";
}

interface BrowserConfig {
  id: "firefox" | "edge";
  name: string;
  icon: string;
  titleKey: string;
  descKey: string;
  statusKey: string;
  subStatusKey: string;
  isUnderReview: boolean;
}

const BROWSER_CONFIGS: Record<"firefox" | "edge", BrowserConfig> = {
  firefox: {
    id: "firefox",
    name: "Mozilla Firefox",
    icon: "logos:firefox",
    titleKey: "storeProgress.firefoxTitle",
    descKey: "storeProgress.firefoxDesc",
    statusKey: "storeProgress.firefoxStatus",
    subStatusKey: "storeProgress.firefoxPlatforms",
    isUnderReview: true,
  },
  edge: {
    id: "edge",
    name: "Microsoft Edge",
    icon: "logos:microsoft-edge",
    titleKey: "storeProgress.edgeTitle",
    descKey: "storeProgress.edgeDesc",
    statusKey: "storeProgress.edgeStatus",
    subStatusKey: "storeProgress.edgeSubStatus",
    isUnderReview: false,
  },
};

const SPEC_KEYS = [
  "storeProgress.specV3",
  "storeProgress.specDrive",
  "storeProgress.specPrivacy",
  "storeProgress.specMulti",
] as const;

export function BrowserProgressContent({ browser }: BrowserProgressContentProps) {
  const { t } = useT();
  const config = BROWSER_CONFIGS[browser] || BROWSER_CONFIGS.firefox;
  const isEdge = browser === "edge";

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-14 space-y-8 sm:space-y-12">
      {/* Top back navigation */}
      <div className="flex items-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-site-text-2 hover:text-site-text transition-colors group"
        >
          <Icon
            icon="tabler:arrow-left"
            className="w-4 h-4 shrink-0 transition-transform group-hover:-translate-x-0.5"
          />
          <span>{t("storeProgress.backHome") || "Back to Home"}</span>
        </Link>
      </div>

      {/* Hero Header Section */}
      <div className="flex flex-col items-center text-center space-y-4 max-w-2xl mx-auto">
        {/* Browser Icon + Title */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-1">
          <Icon icon={config.icon} className="w-12 h-12 sm:w-16 sm:h-16 shrink-0" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-site-text tracking-tight min-w-0 break-words">
            {t(config.titleKey) || `BugSnap for ${config.name}`}
          </h1>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm md:text-base text-site-text-2 leading-relaxed max-w-xl mx-auto">
          {t(config.descKey) ||
            "Track our official browser extension distribution status and feature parity."}
        </p>

        {/* Status Pill */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {isEdge ? (
            <>
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                <Icon
                  icon="tabler:check"
                  className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                />
                <span>{t("storeProgress.edgeStatus") || "Works on Edge Today"}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-site-surface-2 text-site-text-2 border border-site-border">
                <span>{t("storeProgress.edgeSubStatus") || "Native Add-on In Preparation"}</span>
              </div>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <span>{t("storeProgress.firefoxStatus") || "Under AMO Review"}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-site-surface-2 text-site-text-2 border border-site-border">
                <Icon icon="tabler:device-mobile" className="w-3.5 h-3.5 shrink-0" />
                <span>{t("storeProgress.firefoxPlatforms") || "Desktop & Android Gecko"}</span>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto pt-3">
          {isEdge ? (
            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#46741A] hover:bg-[#385c15] dark:bg-[#89BD49] dark:hover:bg-[#9cd455] text-white dark:text-slate-900 font-semibold text-sm transition-all shadow-xs"
            >
              <Icon icon="logos:chrome-web-store" className="w-5 h-5 shrink-0" />
              <span>{t("storeProgress.installChrome") || "Install from Chrome Web Store"}</span>
              <Icon icon="tabler:external-link" className="w-4 h-4 shrink-0" />
            </a>
          ) : (
            <>
              <a
                href={CHROME_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#46741A] hover:bg-[#385c15] dark:bg-[#89BD49] dark:hover:bg-[#9cd455] text-white dark:text-slate-900 font-semibold text-sm transition-all shadow-xs"
              >
                <Icon icon="logos:chrome-web-store" className="w-5 h-5 shrink-0" />
                <span>{t("storeProgress.ctaTryChrome") || "Try Chrome Web Store"}</span>
                <Icon icon="tabler:external-link" className="w-4 h-4 shrink-0" />
              </a>
              <Link
                href="/docs"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-site-surface border border-site-border hover:bg-site-surface-2 text-site-text font-semibold text-sm transition-colors shadow-2xs"
              >
                <span>{t("storeProgress.viewDocs") || "View Documentation"}</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Tip Callout Card */}
      {isEdge ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 sm:p-6 flex items-start gap-3 sm:gap-4 shadow-2xs">
          <Icon
            icon="tabler:info-circle"
            className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
          />
          <div className="space-y-1 min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-site-text">
              {t("storeProgress.edgeTipTitle") || "Edge Chromium Compatibility"}
            </h2>
            <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed break-words">
              {t("storeProgress.edgeTip") ||
                "Since Microsoft Edge is built on the Chromium engine, you can install BugSnap immediately from the Chrome Web Store with 100% feature parity. When prompted in your Edge address bar, simply click 'Allow extensions from other stores'."}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#89BD49]/20 bg-[#89BD49]/10 p-4 sm:p-6 flex items-start gap-3 sm:gap-4 shadow-2xs">
          <Icon
            icon="tabler:info-circle"
            className="w-5 h-5 text-[#46741A] dark:text-[#89BD49] shrink-0 mt-0.5"
          />
          <div className="space-y-1 min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-site-text">
              {t("storeProgress.firefoxStatus") || "Under AMO Review"}
            </h2>
            <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed break-words">
              {t("storeProgress.firefoxDesc") ||
                "Our native Firefox WebExtension is currently under official review on Mozilla Add-ons (AMO). Capture bugs with automated DevTools telemetry and zero-storage recordings on both Desktop and Android."}
            </p>
          </div>
        </div>
      )}

      {/* Illustration Card */}
      <div className="w-full rounded-2xl overflow-hidden bg-site-surface border border-site-border p-2 sm:p-4 flex items-center justify-center shadow-xs">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illustrations/browser-progress.svg"
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
          <div className="w-8 h-8 rounded-lg bg-[#89BD49]/10 text-[#46741A] dark:text-[#89BD49] flex items-center justify-center shrink-0">
            <Icon icon="tabler:shield-check" className="w-5 h-5" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-site-text min-w-0 truncate">
            {t("storeProgress.specTitle") || "Technical Specifications & Store Parity"}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {SPEC_KEYS.map((key) => (
            <div
              key={key}
              className="flex items-start gap-3 p-3.5 sm:p-4 rounded-xl bg-site-surface-2 border border-site-border min-w-0"
            >
              <div className="w-5 h-5 rounded-full bg-[#46741A] dark:bg-[#89BD49] text-white dark:text-slate-900 flex items-center justify-center shrink-0 mt-0.5">
                <Icon icon="tabler:check" className="w-3 h-3 stroke-[3]" />
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
