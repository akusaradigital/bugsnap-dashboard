"use client";

import { useState, useRef, useLayoutEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useT } from "@/components/I18nProvider";
import { SiteNavbar } from "@/components/site/SiteNavbar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Icon } from "@/lib/iconify";

const TEXTAREA_MIN_HEIGHT = 140;
const TEXTAREA_MAX_HEIGHT = 400;

/** Grows with content like a chat composer - no manual resize handle, caps out instead of scrolling forever. */
function AutoGrowTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(Math.max(el.scrollHeight, TEXTAREA_MIN_HEIGHT), TEXTAREA_MAX_HEIGHT)}px`;
  }, [props.value]);

  return (
    <textarea
      {...props}
      ref={ref}
      rows={undefined}
      style={{ resize: "none", minHeight: TEXTAREA_MIN_HEIGHT, maxHeight: TEXTAREA_MAX_HEIGHT, overflowY: "auto" }}
    />
  );
}

function detectBrowser(ua: string): string {
  if (/Edg\//.test(ua)) return "Edge";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Chrome\//.test(ua)) return "Chrome";
  if (/Safari\//.test(ua)) return "Safari";
  return "Unknown";
}

function detectOs(ua: string): string {
  if (/Windows/.test(ua)) return "Windows";
  if (/Mac OS X/.test(ua)) return "macOS";
  if (/Linux/.test(ua)) return "Linux";
  if (/Android/.test(ua)) return "Android";
  if (/iPhone|iPad/.test(ua)) return "iOS";
  return "Unknown";
}

function UninstallFeedbackForm() {
  const { t } = useT();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
      const res = await fetch("/api/uninstall-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          userEmail: email.trim(),
          extensionVersion: searchParams.get("v") || "",
          browser: detectBrowser(ua),
          os: detectOs(ua),
          locale: typeof navigator !== "undefined" ? navigator.language : "",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || t("uninstallFeedback.submitError"));
      setSubmitted(true);
    } catch (err: unknown) {
      setError((err as Error)?.message || t("uninstallFeedback.submitError"));
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
        <span className="inline-flex w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 items-center justify-center mb-5">
          <Icon icon="lucide:check" className="w-7 h-7" aria-hidden="true" />
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t("uninstallFeedback.thanksTitle")}
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-500 dark:text-slate-400">
          {t("uninstallFeedback.thanksDesc")}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white text-center">
        {t("uninstallFeedback.title")}
      </h1>
      <p className="mt-3 text-sm sm:text-base text-slate-500 dark:text-slate-400 text-center">
        {t("uninstallFeedback.subtitle")}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="uf-message" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            {t("uninstallFeedback.messageLabel")}
          </label>
          <AutoGrowTextarea
            id="uf-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={4000}
            required
            placeholder={t("uninstallFeedback.messagePlaceholder")}
            className="w-full text-sm rounded-xl border-2 border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-4 py-3 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-zinc-400"
          />
        </div>

        <div>
          <label htmlFor="uf-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            {t("uninstallFeedback.emailLabel")}
          </label>
          <input
            id="uf-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("uninstallFeedback.emailPlaceholder")}
            className="w-full text-sm rounded-xl border-2 border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-4 py-2.5 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-zinc-400"
          />
          <p className="mt-1.5 text-xs text-slate-400">
            {t("uninstallFeedback.emailHint")}
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={!message.trim() || submitting}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
        >
          {submitting
            ? t("uninstallFeedback.submitting")
            : t("uninstallFeedback.submit")}
        </button>
      </form>
    </div>
  );
}

export function UninstallFeedbackContent() {
  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-100 font-site flex flex-col bg-[#fcfdfe] dark:bg-[#0b0f17]">
      <SiteNavbar />
      <main id="main-content" className="flex-1">
        <Suspense fallback={null}>
          <UninstallFeedbackForm />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
