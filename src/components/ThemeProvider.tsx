"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Theme = "light" | "dark" | "system";

const ThemeContext = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({
  theme: "light",
  setTheme: () => {},
});

export function applyThemeClass(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", !!dark);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("BugSnap_theme");
        if (stored === "light" || stored === "dark" || stored === "system") {
          return stored as Theme;
        }
      } catch {}
    }
    return "light";
  });

  useEffect(() => {
    // Only query user theme from DB if not already present in localStorage
    try {
      const stored = localStorage.getItem("BugSnap_theme");
      if (stored) return;
    } catch {}

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
        if (!cancelled && row?.theme) {
          setThemeState(row.theme as Theme);
          try { localStorage.setItem("BugSnap_theme", row.theme); } catch {}
        }
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
    try { localStorage.setItem("BugSnap_theme", t); } catch {}
    // Best-effort background sync to user profile if authenticated
    (async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        const { data: session } = await supabase.auth.getSession();
        const u = session.session?.user;
        if (!u?.email) return;
        await supabase.from("users").update({ theme: t }).ilike("email", u.email);
      } catch {}
    })();
  };

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}