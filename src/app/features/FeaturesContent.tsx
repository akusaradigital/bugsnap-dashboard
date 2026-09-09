"use client";

import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";

export function FeaturesContent() {
  const { t } = useT();

  return (
    <StaticShell
      title={t("features.title")}
      subtitle={t("features.subtitle")}
      ctaLabel="← Home"
      ctaHref="/"
    >
      <div className="mx-auto max-w-5xl px-6 py-12 space-y-16">
        {/* Feature 1: Instant Capture */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              {t("features.f1Eyebrow")}
            </span>
            <h2 className="text-2xl font-bold tracking-tight">
              {t("features.f1Title")}
            </h2>
            <p className="text-sm text-muted leading-relaxed">
              {t("features.f1Desc")}
            </p>
            <ul className="space-y-1.5 text-xs text-muted pt-2">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{t("features.f1HotkeyScreen")}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{t("features.f1HotkeyVideo")}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{t("features.f1Editor")}</span>
              </li>
            </ul>
          </div>
          <div className="creative-surface rounded-2xl p-6 flex flex-col items-center justify-center min-h-[220px]">
            <div className="w-full rounded-xl border border-border bg-subtle/75 p-4 shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-xs font-bold">{t("landing.screenRecorder")}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-mono">● REC 00:42</span>
              </div>
              <div className="aspect-video bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-medium">
                {t("features.f1Stream")}
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2: DevTools Capture */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="order-2 md:order-1 creative-surface rounded-2xl p-6">
            <div className="w-full rounded-xl border border-border bg-subtle/75 p-4 shadow-lg font-mono text-[11px] space-y-2">
              <div className="text-muted text-[10px] uppercase font-sans border-b border-border pb-1">Automated DevLogs Captured</div>
              <div className="text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 p-2 rounded">
                ✖ POST /api/v1/auth 500 Internal Server Error (142ms)
              </div>
              <div className="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded">
                ⚠ [Console Warn] Unhandled promise rejection: AuthTokenExpired
              </div>
              <div className="text-foreground text-[10px] font-sans text-muted">
                + OS: Windows 11 &middot; Browser: Chrome 140 &middot; Window: 1920x1080
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              {t("features.f2Eyebrow")}
            </span>
            <h2 className="text-2xl font-bold tracking-tight">
              {t("features.f2Title")}
            </h2>
            <p className="text-sm text-muted leading-relaxed">
              {t("features.f2Desc")}
            </p>
          </div>
        </div>

        {/* Feature 3: Drive Storage & Web Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              {t("features.f3Eyebrow")}
            </span>
            <h2 className="text-2xl font-bold tracking-tight">
              {t("features.f3Title")}
            </h2>
            <p className="text-sm text-muted leading-relaxed">
              {t("features.f3Desc")}
            </p>
          </div>
          <div className="creative-surface rounded-2xl p-6">
            <div className="rounded-xl border border-border bg-subtle/75 p-4 shadow-lg space-y-3 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center font-bold text-xl">
                🔒
              </div>
              <h4 className="text-sm font-semibold text-foreground">
                {t("features.f3BadgeTitle")}
              </h4>
              <p className="text-xs text-muted leading-relaxed">
                {t("features.f3BadgeDesc")}
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="creative-surface rounded-2xl p-8 text-center space-y-4 border border-border shadow-sm">
          <h3 className="text-xl font-bold text-foreground">
            {t("features.ctaTitle")}
          </h3>
          <p className="text-sm text-muted max-w-md mx-auto leading-relaxed">
            {t("features.ctaDesc")}
          </p>
          <div className="pt-2">
            <a
              href="https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
            >
              <span>{t("features.ctaButton")}</span>
            </a>
          </div>
        </div>
      </div>
    </StaticShell>
  );
}
