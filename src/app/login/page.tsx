"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useT } from "@/components/I18nProvider";

function getSafeRedirectPath(): string {
  if (typeof window === "undefined") return "/dashboard";
  const raw = new URLSearchParams(window.location.search).get("redirectTo") || "/dashboard";
  if (!raw.startsWith("/")) return "/dashboard";
  if (raw.startsWith("//")) return "/dashboard";
  if (raw.startsWith("/login")) return "/dashboard";
  return raw;
}

// Official Google "G" logo (4-color)
function GoogleLogo({ className = "w-5 h-5 shrink-0" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/icons/google.svg" alt="Google" className={className} />
  );
}

export default function LoginPage() {
  const { t } = useT();
  const [signingIn, setSigningIn] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirectPath, setRedirectPath] = useState("/dashboard");

  useEffect(() => {
    const target = getSafeRedirectPath();
    setRedirectPath(target);
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setLoadingSession(false);
        if (data.session?.user) window.location.assign(target);
      })
      .catch(() => setLoadingSession(false));
  }, []);

  async function signInWithGoogle() {
    setSigningIn(true);
    setError(null);
    try {
      const target = redirectPath.startsWith("/") ? redirectPath : "/dashboard";
      const redirectTo = `${window.location.origin}${target}`;
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (authError) {
        console.warn("Google sign-in failed:", authError.message);
        setError(t("login.errorGoogle"));
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError(t("login.errorGeneric"));
    } finally {
      setSigningIn(false);
    }
  }

  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_left,#eef2ff_0%,#ffffff_40%,#f0fdf4_100%)] dark:bg-none dark:bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#89BD49] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-muted">{t("landing.redirecting")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,#eef2ff_0%,#ffffff_40%,#f0fdf4_100%)] text-slate-900 font-sans dark:bg-none dark:bg-background dark:text-foreground relative flex flex-col justify-between overflow-hidden selection:bg-[#89BD49] selection:text-white">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-[#89BD49]/15 via-[#6B9A35]/15 to-emerald-300/10 blur-3xl dark:from-[#89BD49]/10 dark:via-emerald-950/20 dark:to-emerald-900/10 animate-pulse-slow" />
      <div className="pointer-events-none absolute -bottom-32 right-1/4 -z-10 h-80 w-[36rem] rounded-full bg-gradient-to-br from-[#89BD49]/10 to-teal-400/10 blur-3xl dark:from-[#89BD49]/10 dark:to-teal-950/20" />

      {/* Top Bar Navigation */}
      <header className="w-full border-b border-white/60 dark:border-border/60 bg-white/40 dark:bg-background/40 backdrop-blur-md">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4">
          <Link href="/" className="group flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icon.svg"
              alt="BugSnap"
              className="w-8 h-8 object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <span className="text-lg font-bold tracking-tight group-hover:text-[#6B9A35] dark:group-hover:text-[#A8D666] transition-colors duration-200">
              BugSnap
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-muted hover:text-[#6B9A35] dark:hover:text-[#A8D666] transition-colors px-3 py-1.5 rounded-lg hover:bg-white/60 dark:hover:bg-subtle"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>{t("login.backToHome")}</span>
          </Link>
        </div>
      </header>

      {/* Main Form Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-md">
          {/* Brand & Heading */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative mb-5">
              <div className="absolute -inset-2 rounded-2xl bg-[#89BD49]/20 blur-lg opacity-70 dark:opacity-30 animate-pulse-slow" />
              <Link
                href="/"
                className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-white/90 dark:bg-subtle border border-white/80 dark:border-border shadow-lg shadow-slate-200/50 dark:shadow-none backdrop-blur-xl transition-transform hover:scale-105"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon.svg" alt="BugSnap" className="w-10 h-10 object-contain" />
              </Link>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-[-0.035em] text-slate-900 dark:text-foreground">
              {t("login.welcomeTitle")}
            </h1>
            <p className="text-sm text-slate-600 dark:text-muted mt-3 max-w-sm leading-relaxed">
              {t("login.welcomeSubtitle")}
            </p>
          </div>

          {/* Interactive Modern Card */}
          <div className="relative rounded-3xl border border-white/80 dark:border-border bg-white/80 dark:bg-subtle/80 backdrop-blur-xl shadow-2xl shadow-slate-200/60 dark:shadow-none p-5 sm:p-8 space-y-6">
            {/* Google SSO button */}
            <button
              onClick={signInWithGoogle}
              disabled={signingIn}
              className="w-full group relative inline-flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white dark:bg-background border border-slate-200/90 dark:border-border hover:border-[#89BD49]/50 dark:hover:border-[#89BD49]/60 hover:bg-slate-50 dark:hover:bg-subtle text-slate-800 dark:text-foreground text-sm font-bold transition-all duration-200 shadow-md shadow-slate-200/50 dark:shadow-none hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <GoogleLogo className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
              <span>{signingIn ? t("login.connecting") : t("login.continueGoogle")}</span>
            </button>

            {error && (
              <div
                className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs text-center font-medium leading-relaxed"
                role="alert"
              >
                {error}
              </div>
            )}

            <div className="pt-4 border-t border-slate-200/80 dark:border-border/80 space-y-4">
              <p className="text-xs text-slate-500 dark:text-muted text-center leading-relaxed">
                {t("login.secureNote")}
              </p>

              {/* Feature trust strip */}
              <div className="pt-1 grid grid-cols-3 gap-2 text-center text-[10px] text-slate-600 dark:text-muted font-medium">
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-background/60 border border-slate-100 dark:border-border/50">
                  <span className="block font-bold text-slate-800 dark:text-foreground">100%</span>
                  <span className="text-[9px] line-clamp-1">{t("login.badgeData")}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-background/60 border border-slate-100 dark:border-border/50">
                  <span className="block font-bold text-[#6B9A35] dark:text-[#A8D666]">DevTools</span>
                  <span className="text-[9px] line-clamp-1">{t("login.badgeDevTools")}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-background/60 border border-slate-100 dark:border-border/50">
                  <span className="block font-bold text-emerald-600 dark:text-emerald-400">Drive</span>
                  <span className="text-[9px] line-clamp-1">{t("login.badgeDrive")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/60 dark:border-border/60 bg-white/40 dark:bg-background/40 backdrop-blur-md py-6 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-muted">
          <p>© {new Date().getFullYear()} BugSnap. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link
              href="/privacy"
              className="hover:text-[#6B9A35] dark:hover:text-[#A8D666] transition-colors font-medium"
            >
              {t("login.privacy")}
            </Link>
            <Link
              href="/terms"
              className="hover:text-[#6B9A35] dark:hover:text-[#A8D666] transition-colors font-medium"
            >
              {t("login.terms")}
            </Link>
            <Link
              href="/help"
              className="hover:text-[#6B9A35] dark:hover:text-[#A8D666] transition-colors font-medium"
            >
              {t("login.help")}
            </Link>
            <Link
              href="/"
              className="hover:text-[#6B9A35] dark:hover:text-[#A8D666] transition-colors font-medium"
            >
              {t("login.backToHome")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
