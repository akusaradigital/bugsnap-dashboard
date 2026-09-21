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
  const [heroFeatureMode, setHeroFeatureMode] = useState<"devtools" | "annotation" | "share">("devtools");
  const [copiedHeroLink, setCopiedHeroLink] = useState(false);
  const [isPlayingHero, setIsPlayingHero] = useState(false);
  const [heroProgress, setHeroProgress] = useState(56); // 56% = 00:42 marker
  const [activeIntegrationPreview, setActiveIntegrationPreview] = useState<"jira" | "linear" | "github" | "slack">("jira");
  const [bentoDevMode, setBentoDevMode] = useState<"terminal" | "curl" | "json">("terminal");
  const [bentoCopied, setBentoCopied] = useState(false);
  const [activeFaqCategory, setActiveFaqCategory] = useState<"all" | "privacy" | "devtools" | "integrations">("all");
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  // Playback timer effect for hero preview
  useEffect(() => {
    if (!isPlayingHero) return;
    const interval = setInterval(() => {
      setHeroProgress((prev) => {
        if (prev >= 100) {
          setIsPlayingHero(false);
          return 0;
        }
        const next = prev + 1;
        // Auto-switch tabs at key milestones during playback
        if (next >= 10 && next < 15) {
          setActiveMockTab("console");
        } else if (next >= 50 && next < 60) {
          setActiveMockTab("network");
        }
        return next;
      });
    }, 160);
    return () => clearInterval(interval);
  }, [isPlayingHero]);

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

  const faqItems: { id: number; q: string; a: string; category: "privacy" | "devtools" | "integrations" }[] = [
    // 1
    { id: 1, q: "landing.faq1q", a: "landing.faq1a", category: "devtools" },
    { id: 2, q: "landing.faq2q", a: "landing.faq2a", category: "privacy" },
    { id: 4, q: "landing.faq4q", a: "landing.faq4a", category: "integrations" },
    // 2
    { id: 10, q: "landing.faq10q", a: "landing.faq10a", category: "devtools" },
    { id: 3, q: "landing.faq3q", a: "landing.faq3a", category: "privacy" },
    { id: 6, q: "landing.faq6q", a: "landing.faq6a", category: "integrations" },
    // 3
    { id: 11, q: "landing.faq11q", a: "landing.faq11a", category: "devtools" },
    { id: 5, q: "landing.faq5q", a: "landing.faq5a", category: "privacy" },
    { id: 15, q: "landing.faq15q", a: "landing.faq15a", category: "integrations" },
    // 4
    { id: 12, q: "landing.faq12q", a: "landing.faq12a", category: "devtools" },
    { id: 7, q: "landing.faq7q", a: "landing.faq7a", category: "privacy" },
    { id: 16, q: "landing.faq16q", a: "landing.faq16a", category: "integrations" },
    // 5
    { id: 13, q: "landing.faq13q", a: "landing.faq13a", category: "devtools" },
    { id: 8, q: "landing.faq8q", a: "landing.faq8a", category: "privacy" },
    { id: 17, q: "landing.faq17q", a: "landing.faq17a", category: "integrations" },
    // 6
    { id: 14, q: "landing.faq14q", a: "landing.faq14a", category: "devtools" },
    { id: 9, q: "landing.faq9q", a: "landing.faq9a", category: "privacy" },
    { id: 18, q: "landing.faq18q", a: "landing.faq18a", category: "integrations" },
  ];

  if (autoLoggingIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-7 h-7 text-[#6B9A35] dark:text-[#A8D666] animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <p className="text-sm text-muted font-medium">Verifying session via Extension...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[radial-gradient(ellipse_at_top_left,#eef2ff_0%,#ffffff_40%,#f0fdf4_100%)] text-slate-900 font-sans dark:bg-none dark:bg-background dark:text-foreground">

      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/70 dark:border-border bg-white/80 dark:bg-background/90 backdrop-blur-xl shadow-xs shadow-slate-200/40 dark:shadow-none">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 sm:px-8 py-3.5 sm:py-4">
          <a href="/" className="group flex items-center gap-2 sm:gap-2.5 hover:opacity-95 transition-opacity">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="BugSnap" className="w-7 h-7 sm:w-8 sm:h-8 object-contain transition-transform duration-200 group-hover:scale-105" />
            <span className="text-base sm:text-lg font-bold tracking-tight">BugSnap</span>
          </a>

          <nav className="hidden sm:flex items-center gap-6 text-sm text-muted">
            <Link href="/features" className="hover:text-foreground transition-colors py-1 px-2 rounded-lg hover:bg-slate-100/50 dark:hover:bg-subtle/50">{t("landing.screenRecorder")}</Link>
            <Link href="/how-it-works" className="hover:text-foreground transition-colors py-1 px-2 rounded-lg hover:bg-slate-100/50 dark:hover:bg-subtle/50">{t("landing.howItWorks")}</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors py-1 px-2 rounded-lg hover:bg-slate-100/50 dark:hover:bg-subtle/50">{t("landing.pricing")}</Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {loadingSession ? (
              <div className="w-24 sm:w-28 h-8 sm:h-9 bg-slate-200/60 dark:bg-subtle animate-pulse rounded-xl" />
            ) : isLoggedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-[#89BD49] text-white text-xs sm:text-sm font-bold hover:bg-[#6B9A35] transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>{t("landing.goToDashboard")}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border border-slate-200/90 dark:border-border bg-white dark:bg-subtle hover:bg-slate-50 dark:hover:bg-background text-slate-800 dark:text-foreground text-xs sm:text-sm font-semibold transition-all duration-200 shadow-xs hover:shadow-sm hover:-translate-y-0.5"
              >
                <GoogleLogo className="w-4 h-4" />
                <span>{t("landing.signInGoogle")}</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="overflow-x-clip">

        {/* Hero Section */}
        <section className="relative isolate mx-auto max-w-6xl px-4 sm:px-8 pt-12 sm:pt-20 pb-14 sm:pb-20 text-center">
          {/* Breathing ambient glow orbs */}
          <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-[#89BD49]/20 via-[#6B9A35]/15 to-emerald-400/20 blur-3xl dark:from-[#89BD49]/15 dark:via-emerald-950/25 dark:to-teal-950/20 animate-pulse-slow" />
          <div className="pointer-events-none absolute top-16 -left-20 -z-10 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-900/20 animate-pulse-slow [animation-delay:2.5s]" />
          <div className="pointer-events-none absolute top-20 -right-20 -z-10 h-72 w-72 rounded-full bg-lime-400/15 blur-3xl dark:bg-lime-900/10 animate-pulse-slow [animation-delay:5s]" />

          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-[-0.04em] leading-[1.05] sm:leading-[0.98] text-slate-900 dark:text-foreground">
            {t("landing.tagline")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-slate-600 dark:text-muted leading-relaxed">
            {t("landing.heroSub")}
          </p>

          {error && <p className="mt-3 text-xs text-red-600 dark:text-red-400">{error}</p>}

          {/* CTA Buttons */}
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackConversion("install_click")}
              className="group relative inline-flex items-center gap-3 w-full sm:w-auto justify-center rounded-2xl bg-[#89BD49] hover:bg-[#6B9A35] px-7 py-3.5 text-white transition-all duration-200 shadow-xl shadow-[#89BD49]/25 hover:shadow-2xl hover:shadow-[#89BD49]/35 hover:-translate-y-0.5 active:translate-y-0 border border-[#89BD49]/50"
              title={t("footer.addToChrome")}
            >
              <ChromeLogo className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[9px] font-semibold uppercase tracking-wider text-white/80">
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
            </a>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 w-full sm:w-auto justify-center rounded-2xl border border-white/80 dark:border-border bg-white/80 dark:bg-subtle hover:bg-white dark:hover:bg-background px-7 py-3.5 text-sm font-bold text-slate-800 dark:text-foreground transition-all duration-200 shadow-lg shadow-slate-200/50 dark:shadow-none hover:shadow-xl hover:-translate-y-0.5 backdrop-blur-xl"
            >
              {t("landing.howItWorks")}
            </Link>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("interactive-preview");
                el?.scrollIntoView({ behavior: "smooth" });
                setHeroFeatureMode("devtools");
              }}
              className="inline-flex items-center gap-2 w-full sm:w-auto justify-center rounded-2xl border border-[#89BD49]/40 bg-[#89BD49]/10 hover:bg-[#89BD49]/20 text-[#6B9A35] dark:text-[#A8D666] px-6 py-3.5 text-sm font-bold transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" />
              </svg>
              <span>{t("landing.heroLiveDemo")}</span>
            </button>
          </div>

          <p className="mt-6 text-xs font-medium text-slate-600 dark:text-muted">
            {t("landing.heroTrustNote")}
          </p>

          {/* Key Developer Metrics Strip (sleek rectangular grid, no pills) */}
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl mx-auto text-left">
            <div className="p-3.5 rounded-xl border border-border/70 bg-white/60 dark:bg-subtle/40 backdrop-blur-xs hover:border-[#89BD49]/40 transition-colors">
              <span className="text-xl sm:text-2xl font-black font-mono text-[#6B9A35] dark:text-[#A8D666] block">
                {t("landing.metricSpeedVal")}
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-foreground block mt-0.5">
                {t("landing.metricSpeedLabel")}
              </span>
              <span className="text-[10px] text-muted block mt-0.5 leading-tight">
                {t("landing.metricSpeedSub")}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-border/70 bg-white/60 dark:bg-subtle/40 backdrop-blur-xs hover:border-emerald-500/40 transition-colors">
              <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 block">
                {t("landing.metricOwnershipVal")}
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-foreground block mt-0.5">
                {t("landing.metricOwnershipLabel")}
              </span>
              <span className="text-[10px] text-muted block mt-0.5 leading-tight">
                {t("landing.metricOwnershipSub")}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-border/70 bg-white/60 dark:bg-subtle/40 backdrop-blur-xs hover:border-teal-500/40 transition-colors">
              <span className="text-xl sm:text-2xl font-black font-mono text-teal-600 dark:text-teal-400 block">
                {t("landing.metricZeroTrackVal")}
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-foreground block mt-0.5">
                {t("landing.metricZeroTrackLabel")}
              </span>
              <span className="text-[10px] text-muted block mt-0.5 leading-tight">
                {t("landing.metricZeroTrackSub")}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-border/70 bg-white/60 dark:bg-subtle/40 backdrop-blur-xs hover:border-cyan-500/40 transition-colors">
              <span className="text-xl sm:text-2xl font-black font-mono text-cyan-600 dark:text-cyan-400 block">
                {t("landing.metricShareTimeVal")}
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-foreground block mt-0.5">
                {t("landing.metricShareTimeLabel")}
              </span>
              <span className="text-[10px] text-muted block mt-0.5 leading-tight">
                {t("landing.metricShareTimeSub")}
              </span>
            </div>
          </div>

          {/* Hero Feature Switcher Tabs (clean rectangular, no pills) */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setHeroFeatureMode("devtools")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                heroFeatureMode === "devtools"
                  ? "bg-[#89BD49] text-white shadow-sm shadow-[#89BD49]/25"
                  : "bg-white/80 dark:bg-subtle text-muted hover:text-foreground border border-border/70 hover:border-[#89BD49]/40"
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              <span>{t("landing.heroTabDevTools")}</span>
            </button>

            <button
              type="button"
              onClick={() => setHeroFeatureMode("annotation")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                heroFeatureMode === "annotation"
                  ? "bg-[#89BD49] text-white shadow-sm shadow-[#89BD49]/25"
                  : "bg-white/80 dark:bg-subtle text-muted hover:text-foreground border border-border/70 hover:border-[#89BD49]/40"
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              <span>{t("landing.heroTabAnnotation")}</span>
            </button>

            <button
              type="button"
              onClick={() => setHeroFeatureMode("share")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                heroFeatureMode === "share"
                  ? "bg-[#89BD49] text-white shadow-sm shadow-[#89BD49]/25"
                  : "bg-white/80 dark:bg-subtle text-muted hover:text-foreground border border-border/70 hover:border-[#89BD49]/40"
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <span>{t("landing.heroTabShare")}</span>
            </button>
          </div>

          {/* Interactive Hero Preview Mock Window */}
          <div className="mt-14 relative mx-auto max-w-6xl">
            {/* Ambient glow backing */}
            <div className="pointer-events-none absolute -inset-2 rounded-3xl bg-gradient-to-r from-[#89BD49]/20 via-[#6B9A35]/15 to-emerald-500/20 blur-xl opacity-75 dark:opacity-40 animate-pulse-slow" />

            {/* Window Container with entrance float */}
            <div id="interactive-preview" className="relative rounded-2xl border border-slate-200/90 dark:border-border bg-white/95 dark:bg-[#0f141f] shadow-2xl shadow-slate-300/40 dark:shadow-black/70 backdrop-blur-xl overflow-hidden text-left transition-all duration-300 animate-float hover:[animation-play-state:paused]">

              {/* Window Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/80 dark:border-border bg-slate-100/60 dark:bg-subtle/80">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block shadow-xs" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block shadow-xs" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block shadow-xs" />
                  <span className="ml-2 hidden sm:inline-block font-mono text-xs text-muted">
                    {heroFeatureMode === "devtools"
                      ? "checkout-flow-bug.webm"
                      : heroFeatureMode === "annotation"
                      ? "checkout-broken-ui.png"
                      : "share-link-preview.webm"}
                  </span>
                </div>

                {/* Center live indicator (rectangular tag, no pills) */}
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-mono text-[11px] font-semibold">
                  {heroFeatureMode === "devtools" ? (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className={`${isPlayingHero ? "animate-ping" : ""} absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75`} />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                      </span>
                      <span>
                        REC {Math.floor((heroProgress / 100) * 75).toString().padStart(2, "0")}:{Math.round(((heroProgress / 100) * 75) % 60).toString().padStart(2, "0")}
                      </span>
                    </>
                  ) : heroFeatureMode === "annotation" ? (
                    <>
                      <span className="w-2 h-2 rounded-xs bg-amber-500" />
                      <span className="text-amber-600 dark:text-amber-400">ANNOTATE MODE</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-xs bg-[#89BD49]" />
                      <span className="text-[#6B9A35] dark:text-[#A8D666]">PUBLIC LINK</span>
                    </>
                  )}
                </div>

                {/* Right cloud sync indicator (rectangular tag, no pills) */}
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-xs bg-emerald-500" />
                    <span>{t("landing.mockDriveSync")}</span>
                  </span>
                </div>
              </div>

              {/* Annotation Mode View */}
              {heroFeatureMode === "annotation" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80 dark:divide-border">
                  {/* Left Canvas with Tools */}
                  <div className="lg:col-span-8 flex flex-col justify-between bg-slate-50/50 dark:bg-[#0b0e14]/50 p-4 sm:p-5">
                    <div>
                      {/* Annotation Toolbar (sleek rectangular buttons) */}
                      <div className="flex items-center gap-1.5 p-1.5 mb-4 rounded-xl border border-slate-200/80 dark:border-border bg-white dark:bg-subtle text-xs shadow-2xs overflow-x-auto">
                        <span className="px-2.5 py-1 rounded-lg bg-[#89BD49] text-white font-semibold flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                          <span>Arrow</span>
                        </span>
                        <span className="px-2.5 py-1 rounded-lg text-muted hover:text-foreground flex items-center gap-1.5 border border-transparent hover:border-border">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                          </svg>
                          <span>Box</span>
                        </span>
                        <span className="px-2.5 py-1 rounded-lg text-muted hover:text-foreground flex items-center gap-1.5 border border-transparent hover:border-border">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="4 7 4 4 20 4 20 7" />
                            <line x1="9" y1="20" x2="15" y2="20" />
                            <line x1="12" y1="4" x2="12" y2="20" />
                          </svg>
                          <span>Text</span>
                        </span>
                        <span className="px-2.5 py-1 rounded-lg text-muted hover:text-foreground flex items-center gap-1.5 border border-transparent hover:border-border">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                          </svg>
                          <span>Blur</span>
                        </span>
                        <span className="ml-auto flex items-center gap-1">
                          <span className="w-4 h-4 rounded bg-rose-500 border-2 border-white shadow-2xs" />
                          <span className="w-4 h-4 rounded bg-amber-500" />
                          <span className="w-4 h-4 rounded bg-[#89BD49]" />
                        </span>
                      </div>

                      {/* Annotated Canvas */}
                      <div className="relative rounded-xl border border-slate-200/80 dark:border-border bg-white dark:bg-subtle p-6 shadow-xs min-h-[300px]">
                        <div className="flex items-center justify-between border-b border-border pb-3">
                          <span className="text-xs font-bold text-foreground">Checkout Form</span>
                          <span className="text-[11px] text-muted">Viewport: Mobile 375x812</span>
                        </div>

                        <div className="mt-4 space-y-3">
                          <div className="h-4 w-48 rounded bg-slate-100 dark:bg-slate-800" />
                          <div className="h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-subtle/50 px-3 flex items-center text-xs text-muted">
                            card_number: **** **** **** 4242
                          </div>
                        </div>

                        {/* Annotated Red Box */}
                        <div className="mt-6 p-4 rounded-xl border-2 border-dashed border-rose-500 bg-rose-500/5">
                          <div className="flex items-center justify-between">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold shadow-xs">
                              <span>Pay $120.00</span>
                            </div>
                            {/* Callout Tag (no pills) */}
                            <div className="px-2.5 py-1 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-[11px] font-mono font-semibold flex items-center gap-1.5 shadow-xs">
                              <span>#1 CTA clipped by footer</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-border flex items-center justify-between text-xs text-muted font-mono">
                      <span>Original Resolution: 1920 &times; 1080</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Ready to export &middot; PNG</span>
                    </div>
                  </div>

                  {/* Right Inspector: Annotation Layers */}
                  <div className="lg:col-span-4 flex flex-col bg-white dark:bg-[#0f141f] p-4 space-y-4">
                    <div className="border-b border-border pb-2.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground">Annotations (2)</span>
                    </div>
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-lg border border-rose-200/80 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-rose-700 dark:text-rose-300">Highlight Box</span>
                          <span className="font-mono text-[10px] text-muted">#E11D48</span>
                        </div>
                        <p className="text-[11px] text-rose-800 dark:text-rose-300">CTA clipped on mobile viewport</p>
                      </div>
                      <div className="p-2.5 rounded-lg border border-slate-200/80 dark:border-border bg-slate-50 dark:bg-subtle/50 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground">Callout Note</span>
                          <span className="font-mono text-[10px] text-muted">Pin #1</span>
                        </div>
                        <p className="text-[11px] text-muted">Severity: Blocker for checkout conversion</p>
                      </div>
                    </div>
                    <div className="mt-auto pt-4 border-t border-border flex gap-2">
                      <a
                        href={CHROME_STORE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full text-center py-2 rounded-xl bg-[#89BD49] hover:bg-[#6B9A35] text-white text-xs font-bold transition-all shadow-sm shadow-[#89BD49]/20"
                      >
                        Try Annotation Tool
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Instant Share Link View */}
              {heroFeatureMode === "share" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80 dark:divide-border">
                  {/* Left: Share Link & Privacy Config */}
                  <div className="lg:col-span-7 flex flex-col justify-between bg-slate-50/50 dark:bg-[#0b0e14]/50 p-5 sm:p-6 space-y-6">
                    <div className="space-y-4">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-[#6B9A35] dark:text-[#A8D666]">Instant Shareable Link</span>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-foreground mt-1">Anyone with link can view</h3>
                        <p className="text-xs text-muted leading-relaxed mt-1">DevTools logs, DOM events, and video are bundled into a single secure URL.</p>
                      </div>

                      {/* Interactive Link Copy Box */}
                      <div className="flex items-center gap-2 p-2 rounded-xl border border-border/80 bg-white dark:bg-subtle shadow-xs">
                        <div className="flex-1 flex items-center gap-2 px-2 font-mono text-xs text-slate-800 dark:text-slate-200 truncate">
                          <svg className="w-4 h-4 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                          </svg>
                          <span className="truncate">https://bugsnap.akusaraproject.my.id/v/8f921a</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof navigator !== "undefined" && navigator.clipboard) {
                              navigator.clipboard.writeText("https://bugsnap.akusaraproject.my.id/v/8f921a");
                            }
                            setCopiedHeroLink(true);
                            setTimeout(() => setCopiedHeroLink(false), 2500);
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-[#89BD49] hover:bg-[#6B9A35] text-white text-xs font-bold transition-all shadow-xs shrink-0 flex items-center gap-1.5"
                        >
                          {copiedHeroLink ? (
                            <>
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Privacy & Access Controls */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                        <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-xs">
                          <span className="font-bold text-emerald-800 dark:text-emerald-300 block">Google Drive Storage</span>
                          <span className="text-[11px] text-muted">File: /BugSnap/checkout-flow.webm</span>
                        </div>
                        <div className="p-3 rounded-lg border border-border/70 bg-white dark:bg-subtle text-xs">
                          <span className="font-bold text-foreground block">Zero Server Lock-In</span>
                          <span className="text-[11px] text-muted">Your Google account owns the raw files</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200/70 dark:border-border text-xs text-muted flex items-center justify-between">
                      <span>Capture ID: #8f921a</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">Public Access Enabled</span>
                    </div>
                  </div>

                  {/* Right: 1-Click Issue Tracker Dispatch */}
                  <div className="lg:col-span-5 flex flex-col bg-white dark:bg-[#0f141f] p-5 space-y-4">
                    <div className="border-b border-border pb-2.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground">{t("landing.ticketPreviewTitle")}</span>
                    </div>

                    {/* Integration selector tabs (geometric rounded-xl, no pills) */}
                    <div className="grid grid-cols-4 gap-1 sm:gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-subtle/80 border border-border/80">
                      {[
                        { key: "jira", label: "Jira", color: "bg-blue-600" },
                        { key: "linear", label: "Linear", color: "bg-purple-600" },
                        { key: "github", label: "GitHub", color: "bg-slate-900 dark:bg-slate-800" },
                        { key: "slack", label: "Slack", color: "bg-[#4A154B]" },
                      ].map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setActiveIntegrationPreview(item.key as "jira" | "linear" | "github" | "slack")}
                          className={`py-1.5 px-1 sm:px-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
                            activeIntegrationPreview === item.key
                              ? "bg-white dark:bg-[#0f141f] text-foreground shadow-xs border border-border"
                              : "text-muted hover:text-foreground"
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-xs ${item.color} shrink-0`} />
                          <span className="truncate">{item.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Dynamic Auto-Generated Ticket Preview Card */}
                    <div className="p-3.5 rounded-xl border border-border/80 bg-slate-50/70 dark:bg-subtle/50 space-y-3 text-left">
                      <div className="flex items-center justify-between border-b border-border pb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-[#89BD49]/15 text-[#6B9A35] dark:text-[#A8D666] border border-[#89BD49]/30">
                            {activeIntegrationPreview === "jira"
                              ? "BUG-4029"
                              : activeIntegrationPreview === "linear"
                              ? "ENG-1082"
                              : activeIntegrationPreview === "github"
                              ? "#142"
                              : "#alerts-qa"}
                          </span>
                          <span className="text-xs font-bold text-foreground truncate max-w-[160px]">
                            {activeIntegrationPreview === "slack" ? "Production Alert" : "POST /charge 500 error"}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                          P0 Blocker
                        </span>
                      </div>

                      <div className="space-y-1.5 text-[11px] text-muted">
                        <p className="font-mono text-slate-800 dark:text-slate-200 text-[11px] leading-relaxed">
                          {activeIntegrationPreview === "slack"
                            ? "@here BugSnap captured checkout failure on Win11 Chrome 140:"
                            : "Reproduction: User clicks Pay Now, /api/charge returns HTTP 500."}
                        </p>
                        <div className="space-y-1 pt-1 font-mono text-[10px]">
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <span className="w-1.5 h-1.5 rounded-xs bg-[#89BD49]" />
                            <span>{t("landing.ticketAttachedVideo")}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <span className="w-1.5 h-1.5 rounded-xs bg-emerald-500" />
                            <span>{t("landing.ticketAttachedHar")}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <span className="w-1.5 h-1.5 rounded-xs bg-blue-500" />
                            <span>{t("landing.ticketAttachedSys")}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border flex items-center justify-between text-[11px]">
                        <span className="text-muted">Target: {activeIntegrationPreview.toUpperCase()}</span>
                        <span className="text-[#6B9A35] dark:text-[#A8D666] font-bold">1-Click Dispatch Ready &rarr;</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Window Body: Stream & DevTools split (DevTools View Mode) */}
              {heroFeatureMode === "devtools" && (
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
                        <div className="relative inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#89BD49] text-white text-xs font-semibold shadow-xs">
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

                  {/* Scrubber timeline bar (interactive video replay simulator, no pills) */}
                  <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-border flex flex-col gap-2 text-xs text-muted font-mono">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsPlayingHero(!isPlayingHero)}
                        aria-label={isPlayingHero ? t("landing.playerPause") : t("landing.playerPlay")}
                        className="w-7 h-7 rounded-lg bg-[#89BD49] text-white flex items-center justify-center shrink-0 shadow-xs hover:bg-[#6B9A35] transition-colors"
                      >
                        {isPlayingHero ? (
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="4" width="4" height="16" rx="1" />
                            <rect x="14" y="4" width="4" height="16" rx="1" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        )}
                      </button>
                      <div
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const clickX = e.clientX - rect.left;
                          const pct = Math.max(0, Math.min(100, Math.round((clickX / rect.width) * 100)));
                          setHeroProgress(pct);
                          if (pct < 35) {
                            setActiveMockTab("console");
                          } else {
                            setActiveMockTab("network");
                          }
                        }}
                        className="relative flex-1 h-3 rounded-md bg-slate-200 dark:bg-slate-800 overflow-hidden cursor-pointer group"
                      >
                        <div
                          className="absolute inset-y-0 left-0 bg-[#89BD49] rounded-md transition-all duration-75"
                          style={{ width: `${heroProgress}%` }}
                        />
                        {/* Timeline event pins */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setHeroProgress(11);
                            setActiveMockTab("console");
                          }}
                          className="absolute top-0 bottom-0 left-[11%] w-1.5 bg-amber-400 hover:w-2 transition-all cursor-pointer z-10"
                          title={t("landing.playerClickMarker")}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setHeroProgress(56);
                            setActiveMockTab("network");
                          }}
                          className="absolute top-0 bottom-0 left-[56%] w-1.5 bg-rose-500 hover:w-2 transition-all cursor-pointer z-10"
                          title={t("landing.playerErrorMarker")}
                        />
                      </div>
                      <span className="shrink-0 text-[11px] font-semibold tabular-nums">
                        {Math.floor((heroProgress / 100) * 75).toString().padStart(2, "0")}:{Math.round(((heroProgress / 100) * 75) % 60).toString().padStart(2, "0")} / 01:15
                      </span>
                    </div>

                    {/* Quick jump to event pins (rectangular, no pills) */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px]">
                      <span className="text-muted font-sans font-medium">Jump:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setHeroProgress(11);
                          setActiveMockTab("console");
                        }}
                        className="px-2 py-0.5 rounded-md border border-amber-400/40 bg-amber-400/10 text-amber-700 dark:text-amber-300 font-mono hover:bg-amber-400/20 transition-colors"
                      >
                        {t("landing.playerClickMarker")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setHeroProgress(56);
                          setActiveMockTab("network");
                        }}
                        className="px-2 py-0.5 rounded-md border border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-400 font-mono hover:bg-rose-500/20 transition-colors"
                      >
                        {t("landing.playerErrorMarker")}
                      </button>
                    </div>
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
                          ? "border-[#89BD49] text-[#6B9A35] dark:text-[#A8D666] bg-[#89BD49]/10 dark:bg-[#89BD49]/15"
                          : "border-transparent text-muted hover:text-foreground hover:bg-slate-50 dark:hover:bg-subtle/40"
                      }`}
                    >
                      <span>{t("landing.mockTabConsole")}</span>
                      <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60">
                        2
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMockTab("network")}
                      className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all duration-200 whitespace-nowrap ${
                        activeMockTab === "network"
                          ? "border-[#89BD49] text-[#6B9A35] dark:text-[#A8D666] bg-[#89BD49]/10 dark:bg-[#89BD49]/15"
                          : "border-transparent text-muted hover:text-foreground hover:bg-slate-50 dark:hover:bg-subtle/40"
                      }`}
                    >
                      <span>{t("landing.mockTabNetwork")}</span>
                      <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60">
                        4
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMockTab("storage")}
                      className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all duration-200 whitespace-nowrap ${
                        activeMockTab === "storage"
                          ? "border-[#89BD49] text-[#6B9A35] dark:text-[#A8D666] bg-[#89BD49]/10 dark:bg-[#89BD49]/15"
                          : "border-transparent text-muted hover:text-foreground hover:bg-slate-50 dark:hover:bg-subtle/40"
                      }`}
                    >
                      <span>{t("landing.mockTabStorage")}</span>
                      <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        3
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMockTab("system")}
                      className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all duration-200 whitespace-nowrap ${
                        activeMockTab === "system"
                          ? "border-[#89BD49] text-[#6B9A35] dark:text-[#A8D666] bg-[#89BD49]/10 dark:bg-[#89BD49]/15"
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
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider bg-[#89BD49]/15 dark:bg-[#89BD49]/20 text-[#6B9A35] dark:text-[#A8D666] border border-[#89BD49]/30 dark:border-[#89BD49]/30">
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
                          <span className="text-[10px] font-bold text-[#6B9A35] dark:text-[#A8D666] block uppercase tracking-wider">localStorage</span>
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
              )}
            </div>
          </div>
        </section>

        {/* How it works - 3 steps */}
        <section className="relative border-t border-white/70 dark:border-border bg-gradient-to-b from-slate-50 to-lime-50/30 dark:from-background dark:to-background overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(137,189,73,0.08),transparent_60%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.07),transparent_50%)]" />
          <div className="relative mx-auto max-w-6xl px-4 sm:px-8 py-14 sm:py-20">
            <h2 className="text-center text-2xl sm:text-3xl font-bold tracking-tight mb-12">
              {t("landing.howItWorksTitle")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  id: "step-1",
                  title: t("landing.step1Title"),
                  body: t("landing.step1Body"),
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  ),
                  color: "bg-gradient-to-br from-[#89BD49] to-[#6B9A35]",
                  glow: "shadow-[#89BD49]/25",
                },
                {
                  id: "step-2",
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
                  id: "step-3",
                  title: t("landing.step3Title"),
                  body: t("landing.step3Body"),
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  ),
                  color: "bg-gradient-to-br from-[#89BD49] to-[#6B9A35]",
                  glow: "shadow-[#89BD49]/25",
                },
              ].map(({ id, title, body, icon, color, glow }) => (
                <div
                  key={id}
                  className="group rounded-2xl border border-white/80 dark:border-border bg-white/80 dark:bg-subtle p-5 sm:p-8 shadow-lg shadow-slate-200/50 dark:shadow-none backdrop-blur-sm hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
                >
                  <div className={`w-12 h-12 rounded-xl ${color} text-white flex items-center justify-center shadow-lg ${glow} group-hover:scale-110 transition-transform duration-300`}>
                    {icon}
                  </div>
                  <div className="mt-5">
                    <h3 className="text-base font-bold text-slate-900 dark:text-foreground">{title}</h3>
                    <p className="mt-2 text-xs text-slate-600 dark:text-muted leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link href="/how-it-works" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6B9A35] hover:text-[#58802A] dark:text-[#A8D666] transition-colors hover:-translate-y-0.5 group">
                {t("landing.seeFullWalkthrough")}
              </Link>
            </div>
          </div>
        </section>

        {/* Bento Grid / Core Features */}
        <section className="relative border-t border-white/70 dark:border-border bg-white/60 dark:bg-background py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-8">
            <h2 className="text-center text-2xl sm:text-3xl font-bold tracking-tight mb-12 text-slate-900 dark:text-foreground">
              {t("landing.featuresTitle")}
            </h2>

            {/* Bento Grid: 4 complementary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Bento Card 1 (Wide 2 columns): Automated DevTools Context */}
              <div className="md:col-span-2 group relative overflow-hidden rounded-2xl border border-white/80 dark:border-border hover:border-[#89BD49]/40 dark:hover:border-[#89BD49]/40 bg-white/80 dark:bg-subtle p-5 sm:p-8 flex flex-col justify-between shadow-lg shadow-slate-200/50 dark:shadow-none backdrop-blur-sm hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                <div className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full bg-[#89BD49]/10 dark:bg-[#89BD49]/15 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-foreground leading-snug">
                    {t("landing.f2Title")}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 dark:text-muted leading-relaxed">
                    {t("landing.f2Body")}
                  </p>
                </div>

                {/* Interactive Developer Quick-Actions Strip (Terminal / cURL / JSON) */}
                <div className="mt-6 rounded-xl border border-slate-200/80 dark:border-border bg-slate-950 text-slate-200 p-3.5 font-mono text-[11px] space-y-2.5 shadow-inner">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    {/* Tab Switcher (geometric rounded-lg, no pills) */}
                    <div className="flex items-center gap-1">
                      {[
                        { key: "terminal", label: t("landing.bentoTabTerminal") },
                        { key: "curl", label: t("landing.bentoTabCurl") },
                        { key: "json", label: t("landing.bentoTabJson") },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setBentoDevMode(tab.key as "terminal" | "curl" | "json")}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                            bentoDevMode === tab.key
                              ? "bg-[#89BD49] text-white shadow-xs"
                              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Copy Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const copyText =
                          bentoDevMode === "curl"
                            ? 'curl -X POST https://store.akusara.internal/api/v1/checkout -H "Content-Type: application/json" -d \'{"cart_id":"c_9981"}\''
                            : bentoDevMode === "json"
                            ? '{\n  "timestamp": 1726588921,\n  "status": 500,\n  "error": "InternalServerError",\n  "route": "/api/v1/checkout",\n  "duration_ms": 142\n}'
                            : "POST /api/v1/checkout 500 (142ms)\nConsole.warn: Token expired at auth.ts:18";

                        if (typeof navigator !== "undefined" && navigator.clipboard) {
                          navigator.clipboard.writeText(copyText);
                        }
                        setBentoCopied(true);
                        setTimeout(() => setBentoCopied(false), 2000);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-sans font-medium transition-all"
                    >
                      {bentoCopied ? (
                        <>
                          <svg className="w-3 h-3 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span className="text-emerald-400">{t("landing.bentoCopiedCmd")}</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                          <span>{t("landing.bentoCopyCmd")}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Tab Body */}
                  {bentoDevMode === "terminal" && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-rose-400">
                        <span>POST /api/v1/checkout 500</span>
                        <span className="text-[10px] text-slate-400">142ms</span>
                      </div>
                      <div className="text-amber-300 text-[10px]">
                        Console.warn: Token expired at auth.ts:18
                      </div>
                      <div className="text-emerald-400 text-[10px]">
                        Storage: localStorage.getItem(&quot;session_token&quot;) &rarr; null
                      </div>
                    </div>
                  )}

                  {bentoDevMode === "curl" && (
                    <div className="p-2 rounded-lg bg-black/40 border border-slate-800 text-slate-300 overflow-x-auto whitespace-pre leading-relaxed text-[10px]">
                      <code>curl -X POST https://store.akusara.internal/api/v1/checkout \<br />&nbsp;&nbsp;-H &quot;Content-Type: application/json&quot; \<br />&nbsp;&nbsp;-d &#39;{`{"cart_id":"c_9981"}`}&#39;</code>
                    </div>
                  )}

                  {bentoDevMode === "json" && (
                    <div className="p-2 rounded-lg bg-black/40 border border-slate-800 text-emerald-300 overflow-x-auto whitespace-pre leading-relaxed text-[10px]">
                      <code>{`{\n  "status": 500,\n  "error": "InternalServerError",\n  "route": "/api/v1/checkout",\n  "duration_ms": 142\n}`}</code>
                    </div>
                  )}
                </div>
              </div>

              {/* Bento Card 2 (1 column): 100% Data Ownership in Google Drive */}
              <div className="group relative overflow-hidden rounded-2xl border border-white/80 dark:border-border hover:border-[#89BD49]/40 dark:hover:border-[#89BD49]/40 bg-white/80 dark:bg-subtle p-5 sm:p-8 flex flex-col justify-between shadow-lg shadow-slate-200/50 dark:shadow-none backdrop-blur-sm hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                <div className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-foreground leading-snug">
                    {t("landing.freeForever")}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 dark:text-muted leading-relaxed">
                    {t("landing.pill2Desc")}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-center p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9" />
                      <polyline points="13 11 9 7 5 11" />
                    </svg>
                    <span>Google Drive Synced</span>
                  </div>
                </div>
              </div>

              {/* Bento Card 3 (1 column): Hotkeys Screen & Video Capture */}
              <div className="group relative overflow-hidden rounded-2xl border border-white/80 dark:border-border hover:border-[#89BD49]/40 dark:hover:border-[#89BD49]/40 bg-white/80 dark:bg-subtle p-5 sm:p-8 flex flex-col justify-between shadow-lg shadow-slate-200/50 dark:shadow-none backdrop-blur-sm hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                <div className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[#89BD49]/10 dark:bg-[#89BD49]/15 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-foreground leading-snug">
                    {t("landing.bentoAnnotateTitle")}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 dark:text-muted leading-relaxed">
                    {t("landing.bentoAnnotateDesc")}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <kbd className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-semibold text-foreground shadow-2xs">
                    Ctrl + Shift + S
                  </kbd>
                  <kbd className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-semibold text-foreground shadow-2xs">
                    Alt + Shift + S
                  </kbd>
                </div>
              </div>

              {/* Bento Card 4 (Wide 2 columns): Instant Sharing & Integrations */}
              <div className="md:col-span-2 group relative overflow-hidden rounded-2xl border border-white/80 dark:border-border hover:border-[#89BD49]/40 dark:hover:border-[#89BD49]/40 bg-white/80 dark:bg-subtle p-5 sm:p-8 flex flex-col justify-between shadow-lg shadow-slate-200/50 dark:shadow-none backdrop-blur-sm hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                <div className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-foreground leading-snug">
                    {t("landing.f3Title")}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 dark:text-muted leading-relaxed">
                    {t("landing.f3Body")}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-2.5">
                  <div className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-border bg-slate-50 dark:bg-subtle/60 text-xs font-mono text-muted flex items-center gap-1.5 max-w-full truncate">
                    <svg className="w-3.5 h-3.5 text-[#6B9A35] dark:text-[#A8D666] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    <span className="truncate">https://bugsnap.akusaraproject.my.id/v/8f921a</span>
                  </div>
                  <span className="text-[11px] font-semibold text-muted px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">Jira</span>
                  <span className="text-[11px] font-semibold text-muted px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">Linear</span>
                  <span className="text-[11px] font-semibold text-muted px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">GitHub</span>
                  <span className="text-[11px] font-semibold text-muted px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">Slack</span>
                </div>
              </div>

            </div>

            <div className="mt-10 text-center">
              <Link href="/features" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6B9A35] hover:text-[#58802A] dark:text-[#A8D666] transition-colors hover:-translate-y-0.5 group">
                {t("landing.exploreFeatures")}
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ Section with Interactive Category Filter & Accordion (no pills) */}
        <section className="border-t border-white/70 dark:border-border bg-gradient-to-b from-slate-50/70 to-lime-50/30 dark:from-background dark:to-background py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center mb-4 text-slate-900 dark:text-foreground">
              {t("landing.faq")}
            </h2>
            <p className="text-center text-xs sm:text-sm text-slate-600 dark:text-muted mb-8 max-w-lg mx-auto">
              {t("landing.ctaHint")}
            </p>

            {/* Category Filter Tabs (geometric rounded-lg, no pills) */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
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
                    setActiveFaqCategory(cat.key as "all" | "privacy" | "devtools" | "integrations");
                    setExpandedFaqIndex(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border ${
                    activeFaqCategory === cat.key
                      ? "border-[#89BD49] bg-[#89BD49] text-white shadow-xs"
                      : "border-border/80 bg-white/80 dark:bg-subtle/80 text-slate-600 dark:text-muted hover:text-foreground hover:border-[#89BD49]/40"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Accordion List (2-column balanced grid) */}
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
                    className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                      isExpanded
                        ? "border-[#89BD49]/60 bg-white dark:bg-subtle shadow-md"
                        : "border-border/80 bg-white/70 dark:bg-subtle/50 hover:border-[#89BD49]/30 hover:bg-white dark:hover:bg-subtle"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedFaqIndex(isExpanded ? null : faq.id)}
                      className="w-full text-left p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors"
                    >
                      <span className="text-sm font-semibold text-slate-900 dark:text-foreground leading-snug">
                        {t(faq.q)}
                      </span>
                      <span className={`w-6 h-6 rounded-md border border-border flex items-center justify-center shrink-0 transition-transform duration-200 mt-0.5 ${
                        isExpanded ? "rotate-180 bg-[#89BD49]/10 text-[#6B9A35] dark:text-[#A8D666] border-[#89BD49]/40" : "text-muted"
                      }`}>
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 text-xs text-slate-600 dark:text-muted leading-relaxed border-t border-border/50 animate-fadeIn">
                        {t(faq.a)}
                      </div>
                    )}
                  </div>
                );
              };

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <div className="space-y-3">
                    {leftCol.map(renderFaqCard)}
                  </div>
                  <div className="space-y-3">
                    {rightCol.map(renderFaqCard)}
                  </div>
                </div>
              );
            })()}
          </div>
        </section>

        {/* Bottom CTA Section */}
        <section className="relative isolate mx-auto max-w-6xl px-4 sm:px-8 py-14 sm:py-20 text-center">
          {/* Ambient background glow pulse */}
          <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
            <div className="h-72 w-[40rem] rounded-full bg-gradient-to-r from-[#89BD49]/15 via-emerald-500/15 to-[#6B9A35]/15 blur-3xl dark:from-[#89BD49]/10 dark:via-emerald-900/15 dark:to-teal-900/15 animate-pulse-slow" />
          </div>

          {/* Glass container with vibrant gradient accents */}
          <div className="relative rounded-3xl border border-white/80 dark:border-border/80 bg-white/80 dark:bg-subtle/80 p-6 sm:p-14 shadow-2xl shadow-slate-200/60 dark:shadow-none backdrop-blur-xl overflow-hidden hover:border-[#89BD49]/40 dark:hover:border-[#89BD49]/40 transition-all duration-300">
            <div className="pointer-events-none absolute -top-24 -left-24 h-48 w-48 rounded-full bg-[#89BD49]/15 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-emerald-500/15 blur-2xl" />

            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-foreground leading-tight max-w-2xl mx-auto">
              {t("landing.cta2")}
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-muted max-w-xl mx-auto leading-relaxed">
              {t("landing.ctaHint")}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={CHROME_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackConversion("install_click")}
                className="group inline-flex items-center gap-3 w-full sm:w-auto justify-center rounded-2xl bg-[#89BD49] hover:bg-[#6B9A35] px-7 py-3.5 text-white transition-all duration-200 shadow-xl shadow-[#89BD49]/25 hover:shadow-2xl hover:shadow-[#89BD49]/35 hover:-translate-y-0.5 border border-[#89BD49]/50"
              >
                <ChromeLogo className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                <span className="text-sm font-bold text-white tracking-tight">
                  {t("landing.cta")}
                </span>
              </a>
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-2 w-full sm:w-auto justify-center rounded-2xl border border-border/80 dark:border-border bg-white/90 dark:bg-subtle hover:bg-white dark:hover:bg-background px-7 py-3.5 text-sm font-bold text-foreground transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 backdrop-blur-xl"
              >
                {t("landing.howItWorks")}
              </Link>
            </div>

            <p className="mt-5 text-xs text-muted">
              {t("landing.noCard")}
            </p>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
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
                    className="font-medium text-foreground hover:text-[#6B9A35] dark:hover:text-[#A8D666] transition-colors"
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
                    className="font-medium text-foreground hover:text-[#6B9A35] dark:hover:text-[#A8D666] transition-colors"
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
            <div className="flex items-center gap-4">
              <Link
                href="/status"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors shadow-2xs"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>{t("landing.systemStatusOperational")}</span>
              </Link>
              <p className="text-xs text-muted">
                {t("landing.builtOn")}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
