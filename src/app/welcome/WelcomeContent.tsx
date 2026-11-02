"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StaticShell } from "@/components/StaticShell";
import { supabase } from "@/lib/supabase";
import { useT } from "@/components/I18nProvider";

export function WelcomeContent() {
  const { t } = useT();
  const [isMac, setIsMac] = useState(false);
  const [extensionDetected, setExtensionDetected] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent));

      // Check Supabase session
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user?.email) {
          setUserEmail(data.session.user.email);
        }
      }).catch(() => {});

      // Ping extension
      const timer = setTimeout(() => {
        window.postMessage({ source: "bugsnap-web", action: "ping" }, window.location.origin);
      }, 500);

      const handleMsg = (e: MessageEvent) => {
        if (e.source !== window) return;
        if (e.data?.source === "bugsnap-extension") {
          setExtensionDetected(true);
        }
      };

      window.addEventListener("message", handleMsg);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("message", handleMsg);
      };
    }
  }, []);

  const modKey = isMac ? "⌘" : "Ctrl";

  const triggerTestCapture = () => {
    window.postMessage(
      {
        source: "bugsnap-web",
        action: "trigger_capture",
        mode: "area",
      },
      window.location.origin
    );
  };

  return (
    <StaticShell
      title={t("welcome.title")}
      breadcrumb={t("welcome.breadcrumb")}
      subtitle={t("welcome.subtitle")}
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 pb-20">
        {/* Status Banner */}
        <div className="mb-10 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-site-text">
                {extensionDetected ? t("welcome.connected") : t("welcome.installed")}
              </p>
              <p className="text-xs text-site-text-2 break-all">
                {userEmail
                  ? t("welcome.loggedInAs", { email: userEmail })
                  : t("welcome.connectPrompt")}
              </p>
            </div>
          </div>
          {!userEmail && (
            <Link
              href="/login"
              className="shrink-0 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors"
            >
              {t("welcome.connectBtn")}
            </Link>
          )}
        </div>

        {/* 3 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Step 1 */}
          <div className="relative rounded-2xl border border-site-border bg-site-surface-2/60 p-4 sm:p-6 flex flex-col justify-between hover:border-site-border-hover transition-colors">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 font-bold text-sm">
                  1
                </span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-site-border text-site-text-2">
                  {t("welcome.step1Badge")}
                </span>
              </div>
              <h3 className="text-lg font-bold text-site-text mb-2">{t("welcome.step1Title")}</h3>
              <p className="text-sm text-site-text-2 leading-relaxed mb-4">
                {t("welcome.step1Pre")} <strong className="text-site-text">{t("welcome.step1Puzzle")}</strong> {t("welcome.step1Mid")} <strong className="text-site-text">{t("welcome.step1Pin")}</strong> {t("welcome.step1Post")}
              </p>
            </div>
            <div className="rounded-xl border border-site-border/60 bg-site-surface p-3 text-center">
              <span className="text-xs text-site-text-2">{t("welcome.step1Hint")}</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative rounded-2xl border border-site-border bg-site-surface-2/60 p-4 sm:p-6 flex flex-col justify-between hover:border-site-border-hover transition-colors">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 font-bold text-sm">
                  2
                </span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-site-border text-site-text-2">
                  {t("welcome.step2Badge")}
                </span>
              </div>
              <h3 className="text-lg font-bold text-site-text mb-2">{t("welcome.step2Title")}</h3>
              <p className="text-sm text-site-text-2 leading-relaxed mb-4">
                {t("welcome.step2Desc")}
              </p>
            </div>
            <div className="rounded-xl border border-site-border/60 bg-site-surface p-3 text-center">
              <span className="text-xs text-site-text-2">{t("welcome.step2Hint")}</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative rounded-2xl border border-site-border bg-site-surface-2/60 p-4 sm:p-6 flex flex-col justify-between hover:border-site-border-hover transition-colors">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 font-bold text-sm">
                  3
                </span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-site-border text-site-text-2">
                  {t("welcome.step3Badge")}
                </span>
              </div>
              <h3 className="text-lg font-bold text-site-text mb-2">{t("welcome.step3Title")}</h3>
              <p className="text-sm text-site-text-2 leading-relaxed mb-4">
                {t("welcome.step3Desc")}
              </p>
            </div>
            <div className="space-y-1.5 rounded-xl border border-site-border/60 bg-site-surface p-3 text-xs font-mono">
              <div className="flex justify-between text-site-text-2">
                <span>{t("welcome.areaSnap")}</span>
                <span className="text-emerald-400 font-bold">{modKey}+Shift+S</span>
              </div>
              <div className="flex justify-between text-site-text-2">
                <span>{t("welcome.recordVideo")}</span>
                <span className="text-emerald-400 font-bold">{modKey}+Shift+F</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="rounded-2xl border border-site-border bg-site-surface-2 p-4 sm:p-8 text-center">
          <h3 className="text-xl font-bold text-site-text mb-2">{t("welcome.readyTitle")}</h3>
          <p className="text-sm text-site-text-2 max-w-lg mx-auto mb-6">
            {t("welcome.readyDesc")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={triggerTestCapture}
              className="px-6 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              {t("welcome.testCapture", { key: modKey })}
            </button>
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-xl border border-site-border bg-site-surface text-site-text font-semibold text-sm hover:bg-site-surface-2 transition-colors"
            >
              {t("welcome.goDashboard")}
            </Link>
          </div>
        </div>
      </div>
    </StaticShell>
  );
}
