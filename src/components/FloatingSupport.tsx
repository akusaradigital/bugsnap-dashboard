"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Icon, withAssetVersion } from "@/lib/iconify";
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
  const { t } = useT();
  const [isOpen, setIsOpen] = useState(false);
  const [supportView, setSupportView] = useState<"welcome" | "form">("welcome");
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

  // Auto-fill user email from active session if available
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uEmail = data.session?.user?.email;
      if (uEmail) {
        setEmail((prev) => prev || uEmail);
      }
    });
  }, []);

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

  // Listen for programmatic open requests from HelpMenu or other buttons
  useEffect(() => {
    const handleOpen = (e: Event) => {
      const custom = e as CustomEvent<{ category?: SupportCategory }>;
      if (custom.detail?.category) {
        setCategory(custom.detail.category);
      }
      setIsOpen(true);
      setSupportView("form");
      setShowPrompt(false);
    };
    window.addEventListener("open-support-modal", handleOpen);
    return () => window.removeEventListener("open-support-modal", handleOpen);
  }, []);

  // Mount Invisible Cloudflare Turnstile only when support drawer is opened
  useEffect(() => {
    if (!isOpen || !turnstileRef.current) return;
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
  }, [isOpen]);

  const categories = [
    {
      id: "bug" as const,
      label: t("support.catBug"),
      icon: "lucide:bug",
      desc: t("support.descBug"),
      placeholder: t("support.placeholderBug"),
      subjectPlaceholder: t("support.subjectPlaceholderBug"),
    },
    {
      id: "feature" as const,
      label: t("support.catFeature"),
      icon: "lucide:lightbulb",
      desc: t("support.descFeature"),
      placeholder: t("support.placeholderFeature"),
      subjectPlaceholder: t("support.subjectPlaceholderFeature"),
    },
    {
      id: "other" as const,
      label: t("support.catOther"),
      icon: "lucide:message-square",
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
    <div ref={containerRef} data-support-widget="true" className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50 select-none">
      {/* Invisible Cloudflare Turnstile Container */}
      <div
        ref={turnstileRef}
        style={{ position: "absolute", left: "-9999px", top: "-9999px", width: "1px", height: "1px", opacity: 0, pointerEvents: "none" }}
        aria-hidden="true"
      />

      {/* Support Pop-up Modal Card */}
      {isOpen && (
        <div className="absolute bottom-[calc(100%+0.75rem)] right-0 w-[min(390px,calc(100vw-2rem))] min-w-0 max-h-[min(650px,calc(100vh-5rem))] flex flex-col overflow-hidden shadow-2xl transition-all duration-200 rounded-2xl border border-slate-200/90 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          {/* Header for Form View */}
          {supportView === "form" && (
            <div className="relative flex items-center justify-between border-b border-slate-200/80 bg-white px-4 py-3.5 dark:border-zinc-800 dark:bg-zinc-950 shrink-0">
              <div className="flex min-w-0 items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setSupportView("welcome")}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors"
                  title={t("support.back")}
                  aria-label={t("support.back")}
                >
                  <Icon icon="lucide:arrow-left" className="h-4 w-4" />
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-bold leading-tight text-slate-950 dark:text-white">
                      {t("support.title")}
                    </h3>
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#89BD49]" aria-label={t("support.onlineLabel")} />
                  </div>
                  <p className="truncate text-[11px] leading-tight text-slate-500 dark:text-zinc-400">
                    {t("support.subtitle")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors"
                aria-label={t("support.close")}
              >
                <Icon icon="lucide:x" className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Welcome Screen Top Hero Banner */}
          {supportView === "welcome" && (
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-50/90 via-sky-50 to-blue-100/40 dark:from-blue-950/40 dark:via-zinc-900 dark:to-zinc-900 border-b border-blue-100/70 dark:border-zinc-800/80 px-4 pt-3.5 pb-4 shrink-0">
              {/* Decorative background: dot grid + wave shape clipped to header */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
                <div
                  className="absolute inset-y-0 left-1/4 w-32 opacity-25 dark:opacity-10"
                  style={{
                    backgroundImage: "radial-gradient(circle, #2563EB 1px, transparent 1px)",
                    backgroundSize: "10px 10px",
                  }}
                />
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 400 120"
                  preserveAspectRatio="none"
                  fill="none"
                >
                  <path d="M220 0 C 280 40, 260 90, 320 120 L400 120 L400 0 Z" fill="#93C5FD" fillOpacity="0.4" />
                  <path d="M270 0 C 330 35, 310 95, 360 120 L400 120 L400 0 Z" fill="#60A5FA" fillOpacity="0.3" />
                  <path d="M320 0 C 360 30, 350 100, 390 120 L400 120 L400 0 Z" fill="#3B82F6" fillOpacity="0.25" />
                </svg>
              </div>

              {/* Top bar with Status & Close button */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur-xs border border-blue-200/50 dark:border-zinc-700/60 shadow-2xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#89BD49] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#89BD49]" />
                  </span>
                  <span className="text-[11px] font-bold text-slate-800 dark:text-zinc-200 tracking-tight">
                    BugSnap Support • {t("support.onlineLabel")}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 dark:bg-zinc-800/80 hover:bg-white dark:hover:bg-zinc-700 text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white border border-slate-200/60 dark:border-zinc-700/60 transition-colors shadow-2xs"
                  aria-label={t("support.close")}
                >
                  <Icon icon="lucide:x" className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Hero presentation with 3D illustration */}
              <div className="relative z-10 flex items-center gap-3.5 mt-3.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={withAssetVersion("/illustrations/support-headset.png")}
                  alt="Customer Support"
                  className="w-16 h-16 sm:w-18 sm:h-18 object-contain shrink-0 drop-shadow-sm select-none"
                />
                <div className="min-w-0">
                  <h4 className="text-base sm:text-lg font-bold tracking-tight text-slate-950 dark:text-white">
                    {t("support.welcomeTitle")}
                  </h4>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-zinc-400 leading-snug">
                    {t("support.welcomeDesc")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Body Content */}
          <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 text-slate-800 dark:text-zinc-200 sm:px-5 sm:py-5">
            {supportView === "welcome" ? (
              <div className="flex flex-col gap-3.5">
                {/* Online Card Banner */}
                <div className="rounded-xl border border-blue-100 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/60 via-white to-sky-50/30 dark:from-zinc-900 dark:to-zinc-900/60 p-3.5 shadow-2xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Icon icon="lucide:zap" className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white">{t("support.onlineTitle")}</h5>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                        {t("support.onlineDesc")}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCategory("bug");
                      setSupportView("form");
                    }}
                    className="mt-3 w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs shadow-[#2563EB]/20 transition-all"
                  >
                    <span>{t("support.startConversation")}</span>
                    <Icon icon="lucide:arrow-right" className="h-3.5 w-3.5 brightness-0 invert" />
                  </button>
                </div>

                {/* Quick Topic Shortcuts */}
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 px-0.5">
                    {t("support.topics")}
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setCategory(cat.id);
                          setSupportView("form");
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800/80 bg-slate-50/60 dark:bg-zinc-900/40 hover:bg-white dark:hover:bg-zinc-900 hover:border-blue-200 dark:hover:border-blue-800/60 hover:shadow-xs transition-all group text-left"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60 text-[#2563EB] dark:text-[#3B82F6] shadow-2xs group-hover:scale-105 transition-transform">
                            <Icon icon={cat.icon} className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-800 dark:text-zinc-200 group-hover:text-[#2563EB] dark:group-hover:text-[#3B82F6] transition-colors truncate">
                              {cat.label}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                              {cat.desc}
                            </div>
                          </div>
                        </div>
                        <Icon icon="lucide:chevron-right" className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Direct email link */}
                <div className="pt-1.5 text-center border-t border-slate-100 dark:border-zinc-800/80">
                  <a
                    href="mailto:support@akusaradigital.com"
                    className="text-[11px] text-slate-500 dark:text-zinc-400 hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-colors"
                  >
                    Direct: <span className="font-semibold underline">support@akusaradigital.com</span>
                  </a>
                </div>
              </div>
            ) : success ? (
              <div className="flex flex-col items-center justify-center py-5 text-center space-y-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={withAssetVersion("/illustrations/contact-email.png")}
                  alt="Email Sent"
                  className="w-20 h-auto object-contain drop-shadow-sm select-none"
                />
                <div>
                  <h4 className="text-base font-bold text-slate-950 dark:text-white">
                    {t("support.successTitle")}
                  </h4>
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-zinc-400 max-w-xs leading-relaxed">
                    {t("support.successDesc", { email: "contact.akusaraproject@gmail.com" })}
                  </p>
                </div>

                <div className="flex flex-col gap-2 w-full pt-1">
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
                    className="w-full rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold py-2.5 transition-colors shadow-xs shadow-[#2563EB]/25"
                  >
                    {t("support.sendAnother")}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="min-w-0 space-y-3.5">
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
                          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                            isActive
                              ? "bg-white dark:bg-zinc-800 text-[#2563EB] dark:text-[#3B82F6] shadow-xs"
                              : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          <Icon
                            icon={cat.icon}
                            className="w-3.5 h-3.5 shrink-0 text-[#2563EB] dark:text-[#3B82F6]"
                            aria-hidden="true"
                          />
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
                    placeholder={t("support.emailPlaceholder")}
                    className="block w-full min-w-0 max-w-full text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/60 px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-colors"
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
                    className="block w-full min-w-0 max-w-full text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/60 px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-colors"
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
                    className="block w-full min-w-0 max-w-full text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/60 px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-colors resize-none leading-relaxed"
                  />
                </div>

                {errorMessage && (
                  <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 p-2.5 text-xs text-rose-600 dark:text-rose-400 leading-snug border border-rose-200 dark:border-rose-900">
                    {errorMessage}
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={submitting || !email.trim() || !message.trim()}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-xs font-bold py-2.5 transition-all shadow-sm shadow-[#2563EB]/25"
                  >
                    {submitting ? (
                      <>
                        <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>{t("support.sending")}</span>
                      </>
                    ) : (
                      <>
                        <span>{t("support.sendBtn")}</span>
                        <Icon icon="lucide:arrow-right" className="h-3.5 w-3.5 brightness-0 invert" />
                      </>
                    )}
                  </button>
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
          className="absolute bottom-[calc(100%+0.85rem)] right-0 flex items-center gap-3 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 pl-3 shadow-xl hover:shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300 text-xs font-semibold text-slate-800 dark:text-zinc-100 cursor-pointer hover:border-[#2563EB]/60 dark:hover:border-[#2563EB]/60 transition-all group w-[min(300px,calc(100vw-2rem))] z-50 after:content-[''] after:absolute after:-bottom-1.5 after:right-6 after:w-3 after:h-3 after:bg-white dark:after:bg-zinc-900 after:rotate-45 after:border-b after:border-r after:border-slate-200/90 dark:after:border-zinc-800"
        >
          <div className="relative shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/80 dark:to-zinc-800 border border-blue-200/60 dark:border-blue-900/50 shadow-2xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={withAssetVersion("/illustrations/support-headset.png")}
              alt=""
              className="w-8 h-8 object-contain drop-shadow-xs select-none"
            />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#89BD49] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#89BD49] ring-2 ring-white dark:ring-zinc-900" />
            </span>
          </div>
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[11px] font-bold text-slate-900 dark:text-white tracking-tight">
                BugSnap Support
              </span>
            </div>
            <p className="text-[12px] font-medium leading-snug text-slate-600 dark:text-zinc-300 group-hover:text-[#2563EB] dark:group-hover:text-[#3B82F6] transition-colors line-clamp-2">
              {t("support.helpPrompt")}
            </p>
          </div>
          <button
            type="button"
            onClick={dismissPrompt}
            className="self-start text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-200 p-1 -mr-0.5 -mt-0.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            title={t("support.close")}
            aria-label={t("support.close")}
          >
            <Icon icon="lucide:x" className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating trigger: compact when closed, circular white close button when open. */}
      <button
        type="button"
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
          } else {
            setSupportView("welcome");
            setIsOpen(true);
          }
          if (showPrompt) dismissPrompt();
        }}
        className={`relative flex items-center justify-center transition-all duration-200 ${
          isOpen
            ? "w-12 h-12 rounded-full p-0 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 border border-slate-200/90 dark:border-zinc-800 shadow-xl hover:bg-slate-50 dark:hover:bg-zinc-800"
            : "gap-2.5 pl-2.5 pr-4 h-12 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-lg shadow-[#2563EB]/30 hover:shadow-[#2563EB]/45 hover:-translate-y-0.5 border border-white/20 active:translate-y-0"
        }`}
        title={isOpen ? t("support.close") : t("support.btn")}
        aria-label={t("support.btn")}
      >
        {isOpen ? (
          <Icon icon="lucide:x" className="h-5 w-5" />
        ) : (
          <>
            <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/95 dark:bg-zinc-900 p-0.5 shadow-xs" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={withAssetVersion("/illustrations/support-headset.png")}
                alt=""
                className="w-5.5 h-5.5 object-contain select-none"
              />
              <span className="absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-full bg-[#89BD49] ring-2 ring-white dark:ring-zinc-900" />
            </span>
            <span className="hidden sm:inline text-sm font-bold tracking-tight">
              {t("support.btn")}
            </span>
          </>
        )}
      </button>
    </div>
  );
}
