"use client";

import Link from "next/link";
import { useT } from "@/components/I18nProvider";
import { SiteNavbar } from "@/components/site/SiteNavbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Reveal } from "@/components/site/motion";
import { Icon, withAssetVersion } from "@/lib/iconify";
import { FIREFOX_STORE_URL } from "@/lib/constants";

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf";

export function ContactContent() {
  const { t } = useT();

  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-100 font-site flex flex-col bg-[#fcfdfe] dark:bg-[#0b0f17]">
      <SiteNavbar />

      <main id="main-content" className="flex-1 pb-12 sm:pb-16">
        {/* Header Section */}
        <div className="pt-6 sm:pt-10 pb-6 sm:pb-10 text-center max-w-4xl mx-auto px-4 sm:px-6">
          <Reveal delay={0}>
            {/* Breadcrumb */}
            <nav
              className="inline-flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6"
              aria-label="Breadcrumb"
            >
              <Link
                href="/"
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {t("landing.home")}
              </Link>
              <span className="text-slate-400 dark:text-slate-600 font-normal" aria-hidden="true">
                /
              </span>
              <span className="text-slate-900 dark:text-white font-medium">
                {t("contact.title")}
              </span>
            </nav>
          </Reveal>

          <Reveal delay={0.06}>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
              {t("contact.heroTitlePrefix")}
              <br />
              <span className="text-blue-600 dark:text-blue-500">
                {t("contact.heroTitleHighlight")}
              </span>
            </h1>
          </Reveal>

          <Reveal delay={0.12}>
            <p className="mt-3.5 sm:mt-4 text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              {t("contact.subtitle")}
            </p>
          </Reveal>
        </div>

        {/* Content Container */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8 sm:space-y-10">
          {/* Top 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Left Column: Contact Channels */}
            <div className="lg:col-span-6 flex flex-col justify-between pt-1">
              <Reveal delay={0.1}>
                {/* 1. Email Support */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0 pr-2">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1.5">
                      {t("contact.emailSupportLabel")}
                    </span>
                    <a
                      href="mailto:support@akusaradigital.com"
                      className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors block break-all"
                    >
                      support@akusaradigital.com
                    </a>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                      {t("contact.emailDesc")}
                    </p>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={withAssetVersion("/illustrations/contact-email.png")}
                    alt="Email Support"
                    className="w-24 sm:w-28 h-auto object-contain shrink-0"
                    loading="lazy"
                  />
                </div>
              </Reveal>

              <div className="border-b border-slate-100 dark:border-slate-800/80 my-8 sm:my-10" />

              <Reveal delay={0.16}>
                {/* 2. Company & Publisher */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0 pr-2">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1.5">
                      {t("contact.companyLabel")}
                    </span>
                    <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                      Akusara Digital
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {t("contact.companyDesc")}
                    </p>
                    <div className="mt-3.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                      <span>{t("contact.websiteLabel")}</span>
                      <a
                        href="https://akusaradigital.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                      >
                        akusaradigital.com 
                      </a>
                    </div>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={withAssetVersion("/illustrations/contact-company.png")}
                    alt="Akusara Digital Office"
                    className="w-24 sm:w-28 h-auto object-contain shrink-0"
                    loading="lazy"
                  />
                </div>
              </Reveal>

              <div className="border-b border-slate-100 dark:border-slate-800/80 my-8 sm:my-10" />

              <Reveal delay={0.22}>
                {/* 3. Enterprise & Sales */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0 pr-2">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1.5">
                      {t("contact.enterpriseLabel")}
                    </span>
                    <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                      {t("contact.enterpriseTitle")}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                      {t("contact.enterpriseDesc")}
                    </p>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={withAssetVersion("/illustrations/contact-enterprise.png")}
                    alt="Enterprise Solutions"
                    className="w-24 sm:w-28 h-auto object-contain shrink-0"
                    loading="lazy"
                  />
                </div>
              </Reveal>
            </div>

            {/* Right Column: Cards (Start capturing + Useful Resources) */}
            <div className="lg:col-span-6 space-y-6">
              {/* Card 1: Start capturing with BugSnap */}
              <Reveal delay={0.14}>
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-7 shadow-xs">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                        {t("contact.startCapturing")}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {t("contact.startCapturingDesc")}
                      </p>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={withAssetVersion("/illustrations/contact-chrome-doc.png")}
                      alt="Chrome Extension"
                      className="w-16 sm:w-20 h-auto object-contain shrink-0"
                      loading="lazy"
                    />
                  </div>

                  <div className="mt-6 flex flex-col gap-2.5">
                    <a
                      href={CHROME_STORE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center justify-center gap-2 transition-all shadow-sm hover:scale-[1.01] active:scale-[0.99] touch-manipulation"
                    >
                      <Icon
                        icon="logos:chrome"
                        className="w-4 h-4 shrink-0"
                        aria-hidden="true"
                      />
                      <span>
                        {t("extension.addToChrome")}
                      </span>
                    </a>
                    <a
                      href={FIREFOX_STORE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center justify-center gap-2 transition-all shadow-sm hover:scale-[1.01] active:scale-[0.99] touch-manipulation"
                    >
                      <Icon icon="logos:firefox" className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>{t("extension.addToFirefox")}</span>
                    </a>
                    <Link
                      href="/pricing"
                      className="w-full py-3 px-4 rounded-xl font-semibold text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-200 flex items-center justify-center transition-colors shadow-xs touch-manipulation"
                    >
                      <span>{t("contact.seePricing")}</span>
                    </Link>
                  </div>
                </div>
              </Reveal>

              {/* Card 2: Useful Resources */}
              <Reveal delay={0.2}>
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-7 shadow-xs">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4">
                    {t("contact.usefulResources")}
                  </h3>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    <div className="pb-3.5">
                      <Link
                        href="/privacy"
                        className="text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors block"
                      >
                        {t("contact.privacy")}
                      </Link>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {t("contact.privacyDesc")}
                      </p>
                    </div>

                    <div className="py-3.5">
                      <Link
                        href="/terms"
                        className="text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors block"
                      >
                        {t("contact.terms")}
                      </Link>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {t("contact.termsDesc")}
                      </p>
                    </div>

                    <div className="py-3.5">
                      <Link
                        href="/docs"
                        className="text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors block"
                      >
                        {t("contact.docs")}
                      </Link>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {t("contact.docsDesc")}
                      </p>
                    </div>

                    <div className="py-3.5">
                      <Link
                        href="/help"
                        className="text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors block"
                      >
                        {t("help.title")}
                      </Link>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {t("help.subtitle")}
                      </p>
                    </div>

                    <div className="pt-3.5">
                      <Link
                        href="/terms#refund"
                        className="text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors block"
                      >
                        {t("contact.refund")}
                      </Link>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {t("contact.refundDesc")}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>

          {/* Bottom Card: Support & Consumer Satisfaction */}
          <Reveal delay={0.24}>
            <div id="complaint" className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-8 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                {t("contact.complaintEyebrow")}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {t("contact.complaintTitle")}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 mt-6">
                {/* Box 1: Dedicated Customer Support & Inquiries */}
                <div className="rounded-2xl bg-[#f8fafc] dark:bg-slate-800/40 p-5 sm:p-6 border border-slate-100 dark:border-slate-800/60 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 font-bold text-sm flex items-center justify-center shrink-0">
                        1
                      </div>
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                        {t("contact.box1Title")}
                      </h3>
                    </div>
                    <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed mt-3">
                      {t("contact.box1Desc")}
                    </p>
                  </div>
                  <div className="space-y-1.5 mt-5 text-xs sm:text-[13px] leading-relaxed">
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {t("contact.box1EmailLabel")}{" "}
                      </span>
                      <a
                        href="mailto:support@akusaradigital.com"
                        className="text-blue-600 dark:text-blue-400 font-medium hover:underline break-all"
                      >
                        support@akusaradigital.com
                      </a>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {t("contact.box1SlaLabel")}{" "}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {t("contact.box1SlaDesc")}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {t("contact.box1EntityLabel")}{" "}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        Akusara Digital.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Box 2: Fair Resolution & 14-Day Refund Guarantee */}
                <div className="rounded-2xl bg-[#f8fafc] dark:bg-slate-800/40 p-5 sm:p-6 border border-slate-100 dark:border-slate-800/60 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 font-bold text-sm flex items-center justify-center shrink-0">
                        2
                      </div>
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                        {t("contact.box2Title")}
                      </h3>
                    </div>
                    <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed mt-3">
                      {t("contact.box2Desc")}
                    </p>
                  </div>
                  <div className="space-y-1.5 mt-5 text-xs sm:text-[13px] leading-relaxed">
                    <div>
                      <strong className="font-semibold text-slate-700 dark:text-slate-300">
                        {t("contact.box2GuaranteeLabel")}{" "}
                      </strong>
                      <span className="text-slate-500 dark:text-slate-400">
                        {t("contact.box2GuaranteeDesc")}
                      </span>
                    </div>
                    <div>
                      <strong className="font-semibold text-slate-700 dark:text-slate-300">
                        {t("contact.box2CancelLabel")}{" "}
                      </strong>
                      <span className="text-slate-500 dark:text-slate-400">
                        {t("contact.box2CancelDesc")}
                      </span>
                    </div>
                    <div>
                      <strong className="font-semibold text-slate-700 dark:text-slate-300">
                        {t("contact.box2GoodFaithLabel")}{" "}
                      </strong>
                      <span className="text-slate-500 dark:text-slate-400">
                        {t("contact.box2GoodFaithDesc")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
