"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useT } from "@/components/I18nProvider";

export default function Home() {
  const { t } = useT();
  const router = useRouter();
  const [loadingSession, setLoadingSession] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoLoggingIn, setAutoLoggingIn] = useState(false);

  useEffect(() => {
    // Check if redirecting with provider_token from chrome extension
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("provider_token");
      if (token) {
        setAutoLoggingIn(true);
        fetch("/api/auth/token-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token: token })
        })
          .then(res => {
            if (!res.ok) throw new Error("Token verification failed");
            return res.json();
          })
          .then(data => {
            if (data.actionLink) {
              window.location.assign(data.actionLink);
            } else {
              throw new Error("Invalid token login response");
            }
          })
          .catch(err => {
            console.error("Auto login failed:", err);
            setAutoLoggingIn(false);
            setError("Auto-login failed. Please sign in again.");
          });
        return;
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      const loggedIn = !!data.session?.user;
      setIsLoggedIn(loggedIn);
      setLoadingSession(false);
      if (loggedIn) router.replace("/dashboard");
    });
  }, [router]);

  const faqItems = [
    { q: "landing.faq1q", a: "landing.faq1a" },
    { q: "landing.faq2q", a: "landing.faq2a" },
    { q: "landing.faq3q", a: "landing.faq3a" },
    { q: "landing.faq4q", a: "landing.faq4a" },
  ];

  if (autoLoggingIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-7 h-7 text-indigo-600 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <p className="text-sm text-neutral-500 font-medium">Verifying session via Extension...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#eef2ff_0,#ffffff_34%,#f8fafc_100%)] text-slate-900 font-sans">
      <div className="relative z-10">
      {/* Navbar */}
      <header className="sticky top-0 z-20 border-b border-white/70 bg-white/75 backdrop-blur-xl shadow-sm shadow-slate-200/40">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="BugSnap" className="w-8 h-8 object-contain" />
            <span className="text-lg font-bold tracking-tight">BugSnap</span>
          </a>
          
          {loadingSession ? (
            <div className="w-16 h-4 bg-slate-50 animate-pulse rounded" />
          ) : isLoggedIn ? (
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              {t("landing.goToDashboard")}
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              {t("landing.signIn")}
            </Link>
          )}
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative isolate mx-auto max-w-6xl px-6 pt-24 pb-20 text-center">
          <div className="pointer-events-none absolute -top-28 left-1/2 -z-10 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-indigo-300/30 blur-3xl" />
          <div className="pointer-events-none absolute top-28 -left-24 -z-10 h-64 w-64 rounded-full bg-emerald-300/30 blur-3xl" />
          <div className="pointer-events-none absolute top-36 -right-28 -z-10 h-72 w-72 rounded-full bg-fuchsia-300/25 blur-3xl" />
          <h1 className="mx-auto max-w-4xl text-4xl sm:text-6xl md:text-7xl font-black tracking-[-0.04em] leading-[0.96]">
            <span className="bg-gradient-to-br from-slate-950 via-indigo-700 to-emerald-600 bg-clip-text text-transparent">
              {t("landing.tagline")}
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed">
            {t("landing.heroSub")}
          </p>

          {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

          {/* Hero CTAs */}
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://chrome.google.com/webstore"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2.5 w-full sm:w-auto justify-center rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-7 py-3 text-sm font-bold text-white transition-all shadow-xl shadow-indigo-500/25 hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              {t("landing.cta")}
            </a>
            <a
              href="/pricing"
              className="inline-flex items-center gap-2 w-full sm:w-auto justify-center rounded-2xl border border-white/70 bg-white/80 hover:bg-white px-7 py-3 text-sm font-bold text-slate-900 transition-all shadow-lg shadow-slate-200/70 backdrop-blur-xl hover:-translate-y-0.5"
            >
              {t("landing.pricing")}
            </a>
          </div>

          <p className="mt-6 text-xs font-medium text-slate-500">
            {t("landing.noCard")}
          </p>

          <div className="mx-auto mt-14 grid max-w-4xl grid-cols-3 gap-3 text-left">
            {[
              ["Console logs", "Full context"],
              ["Drive native", "Own your files"],
              ["Share ready", "One-click links"],
            ].map(([title, body]) => (
              <div key={title} className="rounded-2xl border border-white/70 bg-white/65 p-4 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
                <p className="text-sm font-bold text-slate-900">{title}</p>
                <p className="mt-1 text-xs text-slate-500">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Product Screenshots */}
        <section className="relative border-t border-white/70 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_48%,#eef2ff_100%)] bg-fixed">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.16),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.16),transparent_30%)]" />
          <div className="mx-auto max-w-6xl px-6 py-24 space-y-28 relative">

            {/* 1. Capture */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight">{t("landing.f1Title")}</h3>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed max-w-md">
                  {t("landing.f1Body")}
                </p>
              </div>
              <div className="rounded-3xl border border-white/70 bg-white/80 shadow-2xl shadow-slate-300/40 overflow-hidden backdrop-blur-xl ring-1 ring-slate-900/5 transition-transform duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5 bg-slate-50/50">
                  <span className="text-xs font-medium text-slate-600">{t("landing.editorLabel")}</span>
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                </div>
                <div className="p-4 flex gap-4">
                  <div className="flex-1 rounded-lg bg-slate-50/60 border border-slate-200 aspect-video flex items-center justify-center relative">
                    <div className="absolute inset-6 rounded-md border-2 border-dashed border-indigo-300 bg-indigo-50/40" />
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                      <svg viewBox="0 0 24 24" className="w-10 h-10 text-indigo-500/70" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                      <span className="mt-1 text-[10px] text-slate-600">1920x1080</span>
                    </div>
                  </div>
                  <div className="w-40 hidden sm:flex flex-col gap-2">
                    <div className="h-3 rounded bg-slate-50 w-3/4" />
                    <div className="h-2 rounded bg-slate-50 w-full" />
                    <div className="mt-2 h-8 rounded-md bg-indigo-600" />
                    <div className="h-8 rounded-md border border-slate-200" />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. DevTools */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="rounded-3xl border border-white/70 bg-white/80 shadow-2xl shadow-slate-300/40 overflow-hidden backdrop-blur-xl ring-1 ring-slate-900/5 transition-transform duration-300 hover:-translate-y-1">
                  <div className="flex items-center gap-4 border-b border-slate-200 px-4 py-2.5 bg-slate-50/50 text-xs font-medium text-slate-600">
                    <span className="text-indigo-600 font-semibold border-b-2 border-indigo-600 pb-0.5">{t("dt.info")}</span>
                    <span>{t("dt.console")} <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-amber-400" /></span>
                    <span>{t("dt.network")} <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-red-400" /></span>
                    <span>{t("dt.actions")}</span>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex text-xs"><span className="w-24 text-slate-600">{t("dt.timestamp")}</span><span className="text-slate-900 font-medium">July 31, 2026 at 3:15 PM</span></div>
                    <div className="flex text-xs"><span className="w-24 text-slate-600">{t("dt.os")}</span><span className="text-slate-900 font-medium">Windows</span></div>
                    <div className="flex text-xs"><span className="w-24 text-slate-600">{t("dt.browser")}</span><span className="text-slate-900 font-medium">Chrome 140</span></div>
                    <div className="flex text-xs"><span className="w-24 text-slate-600">{t("dt.windowSize")}</span><span className="text-slate-900 font-medium">1920x1080</span></div>
                    <div className="mt-3 rounded-md bg-red-50 border border-red-100 px-3 py-2 font-mono text-[11px] text-red-700">
                      POST /api/v1/auth 500 &middot; Failed to fetch
                    </div>
                    <div className="rounded-md bg-amber-50 border border-amber-100 px-3 py-2 font-mono text-[11px] text-amber-700">
                      [Vue warn] Property &quot;user&quot; was used before being defined
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight">{t("landing.f2Title")}</h3>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed max-w-md">
                  {t("landing.f2Body")}
                </p>
              </div>
            </div>

            {/* 3. Share & Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight">{t("landing.f3Title")}</h3>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed max-w-md">
                  {t("landing.f3Body")}
                </p>
              </div>
              <div className="rounded-3xl border border-white/70 bg-white/80 shadow-2xl shadow-slate-300/40 overflow-hidden backdrop-blur-xl ring-1 ring-slate-900/5 transition-transform duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5 bg-slate-50/50">
                  <span className="text-xs font-medium text-slate-600">{t("landing.recordings")}</span>
                  <div className="flex gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-200 bg-white text-slate-600">{t("landing.all")}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-indigo-200 text-indigo-600 font-medium">{t("landing.videos")}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-200 bg-white text-slate-600">{t("landing.screenshots")}</span>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[t("landing.mock1"), t("landing.mock2"), t("landing.mock3")].map((m) => (
                    <div key={m} className="rounded-lg border border-slate-200 overflow-hidden">
                      <div className="aspect-video bg-slate-50/70 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-6 h-6 text-indigo-500/60" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                      </div>
                      <div className="px-2.5 py-2">
                        <div className="text-[10px] font-medium text-slate-900 truncate">{m}</div>
                        <div className="text-[9px] text-slate-600 mt-0.5">Jul 31 &middot; 1920x1080</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Akusara Suite / Ecosystem Section */}
        <section className="border-t border-slate-200 bg-gradient-to-b from-white to-indigo-50/30 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center mb-12">
              <span className="inline-block px-3 py-1 text-[11px] font-semibold tracking-wider uppercase rounded-full bg-indigo-100 text-indigo-700 mb-3">
                {t("landing.ecosystemEyebrow")}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {t("landing.ecosystemTitle")}
              </h2>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                {t("landing.ecosystemSub")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* BugSnap Card (Active) */}
              <div className="rounded-3xl border-2 border-indigo-500/40 bg-white/90 p-6 shadow-xl shadow-indigo-100/50 backdrop-blur-xl flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl shadow-md shadow-indigo-500/30 mb-4">
                    📸
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-base font-bold text-slate-900">BugSnap</h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">This App</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {t("landing.ecosystemBugSnapDesc")}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-semibold text-indigo-600">
                  Captures &amp; DevTools
                </div>
              </div>

              {/* Aksora Card */}
              <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-200/60 backdrop-blur-xl flex flex-col justify-between hover:-translate-y-1 transition-transform">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl shadow-md shadow-blue-500/30 mb-4">
                    📋
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{t("landing.ecosystemAksoraTitle")}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {t("landing.ecosystemAksoraDesc")}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100">
                  {/* ponytail: external link defaults to # if env var is unset */}
                  <a
                    href={process.env.NEXT_PUBLIC_AKSORA_URL || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700 gap-1"
                  >
                    {t("landing.ecosystemOpen")}
                  </a>
                </div>
              </div>

              {/* SnapTest Card */}
              <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-200/60 backdrop-blur-xl flex flex-col justify-between hover:-translate-y-1 transition-transform">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl shadow-md shadow-emerald-500/30 mb-4">
                    🤖
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{t("landing.ecosystemSnapTestTitle")}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {t("landing.ecosystemSnapTestDesc")}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100">
                  {/* ponytail: external link defaults to # if env var is unset */}
                  <a
                    href={process.env.NEXT_PUBLIC_SNAPTEST_URL || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs font-semibold text-emerald-600 hover:text-emerald-700 gap-1"
                  >
                    {t("landing.ecosystemOpen")}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="border-t border-slate-200 bg-slate-50/30 py-20">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center text-slate-900 mb-12">
              {t("landing.faq")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {faqItems.map((faq, i) => (
                <div key={i} className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-900">{t(faq.q)}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{t(faq.a)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative border-t border-white/70 bg-slate-950 overflow-hidden">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[42rem] -translate-x-1/2 rounded-full bg-indigo-500/30 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="relative mx-auto max-w-6xl px-6 py-20 text-center">
            <h2 className="text-3xl sm:text-5xl font-black tracking-[-0.03em] text-white">
              {t("landing.cta2")}
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm text-slate-300 leading-relaxed">
              {t("landing.ctaHint")}
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                onClick={() => window.location.assign("/features")}
                className="inline-flex items-center gap-2.5 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-slate-950 transition-all shadow-xl shadow-white/10 hover:-translate-y-0.5 hover:bg-indigo-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {t("landing.exploreFeatures")}
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 pb-8 border-b border-slate-200">
            {/* Brand column */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon.svg" alt="" aria-hidden="true" className="w-6 h-6 object-contain" />
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold">BugSnap</span>
                  <span className="text-[11px] text-slate-600">From Click to Fix &middot; by <a href="https://akusaradigital.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-900">akusaradigital.com</a></span>
                </div>
              </div>
              <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
                {t("landing.footDesc")}
              </p>
            </div>

            {/* Links column 1 */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{t("landing.product")}</h5>
              <ul className="space-y-2 text-xs text-slate-600">
                <li><a href="/features" className="hover:text-slate-900 transition-colors">{t("landing.screenRecorder")}</a></li>
                <li><a href="/features#devtools" className="hover:text-slate-900 transition-colors">{t("landing.devTools")}</a></li>
                <li><a href="/pricing" className="hover:text-slate-900 transition-colors">{t("landing.pricing")}</a></li>
                <li><a href="/security" className="hover:text-slate-900 transition-colors">{t("landing.security")}</a></li>
              </ul>
            </div>

            {/* Links column 2 */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{t("landing.resources")}</h5>
              <ul className="space-y-2 text-xs text-slate-600">
                <li><a href="/help" className="hover:text-slate-900 transition-colors">{t("landing.docs")}</a></li>
                <li><a href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">{t("landing.chromeExt")}</a></li>
                <li><a href="/help" className="hover:text-slate-900 transition-colors">{t("landing.help")}</a></li>
                <li><a href="/status" className="hover:text-slate-900 transition-colors">{t("landing.apiStatus")}</a></li>
              </ul>
            </div>

            {/* Links column 3 */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{t("landing.company")}</h5>
              <ul className="space-y-2 text-xs text-slate-600">
                <li><a href="https://akusaradigital.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">{t("landing.about")}</a></li>
                <li><a href="/privacy" className="hover:text-slate-900 transition-colors">{t("landing.privacy")}</a></li>
                <li><a href="/terms" className="hover:text-slate-900 transition-colors">{t("landing.terms")}</a></li>
                <li><a href="/contact" className="hover:text-slate-900 transition-colors">{t("landing.contact")}</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-600">
              {t("landing.copyright", { year: new Date().getFullYear() })}
            </p>
            <p className="text-xs text-slate-600">
              {t("landing.builtOn")}
            </p>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}


