"use client";

import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";
import { Reveal } from "@/components/site/motion";
import { Icon } from "@/lib/iconify";

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf";

export function AboutContent() {
  const { t, locale } = useT();
  const isId = locale === "id";

  const milestones = [
    {
      metric: t("about.stat1Value") || "0 KB",
      label: t("about.stat1Label") || "User media stored on BugSnap servers",
      detail: t("about.stat1Detail") || "Drive-to-Drive sharing architecture",
    },
    {
      metric: t("about.stat2Value") || "<25 MB",
      label: t("about.stat2Label") || "Active memory footprint in Chrome",
      detail: t("about.stat2Detail") || "Minimal V8 background worker design",
    },
    {
      metric: t("about.stat3Value") || "100%",
      label: t("about.stat3Label") || "Client-side telemetry redaction",
      detail:
        t("about.stat3Detail") || "Sensitive tokens & passwords excluded in RAM",
    },
    {
      metric: t("about.stat4Value") || "1-Click",
      label: t("about.stat4Label") || "Full reproduction capture",
      detail:
        t("about.stat4Detail") || "Full stack trace, network & URL included",
    },
  ];

  const corePrinciples = [
    {
      title:
        t("about.principle1Title") || "Data Sovereignty Over Cloud Lock-In",
      desc:
        t("about.principle1Desc") ||
        "Your internal screen recordings and reproduction videos should never be held hostage on proprietary SaaS clouds. Files remain directly in your enterprise Google Drive under your own organization's compliance boundaries.",
      icon: "lucide:hard-drive",
    },
    {
      title: t("about.principle2Title") || "Zero-Overhead Engineering",
      desc:
        t("about.principle2Desc") ||
        "Modern browser extensions shouldn't consume gigabytes of RAM or impact heavy loading scripts in your CI/CD. BugSnap is built strictly on Chrome Manifest V3, consuming under 25MB RAM and staying dormant when not recording.",
      icon: "lucide:cpu",
    },
    {
      title: t("about.principle3Title") || "Honest, Respectful Tooling",
      desc:
        t("about.principle3Desc") ||
        "We don't believe in bait and switch pricing or crippled free tiers. BugSnap provides real utility for developers and QA engineers from day one without holding back debugging telemetry behind paywalls.",
      icon: "lucide:heart-handshake",
    },
    {
      title:
        t("about.principle4Title") ||
        "Global Standards, Thoughtful Craftsmanship",
      desc:
        t("about.principle4Desc") ||
        "Engineered by Akusara Digital, BugSnap is built for distributed engineering teams worldwide who value speed, precision, and respectful software architecture.",
      icon: "lucide:box",
    },
  ];

  return (
    <StaticShell
      title={t("about.title") || "About the team"}
      titleHighlight={t("about.titleHighlight") || "behind BugSnap"}
      breadcrumb={isId ? "Tentang Kami" : "About"}
      subtitle={
        t("about.subtitle") ||
        "Built by Akusara Digital to make bug reporting clear and direct for developers, QA, and product teams."
      }
      ambientGlow
      hideDivider
      compactHero
    >
      <div className="max-w-5xl mx-auto space-y-10 sm:space-y-12 font-site">
        {/* Origin Story Section */}
        <Reveal delay={0.06}>
          <div className="rounded-2xl sm:rounded-3xl border border-site-border bg-site-surface p-6 sm:p-10 space-y-5 shadow-xs">
            <div className="space-y-4">
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#16a34a] dark:text-emerald-400 px-3 py-1 rounded-full bg-[#eefcf3] dark:bg-emerald-950/40">
                {t("about.originTag") || "OUR ORIGIN"}
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                {t("about.headline") ||
                  "From Click to Fix: Eliminating Friction in Bug Reports"}
              </h2>
              <p className="text-sm sm:text-base text-site-text-2 leading-relaxed">
                {t("about.originP1") || (
                  <>
                    Every software engineer has experienced the dread of receiving an ambiguous bug report:{" "}
                    <em>&ldquo;the checkout button is broken&rdquo;</em>&mdash;with no reproduction steps, no console errors, and no network details. Hours are wasted on back and forth Slack threads, screen sharing sessions, and attempts to replicate the issue on staging.
                  </>
                )}
              </p>
              <p className="text-sm sm:text-base text-site-text-2 leading-relaxed">
                {t("about.originP2") || (
                  <>
                    We founded BugSnap at <strong>Akusara Digital</strong> to fix this broken loop forever. By automatically bundling screen recordings with source-mapped console errors, HTTP waterfalls, and environment specifications, BugSnap gives engineers everything they need to fix issues immediately upon opening a ticket.
                  </>
                )}
              </p>
            </div>
          </div>
        </Reveal>

        {/* Engineering Metrics / Milestones Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {milestones.map((m, idx) => (
            <Reveal key={m.label} delay={0.1 + idx * 0.05} className="h-full">
              <div className="h-full rounded-2xl border border-site-border bg-site-surface p-6 space-y-1.5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-[#16a34a] dark:text-emerald-400">
                    {m.metric}
                  </div>
                  <div className="text-sm font-bold text-site-text mt-3 mb-1 leading-snug">
                    {m.label}
                  </div>
                </div>
                <div className="text-xs text-site-text-2 leading-normal">
                  {m.detail}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Engineering Philosophy & Core Principles */}
        <div className="space-y-6 pt-2">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#16a34a] dark:text-emerald-400">
              {t("about.principlesTag") || "CORE PRINCIPLES"}
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug mt-1">
              {t("about.principlesTitle") || "How We Build Software"}
            </h2>
            <p className="text-xs sm:text-sm text-site-text-2 max-w-xl mx-auto">
              {t("about.principlesSubtitle") ||
                "Our engineering values reflect the kind of tools we want to use ourselves every day."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-8">
            {corePrinciples.map((p, i) => (
              <Reveal key={p.title} delay={0.16 + i * 0.05} className="h-full">
                <div className="h-full rounded-2xl border border-site-border bg-site-surface p-6 sm:p-8 space-y-3 shadow-xs">
                  <div className="w-10 h-10 rounded-full border border-emerald-500/20 bg-emerald-50/70 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                    <Icon icon={p.icon} className="w-5 h-5 shrink-0" aria-hidden="true" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-site-text">{p.title}</h3>
                  <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed">{p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Compliance & Regulatory Transparency */}
        <Reveal delay={0.24}>
          <div className="rounded-2xl sm:rounded-3xl border border-site-border bg-site-surface-2 p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#16a34a] dark:text-emerald-400">
                  {t("about.complianceTag") || "COMPLIANCE & GOVERNANCE"}
                </span>
                <h3 className="font-extrabold text-xl sm:text-2xl text-site-text tracking-tight mt-0.5">
                  {t("about.complianceTitle") || "Regulatory & Legal Disclosures"}
                </h3>
              </div>
              <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-[#dcfce7] dark:bg-emerald-950/50 text-[#16a34a] dark:text-emerald-400 text-xs font-bold tracking-wide self-start sm:self-auto">
                {t("about.complianceBadge") || "Statutory Compliance"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-site-text-2 leading-relaxed">
              <div className="p-4 sm:p-5 rounded-2xl bg-site-surface border border-site-border-subtle space-y-1.5 shadow-2xs">
                <div className="font-bold text-site-text text-sm">
                  {t("about.complianceCol1Title") || "Consumer Protection"}
                </div>
                <p>
                  {t("about.complianceCol1Desc") ||
                    "Built with digital consumer protection standards. Transparent pricing, 14-day refund guarantee, and responsive customer support."}
                </p>
              </div>
              <div className="p-4 sm:p-5 rounded-2xl bg-site-surface border border-site-border-subtle space-y-1.5 shadow-2xs">
                <div className="font-bold text-site-text text-sm">
                  {t("about.complianceCol2Title") || "Data Privacy (GDPR Aligned)"}
                </div>
                <p>
                  {t("about.complianceCol2Desc") ||
                    "Aligned with GDPR and global privacy standards. Media files remain directly to your Google Drive (Zero Server Storage). Self-serve data erasure."}
                </p>
              </div>
              <div className="p-4 sm:p-5 rounded-2xl bg-site-surface border border-site-border-subtle space-y-1.5 shadow-2xs">
                <div className="font-bold text-site-text text-sm">
                  {t("about.complianceCol3Title") || "Security & Responsible Disclosure"}
                </div>
                <p>
                  {t("about.complianceCol3Desc") ||
                    "Engineered with real-world security standards. Standardized vulnerability disclosure policy via RFC 9116 security.txt."}
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Akusara Digital CTA Banner */}
        <Reveal delay={0.28}>
          <div className="rounded-2xl sm:rounded-3xl border border-site-border bg-site-surface p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6 min-w-0">
            <div className="flex items-center gap-4 sm:gap-5 min-w-0 flex-1">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#eefcf3] dark:bg-emerald-950/40 border border-emerald-500/10 flex items-center justify-center shrink-0 text-[#16a34a] dark:text-emerald-400">
                <Icon icon="lucide:zap" className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold text-site-text tracking-tight leading-snug">
                  {t("about.ctaTitle") || "Start capturing and resolving bugs with BugSnap"}
                </h3>
                <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed">
                  {t("about.ctaSubtitle") ||
                    "Install the Chrome extension in seconds and experience the fastest path from bug discovery to code commit."}
                </p>
              </div>
            </div>

            <div className="shrink-0 w-full md:w-auto">
              <a
                href={CHROME_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full md:w-auto inline-flex items-center justify-center gap-2.5 bg-[#89BD49] hover:bg-[#78a83f] text-slate-900 text-xs sm:text-sm font-bold px-6 py-3.5 min-h-[44px] rounded-2xl transition-all shadow-sm hover:scale-[1.02] active:scale-[0.99] touch-manipulation whitespace-nowrap"
              >
                <Icon icon="logos:chrome" className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" aria-hidden="true" />
                <span>{t("about.ctaButton") || "Add to Chrome - Free"}</span>
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </StaticShell>
  );
}
