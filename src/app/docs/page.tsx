"use client";

import Link from "next/link";
import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";

export default function DocsPage() {
  const { t } = useT();

  return (
    <StaticShell
      title={t("docs.title")}
      subtitle={t("docs.subtitle")}
      ctaLabel="← Dashboard"
      ctaHref="/dashboard"
    >
      <div className="mx-auto max-w-5xl px-6 py-12 space-y-10">
        {/* Quick Nav Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="creative-surface rounded-xl p-4 border border-border space-y-1.5">
            <span className="text-xs font-bold text-indigo-600">01</span>
            <h4 className="text-sm font-bold text-foreground">{t("docs.gettingStarted")}</h4>
            <p className="text-[11px] text-muted leading-relaxed">
              Install the extension and link your Google Drive.
            </p>
          </div>
          <div className="creative-surface rounded-xl p-4 border border-border space-y-1.5">
            <span className="text-xs font-bold text-indigo-600">02</span>
            <h4 className="text-sm font-bold text-foreground">{t("docs.shortcuts")}</h4>
            <p className="text-[11px] text-muted leading-relaxed">
              Capture instantly with hotkeys without opening menus.
            </p>
          </div>
          <div className="creative-surface rounded-xl p-4 border border-border space-y-1.5">
            <span className="text-xs font-bold text-indigo-600">03</span>
            <h4 className="text-sm font-bold text-foreground">{t("docs.driveSetup")}</h4>
            <p className="text-[11px] text-muted leading-relaxed">
              Understand permissions and private cloud storage.
            </p>
          </div>
          <div className="creative-surface rounded-xl p-4 border border-border space-y-1.5">
            <span className="text-xs font-bold text-indigo-600">04</span>
            <h4 className="text-sm font-bold text-foreground">{t("docs.viewAndShare")}</h4>
            <p className="text-[11px] text-muted leading-relaxed">
              Password protection, expiration dates, and links.
            </p>
          </div>
        </div>

        {/* Documentation Sections */}
        <div className="space-y-8">
          {/* Section 1: Shortcuts */}
          <div className="creative-surface rounded-2xl p-6 sm:p-8 space-y-4 border border-border">
            <h3 className="text-lg font-bold text-foreground">{t("docs.shortcuts")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-foreground">Instant Screenshot</div>
                  <div className="text-[11px] text-muted">Capture current visible tab</div>
                </div>
                <kbd className="bg-subtle border border-border px-2.5 py-1 rounded text-xs font-mono font-bold text-foreground">
                  Ctrl + Shift + S
                </kbd>
              </div>
              <div className="rounded-xl border border-border p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-foreground">Start Screen Recording</div>
                  <div className="text-[11px] text-muted">Record screen, tab, or window with audio</div>
                </div>
                <kbd className="bg-subtle border border-border px-2.5 py-1 rounded text-xs font-mono font-bold text-foreground">
                  Ctrl + Shift + F
                </kbd>
              </div>
            </div>
          </div>

          {/* Section 2: Storage Architecture */}
          <div className="creative-surface rounded-2xl p-6 sm:p-8 space-y-4 border border-border">
            <h3 className="text-lg font-bold text-foreground">{t("docs.driveSetup")}</h3>
            <p className="text-xs text-muted leading-relaxed">
              BugSnap requests the standard Google Drive <code className="bg-subtle px-1.5 py-0.5 rounded font-mono text-indigo-600">drive.file</code> scope. This means BugSnap can only read and write files it created itself — it can never see, read, or modify your personal files or spreadsheets.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/help" className="text-xs font-semibold text-indigo-600 hover:underline">
                View Help Center FAQs →
              </Link>
              <span className="text-muted text-xs">•</span>
              <Link href="/contact" className="text-xs font-semibold text-indigo-600 hover:underline">
                Contact Technical Support →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </StaticShell>
  );
}
