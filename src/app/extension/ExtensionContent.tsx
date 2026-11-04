"use client";

import { useState } from "react";
import Link from "next/link";
import { useT } from "@/components/I18nProvider";
import { SiteNavbar } from "@/components/site/SiteNavbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Icon } from "@/lib/iconify";
import { CHROME_STORE_URL } from "@/lib/constants";

type BrowserType = "chrome" | "edge" | "firefox";

interface BrowserTutorial {
  id: BrowserType;
  label: string;
  nameKey: string;
  icon: string;
  url: string;
  step1Key: string;
  step2Key: string;
  step3Key: string;
  tipKey: string;
  fallbackStep1: string;
  fallbackStep2: string;
  fallbackStep3: string;
  fallbackTip: string;
}

const BROWSER_TUTORIALS: BrowserTutorial[] = [
  {
    id: "chrome",
    label: "Chrome",
    nameKey: "extension.shortcutsBrowserChrome",
    icon: "logos:chrome",
    url: "chrome://extensions/shortcuts",
    step1Key: "extension.shortcutsChromeStep1",
    step2Key: "extension.shortcutsChromeStep2",
    step3Key: "extension.shortcutsChromeStep3",
    tipKey: "extension.shortcutsChromeTip",
    fallbackStep1: "Buka halaman pengelola shortcut di tab baru:",
    fallbackStep2: "Cari BugSnap, lalu klik ikon pensil di 'Take Screenshot' atau 'Start Recording'.",
    fallbackStep3:
      "Tekan kombinasi tombol favoritmu. Ubah menu ke 'Global' agar shortcut bisa dipakai saat membuka aplikasi desktop lain.",
    fallbackTip:
      "Browser berbasis Chromium (Chrome, Brave, Arc) punya mode 'Global' yang bikin shortcut tetap jalan walau browser lagi di-minimize.",
  },
  {
    id: "edge",
    label: "Edge",
    nameKey: "extension.shortcutsBrowserEdge",
    icon: "logos:microsoft-edge",
    url: "edge://extensions/shortcuts",
    step1Key: "extension.shortcutsEdgeStep1",
    step2Key: "extension.shortcutsEdgeStep2",
    step3Key: "extension.shortcutsEdgeStep3",
    tipKey: "extension.shortcutsEdgeTip",
    fallbackStep1: "Buka halaman shortcut Edge di tab baru:",
    fallbackStep2:
      "Cari BugSnap, lalu klik ikon edit (pensil) di samping perintah tangkapan layar atau rekaman.",
    fallbackStep3:
      "Tekan tombol kombinasi pilihanmu. Pilih cakupan 'Global' agar bisa aktif saat kamu bekerja di aplikasi lain.",
    fallbackTip:
      "Microsoft Edge memakai engine Chromium, jadi kamu bebas memilih cakupan 'Di Microsoft Edge' atau 'Global'.",
  },
  {
    id: "firefox",
    label: "Firefox",
    nameKey: "extension.shortcutsBrowserFirefox",
    icon: "logos:firefox",
    url: "about:addons",
    step1Key: "extension.shortcutsFirefoxStep1",
    step2Key: "extension.shortcutsFirefoxStep2",
    step3Key: "extension.shortcutsFirefoxStep3",
    tipKey: "extension.shortcutsFirefoxTip",
    fallbackStep1: "Buka pengelola Add-ons di tab baru (bisa juga tekan Ctrl+Shift+A):",
    fallbackStep2:
      "Klik ikon roda gigi di bagian atas halaman, lalu pilih 'Kelola Pintasan Ekstensi' (Manage Extension Shortcuts).",
    fallbackStep3:
      "Cari BugSnap, klik pada kolom input shortcut yang tersedia, lalu tekan tombol kombinasi yang kamu mau.",
    fallbackTip:
      "Firefox membatasi shortcut pada jendela browser aktif demi privasi dan isolasi keamanan tingkat tinggi.",
  },
];

