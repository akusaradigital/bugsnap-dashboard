"use client";

import Link from "next/link";
import { useT } from "@/components/I18nProvider";
import { SiteNavbar } from "@/components/site/SiteNavbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Reveal } from "@/components/site/motion";
import { Icon } from "@/lib/iconify";

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
                {t("landing.home") || "Home"}
              </Link>
              <span className="text-slate-400 dark:text-slate-600 font-normal">
                ›
              </span>
              <span className="text-slate-900 dark:text-white font-medium">
                {t("contact.title") || "Contact Us"}
              </span>
            </nav>
          </Reveal>

          <Reveal delay={0.06}>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
              {t("contact.heroTitlePrefix") || "We are here to"}
              <br />
              <span className="text-blue-600 dark:text-blue-500">
                {t("contact.heroTitleHighlight") || "help your team"}
              </span>
            </h1>
          </Reveal>

          <Reveal delay={0.12}>
            <p className="mt-3.5 sm:mt-4 text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              {t("contact.subtitle") ||
                "Have questions, feedback, or need help with BugSnap? Reach out to our team."}
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
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                      {t("contact.emailSupportLabel") || "EMAIL SUPPORT"}
                    </span>
                    <a
                      href="mailto:support@akusaradigital.com"
                      className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors block break-all"
                    >
                      support@akusaradigital.com
                    </a>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                      {t("contact.emailDesc") ||
                        "For technical issues, account help, security reports, or general inquiries. We aim to reply within 24 hours."}
                    </p>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/illustrations/contact-email.png"
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
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                      {t("contact.companyLabel") || "COMPANY & PUBLISHER"}
                    </span>
                    <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                      Akusara Digital
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {t("contact.companyDesc") ||
                        "Developer and operator of BugSnap (From Click to Fix)."}
                    </p>
                    <div className="mt-3.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                      <span>{t("contact.websiteLabel") || "Website:"}</span>
                      <a
                        href="https://akusaradigital.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                      >
                        akusaradigital.com →
                      </a>
                    </div>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/illustrations/contact-company.png"
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
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                      {t("contact.enterpriseLabel") || "ENTERPRISE & SALES"}
                    </span>
                    <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                      {t("contact.enterpriseTitle") || "Custom Deployment"}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                      {t("contact.enterpriseDesc") ||
                        "Need SLA guarantees, SSO, or custom integrations for your team? Contact our sales team to discuss enterprise options."}
                    </p>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/illustrations/contact-enterprise.png"
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
                        {t("contact.startCapturing") ||
                          "Start capturing with BugSnap"}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {t("contact.startCapturingDesc") ||
                          "Install the Chrome extension and start debugging faster with full DevTools context."}
                      </p>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/illustrations/contact-chrome-doc.png"
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
                      className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-accent hover:bg-accent-hover text-slate-900 flex items-center justify-center gap-2 transition-all shadow-sm hover:scale-[1.01] active:scale-[0.99] touch-manipulation"
                    >
                      <Icon
                        icon="logos:chrome"
                        className="w-4 h-4 shrink-0"
                        aria-hidden="true"
                      />
                      <span>
                        {t("contact.installFree") || "Add to Chrome - Free"}
                      </span>
                    </a>
                    <Link
                      href="/pricing"
                      className="w-full py-3 px-4 rounded-xl font-semibold text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-200 flex items-center justify-center transition-colors shadow-xs touch-manipulation"
                    >
                      <span>{t("contact.seePricing") || "See Pricing"}</span>
                    </Link>
                  </div>
                </div>
              </Reveal>

              {/* Card 2: Useful Resources */}
              <Reveal delay={0.2}>
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-7 shadow-xs">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4">
                    {t("contact.usefulResources") || "Useful Resources"}
                  </h3>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    <div className="pb-3.5">
                      <Link
                        href="/privacy"
                        className="text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors block"
                      >
                        {t("contact.privacy") || "Privacy Policy"}
                      </Link>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {t("contact.privacyDesc") ||
                          "How we handle your data, Google Drive integration, and Chrome permissions."}
                      </p>
                    </div>

                    <div className="py-3.5">
                      <Link
                        href="/terms"
                        className="text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors block"
                      >
                        {t("contact.terms") || "Terms of Service"}
                      </Link>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {t("contact.termsDesc") ||
                          "The agreement between you and BugSnap regarding acceptable use and service limits."}
                      </p>
                    </div>

                    <div className="py-3.5">
                      <Link
                        href="/docs"
                        className="text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors block"
                      >
                        {t("contact.docs") || "Documentation & Extension Setup"}
                      </Link>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {t("contact.docsDesc") ||
                          "Guides on how to install, configure Google Drive OAuth, and use the annotation editor."}
                      </p>
                    </div>

                    <div className="py-3.5">
                      <Link
                        href="/help"
                        className="text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors block"
                      >
                        {t("help.title") || "Help Center & FAQs"}
                      </Link>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {t("help.subtitle") ||
                          "Find answers to common questions about setting up the Chrome extension, managing permissions, and using the dashboard."}
                      </p>
                    </div>

                    <div className="pt-3.5">
                      <Link
                        href="/terms#refund"
                        className="text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors block"
                      >
                        {t("contact.refund") || "Refund & Cancellation Policy"}
                      </Link>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {t("contact.refundDesc") ||
                          "14-day statutory money-back guarantee and 1-click self-serve cancellation."}
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
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                {t("contact.complaintEyebrow") ||
                  "SUPPORT & CONSUMER SATISFACTION"}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {t("contact.complaintTitle") ||
                  "Customer Support & Dispute Resolution Channel"}
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
                        {t("contact.box1Title") ||
                          "Dedicated Customer Support & Inquiries"}
                      </h3>
                    </div>
                    <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed mt-3">
                      {t("contact.box1Desc") ||
                        "In accordance with global consumer protection standards and fair digital practices, we provide dedicated channels to resolve questions, billing inquiries, feedback, or refund requests promptly."}
                    </p>
                  </div>
                  <div className="space-y-1.5 mt-5 text-xs sm:text-[13px] leading-relaxed">
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {t("contact.box1EmailLabel") ||
                          "Support & Resolution Email:"}{" "}
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
                        {t("contact.box1SlaLabel") || "Response SLA:"}{" "}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {t("contact.box1SlaDesc") ||
                          "Within 2 business days (typically under 24 hours)."}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {t("contact.box1EntityLabel") || "Operating Entity:"}{" "}
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
                        {t("contact.box2Title") ||
                          "Fair Resolution & 14-Day Refund Guarantee"}
                      </h3>
                    </div>
                    <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed mt-3">
                      {t("contact.box2Desc") ||
                        "We are committed to fair customer treatment worldwide. If you encounter any issue or are dissatisfied with BugSnap Pro:"}
                    </p>
                  </div>
                  <div className="space-y-1.5 mt-5 text-xs sm:text-[13px] leading-relaxed">
                    <div>
                      <strong className="font-semibold text-slate-700 dark:text-slate-300">
                        {t("contact.box2GuaranteeLabel") ||
                          "14-Day Money-Back Guarantee:"}{" "}
                      </strong>
                      <span className="text-slate-500 dark:text-slate-400">
                        {t("contact.box2GuaranteeDesc") ||
                          "100% full refund upon request within 14 days of purchase."}
                      </span>
                    </div>
                    <div>
                      <strong className="font-semibold text-slate-700 dark:text-slate-300">
                        {t("contact.box2CancelLabel") ||
                          "Self-Serve Cancellation:"}{" "}
                      </strong>
                      <span className="text-slate-500 dark:text-slate-400">
                        {t("contact.box2CancelDesc") ||
                          "1-click subscription management anytime in your billing portal."}
                      </span>
                    </div>
                    <div>
                      <strong className="font-semibold text-slate-700 dark:text-slate-300">
                        {t("contact.box2GoodFaithLabel") ||
                          "Good-Faith Resolution:"}{" "}
                      </strong>
                      <span className="text-slate-500 dark:text-slate-400">
                        {t("contact.box2GoodFaithDesc") ||
                          "All inquiries are reviewed directly by our core engineering team."}
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
