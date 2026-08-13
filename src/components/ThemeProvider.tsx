"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Theme = "light" | "dark" | "system";

const ThemeContext = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({
  theme: "system",
  setTheme: () => {},
});

export function applyThemeClass(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", !!dark);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");

  useEffect(() => {
    // Load user theme preference from the profile in the DB, fallback to system.
    let cancelled = false;
    (async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        const { data: session } = await supabase.auth.getSession();
        const u = session.session?.user;
        if (!u?.email) return;
        const { data: row } = await supabase
          .from("users")
          .select("theme")
          .ilike("email", u.email)
          .maybeSingle();
        if (!cancelled && row?.theme) setThemeState(row.theme as Theme);
      } catch {
        // keep default system
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    applyThemeClass(theme);
    const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (theme === "system" && mql) {
      const handler = () => applyThemeClass("system");
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    }
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    applyThemeClass(t);
  };

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}