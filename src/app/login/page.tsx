"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useT } from "@/components/I18nProvider";
import { SiteThemeToggle } from "@/components/site/SiteThemeToggle";
import { Icon } from "@/lib/iconify";

function getSafeRedirectPath(): string {
  if (typeof window === "undefined") return "/dashboard";
  const raw = new URLSearchParams(window.location.search).get("redirectTo") || "/dashboard";
  if (!/^\/(?!\/|\\)/.test(raw)) return "/dashboard";
  if (raw.startsWith("/login")) return "/dashboard";
  // Strip auth error query and hash params if previous attempt failed
  try {
    const url = new URL(raw, "http://localhost");
    url.searchParams.delete("error");
    url.searchParams.delete("error_description");
    url.searchParams.delete("error_code");
    url.searchParams.delete("sb");
    const query = url.searchParams.toString();
    const clean = url.pathname + (query ? `?${query}` : "");
    return clean === "/login" ? "/dashboard" : clean || "/dashboard";
  } catch {
    return "/dashboard";
  }
}

// Official Google "G" logo (4-color)
function GoogleLogo({ className = "w-5 h-5 shrink-0" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/icons/google.svg" alt="" aria-hidden="true" className={className} />
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

    // Extract any OAuth error passed in query, hash, or nested in redirectTo
    let hasAuthError = false;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      let errDesc = params.get("error_description") || hashParams.get("error_description");
      if (!errDesc) {
        const rawRedirect = params.get("redirectTo");
        if (rawRedirect) {
          try {
            const nested = new URL(rawRedirect, "http://localhost");
            errDesc = nested.searchParams.get("error_description");
          } catch {
            // ignore
          }
        }
      }
      if (errDesc) {
        hasAuthError = true;
        setError(decodeURIComponent(errDesc.replace(/\+/g, " ")));
      } else if (params.has("error") || hashParams.has("error")) {
        hasAuthError = true;
        setError(params.get("error") || hashParams.get("error"));
      }
    }

    // Check for auto-login token from Extension or auth links
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token") || params.get("provider_token");
      if (token) {
        setSigningIn(true);
        fetch("/api/auth/token-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, access_token: token, redirectTo: target }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.actionLink) {
              window.location.assign(data.actionLink);
            } else {
              throw new Error("Invalid token login response");
            }
          })
          .catch((err) => {
            console.error("Auto login failed:", err);
            setSigningIn(false);
            setLoadingSession(false);
          });
        return;
      }
    }

    supabase.auth
      .getSession()
      .then(({ data }) => {
        setLoadingSession(false);
        // Do not auto-redirect if an auth error occurred, preventing bounce loops
        if (data.session?.user && !hasAuthError) window.location.assign(target);
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
        options: {
          redirectTo,
          queryParams: { prompt: "select_account", access_type: "offline" },
        },
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
    <div className="relative min-h-screen bg-site-bg text-site-text font-site flex flex-col justify-between overflow-x-hidden">
      {/* Subtle Ambient Background Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(59,130,246,0.08),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Top Bar Navigation */}
      <header className="relative z-10 w-full border-b border-site-border bg-site-surface/80 backdrop-blur-md">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-4 sm:px-6 py-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-day.svg"
              alt="BugSnap"
              className="w-7 h-7 object-contain transition-transform group-hover:scale-105 dark:hidden"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-dark.svg"
              alt="BugSnap"
              className="w-7 h-7 object-contain transition-transform group-hover:scale-105 hidden dark:block"
            />
            <span className="text-base font-bold tracking-tight text-site-text">
              BugSnap
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <SiteThemeToggle compact />
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-site-text-2 hover:text-site-text transition-colors px-2.5 py-1.5 min-h-[44px] rounded-lg hover:bg-site-surface-2 border border-transparent hover:border-site-border touch-manipulation"
            >
              <Icon icon="lucide:arrow-left" className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t("login.backToHome")}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-10 sm:py-16">
        <div className="w-full max-w-[420px] min-w-0">
          <div className="rounded-2xl border border-site-border bg-site-surface/95 backdrop-blur-md shadow-lg shadow-black/5 p-6 sm:p-8 space-y-6">
            {/* Brand Header */}
            <div className="flex flex-col items-center text-center">
              <Link
                href="/"
                className="group flex items-center justify-center w-14 h-14 rounded-2xl bg-site-surface-2 border border-site-border shadow-xs mb-4 p-2.5 transition-transform hover:scale-105"
                title="BugSnap"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-day.svg"
                  alt="BugSnap"
                  className="w-full h-full object-contain dark:hidden"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-dark.svg"
                  alt="BugSnap"
                  className="w-full h-full object-contain hidden dark:block"
                />
              </Link>
              <h1 className="text-2xl font-bold tracking-tight text-site-text">
                {t("login.welcomeTitle")}
              </h1>
              <p className="text-xs sm:text-sm text-site-text-2 mt-1.5 leading-relaxed max-w-xs">
                {t("login.welcomeSubtitle")}
              </p>
            </div>

            {/* Google Single Sign-On Button */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={signInWithGoogle}
                disabled={signingIn}
                className="w-full inline-flex items-center justify-center gap-3 px-4 py-3 min-h-[44px] rounded-xl bg-site-surface border border-site-border hover:border-site-text-2/40 hover:bg-site-surface-2 text-site-text text-sm font-semibold transition-all duration-150 shadow-xs hover:shadow active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer touch-manipulation"
              >
                {signingIn ? (
                  <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin shrink-0" />
                ) : (
                  <GoogleLogo className="w-5 h-5 shrink-0" />
                )}
                <span>{signingIn ? t("login.connecting") : t("login.continueGoogle")}</span>
              </button>

              {error && (
                <div
                  className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs text-center font-medium leading-relaxed"
                  role="alert"
                >
                  {error}
                </div>
              )}
            </div>

            {/* Secure Note & Terms */}
            <p className="text-[11px] text-site-text-2 text-center leading-relaxed px-1">
              {t("login.secureNote")}
            </p>

            {/* Feature Trust Strip */}
            <div className="pt-4 border-t border-site-border-subtle">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-site-surface-2/70 border border-site-border-subtle flex sm:flex-col items-center justify-between sm:justify-center gap-1.5 text-center min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Icon icon="lucide:shield-check" className="w-3.5 h-3.5" aria-hidden="true" />
                  </div>
                  <span className="text-[10px] font-bold text-site-text leading-tight truncate sm:max-w-full">
                    {t("login.badgeData")}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-site-surface-2/70 border border-site-border-subtle flex sm:flex-col items-center justify-between sm:justify-center gap-1.5 text-center min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                    <Icon icon="lucide:terminal" className="w-3.5 h-3.5" aria-hidden="true" />
                  </div>
                  <span className="text-[10px] font-bold text-site-text leading-tight truncate sm:max-w-full">
                    {t("login.badgeDevTools")}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-site-surface-2/70 border border-site-border-subtle flex sm:flex-col items-center justify-between sm:justify-center gap-1.5 text-center min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Icon icon="lucide:hard-drive" className="w-3.5 h-3.5" aria-hidden="true" />
                  </div>
                  <span className="text-[10px] font-bold text-site-text leading-tight truncate sm:max-w-full">
                    {t("login.badgeDrive")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 w-full border-t border-site-border bg-site-surface/80 backdrop-blur-md py-4 px-4 sm:px-6">
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
