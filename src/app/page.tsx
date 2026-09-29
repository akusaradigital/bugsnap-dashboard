"use client";

import { useEffect, useState } from "react";
import { useT } from "@/components/I18nProvider";
import { SiteNavbar } from "@/components/site/SiteNavbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ProductVideoDemo } from "@/components/site/ProductVideoDemo";
import { HeroRecorderPreview } from "@/components/site/HeroRecorderPreview";
import { IntegrationSwitcher } from "@/components/site/IntegrationSwitcher";
import { RoleSwitcher } from "@/components/site/RoleSwitcher";
import { InteractiveDemoWidget } from "@/components/site/InteractiveDemoWidget";
import { LiveBugReportViewer } from "@/components/site/LiveBugReportViewer";
import { BeforeAfterSlider } from "@/components/site/BeforeAfterSlider";
import { TestimonialWall } from "@/components/site/TestimonialWall";
import { ZeroDataDiagram } from "@/components/site/ZeroDataDiagram";
import { HotkeyCommandBar } from "@/components/site/HotkeyCommandBar";
import {
  DevToolsCard,
  GoogleDriveProofCard,
  ExportTicketCard,
} from "@/components/site/ProductMockups";
import {
  IconArrowDown,
  IconChevronDown,
  IconSquare,
  IconArrowRight,
  IconBug,
  IconCamera,
  IconTerminal2,
  IconFolder,
  IconShare,
  IconBolt,
  IconCheck,
  IconX,
} from "@/components/site/TablerIcons";
import { Reveal } from "@/components/site/motion";
import { SiteBackground } from "@/components/site/SiteBackground";

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf";

