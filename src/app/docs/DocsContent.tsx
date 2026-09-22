"use client";

import { useState } from "react";
import Link from "next/link";
import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";

export function DocsContent() {
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
      <div className="space-y-8 font-site">
        {/* Quick Nav Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {navCards.map((card) => (
            <div
              key={card.id}
              className="rounded-xl border border-site-border bg-site-surface p-5 space-y-2 shadow-xs"
            >
              <h4 className="text-sm font-bold text-site-text">
                {card.title}
              </h4>
              <p className="text-xs text-site-text-2 leading-relaxed">
                {card.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Documentation Sections */}
        <div className="space-y-6">
          {/* Section 1: Shortcuts */}
          <div className="rounded-xl border border-site-border bg-site-surface p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-site-border-subtle pb-4">
              <h3 className="text-base font-bold text-site-text">{t("docs.shortcuts")}</h3>
              <span className="text-xs text-site-text-2 font-mono">Quick Reference</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Shortcut 1 */}
              <div className="rounded-lg border border-site-border bg-site-surface-2 p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-site-text">
                    {t("docs.shortcutScreenshot")}
                  </div>
                  <div className="text-[11px] text-site-text-2">{t("docs.shortcutScreenshotDesc")}</div>
                </div>
                <button
                  onClick={() => copyToClipboard("Ctrl + Shift + S", "shot")}
                  className="inline-flex items-center gap-1.5 bg-site-surface border border-site-border px-2.5 py-1.5 rounded-md text-xs font-mono font-bold text-site-text hover:border-accent transition-colors active:scale-95"
                  title={copiedKey === "shot" ? t("docs.terminalCopied") : t("docs.copyCode")}
                >
                  <span>Ctrl + Shift + S</span>
                  {copiedKey === "shot" ? (
                    <span className="text-[10px] text-accent font-sans font-semibold">({t("docs.terminalCopied")})</span>
                  ) : null}
                </button>
              </div>

              {/* Shortcut 2 */}
              <div className="rounded-lg border border-site-border bg-site-surface-2 p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-site-text">
                    {t("docs.shortcutRecording")}
                  </div>
                  <div className="text-[11px] text-site-text-2">{t("docs.shortcutRecordingDesc")}</div>
                </div>
                <button
                  onClick={() => copyToClipboard("Ctrl + Shift + F", "record")}
                  className="inline-flex items-center gap-1.5 bg-site-surface border border-site-border px-2.5 py-1.5 rounded-md text-xs font-mono font-bold text-site-text hover:border-accent transition-colors active:scale-95"
                  title={copiedKey === "record" ? t("docs.terminalCopied") : t("docs.copyCode")}
                >
                  <span>Ctrl + Shift + F</span>
                  {copiedKey === "record" ? (
                    <span className="text-[10px] text-accent font-sans font-semibold">({t("docs.terminalCopied")})</span>
                  ) : null}
                </button>
              </div>
            </div>

            {/* Terminal Snippet Box */}
            <div className="rounded-lg border border-site-border bg-site-surface-2 p-4 font-mono text-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-site-border-subtle text-[11px] text-site-text-2">
                <span className="font-sans font-semibold text-site-text">Chrome Extension Hotkey Mapping</span>
                <button
                  onClick={() => copyToClipboard("chrome://extensions/shortcuts", "url")}
                  className="text-[10px] text-site-text-2 hover:text-site-text px-2 py-0.5 rounded bg-site-surface border border-site-border-subtle transition-colors"
                >
                  {copiedKey === "url" ? t("docs.terminalCopied") : t("docs.copyCode")}
                </button>
              </div>
              <p className="text-site-text-2 text-[11px]"># Configure or rebind shortcuts anytime in your browser</p>
              <p className="text-accent text-xs mt-1">chrome://extensions/shortcuts</p>
            </div>
          </div>

          {/* Section 2: Storage Architecture */}
          <div className="rounded-xl border border-site-border bg-site-surface p-6 sm:p-8 space-y-4 shadow-xs">
            <h3 className="text-base font-bold text-site-text">{t("docs.driveSetup")}</h3>
            <p className="text-xs text-site-text-2 leading-relaxed">
              {t("docs.driveScopeDesc")}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/help" className="inline-flex items-center text-xs font-semibold text-accent hover:underline">
                {t("docs.viewHelpFaqs")} →
              </Link>
              <span className="text-site-text-2 text-xs">•</span>
              <Link href="/contact" className="inline-flex items-center text-xs font-semibold text-accent hover:underline">
                {t("docs.contactSupport")} →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </StaticShell>
  );
}
