"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { detectLocale, setLocalePref, translate, Locale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";

type Translator = (key: string, vars?: Record<string, string | number>) => string;

interface I18nContextValue {
  locale: Locale;
  t: Translator;
  dir: "ltr" | "rtl";
}

const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  t: (key) => key,
  dir: "ltr",
});

export function I18nProvider({ children }: { children: ReactNode }) {
  // Detect once on mount; vanilla useState init (localStorage is safe to
  // access in the browser, SSR renders en as the initial pass anyway).
  const [locale] = useState<Locale>(() => detectLocale());

  useEffect(() => {
    setLocalePref(locale);
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
    (key, vars) => translate(locale, key, vars),
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, t, dir: "ltr" }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useT(): I18nContextValue {
  return useContext(I18nContext);
}

export { translate };