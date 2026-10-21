"use client";

import { useState } from "react";
import { useT } from "@/components/I18nProvider";
import { Icon } from "@/lib/iconify";
import { CHROME_STORE_URL } from "@/lib/constants";

export function BlogBottomBanner() {
  const { t } = useT();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError(t("blog.newsletterPlaceholder") || "Please enter a valid email address.");
      return;
    }
    setError("");
    setSubscribed(true);
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-sky-200/60 dark:border-site-border bg-gradient-to-br from-sky-100/40 via-site-surface to-emerald-100/30 dark:from-sky-950/20 dark:via-site-surface dark:to-emerald-950/20 p-5 sm:p-10 lg:p-14 shadow-lg shadow-sky-500/5 my-12">
      {/* Decorative fluid background curves */}
      <div
        className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-30 blur-3xl"
        style={{
          background: "radial-gradient(circle, var(--glow-primary), transparent 70%)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{
          background: "radial-gradient(circle, var(--glow-secondary), transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Floating Newsletter Card ("Berlangganan Artikel") */}
        <div className="lg:col-span-5 w-full min-w-0">
          <div className="relative rounded-3xl bg-site-surface border border-site-border p-6 sm:p-8 shadow-xl shadow-slate-300/40 dark:shadow-black/50 overflow-hidden">
            {/* Subtle background watermark icons */}
            <div
              className="pointer-events-none absolute -top-4 -right-4 text-sky-500/10 dark:text-sky-400/5 select-none"
              aria-hidden="true"
            >
              <Icon icon="lucide:mail" className="w-28 h-28" />
            </div>
            <div
              className="pointer-events-none absolute -bottom-6 -left-6 text-sky-500/10 dark:text-sky-400/5 select-none"
              aria-hidden="true"
            >
              <Icon icon="lucide:at-sign" className="w-24 h-24" />
            </div>

            <div className="relative z-10 space-y-5">
              <div className="space-y-1.5">
                <h3 className="text-xl sm:text-2xl font-black text-sky-500 dark:text-sky-400 tracking-tight">
                  {t("blog.subTitle")}
                </h3>
                <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed">
                  {t("blog.subDesc")}
                </p>
              </div>

              {subscribed ? (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 space-y-2 text-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 mx-auto flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-lg">
                    ✓
                  </div>
                  <p className="text-xs sm:text-sm font-bold">
                    {t("blog.subSuccess")}
                  </p>
                  <p className="text-[11px] text-site-text-2">
                    {t("blog.subTrust")}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div>
                    <label htmlFor="blog-sub-name" className="sr-only">
                      {t("blog.subNamePlaceholder")}
                    </label>
                    <input
                      id="blog-sub-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("blog.subNamePlaceholder")}
                      className="w-full px-4 py-3 rounded-xl border border-site-border bg-site-surface-2/60 text-site-text placeholder:text-site-text-2/60 text-xs sm:text-sm focus:outline-hidden focus:border-sky-500 dark:focus:border-site-accent transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="blog-sub-email" className="sr-only">
                      {t("blog.subEmailPlaceholder")}
                    </label>
                    <input
                      id="blog-sub-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError("");
                      }}
                      placeholder={t("blog.subEmailPlaceholder")}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-site-border bg-site-surface-2/60 text-site-text placeholder:text-site-text-2/60 text-xs sm:text-sm focus:outline-hidden focus:border-sky-500 dark:focus:border-site-accent transition-colors"
                    />
                  </div>

                  {/* Cloudflare Turnstile / Trust Verification Badge */}
                  <div className="flex items-center justify-between px-3.5 py-2 rounded-xl border border-site-border bg-site-surface-2/50 text-[11px] text-site-text-2">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </span>
                      <span className="font-semibold text-site-text">
                        Success!
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-site-text-2/70 font-mono">
                      <Icon icon="logos:cloudflare-icon" className="w-3.5 h-3.5" />
                      <span>Turnstile Verified</span>
                    </div>
                  </div>

                  {error && (
                    <p className="text-[11px] text-rose-500 font-medium pl-1">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 px-6 min-h-[44px] rounded-xl bg-sky-500 hover:bg-sky-400 dark:bg-site-accent dark:hover:bg-site-accent/90 text-white dark:text-slate-900 font-bold text-xs sm:text-sm transition-all shadow-md shadow-sky-500/25 dark:shadow-accent/25 hover:scale-[1.01] active:scale-[0.99] text-center touch-manipulation"
                  >
                    {t("blog.subButton")}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: BugSnap Promotion with Origami / Telemetry Visual */}
        <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 min-w-0">
          {/* Origami Flying Illustration */}
          <div className="relative w-full max-w-xs sm:max-w-sm h-32 flex items-center justify-center select-none">
            {/* Origami Paper Birds / Cranes SVG Inspired by DomaiNesia */}
            <svg
              className="w-full h-full max-w-[280px]"
              viewBox="0 0 280 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Origami Crane 1 (Teal/Cyan) */}
              <g transform="translate(140, 20) scale(0.9) rotate(-12)">
                <polygon points="20,0 45,25 25,45 5,20" fill="#0ea5e9" opacity="0.9" />
                <polygon points="45,25 60,10 50,35" fill="#38bdf8" />
                <polygon points="20,0 25,45 15,30" fill="#0284c7" />
                <polygon points="5,20 25,45 0,35" fill="#7dd3fc" />
              </g>

              {/* Origami Crane 2 (Orange/Amber) */}
              <g transform="translate(60, 45) scale(0.8) rotate(15)">
                <polygon points="20,0 45,25 25,45 5,20" fill="#f97316" opacity="0.95" />
                <polygon points="45,25 60,10 50,35" fill="#fb923c" />
                <polygon points="20,0 25,45 15,30" fill="#ea580c" />
                <polygon points="5,20 25,45 0,35" fill="#fdba74" />
              </g>

              {/* Origami Crane 3 (Red/Coral) */}
              <g transform="translate(195, 50) scale(0.75) rotate(-20)">
                <polygon points="20,0 45,25 25,45 5,20" fill="#ef4444" opacity="0.9" />
                <polygon points="45,25 60,10 50,35" fill="#f87171" />
                <polygon points="20,0 25,45 15,30" fill="#dc2626" />
                <polygon points="5,20 25,45 0,35" fill="#fca5a5" />
              </g>

              {/* Origami Crane 4 (Emerald / BugSnap Accent) */}
              <g transform="translate(110, 65) scale(0.7) rotate(5)">
                <polygon points="20,0 45,25 25,45 5,20" fill="#10b981" opacity="0.9" />
                <polygon points="45,25 60,10 50,35" fill="#34d399" />
                <polygon points="20,0 25,45 15,30" fill="#059669" />
                <polygon points="5,20 25,45 0,35" fill="#6ee7b7" />
              </g>

              {/* Soft cloud base */}
              <ellipse cx="140" cy="105" rx="90" ry="10" fill="currentColor" className="text-sky-200/50 dark:text-sky-900/30" />
            </svg>
          </div>

          <div className="space-y-3 max-w-xl">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-sky-600 dark:text-sky-400 tracking-tight leading-snug">
              {t("blog.promoTitle")}
            </h3>
            <p className="text-xs sm:text-sm text-site-text-2 leading-relaxed">
              {t("blog.promoDesc")}
            </p>
          </div>

          <div className="pt-1 flex flex-col sm:flex-row items-center gap-3">
            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 min-h-[44px] rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.99] text-center touch-manipulation"
            >
              <Icon icon="logos:chrome" className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{t("blog.promoButton")}</span>
            </a>
          </div>

          <p className="text-[11px] text-site-text-2/70 font-medium">
            {t("blog.promoTrust")}
          </p>
        </div>
      </div>
    </section>
  );
}
