"use client";

import { useState, useRef } from "react";
import { useT } from "@/components/I18nProvider";
import { Icon } from "@/lib/iconify";

export function BlogBottomBanner() {
  const { t } = useT();
  const emailInputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setError(t("blog.subEmailPlaceholder") || "Please enter a valid email address.");
      emailInputRef.current?.focus();
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          source: "blog",
          hp_field: honeypot,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        setError(data.error || "Failed to subscribe. Please try again.");
        setLoading(false);
        return;
      }

      setSubscribed(true);
    } catch {
      setError("Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-sky-100/80 dark:border-site-border bg-gradient-to-r from-sky-50/70 via-emerald-50/30 to-sky-50/70 dark:from-slate-900/60 dark:via-site-surface dark:to-slate-900/60 p-6 sm:p-10 lg:p-12 my-12 shadow-xs">
      <div className="max-w-2xl mx-auto text-center space-y-3.5 min-w-0">
        {/* Playful Floating Geometric Shapes */}
        <div className="flex items-center gap-2 justify-center mb-1" aria-hidden="true">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <div className="w-3 h-3 bg-blue-500 [clip-path:polygon(50%_0%,0%_100%,100%_100%)]" />
          <div className="w-3 h-3 bg-rose-500 rotate-12 rounded-[2px]" />
        </div>

        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200/50">
            {t("blog.stayUpdated") || "STAY UPDATED"}
          </span>
        </div>

        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t("blog.promoTitle") || "Debug Bugs Faster with BugSnap"}
        </h3>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mx-auto">
          {t("blog.promoDesc") ||
            "Get practical tutorials, real-world examples, and expert insights on bug reporting, DevTools, Playwright, and developer productivity."}
        </p>

        {subscribed ? (
          <div className="mt-5 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 space-y-1.5 text-center max-w-md mx-auto animate-in fade-in duration-200">
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 mx-auto flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-base">
              ✓
            </div>
            <p className="text-sm font-bold">
              {t("blog.subSuccess") || "Thank you! You are now subscribed."}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("blog.promoNoSpam") || "No spam. Unsubscribe anytime."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="pt-2 max-w-md mx-auto space-y-2">
            {/* Honeypot field for bot suppression */}
            <input
              type="text"
              name="hp_field"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1 min-w-0">
                <Icon
                  icon="lucide:mail"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  ref={emailInputRef}
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder={t("blog.subEmailPlaceholder") || "Enter your email"}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-site-border bg-white dark:bg-site-surface text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#68a63c] transition-colors shadow-2xs"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#68a63c] hover:bg-[#5ca338] text-white font-bold text-xs sm:text-sm shadow-xs transition-colors touch-manipulation cursor-pointer disabled:opacity-60 shrink-0"
              >
                <Icon icon="lucide:bell" className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>
                  {loading
                    ? "..."
                    : (t("blog.promoButton") || "Subscribe to Our Newsletter")}
                </span>
              </button>
            </div>

            {error && (
              <p className="text-xs text-rose-500 font-medium text-center pt-1">
                {error}
              </p>
            )}

            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 block text-center">
              {t("blog.promoNoSpam") || "No spam. Unsubscribe anytime."}
            </span>
          </form>
        )}
      </div>
    </section>
  );
}
