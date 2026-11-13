"use client";

import Link from "next/link";
import { useT } from "@/components/I18nProvider";

export default function NotFound() {
  const { t } = useT();

  return (
    <div className="min-h-screen bg-site-bg text-site-text font-site flex flex-col justify-between selection:bg-accent selection:text-white relative overflow-hidden">
      {/* Ambient background glow orbs */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[38rem] h-[38rem] rounded-full blur-3xl opacity-35 dark:opacity-25"
        style={{
          background: "radial-gradient(circle, rgba(137,189,73,0.35) 0%, rgba(2,92,253,0.18) 50%, transparent 70%)",
          animation: "glowPulse 6s ease-in-out infinite",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 w-88 h-88 rounded-full blur-3xl opacity-25 dark:opacity-15"
        style={{
          background: "radial-gradient(circle, rgba(2,92,253,0.25) 0%, rgba(137,189,73,0.15) 50%, transparent 70%)",
          animation: "glowPulse 8s ease-in-out infinite reverse",
        }}
      />

      <style>{`
        @keyframes glowPulse {
          0%, 100% { transform: scale(1) translate(-50%, 0); opacity: 0.25; }
          50% { transform: scale(1.12) translate(-50%, 16px); opacity: 0.4; }
        }
        @keyframes swayMascot {
          0%, 100% {
            transform: translateX(0px) translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateX(-14px) translateY(-4px) rotate(-4.5deg);
          }
          50% {
            transform: translateX(0px) translateY(2px) rotate(0deg);
          }
          75% {
            transform: translateX(14px) translateY(-4px) rotate(4.5deg);
          }
        }
        @keyframes shadowSway {
          0%, 100% {
            transform: translateX(0px) scale(1);
            opacity: 0.35;
          }
          25% {
            transform: translateX(-10px) scale(0.92);
            opacity: 0.25;
          }
          50% {
            transform: translateX(0px) scale(1.04);
            opacity: 0.38;
          }
          75% {
            transform: translateX(10px) scale(0.92);
            opacity: 0.25;
          }
        }
        @keyframes pulseHalo {
          0%, 100% {
            transform: scale(0.96);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.08);
            opacity: 0.6;
          }
        }
      `}</style>

      <header className="relative z-10 border-b border-site-border bg-site-surface px-4 sm:px-6 py-3.5">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <Link href="/" className="flex min-w-0 items-center gap-2 group shrink-0" aria-label="BugSnap. From Click to Fix.">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/bugsnap-icon-day.svg"
              alt="BugSnap"
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 object-contain"
            />
            <span className="flex min-w-0 flex-col justify-center leading-tight">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">BugSnap</span>
              <span className="max-w-[180px] truncate text-[10px] font-medium tracking-[0.12em] text-slate-600 dark:text-slate-300 sm:max-w-[220px]">{t("nfFx.tagline")}</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Center 404 with Animation */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-10 sm:py-16 text-center">
        <div className="w-full max-w-lg mx-auto flex flex-col items-center">
          {/* Animated Mascot Section */}
          <div className="relative w-full flex flex-col items-center mb-4 group cursor-default">
            {/* Ambient backlight halo */}
            <div
              className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 sm:w-80 h-64 sm:h-80 rounded-full blur-2xl opacity-40 dark:opacity-30 bg-accent/25 dark:bg-accent/15 transition-all duration-700 group-hover:opacity-65 group-hover:scale-110"
              style={{ animation: "pulseHalo 4s ease-in-out infinite" }}
            />

            {/* Swaying 404 Mascot (Kanan-Kiri) */}
            <div
              className="relative z-10 transition-transform duration-500 group-hover:scale-105"
              style={{ animation: "swayMascot 3.6s ease-in-out infinite" }}
            >
              {/* Day Mode 404 Illustration */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/bugsnap-404.svg"
                alt="404 Page Not Found"
                className="w-56 sm:w-72 md:w-80 max-w-[min(20rem,calc(100vw-3rem))] h-auto aspect-square object-contain mx-auto drop-shadow-xl dark:hidden select-none"
              />
              {/* Dark Mode 404 Illustration */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/bugsnap-404-dark.svg"
                alt="404 Page Not Found"
                className="w-56 sm:w-72 md:w-80 max-w-[min(20rem,calc(100vw-3rem))] h-auto aspect-square object-contain mx-auto drop-shadow-2xl hidden dark:block select-none"
              />
            </div>

            {/* Dynamic Ground Shadow below swaying illustration */}
            <div
              className="w-40 sm:w-56 h-3.5 sm:h-4 mt-2 rounded-[50%] bg-slate-900/15 dark:bg-black/50 blur-xs"
              style={{ animation: "shadowSway 3.6s ease-in-out infinite" }}
            />
          </div>

          {/* Headline */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-site-text mt-3">
            {t("notFound.title")}
          </h1>

          {/* Description */}
          <p className="mt-2.5 text-xs sm:text-sm text-site-text-2 leading-relaxed max-w-md mx-auto">
            {t("notFound.description")}
          </p>

          {/* Action Buttons: Responsive Wrap for 360px-440px Viewports */}
          <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 w-full sm:w-auto max-w-xs sm:max-w-none">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold transition-all shadow-md hover:scale-[1.02] active:scale-[0.99] text-center"
            >
              {t("notFound.backHome")}
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-site-border bg-site-surface hover:bg-site-surface-2 text-site-text text-sm font-semibold transition-colors text-center"
            >
              {t("notFound.goDashboard")}
            </Link>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 border-t border-site-border py-4 text-center text-xs text-site-text-2 bg-site-surface px-4 flex flex-wrap items-center justify-center gap-3">
        <span>© {new Date().getFullYear()} BugSnap by Akusara Digital</span>
        <span>•</span>
        <Link href="/terms" className="hover:text-site-text hover:underline">{t("nfFx.footerTerms")}</Link>
        <span>•</span>
        <Link href="/privacy" className="hover:text-site-text hover:underline">{t("nfFx.footerPrivacy")}</Link>
        <span>•</span>
        <Link href="/contact#complaint" className="hover:text-site-text hover:underline text-emerald-600 dark:text-emerald-400">{t("nfFx.footerComplaint")}</Link>
      </footer>
    </div>
  );
}
