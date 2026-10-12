"use client";

import { useState, useEffect, useCallback } from "react";
import { Icon } from "@/lib/iconify";
import { useT } from "@/components/I18nProvider";

type ShortcutId = "screenshot" | "record";

interface ShortcutDef {
  id: ShortcutId;
  defaultKey: string;
  labelKey: string;
  descKey: string;
  flashKey: string;
  icon: string;
  colorClass: string;
  accentBorder: string;
  accentBg: string;
  dotColor: string;
}

const SHORTCUT_DEFS: ShortcutDef[] = [
  {
    id: "screenshot",
    defaultKey: "S",
    labelKey: "site.hotkeys.screenshotTitle",
    descKey: "site.hotkeys.screenshotDesc",
    flashKey: "site.hotkeys.screenshotFlash",
    icon: "lucide:camera",
    colorClass: "text-blue-500",
    accentBorder: "border-blue-400/50",
    accentBg: "bg-blue-500/5",
    dotColor: "bg-blue-500",
  },
  {
    id: "record",
    defaultKey: "F",
    labelKey: "site.hotkeys.recordTitle",
    descKey: "site.hotkeys.recordDesc",
    flashKey: "site.hotkeys.recordFlash",
    icon: "lucide:video",
    colorClass: "text-rose-500",
    accentBorder: "border-rose-400/50",
    accentBg: "bg-rose-500/5",
    dotColor: "bg-rose-500",
  },
];

const FLASH_DURATION_MS = 1600;
const CHROME_SHORTCUTS_URL = "chrome://extensions/shortcuts";

