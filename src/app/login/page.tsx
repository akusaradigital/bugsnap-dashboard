"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useT } from "@/components/I18nProvider";
import { SiteThemeToggle } from "@/components/site/SiteThemeToggle";
import { withAssetVersion } from "@/lib/iconify";

function getSafeRedirectPath(): string {
  if (typeof window === "undefined") return "/dashboard";
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("redirectTo") || params.get("next") || "/dashboard";
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
  const router = useRouter();
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

  useEffect(() => {
    const target = getSafeRedirectPath();
    setRedirectPath(target);

    let hasAuthError = false;

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

      // Extract any OAuth error passed in query, hash, or nested in redirectTo
      let errDesc = params.get("error_description") || hashParams.get("error_description");
      const errRaw = params.get("error") || hashParams.get("error");
      const errCode = params.get("error_code") || hashParams.get("error_code");

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

      if (
        errRaw === "access_denied" ||
        errDesc?.toLowerCase().includes("denied") ||
        errDesc?.toLowerCase().includes("cancelled")
      ) {
        hasAuthError = true;
        setError(t("login.errorCancelled"));
      } else if (errRaw === "server_error" || errDesc?.toLowerCase().includes("server_error")) {
        hasAuthError = true;
        setError(t("login.errorGoogle"));
      } else if (errDesc) {
        hasAuthError = true;
        setError(decodeURIComponent(errDesc.replace(/\+/g, " ")));
      } else if (errCode || errRaw) {
        hasAuthError = true;
        setError(errCode || errRaw || t("login.errorGeneric"));
      }

      // If auth error existed in URL, clean parameters to prevent persistent errors on reload
      if (hasAuthError) {
        try {
          const cleanUrl = new URL(window.location.href);
          ["error", "error_description", "error_code", "error_uri"].forEach((k) => {
            cleanUrl.searchParams.delete(k);
          });
          window.history.replaceState({}, "", cleanUrl.pathname + (cleanUrl.search ? cleanUrl.search : ""));
        } catch {}
      }

      // Check for OAuth PKCE callback code directly arriving on /login
      const code = params.get("code");
      if (code) {
        setSigningIn(true);
        supabase.auth
          .exchangeCodeForSession(code)
          .then(({ data, error: exchangeErr }) => {
            if (!exchangeErr && data.session?.user) {
              try { sessionStorage.removeItem("bugsnap_signed_out"); } catch {}
              try {
                const cleanUrl = new URL(window.location.href);
                cleanUrl.searchParams.delete("code");
                cleanUrl.searchParams.delete("sb_flow_id");
                window.history.replaceState({}, "", cleanUrl.pathname + (cleanUrl.search ? cleanUrl.search : ""));
              } catch {}
              router.replace(nextPath || target || "/dashboard");
            } else {
              setSigningIn(false);
              setLoadingSession(false);
              if (exchangeErr) setError(exchangeErr.message);
            }
          })
          .catch((err) => {
            setSigningIn(false);
            setLoadingSession(false);
            setError(err instanceof Error ? err.message : t("login.errorGeneric"));
          });
        return;
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
              throw new Error(data.error || "Invalid token login response");
            }
          })
          .catch((err) => {
            console.error("Auto login failed:", err);
            setSigningIn(false);
            setLoadingSession(false);
            setError(t("login.tokenExpired"));
            try {
              const cleanUrl = new URL(window.location.href);
              cleanUrl.searchParams.delete("token");
              cleanUrl.searchParams.delete("provider_token");
              window.history.replaceState({}, "", cleanUrl.pathname + (cleanUrl.search ? cleanUrl.search : ""));
            } catch {}
          });
        return;
      }
    }

    supabase.auth
      .getSession()
      .then(({ data }) => {
        setLoadingSession(false);
        // If session exists and no auth error, redirect directly to dashboard or target
        if (data.session?.user && !hasAuthError) {
          try { sessionStorage.removeItem("bugsnap_signed_out"); } catch {}
          // Session sync and extension pairing run in ExtensionSyncBridge (root layout), once per page.
          router.replace(nextPath || target || "/dashboard");
        }
      })
      .catch(() => setLoadingSession(false));

    // Listen for cross-tab sign-in, initial session settlement, or session updates
    const { data: authSub } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user && !hasAuthError) {
        try { sessionStorage.removeItem("bugsnap_signed_out"); } catch {}
        router.replace(nextPath || target || "/dashboard");
      }
    });

    return () => {
      authSub.subscription.unsubscribe();
    };
    // nextPath is read once on mount (useState); the session check must run only once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signInWithGoogle() {
    setSigningIn(true);
    setError(null);
    try {
      const dest = redirectPath.startsWith("/") ? redirectPath : "/dashboard";
      const redirectTo = `${window.location.origin}${dest}`;
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
      </div>
    </div>
  );
}
