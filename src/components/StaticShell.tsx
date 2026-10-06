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

      <main className="flex-1">
        {/* Hero */}
        <div className="relative overflow-hidden py-16 sm:py-24">
          {/* soft mesh gradient background */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: [
                "radial-gradient(ellipse 60% 55% at 10% 0%, var(--glow-primary), transparent 65%)",
                "radial-gradient(ellipse 45% 40% at 95% 15%, var(--glow-secondary), transparent 60%)",
                "radial-gradient(ellipse 35% 40% at 55% 100%, var(--glow-accent), transparent 55%)",
              ].join(", "),
            }}
          />

          {/* floating orbs */}
          <div
            className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl opacity-40"
            style={{ background: "var(--glow-primary)", animation: "sOrb1 10s ease-in-out infinite" }}
          />
          <div
            className="pointer-events-none absolute -bottom-16 right-0 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-25"
            style={{ background: "var(--glow-secondary)", animation: "sOrb2 14s ease-in-out infinite" }}
          />

          {/* subtle grid texture */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(var(--site-border) 1px, transparent 1px), linear-gradient(90deg, var(--site-border) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />

          <style>{`
            @keyframes sOrb1 {
              0%,100% { transform: translate(0,0) scale(1); }
              33% { transform: translate(40px,35px) scale(1.12); }
              66% { transform: translate(-20px,55px) scale(0.93); }
            }
            @keyframes sOrb2 {
              0%,100% { transform: translate(0,0) scale(1); }
              40% { transform: translate(-55px,-30px) scale(1.18); }
              70% { transform: translate(35px,-20px) scale(0.88); }
            }
          `}</style>

          <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 text-center">
            <Reveal delay={0}>
              {/* breadcrumb */}
              <nav
                className="inline-flex items-center justify-center gap-1.5 text-xs text-site-text-2 mb-6 max-w-full px-2"
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
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-site-text leading-tight">
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
