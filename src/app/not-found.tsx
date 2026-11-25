"use client";

import Link from "next/link";
import { useT } from "@/components/I18nProvider";

export default function NotFound() {
  const { t } = useT();

  return (
    <div className="min-h-screen bg-site-bg text-site-text font-site flex flex-col justify-between selection:bg-accent selection:text-white relative overflow-hidden">
      {/* Background blueprint grid ambiance */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-20 bg-[linear-gradient(to_right,#dbeafe_1px,transparent_1px),linear-gradient(to_bottom,#dbeafe_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:32px_32px]"
      />

      {/* Ambient background glow orbs */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[38rem] h-[38rem] rounded-full blur-3xl opacity-35 dark:opacity-25"
        style={{
          background: "radial-gradient(circle, rgba(137,189,73,0.35) 0%, rgba(2,92,253,0.18) 50%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 w-88 h-88 rounded-full blur-3xl opacity-25 dark:opacity-15"
        style={{
          background: "radial-gradient(circle, rgba(2,92,253,0.25) 0%, rgba(137,189,73,0.15) 50%, transparent 70%)",
        }}
      />

      {/* Minimal Header */}
      <header className="relative z-10 border-b border-site-border bg-site-surface/80 backdrop-blur-sm px-4 sm:px-6 py-3.5">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <Link href="/" className="flex min-w-0 items-center gap-2 group shrink-0" aria-label="BugSnap. From Click to Fix.">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-day.svg"
              alt="BugSnap"
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 object-contain dark:hidden"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-dark.svg"
              alt="BugSnap"
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 object-contain hidden dark:block"
            />
            <span className="flex min-w-0 flex-col justify-center leading-tight">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">BugSnap</span>
              <span className="max-w-[180px] truncate text-[10px] font-medium tracking-[0.12em] text-slate-600 dark:text-slate-300 sm:max-w-[220px]">{t("nfFx.tagline")}</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Main 404 Content - Structured after Reference Layout */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 text-center">
        <div className="w-full max-w-xl mx-auto flex flex-col items-center">
          {/* Big 404 Heading */}
          <div className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tight text-slate-900 dark:text-white select-none leading-none">
            {t("notFound.code")}
          </div>

          {/* Headline */}
          <h1 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t("notFound.title")}
          </h1>

          {/* Subtitle */}
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium max-w-md mx-auto">
            {t("notFound.description")}
          </p>

          {/* Illustration Container */}
          <div className="relative w-full max-w-sm sm:max-w-md md:max-w-lg mx-auto my-5 sm:my-6 transition-transform duration-500 hover:scale-[1.01]">
            {/* Ambient backlight halo */}
            <div
              className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 sm:w-80 h-64 sm:h-80 rounded-full blur-3xl opacity-35 dark:opacity-20 bg-blue-400/30 dark:bg-blue-600/20"
            />

            {/* Day Mode 404 Illustration */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/bugsnap-404.svg"
              alt="404 Page Not Found"
              width={800}
              height={597}
              className="relative z-10 w-full h-auto object-contain rounded-2xl drop-shadow-md dark:hidden select-none"
            />
            {/* Dark Mode 404 Illustration */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/bugsnap-404-dark.svg"
              alt="404 Page Not Found"
              width={800}
              height={597}
              className="relative z-10 w-full h-auto object-contain rounded-2xl drop-shadow-xl hidden dark:block select-none"
            />
          </div>

          {/* Message below illustration */}
          <p className="text-slate-800 dark:text-slate-200 text-sm sm:text-base font-semibold leading-relaxed max-w-md mx-auto whitespace-pre-line">
            {t("notFound.submessage")}
          </p>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
            <Link
              href="/"
              className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm sm:text-base font-bold transition-all shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.99] text-center"
            >
              {t("notFound.backHome")}
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3.5 rounded-xl border border-site-border bg-site-surface/80 hover:bg-site-surface text-site-text text-sm sm:text-base font-semibold transition-colors text-center"
            >
              {t("notFound.goDashboard")}
            </Link>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 border-t border-site-border py-4 text-center text-xs text-site-text-2 bg-site-surface/80 backdrop-blur-sm px-4 flex flex-wrap items-center justify-center gap-3">
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