export function HotkeyCommandBar() {
  const { t } = useT();
  const [active, setActive] = useState<ShortcutId | null>(null);
  const [isMac, setIsMac] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (
      typeof navigator !== "undefined" &&
      /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform || navigator.userAgent)
    ) {
      setIsMac(true);
    }
  }, []);

  const trigger = useCallback((id: ShortcutId) => {
    setActive(id);
    setTimeout(() => setActive(null), FLASH_DURATION_MS);
  }, []);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(CHROME_SHORTCUTS_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is restricted
    }
  };

  const modKey = isMac ? "Cmd" : "Ctrl";

  return (
    <div className="max-w-2xl mx-auto rounded-2xl border border-site-border bg-site-surface shadow-sm overflow-hidden min-w-0">
      {/* Header bar */}
      <div className="px-4 py-3 border-b border-site-border bg-site-surface-2 flex items-center justify-between gap-3 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Traffic lights */}
          <div className="flex gap-1.5 shrink-0" aria-hidden="true">
            <span className="w-3 h-3 rounded-full bg-red-400/90" />
            <span className="w-3 h-3 rounded-full bg-yellow-400/90" />
            <span className="w-3 h-3 rounded-full bg-green-400/90" />
          </div>
          <div className="flex items-center gap-1.5 min-w-0 text-xs font-semibold text-site-text">
            <Icon icon="logos:chrome" className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">Chrome Extension Shortcuts</span>
          </div>
        </div>

        <span className="text-xs font-medium text-site-text-2 shrink-0">
          2 {t("site.hotkeys.badgeConfigurable")}
        </span>
      </div>

      {/* 2 Registered Extension Shortcuts */}
      <div className="flex flex-col gap-2 p-3 sm:p-4">
        {SHORTCUT_DEFS.map((s) => {
          const isActive = active === s.id;
          const label = t(s.labelKey);
          const desc = t(s.descKey);
          const flash = t(s.flashKey);

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => trigger(s.id)}
              className={[
                "group flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 p-3.5 sm:p-4 rounded-xl border text-left",
                "transition-all duration-200 cursor-pointer w-full min-w-0",
                isActive
                  ? `${s.accentBorder} ${s.accentBg} border-accent/40 bg-accent/5 ring-1 ring-accent/30`
                  : "border-site-border bg-site-surface hover:bg-site-surface-2/60 hover:border-site-border-subtle",
              ].join(" ")}
              aria-label={`Preview ${label} shortcut action`}
            >
              <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                {/* Shortcut Icon */}
                <div
                  className={`w-9 h-9 rounded-lg border border-site-border flex items-center justify-center shrink-0 transition-colors ${
                    isActive ? s.colorClass : "text-site-text-2 group-hover:text-site-text"
                  } bg-site-surface-2`}
                  aria-hidden="true"
                >
                  <Icon icon={s.icon} className="w-4 h-4 shrink-0" />
                </div>

                {/* Text & description */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className={`text-sm font-bold transition-colors ${
                        isActive ? s.colorClass : "text-site-text"
                      }`}
                    >
                      {label}
                    </p>
                    <span className="text-[10px] font-medium text-site-text-2 bg-site-surface-2 px-1.5 py-0.5 rounded border border-site-border shrink-0">
                      {t("site.hotkeys.badgeDefault")}
                    </span>
                  </div>

                  {isActive ? (
                    <p className="text-xs font-semibold mt-1 text-accent animate-[fadeIn_0.15s_ease-out] truncate">
                      {flash}
                    </p>
                  ) : (
                    <p className="text-xs text-site-text-2 mt-0.5 leading-relaxed line-clamp-2">
                      {desc}
                    </p>
                  )}
                </div>
              </div>

              {/* Key Badges & Live Status */}
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0 pl-12 sm:pl-0">
                <div className="flex items-center gap-1 shrink-0">
                  <kbd className="inline-flex items-center justify-center px-2 py-1 rounded-md border border-site-border shadow-2xs font-mono text-xs font-bold bg-site-bg text-site-text">
                    {modKey}
                  </kbd>
                  <span className="text-xs text-site-text-2">+</span>
                  <kbd className="inline-flex items-center justify-center px-2 py-1 rounded-md border border-site-border shadow-2xs font-mono text-xs font-bold bg-site-bg text-site-text">
                    Shift
                  </kbd>
                  <span className="text-xs text-site-text-2">+</span>
                  <kbd
                    className={`inline-flex items-center justify-center px-2 py-1 rounded-md border border-site-border shadow-2xs font-mono text-xs font-bold bg-site-bg ${
                      isActive ? s.colorClass : "text-site-text"
                    }`}
                  >
                    {s.defaultKey}
                  </kbd>
                </div>

                {isActive && (
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${s.dotColor} animate-ping`}
                    aria-hidden="true"
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Chrome Configuration Guide Box (harus diset di chrome://extensions/shortcuts) */}
      <div className="mx-3 sm:mx-4 mb-3 sm:mb-4 p-3.5 sm:p-4 rounded-xl border border-site-border bg-site-surface-2/80 space-y-2.5 min-w-0">
        <div className="flex items-center justify-between gap-2 min-w-0 flex-wrap">
          <div className="flex items-center gap-2 min-w-0 text-xs font-bold text-site-text">
            <Icon icon="lucide:settings" className="w-3.5 h-3.5 text-[#6B9A35] dark:text-[#A8D666] shrink-0" aria-hidden="true" />
            <span className="truncate">{t("site.hotkeys.setupTitle")}</span>
          </div>

          <button
            type="button"
            onClick={handleCopyUrl}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-site-surface border border-site-border hover:bg-site-surface-2 text-site-text transition-colors cursor-pointer shrink-0"
            title="Salin chrome://extensions/shortcuts ke clipboard"
          >
            <Icon
              icon={copied ? "lucide:check" : "lucide:copy"}
              className={`w-3.5 h-3.5 shrink-0 ${copied ? "text-emerald-500" : "text-site-text-2"}`}
              aria-hidden="true"
            />
            <span>{copied ? t("site.hotkeys.copied") : t("site.hotkeys.copyUrl")}</span>
          </button>
        </div>

        <div className="space-y-1.5 text-xs text-site-text-2 leading-relaxed">
          <div className="flex items-start gap-2 min-w-0">
            <span className="text-[10px] font-mono font-bold w-4 h-4 rounded-full bg-site-surface border border-site-border flex items-center justify-center shrink-0 mt-0.5 text-site-text">
              1
            </span>
            <div className="min-w-0 flex-1">
              <span>{t("site.hotkeys.setupStep1")} </span>
              <code className="px-1.5 py-0.5 rounded bg-site-surface border border-site-border font-mono text-[11px] text-site-text select-all break-all">
                chrome://extensions/shortcuts
              </code>
            </div>
          </div>

          <div className="flex items-start gap-2 min-w-0">
            <span className="text-[10px] font-mono font-bold w-4 h-4 rounded-full bg-site-surface border border-site-border flex items-center justify-center shrink-0 mt-0.5 text-site-text">
              2
            </span>
            <p className="min-w-0 flex-1">
              {t("site.hotkeys.setupStep2")}
            </p>
          </div>
        </div>
      </div>

      {/* Note footer */}
      <div className="px-4 py-2.5 border-t border-site-border bg-site-surface flex items-center gap-2 text-[11px] text-site-text-2">
        <Icon icon="lucide:info" className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-hidden="true" />
        <span className="leading-snug">{t("site.hotkeys.tip")}</span>
      </div>
    </div>
  );
}
