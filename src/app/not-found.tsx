import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,#eef2ff_0%,#ffffff_40%,#f0fdf4_100%)] text-slate-900 font-sans dark:bg-none dark:bg-background dark:text-foreground flex flex-col justify-between selection:bg-[#89BD49] selection:text-white">
      {/* Header */}
      <header className="border-b border-white/60 dark:border-border/60 bg-white/40 dark:bg-background/40 backdrop-blur-md px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-base text-slate-900 dark:text-foreground">
            <span className="w-2.5 h-2.5 rounded-full bg-[#89BD49]" />
            <span>BugSnap</span>
          </Link>
          <Link
            href="/"
            className="text-xs font-semibold text-slate-600 dark:text-muted hover:text-[#6B9A35] dark:hover:text-[#A8D666] transition-colors"
          >
             Back to home
          </Link>
        </div>
      </header>

      {/* Center 404 */}
      <main className="flex-1 flex items-center justify-center px-6 py-16 text-center">
        <div className="max-w-md">
          <p className="text-sm font-bold tracking-widest uppercase text-[#6B9A35] dark:text-[#A8D666] mb-3 font-mono">
            404 Error
          </p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-foreground">
            Page not found
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-muted leading-relaxed">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It may have been moved, deleted, or never existed.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/"
              className="px-5 py-2.5 rounded-lg bg-[#89BD49] hover:bg-[#6B9A35] text-white text-sm font-semibold transition-all shadow-sm shadow-[#89BD49]/25"
            >
              Back to Home
            </Link>
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-lg border border-border bg-white dark:bg-subtle hover:bg-subtle dark:hover:bg-border/30 text-foreground text-sm font-semibold transition-all"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-white/60 dark:border-border/60 py-4 text-center text-xs text-slate-500 dark:text-muted bg-white/40 dark:bg-background/40">
        BugSnap &mdash; From Click to Fix
      </footer>
    </div>
  );
}
