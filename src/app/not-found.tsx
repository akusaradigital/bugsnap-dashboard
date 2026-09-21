"use client";

import Link from "next/link";
import { useT } from "@/components/I18nProvider";

export default function NotFound() {
  const { t } = useT();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col justify-between selection:bg-[#89BD49] selection:text-white">
      {/* Header */}
      <header className="border-b border-border bg-surface/80 px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-base text-foreground">
            <span className="w-2.5 h-2.5 rounded-full bg-[#89BD49]" />
            <span>BugSnap</span>
          </Link>
          <Link
            href="/"
            className="text-xs font-semibold text-muted hover:text-[#6B9A35] dark:hover:text-[#A8D666] transition-colors"
          >
            {t("notFound.backHome")}
          </Link>
        </div>
      </header>

      {/* Center 404 */}
      <main className="flex-1 flex items-center justify-center px-6 py-16 text-center">
        <div className="max-w-md">
          <p className="text-xs font-bold tracking-widest uppercase text-[#6B9A35] dark:text-[#A8D666] mb-3 font-mono">
            {t("notFound.code")}
          </p>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            {t("notFound.title")}
          </h1>
          <p className="mt-4 text-sm text-muted leading-relaxed">
            {t("notFound.description")}
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/"
              className="px-4 py-2 rounded-lg bg-[#89BD49] hover:bg-[#6B9A35] text-white text-xs font-semibold transition-all shadow-sm shadow-[#89BD49]/25"
            >
              {t("notFound.backHome")}
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg border border-border bg-subtle hover:bg-subtle/80 text-foreground text-xs font-semibold transition-all"
            >
              {t("notFound.goDashboard")}
            </Link>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-border py-4 text-center text-xs text-muted bg-surface/50">
        {t("notFound.footer")}
      </footer>
    </div>
  );
}
