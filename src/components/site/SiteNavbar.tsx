"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useT } from "@/components/I18nProvider";
import { IconHome, IconMenu2, IconX } from "./TablerIcons";

export function SiteNavbar() {
  const { t } = useT();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session?.user);
    }).catch(() => {});

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu on Escape key
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  const navLinks = [
    { href: "/features", label: t("site.nav.features") },
    { href: "/solutions", label: t("site.nav.solutions") },
    { href: "/how-it-works", label: t("site.nav.howItWorks") },
    { href: "/extension", label: t("site.nav.extension") },
    // Payment UI temporarily commented out until ready:
    // { href: "/pricing", label: t("site.nav.pricing") },
    { href: "/docs", label: t("site.nav.docs") },
    { href: "/blog", label: t("site.nav.blog") },
  ];

  return (
    <>
      <div className="h-16" aria-hidden="true" />
      <header
      className={`fixed inset-x-0 top-0 z-50 border-b border-slate-200/60 dark:border-slate-800/60 text-site-text font-site bg-white/90 dark:bg-slate-950/90 backdrop-blur-md transition-shadow duration-300 ${
        scrolled ? "shadow-sm shadow-black/5" : ""
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
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
            <span className="max-w-[180px] truncate text-[10px] font-medium tracking-[0.12em] text-slate-600 dark:text-slate-300 sm:max-w-[220px]">From Click to Fix.</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href + "/"));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  isActive
                    ? "text-[#2563EB] dark:text-[#3B82F6] font-semibold bg-blue-100/80 dark:bg-blue-950/40"
                    : "hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-800/40"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Auth Action */}
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] sm:min-h-0 rounded-full bg-accent text-slate-900 text-xs sm:text-sm font-semibold hover:bg-accent-hover transition-all shadow-xs"
            >
              <IconHome size={15} className="shrink-0" />
              <span>{t("site.nav.dashboard")}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 shadow-2xs transition-all"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/google.svg"
                alt=""
                aria-hidden="true"
                width={16}
                height={16}
                className="w-4 h-4 shrink-0"
              />
              <span>{t("site.nav.loginGoogle")}</span>
            </Link>
          )}

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden inline-flex items-center justify-center min-w-[44px] min-h-[44px] p-2 rounded-md text-site-text-2 hover:text-site-text hover:bg-site-surface-2 transition-colors touch-manipulation"
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <IconX size={20} /> : <IconMenu2 size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-site-border bg-site-surface px-4 py-3 space-y-1 animate-in fade-in slide-in-from-top-2">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href + "/"));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center min-h-[44px] px-3 py-2.5 rounded-md text-sm font-medium transition-colors border ${
                  isActive
                    ? "text-[#2563EB] dark:text-[#3B82F6] bg-blue-100/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/40 font-semibold"
                    : "border-transparent text-site-text-2 hover:text-site-text hover:bg-site-surface-2/60"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          {isLoggedIn ? (
            <div className="pt-2 border-t border-site-border-subtle mt-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 min-h-[44px] px-3 py-2.5 rounded-md text-sm font-semibold bg-accent text-slate-900"
              >
                <IconHome size={16} className="shrink-0" />
                <span>{t("site.nav.dashboard")}</span>
              </Link>
            </div>
          ) : (
            <div className="pt-2 border-t border-site-border-subtle mt-2">
              <Link
                href="/login"
                className="flex items-center gap-2 min-h-[44px] px-3 py-2.5 rounded-md text-sm font-medium text-site-text-2 hover:text-site-text hover:bg-site-surface-2/60"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icons/google.svg"
                  alt=""
                  aria-hidden="true"
                  width={16}
                  height={16}
                  className="w-4 h-4 shrink-0"
                />
                <span>{t("site.nav.loginGoogle")}</span>
              </Link>
            </div>
          )}
        </div>
      )}
      </header>
    </>
  );
}
