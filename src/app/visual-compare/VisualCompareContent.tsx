"use client";

import Link from "next/link";
import { useState, useRef, useCallback } from "react";
import { useT } from "@/components/I18nProvider";
import { SiteNavbar } from "@/components/site/SiteNavbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Reveal } from "@/components/site/motion";
import { FIREFOX_STORE_URL } from "@/lib/constants";
import { Icon } from "@/lib/iconify";

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf";

type CompareMode = "split" | "side" | "diff";

// ── Realistic Simulated Checkout UI ───────────────────────────────────────────
function CheckoutUiContent({ isFixed }: { isFixed: boolean }) {
  return (
    <div className="w-full h-full min-w-0 flex flex-col bg-white text-slate-900 font-sans overflow-hidden select-none">
      {/* Top Browser URL bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 border-b border-slate-200 text-[11px] text-slate-500 shrink-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
        </div>
        <div className="flex-1 min-w-0 max-w-sm mx-auto flex items-center justify-center gap-1.5 px-3 py-1 rounded-md bg-white border border-slate-200 text-slate-600 font-mono text-[10px]">
          <Icon icon="tabler:lock" className="w-3 h-3 text-emerald-500" />
          <span className="truncate">https://app.acmecloud.io/checkout</span>
        </div>
      </div>

      {/* Status banner */}
      {!isFixed ? (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-red-50 border-b border-red-200 text-red-700 text-xs shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Icon icon="tabler:alert-triangle" className="w-4 h-4 text-red-500 shrink-0" />
            <span className="font-semibold truncate">Payment Gateway Error 504:</span>
            <span className="truncate text-red-600 hidden sm:inline">Transaction timed out contacting upstream payment provider.</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-100 font-bold shrink-0">FAIL_UPSTREAM</span>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#2563EB]/10 border-b border-[#2563EB]/30 text-[#1D4ED8] text-xs shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Icon icon="tabler:circle-check" className="w-4 h-4 text-[#2563EB] shrink-0" />
            <span className="font-semibold truncate">Gateway Connected:</span>
            <span className="truncate text-slate-600 hidden sm:inline">All payment endpoints online · Zero latency</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#2563EB]/15 font-bold shrink-0">200_OK</span>
        </div>
      )}

      {/* Main Form Content */}
      <div className="flex-1 p-4 sm:p-6 overflow-hidden flex flex-col justify-between gap-4">
        <div>
          <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-200">
            <div>
              <h4 className="font-bold text-sm sm:text-base text-slate-900">Acme Cloud Workspace</h4>
              <p className="text-xs text-slate-500">Developer Team Plan · 10 Active Microservices</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-slate-900">$49</span>
              <span className="text-xs text-slate-500"> / month</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-500 text-[11px] font-medium mb-1">Billing Email</label>
              <div className="min-w-0 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 font-mono text-[11px] truncate break-all">
                qa-lead@akusaraproject.my.id
              </div>
            </div>
            <div>
              <label className="block text-slate-500 text-[11px] font-medium mb-1">Card Number</label>
              <div className="flex min-w-0 items-center justify-between gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 font-mono text-[11px]">
                <span className="min-w-0 truncate">•••• •••• •••• 4242</span>
                <span className="text-[10px] font-bold text-slate-400">VISA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button Section */}
        <div className="pt-2 border-t border-slate-200">
          {!isFixed ? (
            <div className="space-y-1.5">
              <button
                type="button"
                disabled
                className="w-full py-2.5 sm:py-3 rounded-xl bg-slate-200 text-slate-500 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-not-allowed border border-slate-300"
              >
                <Icon icon="tabler:loader-2" className="w-4 h-4 animate-spin" />
                <span>Processing Payment... (Retry Failed)</span>
              </button>
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-red-500 font-medium text-center">
                <Icon icon="tabler:x" className="w-3 h-3" />
                <span>Error code: PAY_504_TIMEOUT (Attempt 3/3)</span>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <button
                type="button"
                className="w-full py-2.5 sm:py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-[0.99] cursor-pointer"
              >
                <Icon icon="tabler:shield-check" className="w-4 h-4" />
                <span>Complete Purchase ($49.00 / mo)</span>
              </button>
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 text-center">
                <Icon icon="tabler:lock" className="w-3 h-3 text-emerald-500" />
                <span>Encrypted with 256-bit SSL · Cancel anytime</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Interactive Split Slider Demo (Large, immersive) ─────────────────────────
function SplitSliderDemo() {
  const [pct, setPct] = useState(50);
  const dragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePct = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const next = Math.max(2, Math.min(98, Math.round(((clientX - rect.left) / rect.width) * 100)));
    setPct(next);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[460px] sm:h-[540px] lg:h-[600px] rounded-2xl overflow-hidden border border-slate-300 cursor-ew-resize select-none bg-white shadow-2xl"
      style={{ touchAction: "none" }}
      onPointerDown={(e) => {
        dragging.current = true;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        updatePct(e.clientX);
      }}
      onPointerMove={(e) => { if (dragging.current) updatePct(e.clientX); }}
      onPointerUp={(e) => {
        dragging.current = false;
        try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
      }}
    >
      {/* Base: Original (Broken) */}
      <div className="absolute inset-0">
        <CheckoutUiContent isFixed={false} />
      </div>

      {/* Overlay: Fixed (Clipped) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ clipPath: `polygon(${pct}% 0,100% 0,100% 100%,${pct}% 100%)` }}
      >
        <CheckoutUiContent isFixed={true} />
      </div>

      {/* Divider */}
      <div
        className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_16px_rgba(0,0,0,0.6)] z-20 pointer-events-none flex items-center justify-center -translate-x-1/2"
        style={{ left: `${pct}%` }}
      >
        <div className="w-10 h-10 rounded-full bg-white text-slate-900 border border-slate-300 shadow-2xl flex items-center justify-center text-xs font-extrabold tracking-tighter">
          /
        </div>
      </div>

      {/* Corner Badges */}
      <div className="absolute top-12 left-4 z-10 pointer-events-none bg-black/75 text-blue-400 border border-blue-500/30 text-[11px] font-bold px-3 py-1 rounded-lg backdrop-blur-md shadow-sm">
        ORIGINAL (BUG)
      </div>
      <div className="absolute top-12 right-4 z-10 pointer-events-none bg-black/75 text-[#93C5FD] border border-[#2563EB]/40 text-[11px] font-bold px-3 py-1 rounded-lg backdrop-blur-md shadow-sm">
        FIXED (VERIFIED)
      </div>

      {/* Slider percentage tooltip */}
      <div className="absolute bottom-3 right-4 z-10 pointer-events-none text-slate-700 bg-white/90 px-2.5 py-0.5 rounded-md font-mono text-[11px] shadow-sm">
        Split: {pct}%
      </div>
    </div>
  );
}

// ── Side-by-Side Demo (Large, immersive) ─────────────────────────────────────
function SideBySideDemo() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 w-full">
      {/* Original Panel */}
      <div className="h-[460px] sm:h-[520px] lg:h-[580px] rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-800 shadow-xl flex flex-col relative">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold truncate text-slate-200">checkout-timeout-bug.png</span>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">1440×900</span>
          </div>
          <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
            ORIGINAL
          </span>
        </div>
        <div className="flex-1">
          <CheckoutUiContent isFixed={false} />
        </div>
      </div>

      {/* Modified Panel */}
      <div className="h-[460px] sm:h-[520px] lg:h-[580px] rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-800 shadow-xl flex flex-col relative">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold truncate text-slate-200">checkout-fix-verified.png</span>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">1440×900</span>
          </div>
          <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-[#2563EB]/20 text-[#93C5FD] border border-[#2563EB]/30 shrink-0">
            MODIFIED
          </span>
        </div>
        <div className="flex-1">
          <CheckoutUiContent isFixed={true} />
        </div>
      </div>
    </div>
  );
}

// ── Diff Demo (Large, immersive) ─────────────────────────────────────────────
function DiffOverlayDemo() {
  return (
    <div className="relative w-full h-[460px] sm:h-[540px] lg:h-[600px] rounded-2xl overflow-hidden border border-slate-300 bg-white flex items-center justify-center shadow-2xl">
      {/* Base Original */}
      <div className="absolute inset-0">
        <CheckoutUiContent isFixed={false} />
      </div>

      {/* Inverted Diff Layer */}
      <div className="absolute inset-0 pointer-events-none opacity-30" style={{ mixBlendMode: "multiply" }}>
        <CheckoutUiContent isFixed={true} />
      </div>

      {/* Badge */}
      <div className="absolute top-4 left-4 z-10 max-w-[calc(100%-2rem)] bg-white/95 text-slate-700 border border-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg">
        <span className="text-[#2563EB] mr-1.5">●</span> Diff Mode: Identical pixels cancel out · Changes stand out
      </div>
    </div>
  );
}

export function VisualCompareContent() {
  const { t } = useT();
  const [activeMode, setActiveMode] = useState<CompareMode>("split");

  const features = [
    {
      icon: "tabler:layout-columns",
      title: t("vc.feat1Title") || "Split Slider",
      desc: t("vc.feat1Desc") || "Drag the slider across overlaid screenshots to reveal UI differences pixel by pixel.",
      badge: "Split Mode",
    },
    {
      icon: "tabler:layout-columns",
      title: t("vc.feat2Title") || "Side-by-Side View",
      desc: t("vc.feat2Desc") || "Inspect both captures next to each other with clear Before and After badges.",
      badge: "Side by Side",
    },
    {
      icon: "tabler:layers-difference",
      title: t("vc.feat3Title") || "Diff Overlay",
      desc: t("vc.feat3Desc") || "Pixel-level blending isolates changes. Unchanged areas go dark while differences stand out clearly.",
      badge: "Diff Blend",
    },
    {
      icon: "tabler:upload",
      title: t("vc.feat4Title") || "Drop In Any Image",
      desc: t("vc.feat4Desc") || "Compare BugSnap captures or just upload screenshots directly from your files.",
      badge: "Zero Setup",
    },
    {
      icon: "tabler:repeat",
      title: t("vc.feat5Title") || "Swap Before and After",
      desc: t("vc.feat5Desc") || "Flip Before and After positions instantly without having to re-upload.",
      badge: "Instant Swap",
    },
    {
      icon: "tabler:link",
      title: t("vc.feat6Title") || "Instant Share Links",
      desc: t("vc.feat6Desc") || "Paste direct comparison links into Jira, Linear, GitHub PRs, or Slack so your team can verify in seconds.",
      badge: "Shareable",
    },
  ];

  const modes: { id: CompareMode; icon: string; label: string }[] = [
    { id: "split", icon: "tabler:layout-columns", label: t("compare.splitMode") || "Split Slider" },
    { id: "side",  icon: "tabler:layout-columns",  label: t("compare.sideBySideMode") || "Side by Side" },
    { id: "diff",  icon: "tabler:layers-difference", label: t("compare.diffMode") || "Diff Overlay" },
  ];

  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-100 font-site flex flex-col bg-[#fcfdfe] dark:bg-[#07090d]">
      <SiteNavbar />

      <main id="main-content" className="flex-1 pb-12 sm:pb-16">

        {/* ── Hero Section (Max-w-6xl for wide impact) ────────────────────── */}
        <section className="pt-8 sm:pt-12 pb-8 sm:pb-10 text-center max-w-5xl mx-auto px-4 sm:px-6">
          <Reveal delay={0}>
            <nav
              className="inline-flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6"
              aria-label="Breadcrumb"
            >
              <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                {t("landing.home") || "Home"}
              </Link>
              <span className="text-slate-400 dark:text-slate-600" aria-hidden="true">/</span>
              <span className="text-slate-900 dark:text-white font-medium">
                {t("vc.pageTitle") || "Visual Compare"}
              </span>
            </nav>
          </Reveal>

          <Reveal delay={0.06}>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12] mb-4 text-balance">
              {t("vc.heroTitle") || "See every fix."}{" "}
              <span className="text-[#1D4ED8] dark:text-[#93C5FD]">
                {t("vc.heroTitleAccent") || "Pixel by pixel."}
              </span>
            </h1>
          </Reveal>

          <Reveal delay={0.14}>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto mb-7">
              {t("compare.subtitle") ||
                "Compare two screenshot captures side-by-side or with an interactive split slider to verify bug fixes and UI changes."}
            </p>
          </Reveal>

          <Reveal delay={0.18}>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href={CHROME_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm shadow-md transition-all cursor-pointer active:scale-95"
              >
                <Icon icon="logos:chrome" className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span>{t("extension.addToChrome") || "Add to Chrome"}</span>
              </Link>
              <Link
                href="/compare"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition-all cursor-pointer"
              >
                <Icon icon="tabler:player-play" width={15} />
                <span>{t("vc.openCompareTool") || "Open Compare Tool"}</span>
              </Link>
            </div>
          </Reveal>
        </section>

        {/* ── Large Interactive Showcase (Max-w-7xl, Full Width Impact) ───── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 sm:mb-24">
          <Reveal delay={0.05}>
            {/* Mode Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                {modes.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setActiveMode(m.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeMode === m.id
                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700 font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Icon icon={m.icon} width={15} />
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
                <span>Interactive Live Preview · Try dragging or switching modes</span>
              </div>
            </div>

            {/* Viewer Component */}
            <div>
              {activeMode === "split" && <SplitSliderDemo />}
              {activeMode === "side"  && <SideBySideDemo />}
              {activeMode === "diff"  && <DiffOverlayDemo />}
            </div>
          </Reveal>
        </section>

        {/* ── Feature Highlights Grid (Max-w-7xl) ─────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 sm:mb-24">
          <Reveal delay={0}>
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug mb-2">
                {t("vc.modesTitle") || "Three ways to compare. Switch views instantly."}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
                {t("vc.allFeaturesTitle") || "Everything you need to verify fixes quickly"}
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.05}>
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between h-full hover:border-[#2563EB]/50 transition-colors">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB]">
                        <Icon icon={f.icon} width={20} />
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#2563EB]/15 text-[#1D4ED8] dark:text-[#93C5FD]">
                        {f.badge}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                      {f.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Wide CTA card */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal delay={0}>
            <div className="rounded-2xl sm:rounded-3xl border border-blue-100 dark:border-blue-900/40 bg-[#f0f6ff] dark:bg-blue-950/25 p-6 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm min-w-0">
              <div className="space-y-1.5 max-w-xl min-w-0">
                <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {t("vc.ctaEyebrow") || "READY TO COMPARE?"}
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {t("vc.ctaTitle") || "Start comparing screenshots"}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {t("vc.ctaDesc") ||
                    "Install BugSnap, capture your before and after, and compare visually in seconds."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0 min-w-0">
                <a
                  href={CHROME_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold px-6 py-3.5 rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.99] shrink-0 touch-manipulation whitespace-nowrap"
                >
                  <Icon icon="logos:chrome" className="w-5 h-5 shrink-0" aria-hidden="true" />
                  <span>{t("extension.addToChrome") || "Add to Chrome"}</span>
                </a>
                <a
                  href={FIREFOX_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold px-6 py-3.5 rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.99] shrink-0 touch-manipulation whitespace-nowrap"
                >
                  <Icon icon="logos:firefox" className="w-5 h-5 shrink-0" aria-hidden="true" />
                  <span>{t("extension.addToFirefox")}</span>
                </a>
              </div>
            </div>
          </Reveal>
        </section>

      </main>

      <SiteFooter />
    </div>
  );
}
