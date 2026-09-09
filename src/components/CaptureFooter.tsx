"use client";

import Link from "next/link";
import { useT } from "@/components/I18nProvider";

function ChromeLogo({ className = "w-4 h-4 shrink-0" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 2a9.96 9.96 0 0 0-7.85 3.82l3.43 5.95A4.5 4.5 0 0 1 12 7.5h9.49A10 10 0 0 0 12 2z"
      />
      <path
        fill="#34A853"
        d="M4.15 5.82A10 10 0 0 0 2 12a10 10 0 0 0 6.64 9.42l3.43-5.95A4.5 4.5 0 0 1 7.5 12a4.52 4.52 0 0 1 .44-1.93L4.15 5.82z"
      />
      <path
        fill="#FBBC05"
        d="M21.49 7.5H12a4.5 4.5 0 0 1 3.9 6.75L12.47 20.2A10 10 0 0 0 22 12c0-1.58-.37-3.08-1.02-4.42l.51-.08z"
      />
      <circle cx="12" cy="12" r="4.5" fill="#FFFFFF" />
      <circle cx="12" cy="12" r="3.2" fill="#4285F4" />
    </svg>
  );
}

function BrowserIllustration({ className = "w-28 h-20 shrink-0" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 150 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Background Soft Glow */}
      <ellipse cx="70" cy="52" rx="46" ry="32" fill="#6366F1" fillOpacity="0.08" />

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

        {/* Chrome Logo Centered in Browser Window */}
        <g transform="translate(38, 36) scale(1.05)">
          <path
            fill="#EA4335"
            d="M12 2a9.96 9.96 0 0 0-7.85 3.82l3.43 5.95A4.5 4.5 0 0 1 12 7.5h9.49A10 10 0 0 0 12 2z"
          />
          <path
            fill="#34A853"
            d="M4.15 5.82A10 10 0 0 0 2 12a10 10 0 0 0 6.64 9.42l3.43-5.95A4.5 4.5 0 0 1 7.5 12a4.52 4.52 0 0 1 .44-1.93L4.15 5.82z"
          />
          <path
            fill="#FBBC05"
            d="M21.49 7.5H12a4.5 4.5 0 0 1 3.9 6.75L12.47 20.2A10 10 0 0 0 22 12c0-1.58-.37-3.08-1.02-4.42l.51-.08z"
          />
          <circle cx="12" cy="12" r="4.5" fill="#FFFFFF" />
          <circle cx="12" cy="12" r="3.2" fill="#4285F4" />
        </g>
      </g>

      {/* Overlapping Floating BugSnap Card Badge */}
      <g filter="drop-shadow(0 6px 14px rgba(99, 102, 241, 0.28))">
        <rect
          x="88"
          y="22"
          width="42"
          height="42"
          rx="10"
          className="fill-white dark:fill-zinc-800 stroke-indigo-200 dark:stroke-indigo-800/80"
          strokeWidth="1.5"
        />
        {/* BugSnap Icon on Badge */}
        <g transform="translate(98, 32) scale(0.9)">
          <circle cx="12" cy="12" r="10.5" fill="#6366F1" fillOpacity="0.12" />
          <circle cx="12" cy="12" r="6" stroke="#6366F1" strokeWidth="2" />
          <circle cx="12" cy="12" r="2.5" fill="#6366F1" />
          {/* Subtle Antennae */}
          <line x1="12" y1="1" x2="12" y2="4.5" stroke="#6366F1" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="12" y1="19.5" x2="12" y2="23" stroke="#6366F1" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="1" y1="12" x2="4.5" y2="12" stroke="#6366F1" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="19.5" y1="12" x2="23" y2="12" stroke="#6366F1" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      </g>

      {/* Dynamic Sparkle / Accent Rays (Top-Right of BugSnap Badge) */}
      <path d="M136 18L142 14" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" />
      <path d="M141 26L147 25" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" />
      <path d="M131 10L132 4" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" />
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
            <BrowserIllustration className="w-24 h-16 sm:w-28 sm:h-20 shrink-0 select-none drop-shadow-sm" />
            <div className="flex flex-col text-left min-w-0">
              <h4 className="text-xs sm:text-sm md:text-base font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                {t("footer.captureBugsFaster")}
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 leading-snug mt-1 whitespace-normal sm:whitespace-nowrap">
                {t("footer.captureDesc")}
              </p>
              <a
                href="https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all duration-150 w-fit mt-2.5 group"
                title={t("footer.addToChrome")}
              >
                <ChromeLogo className="w-3.5 h-3.5 shrink-0" />
                <span>{t("footer.addToChrome")}</span>
                <svg
                  className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>

          {/* Copyright on the Left: balances the 4 columns on the right */}
          <div className="hidden lg:block text-[11px] sm:text-xs text-slate-400 dark:text-zinc-500 pt-1">
            {t("footer.copyright", { year: new Date().getFullYear() })}
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
              <img src="/icon.svg" alt="BugSnap" className="w-4 h-4 sm:w-4.5 sm:h-4.5 object-contain shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-none">BugSnap</span>
            </Link>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-snug">
              {t("footer.tagline")}
            </p>
          </div>

          {/* 4-Column Navigation Grid: Balanced with mobile-friendly tap targets and vertical spacing */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 sm:gap-x-8 gap-y-5 sm:gap-y-6 items-start">
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
                href="/how-it-works"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] sm:text-xs text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors py-0.5"
              >
                {t("footer.howItWorks")}
              </Link>
              <Link
                href="/pricing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] sm:text-xs text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors py-0.5"
              >
                {t("footer.pricing")}
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
                className="text-[11px] sm:text-xs text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors py-0.5"
              >
                {t("footer.status")}
              </Link>
            </div>

            {/* Company */}
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
              <Link
                href="/security"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] sm:text-xs text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors py-0.5"
              >
                {t("footer.security")}
              </Link>
            </div>

            {/* Legal */}
            <div className="flex flex-col gap-1.5 sm:gap-2 text-left min-w-0">
              <span className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-zinc-200 tracking-tight">{t("footer.legal")}</span>
              <Link
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] sm:text-xs text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors py-0.5"
              >
                {t("footer.privacy")}
              </Link>
              <Link
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] sm:text-xs text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors py-0.5"
              >
                {t("footer.terms")}
              </Link>
            </div>
          </div>

          {/* Mobile Bottom Bar / Copyright: Only shown on mobile view */}
          <div className="lg:hidden pt-3 sm:pt-3.5 border-t border-slate-200/60 dark:border-zinc-800/60 flex items-center justify-between text-[11px] sm:text-xs text-slate-400 dark:text-zinc-500">
            <span>{t("footer.copyright", { year: new Date().getFullYear() })}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
