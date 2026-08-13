"use client";

import Link from "next/link";

const CHROME_WEB_STORE_URL = "https://chromewebstore.google.com/detail/jfhbmdllebgpmceeoffkfhlhdchhbcg";

export function AuthRequiredCard({ title = "404 - Page Requires Authentication" }: { title?: string }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 text-foreground font-sans">
      <div className="w-full max-w-md bg-subtle border border-border rounded-2xl p-6 sm:p-8 text-center shadow-lg space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="BugSnap" className="w-9 h-9 object-contain" />
          <span className="text-xl font-bold tracking-tight text-foreground">BugSnap</span>
        </div>

        {/* Lock Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        {/* Heading & Info */}
        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="text-xs sm:text-sm text-muted leading-relaxed">
            This dashboard page is protected. Sign in to your BugSnap account to access workspace features and screen captures.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Sign In to BugSnap
          </Link>

          <a
            href={CHROME_WEB_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Extension (Chrome Web Store)
          </a>
        </div>

        <p className="text-[11px] text-muted pt-2 border-t border-border/60">
          Captures are stored safely in your own Google Drive.
        </p>
      </div>
    </div>
  );
}
