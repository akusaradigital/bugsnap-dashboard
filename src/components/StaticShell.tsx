"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
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
      <header className="sticky top-0 z-40 border-b border-white/70 dark:border-border bg-white/80 dark:bg-background/90 backdrop-blur-xl shadow-sm shadow-slate-200/40 dark:shadow-none">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 sm:px-8 py-3.5 sm:py-4">
          <Link href="/" className="group flex items-center gap-2 sm:gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="BugSnap" className="w-7 h-7 sm:w-8 sm:h-8 object-contain transition-transform duration-300 group-hover:scale-105" />
            <span className="text-base sm:text-lg font-bold tracking-tight group-hover:text-[#6B9A35] dark:group-hover:text-[#A8D666] transition-colors duration-200">BugSnap</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-6 text-sm">
            <Link
              href="/features"
              className={`transition-colors duration-200 ${
                pathname === "/features"
                  ? "text-[#6B9A35] dark:text-[#A8D666] font-semibold"
                  : "text-muted hover:text-[#6B9A35] dark:hover:text-[#A8D666]"
              }`}
            >
              {t("landing.screenRecorder")}
            </Link>
            <Link
              href="/how-it-works"
              className={`transition-colors duration-200 ${
                pathname === "/how-it-works"
                  ? "text-[#6B9A35] dark:text-[#A8D666] font-semibold"
                  : "text-muted hover:text-[#6B9A35] dark:hover:text-[#A8D666]"
              }`}
            >
              {t("landing.howItWorks")}
            </Link>
            <Link
              href="/pricing"
              className={`transition-colors duration-200 ${
                pathname === "/pricing"
                  ? "text-[#6B9A35] dark:text-[#A8D666] font-semibold"
                  : "text-muted hover:text-[#6B9A35] dark:hover:text-[#A8D666]"
              }`}
            >
              {t("landing.pricing")}
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {loadingSession ? (
              <div className="w-28 h-9 bg-slate-200/60 dark:bg-subtle animate-pulse rounded-xl" />
            ) : isLoggedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#89BD49] text-white text-sm font-semibold hover:bg-[#6B9A35] transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
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
          <div className="pointer-events-none absolute -top-12 left-1/2 -z-10 h-48 w-[28rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-[#89BD49]/20 to-emerald-400/20 blur-3xl dark:from-[#89BD49]/10 dark:to-emerald-900/10 animate-pulse-slow" />

          <div className="mx-auto max-w-6xl px-4 sm:px-8 py-10 sm:py-14">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs text-muted mb-6 sm:mb-8" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-[#6B9A35] dark:hover:text-[#A8D666] transition-colors font-medium">{t("landing.home")}</Link>
              <svg className="w-3 h-3 text-muted/60 dark:text-muted/40 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 3l4 5-4 5" />
              </svg>
              <span className="font-semibold text-slate-800 dark:text-foreground truncate" aria-current="page">{title}</span>
            </nav>

            <h1 className="max-w-3xl text-3xl sm:text-5xl font-black tracking-[-0.035em] text-slate-900 dark:text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-muted max-w-2xl leading-relaxed">
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
        <div className="mx-auto max-w-6xl px-4 sm:px-8 py-12">
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
                <li><Link href="/features" className="hover:text-[#6B9A35] dark:hover:text-[#A8D666] transition-colors duration-200">{t("landing.screenRecorder")}</Link></li>
                <li><Link href="/how-it-works" className="hover:text-[#6B9A35] dark:hover:text-[#A8D666] transition-colors duration-200">{t("landing.howItWorks")}</Link></li>
                <li><Link href="/pricing" className="hover:text-[#6B9A35] dark:hover:text-[#A8D666] transition-colors duration-200">{t("landing.pricing")}</Link></li>
                <li><Link href="/security" className="hover:text-[#6B9A35] dark:hover:text-[#A8D666] transition-colors duration-200">{t("landing.security")}</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("landing.resources")}</h5>
              <ul className="space-y-2 text-xs text-muted">
                <li><Link href="/docs" className="hover:text-[#6B9A35] dark:hover:text-[#A8D666] transition-colors duration-200">{t("landing.docs")}</Link></li>
                <li><Link href="/help" className="hover:text-[#6B9A35] dark:hover:text-[#A8D666] transition-colors duration-200">{t("landing.help")}</Link></li>
                <li><a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer" className="hover:text-[#6B9A35] dark:hover:text-[#A8D666] transition-colors duration-200">{t("landing.chromeExt")}</a></li>
                <li><Link href="/privacy" className="hover:text-[#6B9A35] dark:hover:text-[#A8D666] transition-colors duration-200">{t("landing.privacy")}</Link></li>
                <li><Link href="/terms" className="hover:text-[#6B9A35] dark:hover:text-[#A8D666] transition-colors duration-200">{t("landing.terms")}</Link></li>
                <li><Link href="/contact" className="hover:text-[#6B9A35] dark:hover:text-[#A8D666] transition-colors duration-200">{t("landing.contact")}</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("landing.company")}</h5>
              <ul className="space-y-2 text-xs text-muted">
                <li><Link href="/about" className="hover:text-[#6B9A35] dark:hover:text-[#A8D666] transition-colors duration-200">{t("landing.about")}</Link></li>
                <li>
                  <a href="https://akusaradigital.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#6B9A35] dark:hover:text-[#A8D666] transition-colors duration-200">
                    akusaradigital.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted">{t("landing.copyright", { year: new Date().getFullYear() })}</p>
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
          </div>
        </div>
      </footer>
    </div>
  );
}
