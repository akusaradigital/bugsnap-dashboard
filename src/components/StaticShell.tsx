import { ReactNode } from "react";

export function StaticShell({
  title,
  subtitle,
  lastUpdated,
  ctaHref = "/dashboard",
  ctaLabel = "Open Dashboard →",
  children,
}: {
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  /** Right-side header link target. Defaults to the dashboard. */
  ctaHref?: string;
  /** Right-side header link label. Defaults to "Open Dashboard →". */
  ctaLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className="creative-mesh min-h-screen bg-background text-foreground font-sans flex flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/75 backdrop-blur-xl shadow-sm">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="BugSnap" className="w-7 h-7 object-contain" />
            <span className="text-base font-bold tracking-tight">BugSnap</span>
          </a>
          <a href={ctaHref} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
            {ctaLabel}
          </a>
        </div>
      </header>

      <main className="flex-1">
        {typeof title !== "undefined" && (
          <section className="border-b border-border bg-subtle/45 backdrop-blur-sm">
            <div className="mx-auto max-w-5xl px-6 py-14">
              <div className="inline-flex rounded-full border border-border bg-subtle/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-600 shadow-sm mb-5">BugSnap Studio</div>
              <h1 className="max-w-3xl text-4xl sm:text-5xl font-black tracking-[-0.035em] text-foreground">{title}</h1>
              {subtitle && <p className="mt-4 text-sm text-muted max-w-2xl leading-relaxed">{subtitle}</p>}
              {lastUpdated && <p className="mt-3 text-xs text-muted">Last updated: {lastUpdated}</p>}
            </div>
          </section>
        )}
        {children}
      </main>

      <footer className="border-t border-border bg-subtle py-8">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-muted">
            <span>BugSnap — From Click to Fix</span>
            <span aria-hidden="true">·</span>
            <span>by{" "}
              <a href="https://akusaradigital.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                akusaradigital.com
              </a>
            </span>
            <span aria-hidden="true">·</span>
            <a href="/privacy" className="hover:text-foreground">Privacy</a>
            <span aria-hidden="true">·</span>
            <a href="/terms" className="hover:text-foreground">Terms</a>
            <span aria-hidden="true">·</span>
            <a href="/contact" className="hover:text-foreground">Contact</a>
            <span aria-hidden="true">·</span>
            <a href="/pricing" className="hover:text-foreground">Pricing</a>
          </div>
          <p className="mt-3 text-xs text-muted">
            Your captures live in your own Google Drive — your data stays yours.
          </p>
        </div>
      </footer>
    </div>
  );
}