export function ExtensionContent() {
  const { t } = useT();
  const [activeBrowser, setActiveBrowser] = useState<BrowserType>("chrome");
  const [copiedUrl, setCopiedUrl] = useState(false);

  const activeTutorial =
    BROWSER_TUTORIALS.find((b) => b.id === activeBrowser) || BROWSER_TUTORIALS[0];

  const handleCopyUrl = async () => {
    const url = activeTutorial.url;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      }
    } catch {
      // fallback
    }
  };

  const handleTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex = index;
    if (e.key === "ArrowRight") {
      nextIndex = (index + 1) % BROWSER_TUTORIALS.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex =
        (index - 1 + BROWSER_TUTORIALS.length) % BROWSER_TUTORIALS.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = BROWSER_TUTORIALS.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    const nextBrowser = BROWSER_TUTORIALS[nextIndex].id;
    setActiveBrowser(nextBrowser);
    setCopiedUrl(false);
    const nextTabEl = document.getElementById(`browser-tab-${nextBrowser}`);
    nextTabEl?.focus();
  };

  return (
    <div className="min-h-screen text-site-text font-site flex flex-col bg-site-surface">
      <SiteNavbar />

      <main id="main-content" className="flex-1 py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-12 sm:space-y-16 md:space-y-16">
          {/* Breadcrumb & Hero */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            {/* Breadcrumb */}
            <nav
              className="inline-flex items-center justify-center gap-1.5 text-xs text-site-text-2 mb-4 sm:mb-5"
              aria-label="Breadcrumb"
            >
              <Link href="/" className="hover:text-site-text transition-colors">
                {t("landing.home") || "Home"}
              </Link>
              <span className="text-site-text-2/60" aria-hidden="true">
                &gt;
              </span>
              <span className="text-site-text font-medium">
                {t("site.nav.extension") || "Extension"}
              </span>
            </nav>

            {/* Title */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
              {t("extension.title") || "Capture & debug bugs"}
              <br />
              <span className="text-blue-600 dark:text-blue-500">
                {t("extension.titleHighlight") || "directly in your browser"}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-site-text-2 leading-relaxed max-w-2xl mx-auto">
              {t("extension.subtitle") ||
                "Capture, inspect, and communicate bugs with automated DevTools telemetry, screen recording, and direct sync to your Google Drive."}
            </p>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-xs sm:max-w-none mx-auto">
              <a
                href={CHROME_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 bg-[#89BD49] hover:bg-[#78a83f] text-slate-900 text-sm font-bold px-6 py-3 min-h-[44px] rounded-xl transition-all shadow-sm active:scale-[0.99] touch-manipulation w-full sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B9A35] dark:focus-visible:ring-[#A8D666]"
              >
                <Icon icon="logos:chrome" className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span>{t("extension.installCta") || "Add to Chrome - Free"}</span>
              </a>
              <Link
                href="/docs"
                className="inline-flex items-center justify-center gap-2 border border-site-border bg-site-surface hover:bg-site-surface-2 text-site-text text-sm font-semibold px-5 py-3 min-h-[44px] rounded-xl transition-colors touch-manipulation shadow-2xs w-full sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B9A35] dark:focus-visible:ring-[#A8D666]"
              >
                <span>{t("extension.viewDocs") || "View Documentation"}</span>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-site-text-2">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#46741A] dark:bg-[#70C040] text-white dark:text-slate-900 flex items-center justify-center shrink-0">
                  <Icon icon="lucide:check" className="w-2.5 h-2.5 stroke-[3]" aria-hidden="true" />
                </span>
                <span>{t("extension.trustBrowser") || "Works on your daily browser"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#46741A] dark:bg-[#70C040] text-white dark:text-slate-900 flex items-center justify-center shrink-0">
                  <Icon icon="lucide:check" className="w-2.5 h-2.5 stroke-[3]" aria-hidden="true" />
                </span>
                <span>{t("extension.trustNoLockin") || "No server lock-in"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#46741A] dark:bg-[#70C040] text-white dark:text-slate-900 flex items-center justify-center shrink-0">
                  <Icon icon="lucide:check" className="w-2.5 h-2.5 stroke-[3]" aria-hidden="true" />
                </span>
                <span>{t("extension.trustDriveData") || "Your data stays in your Google Drive"}</span>
              </div>
            </div>
          </div>

          {/* Global Browser Shortcuts & Extension Popup Mockup */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Text & Shortcut Cards */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#46741A] dark:text-[#A8D666]">
                  {t("extension.shortcutsEyebrow") || "CUSTOMIZABLE BROWSER SHORTCUTS"}
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white leading-snug tracking-tight">
                  {t("extension.shortcutsHeading") ||
                    "Set your own shortcuts in your browser. Record screens or take instant screenshots from any tab."}
                </h2>
                <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed">
                  {t("extension.shortcutsDesc") ||
                    "BugSnap lets you customize your shortcuts directly in your browser settings. You can even set them to Global mode to trigger BugSnap while using other desktop apps."}
                </p>
              </div>

              <div className="space-y-4">
                {/* Take Screenshot Card */}
                <div className="rounded-xl border border-site-border bg-site-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-xs">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                      <Icon icon="lucide:scan" className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-site-text">
                          {t("extension.takeScreenshot") || "Take Screenshot"}
                        </h3>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                          {t("extension.shortcutsCustomBadge") || "Bisa Diubah"}
                        </span>
                      </div>
                      <p className="text-xs text-site-text-2 truncate">
                        {t("extension.takeScreenshotDesc") ||
                          "Capture current visible tab or selected window."}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-site-border/60 shrink-0">
                    <span className="text-[11px] text-site-text-2 font-medium inline">
                      {t("extension.shortcutsDefaultBadge") || "Saran bawaan:"}
                    </span>
                    <kbd className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-site-border bg-site-surface-2 text-xs font-mono font-bold text-site-text shadow-2xs">
                      Ctrl + Shift + S
                    </kbd>
                  </div>
                </div>

                {/* Start Recording Card */}
                <div className="rounded-xl border border-site-border bg-site-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-xs">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200/50 dark:border-rose-800/40 flex items-center justify-center text-rose-500 dark:text-rose-400 shrink-0">
                      <Icon icon="lucide:video" className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-site-text">
                          {t("extension.startRecording") || "Start Recording"}
                        </h3>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                          {t("extension.shortcutsCustomBadge") || "Bisa Diubah"}
                        </span>
                      </div>
                      <p className="text-xs text-site-text-2 truncate">
                        {t("extension.startRecordingDesc") ||
                          "Record screen, tab, or window with microphone audio."}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-site-border/60 shrink-0">
                    <span className="text-[11px] text-site-text-2 font-medium inline">
                      {t("extension.shortcutsDefaultBadge") || "Saran bawaan:"}
                    </span>
                    <kbd className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-site-border bg-site-surface-2 text-xs font-mono font-bold text-site-text shadow-2xs">
                      Ctrl + Shift + F
                    </kbd>
                  </div>
                </div>

                {/* Browser Setup Guide Box */}
                <div className="rounded-xl border border-site-border bg-site-surface-2/70 p-4 sm:p-5 space-y-4 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-site-text">
                      <Icon icon="lucide:settings" className="w-4 h-4 text-[#6B9A35] dark:text-[#A8D666] shrink-0" aria-hidden="true" />
                      <span>{t("extension.shortcutsSetupTitle") || "Cara atur shortcut sendiri di browsermu:"}</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      aria-label={`${copiedUrl ? (t("extension.shortcutsCopied") || "Tersalin!") : (t("extension.shortcutsCopyUrl") || "Salin URL")} ${activeTutorial.url}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-md text-xs font-semibold bg-site-surface border border-site-border hover:bg-site-surface-2 text-site-text transition-colors cursor-pointer shrink-0 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B9A35] dark:focus-visible:ring-[#A8D666] focus-visible:ring-offset-1 focus-visible:ring-offset-site-surface"
                      title={`Salin ${activeTutorial.url} ke clipboard`}
                    >
                      <Icon
                        icon={copiedUrl ? "lucide:check" : "lucide:copy"}
                        className={`w-3.5 h-3.5 shrink-0 ${copiedUrl ? "text-emerald-600 dark:text-emerald-400" : "text-site-text-2"}`}
                        aria-hidden="true"
                      />
                      <span aria-live="polite">
                        {copiedUrl ? (t("extension.shortcutsCopied") || "Tersalin!") : (t("extension.shortcutsCopyUrl") || "Salin URL")}
                      </span>
                    </button>
                  </div>

                  {/* Browser Switcher Pills */}
                  <div
                    className="flex items-center gap-1.5 p-1 bg-site-surface border border-site-border rounded-lg w-full sm:w-fit flex-wrap"
                    role="tablist"
                    aria-label={t("extension.shortcutsSetupTitle") || "Pilih browser"}
                  >
                    {BROWSER_TUTORIALS.map((b, idx) => {
                      const isActive = activeBrowser === b.id;
                      return (
                        <button
                          key={b.id}
                          id={`browser-tab-${b.id}`}
                          type="button"
                          role="tab"
                          tabIndex={isActive ? 0 : -1}
                          aria-selected={isActive}
                          aria-controls={`browser-panel-${b.id}`}
                          onKeyDown={(e) => handleTabKeyDown(e, idx)}
                          onClick={() => {
                            setActiveBrowser(b.id);
                            setCopiedUrl(false);
                          }}
                          className={`inline-flex items-center justify-center gap-1.5 flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 min-h-[40px] sm:min-h-[34px] rounded-md text-xs font-semibold transition-all cursor-pointer touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B9A35] dark:focus-visible:ring-[#A8D666] focus-visible:ring-offset-1 focus-visible:ring-offset-site-surface ${
                            isActive
                              ? "bg-[#89BD49]/15 text-[#46741A] dark:text-[#A8D666] border border-[#89BD49]/30 shadow-2xs font-bold"
                              : "text-site-text-2 hover:text-site-text hover:bg-site-surface-2 border border-transparent"
                          }`}
                        >
                          <Icon icon={b.icon} className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>{t(b.nameKey) || b.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Steps Content as tabpanel */}
                  <div
                    id={`browser-panel-${activeBrowser}`}
                    role="tabpanel"
                    aria-labelledby={`browser-tab-${activeBrowser}`}
                    className="space-y-2.5 text-xs text-site-text-2 leading-relaxed"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="text-[10px] font-mono font-bold w-4 h-4 rounded-full bg-site-surface border border-site-border flex items-center justify-center shrink-0 mt-0.5 text-site-text">
                        1
                      </span>
                      <div className="min-w-0 flex-1">
                        <span>{t(activeTutorial.step1Key) || activeTutorial.fallbackStep1} </span>
                        <code className="px-1.5 py-0.5 rounded bg-site-surface border border-site-border font-mono text-[11px] text-site-text select-all break-all">
                          {activeTutorial.url}
                        </code>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="text-[10px] font-mono font-bold w-4 h-4 rounded-full bg-site-surface border border-site-border flex items-center justify-center shrink-0 mt-0.5 text-site-text">
                        2
                      </span>
                      <p className="min-w-0 flex-1">
                        {t(activeTutorial.step2Key) || activeTutorial.fallbackStep2}
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="text-[10px] font-mono font-bold w-4 h-4 rounded-full bg-site-surface border border-site-border flex items-center justify-center shrink-0 mt-0.5 text-site-text">
                        3
                      </span>
                      <p className="min-w-0 flex-1">
                        {t(activeTutorial.step3Key) || activeTutorial.fallbackStep3}
                      </p>
                    </div>
                  </div>

                  {/* Browser Tip */}
                  <div className="pt-2 border-t border-site-border/80 flex items-start gap-2 text-[11px] text-site-text-2">
                    <Icon icon="lucide:info" className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="leading-snug">
                      {t(activeTutorial.tipKey) || activeTutorial.fallbackTip}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Extension Popup Mockup */}
            <div className="lg:col-span-5">
              <div className="w-full max-w-[400px] mx-auto lg:ml-auto rounded-2xl border border-site-border bg-site-surface shadow-xl overflow-hidden">
                {/* Window Frame Header */}
                <div className="px-4 py-3 border-b border-site-border bg-site-surface-2/60 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>

                <div className="p-5 space-y-4">
                  {/* Popup Brand & Settings */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full border border-site-text/30 flex items-center justify-center text-site-text">
                        <Icon icon="lucide:disc" className="w-3.5 h-3.5" aria-hidden="true" />
                      </div>
                      <span className="text-sm font-bold text-site-text">BugSnap</span>
                    </div>
                    <Icon icon="lucide:settings" className="w-4 h-4 text-site-text-2" aria-hidden="true" />
                  </div>

                  {/* Tabs */}
                  <div className="flex items-center gap-5 border-b border-site-border text-xs font-medium pb-2">
                    <span className="text-blue-600 dark:text-blue-400 font-semibold cursor-pointer border-b-2 border-blue-600 dark:border-blue-400 pb-2 -mb-2">
                      {t("extension.tabCapture") || "Capture"}
                    </span>
                    <span className="text-site-text-2 hover:text-site-text cursor-pointer">
                      {t("extension.tabRecent") || "Recent"}
                    </span>
                    <span className="text-site-text-2 hover:text-site-text cursor-pointer">
                      {t("extension.tabSettings") || "Settings"}
                    </span>
                  </div>

                  {/* Capture Tab Actions */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <Icon icon="lucide:scan" className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-site-text">
                            {t("extension.takeScreenshot") || "Take Screenshot"}
                          </div>
                          <div className="text-[11px] text-site-text-2 truncate">
                            {t("extension.popupScreenshotDesc") ||
                              "Capture current tab or selected area"}
                          </div>
                        </div>
                      </div>
                      <kbd className="shrink-0 px-2 py-0.5 rounded border border-site-border bg-site-surface-2 text-[10px] font-mono font-bold text-site-text">
                        Ctrl + Shift + S
                      </kbd>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400 flex items-center justify-center shrink-0">
                          <Icon icon="lucide:video" className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-site-text">
                            {t("extension.startRecording") || "Start Recording"}
                          </div>
                          <div className="text-[11px] text-site-text-2 truncate">
                            {t("extension.popupRecordingDesc") ||
                              "Record screen, tab, or window with audio"}
                          </div>
                        </div>
                      </div>
                      <kbd className="shrink-0 px-2 py-0.5 rounded border border-site-border bg-site-surface-2 text-[10px] font-mono font-bold text-site-text">
                        Ctrl + Shift + F
                      </kbd>
                    </div>
                  </div>

                  {/* Other Actions Header & List */}
                  <div className="pt-2">
                    <div className="text-[11px] font-semibold text-site-text-2 mb-3">
                      {t("extension.otherActions") || "Other Actions"}
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Icon icon="lucide:edit-3" className="w-4 h-4 text-site-text-2 mt-0.5 shrink-0" aria-hidden="true" />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-site-text">
                            {t("extension.openAnnotator") || "Open Annotator"}
                          </div>
                          <div className="text-[11px] text-site-text-2">
                            {t("extension.openAnnotatorDesc") ||
                              "Edit and annotate your screenshot or recording"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Icon icon="lucide:file-text" className="w-4 h-4 text-site-text-2 mt-0.5 shrink-0" aria-hidden="true" />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-site-text">
                            {t("extension.viewRecentFiles") || "View Recent Files"}
                          </div>
                          <div className="text-[11px] text-site-text-2">
                            {t("extension.viewRecentFilesDesc") ||
                              "Open your latest captures in Google Drive"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Icon icon="lucide:settings" className="w-4 h-4 text-site-text-2 mt-0.5 shrink-0" aria-hidden="true" />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-site-text">
                            {t("extension.openSettings") || "Open Settings"}
                          </div>
                          <div className="text-[11px] text-site-text-2">
                            {t("extension.openSettingsDesc") ||
                              "Configure shortcuts and permissions"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3 Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-800/40 flex items-center justify-center text-[#46741A] dark:text-[#A8D666]">
                <Icon icon="lucide:cpu" className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-site-text">
                {t("extension.feat1Title") || "Minimal Memory Footprint"}
              </h3>
              <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed">
                {t("extension.feat1Desc") ||
                  "Optimized to run in background with low resource usage, so it won't slow down your browser."}
              </p>
              <div>
                <Link
                  href="/features"
                  className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#46741A] dark:text-[#A8D666] hover:underline"
                >
                  <span>{t("extension.learnMore") || "Learn more"}</span>
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-800/40 flex items-center justify-center text-[#46741A] dark:text-[#A8D666]">
                <Icon icon="lucide:bar-chart-2" className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-site-text">
                {t("extension.feat2Title") || "Passive Diagnostics"}
              </h3>
              <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed">
                {t("extension.feat2Desc") ||
                  "Automatically captures DevTools context, console logs, network logs, and system info when you report a bug."}
              </p>
              <div>
                <Link
                  href="/features"
                  className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#46741A] dark:text-[#A8D666] hover:underline"
                >
                  <span>{t("extension.learnMore") || "Learn more"}</span>
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-800/40 flex items-center justify-center text-[#46741A] dark:text-[#A8D666]">
                <Icon icon="lucide:file-text" className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-site-text">
                {t("extension.feat3Title") || "Local-First Buffering"}
              </h3>
              <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed">
                {t("extension.feat3Desc") ||
                  "Your captures are stored locally first, then synced to Google Drive with your permission for better control."}
              </p>
              <div>
                <Link
                  href="/features"
                  className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#46741A] dark:text-[#A8D666] hover:underline"
                >
                  <span>{t("extension.learnMore") || "Learn more"}</span>
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Security & Privacy - Transparent Chrome Permissions */}
          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#46741A] dark:text-[#A8D666]">
                {t("extension.permissionsEyebrow") || "SECURITY & PRIVACY"}
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                {t("extension.permissionsTitle") || "Transparent Chrome Permissions"}
              </h2>
              <p className="text-xs sm:text-sm text-site-text-2">
                {t("extension.permissionsSub") ||
                  "Only the permissions needed for core features. No hidden access. You're in control."}
              </p>
            </div>

            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full text-left text-xs border-collapse min-w-[640px]">
                <thead>
                  <tr className="border-b border-site-border text-site-text-2 text-[11px]">
                    <th className="py-3 pr-4 font-semibold">{t("extension.thPermission") || "Permission"}</th>
                    <th className="py-3 px-4 font-semibold">{t("extension.thPurpose") || "Purpose"}</th>
                    <th className="py-3 px-4 font-semibold">{t("extension.thWhatWeDo") || "What We Do"}</th>
                    <th className="py-3 pl-4 font-semibold">{t("extension.thAccess") || "Access"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-site-border-subtle">
                  <tr>
                    <td className="py-3.5 pr-4 font-mono font-bold text-[#46741A] dark:text-[#A8D666]">
                      activeTab
                    </td>
                    <td className="py-3.5 px-4 text-site-text font-medium">
                      {t("extension.p1Purpose") || "Capture current tab"}
                    </td>
                    <td className="py-3.5 px-4 text-site-text-2 leading-relaxed">
                      {t("extension.p1What") ||
                        "Access the active tab when you trigger a screenshot or recording."}
                    </td>
                    <td className="py-3.5 pl-4 text-site-text">
                      {t("extension.accessOnlyUsed") || "Only when used"}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-4 font-mono font-bold text-[#46741A] dark:text-[#A8D666]">
                      storage
                    </td>
                    <td className="py-3.5 px-4 text-site-text font-medium">
                      {t("extension.p2Purpose") || "Save local settings"}
                    </td>
                    <td className="py-3.5 px-4 text-site-text-2 leading-relaxed">
                      {t("extension.p2What") || "Store your preferences and temporary data."}
                    </td>
                    <td className="py-3.5 pl-4 text-site-text">
                      {t("extension.accessLocalOnly") || "Local only"}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-4 font-mono font-bold text-[#46741A] dark:text-[#A8D666]">
                      identity
                    </td>
                    <td className="py-3.5 px-4 text-site-text font-medium">
                      {t("extension.p3Purpose") || "Google Drive access"}
                    </td>
                    <td className="py-3.5 px-4 text-site-text-2 leading-relaxed">
                      {t("extension.p3What") ||
                        "Authenticate with Google to save your captures to your own Google Drive."}
                    </td>
                    <td className="py-3.5 pl-4 text-site-text">
                      {t("extension.accessOnlyUsed") || "Only when used"}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-4 font-mono font-bold text-[#46741A] dark:text-[#A8D666]">
                      scripting
                    </td>
                    <td className="py-3.5 px-4 text-site-text font-medium">
                      {t("extension.p4Purpose") || "Inject content scripts"}
                    </td>
                    <td className="py-3.5 px-4 text-site-text-2 leading-relaxed">
                      {t("extension.p4What") ||
                        "Enable capture, console, network, and page context collection."}
                    </td>
                    <td className="py-3.5 pl-4 text-site-text">
                      {t("extension.accessActiveTab") || "Only on active tab"}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-4 font-mono font-bold text-[#46741A] dark:text-[#A8D666]">
                      cookies (if enabled)
                    </td>
                    <td className="py-3.5 px-4 text-site-text font-medium">
                      {t("extension.p5Purpose") || "Include relevant context"}
                    </td>
                    <td className="py-3.5 px-4 text-site-text-2 leading-relaxed">
                      {t("extension.p5What") ||
                        "Read specific cookies (optional) to help with debugging authentication issues."}
                    </td>
                    <td className="py-3.5 pl-4 font-semibold text-rose-500 dark:text-rose-400">
                      {t("extension.accessOptional") || "Optional (off by default)"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Compatibility - Supported Browsers */}
          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#46741A] dark:text-[#A8D666]">
                {t("extension.sectionCompatibility") || "COMPATIBILITY"}
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                {t("extension.browsersTitle") || "Supported Browsers"}
              </h2>
              <p className="text-xs sm:text-sm text-site-text-2">
                {t("extension.browsersSub") ||
                  "BugSnap works on all major Chromium-based and modern browsers."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 pt-2">
              {/* Google Chrome */}
              <div className="flex items-center gap-4">
                <Icon icon="logos:chrome-web-store" className="w-10 h-10 shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-site-text">Google Chrome</h3>
                  <p className="text-xs text-site-text-2">
                    {t("extension.fullSupport") || "Full support with all features"}
                  </p>
                  <a
                    href={CHROME_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#46741A] dark:text-[#A8D666] hover:underline mt-1"
                  >
                    <span>{t("extension.addToChrome") || "Add to Chrome"}</span>
                    <span aria-hidden="true">&rarr;</span>
                  </a>
                </div>
              </div>

              {/* Mozilla Firefox */}
              <div className="flex items-center gap-4">
                <Icon icon="logos:firefox" className="w-10 h-10 shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-site-text">Mozilla Firefox</h3>
                  <p className="text-xs text-site-text-2">
                    {t("storeProgress.firefoxStatus") || "Under AMO Review"}
                  </p>
                  <Link
                    href="/extension/firefox"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#46741A] dark:text-[#A8D666] hover:underline mt-1"
                  >
                    <span>{t("extension.addToFirefox") || "View Status"}</span>
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>

              {/* Microsoft Edge */}
              <div className="flex items-center gap-4">
                <Icon icon="logos:microsoft-edge" className="w-10 h-10 shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-site-text">Microsoft Edge</h3>
                  <p className="text-xs text-site-text-2">
                    {t("storeProgress.edgeStatus") || "Works on Edge Today"}
                  </p>
                  <Link
                    href="/extension/edge"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#46741A] dark:text-[#A8D666] hover:underline mt-1"
                  >
                    <span>{t("extension.addToEdge") || "Install for Edge"}</span>
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Frequently Asked Questions */}
          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#46741A] dark:text-[#A8D666]">
                {t("extension.faqEyebrow") || "FREQUENTLY ASKED QUESTIONS"}
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                {t("extension.faqTitle") || "Frequently Asked Questions"}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 pt-2">
              {/* FAQ 1 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-sm font-bold text-site-text">
                    {t("extension.faqImg1Q") || "Is the BugSnap Chrome Extension really free?"}
                  </h3>
                  <Icon icon="lucide:chevron-down" className="w-4 h-4 text-site-text-2 shrink-0" aria-hidden="true" />
                </div>
                <p className="text-xs text-site-text-2 leading-relaxed">
                  {t("extension.faqImg1A") ||
                    "Yes. You can install and use the extension for free. All captures are saved to your own Google Drive. No server lock-in, no hidden fees."}
                </p>
              </div>

              {/* FAQ 2 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-sm font-bold text-site-text">
                    {t("extension.faqImg2Q") || "Where are my recordings and screenshots saved?"}
                  </h3>
                  <Icon icon="lucide:chevron-down" className="w-4 h-4 text-site-text-2 shrink-0" aria-hidden="true" />
                </div>
                <p className="text-xs text-site-text-2 leading-relaxed">
                  {t("extension.faqImg2A") ||
                    "Your captures are stored in your own Google Drive with your permission. You can organize them in any folder."}
                </p>
              </div>

              {/* FAQ 3 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-sm font-bold text-site-text">
                    {t("extension.faqImg3Q") || "Does the extension store data on BugSnap's servers?"}
                  </h3>
                  <Icon icon="lucide:chevron-down" className="w-4 h-4 text-site-text-2 shrink-0" aria-hidden="true" />
                </div>
                <p className="text-xs text-site-text-2 leading-relaxed">
                  {t("extension.faqImg3A") ||
                    "No. Files are saved directly to your Google Drive. We do not store your screenshots or recordings on our servers."}
                </p>
              </div>

              {/* FAQ 4 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-sm font-bold text-site-text">
                    {t("extension.faqImg4Q") || "Do you support other browsers?"}
                  </h3>
                  <Icon icon="lucide:chevron-down" className="w-4 h-4 text-site-text-2 shrink-0" aria-hidden="true" />
                </div>
                <p className="text-xs text-site-text-2 leading-relaxed">
                  {t("extension.faqImg4A") ||
                    "Yes. BugSnap supports Google Chrome, Mozilla Firefox, and Microsoft Edge. All features work the same across supported browsers."}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Banner - Ready to Get Started? */}
          <div className="rounded-2xl border border-emerald-200/80 dark:border-emerald-800/40 bg-[#EBF5E1] dark:bg-emerald-950/20 p-4 sm:p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-xs">
            <div className="space-y-1.5 min-w-0">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#46741A] dark:text-[#A8D666]">
                {t("extension.ctaEyebrow") || "READY TO GET STARTED?"}
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                {t("extension.ctaTitle") || "Start capturing bugs with DevTools telemetry"}
              </h2>
              <p className="text-xs sm:text-sm text-site-text-2">
                {t("extension.ctaImgSub") ||
                  "Install the BugSnap Chrome Extension and bring clarity to every bug report."}
              </p>
            </div>
            <div className="shrink-0 w-full sm:w-auto">
              <a
                href={CHROME_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 bg-[#89BD49] hover:bg-[#78a83f] text-slate-900 text-sm font-bold px-6 py-3 min-h-[44px] rounded-xl transition-all shadow-sm active:scale-[0.99] touch-manipulation w-full sm:w-auto whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B9A35] dark:focus-visible:ring-[#A8D666]"
              >
                <Icon icon="logos:chrome" className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span>{t("extension.installCta") || "Add to Chrome - Free"}</span>
              </a>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
