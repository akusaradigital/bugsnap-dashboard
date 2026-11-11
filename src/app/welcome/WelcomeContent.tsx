"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteNavbar } from "@/components/site/SiteNavbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Icon } from "@/lib/iconify";
import { supabase } from "@/lib/supabase";
import { useT } from "@/components/I18nProvider";

export function WelcomeContent() {
  const { t } = useT();
  const [isMac, setIsMac] = useState(false);
  const [extensionDetected, setExtensionDetected] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent));

      // Check Supabase session
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user?.email) {
          setUserEmail(data.session.user.email);
        }
      }).catch(() => {});

      // Ping extension
      const timer = setTimeout(() => {
        window.postMessage({ source: "bugsnap-web", action: "ping" }, window.location.origin);
      }, 500);

      const handleMsg = (e: MessageEvent) => {
        if (e.source !== window) return;
        if (e.data?.source === "bugsnap-extension") {
          setExtensionDetected(true);
        }
      };

      window.addEventListener("message", handleMsg);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("message", handleMsg);
      };
    }
  }, []);

  const modKey = isMac ? "⌘" : "Ctrl";

  const triggerTestCapture = () => {
    window.postMessage(
      {
        source: "bugsnap-web",
        action: "trigger_capture",
        mode: "area",
      },
      window.location.origin
    );
  };

  return (
    <div className="min-h-screen text-site-text font-site flex flex-col bg-site-surface">
      <SiteNavbar />

      <main id="main-content" className="flex-1 py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-12 sm:space-y-16">
          {/* Breadcrumb & Hero */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <nav
              className="inline-flex items-center justify-center gap-1.5 text-xs text-site-text-2 mb-6"
              aria-label="Breadcrumb"
            >
              <Link href="/" className="hover:text-site-text transition-colors">
                {t("landing.home") || "Home"}
              </Link>
              <span className="text-site-text-2/60" aria-hidden="true">&gt;</span>
              <span className="text-site-text font-medium">
                {t("welcome.breadcrumb") || "Quick Start"}
              </span>
            </nav>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
              {t("welcome.title") || "Welcome to BugSnap"}
            </h1>

            <p className="text-sm sm:text-base text-site-text-2 leading-relaxed max-w-2xl mx-auto">
              {t("welcome.subtitle") ||
                "Follow these 3 quick steps to set up BugSnap and start capturing bugs with DevTools telemetry directly to your Google Drive."}
            </p>

            {/* Quick Action CTA */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-xs sm:max-w-none mx-auto">
              <button
                type="button"
                onClick={triggerTestCapture}
                className="inline-flex items-center justify-center gap-2.5 bg-[#89BD49] hover:bg-[#6B9A35] text-white text-sm font-bold px-6 py-3 min-h-[44px] rounded-xl transition-all shadow-sm active:scale-[0.99] touch-manipulation w-full sm:w-auto cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#89BD49] dark:focus-visible:ring-[#A8D666]"
              >
                <Icon icon="lucide:scan" className="w-4 h-4 shrink-0 brightness-0 invert" aria-hidden="true" />
                <span>{t("welcome.testCaptureBtn") || "Test Instant Capture"}</span>
              </button>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 border border-site-border bg-site-surface hover:bg-site-surface-2 text-site-text text-sm font-semibold px-5 py-3 min-h-[44px] rounded-xl transition-colors touch-manipulation shadow-2xs w-full sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#89BD49] dark:focus-visible:ring-[#A8D666]"
              >
                <span>{t("welcome.goDashboard") || "Go to Dashboard "}</span>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-site-text-2">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#89BD49] dark:bg-[#A8D666] text-white dark:text-slate-900 flex items-center justify-center shrink-0">
                  <Icon icon="lucide:check" className="w-2.5 h-2.5 stroke-[3] brightness-0 invert dark:invert-0" aria-hidden="true" />
                </span>
                <span>{t("welcome.trustFree") || "Free & Unlimited"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#89BD49] dark:bg-[#A8D666] text-white dark:text-slate-900 flex items-center justify-center shrink-0">
                  <Icon icon="lucide:check" className="w-2.5 h-2.5 stroke-[3] brightness-0 invert dark:invert-0" aria-hidden="true" />
                </span>
                <span>{t("welcome.trustDrive") || "Direct Sync to Google Drive"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#89BD49] dark:bg-[#A8D666] text-white dark:text-slate-900 flex items-center justify-center shrink-0">
                  <Icon icon="lucide:check" className="w-2.5 h-2.5 stroke-[3] brightness-0 invert dark:invert-0" aria-hidden="true" />
                </span>
                <span>{t("welcome.trustDevtools") || "Automated DevTools Telemetry"}</span>
              </div>
            </div>
          </div>

          {/* Real-time Status Card */}
          <div className="rounded-2xl border border-site-border bg-site-surface-2/60 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex min-w-0 items-center gap-3.5">
              <span className="relative flex h-3.5 w-3.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-site-text">
                    {extensionDetected
                      ? t("welcome.connected") || "BugSnap Extension Connected!"
                      : t("welcome.installed") || "Extension Installed Successfully"}
                  </p>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {extensionDetected ? "Active" : "Detected"}
                  </span>
                </div>
                <p className="text-xs text-site-text-2 break-all mt-0.5">
                  {userEmail
                    ? t("welcome.loggedInAs", { email: userEmail })
                    : t("welcome.connectPrompt") || "Connect your Google account to sync captures to Drive"}
                </p>
              </div>
            </div>
            {!userEmail && (
              <Link
                href="/login"
                className="inline-flex items-center justify-center shrink-0 px-4 py-2 min-h-[40px] text-xs font-bold rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shadow-xs"
              >
                {t("welcome.connectBtn") || "Connect Account "}
              </Link>
            )}
          </div>

          {/* 3 Step Setup Grid */}
          <div className="space-y-6">
            <div className="text-center sm:text-left space-y-1">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#5B8C2A] dark:text-[#A8D666]">
                QUICK SETUP GUIDE
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-site-text tracking-tight">
                3 Steps to Supercharge Your Bug Reporting
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1: Pin */}
              <div className="rounded-2xl border border-site-border bg-site-surface p-5 sm:p-6 flex flex-col justify-between hover:border-site-border-hover transition-colors shadow-xs">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-sm border border-emerald-500/20">
                      1
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-site-surface-2 text-site-text border border-site-border">
                      {t("welcome.step1Badge") || "Crucial"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon="lucide:pin" className="w-5 h-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    <h3 className="text-base sm:text-lg font-bold text-site-text">
                      {t("welcome.step1Title") || "Pin to Toolbar"}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed mb-4">
                    {t("welcome.step1Pre") || "Click the"}{" "}
                    <span className="inline-flex items-center gap-1 font-semibold text-site-text">
                      <Icon icon="lucide:puzzle" className="w-3.5 h-3.5 text-site-text" aria-hidden="true" />
                      {t("welcome.step1Puzzle") || "puzzle icon"}
                    </span>{" "}
                    {t("welcome.step1Mid") || "at the top right of your browser, then click the"}{" "}
                    <span className="inline-flex items-center gap-1 font-semibold text-site-text">
                      <Icon icon="lucide:pin" className="w-3.5 h-3.5 text-site-text" aria-hidden="true" />
                      {t("welcome.step1Pin") || "pin icon"}
                    </span>{" "}
                    {t("welcome.step1Post") || "next to BugSnap so it is always accessible."}
                  </p>
                </div>
                <div className="space-y-2 pt-2 border-t border-site-border/60">
                  <div className="rounded-xl border border-site-border/70 bg-site-surface-2/60 p-2.5 text-center">
                    <span className="text-xs font-medium text-site-text-2">
                      {t("welcome.step1Hint") || "Toolbar icon: keep BugSnap within reach"}
                    </span>
                  </div>
                  <p className="text-[11px] text-site-text-2/80 italic">
                    {t("welcome.step1ProTip") || "Pro Tip: Pinned extensions stay accessible even when DevTools or full screen is open."}
                  </p>
                </div>
              </div>

              {/* Step 2: Google Drive BYOS */}
              <div className="rounded-2xl border border-site-border bg-site-surface p-5 sm:p-6 flex flex-col justify-between hover:border-site-border-hover transition-colors shadow-xs">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-sm border border-emerald-500/20">
                      2
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                      {t("welcome.step2Badge") || "BYOS"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon="logos:google-drive" className="w-5 h-5" aria-hidden="true" />
                    <h3 className="text-base sm:text-lg font-bold text-site-text">
                      {t("welcome.step2Title") || "Your Google Drive"}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed mb-4">
                    {t("welcome.step2Desc") ||
                      "All recordings and screenshots save straight to your own Google Drive. We never hold your videos on third-party servers. You own 100% of your data."}
                  </p>
                </div>
                <div className="space-y-2 pt-2 border-t border-site-border/60">
                  <div className="rounded-xl border border-site-border/70 bg-site-surface-2/60 p-2.5 text-center flex items-center justify-center gap-2">
                    <Icon icon="lucide:folder" className="w-3.5 h-3.5 text-site-text-2" aria-hidden="true" />
                    <span className="text-xs font-medium text-site-text-2">
                      {t("welcome.step2Hint") || "Folder: My Drive / BugSnap"}
                    </span>
                  </div>
                  <p className="text-[11px] text-site-text-2/80 italic">
                    {t("welcome.step2StorageNote") || "Zero third-party storage liability. Your files stay in your Google cloud."}
                  </p>
                </div>
              </div>

              {/* Step 3: Instant Shortcuts */}
              <div className="rounded-2xl border border-site-border bg-site-surface p-5 sm:p-6 flex flex-col justify-between hover:border-site-border-hover transition-colors shadow-xs">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-sm border border-emerald-500/20">
                      3
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                      {t("welcome.step3Badge") || "Instant"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon="lucide:keyboard" className="w-5 h-5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                    <h3 className="text-base sm:text-lg font-bold text-site-text">
                      {t("welcome.step3Title") || "Instant Shortcuts"}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed mb-4">
                    {t("welcome.step3Desc") ||
                      "Trigger captures from any web page without even opening the popup using global shortcuts:"}
                  </p>
                </div>
                <div className="space-y-2 pt-2 border-t border-site-border/60">
                  <div className="space-y-2 rounded-xl border border-site-border/70 bg-site-surface-2/60 p-2.5 text-xs font-mono">
                    <div className="flex items-center justify-between text-site-text-2">
                      <span>{t("welcome.areaSnap") || "Area Snap:"}</span>
                      <kbd className="px-2 py-0.5 rounded border border-site-border bg-site-surface text-emerald-600 dark:text-emerald-400 font-bold">
                        {modKey}+Shift+S
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between text-site-text-2">
                      <span>{t("welcome.recordVideo") || "Record Video:"}</span>
                      <kbd className="px-2 py-0.5 rounded border border-site-border bg-site-surface text-emerald-600 dark:text-emerald-400 font-bold">
                        {modKey}+Shift+F
                      </kbd>
                    </div>
                  </div>
                  <Link
                    href="/extension"
                    className="block text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline pt-1"
                  >
                    {t("welcome.step3CustomShortcuts") || "Want different keys? Customize shortcuts anytime in browser settings "}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* DevTools Telemetry Preview Section */}
          <div className="rounded-2xl border border-site-border bg-site-surface-2/40 p-5 sm:p-8 space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#5B8C2A] dark:text-[#A8D666]">
                AUTOMATED TELEMETRY
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-site-text tracking-tight">
                {t("welcome.previewHeading") || "What BugSnap captures automatically"}
              </h2>
              <p className="text-xs sm:text-sm text-site-text-2">
                {t("welcome.previewSub") ||
                  "Every capture comes packed with technical diagnostics so engineers can fix bugs immediately without asking for repro steps."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="rounded-xl border border-site-border bg-site-surface p-4 space-y-2 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Icon icon="lucide:terminal" className="w-4 h-4" aria-hidden="true" />
                </div>
                <h4 className="text-sm font-bold text-site-text">
                  {t("welcome.previewConsoleTitle") || "Console Logs & Errors"}
                </h4>
                <p className="text-xs text-site-text-2 leading-relaxed">
                  {t("welcome.previewConsoleDesc") ||
                    "Uncaught errors, exceptions, and stack traces extracted right from the browser."}
                </p>
              </div>

              <div className="rounded-xl border border-site-border bg-site-surface p-4 space-y-2 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Icon icon="lucide:activity" className="w-4 h-4" aria-hidden="true" />
                </div>
                <h4 className="text-sm font-bold text-site-text">
                  {t("welcome.previewNetworkTitle") || "Network 4xx/5xx Failures"}
                </h4>
                <p className="text-xs text-site-text-2 leading-relaxed">
                  {t("welcome.previewNetworkDesc") ||
                    "Failed API calls, request payload, status codes, and latency headers."}
                </p>
              </div>

              <div className="rounded-xl border border-site-border bg-site-surface p-4 space-y-2 shadow-2xs">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Icon icon="lucide:monitor" className="w-4 h-4" aria-hidden="true" />
                </div>
                <h4 className="text-sm font-bold text-site-text">
                  {t("welcome.previewSystemTitle") || "System & Browser Specs"}
                </h4>
                <p className="text-xs text-site-text-2 leading-relaxed">
                  {t("welcome.previewSystemDesc") ||
                    "OS, screen resolution, viewport, browser version, and connection type."}
                </p>
              </div>
            </div>
          </div>

          {/* Action / Ready Panel */}
          <div className="rounded-2xl border border-site-border bg-site-surface p-6 sm:p-10 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Icon icon="lucide:camera" className="w-6 h-6" aria-hidden="true" />
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-site-text">
              {t("welcome.readyTitle") || "Ready to test it out?"}
            </h3>
            <p className="text-xs sm:text-sm text-site-text-2 max-w-lg mx-auto leading-relaxed">
              {t("welcome.readyDesc") ||
                "Take your first test screenshot now or head over to your dashboard to manage capture settings and workspaces."}
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={triggerTestCapture}
                className="px-6 py-3 min-h-[44px] rounded-xl bg-[#89BD49] hover:bg-[#6B9A35] text-white font-bold text-sm transition-all shadow-md active:scale-95 cursor-pointer touch-manipulation inline-flex items-center gap-2"
              >
                <Icon icon="lucide:scan" className="w-4 h-4" aria-hidden="true" />
                <span>{t("welcome.testCapture", { key: modKey })}</span>
              </button>
              <Link
                href="/dashboard"
                className="px-6 py-3 min-h-[44px] rounded-xl border border-site-border bg-site-surface-2 hover:bg-site-surface text-site-text font-semibold text-sm transition-colors inline-flex items-center gap-2 touch-manipulation shadow-2xs"
              >
                <span>{t("welcome.goDashboard") || "Go to Dashboard "}</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
