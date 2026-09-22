"use client";

import { useTheme, type Theme } from "@/components/ThemeProvider";
import { useT } from "@/components/I18nProvider";
import { IconSun, IconDeviceDesktop, IconMoon } from "@/components/site/TablerIcons";

interface SiteThemeToggleProps {
  compact?: boolean;
}

export function SiteThemeToggle({ compact = false }: SiteThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const { t } = useT();

  const options: Array<{ id: Theme; labelKey: string; icon: (active: boolean) => JSX.Element }> = [
    {
      id: "light",
      labelKey: "site.theme.day",
      icon: (active) => (
        <IconSun
          size={14}
          strokeWidth={2}
          className={`transition-colors ${active ? "text-amber-600 dark:text-amber-400" : "text-site-text-2"}`}
        />
      ),
    },
    {
      id: "system",
      labelKey: "site.theme.system",
      icon: (active) => (
        <IconDeviceDesktop
          size={14}
          strokeWidth={2}
          className={`transition-colors ${active ? "text-site-text" : "text-site-text-2"}`}
        />
      ),
    },
    {
      id: "dark",
      labelKey: "site.theme.dark",
      icon: (active) => (
        <IconMoon
          size={14}
          strokeWidth={2}
          className={`transition-colors ${active ? "text-indigo-500 dark:text-indigo-400" : "text-site-text-2"}`}
        />
      ),
    },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Theme selection"
      className="inline-flex items-center rounded-lg border border-site-border bg-site-surface p-0.5 shadow-2xs"
    >
      {options.map((opt) => {
        const isActive = theme === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={t(opt.labelKey)}
            onClick={() => setTheme(opt.id)}
            title={t(opt.labelKey)}
            className={`relative flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-all ${
              isActive
                ? "bg-site-surface-2 text-site-text shadow-2xs font-semibold"
                : "text-site-text-2 hover:text-site-text hover:bg-site-surface-2/60"
            }`}
          >
            {opt.icon(isActive)}
            {!compact && <span className="hidden md:inline text-[11px]">{t(opt.labelKey)}</span>}
          </button>
        );
      })}
    </div>
  );
}
