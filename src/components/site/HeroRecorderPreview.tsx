"use client";

import { useT } from "@/components/I18nProvider";
import { Icon } from "@/lib/iconify";

export function HeroRecorderPreview() {
  const { t } = useT();

  return (
    <div className="relative w-full max-w-lg lg:max-w-xl mx-auto pt-8 sm:pt-12 pb-8 sm:pb-12">
      {/* 1. TOP-LEFT CALLOUT: Console errors auto-captured */}
      <div className="hidden sm:flex items-center gap-2.5 absolute -top-1 sm:top-2 -left-2 sm:-left-8 z-20">
        <div className="w-10 h-10 rounded-2xl bg-[#FEE2E2] dark:bg-red-950/60 border border-red-200/60 dark:border-red-900/40 flex items-center justify-center shrink-0 shadow-sm">
          <div className="w-5 h-5 rounded-full bg-[#EF4444] text-white flex items-center justify-center">
            <Icon icon="lucide:x" className="w-3 h-3 stroke-[3]" aria-hidden="true" />
          </div>
        </div>
        <div className="text-xs leading-tight font-semibold text-slate-900 dark:text-white">
          <div>{t("site.hero.callout1.title")}</div>
          <div className="font-normal text-slate-500 dark:text-slate-400">
            {t("site.hero.callout1.sub")}
          </div>
        </div>
        {/* Curving arrow down-right pointing to the window */}
        <div className="absolute -bottom-8 left-4 text-slate-400 dark:text-slate-500 pointer-events-none" aria-hidden="true">
          <svg width="48" height="40" viewBox="0 0 48 40" fill="none">
            <path
              d="M 6 4 C 6 22, 16 32, 42 34"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M 36 29 L 43 34 L 36 39"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* 2. TOP-RIGHT CALLOUT: Network requests included */}
      <div className="hidden sm:flex items-center gap-2.5 absolute -top-2 sm:top-0 -right-2 sm:-right-6 z-20">
        <div className="w-10 h-10 rounded-2xl bg-[#FEF3C7] dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-center shrink-0 shadow-sm text-[#D97706] dark:text-amber-400">
          <Icon icon="lucide:split" className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="text-xs leading-tight font-semibold text-slate-900 dark:text-white">
          <div>{t("site.hero.callout2.title")}</div>
          <div className="font-normal text-slate-500 dark:text-slate-400">
            {t("site.hero.callout2.sub")}
          </div>
        </div>
        {/* Curving arrow down-left pointing to the window */}
        <div className="absolute -bottom-8 left-8 text-slate-400 dark:text-slate-500 pointer-events-none" aria-hidden="true">
          <svg width="48" height="40" viewBox="0 0 48 40" fill="none">
            <path
              d="M 38 4 C 38 20, 24 32, 6 34"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M 12 29 L 5 34 L 12 39"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* 3. CENTRAL BROWSER WINDOW MOCKUP */}
      <div className="relative rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl shadow-slate-300/40 dark:shadow-black/60 overflow-hidden font-site">
        {/* Top Browser Bar */}
        <div className="flex items-center justify-between px-3.5 sm:px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 gap-2">
          {/* 3 window dots */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
          </div>

          {/* Centered address pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/70 text-[11px] font-mono text-slate-600 dark:text-slate-300 truncate max-w-[170px] sm:max-w-none shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">app.acme.com/checkout</span>
          </div>

          {/* REC indicator */}
          <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-red-500 shrink-0">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>REC 00:24</span>
          </div>
        </div>

        {/* Viewport Content */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs sm:text-sm font-semibold pb-1 text-slate-800 dark:text-slate-200">
            <span>{t("site.hero.mockup.checkout")}</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">$2,499.00</span>
          </div>

          {/* Error Banner Container */}
          <div className="relative mt-3.5 bg-[#FFF5F5] dark:bg-red-950/25 border border-[#FED7D7] dark:border-red-900/50 rounded-xl p-3 sm:p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0">
                <Icon icon="lucide:x" className="w-2.5 h-2.5 stroke-[3]" />
              </span>
              <span className="text-xs font-bold text-red-600 dark:text-red-400 truncate">
                Pay $2,499.00
              </span>
            </div>

            <span className="font-mono text-[11px] font-semibold text-red-600 dark:text-red-400 bg-red-100/90 dark:bg-red-900/50 px-2 py-0.5 rounded border border-red-200 dark:border-red-800 shrink-0">
              HTTP 500 Error
            </span>

            {/* Tooltip badge attached to error banner */}
            <div className="absolute -top-3 right-3 sm:right-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-semibold px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
              <Icon icon="lucide:pencil" className="w-2.5 h-2.5 text-amber-400 dark:text-amber-600" />
              <span>{t("site.hero.mockup.capturedState")}</span>
            </div>
          </div>
        </div>

        {/* DevTools Drawer */}
        <div className="bg-slate-50/50 dark:bg-slate-900/90">
          {/* DevTools summary tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-3 sm:gap-4 font-mono text-[11px]">
              <span className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Console (1)
              </span>
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Network (24)
              </span>
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                System Specs
              </span>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <Icon icon="lucide:check" className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Saved to Google Drive</span>
            </div>
          </div>

          {/* Console Error Code Box */}
          <div className="p-3.5 sm:p-4 font-mono space-y-2.5 text-[11px]">
            <div className="rounded-xl bg-[#FFF5F5] dark:bg-red-950/20 border border-[#FED7D7]/80 dark:border-red-900/30 p-3 text-red-600 dark:text-red-400 leading-snug">
              <div className="font-semibold flex items-start gap-1.5 min-w-0">
                <span className="shrink-0 font-bold">✕</span>
                <span className="break-all">
                  TypeError: Cannot read properties of undefined (reading &apos;token&apos;)
                </span>
              </div>
              <div className="text-red-400/80 dark:text-red-400/60 pl-3.5 text-[10px] mt-0.5">
                at checkoutButton.tsx:212
              </div>
            </div>

            {/* System Specs Tags */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] text-slate-600 dark:text-slate-300">
              <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                Chrome 128
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                macOS 14.5
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                1920×1080
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM-LEFT CALLOUT: System specs attached */}
      <div className="hidden sm:flex items-center gap-2.5 absolute -bottom-3 sm:bottom-0 -left-2 sm:-left-8 z-20">
        <div className="w-10 h-10 rounded-2xl bg-[#F3E8FF] dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-900/40 flex items-center justify-center shrink-0 shadow-sm text-[#9333EA] dark:text-purple-400">
          <Icon icon="lucide:monitor" className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="text-xs leading-tight font-semibold text-slate-900 dark:text-white">
          <div>{t("site.hero.callout3.title")}</div>
          <div className="font-normal text-slate-500 dark:text-slate-400">
            {t("site.hero.callout3.sub")}
          </div>
        </div>
        {/* Curving arrow up-right pointing to specs pills */}
        <div className="absolute -top-7 left-12 text-slate-400 dark:text-slate-500 pointer-events-none" aria-hidden="true">
          <svg width="48" height="36" viewBox="0 0 48 36" fill="none">
            <path
              d="M 6 32 C 12 18, 24 8, 42 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M 36 2 L 43 6 L 37 11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* 5. BOTTOM-RIGHT FLOATING CARD: Saved to Google Drive */}
      <div className="absolute -bottom-6 sm:-bottom-8 right-0 sm:-right-4 z-20 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 shadow-xl shadow-slate-300/40 dark:shadow-black/60 flex items-center gap-3 sm:gap-3.5 max-w-[calc(100vw-2.5rem)]">
        <Icon icon="logos:google-drive" className="w-6 h-6 sm:w-7 sm:h-7 shrink-0" aria-hidden="true" />
        <div className="text-xs leading-tight min-w-0">
          <div className="font-bold text-slate-900 dark:text-white truncate">
            {t("site.hero.callout4.title")}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {t("site.hero.callout4.sub")}
          </div>
        </div>
        <div className="w-5 h-5 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0">
          <Icon icon="lucide:check" className="w-3.5 h-3.5 stroke-[3]" aria-hidden="true" />
        </div>
      </div>

      {/* Mobile compact callout chips for small viewports (< sm) */}
      <div className="sm:hidden grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex flex-col items-center text-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
          <div className="w-6 h-6 rounded-lg bg-red-100 dark:bg-red-950/60 flex items-center justify-center text-red-500 mb-1">
            <Icon icon="lucide:x" className="w-3 h-3 stroke-[3]" />
          </div>
          <div className="text-[10px] font-semibold text-slate-800 dark:text-slate-200 leading-tight">
            {t("site.hero.callout1.title")}
          </div>
        </div>
        <div className="flex flex-col items-center text-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
          <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 mb-1">
            <Icon icon="lucide:split" className="w-3 h-3" />
          </div>
          <div className="text-[10px] font-semibold text-slate-800 dark:text-slate-200 leading-tight">
            {t("site.hero.callout2.title")}
          </div>
        </div>
        <div className="flex flex-col items-center text-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
          <div className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 mb-1">
            <Icon icon="lucide:monitor" className="w-3 h-3" />
          </div>
          <div className="text-[10px] font-semibold text-slate-800 dark:text-slate-200 leading-tight">
            {t("site.hero.callout3.title")}
          </div>
        </div>
      </div>
    </div>
  );
}
