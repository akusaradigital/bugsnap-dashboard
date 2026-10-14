"use client";

import Link from "next/link";
import { useT } from "@/components/I18nProvider";
import { StaticShell } from "@/components/StaticShell";
import { HotkeyCommandBar } from "@/components/site/HotkeyCommandBar";
import { Icon } from "@/lib/iconify";
import { CHROME_STORE_URL } from "@/lib/constants";

export function ExtensionContent() {
  const { t } = useT();

  const trustBadges = [
    { icon: "lucide:hard-drive", label: t("extension.trustDrive") || "Direct to Your Google Drive" },
    { icon: "lucide:cpu", label: t("extension.trustMv3") || "Manifest V3 (<25MB RAM)" },
    { icon: "lucide:shield-check", label: t("extension.trustPermissions") || "Strict tabCapture Scope" },
  ];

  const permissions = [
    {
      perm: "tabCapture",
      scope: "Active tab only",
      purpose: t("extension.permTabCapture") || "Streams audio & video from the selected recording tab. Never monitors background tabs.",
      status: "Required",
    },
    {
      perm: "storage",
      scope: "Local browser sandbox",
      purpose: t("extension.permStorage") || "Saves your local hotkey shortcuts, target folder preferences, and recent capture tags.",
      status: "Required",
    },
    {
      perm: "identity",
      scope: "Google OAuth 2.0",
      purpose: t("extension.permIdentity") || "Authenticates directly with Google to get an access token scoped strictly to drive.file.",
      status: "Required",
    },
    {
      perm: "cookies & history",
      scope: "Never requested",
      purpose: t("extension.permNever") || "BugSnap has zero access to browsing history, passwords, or cross-origin cookies.",
      status: "Not Requested",
    },
  ];

  const browsers = [
    {
      name: "Google Chrome",
      icon: "logos:chrome",
      desc: t("extension.chromeDesc") || "Official extension on the Chrome Web Store with instant 1-click install.",
      status: t("extension.availableNow") || "Available Now",
      active: true,
      href: CHROME_STORE_URL,
    },
    {
      name: "Microsoft Edge",
      icon: "logos:microsoft-edge",
      desc: t("extension.edgeDesc") || "Install directly from Chrome Web Store via Edge's Chromium extension compatibility.",
      status: t("extension.availableNow") || "Compatible",
      active: true,
      href: CHROME_STORE_URL,
    },
    {
      name: "Brave & Opera",
      icon: "lucide:compass",
      desc: t("extension.braveDesc") || "Fully supported across all Chromium-based desktop browsers without extra configuration.",
      status: t("extension.availableNow") || "Supported",
      active: true,
      href: CHROME_STORE_URL,
    },
  ];

  const faqs = [
    { q: t("extension.faq1Q") || "Does recording slow down my active tab?", a: t("extension.faq1A") || "No. BugSnap uses passive browser listeners and hardware-accelerated MediaStream APIs. Background processing runs inside a dedicated service worker consuming under 25MB of RAM." },
    { q: t("extension.faq2Q") || "Does the extension run when I am not recording?", a: t("extension.faq2A") || "No. Built on Chrome Manifest V3, BugSnap stays dormant until you click the extension icon or trigger a configured global hotkey." },
    { q: t("extension.faq3Q") || "Can BugSnap read my passwords or saved cards?", a: t("extension.faq3A") || "Never. BugSnap never reads Chrome credential stores, autofill databases, or cross-tab browsing activity. The built-in editor also lets you blur sensitive text." },
    { q: t("extension.faq4Q") || "How do I customize the default shortcut hotkeys?", a: t("extension.faq4A") || "Open chrome://extensions/shortcuts in your Chrome address bar to remap screen and video recording hotkeys to any custom key combination." },
  ];

  return (
    <StaticShell
      title={t("extension.title") || "BugSnap Chrome Extension"}
      subtitle={t("extension.subtitle") || "The lightweight, Manifest V3 browser recorder for developers and QA engineers."}
    >
      <div className="space-y-16 font-site">
        {/* Hero Actions & Trust Indicators */}
        <div className="text-center space-y-6 max-w-2xl mx-auto -mt-6">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 bg-accent hover:bg-accent-hover text-slate-900 text-sm font-bold px-6 py-3 min-h-[44px] rounded-xl transition-all shadow-md shadow-accent/20 hover:scale-[1.02] active:scale-[0.99] touch-manipulation"
            >
              <Icon icon="logos:chrome" className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{t("extension.installCta") || "Add to Chrome - Free"}</span>
            </a>
            <Link
              href="/docs"
              className="inline-flex items-center justify-center gap-2 border border-site-border bg-site-surface hover:bg-site-surface-2 text-site-text text-sm font-semibold px-5 py-3 min-h-[44px] rounded-xl transition-colors touch-manipulation"
            >
              <span>{t("extension.viewDocs") || "Read Documentation"}</span>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-site-text-2">
            {trustBadges.map((badge) => (
              <div key={badge.label} className="flex items-center gap-1.5">
                <Icon icon={badge.icon} className="w-4 h-4 text-site-accent" aria-hidden="true" />
                <span>{badge.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Global Shortcuts Reference (Official Home) */}
        <div className="rounded-2xl border border-site-border bg-site-surface p-6 sm:p-10 space-y-6 shadow-xs">
          <div className="max-w-xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-site-accent">
              {t("extension.shortcutsTitle") || "Global Shortcuts"}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-site-text">
              {t("extension.shortcutsSub") || "Trigger recordings instantly from any tab"}
            </h2>
            <p className="text-xs text-site-text-2">
              Configure your preferred hotkeys once in Chrome, and capture bugs without losing keyboard focus.
            </p>
          </div>
          <HotkeyCommandBar />
        </div>

        {/* Manifest V3 Architecture & Resource Benchmark */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-site-border bg-site-surface p-6 space-y-3 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-site-accent/10 border border-site-accent/20 flex items-center justify-center text-site-accent">
              <Icon icon="lucide:cpu" className="w-5 h-5" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-site-text">Minimal Memory Footprint</h3>
            <p className="text-xs text-site-text-2 leading-relaxed">
              Consumes &lt;25MB RAM during active recording and 0MB when idle. Chrome terminates the service worker automatically when inactive.
            </p>
            <div className="pt-2">
              <span className="inline-block text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                Manifest V3 Compliant
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-site-border bg-site-surface p-6 space-y-3 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-site-accent/10 border border-site-accent/20 flex items-center justify-center text-site-accent">
              <Icon icon="lucide:radio" className="w-5 h-5" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-site-text">Passive Diagnostics</h3>
            <p className="text-xs text-site-text-2 leading-relaxed">
              Diagnostic listeners hook only into console errors and failed HTTP status codes without rewriting network buffers or slowing down the DOM.
            </p>
            <div className="pt-2">
              <span className="inline-block text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                0ms Script Latency
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-site-border bg-site-surface p-6 space-y-3 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-site-accent/10 border border-site-accent/20 flex items-center justify-center text-site-accent">
              <Icon icon="lucide:cloud-off" className="w-5 h-5" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-site-text">Local-First Buffering</h3>
            <p className="text-xs text-site-text-2 leading-relaxed">
              Video chunks buffer locally in IndexedDB during network hiccups before streaming directly to your authorized Google Drive folder.
            </p>
            <div className="pt-2">
              <span className="inline-block text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                Zero Data Loss
              </span>
            </div>
          </div>
        </div>

        {/* Chrome Permissions Transparency Matrix */}
        <div className="rounded-2xl border border-site-border bg-site-surface p-6 sm:p-8 space-y-5 shadow-xs">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-widest text-site-accent">
              {t("extension.permissionsEyebrow") || "Security & Privacy"}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-site-text">
              {t("extension.permissionsTitle") || "Transparent Chrome Permissions"}
            </h2>
            <p className="text-xs sm:text-sm text-site-text-2">
              We only request the minimal browser permissions necessary to capture diagnostic bug context.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-site-border text-site-text-2 text-[11px]">
                  <th className="py-2.5 pr-4 font-semibold">Permission</th>
                  <th className="py-2.5 px-4 font-semibold">Scope</th>
                  <th className="py-2.5 px-4 font-semibold font-sans">Why We Need It</th>
                  <th className="py-2.5 pl-4 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-site-border-subtle">
                {permissions.map((p) => (
                  <tr key={p.perm} className="text-site-text">
                    <td className="py-3 pr-4 font-bold text-site-accent">{p.perm}</td>
                    <td className="py-3 px-4 text-site-text-2">{p.scope}</td>
                    <td className="py-3 px-4 font-sans text-xs">{p.purpose}</td>
                    <td className="py-3 pl-4 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.status === "Required"
                            ? "bg-site-surface-2 text-site-text border border-site-border"
                            : "bg-red-500/10 text-red-500 border border-red-500/20"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Browser Compatibility */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-site-accent">
              {t("extension.sectionCompatibility") || "Compatibility"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-site-text tracking-tight">
              {t("extension.browsersTitle") || "Supported Desktop Browsers"}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {browsers.map((b) => (
              <div
                key={b.name}
                className="rounded-2xl border border-site-border bg-site-surface p-6 flex flex-col justify-between space-y-4 shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Icon icon={b.icon} className="w-6 h-6 shrink-0" aria-hidden="true" />
                      <span className="text-sm font-bold text-site-text">{b.name}</span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                      {b.status}
                    </span>
                  </div>
                  <p className="text-xs text-site-text-2 leading-relaxed">
                    {b.desc}
                  </p>
                </div>
                {b.href && (
                  <a
                    href={b.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-site-accent hover:underline pt-2"
                  >
                    <span>{t("extension.installCta") || "Install Extension"}</span>
                    <Icon icon="lucide:arrow-up-right" className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Extension FAQ */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-site-accent">
              {t("extension.sectionFaq") || "FAQ"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-site-text tracking-tight">
              {t("extension.faqTitle") || "Extension Questions & Answers"}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="rounded-xl border border-site-border bg-site-surface p-5 space-y-2 shadow-2xs"
              >
                <h3 className="text-xs sm:text-sm font-bold text-site-text">
                  {faq.q}
                </h3>
                <p className="text-xs text-site-text-2 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Conversion CTA */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-site-border bg-gradient-to-br from-site-surface via-site-surface to-site-surface-2 p-6 sm:p-8 lg:p-10 shadow-lg">
          <div
            className="pointer-events-none absolute inset-0 -z-0 opacity-40"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% -10%, var(--glow-primary), transparent 70%)",
            }}
          />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 min-w-0">
            <div className="space-y-1.5 text-left min-w-0 flex-1">
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-site-accent">
                {t("extension.badge") || "Chrome Web Store"}
              </span>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-site-text tracking-tight leading-snug">
                {t("extension.ctaTitle") || "Install BugSnap for Chrome in 10 seconds"}
              </h3>
              <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed max-w-2xl">
                {t("extension.ctaDesc") || "Free forever. Files save directly to your own Google Drive. Zero server storage."}
              </p>
            </div>
            <div className="shrink-0 w-full md:w-auto">
              <a
                href={CHROME_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-slate-900 text-xs sm:text-sm font-bold px-6 py-3 min-h-[44px] rounded-xl transition-all shadow-md shadow-accent/20 hover:scale-[1.02] active:scale-[0.99] touch-manipulation whitespace-nowrap"
              >
                <Icon icon="logos:chrome" className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{t("extension.installCta") || "Add to Chrome - Free"}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </StaticShell>
  );
}
