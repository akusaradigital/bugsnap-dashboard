"use client";

import Link from "next/link";
import { useT } from "@/components/I18nProvider";
import { StaticShell } from "@/components/StaticShell";
import { HotkeyCommandBar } from "@/components/site/HotkeyCommandBar";
import {
  DevToolsCard,
  GoogleDriveProofCard,
  HeroProductShowcase,
} from "@/components/site/ProductMockups";
import { Icon } from "@/lib/iconify";
import { CHROME_STORE_URL } from "@/lib/constants";

export function ExtensionContent() {
  const { t } = useT();

  const trustBadges = [
    { icon: "lucide:hard-drive", label: t("extension.trustDrive") },
    { icon: "lucide:video", label: t("extension.trustFree") },
    { icon: "lucide:users", label: t("extension.trustNoAccount") },
  ];

  const steps = [
    {
      id: "step-install",
      title: t("extension.step1Title"),
      desc: t("extension.step1Desc"),
      icon: "lucide:download",
    },
    {
      id: "step-capture",
      title: t("extension.step2Title"),
      desc: t("extension.step2Desc"),
      icon: "lucide:video",
    },
    {
      id: "step-share",
      title: t("extension.step3Title"),
      desc: t("extension.step3Desc"),
      icon: "lucide:share-2",
    },
  ];

  const browsers = [
    {
      name: "Google Chrome",
      icon: "logos:chrome",
      desc: t("extension.chromeDesc"),
      status: t("extension.availableNow"),
      active: true,
      href: CHROME_STORE_URL,
    },
    {
      name: "Microsoft Edge",
      icon: "logos:microsoft-edge",
      desc: t("extension.edgeDesc"),
      status: t("extension.comingSoon"),
      active: false,
      href: CHROME_STORE_URL,
    },
    {
      name: "Mozilla Firefox",
      icon: "logos:firefox",
      desc: t("extension.firefoxDesc"),
      status: t("extension.comingSoon"),
      active: false,
      href: null,
    },
  ];

  const faqs = [
    { q: t("extension.faq1Q"), a: t("extension.faq1A") },
    { q: t("extension.faq2Q"), a: t("extension.faq2A") },
    { q: t("extension.faq3Q"), a: t("extension.faq3A") },
    { q: t("extension.faq4Q"), a: t("extension.faq4A") },
  ];

  return (
    <StaticShell
      title={t("extension.title")}
      subtitle={t("extension.subtitle")}
    >
      <div className="space-y-20 font-site">
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
              <span>{t("extension.installCta")}</span>
            </a>
            <Link
              href="/docs"
              className="inline-flex items-center justify-center gap-2 border border-site-border bg-site-surface hover:bg-site-surface-2 text-site-text text-sm font-semibold px-5 py-3 min-h-[44px] rounded-xl transition-colors touch-manipulation"
            >
              <span>{t("extension.viewDocs")}</span>
              <Icon icon="lucide:arrow-right" className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-site-text-2 pt-2">
            {trustBadges.map((badge) => (
              <div key={badge.label} className="inline-flex items-center gap-1.5">
                <Icon icon={badge.icon} className="w-3.5 h-3.5 text-site-accent shrink-0" aria-hidden="true" />
                <span>{badge.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Product Showcase */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-widest text-site-accent">
              {t("extension.overview")}
            </span>
            <span className="text-xs text-site-text-2 hidden sm:inline">
              {t("extension.installMeta")}
            </span>
          </div>
          <HeroProductShowcase />
        </div>

        {/* Core Pillars / Capabilities */}
        <div className="space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-site-text tracking-tight">
              {t("extension.heroTitle")}
            </h2>
            <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed">
              {t("extension.heroSub")}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card 1: Screen & Tab Recording */}
            <div className="flex flex-col justify-between h-full rounded-2xl border border-site-border bg-site-surface p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-site-accent/10 text-site-accent text-[11px] font-bold uppercase tracking-wider border border-site-accent/20">
                  <Icon icon="lucide:video" className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{t("extension.f1Badge")}</span>
                </div>
                <h3 className="text-lg font-bold text-site-text">
                  {t("extension.f1Title")}
                </h3>
                <p className="text-xs text-site-text-2 leading-relaxed">
                  {t("extension.f1Desc")}
                </p>
              </div>
              <div className="pt-2">
                <div className="rounded-xl border border-site-border-subtle bg-site-surface-2 p-3 text-xs space-y-2 font-mono">
                  <div className="flex items-center justify-between text-site-text-2 text-[10px]">
                    <span>{t("extension.captureModes")}</span>
                    <span className="text-emerald-500 font-semibold">60 FPS</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                    <span className="p-1 rounded bg-site-surface border border-site-border text-site-text">{t("extension.modeMonitor")}</span>
                    <span className="p-1 rounded bg-site-surface border border-site-border text-site-text">{t("extension.modeWindow")}</span>
                    <span className="p-1 rounded bg-site-surface border border-site-border text-site-text">{t("extension.modeTab")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: DevTools Telemetry */}
            <div className="flex flex-col justify-between h-full rounded-2xl border border-site-border bg-site-surface p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-site-accent/10 text-site-accent text-[11px] font-bold uppercase tracking-wider border border-site-accent/20">
                  <Icon icon="lucide:terminal" className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{t("extension.f2Badge")}</span>
                </div>
                <h3 className="text-lg font-bold text-site-text">
                  {t("extension.f2Title")}
                </h3>
                <p className="text-xs text-site-text-2 leading-relaxed">
                  {t("extension.f2Desc")}
                </p>
              </div>
              <div className="pt-2">
                <DevToolsCard />
              </div>
            </div>

            {/* Card 3: Google Drive Storage */}
            <div className="flex flex-col justify-between h-full rounded-2xl border border-site-border bg-site-surface p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-site-accent/10 text-site-accent text-[11px] font-bold uppercase tracking-wider border border-site-accent/20">
                  <Icon icon="lucide:hard-drive" className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{t("extension.f3Badge")}</span>
                </div>
                <h3 className="text-lg font-bold text-site-text">
                  {t("extension.f3Title")}
                </h3>
                <p className="text-xs text-site-text-2 leading-relaxed">
                  {t("extension.f3Desc")}
                </p>
              </div>
              <div className="pt-2">
                <GoogleDriveProofCard />
              </div>
            </div>
          </div>
        </div>

        {/* Global Shortcuts Reference */}
        <div className="rounded-2xl border border-site-border bg-site-surface p-6 sm:p-10 space-y-6 shadow-xs">
          <div className="max-w-xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-site-accent">
              {t("extension.shortcutsTitle")}
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-site-text">
              {t("extension.shortcutsSub")}
            </h3>
          </div>
          <HotkeyCommandBar />
        </div>

        {/* How It Works (3 Steps) */}
        <div className="space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-site-accent">
              {t("extension.sectionWorkflow")}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-site-text tracking-tight">
              {t("extension.howItWorksTitle")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step) => (
              <div
                key={step.id}
                className="rounded-2xl border border-site-border bg-site-surface p-6 space-y-4 shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-site-accent/10 border border-site-accent/20 flex items-center justify-center text-site-accent">
                  <Icon icon={step.icon} className="w-5 h-5 text-site-accent" aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold text-site-text">
                  {step.title}
                </h3>
                <p className="text-xs text-site-text-2 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Browser Support */}
        <div className="space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-site-accent">
              {t("extension.sectionCompatibility")}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-site-text tracking-tight">
              {t("extension.browsersTitle")}
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
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        b.active
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      }`}
                    >
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
                    <span>{t("extension.installCta")}</span>
                    <Icon icon="lucide:arrow-up-right" className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-site-accent">
              {t("extension.sectionFaq")}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-site-text tracking-tight">
              {t("extension.faqTitle")}
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
                {t("extension.badge")}
              </span>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-site-text tracking-tight leading-snug">
                {t("extension.ctaTitle")}
              </h3>
              <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed max-w-2xl">
                {t("extension.ctaDesc")}
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
                <span>{t("extension.installCta")}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </StaticShell>
  );
}
