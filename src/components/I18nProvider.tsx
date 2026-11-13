"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Locale, Dict, translate, setLocalePref, detectLocale, buildDict } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";

type Translator = (key: string, vars?: Record<string, string | number>) => string;

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translator;
  dir: "ltr" | "rtl";
}

const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
  dir: "ltr",
});

/**
 * `initialLocale` / `initialDict` come from the server, so the first render already
 * uses the right language (no flash, no layout shift). The provider only carries the
 * active language's dictionary, never both.
 *
 * Switching language saves a cookie and reloads the page. That keeps one language in
 * the bundle and avoids swapping text while the page is mounted.
 */
export function I18nProvider({
  children,
  initialLocale = "en",
  initialDict,
}: {
  children: ReactNode;
  initialLocale?: Locale;
  initialDict?: Dict;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  // Fixed for the life of this page load: changing language reloads, so the dictionary never swaps in place.
  const [dict] = useState<Dict>(() => initialDict ?? buildDict(initialLocale));

  // If the cookie disagrees with what the server rendered (e.g. the server could not
  // read it), reload once so the page matches the user's saved choice.
  useEffect(() => {
    const saved = detectLocale();
    if (saved !== initialLocale) {
      setLocalePref(saved);
      window.location.reload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocalePref(newLocale);
    setLocaleState(newLocale);
    window.location.reload();
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    // id is an LTR script - always ltr for now. If a future locale needs
    // rtl, set dir from the locale here.
    document.documentElement.dir = "ltr";
  }, [locale]);

  // Session keep-alive: re-arm token refresh when the tab becomes visible
  // again. supabase-js auto-refreshes via setInterval while the tab is
  // active, but browser throttling during idle/sleep can let the token
  // expire before the interval fires. This closes that gap by refreshing
  // proactively on focus/visibility when expiry is within 120s.
  useEffect(() => {
    const checkAndRefresh = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (!session?.expires_at) return;
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at - now <= 120) {
        await supabase.auth.refreshSession();
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") checkAndRefresh();
    };
    const onFocus = () => checkAndRefresh();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const t = useCallback<Translator>(
    (key, vars) => translate(dict, key, vars),
    [dict]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, dir: "ltr" }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useT(): I18nContextValue {
  return useContext(I18nContext);
}

export { translate };
