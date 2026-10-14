"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useT } from "@/components/I18nProvider";
import { SiteNavbar } from "@/components/site/SiteNavbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Reveal } from "@/components/site/motion/Reveal";

export function StaticShell({
  title,
  breadcrumb,
  subtitle,
  lastUpdated,
  children,
}: {
  title: string;
  breadcrumb?: string;
  subtitle?: string;
  lastUpdated?: string;
  children: ReactNode;
}) {
  const { t } = useT();

  return (
    <div className="min-h-screen text-site-text font-site flex flex-col bg-site-surface">
      <SiteNavbar />

      <main id="main-content" className="flex-1">
        {/* Hero */}
        <div className="relative overflow-hidden py-10 sm:py-16 md:py-20">
          <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 text-center">
            <Reveal delay={0}>
              {/* breadcrumb */}
              <nav
                className="inline-flex items-center justify-center gap-1.5 text-xs text-site-text-2 mb-4 sm:mb-6 max-w-full px-2"
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
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-site-text leading-tight">
                {title}
              </h1>
            </Reveal>

            {subtitle && (
              <Reveal delay={0.14}>
                <p className="mt-4 text-sm sm:text-lg text-site-text-2 max-w-2xl mx-auto leading-relaxed">
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
        <div className="border-t border-site-border" />

        {/* Page Content */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-16">
          {children}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
