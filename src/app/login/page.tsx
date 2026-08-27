"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

function getSafeRedirectPath(): string {
  if (typeof window === "undefined") return "/dashboard";
  const raw = new URLSearchParams(window.location.search).get("redirectTo") || "/dashboard";
  if (!raw.startsWith("/")) return "/dashboard";
  if (raw.startsWith("//")) return "/dashboard";
  if (raw.startsWith("/login")) return "/dashboard";
  return raw;
}

// Official Google "G" logo (4-color)
function GoogleLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export default function LoginPage() {
  const [signingIn, setSigningIn] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirectPath, setRedirectPath] = useState("/dashboard");

  useEffect(() => {
    const target = getSafeRedirectPath();
    setRedirectPath(target);
    supabase.auth.getSession().then(({ data }) => {
      setLoadingSession(false);
      if (data.session?.user) window.location.assign(target);
    });
  }, []);

  async function signInWithGoogle() {
    setSigningIn(true);
    setError(null);
    try {
      const target = redirectPath.startsWith("/") ? redirectPath : "/dashboard";
      const redirectTo = `${window.location.origin}${target}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) {
        console.warn("Google sign-in failed:", error.message);
        setError("Google sign-in is currently unavailable. Please try again.");
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSigningIn(false);
    }
  }

  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex flex-col items-center text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="BugSnap" className="w-14 h-14 object-contain mb-4" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome to BugSnap</h1>
          <p className="text-sm text-muted mt-2">
            Capture screen recordings with full DevTools context - saved directly to your own Google Drive.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-white shadow-sm p-6 space-y-4">
          {/* Google SSO button */}
          <button
            onClick={signInWithGoogle}
            disabled={signingIn}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-border bg-white text-sm font-semibold text-foreground hover:bg-subtle transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <GoogleLogo />
            {signingIn ? "Connecting to Google..." : "Continue with Google"}
          </button>

          {error && (
            <p className="text-xs text-red-600 text-center" role="alert">
              {error}
            </p>
          )}

          <div className="pt-2 border-t border-border">
            <p className="text-[11px] text-muted text-center leading-relaxed">
              Sign in with Google to get started.
              <br />
              Your captures are stored in your own Google Drive - your data stays yours.
            </p>
          </div>
        </div>

        {/* Links */}
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted">
          <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
          <span aria-hidden="true">·</span>
          <a href="/terms" className="hover:text-foreground transition-colors">Terms</a>
          <span aria-hidden="true">·</span>
          <a href="/" className="hover:text-foreground transition-colors">← Back to Home</a>
        </div>
      </div>
    </div>
  );
}
