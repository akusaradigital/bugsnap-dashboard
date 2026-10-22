"use client";

import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";
import { Reveal } from "@/components/site/motion";
import { Icon } from "@/lib/iconify";

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf";

export function AboutContent() {
  const { t } = useT();

  const corePrinciples = [
    {
      title: "Data Sovereignty Over Cloud Lock-In",
      desc: "Your internal screen recordings and reproduction videos should never be held hostage on proprietary SaaS clouds. Files stream directly to your enterprise Google Drive under your own organization's compliance boundaries.",
      icon: "lucide:hard-drive",
    },
    {
      title: "Zero-Overhead Engineering",
      desc: "Modern browser extensions shouldn't consume gigabytes of RAM or inject heavy tracking scripts into your DOM. BugSnap is built strictly on Chrome Manifest V3, consuming under 25MB RAM and staying dormant when not recording.",
      icon: "lucide:cpu",
    },
    {
      title: "Honest, Respectful Tooling",
      desc: "We don't believe in bait-and-switch pricing or crippled free tiers. BugSnap provides real utility for developers and QA engineers from day one without holding basic debugging telemetry behind paywalls.",
      icon: "lucide:heart-handshake",
    },
    {
      title: "Global Standards, Thoughtful Craftsmanship",
      desc: "Engineered by Akusara Digital, BugSnap is built for distributed engineering teams worldwide who value speed, precision, and respectful software architecture.",
      icon: "lucide:globe",
    },
  ];

  const milestones = [
    {
      metric: "0 KB",
      label: "User media stored on BugSnap servers",
      detail: "Direct-to-Drive streaming architecture",
    },
    {
      metric: "<25 MB",
      label: "Active memory footprint in Chrome",
      detail: "Manifest V3 background worker design",
    },
    {
      metric: "100%",
      label: "Client-side telemetry redaction",
      detail: "Bearer tokens & passwords scrubbed in RAM",
    },
    {
      metric: "30s",
      label: "Average time to reproduce an issue",
      detail: "Full stack trace, network & cURL included",
    },
  ];

  return (
    <StaticShell
      title={t("about.title") || "About BugSnap"}
      subtitle={
        t("about.subtitle") ||
        "Built by Akusara Digital to make bug reporting clear, respectful, and instant for modern software teams."
      }
    >
      <div className="space-y-16 font-site">
        {/* Origin Story Section */}
        <Reveal delay={0.06}>
          <div className="rounded-2xl border border-site-border bg-site-surface p-6 sm:p-10 space-y-6 shadow-sm">
            <div className="max-w-3xl space-y-4">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-site-accent px-2.5 py-1 rounded-md bg-site-accent/10 border border-site-accent/20">
                <Icon icon="lucide:sparkles" className="w-3 h-3 text-site-accent" aria-hidden="true" />
                <span>Our Origin</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-site-text">
                {t("about.headline") || "From Click to Fix: Eliminating Friction in Bug Reports"}
              </h2>
              <p className="text-sm sm:text-base text-site-text-2 leading-relaxed">
                Every software engineer has experienced the dread of receiving an ambiguous bug report: <em>&ldquo;the checkout button is broken&rdquo;</em> with zero reproduction steps, no console errors, and no network details. Hours are wasted on back-and-forth Slack threads, screen-sharing sessions, and attempts to replicate the issue on staging.
              </p>
              <p className="text-sm sm:text-base text-site-text-2 leading-relaxed">
                We founded BugSnap at <strong>Akusara Digital</strong> to fix this broken loop forever. By automatically bundling screen recordings with source-mapped console errors, HTTP waterfalls, and environment specifications, BugSnap gives engineers everything they need to fix issues immediately upon opening a ticket.
              </p>
            </div>
          </div>
        </Reveal>

        {/* Engineering Metrics / Milestones Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {milestones.map((m, idx) => (
            <Reveal key={m.label} delay={0.1 + idx * 0.05} className="h-full">
              <div className="h-full rounded-2xl border border-site-border bg-site-surface p-5 sm:p-6 space-y-2 shadow-xs">
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-site-accent">
                  {m.metric}
                </div>
                <div className="text-xs sm:text-sm font-bold text-site-text">
                  {m.label}
                </div>
                <div className="text-[11px] text-site-text-2">
                  {m.detail}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Engineering Philosophy & Core Principles */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-site-accent">
              Core Principles
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-site-text tracking-tight">
              How We Build Software
            </h2>
            <p className="text-xs sm:text-sm text-site-text-2">
              Our engineering values reflect the kind of tools we want to use ourselves every day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {corePrinciples.map((p, i) => (
              <Reveal key={p.title} delay={0.16 + i * 0.06}>
                <div className="h-full rounded-2xl border border-site-border bg-site-surface p-6 sm:p-8 space-y-3 shadow-xs">
                  <div className="p-2.5 w-fit rounded-xl bg-site-accent/10 border border-site-accent/20 text-site-accent">
                    <Icon icon={p.icon} className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold text-site-text">{p.title}</h3>
                  <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed">{p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Compliance & Regulatory Transparency */}
        <Reveal delay={0.24}>
          <div className="rounded-2xl border border-site-border bg-site-surface-2 p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-site-border-subtle pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-site-accent">
                  Compliance &amp; Governance
                </span>
                <h3 className="font-extrabold text-lg text-site-text">
                  Regulatory &amp; Legal Disclosures
                </h3>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold self-start sm:self-auto">
                Statutory Compliance
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-site-text-2 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-site-surface border border-site-border-subtle space-y-1">
                <div className="font-bold text-site-text">Consumer Protection</div>
                <p>
                  Built with global consumer protection standards. Transparent pricing, 14-day refund guarantee, and responsive customer support.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-site-surface border border-site-border-subtle space-y-1">
                <div className="font-bold text-site-text">Data Privacy (GDPR Aligned)</div>
                <p>
                  Aligned with GDPR and global privacy standards. Media files stream directly to your Google Drive (Zero Server Storage). Self-serve data erasure.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-site-surface border border-site-border-subtle space-y-1">
                <div className="font-bold text-site-text">Security &amp; Responsible Disclosure</div>
                <p>
                  Engineered with end-to-end security standards. Standardized vulnerability disclosure policy via <strong>RFC 9116 security.txt</strong>.
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Akusara Digital Company Banner */}
        <Reveal delay={0.28}>
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-site-border bg-site-surface p-6 sm:p-8 lg:p-10 shadow-lg">
            <div
              className="pointer-events-none absolute inset-0 -z-0 opacity-40"
              style={{
                background: "radial-gradient(ellipse 70% 60% at 50% -10%, var(--glow-primary), transparent 70%)",
              }}
            />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 min-w-0">
              <div className="space-y-1.5 text-left min-w-0 flex-1">
                <span className="inline-block text-xs font-semibold uppercase tracking-widest text-site-accent">
                  Akusara Digital
                </span>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-site-text tracking-tight leading-snug">
                  Join hundreds of engineers building bug-free apps
                </h3>
                <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed max-w-2xl">
                  Install the Chrome extension in seconds and experience the fastest path from bug discovery to code commit.
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
                  <span>Add to Chrome - Free</span>
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </StaticShell>
  );
}
