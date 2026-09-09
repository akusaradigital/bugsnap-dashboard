"use client";

import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";

export default function HowItWorksPage() {
  const { t } = useT();

  return (
    <StaticShell
      title={t("howItWorks.title")}
      subtitle={t("howItWorks.subtitle")}
      ctaLabel="← Home"
      ctaHref="/"
    >
      <div className="mx-auto max-w-5xl px-6 py-12 space-y-12">
        {/* 3 Step Process Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="creative-surface rounded-2xl p-6 flex flex-col justify-between space-y-4 border border-border">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-base">
                1
              </div>
              <h3 className="text-base font-bold text-foreground">{t("howItWorks.step1Title")}</h3>
              <p className="text-xs text-muted leading-relaxed">{t("howItWorks.step1Desc")}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-subtle/60 p-3 font-mono text-[11px] text-muted space-y-1">
              <div>📸 Ctrl + Shift + S</div>
              <div>🎥 Ctrl + Shift + F</div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="creative-surface rounded-2xl p-6 flex flex-col justify-between space-y-4 border border-border">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-base">
                2
              </div>
              <h3 className="text-base font-bold text-foreground">{t("howItWorks.step2Title")}</h3>
              <p className="text-xs text-muted leading-relaxed">{t("howItWorks.step2Desc")}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-subtle/60 p-3 font-mono text-[11px] text-muted space-y-1">
              <div className="text-red-500">✖ Console Errors</div>
              <div className="text-emerald-600 dark:text-emerald-400">⚡ Network Requests</div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="creative-surface rounded-2xl p-6 flex flex-col justify-between space-y-4 border border-border">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-base">
                3
              </div>
              <h3 className="text-base font-bold text-foreground">{t("howItWorks.step3Title")}</h3>
              <p className="text-xs text-muted leading-relaxed">{t("howItWorks.step3Desc")}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-subtle/60 p-3 font-mono text-[11px] text-muted space-y-1">
              <div>🔒 Google Drive Storage</div>
              <div>🔗 Instant Share Link</div>
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="creative-surface rounded-2xl p-8 text-center space-y-4 border border-border">
          <h2 className="text-xl font-bold text-foreground">{t("footer.captureBugsFaster")}</h2>
          <p className="text-xs text-muted max-w-lg mx-auto">{t("footer.captureDesc")}</p>
          <div className="pt-2">
            <a
              href="https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-semibold shadow-md transition-all"
            >
              <span>{t("footer.addToChrome")}</span>
              <span>→</span>
            </a>
          </div>
        </div>
      </div>
    </StaticShell>
  );
}
