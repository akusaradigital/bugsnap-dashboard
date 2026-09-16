"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useT } from "@/components/I18nProvider";

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf";

export function StaticShell({
  title,
  subtitle,
  lastUpdated,
  children,
}: {
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  children: ReactNode;
}) {
  const { t } = useT();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setIsLoggedIn(!!data.session?.user);
        setLoadingSession(false);
      })
      .catch(() => setLoadingSession(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
      setLoadingSession(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,#eef2ff_0%,#ffffff_40%,#f0fdf4_100%)] text-slate-900 font-sans dark:bg-none dark:bg-background dark:text-foreground flex flex-col">

      {/* Navbar - seragam dengan landing page */}
      <header className="sticky top-0 z-20 border-b border-white/70 dark:border-border bg-white/80 dark:bg-background/90 backdrop-blur-xl shadow-sm shadow-slate-200/40 dark:shadow-none">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <Link href="/" className="group flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="BugSnap" className="w-8 h-8 object-contain transition-transform duration-300 group-hover:scale-105" />
            <span className="text-lg font-bold tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">BugSnap</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-6 text-sm text-muted">
            <Link href="/features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200">{t("landing.screenRecorder")}</Link>
            <Link href="/how-it-works" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200">{t("landing.howItWorks")}</Link>
            <Link href="/pricing" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200">{t("landing.pricing")}</Link>
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/google.svg" alt="Google" className="w-4 h-4 shrink-0" />
                <span>{t("landing.signInGoogle")}</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Page hero - breadcrumb + title */}
        <div className="relative overflow-hidden border-b border-white/70 dark:border-border bg-white/50 dark:bg-background/50">
          {/* Subtle glow */}
          <div className="pointer-events-none absolute -top-12 left-1/2 -z-10 h-48 w-[28rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-300/20 to-violet-200/20 blur-3xl dark:from-indigo-900/10 dark:to-violet-900/10 animate-pulse-slow" />

          <div className="mx-auto max-w-5xl px-6 py-14">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs text-muted mb-8" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium">{t("landing.home")}</Link>
              <svg className="w-3 h-3 text-border shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 3l4 5-4 5" />
              </svg>
              <span className="font-semibold text-slate-800 dark:text-foreground truncate" aria-current="page">{title}</span>
            </nav>

            <h1 className="max-w-3xl text-4xl sm:text-5xl font-black tracking-[-0.035em]">
              <span className="bg-gradient-to-br from-slate-950 via-indigo-800 to-slate-800 bg-clip-text text-transparent dark:from-white dark:via-indigo-200 dark:to-white">
                {title}
              </span>
            </h1>
            {subtitle && (
              <p className="mt-4 text-base text-slate-600 dark:text-muted max-w-2xl leading-relaxed">
                {subtitle}
              </p>
            )}
            {lastUpdated && <p className="mt-3 text-xs text-muted">Last updated: {lastUpdated}</p>}
          </div>
        </div>

        {children}
      </main>

      {/* Footer - seragam dengan landing page */}
      <footer className="border-t border-white/70 dark:border-border bg-slate-50/80 dark:bg-background">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
            {/* Branding */}
            <div className="col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon.svg" alt="" aria-hidden="true" className="w-6 h-6 object-contain" />
                <span className="text-sm font-semibold">BugSnap</span>
              </div>
              <p className="text-xs text-muted max-w-xs leading-relaxed">
                {t("landing.footDesc")}
              </p>
            </div>

            {/* Product */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("landing.product")}</h5>
              <ul className="space-y-2 text-xs text-muted">
                <li><Link href="/features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200">{t("landing.screenRecorder")}</Link></li>
                <li><Link href="/how-it-works" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200">{t("landing.howItWorks")}</Link></li>
                <li><Link href="/pricing" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200">{t("landing.pricing")}</Link></li>
                <li><Link href="/security" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200">{t("landing.security")}</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("landing.resources")}</h5>
              <ul className="space-y-2 text-xs text-muted">
                <li><Link href="/docs" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200">{t("landing.docs")}</Link></li>
                <li><Link href="/help" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200">{t("landing.help")}</Link></li>
                <li><a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200">{t("landing.chromeExt")}</a></li>
                <li><Link href="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200">{t("landing.privacy")}</Link></li>
                <li><Link href="/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200">{t("landing.terms")}</Link></li>
                <li><Link href="/contact" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200">{t("landing.contact")}</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("landing.company")}</h5>
              <ul className="space-y-2 text-xs text-muted">
                <li><Link href="/about" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200">{t("landing.about")}</Link></li>
                <li>
                  <a href="https://akusaradigital.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200">
                    akusaradigital.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted">{t("landing.copyright", { year: new Date().getFullYear() })}</p>
            <p className="text-xs text-muted">{t("landing.builtOn")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
