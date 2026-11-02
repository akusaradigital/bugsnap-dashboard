"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useT } from "@/components/I18nProvider";
import { SiteNavbar } from "@/components/site/SiteNavbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Reveal } from "@/components/site/motion";
import { Icon } from "@/lib/iconify";

type BrowserId = "chrome" | "edge" | "firefox";

const SHORTCUT_BROWSERS: { id: BrowserId; name: string; icon: string; url: string }[] = [
  { id: "chrome", name: "Chrome", icon: "logos:chrome", url: "chrome://extensions/shortcuts" },
  { id: "edge", name: "Edge", icon: "logos:microsoft-edge", url: "edge://extensions/shortcuts" },
  { id: "firefox", name: "Firefox", icon: "logos:firefox", url: "about:addons" },
];

function detectBrowser(): BrowserId {
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return "edge";
  if (/Firefox\//.test(ua)) return "firefox";
  return "chrome";
}

export function DocsContent() {
  const { t } = useT();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const [shortcutsHint, setShortcutsHint] = useState(false);
  const [browser, setBrowser] = useState<BrowserId>("chrome");
  const activeBrowser = SHORTCUT_BROWSERS.find((b) => b.id === browser) ?? SHORTCUT_BROWSERS[0];

  useEffect(() => {
    setBrowser(detectBrowser());
  }, []);

  // Pages cannot open chrome:// URLs, so ask the extension to do it; fall back to copying the address.
  const openShortcuts = () => {
    let opened = false;
    const onMsg = (e: MessageEvent) => {
      if (e.source === window && e.data?.source === "bugsnap-extension" && e.data.action === "shortcuts_opened") {
        opened = true;
      }
    };
    window.addEventListener("message", onMsg);
    window.postMessage({ source: "bugsnap-web", action: "open_shortcuts" }, window.location.origin);
    setTimeout(() => {
      window.removeEventListener("message", onMsg);
      if (!opened) {
        if (activeBrowser.url) copyToClipboard(activeBrowser.url, "hotkeys");
        setShortcutsHint(true);
      }
    }, 800);
  };

  const navCards = [
    {
      id: "getting-started",
      title: t("docs.gettingStarted") || "Getting Started",
      desc:
        t("docs.navGettingStartedDesc") ||
        "Install the extension and link your Google Drive.",
      href: "#getting-started",
      illustration: (
        <div className="relative w-28 h-20 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm p-2 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
          </div>
          <div className="relative w-full h-11 border border-dashed border-blue-400 bg-blue-50/60 dark:bg-blue-950/40 rounded flex items-center justify-center">
            <div className="absolute -bottom-1 -right-1 text-blue-600 dark:text-blue-500 drop-shadow-sm">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 2l16 12.5-7.5 1.5 4.5 8-3 1.5-4.5-8L4 22V2z" />
              </svg>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "shortcuts",
      title: t("docs.shortcuts") || "Keyboard Shortcuts",
      desc:
        t("docs.navShortcutsDesc") ||
        "Capture instantly with hotkeys without opening menus.",
      href: "#shortcuts",
      illustration: (
        <div className="w-full h-20 flex items-center justify-center gap-1.5">
          <div className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
            Ctrl
          </div>
          <div className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
            Shift
          </div>
          <div className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
            S
          </div>
        </div>
      ),
    },
    {
      id: "drive-setup",
      title: t("docs.driveSetup") || "Google Drive Setup",
      desc:
        t("docs.navDriveSetupDesc") ||
        "Understand permissions and private cloud storage.",
      href: "#drive-setup",
      illustration: (
        <div className="relative w-28 h-20 flex items-center justify-center">
          <div className="absolute w-20 h-14 bg-blue-100/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/40 rounded-lg -rotate-6 transform" />
          <div className="absolute w-20 h-14 bg-sky-50 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 rounded-lg rotate-2 transform shadow-xs" />
          <div className="relative z-10 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 shadow-md">
            <Icon icon="logos:google-drive" className="w-6 h-6" />
          </div>
        </div>
      ),
    },
    {
      id: "sharing",
      title: t("docs.viewAndShare") || "Sharing & Permissions",
      desc:
        t("docs.navViewAndShareDesc") ||
        "Password protection, expiration dates, and links.",
      href: "#drive-setup",
      illustration: (
        <div className="relative w-28 h-20 flex items-center justify-center">
          <div className="absolute w-14 h-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg -rotate-6 transform shadow-xs" />
          <div className="absolute w-14 h-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg rotate-3 transform shadow-sm p-1.5 space-y-1">
            <div className="h-1 w-6 bg-blue-400 rounded-full" />
            <div className="h-1 w-8 bg-slate-200 dark:bg-slate-700 rounded-full" />
            <div className="h-1 w-5 bg-slate-200 dark:bg-slate-700 rounded-full" />
          </div>
          <div className="absolute -top-1 right-3 z-10 w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
            <Icon icon="lucide:link" className="w-3.5 h-3.5" />
          </div>
          <div className="absolute -bottom-1 -right-1 z-10 flex -space-x-1.5">
            <div className="w-5 h-5 rounded-full bg-blue-500 border border-white dark:border-slate-900 flex items-center justify-center text-white text-[9px] font-bold">
              <Icon icon="lucide:user" className="w-3 h-3" />
            </div>
            <div className="w-5 h-5 rounded-full bg-amber-500 border border-white dark:border-slate-900 flex items-center justify-center text-white text-[9px] font-bold">
              <Icon icon="lucide:user" className="w-3 h-3" />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "mcp",
      title: t("docs.mcp") || "MCP for AI Agents",
      desc:
        t("docs.navMcpDesc") ||
        "Let Claude Code, Claude Desktop, or Cursor read your bug reports directly.",
      href: "/docs/mcp",
      illustration: (
        <div className="relative w-28 h-20 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm p-2 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
          </div>
          <div className="flex items-center justify-center gap-1.5 py-1">
            <div className="w-6 h-6 rounded-md bg-slate-900 border border-slate-700 flex items-center justify-center text-amber-500 font-bold text-xs shadow-xs">
              ✱
            </div>
            <div className="w-6 h-6 rounded-md bg-slate-900 border border-slate-700 flex items-center justify-center text-white text-[10px] shadow-xs">
              ◇
            </div>
            <div className="w-6 h-6 rounded-md bg-slate-900 border border-slate-700 flex items-center justify-center text-white text-[10px] font-mono font-bold shadow-xs">
              xi
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen text-site-text font-site flex flex-col bg-site-surface">
      <SiteNavbar />

      <main id="main-content" className="flex-1">
        {/* Hero Section */}
        <div className="relative overflow-hidden pt-10 sm:pt-16 pb-12 sm:pb-16">
          <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 text-center">
            <Reveal delay={0}>
              {/* Breadcrumb */}
              <nav
                className="inline-flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-6"
                aria-label="Breadcrumb"
              >
                <Link
                  href="/"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {t("landing.home") || "Home"}
                </Link>
                <span className="text-slate-300 dark:text-slate-600">›</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {t("docs.title") || "BugSnap Documentation"}
                </span>
              </nav>
            </Reveal>

            <Reveal delay={0.07}>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                {t("docs.title") || "BugSnap Documentation"}
              </h1>
            </Reveal>

            <Reveal delay={0.14}>
              <p className="mt-4 text-sm sm:text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                {t("docs.subtitle") ||
                  "Guides, hotkeys, and integration references to get the most out of BugSnap."}
              </p>
            </Reveal>
          </div>
        </div>

        {/* Page Content Container */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-20 sm:pb-28 space-y-12 sm:space-y-16">
          {/* Top 5 Navigation Cards */}
          <Reveal delay={0.1}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-0 lg:divide-x lg:divide-slate-200/80 dark:lg:divide-slate-800">
              {navCards.map((card) => {
                const content = (
                  <div className="h-full flex flex-col justify-start group">
                    <div className="h-24 flex items-center justify-center mb-4 transition-transform group-hover:scale-105 duration-200">
                      {card.illustration}
                    </div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {card.title}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                );

                return card.href.startsWith("#") ? (
                  <a
                    key={card.id}
                    href={card.href}
                    className="block h-full cursor-pointer lg:px-6 lg:first:pl-0 lg:last:pr-0"
                  >
                    {content}
                  </a>
                ) : (
                  <Link
                    key={card.id}
                    href={card.href}
                    className="block h-full cursor-pointer lg:px-6 lg:first:pl-0 lg:last:pr-0"
                  >
                    {content}
                  </Link>
                );
              })}
            </div>
          </Reveal>

          {/* Section: Keyboard Shortcuts */}
          <Reveal delay={0.15}>
            <div
              id="shortcuts"
              className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-4 sm:p-8 space-y-6 sm:space-y-8 scroll-mt-24"
            >
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {t("docs.shortcuts") || "Keyboard Shortcuts"}
                </h2>
                <span className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {t("docs.quickReference") || "Quick Reference"}
                </span>
              </div>

              {/* 2 Hotkey Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Instant Screenshot */}
                <div className="rounded-xl bg-[#f8fafc] dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      {t("docs.shortcutScreenshot") || "Instant Screenshot"}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                      {t("docs.shortcutScreenshotDesc") ||
                        "Capture current visible tab or selected window."}
                    </div>
                  </div>
                  <div className="border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 shadow-2xs whitespace-nowrap shrink-0">
                    Ctrl + Shift + S
                  </div>
                </div>

                {/* Start Screen Recording */}
                <div className="rounded-xl bg-[#f8fafc] dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      {t("docs.shortcutRecording") || "Start Screen Recording"}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                      {t("docs.shortcutRecordingDesc") ||
                        "Record screen, tab, or window with microphone audio."}
                    </div>
                  </div>
                  <div className="border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 shadow-2xs whitespace-nowrap shrink-0">
                    Ctrl + Shift + F
                  </div>
                </div>
              </div>

              {/* Per-browser shortcut tutorial */}
              <div className="rounded-xl bg-[#f8fafc] dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 space-y-5">
                <div className="space-y-1.5">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {t("docs.scTutorialTitle")}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {t("docs.scModNote")}
                  </p>
                </div>

                <div role="tablist" aria-label={t("docs.scTutorialTitle")} className="flex flex-wrap gap-2">
                  {SHORTCUT_BROWSERS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      role="tab"
                      aria-selected={browser === b.id}
                      onClick={() => {
                        setBrowser(b.id);
                        setShortcutsHint(false);
                      }}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold border transition-colors ${
                        browser === b.id
                          ? "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white shadow-2xs"
                          : "border-transparent text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <Icon icon={b.icon} width={16} aria-hidden="true" />
                      {b.name}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-3 border border-slate-200/70 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/90 rounded-lg p-3">
                  <div className="min-w-0 font-mono text-xs">
                    <div className="text-slate-400">{t("docs.scAddress")}</div>
                    <div className="text-emerald-600 dark:text-emerald-400 font-semibold select-all break-all">
                      {activeBrowser.url}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs transition-colors"
                    onClick={() => copyToClipboard(activeBrowser.url, "hotkeys")}
                  >
                    {copiedKey === "hotkeys"
                      ? t("docs.terminalCopied") || "Copied!"
                      : t("docs.copyCode") || "Copy"}
                  </button>
                </div>

                <ol className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <li key={n} className="flex items-start gap-3">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center justify-center">
                        {n}
                      </span>
                      <span className="min-w-0 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-0.5">
                        {t(`docs.sc.${browser}.s${n}`)}
                      </span>
                    </li>
                  ))}
                </ol>

                <button
                  type="button"
                  onClick={openShortcuts}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 dark:text-slate-900 dark:bg-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                >
                  <Icon icon="lucide:settings" width={14} />
                  {t("docs.shortcutsOpenBtn")}
                </button>
                {shortcutsHint && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {t("docs.shortcutsOpenFallback")}
                  </p>
                )}
              </div>
            </div>
          </Reveal>

          {/* Section: Google Drive Setup */}
          <Reveal delay={0.2}>
            <div
              id="drive-setup"
              className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 scroll-mt-24"
            >
              <div className="space-y-3 min-w-0 max-w-2xl">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {t("docs.driveSetup") || "Google Drive Setup"}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {t("docs.driveScopeDesc") ||
                    "BugSnap requests the standard Google Drive drive.file scope. This means BugSnap can only read and write files it created itself; it can never see, read, or modify your personal files or spreadsheets."}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  <Link
                    href="/help"
                    className="hover:underline inline-flex items-center gap-1"
                  >
                    {t("docs.viewHelpFaqs") || "View Help Center FAQs →"}
                  </Link>
                  <span className="text-slate-400 font-bold" aria-hidden="true">
                    ·
                  </span>
                  <Link
                    href="/contact"
                    className="hover:underline inline-flex items-center gap-1"
                  >
                    {t("docs.contactSupport") || "Contact Technical Support →"}
                  </Link>
                </div>
              </div>

              {/* Graphic Illustration */}
              <div className="w-28 h-20 sm:w-32 sm:h-24 flex items-center justify-center relative shrink-0">
                <div className="absolute inset-0 flex items-center justify-center opacity-70">
                  <svg
                    className="w-24 h-16 text-blue-100 dark:text-blue-950/60"
                    viewBox="0 0 100 60"
                    fill="currentColor"
                  >
                    <path d="M 30 50 A 20 20 0 0 1 20 15 A 25 25 0 0 1 70 15 A 20 20 0 0 1 85 35 A 15 15 0 0 1 75 50 Z" />
                  </svg>
                </div>
                <div className="absolute bottom-2 left-2 w-10 h-12 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-1.5 space-y-1">
                  <div className="h-1 w-6 bg-blue-300 dark:bg-blue-600 rounded-full" />
                  <div className="h-1 w-7 bg-slate-200 dark:bg-slate-700 rounded-full" />
                  <div className="h-1 w-5 bg-slate-200 dark:bg-slate-700 rounded-full" />
                </div>
                <div className="relative z-10 p-2 rounded-xl bg-white dark:bg-slate-800 shadow-md border border-slate-100 dark:border-slate-700 ml-6 mb-2">
                  <Icon icon="logos:google-drive" className="w-7 h-7" />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
