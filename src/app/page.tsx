"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useT } from "@/components/I18nProvider";
import { SiteNavbar } from "@/components/site/SiteNavbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { BrowserFrame } from "@/components/site/BrowserFrame";
import {
  HeroProductShowcase,
  DevToolsCard,
  GoogleDriveProofCard,
  ExportTicketCard,
} from "@/components/site/ProductMockups";
import {
  IconArrowDown,
  IconChevronDown,
  IconSquare,
  IconArrowRight,
} from "@/components/site/TablerIcons";

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf";

export default function LandingPage() {
  const { t } = useT();
  const [autoLoggingIn, setAutoLoggingIn] = useState(false);
  const [activeFaqCategory, setActiveFaqCategory] = useState<"all" | "privacy" | "devtools" | "integrations">("all");
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
    { num: "01", title: t("site.flow.step1.title"), desc: t("site.flow.step1.desc") },
    { num: "02", title: t("site.flow.step2.title"), desc: t("site.flow.step2.desc") },
    { num: "03", title: t("site.flow.step3.title"), desc: t("site.flow.step3.desc") },
    { num: "04", title: t("site.flow.step4.title"), desc: t("site.flow.step4.desc") },
    { num: "05", title: t("site.flow.step5.title"), desc: t("site.flow.step5.desc") },
    { num: "06", title: t("site.flow.step6.title"), desc: t("site.flow.step6.desc") },
  ];

  const integrations = [
    { name: "Linear", src: "/integrations/linear.png" },
    { name: "Jira", src: "/integrations/jira.png" },
    { name: "GitHub", src: "/integrations/github.png" },
    { name: "Slack", src: "/integrations/slack.png" },
    { name: "Asana", src: "/integrations/asana.png" },
    { name: "GitLab", src: "/integrations/gitlab.png" },
    { name: "Notion", src: "/integrations/notion.png" },
    { name: "ClickUp", src: "/integrations/clickup.png" },
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
    <div className="min-h-screen bg-site-bg text-site-text font-site flex flex-col transition-colors">
      <SiteNavbar />

      <main className="flex-1 space-y-20 sm:space-y-28">
        {/* ============================================================ */}
        {/* HERO SECTION: Problem + Real Product Hero                    */}
        {/* ============================================================ */}
        <section className="pt-12 sm:pt-20 px-4 sm:px-6">
          <div className="mx-auto max-w-5xl text-center space-y-6">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-site-border bg-site-surface text-xs text-site-text-2 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span className="font-medium">{t("site.hero.eyebrow")}</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-site-text leading-[1.08]">
              {t("site.hero.headline")}
            </h1>

            {/* Subtitle */}
            <p className="max-w-2xl mx-auto text-base sm:text-lg text-site-text-2 leading-relaxed">
              {t("site.hero.body")}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href={CHROME_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-accent text-slate-900 text-sm font-semibold hover:bg-accent-hover hover:text-white transition-all shadow-md"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/chrome.svg" alt="" aria-hidden="true" className="w-4 h-4" />
                <span>{t("site.hero.ctaPrimary")}</span>
              </a>

              <a
                href="#flow"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-lg border border-site-border bg-site-surface hover:bg-site-surface-2 text-site-text text-sm font-medium transition-colors"
              >
                <span>{t("site.hero.ctaSecondary")}</span>
                <IconArrowDown size={14} className="text-site-text-2" />
              </a>
            </div>

            {/* Trust metadata */}
            <p className="text-xs text-site-text-2 font-mono">
              {t("site.hero.meta")}
            </p>
          </div>

          {/* Hero Visual: Actual Product Showcase inside BrowserFrame */}
          <div className="mt-12 sm:mt-16 mx-auto max-w-5xl">
            <BrowserFrame
              url="https://app.acme.corp/checkout"
              badge="Bug Captured"
            >
              <HeroProductShowcase />
            </BrowserFrame>
          </div>
        </section>

        {/* ============================================================ */}
        {/* STORYTELLING FLOW: 6-Step Bug Lifecycle                      */}
        {/* ============================================================ */}
        <section id="flow" className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center space-y-3 mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-accent">
              {t("site.flow.badge")}
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-site-text">
              {t("site.flow.title")}
            </h2>
            <p className="text-sm text-site-text-2 max-w-xl mx-auto">
              {t("site.flow.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {steps.map((step) => (
              <div
                key={step.num}
                className="p-6 rounded-xl border border-site-border bg-site-surface space-y-3 shadow-2xs hover:border-site-text-2/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-accent">
                    {step.num}
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-site-border" />
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
        </section>

        {/* ============================================================ */}
        {/* CORE FEATURES: Real Product Deep-Dives                      */}
        {/* ============================================================ */}
        <section id="features" className="mx-auto max-w-6xl px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-accent">
              {t("site.features.sectionBadge")}
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-site-text">
              {t("site.features.sectionTitle")}
            </h2>
            <p className="text-sm text-site-text-2 max-w-xl mx-auto">
              {t("site.features.sectionSub")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1: Video & Audio */}
            <div className="p-6 rounded-xl border border-site-border bg-site-surface flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h3 className="text-base font-bold text-site-text">
                  {t("site.features.f1.title")}
                </h3>
                <p className="text-xs text-site-text-2 leading-relaxed">
                  {t("site.features.f1.desc")}
                </p>
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-site-border-subtle">
                <kbd className="px-2 py-1 rounded bg-site-surface-2 border border-site-border font-mono text-[11px] text-site-text">
                  Ctrl+Shift+S
                </kbd>
                <kbd className="px-2 py-1 rounded bg-site-surface-2 border border-site-border font-mono text-[11px] text-site-text">
                  Ctrl+Shift+F
                </kbd>
              </div>
            </div>

            {/* Feature 2: Automated DevTools */}
            <div className="p-6 rounded-xl border border-site-border bg-site-surface flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h3 className="text-base font-bold text-site-text">
                  {t("site.features.f2.title")}
                </h3>
                <p className="text-xs text-site-text-2 leading-relaxed">
                  {t("site.features.f2.desc")}
                </p>
              </div>
              <div className="pt-2">
                <DevToolsCard />
              </div>
            </div>

            {/* Feature 3: Visual Annotations */}
            <div className="p-6 rounded-xl border border-site-border bg-site-surface flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h3 className="text-base font-bold text-site-text">
                  {t("site.features.f3.title")}
                </h3>
                <p className="text-xs text-site-text-2 leading-relaxed">
                  {t("site.features.f3.desc")}
                </p>
              </div>
              <div className="p-3 rounded-lg border border-site-border bg-site-surface-2 flex items-center justify-around text-site-text-2">
                <span className="flex items-center gap-1 px-2 py-1 rounded bg-site-surface text-accent font-bold text-xs" title="Box tool">
                  <IconSquare size={13} strokeWidth={2.5} />
                  <span>Box</span>
                </span>
                <span className="flex items-center gap-1 px-2 py-1 rounded hover:text-site-text text-xs" title="Arrow tool">
                  <IconArrowRight size={13} strokeWidth={2} />
                  <span>Arrow</span>
                </span>
                <span className="flex items-center gap-1 px-2 py-1 rounded hover:text-site-text text-xs font-semibold" title="Text callout">
                  <span>T</span>
                  <span>Text</span>
                </span>
                <span className="flex items-center gap-1 px-2 py-1 rounded hover:text-site-text text-xs" title="Blur tool">
                  <span className="font-mono text-[11px]">░░</span>
                  <span>Blur</span>
                </span>
              </div>
            </div>

            {/* Feature 4: Google Drive */}
            <div className="p-6 rounded-xl border border-site-border bg-site-surface flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h3 className="text-base font-bold text-site-text">
                  {t("site.features.f4.title")}
                </h3>
                <p className="text-xs text-site-text-2 leading-relaxed">
                  {t("site.features.f4.desc")}
                </p>
              </div>
              <div className="pt-2">
                <GoogleDriveProofCard />
              </div>
            </div>

            {/* Feature 5: Interactive Player */}
            <div className="p-6 rounded-xl border border-site-border bg-site-surface flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h3 className="text-base font-bold text-site-text">
                  {t("site.features.f5.title")}
                </h3>
                <p className="text-xs text-site-text-2 leading-relaxed">
                  {t("site.features.f5.desc")}
                </p>
              </div>
              <div className="p-3 rounded-lg border border-site-border bg-site-surface-2 text-xs text-site-text space-y-1 font-mono">
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">▶ Share Link Generated</div>
                <div className="text-[10px] text-site-text-2 truncate">https://bugsnap.akusaraproject.my.id/v/8f921a</div>
              </div>
            </div>

            {/* Feature 6: Issue Tracker Export */}
            <div className="p-6 rounded-xl border border-site-border bg-site-surface flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h3 className="text-base font-bold text-site-text">
                  {t("site.features.f6.title")}
                </h3>
                <p className="text-xs text-site-text-2 leading-relaxed">
                  {t("site.features.f6.desc")}
                </p>
              </div>
              <div className="pt-2">
                <ExportTicketCard />
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* INTEGRATIONS: Clean solid logo strip                         */}
        {/* ============================================================ */}
        <section className="border-y border-site-border bg-site-surface py-12 px-4 sm:px-6">
          <div className="mx-auto max-w-6xl text-center space-y-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-site-text-2">
              Exports seamlessly to your issue tracking workflow
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
              {integrations.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-xs font-semibold text-site-text-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.src} alt={item.name} className="w-5 h-5 object-contain" />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* FAQ: Clean Accordion (all 18 items preserved)               */}
        {/* ============================================================ */}
        <section id="faq" className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center space-y-3 mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-site-text">
              {t("landing.faq")}
            </h2>
            <p className="text-xs sm:text-sm text-site-text-2 max-w-lg mx-auto">
              {t("landing.ctaHint")}
            </p>

            {/* Filter buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
              {[
                { key: "all", label: t("landing.faqAll") },
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
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

          {/* Accordion List */}
          {(() => {
            const filtered = faqItems.filter(
              (faq) => activeFaqCategory === "all" || faq.category === activeFaqCategory
            );
            const half = Math.ceil(filtered.length / 2);
            const leftCol = filtered.slice(0, half);
            const rightCol = filtered.slice(half);

            const renderFaqCard = (faq: (typeof faqItems)[number]) => {
              const isExpanded = expandedFaqIndex === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-xl border border-site-border bg-site-surface overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaqIndex(isExpanded ? null : faq.id)}
                    className="w-full text-left p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors"
                  >
                    <span className="text-sm font-semibold text-site-text leading-snug">
                      {t(faq.q)}
                    </span>
                    <span
                      className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-transform duration-200 ${
                        isExpanded ? "rotate-180 text-accent" : "text-site-text-2"
                      }`}
                    >
                      <IconChevronDown size={14} strokeWidth={2.5} />
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="px-4 sm:px-5 pb-5 text-xs text-site-text-2 leading-relaxed border-t border-site-border-subtle pt-3">
                      {t(faq.a)}
                    </div>
                  )}
                </div>
              );
            };

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div className="space-y-4">{leftCol.map(renderFaqCard)}</div>
                <div className="space-y-4">{rightCol.map(renderFaqCard)}</div>
              </div>
            );
          })()}
        </section>

        {/* ============================================================ */}
        {/* BOTTOM CTA: Clean Solid Banner                               */}
        {/* ============================================================ */}
        <section className="px-4 sm:px-6 pb-16">
          <div className="mx-auto max-w-4xl rounded-2xl border border-site-border bg-site-surface p-8 sm:p-14 text-center space-y-5 shadow-xs">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-site-text">
              Start catching bugs with full context today
            </h2>
            <p className="text-xs sm:text-sm text-site-text-2 max-w-md mx-auto leading-relaxed">
              No credit card required. Free forever with your own Google Drive storage.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href={CHROME_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-accent text-slate-900 text-sm font-semibold hover:bg-accent-hover hover:text-white transition-all shadow-md"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/chrome.svg" alt="" aria-hidden="true" className="w-4 h-4" />
                <span>Add to Chrome - Free</span>
              </a>
              <Link
                href="/solutions"
                className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 rounded-lg border border-site-border bg-site-surface hover:bg-site-surface-2 text-site-text text-sm font-medium transition-colors"
              >
                Explore Solutions
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
