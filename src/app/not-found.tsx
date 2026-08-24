"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();
  const [seconds, setSeconds] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col justify-between">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="BugSnap" className="w-7 h-7 object-contain" />
            <span className="text-base font-bold tracking-tight">BugSnap</span>
          </Link>
          <Link href="/dashboard" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
            Open Dashboard →
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center bg-white dark:bg-zinc-900 border border-border rounded-2xl p-8 sm:p-10 shadow-xl shadow-black/5 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>

          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1 rounded-full mb-3 border border-indigo-100 dark:border-indigo-800/40">
            Error 404
          </span>

          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Page not found
          </h1>

          <p className="text-sm text-muted mt-3 leading-relaxed">
            The page you are looking for doesn&apos;t exist, has been moved, or the link is broken.
          </p>

          <div className="mt-4 py-2 px-3.5 rounded-lg bg-subtle text-xs text-muted font-medium border border-border">
            Redirecting to home in <span className="font-bold text-indigo-600 dark:text-indigo-400">{seconds}s</span>...
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full">
            <Link
              href="/"
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              Back to Home
            </Link>
            <Link
              href="/dashboard"
              className="w-full py-2.5 px-4 rounded-xl border border-border bg-subtle hover:bg-subtle/80 text-foreground text-sm font-semibold transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-subtle py-6">
        <div className="mx-auto max-w-5xl px-6 text-center text-xs text-muted">
          BugSnap — From Click to Fix
        </div>
      </footer>
    </div>
  );
}
