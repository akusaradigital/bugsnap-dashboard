"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useT } from "@/components/I18nProvider";
import { SiteNavbar } from "@/components/site/SiteNavbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Reveal } from "@/components/site/motion/Reveal";

export function StaticShell({
  title,
  titleHighlight,
  titleHighlightClass = "text-blue-600 dark:text-blue-500",
  breadcrumb,
  subtitle,
  lastUpdated,
  hideDivider,
  compactHero,
  ambientGlow,
  children,
}: {
  title: string | ReactNode;
  /** Words appended after title in accent color */
  titleHighlight?: string;
  titleHighlightClass?: string;
  breadcrumb?: string;
  subtitle?: string;
  lastUpdated?: string;
  hideDivider?: boolean;
  compactHero?: boolean;
  ambientGlow?: boolean;
  children: ReactNode;
}) {
  const { t } = useT();

  return (
    <div className="min-h-screen text-site-text font-site flex flex-col bg-site-surface">
      <SiteNavbar />

      <main id="main-content" className="flex-1">
        {/* Hero */}
        <div className={`relative overflow-hidden ${compactHero ? "pt-8 sm:pt-10 pb-4 sm:pb-6" : "py-8 sm:py-12 md:py-16"}`}>
          {ambientGlow && (
            <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden" aria-hidden="true">
              <div className="absolute -top-32 -left-20 w-[440px] h-[340px] rounded-full bg-emerald-400/15 dark:bg-emerald-500/10 blur-[90px]" />
              <div className="absolute -top-32 -right-20 w-[440px] h-[340px] rounded-full bg-emerald-400/15 dark:bg-emerald-500/10 blur-[90px]" />
            </div>
          )}
          <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 text-center">
            <Reveal delay={0}>
              {/* breadcrumb */}
              <nav
                className="inline-flex items-center justify-center gap-1.5 text-xs text-site-text-2 mb-3 sm:mb-4 max-w-full px-2"
                aria-label="Breadcrumb"
              >
                <Link href="/" className="shrink-0 hover:text-site-text transition-colors">
                  {t("landing.home")}
                </Link>
                <span className="text-site-text-2/40 shrink-0" aria-hidden="true">
                  ›
                </span>
                <span className="text-site-text font-medium truncate max-w-[200px] sm:max-w-none">
                  {breadcrumb || title}
                </span>
              </nav>
            </Reveal>

            <Reveal delay={0.07}>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
                {title}
                {titleHighlight && (
                  <>
                    {" "}
                    <span className={titleHighlightClass}>{titleHighlight}</span>
                  </>
                )}
              </h1>
            </Reveal>

            {subtitle && (
              <Reveal delay={0.14}>
                <p className="mt-3 text-sm sm:text-base text-site-text-2 max-w-2xl mx-auto leading-relaxed">
                  {subtitle}
                </p>
              </Reveal>
            )}

            {lastUpdated && (
              <Reveal delay={0.18}>
                <p className="mt-3 text-xs text-site-text-2/60 font-medium">
                  Last updated: {lastUpdated}
                </p>
              </Reveal>
            )}
          </div>
        </div>

        {/* divider line */}
        {!hideDivider && <div className="border-t border-site-border" />}

        {/* Page Content */}
        <div className={`mx-auto max-w-6xl px-4 sm:px-6 ${hideDivider ? "pt-6 pb-10 sm:pb-12" : "py-8 sm:py-12"}`}>
          {children}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
