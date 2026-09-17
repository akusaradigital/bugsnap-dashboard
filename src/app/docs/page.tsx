"use client";

import { useState } from "react";
import Link from "next/link";
import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";

export default function DocsPage() {
  const { t } = useT();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const navCards = [
    { id: "getting-started", title: t("docs.gettingStarted"), desc: t("docs.navGettingStartedDesc") },
    { id: "shortcuts", title: t("docs.shortcuts"), desc: t("docs.navShortcutsDesc") },
    { id: "drive-setup", title: t("docs.driveSetup"), desc: t("docs.navDriveSetupDesc") },
    { id: "view-and-share", title: t("docs.viewAndShare"), desc: t("docs.navViewAndShareDesc") },
  ];

  return (
    <StaticShell
      title={t("docs.title")}
      subtitle={t("docs.subtitle")}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-8 py-10 sm:py-12 space-y-8 sm:space-y-10">
        {/* Quick Nav Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {navCards.map((card) => (
            <div
              key={card.id}
              className="group rounded-2xl border border-white/80 dark:border-border bg-white/80 dark:bg-subtle p-5 shadow-lg shadow-slate-200/50 dark:shadow-none backdrop-blur-sm space-y-2 hover:-translate-y-1 hover:shadow-xl hover:border-[#89BD49]/40 transition-all duration-300"
            >
              <h4 className="text-sm font-bold text-foreground group-hover:text-[#6B9A35] dark:group-hover:text-[#A8D666] transition-colors">
                {card.title}
              </h4>
              <p className="text-[11px] text-muted leading-relaxed">
                {card.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Documentation Sections */}
        <div className="space-y-8">
          {/* Section 1: Shortcuts */}
          <div className="rounded-2xl border border-white/80 dark:border-border bg-white/80 dark:bg-subtle p-5 sm:p-8 space-y-5 shadow-lg shadow-slate-200/50 dark:shadow-none backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">{t("docs.shortcuts")}</h3>
              <span className="text-xs text-muted font-medium">Quick Reference</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Shortcut 1 */}
              <div className="rounded-xl border border-border/70 bg-slate-50/80 dark:bg-subtle/60 p-4 flex items-center justify-between hover:border-[#89BD49]/40 transition-colors group">
                <div>
                  <div className="text-xs font-semibold text-foreground group-hover:text-[#6B9A35] dark:group-hover:text-[#A8D666] transition-colors">
                    {t("docs.shortcutScreenshot")}
                  </div>
                  <div className="text-[11px] text-muted">{t("docs.shortcutScreenshotDesc")}</div>
                </div>
                <button
                  onClick={() => copyToClipboard("Ctrl + Shift + S", "shot")}
                  className="inline-flex items-center gap-1.5 bg-subtle border border-border px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-foreground hover:bg-[#89BD49]/10 dark:hover:bg-[#89BD49]/15 hover:text-[#6B9A35] dark:hover:text-[#A8D666] transition-all active:scale-95"
                  title={copiedKey === "shot" ? t("docs.terminalCopied") : t("docs.copyCode")}
                >
                  <span>Ctrl + Shift + S</span>
                  {copiedKey === "shot" ? (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans font-semibold">({t("docs.terminalCopied")})</span>
                  ) : null}
                </button>
              </div>

              {/* Shortcut 2 */}
              <div className="rounded-xl border border-border/70 bg-slate-50/80 dark:bg-subtle/60 p-4 flex items-center justify-between hover:border-[#89BD49]/40 transition-colors group">
                <div>
                  <div className="text-xs font-semibold text-foreground group-hover:text-[#6B9A35] dark:group-hover:text-[#A8D666] transition-colors">
                    {t("docs.shortcutRecording")}
                  </div>
                  <div className="text-[11px] text-muted">{t("docs.shortcutRecordingDesc")}</div>
                </div>
                <button
                  onClick={() => copyToClipboard("Ctrl + Shift + F", "record")}
                  className="inline-flex items-center gap-1.5 bg-subtle border border-border px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-foreground hover:bg-[#89BD49]/10 dark:hover:bg-[#89BD49]/15 hover:text-[#6B9A35] dark:hover:text-[#A8D666] transition-all active:scale-95"
                  title={copiedKey === "record" ? t("docs.terminalCopied") : t("docs.copyCode")}
                >
                  <span>Ctrl + Shift + F</span>
                  {copiedKey === "record" ? (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans font-semibold">({t("docs.terminalCopied")})</span>
                  ) : null}
                </button>
              </div>
            </div>

            {/* Terminal Snippet Box */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 text-slate-200 p-4 font-mono text-xs shadow-md">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 font-sans font-medium text-slate-400">Chrome Extension Hotkey Mapping</span>
                </div>
                <button
                  onClick={() => copyToClipboard("chrome://extensions/shortcuts", "url")}
                  className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 transition-colors"
                >
                  {copiedKey === "url" ? t("docs.terminalCopied") : t("docs.copyCode")}
                </button>
              </div>
              <p className="text-slate-400 text-[11px]"># Configure or rebind shortcuts anytime in your browser</p>
              <p className="text-[#A8D666] text-xs mt-1">chrome://extensions/shortcuts</p>
            </div>
          </div>

          {/* Section 2: Storage Architecture */}
          <div className="rounded-2xl border border-white/80 dark:border-border bg-white/80 dark:bg-subtle p-6 sm:p-8 space-y-4 shadow-lg shadow-slate-200/50 dark:shadow-none backdrop-blur-sm">
            <h3 className="text-lg font-bold text-foreground">{t("docs.driveSetup")}</h3>
            <p className="text-xs text-muted leading-relaxed">
              {t("docs.driveScopeDesc")}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/help" className="inline-flex items-center text-xs font-semibold text-[#6B9A35] hover:text-[#58802A] dark:text-[#A8D666] dark:hover:text-[#C2E688] transition-colors">
                {t("docs.viewHelpFaqs")}
              </Link>
              <span className="text-muted text-xs">•</span>
              <Link href="/contact" className="inline-flex items-center text-xs font-semibold text-[#6B9A35] hover:text-[#58802A] dark:text-[#A8D666] dark:hover:text-[#C2E688] transition-colors">
                {t("docs.contactSupport")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </StaticShell>
  );
}
