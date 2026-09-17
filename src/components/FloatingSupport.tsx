"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useT } from "@/components/I18nProvider";
import { validateEmail } from "@/lib/email-validator";

type SupportCategory = "bug" | "feature" | "other";

const TURNSTILE_SITEKEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY || "0x4AAAAAAEKHTA3AvZpK27ig";

interface TurnstileApi {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
  execute?: (id?: string) => void;
}

function getTurnstile(): TurnstileApi | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { turnstile?: TurnstileApi }).turnstile;
}

export default function FloatingSupport() {
  const { t, locale, setLocale } = useT();
  const [isOpen, setIsOpen] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Proactive prompt after 5 seconds
  useEffect(() => {
    try {
      if (sessionStorage.getItem("cs_prompt_dismissed") === "1") return;
    } catch {
      // sessionStorage unavailable
    }
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const dismissPrompt = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowPrompt(false);
    try {
      sessionStorage.setItem("cs_prompt_dismissed", "1");
    } catch {
      // sessionStorage unavailable
    }
  }, []);

  const [category, setCategory] = useState<SupportCategory>("bug");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mailtoBackup, setMailtoBackup] = useState<string | null>(null);

  // Cloudflare Turnstile state
  const [cfToken, setCfToken] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Mount Invisible Cloudflare Turnstile
  useEffect(() => {
    if (!turnstileRef.current) return;
    let cancelled = false;

    const renderWidget = () => {
      const ts = getTurnstile();
      if (cancelled || !ts || !turnstileRef.current || widgetIdRef.current) return;
      try {
        widgetIdRef.current = ts.render(turnstileRef.current, {
          sitekey: TURNSTILE_SITEKEY,
          theme: "light",
          callback: (token: string) => {
            setCfToken(token);
          },
          "expired-callback": () => {
            setCfToken(null);
          },
          "error-callback": () => {
            setCfToken(null);
          },
        });
      } catch (err) {
        console.warn("[Turnstile] Render error:", err);
      }
    };

    if (getTurnstile()) {
      renderWidget();
    } else {
      const existing = document.querySelector('script[src*="turnstile/v0/api.js"]');
      if (existing) {
        existing.addEventListener("load", renderWidget);
      } else {
        const s = document.createElement("script");
        s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        s.async = true;
        s.defer = true;
        s.onload = renderWidget;
        document.head.appendChild(s);
      }
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = [
    {
      id: "bug" as const,
      label: t("support.catBug"),
      icon: "🐛",
      desc: t("support.descBug"),
      placeholder: t("support.placeholderBug"),
      subjectPlaceholder: t("support.subjectPlaceholderBug"),
    },
    {
      id: "feature" as const,
      label: t("support.catFeature"),
      icon: "💡",
      desc: t("support.descFeature"),
      placeholder: t("support.placeholderFeature"),
      subjectPlaceholder: t("support.subjectPlaceholderFeature"),
    },
    {
      id: "other" as const,
      label: t("support.catOther"),
      icon: "💬",
      desc: t("support.descOther"),
      placeholder: t("support.placeholderOther"),
      subjectPlaceholder: t("support.subjectPlaceholderOther"),
    },
  ];

  const activeCategoryMeta = categories.find((c) => c.id === category) || categories[0];

  const ensureTurnstileToken = useCallback(async (): Promise<string | null> => {
    if (cfToken) return cfToken;
    const ts = getTurnstile();
    if (!ts || !widgetIdRef.current) return null;

    try {
      if (ts.execute) ts.execute(widgetIdRef.current);
    } catch {
      // ignore
    }

    // Wait up to 2 seconds for token
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 100));
      if (cfToken) return cfToken;
    }
    return null;
  }, [cfToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Strict Email Validation
    const emailResult = validateEmail(email);
    if (!emailResult.valid) {
      if (emailResult.error === "REQUIRED") {
        setErrorMessage(t("support.emailRequired"));
      } else if (emailResult.error === "DISPOSABLE") {
        setErrorMessage(t("support.emailDisposable"));
      } else {
        setErrorMessage(t("support.emailInvalid"));
      }
      return;
    }

    // 2. Message Validation
    if (!message.trim()) {
      setErrorMessage(t("support.validationError"));
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;

      // Get Turnstile token for anonymous submissions
      let activeTurnstileToken = cfToken;
      if (!authData.session?.user && !activeTurnstileToken) {
        activeTurnstileToken = await ensureTurnstileToken();
      }

      const res = await fetch("/api/support/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          category,
          subject: subject.trim() || `${activeCategoryMeta.label} - ${new Date().toLocaleDateString()}`,
          message: message.trim(),
          userEmail: email.trim(),
          hp_website: honeypot.trim(),
          turnstileToken: activeTurnstileToken,
          pageUrl: typeof window !== "undefined" ? window.location.href : "",
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.code === "TURNSTILE_FAILED" || data.code === "TURNSTILE_REQUIRED") {
          const ts = getTurnstile();
          if (widgetIdRef.current && ts) {
            try {
              ts.reset(widgetIdRef.current);
            } catch {
              /* ignore */
            }
          }
          setCfToken(null);
          throw new Error(t("support.botBlocked"));
        }
        throw new Error(data.error || "Failed to send report.");
      }

      setMailtoBackup(data.mailtoLink || null);
      setSuccess(true);
    } catch (err: unknown) {
      console.warn("Support report error:", err);
      setErrorMessage((err as Error)?.message || "Failed to send report.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSuccess(false);
    setSubject("");
    setMessage("");
    setErrorMessage(null);
    const ts = getTurnstile();
    if (widgetIdRef.current && ts) {
      try {
        ts.reset(widgetIdRef.current);
      } catch {
        /* ignore */
      }
    }
    setCfToken(null);
  };

  return (
    <div ref={containerRef} className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50 select-none">
      {/* Invisible Cloudflare Turnstile Container */}
      <div
        ref={turnstileRef}
        style={{ position: "absolute", left: "-9999px", top: "-9999px", width: "1px", height: "1px", opacity: 0, pointerEvents: "none" }}
        aria-hidden="true"
      />

      {/* Support Pop-up Modal Card */}
      {isOpen && (
        <div className="absolute bottom-14 sm:bottom-16 right-0 w-[calc(100vw-2rem)] sm:w-[390px] max-w-[390px] max-h-[85vh] flex flex-col rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden transition-all duration-200">
          {/* Header - Brand Green Accent */}
          <div className="flex items-center justify-between border-b border-[#6B9A35] dark:border-zinc-800 bg-[#89BD49] dark:bg-zinc-900 px-5 py-4 text-white">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6B9A35]/60 dark:bg-zinc-800 text-white">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </span>
              <div>
                <h3 className="text-sm font-bold leading-tight text-white">{t("support.title")}</h3>
                <p className="text-[11px] text-white/80 dark:text-zinc-400 leading-tight">
                  {t("support.subtitle")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setLocale(locale === "id" ? "en" : "id")}
                className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-white/10 hover:bg-white/20 text-white transition-colors"
                title={locale === "id" ? "Ganti ke English" : "Switch to Bahasa Indonesia"}
              >
                {locale === "id" ? "ID" : "EN"}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/10 dark:hover:bg-zinc-800 transition-colors"
                aria-label={t("support.close")}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 text-slate-800 dark:text-zinc-200">
            {success ? (
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 text-2xl">
                  ✓
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-950 dark:text-white">
                    {t("support.successTitle")}
                  </h4>
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-zinc-400 max-w-xs leading-relaxed">
                    {t("support.successDesc", { email: "contact.akusaraproject@gmail.com" })}
                  </p>
                </div>

                <div className="flex flex-col gap-2 w-full pt-2">
                  {mailtoBackup && (
                    <a
                      href={mailtoBackup}
                      className="w-full text-center text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300 font-medium transition-colors"
                    >
                      {t("support.openClient")}
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full rounded-lg bg-[#89BD49] hover:bg-[#6B9A35] text-white text-xs font-semibold py-2.5 transition-colors shadow-sm"
                  >
                    {t("support.sendAnother")}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Anti-spam Honeypot (hidden from human users, traps automated scrapers) */}
                <div className="absolute -left-[9999px] top-0 opacity-0 pointer-events-none" aria-hidden="true">
                  <input
                    type="text"
                    name="hp_website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                {/* Category Pills */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                    {t("support.category")}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-zinc-900">
                    {categories.map((cat) => {
                      const isActive = category === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategory(cat.id)}
                          className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                            isActive
                              ? "bg-white dark:bg-zinc-800 text-[#6B9A35] dark:text-[#A8D666] shadow-xs"
                              : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          <span>{cat.icon}</span>
                          <span className="truncate">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400 italic leading-snug">
                    {activeCategoryMeta.desc}
                  </p>
                </div>

                {/* Email Field with Strict Validation */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                    {t("support.emailLabel")}{" "}
                    <span className="font-normal lowercase text-slate-500 dark:text-zinc-400">{t("support.emailHint")}</span>{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="nama@perusahaan.com"
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-[#89BD49] transition-colors"
                  />
                </div>

                {/* Subject Field */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                    {t("support.subjectLabel")}
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={activeCategoryMeta.subjectPlaceholder}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-[#89BD49] transition-colors"
                  />
                </div>

                {/* Message Field */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                    {t("support.messageLabel")} <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder={activeCategoryMeta.placeholder}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-[#89BD49] transition-colors resize-none leading-relaxed"
                  />
                </div>

                {errorMessage && (
                  <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 p-2.5 text-xs text-rose-600 dark:text-rose-400 leading-snug border border-rose-200 dark:border-rose-900">
                    {errorMessage}
                  </div>
                )}

                {/* Submit Button - Brand Green */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={submitting || !email.trim() || !message.trim()}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#89BD49] hover:bg-[#6B9A35] disabled:opacity-50 text-white text-xs font-bold py-2.5 transition-colors shadow-sm"
                  >
                    {submitting ? (
                      <>
                        <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>{t("support.sending")}</span>
                      </>
                    ) : (
                      <span>{t("support.sendBtn")}</span>
                    )}
                  </button>
                </div>

                {/* Direct mailto fallback link */}
                <div className="pt-2 text-center border-t border-slate-100 dark:border-zinc-800 text-[11px] text-slate-600 dark:text-zinc-400">
                  {t("support.urgent")}{" "}
                  <a
                    href={`mailto:support@bugsnap.akusaraproject.my.id?subject=[BugSnap%20Support]&body=${encodeURIComponent(message || "")}`}
                    className="text-[#6B9A35] dark:text-[#A8D666] hover:underline font-medium"
                  >
                    support@bugsnap.akusaraproject.my.id
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Proactive Speech Bubble Prompt */}
      {showPrompt && !isOpen && (
        <div
          onClick={() => {
            setIsOpen(true);
            dismissPrompt();
          }}
          className="absolute bottom-13 sm:bottom-14 right-0 mb-1 flex items-center gap-2.5 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 sm:px-4 py-2 sm:py-2.5 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300 text-xs font-semibold text-slate-800 dark:text-zinc-100 cursor-pointer hover:border-[#89BD49] dark:hover:border-[#89BD49] transition-all group max-w-[calc(100vw-2.5rem)] sm:max-w-xs z-50"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#89BD49]/15 text-[#6B9A35] dark:text-[#A8D666] text-sm">
            👋
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold leading-tight group-hover:text-[#6B9A35] dark:group-hover:text-[#A8D666] transition-colors">
              {t("support.helpPrompt")}
            </p>
          </div>
          <button
            type="button"
            onClick={dismissPrompt}
            className="text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 p-1 rounded-md transition-colors"
            title={t("support.close")}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Floating Trigger Button - Sleek rectangular badge (no pills) */}
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          if (showPrompt) dismissPrompt();
        }}
        className={`relative flex items-center gap-2 px-3.5 sm:px-4 h-11 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 border border-white/20 ${
          isOpen
            ? "bg-slate-900 dark:bg-zinc-800 text-white"
            : "bg-[#89BD49] hover:bg-[#6B9A35] text-white shadow-[#89BD49]/25"
        }`}
        title={isOpen ? t("support.close") : t("support.btn")}
        aria-label={t("support.btn")}
      >
        {isOpen ? (
          <span className="text-sm font-bold">✕</span>
        ) : (
          <>
            {/* Live Online Pulse Indicator */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="hidden sm:inline text-xs font-bold tracking-tight">
              {t("support.btn")}
            </span>
          </>
        )}
      </button>
    </div>
  );
}
