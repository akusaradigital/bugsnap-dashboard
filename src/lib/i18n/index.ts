import type { Locale, Dict } from "./types";
import { commonEn, commonId } from "./common";
import { dashboardEn, dashboardId } from "./dashboard";
import { capturesEn, capturesId } from "./captures";
import { devtoolsEn, devtoolsId } from "./devtools";
import { settingsEn, settingsId } from "./settings";
import { adminEn, adminId } from "./admin";
import { marketingEn, marketingId } from "./marketing";

export type { Locale, Dict };

export const LOCALE_COOKIE = "BugSnap.locale";

/**
 * Build the dictionary for ONE locale. Only that locale's strings are returned,
 * so the other language never reaches the browser. Pages get the same bundle
 * per locale and nothing else.
 */
export function buildDict(locale: Locale): Dict {
  if (locale === "id") {
    return {
      ...commonId,
      ...dashboardId,
      ...capturesId,
      ...devtoolsId,
      ...settingsId,
      ...adminId,
      ...marketingId,
    };
  }
  return {
    ...commonEn,
    ...dashboardEn,
    ...capturesEn,
    ...devtoolsEn,
    ...settingsEn,
    ...adminEn,
    ...marketingEn,
  };
}

// Kept for code that still reads both dictionaries directly. New code should use buildDict().
export const en: Dict = buildDict("en");
export const id: Dict = buildDict("id");
export const locales: Record<Locale, Dict> = { en, id };

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "id";
}

/** Read the saved locale from the cookie written by setLocalePref. Falls back to the browser language. */
export function detectLocale(): Locale {
  if (typeof document !== "undefined") {
    const match = document.cookie.match(new RegExp(`(?:^|;\s*)${LOCALE_COOKIE.replace(".", "\.")}=(en|id)`));
    if (match && isLocale(match[1])) return match[1];
  }
  if (typeof navigator !== "undefined") {
    const lang = (navigator.language || "").toLowerCase();
    if (lang.startsWith("id")) return "id";
  }
  return "en";
}

/** Save the locale as a cookie so the server and the next page load can read it. */
export function setLocalePref(locale: Locale): void {
  if (typeof document === "undefined") return;
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${oneYear}; samesite=lax`;
}

export function translate(dict: Dict, key: string, vars?: Record<string, string | number>): string {
  let template = dict[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      template = template.split(`{${k}}`).join(String(v));
    }
  }
  return template;
}
