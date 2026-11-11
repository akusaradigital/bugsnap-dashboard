"use client";

import Link from "next/link";
import { useT } from "@/components/I18nProvider";
import { Icon } from "@/lib/iconify";
import { CHROME_STORE_URL, FIREFOX_STORE_URL } from "@/lib/constants";
import { Reveal } from "./motion/Reveal";
import { CookieConsentBanner } from "./CookieConsentBanner";
import { BackToTop } from "./BackToTop";

export function SiteFooter() {
  const { t } = useT();

  return (
    <footer className="border-t border-site-border bg-site-surface-2 text-site-text font-site transition-colors">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
          {/* Brand & Consumer Trust Column (lg:col-span-4) */}
          <Reveal delay={0} className="lg:col-span-4 space-y-3.5 min-w-0">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-day.svg"
                alt=""
                aria-hidden="true"
                width={24}
                height={24}
                className="w-6 h-6 object-contain dark:hidden"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-dark.svg"
                alt=""
                aria-hidden="true"
                width={24}
                height={24}
                className="w-6 h-6 object-contain hidden dark:block"
              />
              <span className="text-sm font-bold tracking-tight text-site-text">BugSnap</span>
            </div>
            <p className="text-xs text-site-text-2 leading-relaxed">
              {t("landing.footDesc")}
            </p>
            <div className="flex flex-col gap-2 pt-1 min-w-0">
              <a
                href={CHROME_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs text-site-text-2 hover:text-site-text transition-colors w-fit max-w-full"
              >
                <Icon icon="logos:chrome-web-store" className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{t("landing.chromeWebStore")}</span>
              </a>
              <a
                href={FIREFOX_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs text-site-text-2 hover:text-site-text transition-colors w-fit max-w-full"
              >
                <Icon icon="logos:firefox" className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{t("landing.firefoxAddons")}</span>
              </a>
                      </div>
          </Reveal>

          {/* Links Grid: 4 columns across lg:col-span-8 */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-6 min-w-0">
            {/* 1. Product Links */}
            <Reveal delay={0.08} className="space-y-3 min-w-0">
              <h5 className="text-xs font-bold text-site-text uppercase tracking-wider truncate">
                {t("landing.product")}
              </h5>
              <ul className="space-y-2 text-xs text-site-text-2">
                <li><Link href="/features" className="hover:text-site-text transition-colors block py-0.5 truncate">{t("site.nav.features")}</Link></li>
                <li><Link href="/solutions" className="hover:text-site-text transition-colors block py-0.5 truncate">{t("site.nav.solutions")}</Link></li>
                <li><Link href="/extension" className="hover:text-site-text transition-colors block py-0.5 truncate">{t("site.nav.extension")}</Link></li>
                <li><Link href="/how-it-works" className="hover:text-site-text transition-colors block py-0.5 truncate">{t("site.nav.howItWorks")}</Link></li>
                <li><Link href="/visual-compare" className="hover:text-site-text transition-colors block py-0.5 truncate">{t("landing.compare")}</Link></li>
                {/* Payment UI temporarily commented out until ready: */}
                {/* <li><Link href="/pricing" className="hover:text-site-text transition-colors block py-0.5 truncate">{t("site.nav.pricing")}</Link></li> */}
              </ul>
            </Reveal>

            {/* 2. Resources & AI */}
            <Reveal delay={0.14} className="space-y-3 min-w-0">
              <h5 className="text-xs font-bold text-site-text uppercase tracking-wider truncate">
                {t("landing.resources")}
              </h5>
              <ul className="space-y-2 text-xs text-site-text-2">
                <li><Link href="/docs" className="hover:text-site-text transition-colors block py-0.5 truncate">{t("landing.docs")}</Link></li>
                <li>
                  <Link href="/docs/mcp" className="hover:text-site-text transition-colors block py-0.5 truncate flex items-center gap-1.5">
                    <span>{t("landing.mcpDocs")}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950/40 text-[#2563EB] dark:text-[#3B82F6]">AI</span>
                  </Link>
                </li>
                <li><Link href="/blog" className="hover:text-site-text transition-colors block py-0.5 truncate">{t("site.nav.blog")}</Link></li>
                <li><Link href="/status" className="hover:text-site-text transition-colors block py-0.5 truncate">{t("landing.status")}</Link></li>
                <li><Link href="/help" className="hover:text-site-text transition-colors block py-0.5 truncate">{t("landing.help")}</Link></li>
              </ul>
            </Reveal>

            {/* 3. Legal & Compliance */}
            <Reveal delay={0.2} className="space-y-3 min-w-0">
              <h5 className="text-xs font-bold text-site-text uppercase tracking-wider truncate">
                {t("landing.legal")}
              </h5>
              <ul className="space-y-2 text-xs text-site-text-2">
                <li><Link href="/terms" className="hover:text-site-text transition-colors block py-0.5 truncate">{t("landing.terms")}</Link></li>
                <li><Link href="/privacy" className="hover:text-site-text transition-colors block py-0.5 truncate">{t("landing.privacy")}</Link></li>
                <li><Link href="/security" className="hover:text-site-text transition-colors block py-0.5 truncate">{t("landing.security")}</Link></li>
              </ul>
            </Reveal>

            {/* 4. Company & Support */}
            <Reveal delay={0.26} className="space-y-3 min-w-0">
              <h5 className="text-xs font-bold text-site-text uppercase tracking-wider truncate">
                {t("landing.company")}
              </h5>
              <ul className="space-y-2 text-xs text-site-text-2">
                <li><Link href="/about" className="hover:text-site-text transition-colors block py-0.5 truncate">{t("landing.about")}</Link></li>
                <li><Link href="/contact" className="hover:text-site-text transition-colors block py-0.5 truncate">{t("landing.contact")}</Link></li>
                <li>
                  <a
                    href="https://akusaradigital.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-site-text transition-colors block py-0.5 truncate"
                  >
                    Akusara Digital
                  </a>
                </li>
              </ul>
            </Reveal>
          </div>
        </div>

        {/* Bottom Bar: Legal Disclaimer & Consumer Protection Guarantee */}
        <div className="pt-6 border-t border-site-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-site-text-2">
          <div className="space-y-1 max-w-2xl min-w-0">
            <p className="font-semibold text-site-text">
              {t("landing.copyright", { year: new Date().getFullYear() })}
            </p>
            <p className="text-[11px] text-site-text-2 leading-relaxed whitespace-pre-line">
              {t("landing.consumerProtectionNotice")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 self-start md:self-auto pt-1 md:pt-0">
            <Link
              href="/status"
              className="inline-flex items-center gap-2 hover:text-site-text transition-colors"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>{t("landing.allOperational")}</span>
            </Link>
          </div>
        </div>
      </div>
      <CookieConsentBanner />
      <BackToTop />
    </footer>
  );
}
