"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useT } from "@/components/I18nProvider";
import { SiteThemeToggle } from "@/components/site/SiteThemeToggle";
import { Icon, withAssetVersion } from "@/lib/iconify";

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
    // A protocol-relative path (//host) survives normalization and would navigate off-site.
    if (clean.startsWith("//") || clean.startsWith("/\\")) return "/dashboard";
    return clean === "/login" ? "/dashboard" : clean || "/dashboard";
  } catch {
    return "/dashboard";
  }
}

// Official Google "G" logo (4-color)
function GoogleLogo({ className = "w-5 h-5 shrink-0" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={withAssetVersion("/icons/google.svg")} alt="" aria-hidden="true" className={className} />
  );
}

export default function LoginPage() {
  const { t } = useT();
  const [signingIn, setSigningIn] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirectPath, setRedirectPath] = useState("/dashboard");
  // Destination carried through OAuth via ?next=, validated like redirectTo.
  const [nextPath] = useState(() => {
    if (typeof window === "undefined") return "";
    const raw = new URLSearchParams(window.location.search).get("next") || "";
    // Resolve exactly as the browser would and keep it only if it stays on this origin.
    // A regex on the raw string misses tab/newline tricks that the browser strips (/%09/evil.com).
    try {
      const resolved = new URL(raw, "http://localhost");
      const same = resolved.origin === "http://localhost";
      return same && raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/\\") && !resolved.pathname.startsWith("/login") ? resolved.pathname + resolved.search : "";
    } catch {
      return "";
    }
  });
  const [isFromExtension, setIsFromExtension] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const target = getSafeRedirectPath();
    setRedirectPath(target);

    let fromExt = false;
    let connectedState = false;
    let hasAuthError = false;

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      fromExt = params.get("ref") === "extension";
      connectedState = params.get("connected") === "true";
      setIsFromExtension(fromExt);
      setIsConnected(connectedState);

      // Extract any OAuth error passed in query, hash, or nested in redirectTo
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

      // Check for auto-login token from Extension or auth links
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
        // If session exists and no auth error
        if (data.session?.user && !hasAuthError) {
          if (typeof window !== "undefined") {
            window.postMessage(
              {
                source: "bugsnap-web",
                action: "sync_session",
                user: {
                  id: data.session.user.id,
                  email: data.session.user.email,
                  name: data.session.user.user_metadata?.full_name || "",
                  avatar: data.session.user.user_metadata?.avatar_url || "",
                },
              },
              window.location.origin
            );
          }

          // Any web login hands the extension a one-time pairing code, so the extension
          // connects whether the user signed in from the extension or from the website.
          const accessToken = data.session.access_token;
          fetch("/api/extension/pair", {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}` },
          })
            .then((r) => (r.ok ? r.json() : null))
            .then((json) => {
              if (json?.code) {
                window.postMessage(
                  { source: "bugsnap-web", action: "pair_extension", code: json.code },
                  window.location.origin
                );
              }
            })
            .catch(() => {});

          if (fromExt) {
            setIsConnected(true);
            // Give the extension a few seconds to store the pairing before leaving this page.
            setTimeout(() => {
              window.location.assign(target);
            }, 3000);
          } else {
            // Web login: forward to the destination the user came from. Wait long enough for the
            // pairing request and postMessage to finish, or navigation cancels them.
            setTimeout(() => {
              window.location.assign(nextPath || "/dashboard");
            }, 3000);
          }
        }
      })
      .catch(() => setLoadingSession(false));
    // nextPath is read once on mount (useState); the session check must run only once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signInWithGoogle() {
    setSigningIn(true);
    setError(null);
    try {
      // Always return through /login so the session-pairing step runs for web logins too.
      // Web logins then forward to their real destination (see the success branch).
      const dest = redirectPath.startsWith("/") ? redirectPath : "/dashboard";
      const target = isFromExtension
        ? "/login?ref=extension&connected=true"
        : `/login?next=${encodeURIComponent(dest)}`;
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
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0B0F19]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-400">{t("landing.redirecting")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center px-4 py-12 select-none">
      {/* Subtle compact theme toggle pinned unobtrusively in top corner */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <SiteThemeToggle compact />
      </div>

      <div className="w-full max-w-[440px] flex flex-col items-center text-center">
        {isConnected ? (
          /* Extension Connected State */
          <div className="w-full flex flex-col items-center text-center space-y-4 py-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Icon icon="lucide:check-circle-2" className="w-9 h-9" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {t("login.extensionConnectedTitle")}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                {t("login.extensionConnectedSubtitle")}
              </p>
            </div>
            <div className="w-full max-w-sm pt-4">
              <Link
                href="/dashboard"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-xs active:scale-[0.99] touch-manipulation"
              >
                <span>{t("login.openDashboard")}</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Minimalist Login Screen (100% 1-to-1 Parity with Image #11) */
          <>
            {/* Centered Large BugSnap Logo */}
            <Link href="/" className="inline-block transition-transform hover:scale-105" title="BugSnap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-day.svg"
                alt="BugSnap"
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain dark:hidden"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-dark.svg"
                alt="BugSnap"
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain hidden dark:block"
              />
            </Link>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-6 sm:mt-7">
              {t("login.title")}
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2.5 max-w-sm sm:max-w-md leading-relaxed">
              {t("login.subtitle")}
            </p>

            {/* Google Single Sign-On Button */}
            <div className="w-full max-w-sm sm:max-w-md mt-8">
              <button
                type="button"
                onClick={signInWithGoogle}
                disabled={signingIn}
                className="w-full inline-flex items-center justify-center gap-3 px-5 py-3.5 min-h-[48px] rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-100 text-sm sm:text-base font-semibold transition-all duration-150 shadow-2xs hover:shadow-xs active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer touch-manipulation"
              >
                {signingIn ? (
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                ) : (
                  <GoogleLogo className="w-5 h-5 shrink-0" />
                )}
                <span>{signingIn ? t("login.connecting") : t("login.continueGoogle")}</span>
              </button>

              {error && (
                <div
                  className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs text-center font-medium leading-relaxed"
                  role="alert"
                >
                  {error}
                </div>
              )}
            </div>

            {/* Terms of Service & Privacy Policy Agreement Text */}
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-10 max-w-xs sm:max-w-sm leading-relaxed">
              {t("login.termsAgreement")}{" "}
              <Link href="/terms" className="underline hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                {t("login.termsLink")}
              </Link>{" "}
              {t("login.and")}{" "}
              <Link href="/privacy" className="underline hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                {t("login.privacyLink")}
              </Link>
              .
            </p>
          </>
        )}
      </div>
    </div>
  );
}
