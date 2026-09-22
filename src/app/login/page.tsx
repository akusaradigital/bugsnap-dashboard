"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useT } from "@/components/I18nProvider";
import { IconArrowLeft } from "@/components/site/TablerIcons";

function getSafeRedirectPath(): string {
  if (typeof window === "undefined") return "/dashboard";
  const raw = new URLSearchParams(window.location.search).get("redirectTo") || "/dashboard";
  if (!/^\/(?!\/|\\)/.test(raw)) return "/dashboard";
  if (raw.startsWith("/login")) return "/dashboard";
  return raw;
}

// Official Google "G" logo (4-color)
function GoogleLogo({ className = "w-4 h-4 shrink-0" }: { className?: string }) {
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
      <div className="min-h-screen flex items-center justify-center bg-site-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-site-text-2">{t("landing.redirecting")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-site-bg text-site-text font-site flex flex-col justify-between">
      {/* Top Bar Navigation */}
      <header className="w-full border-b border-site-border bg-site-surface">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-4 sm:px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icon.svg"
              alt="BugSnap"
              className="w-7 h-7 object-contain"
            />
            <span className="text-base font-bold tracking-tight text-site-text">
              BugSnap
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-site-text-2 hover:text-site-text transition-colors px-2.5 py-1.5 rounded-md hover:bg-site-surface-2"
          >
            <IconArrowLeft size={14} strokeWidth={2} />
            <span>{t("login.backToHome")}</span>
          </Link>
        </div>
      </header>

      {/* Main Form Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Brand & Heading */}
          <div className="flex flex-col items-center text-center mb-8">
            <Link
              href="/"
              className="flex items-center justify-center w-12 h-12 rounded-xl bg-site-surface border border-site-border shadow-xs mb-4"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon.svg" alt="BugSnap" className="w-7 h-7 object-contain" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-site-text">
              {t("login.welcomeTitle")}
            </h1>
            <p className="text-xs text-site-text-2 mt-2 leading-relaxed">
              {t("login.welcomeSubtitle")}
            </p>
          </div>

          {/* Clean Card */}
          <div className="rounded-xl border border-site-border bg-site-surface shadow-xs p-6 space-y-5">
            {/* Google SSO button */}
            <button
              onClick={signInWithGoogle}
              disabled={signingIn}
              className="w-full inline-flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg bg-site-surface border border-site-border hover:border-site-text-2 hover:bg-site-surface-2 text-site-text text-xs font-semibold transition-colors shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <GoogleLogo className="w-4 h-4 shrink-0" />
              <span>{signingIn ? t("login.connecting") : t("login.continueGoogle")}</span>
            </button>

            {error && (
              <div
                className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs text-center font-medium leading-relaxed"
                role="alert"
              >
                {error}
              </div>
            )}

            <div className="pt-4 border-t border-site-border-subtle space-y-4">
              <p className="text-[11px] text-site-text-2 text-center leading-relaxed">
                {t("login.secureNote")}
              </p>

              {/* Feature trust strip */}
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-site-text-2 font-mono">
                <div className="p-2 rounded-md bg-site-surface-2 border border-site-border-subtle">
                  <span className="block font-bold text-site-text">100%</span>
                  <span className="text-[9px] line-clamp-1">{t("login.badgeData")}</span>
                </div>
                <div className="p-2 rounded-md bg-site-surface-2 border border-site-border-subtle">
                  <span className="block font-bold text-accent">DevTools</span>
                  <span className="text-[9px] line-clamp-1">{t("login.badgeDevTools")}</span>
                </div>
                <div className="p-2 rounded-md bg-site-surface-2 border border-site-border-subtle">
                  <span className="block font-bold text-emerald-600 dark:text-emerald-400">Drive</span>
                  <span className="text-[9px] line-clamp-1">{t("login.badgeDrive")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-site-border bg-site-surface py-5 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-site-text-2">
          <p>© {new Date().getFullYear()} BugSnap. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/privacy"
              className="hover:text-site-text transition-colors"
            >
              {t("login.privacy")}
            </Link>
            <Link
              href="/terms"
              className="hover:text-site-text transition-colors"
            >
              {t("login.terms")}
            </Link>
            <Link
              href="/help"
              className="hover:text-site-text transition-colors"
            >
              {t("login.help")}
            </Link>
            <Link
              href="/"
              className="hover:text-site-text transition-colors"
            >
              {t("login.backToHome")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
