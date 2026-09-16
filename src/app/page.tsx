"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useT } from "@/components/I18nProvider";
import { useExperiment } from "@/lib/experiments";

function ChromeLogo({ className = "w-4 h-4 shrink-0" }: { className?: string }) {
  return (
    <img src="/icons/chrome.svg" alt="Chrome" className={className} />
  );
}

function GoogleLogo({ className = "w-4 h-4 shrink-0" }: { className?: string }) {
  return (
    <img src="/icons/google.svg" alt="Google" className={className} />
  );
}

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf";

export default function Home() {
  const { t } = useT();
  const { variant: heroCtaVariant, trackConversion } = useExperiment("landing_hero_cta");
  const [loadingSession, setLoadingSession] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoLoggingIn, setAutoLoggingIn] = useState(false);
  const [activeMockTab, setActiveMockTab] = useState<"console" | "network" | "storage" | "system">("console");

  useEffect(() => {
    // Check if redirecting with provider_token from chrome extension
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("provider_token");
      if (token) {
        setAutoLoggingIn(true);
        fetch("/api/auth/token-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token: token })
        })
          .then(res => {
            if (!res.ok) throw new Error("Token verification failed");
            return res.json();
          })
          .then(data => {
            if (data.actionLink) {
              window.location.assign(data.actionLink);
            } else {
              throw new Error("Invalid token login response");
            }
          })
          .catch(err => {
            console.error("Auto login failed:", err);
            setAutoLoggingIn(false);
            setError("Auto-login failed. Please sign in again.");
          });
        return;
      }
    }

    supabase.auth.getSession()
      .then(({ data }) => {
        setIsLoggedIn(!!data.session?.user);
        setLoadingSession(false);
      })
      .catch(() => {
        setLoadingSession(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
      setLoadingSession(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const faqItems = [
    { q: "landing.faq1q", a: "landing.faq1a" },
    { q: "landing.faq2q", a: "landing.faq2a" },
    { q: "landing.faq3q", a: "landing.faq3a" },
    { q: "landing.faq4q", a: "landing.faq4a" },
    { q: "landing.faq5q", a: "landing.faq5a" },
  ];

  if (autoLoggingIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-7 h-7 text-indigo-600 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <p className="text-sm text-muted font-medium">Verifying session via Extension...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(ellipse_at_top_left,#eef2ff_0%,#ffffff_40%,#f0fdf4_100%)] text-slate-900 font-sans dark:bg-none dark:bg-background dark:text-foreground">

      {/* Navbar */}
      <header className="sticky top-0 z-20 border-b border-white/70 dark:border-border bg-white/80 dark:bg-background/90 backdrop-blur-xl shadow-xs shadow-slate-200/40 dark:shadow-none">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <a href="/" className="group flex items-center gap-2.5 hover:opacity-95 transition-opacity">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="BugSnap" className="w-8 h-8 object-contain transition-transform duration-200 group-hover:scale-105" />
            <span className="text-lg font-bold tracking-tight">BugSnap</span>
          </a>

          <nav className="hidden sm:flex items-center gap-6 text-sm text-muted">
            <Link href="/features" className="hover:text-foreground transition-colors py-1 px-2 rounded-lg hover:bg-slate-100/50 dark:hover:bg-subtle/50">{t("landing.screenRecorder")}</Link>
            <Link href="/how-it-works" className="hover:text-foreground transition-colors py-1 px-2 rounded-lg hover:bg-slate-100/50 dark:hover:bg-subtle/50">{t("landing.howItWorks")}</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors py-1 px-2 rounded-lg hover:bg-slate-100/50 dark:hover:bg-subtle/50">{t("landing.pricing")}</Link>
          </nav>

          <div className="flex items-center gap-3">
            {loadingSession ? (
              <div className="w-28 h-9 bg-slate-200/60 dark:bg-subtle animate-pulse rounded-xl" />
            ) : isLoggedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                </svg>
                <span>{t("landing.goToDashboard")}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200/90 dark:border-border bg-white dark:bg-subtle hover:bg-slate-50 dark:hover:bg-background text-slate-800 dark:text-foreground text-sm font-semibold transition-all duration-200 shadow-xs hover:shadow-sm hover:-translate-y-0.5"
              >
                <GoogleLogo className="w-4 h-4" />
                <span>{t("landing.signInGoogle")}</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main>

        {/* Hero Section */}
        <section className="relative isolate mx-auto max-w-5xl px-6 pt-20 pb-20 text-center">
          {/* Breathing ambient glow orbs */}
          <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-500/25 via-violet-400/25 to-purple-400/20 blur-3xl dark:from-indigo-900/30 dark:via-violet-900/25 dark:to-purple-900/20 animate-pulse-slow" />
          <div className="pointer-events-none absolute top-16 -left-20 -z-10 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-900/20 animate-pulse-slow [animation-delay:2.5s]" />
          <div className="pointer-events-none absolute top-20 -right-20 -z-10 h-72 w-72 rounded-full bg-fuchsia-400/20 blur-3xl dark:bg-fuchsia-900/20 animate-pulse-slow [animation-delay:5s]" />

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-[-0.04em] leading-[0.98]">
            <span className="bg-gradient-to-br from-slate-950 via-indigo-700 to-emerald-600 bg-clip-text text-transparent dark:from-white dark:via-indigo-300 dark:to-emerald-400">
              {t("landing.tagline")}
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-slate-600 dark:text-muted leading-relaxed">
            {t("landing.heroSub")}
          </p>

          {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

          {/* CTA Buttons */}
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="group relative inline-flex items-center gap-2.5 w-full sm:w-auto justify-center rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-8 py-3.5 text-white font-bold text-sm transition-all duration-200 shadow-xl shadow-indigo-600/30 hover:shadow-2xl hover:shadow-indigo-600/40 hover:-translate-y-0.5 active:translate-y-0 border border-indigo-500/50"
                >
                  <svg className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                  </svg>
                  <span>{t("landing.goToDashboard")}</span>
                </Link>
                <a
                  href={CHROME_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 w-full sm:w-auto justify-center rounded-2xl border border-white/80 dark:border-border bg-white/80 dark:bg-subtle hover:bg-white dark:hover:bg-background px-6 py-3.5 text-sm font-bold text-slate-800 dark:text-foreground transition-all duration-200 shadow-lg shadow-slate-200/50 dark:shadow-none hover:shadow-xl hover:-translate-y-0.5 backdrop-blur-xl"
                >
                  <ChromeLogo className="w-4 h-4" />
                  <span>{t("landing.chromeExt")}</span>
                </a>
              </>
            ) : (
              <>
                <a
                  href={CHROME_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackConversion("install_click")}
                  className="group relative inline-flex items-center gap-3 w-full sm:w-auto justify-center rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-7 py-3.5 text-white transition-all duration-200 shadow-xl shadow-indigo-600/30 hover:shadow-2xl hover:shadow-indigo-600/40 hover:-translate-y-0.5 active:translate-y-0 border border-indigo-500/50"
                  title={t("footer.addToChrome")}
                >
                  <ChromeLogo className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                  <div className="flex flex-col text-left leading-tight">
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-indigo-200">
                      {heroCtaVariant === "variant_speed"
                        ? t("landing.ctaVariantSpeedSub")
                        : t("v.availableInThe")}
                    </span>
                    <span className="text-sm font-bold text-white tracking-tight">
                      {heroCtaVariant === "variant_speed"
                        ? t("landing.ctaVariantSpeed")
                        : "Chrome Web Store"}
                    </span>
                  </div>
                  <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 shadow-xs">
                    {t("v.free")}
                  </span>
                </a>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2.5 w-full sm:w-auto justify-center rounded-2xl border border-slate-200/90 dark:border-border bg-white dark:bg-subtle hover:bg-slate-50 dark:hover:bg-background px-6 py-3.5 text-sm font-bold text-slate-800 dark:text-foreground transition-all duration-200 shadow-lg shadow-slate-200/50 dark:shadow-none hover:shadow-xl hover:-translate-y-0.5 backdrop-blur-xl"
                >
                  <GoogleLogo className="w-4 h-4" />
                  <span>{t("landing.signInGoogle")}</span>
                </Link>
                <a
                  href="/pricing"
                  onClick={() => trackConversion("pricing_click")}
                  className="inline-flex items-center gap-2 w-full sm:w-auto justify-center rounded-2xl border border-white/80 dark:border-border bg-white/80 dark:bg-subtle hover:bg-white dark:hover:bg-background px-7 py-3.5 text-sm font-bold text-slate-800 dark:text-foreground transition-all duration-200 shadow-lg shadow-slate-200/50 dark:shadow-none hover:shadow-xl hover:-translate-y-0.5 backdrop-blur-xl"
                >
                  {t("landing.pricing")}
                </a>
              </>
            )}
          </div>

          <p className="mt-6 text-xs font-medium text-slate-500 dark:text-muted">
            {t("landing.noCard")} &middot; {t("landing.trustStrip")}
          </p>

          {/* Interactive Hero Preview Mock Window */}
          <div className="mt-14 relative mx-auto max-w-5xl">
            {/* Ambient glow backing */}
            <div className="pointer-events-none absolute -inset-2 rounded-3xl bg-gradient-to-r from-indigo-500/20 via-purple-500/15 to-emerald-500/20 blur-xl opacity-75 dark:opacity-40 animate-pulse-slow" />

            {/* Window Container with entrance float */}
            <div className="relative rounded-2xl border border-slate-200/90 dark:border-border bg-white/95 dark:bg-[#0f141f] shadow-2xl shadow-slate-300/40 dark:shadow-black/70 backdrop-blur-xl overflow-hidden text-left transition-all duration-300 animate-float hover:[animation-play-state:paused]">

              {/* Window Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/80 dark:border-border bg-slate-100/60 dark:bg-subtle/80">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block shadow-xs" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block shadow-xs" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block shadow-xs" />
                  <span className="ml-2 hidden sm:inline-block font-mono text-xs text-muted">
                    checkout-flow-bug.webm
                  </span>
                </div>

                {/* Center live recording indicator */}
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-mono text-[11px] font-semibold">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                  </span>
                  <span>REC 00:42</span>
                </div>

                {/* Right cloud sync indicator */}
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{t("landing.mockDriveSync")}</span>
                  </span>
                </div>
              </div>

              {/* Window Body: Stream & DevTools split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80 dark:divide-border">

                {/* Left: Video / Screen capture canvas preview */}
                <div className="lg:col-span-7 flex flex-col justify-between bg-slate-50/50 dark:bg-[#0b0e14]/50 p-4 sm:p-5">
                  <div>
                    {/* Simulated browser address bar */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200/80 dark:border-border bg-white dark:bg-subtle text-[11px] font-mono text-muted mb-4 shadow-2xs">
                      <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <span className="truncate">https://store.akusara.internal/checkout</span>
                    </div>

                    {/* App viewport preview */}
                    <div className="rounded-xl border border-slate-200/80 dark:border-border bg-white dark:bg-subtle p-5 shadow-xs space-y-4">
                      <div className="flex items-center justify-between border-b border-border pb-3">
                        <span className="text-xs font-bold text-foreground">{t("landing.mockOrderSummary")}</span>
                        <span className="text-[11px] text-muted">{t("landing.mockItemsCount")} &middot; {t("landing.mockTotalAmount")}</span>
                      </div>

                      <div className="space-y-2">
                        <div className="h-3 w-3/4 rounded bg-slate-100 dark:bg-slate-800" />
                        <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
                      </div>

                      {/* Interactive click ripple demonstration */}
                      <div className="relative pt-2">
                        <div className="relative inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold shadow-xs">
                          {t("landing.mockPayButton")}
                          {/* Click ring indicator */}
                          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-85" />
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500/80 border border-white" />
                          </span>
                        </div>
                      </div>

                      {/* On-screen error toast */}
                      <div className="rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/90 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300 font-medium flex items-center gap-2.5">
                        <svg className="w-4 h-4 text-rose-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span className="font-mono text-[11px]">{t("landing.mockPaymentFailed")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Scrubber timeline bar */}
                  <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-border flex items-center gap-3 text-xs text-muted font-mono">
                    <button type="button" aria-label="Play recording preview" className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs hover:bg-indigo-700 transition-colors">
                      <svg className="w-3 h-3 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </button>
                    <div className="relative flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div className="absolute inset-y-0 left-0 w-3/5 bg-indigo-600 rounded-full" />
                      {/* Timeline event pins */}
                      <span className="absolute top-0 bottom-0 left-[35%] w-1 bg-amber-400" title="Warning" />
                      <span className="absolute top-0 bottom-0 left-[55%] w-1 bg-rose-500" title="Error" />
                    </div>
                    <span className="shrink-0 text-[11px]">00:42 / 01:15</span>
                  </div>
                </div>

                {/* Right: Interactive DevTools Inspection Panel */}
                <div className="lg:col-span-5 flex flex-col bg-white dark:bg-[#0f141f]">

                  {/* DevTools Tab Bar */}
                  <div className="flex items-center border-b border-slate-200/80 dark:border-border overflow-x-auto">
                    <button
                      type="button"
                      onClick={() => setActiveMockTab("console")}
                      className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all duration-200 whitespace-nowrap ${
                        activeMockTab === "console"
                          ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30"
                          : "border-transparent text-muted hover:text-foreground hover:bg-slate-50 dark:hover:bg-subtle/40"
                      }`}
                    >
                      <span>{t("landing.mockTabConsole")}</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60">
                        2
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMockTab("network")}
                      className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all duration-200 whitespace-nowrap ${
                        activeMockTab === "network"
                          ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30"
                          : "border-transparent text-muted hover:text-foreground hover:bg-slate-50 dark:hover:bg-subtle/40"
                      }`}
                    >
                      <span>{t("landing.mockTabNetwork")}</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60">
                        4
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMockTab("storage")}
                      className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all duration-200 whitespace-nowrap ${
                        activeMockTab === "storage"
                          ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30"
                          : "border-transparent text-muted hover:text-foreground hover:bg-slate-50 dark:hover:bg-subtle/40"
                      }`}
                    >
                      <span>{t("landing.mockTabStorage")}</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        3
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMockTab("system")}
                      className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all duration-200 whitespace-nowrap ${
                        activeMockTab === "system"
                          ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30"
                          : "border-transparent text-muted hover:text-foreground hover:bg-slate-50 dark:hover:bg-subtle/40"
                      }`}
                    >
                      <span>{t("landing.mockTabSystem")}</span>
                    </button>
                  </div>

                  {/* DevTools Tab Content */}
                  <div className="p-3.5 space-y-2.5 min-h-[280px] font-mono text-[11px] overflow-y-auto">
                    {activeMockTab === "console" && (
                      <>
                        <div className="rounded-lg border border-rose-200/80 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/30 p-2.5 flex flex-col gap-1 transition-colors">
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                              500 Error
                            </span>
                            <span className="text-[10px] font-mono text-muted">00:41.20</span>
                          </div>
                          <p className="font-mono text-xs font-semibold text-rose-800 dark:text-rose-300 leading-snug">
                            {t("landing.mockConsoleErr")}
                          </p>
                          <span className="text-[10px] font-mono text-muted">at CheckoutForm.tsx:42:18</span>
                        </div>

                        <div className="rounded-lg border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/30 p-2.5 flex flex-col gap-1 transition-colors">
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              Warning
                            </span>
                            <span className="text-[10px] font-mono text-muted">00:39.10</span>
                          </div>
                          <p className="font-mono text-xs font-medium text-amber-800 dark:text-amber-300 leading-snug">
                            {t("landing.mockConsoleWarn")}
                          </p>
                          <span className="text-[10px] font-mono text-muted">at stripe-client.ts:88:9</span>
                        </div>

                        <div className="rounded-lg border border-slate-200/80 dark:border-border bg-slate-50/70 dark:bg-subtle/50 p-2.5 flex flex-col gap-1 transition-colors">
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                              Action
                            </span>
                            <span className="text-[10px] font-mono text-muted">00:38.05</span>
                          </div>
                          <p className="font-mono text-xs font-medium text-foreground leading-snug">
                            {t("landing.mockConsoleClick")}
                          </p>
                          <span className="text-[10px] font-mono text-muted">coordinates: (640, 480)</span>
                        </div>
                      </>
                    )}

                    {activeMockTab === "network" && (
                      <>
                        <div className="rounded-lg border border-rose-200/80 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/30 p-2.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 truncate">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shrink-0">
                              500
                            </span>
                            <span className="font-mono text-xs font-semibold text-rose-800 dark:text-rose-300 truncate">
                              POST /api/v1/checkout/charge
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-muted shrink-0">215ms</span>
                        </div>

                        <div className="rounded-lg border border-emerald-200/80 dark:border-emerald-900/50 bg-emerald-50/70 dark:bg-emerald-950/30 p-2.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 truncate">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0">
                              200 OK
                            </span>
                            <span className="font-mono text-xs font-medium text-foreground truncate">
                              GET /api/v1/cart/items
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-muted shrink-0">42ms</span>
                        </div>

                        <div className="rounded-lg border border-emerald-200/80 dark:border-emerald-900/50 bg-emerald-50/70 dark:bg-emerald-950/30 p-2.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 truncate">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0">
                              200 OK
                            </span>
                            <span className="font-mono text-xs font-medium text-foreground truncate">
                              GET /api/v1/user/profile
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-muted shrink-0">31ms</span>
                        </div>

                        <div className="rounded-lg border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/30 p-2.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 truncate">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shrink-0">
                              429 WARN
                            </span>
                            <span className="font-mono text-xs font-medium text-amber-800 dark:text-amber-300 truncate">
                              POST /api/v1/telemetry
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-muted shrink-0">110ms</span>
                        </div>
                      </>
                    )}

                    {activeMockTab === "storage" && (
                      <div className="space-y-2.5 font-mono text-xs">
                        <div className="rounded-lg border border-slate-200/80 dark:border-border bg-slate-50/60 dark:bg-subtle/50 p-2.5 space-y-1">
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block uppercase tracking-wider">localStorage</span>
                          <div className="space-y-1 text-muted text-[11px]">
                            <div><span className="text-foreground font-semibold">auth_token:</span> &quot;eyJh...982x&quot;</div>
                            <div><span className="text-foreground font-semibold">cart_session:</span> &quot;cart_991823&quot;</div>
                            <div><span className="text-foreground font-semibold">theme_mode:</span> &quot;system&quot;</div>
                          </div>
                        </div>
                        <div className="rounded-lg border border-slate-200/80 dark:border-border bg-slate-50/60 dark:bg-subtle/50 p-2.5 space-y-1">
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block uppercase tracking-wider">sessionStorage</span>
                          <div className="space-y-1 text-muted text-[11px]">
                            <div><span className="text-foreground font-semibold">checkout_step:</span> &quot;payment_review&quot;</div>
                            <div><span className="text-foreground font-semibold">retry_count:</span> &quot;2&quot;</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeMockTab === "system" && (
                      <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                        <div className="rounded-lg border border-slate-200/80 dark:border-border bg-slate-50/60 dark:bg-subtle/50 p-2.5">
                          <span className="text-[10px] text-muted block uppercase tracking-wider">OS</span>
                          <span className="font-semibold text-foreground text-xs">Windows 11 (x64)</span>
                        </div>
                        <div className="rounded-lg border border-slate-200/80 dark:border-border bg-slate-50/60 dark:bg-subtle/50 p-2.5">
                          <span className="text-[10px] text-muted block uppercase tracking-wider">Browser</span>
                          <span className="font-semibold text-foreground text-xs">Chrome 140.0.7100</span>
                        </div>
                        <div className="rounded-lg border border-slate-200/80 dark:border-border bg-slate-50/60 dark:bg-subtle/50 p-2.5">
                          <span className="text-[10px] text-muted block uppercase tracking-wider">Viewport</span>
                          <span className="font-semibold text-foreground text-xs">1920 &times; 1080 (1.25x)</span>
                        </div>
                        <div className="rounded-lg border border-slate-200/80 dark:border-border bg-slate-50/60 dark:bg-subtle/50 p-2.5">
                          <span className="text-[10px] text-muted block uppercase tracking-wider">Memory</span>
                          <span className="font-semibold text-foreground text-xs">Heap: 42 MB / 128 MB</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* How it works - 3 steps */}
        <section className="relative border-t border-white/70 dark:border-border bg-gradient-to-b from-slate-50 to-indigo-50/60 dark:from-background dark:to-background overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(99,102,241,0.07),transparent_60%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.07),transparent_50%)]" />
          <div className="relative mx-auto max-w-5xl px-6 py-20">
            <h2 className="text-center text-2xl sm:text-3xl font-bold tracking-tight mb-12">
              {t("landing.howItWorksTitle")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  step: "01",
                  title: t("landing.step1Title"),
                  body: t("landing.step1Body"),
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  ),
                  color: "bg-gradient-to-br from-indigo-500 to-violet-600",
                  glow: "shadow-indigo-500/25",
                },
                {
                  step: "02",
                  title: t("landing.step2Title"),
                  body: t("landing.step2Body"),
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                      <polyline points="16 18 22 12 16 6" />
                      <polyline points="8 6 2 12 8 18" />
                    </svg>
                  ),
                  color: "bg-gradient-to-br from-amber-400 to-orange-500",
                  glow: "shadow-amber-500/25",
                },
                {
                  step: "03",
                  title: t("landing.step3Title"),
                  body: t("landing.step3Body"),
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  ),
                  color: "bg-gradient-to-br from-emerald-500 to-teal-600",
                  glow: "shadow-emerald-500/25",
                },
              ].map(({ step, title, body, icon, color, glow }) => (
                <div
                  key={step}
                  className="group rounded-2xl border border-white/80 dark:border-border bg-white/80 dark:bg-subtle p-8 shadow-lg shadow-slate-200/50 dark:shadow-none backdrop-blur-sm hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
                >
                  <div className={`w-12 h-12 rounded-xl ${color} text-white flex items-center justify-center shadow-lg ${glow} group-hover:scale-110 transition-transform duration-300`}>
                    {icon}
                  </div>
                  <div className="mt-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50">
                      {step}
                    </span>
                    <h3 className="mt-2 text-base font-bold text-slate-900 dark:text-foreground">{title}</h3>
                    <p className="mt-2 text-xs text-slate-600 dark:text-muted leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link href="/how-it-works" className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors hover:-translate-y-0.5 group">
                {t("landing.seeFullWalkthrough")}
              </Link>
            </div>
          </div>
        </section>

        {/* Bento Grid / Core Features */}
        <section className="relative border-t border-white/70 dark:border-border bg-white/60 dark:bg-background py-20">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-center text-2xl sm:text-3xl font-bold tracking-tight mb-12">
              <span className="bg-gradient-to-r from-slate-900 via-indigo-800 to-slate-900 dark:from-white dark:via-indigo-300 dark:to-white bg-clip-text text-transparent">
                {t("landing.featuresTitle")}
              </span>
            </h2>

            {/* Bento Grid: 4 complementary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Bento Card 1 (Wide 2 columns): Automated DevTools Context */}
              <div className="md:col-span-2 group relative overflow-hidden rounded-2xl border border-white/80 dark:border-border hover:border-indigo-500/50 dark:hover:border-indigo-500/40 bg-white/80 dark:bg-subtle p-8 flex flex-col justify-between shadow-lg shadow-slate-200/50 dark:shadow-none backdrop-blur-sm hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                <div className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div>
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40">
                    {t("landing.pill1Title")}
                  </span>
                  <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-foreground leading-snug">
                    {t("landing.f2Title")}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 dark:text-muted leading-relaxed">
                    {t("landing.f2Body")}
                  </p>
                </div>

                {/* Visual Mini Terminal Strip */}
                <div className="mt-6 rounded-xl border border-slate-200/80 dark:border-border bg-slate-900 text-slate-200 p-3 font-mono text-[11px] space-y-1.5 shadow-inner">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pb-1 border-b border-slate-800">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="ml-1">Telemetry Monitor</span>
                  </div>
                  <div className="flex items-center justify-between text-rose-400">
                    <span>POST /api/v1/checkout 500</span>
                    <span className="text-[10px] text-slate-500">142ms</span>
                  </div>
                  <div className="text-amber-300 text-[10px]">
                    Console.warn: Token expired at auth.ts:18
                  </div>
                </div>
              </div>

              {/* Bento Card 2 (1 column): 100% Data Ownership in Google Drive */}
              <div className="group relative overflow-hidden rounded-2xl border border-white/80 dark:border-border hover:border-indigo-500/50 dark:hover:border-indigo-500/40 bg-white/80 dark:bg-subtle p-8 flex flex-col justify-between shadow-lg shadow-slate-200/50 dark:shadow-none backdrop-blur-sm hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                <div className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div>
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40">
                    {t("landing.pill2Title")}
                  </span>
                  <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-foreground leading-snug">
                    {t("landing.freeForever")}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 dark:text-muted leading-relaxed">
                    {t("landing.pill2Desc")}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-center p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9" />
                      <polyline points="13 11 9 7 5 11" />
                    </svg>
                    <span>Google Drive Synced</span>
                  </div>
                </div>
              </div>

              {/* Bento Card 3 (1 column): Hotkeys Screen & Video Capture */}
              <div className="group relative overflow-hidden rounded-2xl border border-white/80 dark:border-border hover:border-indigo-500/50 dark:hover:border-indigo-500/40 bg-white/80 dark:bg-subtle p-8 flex flex-col justify-between shadow-lg shadow-slate-200/50 dark:shadow-none backdrop-blur-sm hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                <div className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div>
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800/40">
                    {t("landing.screenRecorder")}
                  </span>
                  <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-foreground leading-snug">
                    {t("landing.f1Title")}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 dark:text-muted leading-relaxed">
                    {t("landing.f1Body")}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-semibold text-foreground">
                    Ctrl+Shift+S
                  </span>
                  <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-semibold text-foreground">
                    Ctrl+Shift+F
                  </span>
                </div>
              </div>

              {/* Bento Card 4 (Wide 2 columns): Instant Sharing & Integrations */}
              <div className="md:col-span-2 group relative overflow-hidden rounded-2xl border border-white/80 dark:border-border hover:border-indigo-500/50 dark:hover:border-indigo-500/40 bg-white/80 dark:bg-subtle p-8 flex flex-col justify-between shadow-lg shadow-slate-200/50 dark:shadow-none backdrop-blur-sm hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                <div className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full bg-violet-500/10 dark:bg-violet-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div>
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800/40">
                    {t("landing.pill3Title")}
                  </span>
                  <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-foreground leading-snug">
                    {t("landing.f3Title")}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 dark:text-muted leading-relaxed">
                    {t("landing.f3Body")}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-2.5">
                  <div className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-border bg-slate-50 dark:bg-subtle/60 text-xs font-mono text-muted flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    <span>bugsnap.link/c/8f921</span>
                  </div>
                  <span className="text-[11px] font-semibold text-muted px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">Jira</span>
                  <span className="text-[11px] font-semibold text-muted px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">Linear</span>
                  <span className="text-[11px] font-semibold text-muted px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">GitHub</span>
                  <span className="text-[11px] font-semibold text-muted px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">Slack</span>
                </div>
              </div>

            </div>

            <div className="mt-10 text-center">
              <Link href="/features" className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors hover:-translate-y-0.5 group">
                {t("landing.exploreFeatures")}
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="border-t border-white/70 dark:border-border bg-gradient-to-b from-slate-50/70 to-indigo-50/30 dark:from-background dark:to-background py-20">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center mb-12">
              {t("landing.faq")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {faqItems.map((faq, i) => (
                <div key={i} className="group rounded-xl bg-white/70 dark:bg-subtle/60 border border-white/80 dark:border-border p-5 shadow-xs hover:shadow-md hover:border-indigo-300/60 dark:hover:border-indigo-500/40 hover:-translate-y-0.5 transition-all duration-200">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-foreground">{t(faq.q)}</h4>
                  <p className="mt-2 text-xs text-slate-600 dark:text-muted leading-relaxed">{t(faq.a)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA Section */}
        <section className="relative isolate mx-auto max-w-5xl px-6 py-20 text-center">
          {/* Ambient background glow pulse */}
          <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
            <div className="h-72 w-[40rem] rounded-full bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-emerald-500/20 blur-3xl dark:from-indigo-900/25 dark:via-purple-900/20 dark:to-emerald-900/20 animate-pulse-slow" />
          </div>

          {/* Glass container with vibrant gradient accents */}
          <div className="relative rounded-3xl border border-white/80 dark:border-border/80 bg-white/80 dark:bg-subtle/80 p-8 sm:p-14 shadow-2xl shadow-slate-200/60 dark:shadow-none backdrop-blur-xl overflow-hidden hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-all duration-300">
            <div className="pointer-events-none absolute -top-24 -left-24 h-48 w-48 rounded-full bg-indigo-500/15 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-emerald-500/15 blur-2xl" />

            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-tight max-w-2xl mx-auto">
              {t("landing.cta2")}
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-muted max-w-xl mx-auto leading-relaxed">
              {t("landing.ctaHint")}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              {isLoggedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2.5 w-full sm:w-auto justify-center rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-8 py-3.5 text-white font-bold text-sm transition-all duration-200 shadow-xl shadow-indigo-600/30 hover:shadow-2xl hover:shadow-indigo-600/40 hover:-translate-y-0.5 border border-indigo-500/50"
                  >
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="14" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                    </svg>
                    <span>{t("landing.goToDashboard")}</span>
                  </Link>
                  <a
                    href={CHROME_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 w-full sm:w-auto justify-center rounded-2xl border border-border/80 dark:border-border bg-white/90 dark:bg-subtle hover:bg-white dark:hover:bg-background px-7 py-3.5 text-sm font-bold text-foreground transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 backdrop-blur-xl"
                  >
                    <ChromeLogo className="w-4 h-4" />
                    <span>{t("landing.chromeExt")}</span>
                  </a>
                </>
              ) : (
                <>
                  <a
                    href={CHROME_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackConversion("install_click")}
                    className="group inline-flex items-center gap-3 w-full sm:w-auto justify-center rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-7 py-3.5 text-white transition-all duration-200 shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:-translate-y-0.5 border border-indigo-500/50"
                  >
                    <ChromeLogo className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                    <span className="text-sm font-bold text-white tracking-tight">
                      {t("landing.cta")}
                    </span>
                  </a>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2.5 w-full sm:w-auto justify-center rounded-2xl border border-border/80 dark:border-border bg-white/90 dark:bg-subtle hover:bg-white dark:hover:bg-background px-6 py-3.5 text-sm font-bold text-foreground transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 backdrop-blur-xl"
                  >
                    <GoogleLogo className="w-4 h-4" />
                    <span>{t("landing.signInGoogle")}</span>
                  </Link>
                  <a
                    href="/pricing"
                    onClick={() => trackConversion("pricing_click")}
                    className="inline-flex items-center gap-2 w-full sm:w-auto justify-center rounded-2xl border border-border/80 dark:border-border bg-white/90 dark:bg-subtle hover:bg-white dark:hover:bg-background px-7 py-3.5 text-sm font-bold text-foreground transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 backdrop-blur-xl"
                  >
                    {t("landing.pricing")}
                  </a>
                </>
              )}
            </div>

            <p className="mt-5 text-xs text-muted">
              {t("landing.noCard")}
            </p>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 pb-8 border-b border-border">
            {/* Brand column */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon.svg" alt="" aria-hidden="true" className="w-6 h-6 object-contain" />
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold">BugSnap</span>
                  <span className="text-[11px] text-muted">From Click to Fix &middot; by <a href="https://akusaradigital.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">akusaradigital.com</a></span>
                </div>
              </div>
              <p className="text-xs text-muted max-w-xs leading-relaxed">
                {t("landing.footDesc")}
              </p>
            </div>

            {/* Product */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("landing.product")}</h5>
              <ul className="space-y-2 text-xs text-muted">
                <li><Link href="/features" className="hover:text-foreground transition-colors">{t("landing.screenRecorder")}</Link></li>
                <li><Link href="/features#devtools" className="hover:text-foreground transition-colors">{t("landing.devTools")}</Link></li>
                <li><Link href="/how-it-works" className="hover:text-foreground transition-colors">{t("landing.howItWorks")}</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground transition-colors">{t("landing.pricing")}</Link></li>
                <li><Link href="/security" className="hover:text-foreground transition-colors">{t("landing.security")}</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("landing.resources")}</h5>
              <ul className="space-y-2 text-xs text-muted">
                <li><Link href="/docs" className="hover:text-foreground transition-colors">{t("landing.docs")}</Link></li>
                <li><Link href="/help" className="hover:text-foreground transition-colors">{t("landing.help")}</Link></li>
                <li><a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">{t("landing.chromeExt")}</a></li>
                <li><Link href="/status" className="hover:text-foreground transition-colors">{t("landing.apiStatus")}</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">{t("landing.privacy")}</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">{t("landing.terms")}</Link></li>
                <li><Link href="/contact" className="hover:text-foreground transition-colors">{t("landing.contact")}</Link></li>
              </ul>
            </div>

            {/* Akusara Suite */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("landing.ecosystemEyebrow")}</h5>
              <ul className="space-y-2 text-xs text-muted">
                <li>
                  <span className="font-medium text-foreground">BugSnap</span>
                  {" · "}
                  {t("landing.ecosystemBugSnapLabel")}
                </li>
                <li>
                  <a
                    href={process.env.NEXT_PUBLIC_AKSORA_URL || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-foreground hover:text-indigo-600 transition-colors"
                  >
                    {t("landing.ecosystemAksoraTitle")}
                  </a>
                  {" · "}
                  {t("landing.ecosystemAksoraBrief")}
                </li>
                <li>
                  <a
                    href={process.env.NEXT_PUBLIC_SNAPTEST_URL || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-foreground hover:text-indigo-600 transition-colors"
                  >
                    {t("landing.ecosystemSnapTestTitle")}
                  </a>
                  {" · "}
                  {t("landing.ecosystemSnapTestBrief")}
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted">
              {t("landing.copyright", { year: new Date().getFullYear() })}
            </p>
            <p className="text-xs text-muted">
              {t("landing.builtOn")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
