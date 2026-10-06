"use client";

import Link from "next/link";
import { useT } from "@/components/I18nProvider";

export default function NotFound() {
  const { t } = useT();

  return (
    <div className="min-h-screen bg-site-bg text-site-text font-site flex flex-col justify-between selection:bg-accent selection:text-white relative overflow-hidden">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] rounded-full blur-3xl opacity-30"
        style={{
          background: "var(--glow-primary)",
          animation: "glowPulse 6s ease-in-out infinite",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-20 -right-20 w-80 h-80 rounded-full blur-3xl opacity-20"
        style={{
          background: "var(--glow-secondary)",
          animation: "glowPulse 8s ease-in-out infinite reverse",
        }}
      />

      <style>{`
        @keyframes glowPulse {
          0%, 100% { transform: scale(1) translate(-50%, 0); opacity: 0.25; }
          50% { transform: scale(1.15) translate(-50%, 20px); opacity: 0.4; }
        }
        @keyframes floatBug {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-8px) rotate(-3deg); }
          75% { transform: translateY(6px) rotate(3deg); }
        }
        @keyframes radarScan {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulseRing {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.08); opacity: 0.3; }
          100% { transform: scale(0.95); opacity: 0.8; }
        }
      `}</style>

      {/* Header */}
      <header className="relative z-10 border-b border-site-border bg-site-surface px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-sm text-site-text group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icon.svg"
              alt=""
              aria-hidden="true"
              className="w-5 h-5 object-contain transition-transform group-hover:scale-110"
            />
            <span>BugSnap</span>
          </Link>
          <Link
            href="/"
            className="text-xs font-semibold text-site-text-2 hover:text-site-text transition-colors"
          >
            {t("notFound.backHome") || "Back to Home"}
          </Link>
        </div>
      </header>

      {/* Center 404 with Animation */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-16 text-center">
        <div className="max-w-md mx-auto">
          {/* Animated Illustration: Radar + Bug */}
          <div className="relative w-36 h-36 mx-auto mb-8 flex items-center justify-center">
            {/* Outer pulse ring */}
            <div
              className="absolute inset-0 rounded-full border border-site-accent/30"
              style={{ animation: "pulseRing 3s ease-in-out infinite" }}
            />
            {/* Second ring */}
            <div className="absolute inset-3 rounded-full border border-site-border" />
            {/* Inner circle */}
            <div className="absolute inset-6 rounded-full bg-site-surface-2 border border-site-border/80 flex items-center justify-center shadow-inner" />

            {/* Radar scanner needle */}
            <div
              className="absolute inset-3 rounded-full pointer-events-none overflow-hidden"
              style={{ animation: "radarScan 4s linear infinite" }}
            >
              <div
                className="w-1/2 h-1/2 origin-bottom-right"
                style={{
                  background: "conic-gradient(from 0deg, transparent 0deg, var(--glow-primary) 60deg, transparent 65deg)",
                }}
              />
            </div>

            {/* Floating bug icon */}
            <div
              className="relative z-10"
              style={{ animation: "floatBug 4s ease-in-out infinite" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icon.svg"
                alt="BugSnap"
                className="w-12 h-12 object-contain drop-shadow-md"
              />
            </div>

            {/* Small ping dot */}
            <span className="absolute top-6 right-8 w-2 h-2 rounded-full bg-site-danger animate-ping" />
            <span className="absolute top-6 right-8 w-2 h-2 rounded-full bg-site-danger" />
          </div>

          {/* Error code badge */}
          <span className="inline-block text-xs font-bold tracking-widest uppercase text-site-accent px-3 py-1 rounded-full bg-site-accent/10 border border-site-accent/20 mb-3">
            ERROR 404
          </span>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-site-text">
            {t("notFound.title") || "Page Not Found"}
          </h1>

          {/* Description */}
          <p className="mt-3 text-sm text-site-text-2 leading-relaxed max-w-sm mx-auto">
            {t("notFound.description") ||
              "The page you're looking for was moved, renamed, or never existed in the first place."}
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/"
              className="px-4 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-slate-900 text-xs font-bold transition-all shadow-sm shadow-accent/25 hover:shadow-accent/40"
            >
              {t("notFound.backHome") || "Back to Home"}
            </Link>
            <Link
              href="/blog"
              className="px-4 py-2.5 rounded-lg border border-site-border bg-site-surface hover:bg-site-surface-2 text-site-text text-xs font-semibold transition-all"
            >
              Read Blog →
            </Link>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 border-t border-site-border py-4 text-center text-xs text-site-text-2 bg-site-surface">
        {t("notFound.footer") || "BugSnap · Catch bugs, not headaches."}
      </footer>
    </div>
  );
}
