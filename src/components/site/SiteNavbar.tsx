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

  const navLinks = [
    { href: "/features", label: t("site.nav.features") },
    { href: "/solutions", label: t("site.nav.solutions") },
    { href: "/how-it-works", label: t("site.nav.howItWorks") },
    { href: "/extension", label: t("site.nav.extension") },
    { href: "/pricing", label: t("site.nav.pricing") },
    { href: "/docs", label: t("site.nav.docs") },
    { href: "/blog", label: t("site.nav.blog") },
  ];

  return (
    <header
      className={`sticky top-0 z-50 border-b border-site-border text-site-text font-site bg-site-surface transition-shadow duration-300 ${
        scrolled ? "shadow-sm shadow-black/5" : ""
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon.svg"
            alt=""
            aria-hidden="true"
            className="w-6 h-6 object-contain transition-transform group-hover:scale-105"
          />
          <span className="text-sm font-bold tracking-tight text-site-text">BugSnap</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-site-text-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  isActive
                    ? "text-site-text bg-site-surface-2 font-semibold"
                    : "hover:text-site-text hover:bg-site-surface-2/60"
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
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-accent text-slate-900 text-xs font-semibold hover:bg-accent-hover hover:text-white transition-all shadow-2xs"
            >
              <IconHome size={14} className="shrink-0" />
              <span>{t("site.nav.dashboard")}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-site-border bg-site-surface hover:bg-site-surface-2 text-xs font-semibold text-site-text transition-all"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/google.svg" alt="" aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
              <span>Login with Google</span>
            </Link>
          )}

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-md text-site-text-2 hover:text-site-text hover:bg-site-surface-2 transition-colors"
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <IconX size={20} /> : <IconMenu2 size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-site-border bg-site-surface px-4 py-3 space-y-1 animate-in fade-in slide-in-from-top-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "text-site-text bg-site-surface-2 font-semibold"
                  : "text-site-text-2 hover:text-site-text hover:bg-site-surface-2/60"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {isLoggedIn ? (
            <div className="pt-2 border-t border-site-border-subtle mt-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold bg-accent text-slate-900"
              >
                <IconHome size={16} className="shrink-0" />
                <span>{t("site.nav.dashboard")}</span>
              </Link>
            </div>
          ) : (
            <div className="pt-2 border-t border-site-border-subtle mt-2">
              <Link
                href="/login"
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-site-text-2 hover:text-site-text hover:bg-site-surface-2/60"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/google.svg" alt="" aria-hidden="true" className="w-4 h-4 shrink-0" />
                <span>Login with Google</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
