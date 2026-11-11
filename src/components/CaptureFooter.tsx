"use client";

import Link from "next/link";
import { useT } from "@/components/I18nProvider";
import { Icon } from "@/lib/iconify";
import { FIREFOX_STORE_URL } from "@/lib/constants";

function ChromeLogo({ className = "w-4 h-4 shrink-0" }: { className?: string }) {
  return (
    <Icon icon="logos:chrome" className={className} aria-hidden="true" />
  );
}

function FirefoxLogo({ className = "w-4 h-4 shrink-0" }: { className?: string }) {
  return (
    <Icon icon="logos:firefox" className={className} aria-hidden="true" />
  );
}

function BrowserIllustration({
  className = "w-28 h-20 shrink-0",
  browserIconHref = "/icons/chrome.svg",
}: {
  className?: string;
  browserIconHref?: string;
}) {
  return (
    <svg
      viewBox="0 0 150 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Background Soft Glow */}
      <ellipse cx="70" cy="52" rx="46" ry="32" fill="#2563EB" fillOpacity="0.12" />

      {/* Main Browser Window */}
      <g filter="drop-shadow(0 4px 10px rgba(15, 23, 42, 0.08))">
        {/* Browser Body */}
        <rect
          x="10"
          y="18"
          width="94"
          height="62"
          rx="8"
          className="fill-white dark:fill-zinc-900 stroke-slate-200 dark:stroke-zinc-700"
          strokeWidth="1.2"
        />
        {/* Browser Top Bar */}
        <path
          d="M10 26C10 21.58 13.58 18 18 18H96C100.42 18 104 21.58 104 26V28H10V26Z"
          className="fill-slate-100 dark:fill-zinc-800 stroke-slate-200 dark:stroke-zinc-700"
          strokeWidth="1.2"
        />
        {/* Window Controls (Traffic Lights) */}
        <circle cx="17" cy="23" r="1.75" fill="#F87171" />
        <circle cx="22.5" cy="23" r="1.75" fill="#FBBF24" />
        <circle cx="28" cy="23" r="1.75" fill="#34D399" />

        {/* Browser Logo Centered in Browser Window */}
        <image href={browserIconHref} x="38" y="36" width="25" height="25" preserveAspectRatio="xMidYMid meet" />
      </g>

      {/* Overlapping Floating BugSnap Card Badge */}
      <g filter="drop-shadow(0 6px 14px rgba(137, 189, 73, 0.25))">
        <rect
          x="88"
          y="22"
          width="42"
          height="42"
          rx="10"
          className="fill-white dark:fill-zinc-800 stroke-[#2563EB]/30 dark:stroke-[#2563EB]/40"
          strokeWidth="1.5"
        />
        {/* BugSnap Icon on Badge */}
        <g transform="translate(98, 32) scale(0.9)">
          <circle cx="12" cy="12" r="10.5" fill="#2563EB" fillOpacity="0.15" />
          <circle cx="12" cy="12" r="6" stroke="#2563EB" strokeWidth="2" />
          <circle cx="12" cy="12" r="2.5" fill="#2563EB" />
          {/* Subtle Antennae */}
          <line x1="12" y1="1" x2="12" y2="4.5" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="12" y1="19.5" x2="12" y2="23" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="1" y1="12" x2="4.5" y2="12" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="19.5" y1="12" x2="23" y2="12" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      </g>

      {/* Dynamic Sparkle / Accent Rays (Top-Right of BugSnap Badge) */}
      <path d="M136 18L142 14" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
      <path d="M141 26L147 25" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
      <path d="M131 10L132 4" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function CaptureFooter({ className = "" }: { className?: string } = {}) {
  const { t } = useT();

  return (
    <footer className={`shrink-0 border-t border-slate-200/90 dark:border-zinc-800/90 bg-slate-50/95 dark:bg-zinc-950/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 xl:px-10 py-5 sm:py-6 shadow-sm ${className}`}>
      <div className="max-w-[1560px] mx-auto flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5 sm:gap-6 lg:gap-8 xl:gap-12">
        {/* Left: Illustration + CTA Box + Copyright */}
        <div className="flex flex-col flex-1 min-w-0 justify-between gap-3 sm:gap-4 lg:pr-6 xl:pr-10">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="hidden sm:flex items-center shrink-0 -space-x-3">
              <BrowserIllustration
                className="w-24 h-16 sm:w-28 sm:h-20 shrink-0 select-none drop-shadow-sm relative z-10"
                browserIconHref="/icons/chrome.svg"
              />
              <BrowserIllustration
                className="w-24 h-16 sm:w-28 sm:h-20 shrink-0 select-none drop-shadow-sm"
                browserIconHref="/icons/logos-firefox.svg"
              />
            </div>
            <BrowserIllustration
              className="sm:hidden w-24 h-16 shrink-0 select-none drop-shadow-sm"
              browserIconHref="/icons/chrome.svg"
            />
            <div className="flex flex-col text-left min-w-0">
              <h4 className="text-xs sm:text-sm md:text-base font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                {t("footer.captureBugsFaster")}
              </h4>
              <p className="max-w-[38rem] text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 leading-snug mt-1 whitespace-normal break-words">
                {t("footer.captureDesc")}
              </p>
              <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                <a
                  href="https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-95 text-white text-xs font-semibold shadow-xs hover:shadow-md shadow-[#2563EB]/25 transition-all duration-150 w-fit group"
                  title={t("footer.addToChrome")}
                >
                  <ChromeLogo className="w-3.5 h-3.5 shrink-0" />
                  <span>{t("footer.addToChrome")}</span>
                </a>
                <a
                  href={FIREFOX_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-95 text-white text-xs font-semibold shadow-xs hover:shadow-md shadow-[#2563EB]/25 transition-all duration-150 w-fit group"
                  title={t("footer.addToFirefox")}
                >
                  <FirefoxLogo className="w-3.5 h-3.5 shrink-0" />
                  <span>{t("footer.addToFirefox")}</span>
                </a>
              </div>
            </div>
          </div>

          {/* Copyright on the Left: balances the 4 columns on the right */}
          <div className="hidden lg:flex flex-col gap-1 text-[11px] pt-1 max-w-[38rem]">
            <span className="font-semibold text-slate-600 dark:text-zinc-300">
              {t("landing.copyright", { year: new Date().getFullYear() })}
            </span>
          </div>
        </div>

        {/* Subtle Vertical Divider on Desktop - Centered between the two halves */}
        <div className="hidden lg:block w-px bg-slate-200/90 dark:bg-zinc-800/90 self-stretch my-1 shrink-0" />

        {/* Right: Brand + Proportional Navigation Grid */}
        <div className="flex flex-col flex-1 min-w-0 justify-between gap-4 sm:gap-5 pt-5 lg:pt-0 border-t border-slate-200/80 dark:border-zinc-800/80 lg:border-t-0 lg:pl-6 xl:pl-10">
          {/* Brand Header */}
          <div className="flex flex-col text-left">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 w-fit hover:opacity-85 transition-opacity"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-day.svg" alt="BugSnap" className="w-4 h-4 sm:w-4.5 sm:h-4.5 object-contain shrink-0 dark:hidden" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-dark.svg" alt="BugSnap" className="w-4 h-4 sm:w-4.5 sm:h-4.5 object-contain shrink-0 hidden dark:block" />
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-none">BugSnap</span>
            </Link>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-snug">
              {t("footer.tagline")}
            </p>
          </div>

          {/* 4-Column Navigation Grid: Balanced with mobile-friendly tap targets and vertical spacing */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-5 sm:gap-y-6 items-start">
            {/* Product */}
            <div className="flex flex-col gap-1.5 sm:gap-2 text-left min-w-0">
              <span className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-zinc-200 tracking-tight">{t("footer.product")}</span>
              <Link
                href="/features"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] sm:text-xs text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors py-0.5"
              >
                {t("footer.features")}
              </Link>
              <Link
                href="/extension"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] sm:text-xs text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors py-0.5"
              >
                {t("footer.extension")}
              </Link>
              <Link
                href="/how-it-works"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] sm:text-xs text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors py-0.5"
              >
                {t("footer.howItWorks")}
              </Link>
              {/* Payment UI temporarily commented out until ready:
              <Link
                href="/pricing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] sm:text-xs text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors py-0.5"
              >
                {t("footer.pricing")}
              </Link>
              */}
              <Link
                href="/visual-compare"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] sm:text-xs text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors py-0.5"
              >
                {t("footer.compare")}
              </Link>
            </div>

            {/* Resources */}
            <div className="flex flex-col gap-1.5 sm:gap-2 text-left min-w-0">
              <span className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-zinc-200 tracking-tight">{t("footer.resources")}</span>
              <Link
                href="/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] sm:text-xs text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors py-0.5"
              >
                {t("footer.documentation")}
              </Link>
              <Link
                href="/docs/mcp"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] sm:text-xs text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors py-0.5 flex items-center gap-1"
              >
                <span>{t("footer.mcp")}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950/40 text-[#2563EB] dark:text-[#3B82F6]">AI</span>
              </Link>
              <Link
                href="/blog"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] sm:text-xs text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors py-0.5"
              >
                {t("footer.blog")}
              </Link>
              <Link
                href="/help"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] sm:text-xs text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors py-0.5"
              >
                {t("footer.helpCenter")}
              </Link>
              <Link
                href="/status"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[11px] sm:text-xs text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors py-0.5"
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>{t("landing.allOperational")}</span>
              </Link>
            </div>

            {/* Legal & Compliance */}
            <div className="flex flex-col gap-1.5 sm:gap-2 text-left min-w-0">
              <span className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-zinc-200 tracking-tight">{t("footer.legal")}</span>
              <Link
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] sm:text-xs text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors py-0.5"
              >
                {t("footer.terms")}
              </Link>
              <Link
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] sm:text-xs text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors py-0.5"
              >
                {t("footer.privacy")}
              </Link>
              <Link
                href="/security"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] sm:text-xs text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors py-0.5"
              >
                {t("footer.security")}
              </Link>
            </div>

            {/* Company & Support */}
            <div className="flex flex-col gap-1.5 sm:gap-2 text-left min-w-0">
              <span className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-zinc-200 tracking-tight">{t("footer.company")}</span>
              <Link
                href="/about"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] sm:text-xs text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors py-0.5"
              >
                {t("footer.about")}
              </Link>
              <Link
                href="/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] sm:text-xs text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors py-0.5"
              >
                {t("footer.support")}
              </Link>
            </div>
          </div>

          {/* Mobile Bottom Bar / Copyright: Only shown on mobile view */}
          <div className="lg:hidden pt-3 sm:pt-3.5 border-t border-slate-200/60 dark:border-zinc-800/60 flex flex-col gap-1 text-[11px]">
            <span className="font-semibold text-slate-600 dark:text-zinc-300">
              {t("landing.copyright", { year: new Date().getFullYear() })}
            </span>
            <Link href="/contact#complaint" className="text-accent hover:underline w-fit">
              {t("footer.consumerComplaints")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
