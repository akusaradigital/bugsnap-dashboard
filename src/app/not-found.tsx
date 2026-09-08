import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-100 dark:border-zinc-900 px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-base text-slate-900 dark:text-white">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <span>BugSnap</span>
          </Link>
          <Link
            href="/"
            className="text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            &larr; Back to home
          </Link>
        </div>
      </header>

      {/* Center 404 */}
      <main className="flex-1 flex items-center justify-center px-6 py-16 text-center">
        <div className="max-w-md">
          <p className="text-sm font-bold tracking-widest uppercase text-indigo-600 dark:text-indigo-400 mb-3 font-mono">
            404 Error
          </p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-950 dark:text-white">
            Page not found
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-zinc-400 leading-relaxed">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It may have been moved, deleted, or never existed.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/"
              className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all shadow-sm shadow-indigo-600/20"
            >
              Back to Home
            </Link>
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-800 dark:text-zinc-200 text-sm font-semibold transition-all"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-slate-100 dark:border-zinc-900 py-4 text-center text-xs text-slate-400 dark:text-zinc-600">
        BugSnap &mdash; From Click to Fix
      </footer>
    </div>
  );
}
