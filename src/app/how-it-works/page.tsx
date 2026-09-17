"use client";

import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";

const CARD = "group rounded-2xl border border-white/80 dark:border-border bg-white/80 dark:bg-subtle p-5 sm:p-6 shadow-lg shadow-slate-200/50 dark:shadow-none backdrop-blur-sm flex flex-col justify-between space-y-5 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#89BD49]/10 hover:border-[#89BD49]/40 transition-all duration-300";
const PREVIEW = "rounded-xl border border-border/60 bg-slate-50/90 dark:bg-subtle/60 p-3.5 space-y-2 group-hover:border-[#89BD49]/30 transition-colors";

export default function HowItWorksPage() {
  const { t } = useT();

  return (
    <StaticShell title={t("howItWorks.title")} subtitle={t("howItWorks.subtitle")}>
      <div className="mx-auto max-w-6xl px-4 sm:px-8 py-10 sm:py-12 space-y-12">
        {/* 3 Step Process Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className={CARD}>
            <div className="space-y-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#89BD49] to-[#6B9A35] text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:shadow-[#89BD49]/25 transition-all duration-300">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-foreground group-hover:text-[#6B9A35] dark:group-hover:text-[#A8D666] transition-colors">
                {t("howItWorks.step1Title")}
              </h3>
              <p className="text-xs text-slate-600 dark:text-muted leading-relaxed">
                {t("howItWorks.step1Desc")}
              </p>
            </div>
            <div className={PREVIEW}>
              <div className="flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-xs bg-[#89BD49]" />
                  <span>{t("landing.screenRecorder")}</span>
                </span>
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-subtle border border-border text-[10px] font-mono font-semibold shadow-2xs">Ctrl + Shift + S</kbd>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-xs bg-[#6B9A35]" />
                  <span>{t("landing.devTools")}</span>
                </span>
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-subtle border border-border text-[10px] font-mono font-semibold shadow-2xs">Ctrl + Shift + F</kbd>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className={CARD}>
            <div className="space-y-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:shadow-orange-500/25 transition-all duration-300">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {t("howItWorks.step2Title")}
              </h3>
              <p className="text-xs text-slate-600 dark:text-muted leading-relaxed">
                {t("howItWorks.step2Desc")}
              </p>
            </div>
            <div className={PREVIEW}>
              <div className="flex items-center gap-2 text-[11px] text-red-600 dark:text-red-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-xs bg-red-500" />
                <span>{t("howItWorks.preview2Console")}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-xs bg-emerald-500" />
                <span>{t("howItWorks.preview2Network")}</span>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className={CARD}>
            <div className="space-y-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#89BD49] to-[#6B9A35] text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:shadow-[#89BD49]/25 transition-all duration-300">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-foreground group-hover:text-[#6B9A35] dark:group-hover:text-[#A8D666] transition-colors">
                {t("howItWorks.step3Title")}
              </h3>
              <p className="text-xs text-slate-600 dark:text-muted leading-relaxed">
                {t("howItWorks.step3Desc")}
              </p>
            </div>
            <div className={PREVIEW}>
              <div className="flex items-center gap-2 text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                <span className="w-1.5 h-1.5 rounded-xs bg-[#89BD49]" />
                <span>{t("howItWorks.preview3Drive")}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                <span className="w-1.5 h-1.5 rounded-xs bg-[#6B9A35]" />
                <span>{t("howItWorks.preview3Share")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="rounded-2xl border border-white/80 dark:border-border bg-white/80 dark:bg-subtle p-6 sm:p-8 text-center space-y-4 shadow-lg shadow-slate-200/50 dark:shadow-none backdrop-blur-sm hover:shadow-xl transition-all duration-300">
          <h2 className="text-xl font-bold text-slate-900 dark:text-foreground">{t("footer.captureBugsFaster")}</h2>
          <p className="text-xs text-slate-600 dark:text-muted max-w-lg mx-auto leading-relaxed">{t("footer.captureDesc")}</p>
          <div className="pt-2">
            <a
              href="https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#89BD49] hover:bg-[#6B9A35] active:scale-95 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all shadow-[#89BD49]/25"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/chrome.svg" alt="Chrome" className="w-4 h-4 shrink-0" />
              <span>{t("footer.addToChrome")}</span>
            </a>
          </div>
        </div>
      </div>
    </StaticShell>
  );
}
