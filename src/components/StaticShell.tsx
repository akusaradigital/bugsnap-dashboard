"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useT } from "@/components/I18nProvider";
import { SiteNavbar } from "@/components/site/SiteNavbar";
import { SiteFooter } from "@/components/site/SiteFooter";

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

  return (
    <div className="min-h-screen bg-site-bg text-site-text font-site flex flex-col transition-colors">
      <SiteNavbar />

      <main className="flex-1">
        {/* Page Hero Header */}
        <div className="border-b border-site-border bg-site-surface py-10 sm:py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs text-site-text-2 mb-4" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-site-text transition-colors">
                {t("landing.home")}
              </Link>
              <span className="text-site-text-2/40" aria-hidden="true">/</span>
              <span className="font-semibold text-site-text truncate" aria-current="page">
                {title}
              </span>
            </nav>

            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-site-text">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-3 text-sm sm:text-base text-site-text-2 max-w-2xl leading-relaxed">
                {subtitle}
              </p>
            )}
            {lastUpdated && (
              <p className="mt-2 text-xs text-site-text-2 font-mono">
                Last updated: {lastUpdated}
              </p>
            )}
          </div>
        </div>

        {/* Page Content Slot */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
          {children}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