export default function LandingPage() {
  const { t } = useT();
  const [autoLoggingIn, setAutoLoggingIn] = useState(false);
  const [activeFaqCategory, setActiveFaqCategory] = useState<"privacy" | "devtools" | "integrations">("privacy");
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  // Preserve critical Extension token auto-login workflow
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      if (token) {
        setAutoLoggingIn(true);
        fetch("/api/auth/token-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.actionLink) {
              window.location.assign(data.actionLink);
            } else {
              throw new Error("Invalid token login response");
            }
          })
          .catch((err) => {
            console.error("Auto login failed:", err);
            setAutoLoggingIn(false);
          });
      }
    }
  }, []);

  const faqItems = [
    { id: 1, q: "landing.faq1q", a: "landing.faq1a", category: "devtools" as const },
    { id: 2, q: "landing.faq2q", a: "landing.faq2a", category: "privacy" as const },
    { id: 4, q: "landing.faq4q", a: "landing.faq4a", category: "integrations" as const },
    { id: 10, q: "landing.faq10q", a: "landing.faq10a", category: "devtools" as const },
    { id: 3, q: "landing.faq3q", a: "landing.faq3a", category: "privacy" as const },
    { id: 6, q: "landing.faq6q", a: "landing.faq6a", category: "integrations" as const },
    { id: 11, q: "landing.faq11q", a: "landing.faq11a", category: "devtools" as const },
    { id: 5, q: "landing.faq5q", a: "landing.faq5a", category: "privacy" as const },
    { id: 15, q: "landing.faq15q", a: "landing.faq15a", category: "integrations" as const },
    { id: 12, q: "landing.faq12q", a: "landing.faq12a", category: "devtools" as const },
    { id: 7, q: "landing.faq7q", a: "landing.faq7a", category: "privacy" as const },
    { id: 16, q: "landing.faq16q", a: "landing.faq16a", category: "integrations" as const },
    { id: 13, q: "landing.faq13q", a: "landing.faq13a", category: "devtools" as const },
    { id: 8, q: "landing.faq8q", a: "landing.faq8a", category: "privacy" as const },
    { id: 17, q: "landing.faq17q", a: "landing.faq17a", category: "integrations" as const },
    { id: 14, q: "landing.faq14q", a: "landing.faq14a", category: "devtools" as const },
    { id: 9, q: "landing.faq9q", a: "landing.faq9a", category: "privacy" as const },
    { id: 18, q: "landing.faq18q", a: "landing.faq18a", category: "integrations" as const },
  ];

  const steps = [
    { num: "01", icon: IconBug, title: t("site.flow.step1.title"), desc: t("site.flow.step1.desc") },
    { num: "02", icon: IconCamera, title: t("site.flow.step2.title"), desc: t("site.flow.step2.desc") },
    { num: "03", icon: IconTerminal2, title: t("site.flow.step3.title"), desc: t("site.flow.step3.desc") },
    { num: "04", icon: IconFolder, title: t("site.flow.step4.title"), desc: t("site.flow.step4.desc") },
    { num: "05", icon: IconShare, title: t("site.flow.step5.title"), desc: t("site.flow.step5.desc") },
    { num: "06", icon: IconBolt, title: t("site.flow.step6.title"), desc: t("site.flow.step6.desc") },
  ];

  const metrics = [
    { val: "100%", label: "DevTools Telemetry", sub: "Console errors, network 4xx/5xx, system specs" },
    { val: "0 KB", label: "3rd-Party Server Storage", sub: "All files go straight to your Google Drive" },
    { val: "< 3s", label: "Click to Shareable Link", sub: "Instant interactive bug report URL" },
    { val: "8+", label: "Native Issue Integrations", sub: "Jira, Linear, GitHub, Slack, and more" },
  ];

  const oldPoints = [
    t("site.waza.oldPoint1"),
    t("site.waza.oldPoint2"),
    t("site.waza.oldPoint3"),
  ];

  const newPoints = [
    t("site.waza.newPoint1"),
    t("site.waza.newPoint2"),
    t("site.waza.newPoint3"),
  ];

  if (autoLoggingIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-site-bg text-site-text font-site">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-7 h-7 text-accent animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <p className="text-sm text-site-text-2 font-medium">{t("landing.redirecting")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-site-text font-site flex flex-col transition-colors relative isolate">
      <SiteBackground />

      <div className="relative z-10 flex flex-col flex-1">
        <SiteNavbar />

        <main className="flex-1">

          {/* ================================================================ */}
          {/* HERO — Split 2-column, Wazapin-style                            */}
          {/* ================================================================ */}
          <section className="relative pt-16 sm:pt-24 pb-0 px-4 sm:px-6 overflow-hidden">
            <div className="mx-auto max-w-6xl">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-10 lg:gap-14 items-center">

                {/* LEFT — Copy */}
                <div className="py-4 sm:py-8">
                  {/* Kicker */}
                  <Reveal delay={0}>
                    <p className="text-xs font-semibold text-site-text-2 tracking-wide uppercase mb-5">
                      {t("site.waza.split.kicker")}
                    </p>
                  </Reveal>

                  {/* Headline */}
                  <Reveal delay={0.05}>
                    <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight text-site-text leading-[1.08] text-balance mb-6">
                      {t("site.waza.split.headline")}
                    </h1>
                  </Reveal>

                  {/* Sub */}
                  <Reveal delay={0.1}>
                    <p className="text-base sm:text-lg text-site-text-2 leading-relaxed mb-8 max-w-lg">
                      {t("site.waza.split.sub")}
                    </p>
                  </Reveal>

                  {/* CTAs */}
                  <Reveal delay={0.15}>
                    <div className="flex flex-col sm:flex-row items-start gap-3 mb-6">
                      <a
                        href={CHROME_STORE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent hover:bg-accent-hover text-slate-900 text-sm font-semibold shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/icons/chrome.svg" alt="" aria-hidden="true" className="w-4 h-4" />
                        {t("site.waza.split.cta")}
                      </a>
                      <a
                        href="#how-it-works"
                        className="inline-flex items-center gap-1.5 px-5 py-3 text-sm font-medium text-site-text-2 hover:text-site-text transition-colors"
                      >
                        {t("site.hero.ctaSecondary")}
                        <IconArrowDown size={14} />
                      </a>
                    </div>
                  </Reveal>

                  {/* Trust line */}
                  <Reveal delay={0.2}>
                    <p className="text-[11px] text-site-text-2 tracking-wide">
                      {t("site.hero.meta")}
                    </p>
                  </Reveal>
                </div>

                {/* RIGHT — Screen Recorder + DevTools Mockup */}
                <Reveal delay={0.1}>
                  <HeroRecorderPreview />
                </Reveal>

              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/* METRICS — "Results you can measure"                              */}
          {/* ================================================================ */}
          <section className="py-16 sm:py-20 px-4 sm:px-6 border-y border-site-border">
            <div className="mx-auto max-w-6xl">
              <Reveal>
                <div className="mb-12">
                  <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">
                    {t("site.waza.metricsEyebrow")}
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-site-text max-w-2xl text-balance">
                    {t("site.waza.metricsTitle")}
                  </h2>
                </div>
              </Reveal>

              {/* Wazapin-style: horizontal strip, dividers, no cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-site-border">
                {metrics.map((m, i) => (
                  <Reveal key={m.label} delay={i * 0.07}>
                    <div className="px-6 py-2 flex flex-col gap-1 first:pl-0">
                      <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-site-text tabular-nums leading-none">
                        {m.val}
                      </span>
                      <span className="text-sm font-semibold text-site-text mt-2">{m.label}</span>
                      <span className="text-xs text-site-text-2 leading-snug">{m.sub}</span>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/* DEMO — Animated Product Simulation "See It Live"                 */}
          {/* ================================================================ */}
          <section className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-950">
            <div className="mx-auto max-w-6xl">
              <Reveal>
                <div className="text-center mb-10">
                  <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">
                    {t("site.waza.demoEyebrow")}
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white max-w-3xl mx-auto text-balance">
                    {t("site.waza.demoTitle")}
                  </h2>
                  <p className="text-sm text-slate-400 mt-3 max-w-xl mx-auto leading-relaxed">
                    {t("site.waza.demoSub")}
                  </p>
                </div>
              </Reveal>
              <Reveal delay={0.1}>
                <ProductVideoDemo />
              </Reveal>
            </div>
          </section>

          {/* ================================================================ */}
          {/* LIVE VIEWER — "What your developer receives"                      */}
          {/* ================================================================ */}
          <section className="py-16 sm:py-24 px-4 sm:px-6 border-b border-site-border">
            <div className="mx-auto max-w-6xl">
              <Reveal>
                <div className="text-center mb-12">
                  <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">
                    {t("site.viewer.eyebrow")}
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-site-text max-w-3xl mx-auto text-balance">
                    {t("site.viewer.title")}
                  </h2>
                  <p className="text-sm text-site-text-2 mt-3 max-w-xl mx-auto leading-relaxed">
                    {t("site.viewer.sub")}
                  </p>
                </div>
              </Reveal>
              <Reveal delay={0.1}>
                <LiveBugReportViewer />
              </Reveal>
            </div>
          </section>

          {/* ================================================================ */}
          {/* COMPARISON — "Why teams switch"                                  */}
          {/* ================================================================ */}
          <section className="py-16 sm:py-24 px-4 sm:px-6">
            <div className="mx-auto max-w-5xl">
              <Reveal>
                <div className="mb-12">
                  <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">
                    {t("site.waza.compareEyebrow")}
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-site-text max-w-2xl text-balance">
                    {t("site.waza.compareTitle")}
                  </h2>
                </div>
              </Reveal>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Old Way — muted, dimmed */}
                <Reveal delay={0}>
                  <div className="rounded-2xl border border-site-border bg-site-surface-2 p-6 sm:p-8 h-full">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-site-text-2 mb-4">
                      {t("site.waza.oldTitle")}
                    </p>
                    <p className="text-sm text-site-text-2 mb-6">{t("site.waza.oldDesc")}</p>
                    <ul className="space-y-4">
                      {oldPoints.map((pt) => (
                        <li key={pt} className="flex items-start gap-3 text-sm text-site-text-2">
                          <IconX size={14} strokeWidth={2} className="text-site-text-2/50 shrink-0 mt-0.5" />
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>

                {/* With BugSnap — clean white, accent left border */}
                <Reveal delay={0.1}>
                  <div className="rounded-2xl border border-site-border bg-site-surface p-6 sm:p-8 h-full relative overflow-hidden">
                    <div className="absolute inset-y-0 left-0 w-[3px] bg-accent rounded-l-2xl" aria-hidden="true" />
                    <p className="text-[11px] font-bold uppercase tracking-widest text-accent mb-4">
                      {t("site.waza.newTitle")}
                    </p>
                    <p className="text-sm text-site-text-2 mb-6">{t("site.waza.newDesc")}</p>
                    <ul className="space-y-4">
                      {newPoints.map((pt) => (
                        <li key={pt} className="flex items-start gap-3 text-sm text-site-text">
                          <IconCheck size={14} strokeWidth={2.5} className="text-accent shrink-0 mt-0.5" />
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/* BEFORE / AFTER — "From Slack threads to 1 link"                  */}
          {/* ================================================================ */}
          <section className="py-16 sm:py-24 px-4 sm:px-6 bg-site-surface-2 border-b border-site-border">
            <div className="mx-auto max-w-6xl">
              <Reveal>
                <div className="text-center mb-12">
                  <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">
                    {t("site.before.eyebrow")}
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-site-text text-balance">
                    {t("site.before.title")}
                  </h2>
                  <p className="text-sm text-site-text-2 mt-3 max-w-xl mx-auto">
                    {t("site.before.sub")}
                  </p>
                </div>
              </Reveal>
              <Reveal delay={0.1}>
                <BeforeAfterSlider />
              </Reveal>
            </div>
          </section>

          {/* ================================================================ */}
          {/* ROLES — "Built for your whole team"                              */}
          {/* ================================================================ */}
          <section className="py-16 sm:py-24 px-4 sm:px-6 bg-site-surface-2 border-y border-site-border">
            <div className="mx-auto max-w-6xl">
              <Reveal>
                <div className="text-center mb-12">
                  <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">
                    {t("site.waza.roleEyebrow")}
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-site-text text-balance">
                    {t("site.waza.roleTitle")}
                  </h2>
                  <p className="text-sm text-site-text-2 max-w-xl mx-auto mt-3">
                    {t("site.waza.roleSub")}
                  </p>
                </div>
              </Reveal>
              <Reveal delay={0.1}>
                <RoleSwitcher />
              </Reveal>
            </div>
          </section>

          {/* ================================================================ */}
          {/* HOW IT WORKS — Numbered steps (01 / → 06 /)                     */}
          {/* ================================================================ */}
          <section id="how-it-works" className="border-y border-site-border bg-site-surface/50 py-16 sm:py-24 px-4 sm:px-6">
            <div className="mx-auto max-w-6xl">
              <Reveal>
                <div className="text-center mb-12">
                  <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">
                    {t("site.flow.badge")}
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-site-text text-balance">
                    {t("site.flow.title")}
                  </h2>
                  <p className="text-sm text-site-text-2 max-w-xl mx-auto mt-3">
                    {t("site.flow.subtitle")}
                  </p>
                </div>
              </Reveal>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {steps.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <Reveal key={step.num} delay={i * 0.07}>
                      <div className="group relative p-6 rounded-xl border border-site-border bg-site-surface hover:border-accent/40 transition-colors duration-200 h-full flex flex-col gap-4">
                        <div className="w-9 h-9 rounded-lg border border-site-border bg-site-surface-2 group-hover:border-accent/30 group-hover:bg-accent/10 flex items-center justify-center text-site-text-2 group-hover:text-accent transition-colors duration-200">
                          <Icon size={18} strokeWidth={2} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-site-text mb-1.5">{step.title}</h3>
                          <p className="text-xs text-site-text-2 leading-relaxed">{step.desc}</p>
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/* HOTKEYS — "Three shortcuts. Full diagnostic context."             */}
          {/* ================================================================ */}
          <section className="py-16 sm:py-20 px-4 sm:px-6 border-b border-site-border">
            <div className="mx-auto max-w-6xl">
              <Reveal>
                <div className="text-center mb-12">
                  <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">
                    {t("site.hotkeys.eyebrow")}
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-site-text text-balance">
                    {t("site.hotkeys.title")}
                  </h2>
                  <p className="text-sm text-site-text-2 mt-3 max-w-xl mx-auto">
                    {t("site.hotkeys.sub")}
                  </p>
                </div>
              </Reveal>
              <Reveal delay={0.1}>
                <HotkeyCommandBar />
              </Reveal>
            </div>
          </section>

          {/* ================================================================ */}
          {/* FEATURES — Five modules, one complete diagnostic                 */}
          {/* ================================================================ */}
          <section id="features" className="py-16 sm:py-24 px-4 sm:px-6">
            <div className="mx-auto max-w-6xl">
              <Reveal>
                <div className="text-center mb-12">
                  <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">
                    {t("site.features.sectionBadge")}
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-site-text text-balance">
                    {t("site.features.sectionTitle")}
                  </h2>
                  <p className="text-sm text-site-text-2 max-w-xl mx-auto mt-3">
                    {t("site.features.sectionSub")}
                  </p>
                </div>
              </Reveal>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Feature 1 */}
                <Reveal delay={0}>
                  <div className="group p-6 rounded-xl border border-site-border bg-site-surface hover:border-accent/40 hover:-translate-y-0.5 transition-all duration-200 h-full flex flex-col gap-4">
                    <div className="flex-1 space-y-1.5">
                      <h3 className="text-sm font-bold text-site-text group-hover:text-accent transition-colors">{t("site.features.f1.title")}</h3>
                      <p className="text-xs text-site-text-2 leading-relaxed">{t("site.features.f1.desc")}</p>
                    </div>
                    {/* Recording visual */}
                    <div className="rounded-lg border border-site-border bg-site-surface-2 overflow-hidden">
                      {/* Capture bar */}
                      <div className="flex items-center justify-between px-3 py-2 border-b border-site-border bg-site-surface">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-[10px] font-mono font-semibold text-red-600 dark:text-red-400">REC 00:14</span>
                        </div>
                        <span className="text-[10px] text-site-text-2 font-mono">checkout.acme.corp</span>
                      </div>
                      {/* Waveform rows */}
                      <div className="px-3 py-2.5 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-site-text-2 w-8 shrink-0">Screen</span>
                          <div className="flex-1 h-3 rounded bg-site-border relative overflow-hidden">
                            <div className="absolute inset-y-0 left-0 w-[72%] bg-accent/40 rounded" />
                          </div>
                          <span className="text-[9px] font-mono text-site-text-2">00:14</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-site-text-2 w-8 shrink-0">Mic</span>
                          <div className="flex items-end gap-px flex-1 h-4">
                            {[2,4,6,3,7,5,8,4,6,3,5,7,4,3,6,5,7,4,3,6,5,4,3,7,5,4,6,3,5,7].map((h, i) => (
                              <div key={i} className="flex-1 rounded-sm bg-accent/50" style={{ height: `${h * 0.18}rem` }} />
                            ))}
                          </div>
                        </div>
                      </div>
                      {/* Hotkey strip */}
                      <div className="flex items-center gap-2 px-3 py-2 border-t border-site-border">
                        <kbd className="px-2 py-0.5 rounded bg-site-surface border border-site-border font-mono text-[10px] text-site-text">Ctrl+Shift+S</kbd>
                        <kbd className="px-2 py-0.5 rounded bg-site-surface border border-site-border font-mono text-[10px] text-site-text">Ctrl+Shift+F</kbd>
                      </div>
                    </div>
                  </div>
                </Reveal>

                {/* Feature 2 */}
                <Reveal delay={0.07}>
                  <div className="group p-6 rounded-xl border border-site-border bg-site-surface hover:border-accent/40 hover:-translate-y-0.5 transition-all duration-200 h-full flex flex-col gap-4">
                    <div className="flex-1 space-y-1.5">
                      <h3 className="text-sm font-bold text-site-text group-hover:text-accent transition-colors">{t("site.features.f2.title")}</h3>
                      <p className="text-xs text-site-text-2 leading-relaxed">{t("site.features.f2.desc")}</p>
                    </div>
                    <div className="pt-2">
                      <DevToolsCard />
                    </div>
                  </div>
                </Reveal>

                {/* Feature 3 */}
                <Reveal delay={0.14}>
                  <div className="group p-6 rounded-xl border border-site-border bg-site-surface hover:border-accent/40 hover:-translate-y-0.5 transition-all duration-200 h-full flex flex-col gap-4">
                    <div className="flex-1 space-y-1.5">
                      <h3 className="text-sm font-bold text-site-text group-hover:text-accent transition-colors">{t("site.features.f3.title")}</h3>
                      <p className="text-xs text-site-text-2 leading-relaxed">{t("site.features.f3.desc")}</p>
                    </div>
                    {/* Visual annotation canvas */}
                    <div className="rounded-lg border border-site-border bg-site-surface-2 overflow-hidden">
                      {/* Mini canvas preview */}
                      <div className="relative p-3 bg-site-surface border-b border-site-border">
                        <div className="rounded border-2 border-red-500 bg-red-500/5 p-2.5 flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-red-600 dark:text-red-400">Pay $2,400.00</span>
                          <span className="text-[9px] font-mono text-red-600 dark:text-red-400 bg-red-500/10 px-1 py-0.5 rounded">HTTP 500</span>
                        </div>
                        <div className="absolute -top-1.5 right-4 bg-site-text text-site-surface text-[9px] font-medium px-1.5 py-0.5 rounded shadow flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                          <span>Arrow #1</span>
                        </div>
                      </div>
                      {/* Annotation toolbar */}
                      <div className="p-2 flex items-center justify-around text-site-text-2">
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-site-surface text-accent font-bold text-[11px] shadow-2xs">
                          <IconSquare size={11} strokeWidth={2.5} /><span>Box</span>
                        </span>
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px]">
                          <IconArrowRight size={11} strokeWidth={2} /><span>Arrow</span>
                        </span>
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold">
                          <span>T</span><span>Text</span>
                        </span>
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px]">
                          <span className="font-mono text-[9px]">░░</span><span>Blur</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </Reveal>

                {/* Feature 4 */}
                <Reveal delay={0.21}>
                  <div className="group p-6 rounded-xl border border-site-border bg-site-surface hover:border-accent/40 hover:-translate-y-0.5 transition-all duration-200 h-full flex flex-col gap-4">
                    <div className="flex-1 space-y-1.5">
                      <h3 className="text-sm font-bold text-site-text group-hover:text-accent transition-colors">{t("site.features.f4.title")}</h3>
                      <p className="text-xs text-site-text-2 leading-relaxed">{t("site.features.f4.desc")}</p>
                    </div>
                    <div className="pt-2">
                      <GoogleDriveProofCard />
                    </div>
                  </div>
                </Reveal>

                {/* Feature 5 */}
                <Reveal delay={0.28}>
                  <div className="group p-6 rounded-xl border border-site-border bg-site-surface hover:border-accent/40 hover:-translate-y-0.5 transition-all duration-200 h-full flex flex-col gap-4">
                    <div className="flex-1 space-y-1.5">
                      <h3 className="text-sm font-bold text-site-text group-hover:text-accent transition-colors">{t("site.features.f5.title")}</h3>
                      <p className="text-xs text-site-text-2 leading-relaxed">{t("site.features.f5.desc")}</p>
                    </div>
                    {/* Share dialog mini */}
                    <div className="rounded-lg border border-site-border bg-site-surface-2 overflow-hidden text-[10px]">
                      {/* Header */}
                      <div className="flex items-center gap-2 px-3 py-2 bg-site-surface border-b border-site-border">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                        <span className="font-semibold text-site-text text-[11px]">Share Bug Report</span>
                        <span className="ml-auto text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">● Live</span>
                      </div>
                      <div className="p-3 space-y-2.5">
                        {/* Link */}
                        <div className="flex items-center gap-1.5 rounded border border-site-border bg-site-surface px-2 py-1.5">
                          <span className="font-mono text-site-text-2 truncate flex-1 text-[9px]">bugsnap.akusaraproject.my.id/v/8f921a</span>
                          <span className="shrink-0 text-accent font-semibold text-[9px] cursor-pointer">Copy</span>
                        </div>
                        {/* Viewers */}
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-1.5">
                            {["bg-violet-400","bg-blue-400","bg-emerald-400"].map((c, i) => (
                              <div key={i} className={`w-5 h-5 rounded-full border-2 border-site-surface-2 ${c}`} />
                            ))}
                          </div>
                          <span className="text-site-text-2">3 viewers · Expires in 7d</span>
                        </div>
                        {/* Protect */}
                        <div className="flex items-center justify-between pt-1 border-t border-site-border">
                          <span className="text-site-text-2">Password protect</span>
                          <div className="w-7 h-3.5 rounded-full bg-accent/30 flex items-center px-0.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>

                {/* Feature 6 */}
                <Reveal delay={0.35}>
                  <div className="group p-6 rounded-xl border border-site-border bg-site-surface hover:border-accent/40 hover:-translate-y-0.5 transition-all duration-200 h-full flex flex-col gap-4">
                    <div className="flex-1 space-y-1.5">
                      <h3 className="text-sm font-bold text-site-text group-hover:text-accent transition-colors">{t("site.features.f6.title")}</h3>
                      <p className="text-xs text-site-text-2 leading-relaxed">{t("site.features.f6.desc")}</p>
                    </div>
                    <div className="pt-2">
                      <ExportTicketCard />
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/* TRUST — "Your files never touch our servers"                      */}
          {/* ================================================================ */}
          <section className="py-16 sm:py-24 px-4 sm:px-6 bg-site-surface-2 border-y border-site-border">
            <div className="mx-auto max-w-6xl">
              <Reveal>
                <div className="text-center mb-12">
                  <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">
                    {t("site.trust.eyebrow")}
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-site-text text-balance">
                    {t("site.trust.title")}
                  </h2>
                  <p className="text-sm text-site-text-2 mt-3 max-w-xl mx-auto leading-relaxed">
                    {t("site.trust.sub")}
                  </p>
                </div>
              </Reveal>
              <Reveal delay={0.1}>
                <ZeroDataDiagram />
              </Reveal>
            </div>
          </section>

          {/* ================================================================ */}
          {/* INTEGRATIONS — Interactive switcher                             */}
          {/* ================================================================ */}
          <section className="border-y border-site-border bg-site-surface/50 py-16 sm:py-20 px-4 sm:px-6">
            <div className="mx-auto max-w-6xl">
              <Reveal>
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">
                    {t("site.waza.integrationsEyebrow")}
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-site-text mb-3 text-balance">
                    {t("site.waza.integrationsTitle")}
                  </h2>
                  <p className="text-sm text-site-text-2 leading-relaxed">
                    {t("site.waza.integrationsSub")}
                  </p>
                </div>
              </Reveal>
              <Reveal delay={0.1}>
                <IntegrationSwitcher />
              </Reveal>
            </div>
          </section>

          {/* ================================================================ */}
          {/* TESTIMONIALS — "Loved by teams"                                   */}
          {/* ================================================================ */}
          <section className="py-16 sm:py-24 px-4 sm:px-6 border-b border-site-border">
            <div className="mx-auto max-w-6xl">
              <Reveal>
                <div className="text-center mb-12">
                  <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">
                    {t("site.testimonials.eyebrow")}
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-site-text text-balance">
                    {t("site.testimonials.title")}
                  </h2>
                  <p className="text-sm text-site-text-2 mt-3 max-w-xl mx-auto">
                    {t("site.testimonials.sub")}
                  </p>
                </div>
              </Reveal>
              <Reveal delay={0.1}>
                <TestimonialWall />
              </Reveal>
            </div>
          </section>

          {/* ================================================================ */}
          {/* FAQ — Left intro, right accordion                                */}
          {/* ================================================================ */}
          <section id="faq" className="py-16 sm:py-24 px-4 sm:px-6">
            <div className="mx-auto max-w-6xl">
              <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-12 lg:gap-16">
                {/* Left: heading + category pills (no "All") */}
                <Reveal>
                  <div className="lg:sticky lg:top-24">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-site-text mb-3 text-balance">
                      {t("landing.faq")}
                    </h2>
                    <p className="text-sm text-site-text-2 leading-relaxed mb-6">
                      {t("landing.ctaHint")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: "privacy", label: t("landing.faqPrivacy") },
                        { key: "devtools", label: t("landing.faqDevTools") },
                        { key: "integrations", label: t("landing.faqIntegrations") },
                      ].map((cat) => (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() => {
                            setActiveFaqCategory(cat.key as typeof activeFaqCategory);
                            setExpandedFaqIndex(null);
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                            activeFaqCategory === cat.key
                              ? "border-accent bg-accent text-slate-900 font-bold"
                              : "border-site-border bg-site-surface text-site-text-2 hover:text-site-text"
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </Reveal>

                {/* Right: accordion filtered by active category */}
                <div className="space-y-3">
                  {faqItems
                    .filter((faq) => faq.category === activeFaqCategory)
                    .map((faq, idx) => {
                      const isExpanded = expandedFaqIndex === faq.id;
                      return (
                        <Reveal key={faq.id} delay={Math.min(idx * 0.04, 0.2)}>
                          <div className="rounded-xl border border-site-border bg-site-surface overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setExpandedFaqIndex(isExpanded ? null : faq.id)}
                              className="w-full text-left px-5 py-4 flex items-start justify-between gap-4 transition-colors hover:bg-site-surface-2"
                            >
                              <span className="text-sm font-semibold text-site-text leading-snug">
                                {t(faq.q)}
                              </span>
                              <span
                                className={`w-5 h-5 flex items-center justify-center shrink-0 transition-transform duration-200 ${
                                  isExpanded ? "rotate-180 text-accent" : "text-site-text-2"
                                }`}
                              >
                                <IconChevronDown size={14} strokeWidth={2.5} />
                              </span>
                            </button>
                            {isExpanded && (
                              <div className="px-5 pb-5 pt-3 text-xs text-site-text-2 leading-relaxed border-t border-site-border">
                                {t(faq.a)}
                              </div>
                            )}
                          </div>
                        </Reveal>
                      );
                    })}
                </div>
              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/* FINAL CTA — Clean, confident                                     */}
          {/* ================================================================ */}
          <section className="px-4 sm:px-6 pb-20 sm:pb-28">
            <Reveal>
              <div className="relative mx-auto max-w-3xl rounded-2xl border border-accent/25 bg-accent/5 px-8 sm:px-16 py-12 sm:py-16 text-center overflow-hidden">
                <div
                  className="absolute inset-0 -z-10 pointer-events-none"
                  aria-hidden="true"
                  style={{
                    background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(137,189,73,0.12) 0%, transparent 70%)",
                  }}
                />
                <div className="absolute inset-x-0 top-0 h-px bg-accent/50" aria-hidden="true" />

                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-site-text mb-3 text-balance">
                  {t("site.waza.ctaTitle")}
                </h2>
                <p className="text-sm text-site-text-2 mb-8">
                  {t("site.waza.ctaSub")}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href={CHROME_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-accent hover:bg-accent-hover text-slate-900 text-sm font-semibold shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icons/chrome.svg" alt="" aria-hidden="true" className="w-4 h-4" />
                    {t("site.hero.ctaPrimary")}
                  </a>
                  <a
                    href="/features"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-lg border border-site-border bg-site-surface hover:bg-site-surface-2 text-site-text text-sm font-medium transition-colors"
                  >
                    {t("landing.exploreFeatures")}
                  </a>
                </div>
              </div>
            </Reveal>
          </section>

        </main>

        <SiteFooter />
        <InteractiveDemoWidget />
      </div>
    </div>
  );
}
