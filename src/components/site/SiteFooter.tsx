"use client";

import Link from "next/link";
import { useT } from "@/components/I18nProvider";
import { Reveal } from "./motion/Reveal";

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf";

export function SiteFooter() {
  const { t } = useT();

  return (
    <footer className="border-t border-site-border bg-site-surface-2 text-site-text font-site transition-colors">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-10">
          {/* Brand Column */}
          <Reveal delay={0} className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon.svg" alt="" aria-hidden="true" className="w-6 h-6 object-contain" />
              <span className="text-sm font-bold tracking-tight text-site-text">BugSnap</span>
            </div>
            <p className="text-xs text-site-text-2 max-w-xs leading-relaxed">
              {t("landing.footDesc")}
            </p>
            <div className="pt-2">
              <a
                href={CHROME_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-site-text-2 hover:text-site-text transition-colors"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/chrome.svg" alt="" aria-hidden="true" className="w-3.5 h-3.5" />
                <span>Chrome Web Store</span>
              </a>
            </div>
          </Reveal>

          {/* Links Grid: 3-column on mobile, spanning md:col-span-3 on desktop */}
          <div className="md:col-span-3 grid grid-cols-3 gap-3 sm:gap-6 min-w-0">
            {/* Product Links */}
            <Reveal delay={0.08} className="space-y-3 min-w-0">
              <h5 className="text-[11px] sm:text-xs font-bold text-site-text uppercase tracking-wider truncate">
                {t("landing.product")}
              </h5>
              <ul className="space-y-2 text-[11px] sm:text-xs text-site-text-2">
                <li><Link href="/features" className="hover:text-site-text transition-colors block truncate">{t("site.nav.features")}</Link></li>
                <li><Link href="/solutions" className="hover:text-site-text transition-colors block truncate">{t("site.nav.solutions")}</Link></li>
                <li><Link href="/extension" className="hover:text-site-text transition-colors block truncate">{t("site.nav.extension")}</Link></li>
                <li><Link href="/how-it-works" className="hover:text-site-text transition-colors block truncate">{t("site.nav.howItWorks")}</Link></li>
                <li><Link href="/pricing" className="hover:text-site-text transition-colors block truncate">{t("site.nav.pricing")}</Link></li>
              </ul>
            </Reveal>

            {/* Resources Links */}
            <Reveal delay={0.16} className="space-y-3 min-w-0">
              <h5 className="text-[11px] sm:text-xs font-bold text-site-text uppercase tracking-wider truncate">
                {t("landing.resources")}
              </h5>
              <ul className="space-y-2 text-[11px] sm:text-xs text-site-text-2">
                <li><Link href="/docs" className="hover:text-site-text transition-colors block truncate">{t("landing.docs")}</Link></li>
                <li><Link href="/blog" className="hover:text-site-text transition-colors block truncate">{t("site.nav.blog")}</Link></li>
                <li><Link href="/help" className="hover:text-site-text transition-colors block truncate">{t("landing.help")}</Link></li>
                <li><Link href="/security" className="hover:text-site-text transition-colors block truncate">{t("landing.security")}</Link></li>
                <li><Link href="/contact" className="hover:text-site-text transition-colors block truncate">{t("landing.contact")}</Link></li>
              </ul>
            </Reveal>

            {/* Company & Legal */}
            <Reveal delay={0.24} className="space-y-3 min-w-0">
              <h5 className="text-[11px] sm:text-xs font-bold text-site-text uppercase tracking-wider truncate">
                {t("landing.company")}
              </h5>
              <ul className="space-y-2 text-[11px] sm:text-xs text-site-text-2">
                <li><Link href="/about" className="hover:text-site-text transition-colors block truncate">{t("landing.about")}</Link></li>
                <li><Link href="/privacy" className="hover:text-site-text transition-colors block truncate">{t("landing.privacy")}</Link></li>
                <li><Link href="/terms" className="hover:text-site-text transition-colors block truncate">{t("landing.terms")}</Link></li>
                <li>
                  <a
                    href="https://akusaradigital.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-site-text transition-colors block truncate"
                  >
                    Akusara Digital
                  </a>
                </li>
              </ul>
            </Reveal>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-site-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-site-text-2">
            {t("landing.copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
}
