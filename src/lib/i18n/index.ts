import type { Locale, Dict } from "./types";
import { commonEn, commonId } from "./common";
import { dashboardEn, dashboardId } from "./dashboard";
import { capturesEn, capturesId } from "./captures";
import { devtoolsEn, devtoolsId } from "./devtools";
import { settingsEn, settingsId } from "./settings";
import { adminEn, adminId } from "./admin";
import { marketingEn, marketingId } from "./marketing";

export type { Locale, Dict };

export const en: Dict = {
  ...commonEn,
  ...dashboardEn,
  ...capturesEn,
  ...devtoolsEn,
  ...settingsEn,
  ...adminEn,
  ...marketingEn,
};

export const id: Dict = {
  ...commonId,
  ...dashboardId,
  ...capturesId,
  ...devtoolsId,
  ...settingsId,
  ...adminId,
  ...marketingId,
};

export const locales: Record<Locale, Dict> = { en, id };

function storageGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

export function detectLocale(): Locale {
  const saved = storageGet("BugSnap.locale");
  if (saved === "id" || saved === "en") return saved;
  if (typeof navigator !== "undefined") {
    const lang = (navigator.language || (navigator as { userLanguage?: string }).userLanguage || "").toLowerCase();
    if (lang.startsWith("id")) return "id";
  }
  return "en";
}

export function setLocalePref(locale: Locale): void {
  try { localStorage.setItem("BugSnap.locale", locale); } catch { /* ignore */ }
}

export function translate(locale: Locale, key: string, vars?: Record<string, string | number>): string {
  const dict = locales[locale] || en;
  let template = dict[key] ?? en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      template = template.split(`{${k}}`).join(String(v));
    }
  }
  return template;
}
