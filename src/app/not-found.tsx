"use client";

import Link from "next/link";
import { useT } from "@/components/I18nProvider";
import { Icon } from "@/lib/iconify";

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
          <Link href="/" className="flex items-center gap-2 font-bold text-sm text-site-text group shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-day.svg"
              alt="BugSnap"
              className="w-6 h-6 object-contain transition-transform group-hover:scale-110 dark:hidden"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-dark.svg"
              alt="BugSnap"
              className="w-6 h-6 object-contain transition-transform group-hover:scale-110 hidden dark:block"
            />
            <span>BugSnap</span>
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
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-slate-900 text-xs font-bold transition-all shadow-xs shadow-accent/25 hover:shadow-accent/40 text-center"
            >
              <Icon icon="lucide:arrow-left" className="w-4 h-4 shrink-0" />
              <span>{t("notFound.backHome")}</span>
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-site-border bg-site-surface hover:bg-site-surface-2 text-site-text text-xs font-semibold transition-all text-center"
            >
              <Icon icon="lucide:layout-dashboard" className="w-4 h-4 shrink-0" />
              <span>{t("notFound.goDashboard")}</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 border-t border-site-border py-4 text-center text-xs text-site-text-2 bg-site-surface px-4 flex flex-wrap items-center justify-center gap-3">
        <span>© {new Date().getFullYear()} BugSnap by Akusara Digital</span>
        <span>•</span>
        <Link href="/terms" className="hover:text-site-text hover:underline">Terms</Link>
        <span>•</span>
        <Link href="/privacy" className="hover:text-site-text hover:underline">Privacy</Link>
        <span>•</span>
        <Link href="/contact#complaint" className="hover:text-site-text hover:underline text-emerald-600 dark:text-emerald-400">Pengaduan Konsumen</Link>
      </footer>
    </div>
  );
}
