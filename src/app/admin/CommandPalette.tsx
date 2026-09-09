"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/I18nProvider";

interface CommandItem {
  id: string;
  category: "nav" | "action";
  title: string;
  subtitle?: string;
  icon: string;
  keywords?: string[];
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onLockConsole: () => void;
  onToggleLocale: () => void;
  onRefreshNotifs: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onLockConsole,
  onToggleLocale,
  onRefreshNotifs,
}: CommandPaletteProps) {
  const router = useRouter();
  const { t, locale } = useT();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const items: CommandItem[] = useMemo(() => [
    // Navigation Items
    {
      id: "nav-overview",
      category: "nav",
      title: t("nav.dashboard"),
      subtitle: "/admin",
      icon: "📊",
      keywords: ["overview", "stats", "metrics", "ringkasan", "pulse"],
      action: () => router.push("/admin"),
    },
    {
      id: "nav-users",
      category: "nav",
      title: t("admin.manageUsers"),
      subtitle: "/admin/users",
      icon: "👥",
      keywords: ["users", "pengguna", "accounts", "pelanggan", "members"],
      action: () => router.push("/admin/users"),
    },
    {
      id: "nav-workspaces",
      category: "nav",
      title: t("admin.navWorkspaces"),
      subtitle: "/admin/workspaces",
      icon: "🏢",
      keywords: ["workspaces", "teams", "organisasi", "ruang kerja"],
      action: () => router.push("/admin/workspaces"),
    },
    {
      id: "nav-captures",
      category: "nav",
      title: t("admin.navCaptures"),
      subtitle: "/admin/captures",
      icon: "📸",
      keywords: ["captures", "tangkapan", "videos", "screenshots", "media"],
      action: () => router.push("/admin/captures"),
    },
    {
      id: "nav-revenue",
      category: "nav",
      title: t("admin.navRevenue"),
      subtitle: "/admin/revenue",
      icon: "💰",
      keywords: ["revenue", "sales", "mrr", "pendapatan", "stripe", "subscribers", "leads"],
      action: () => router.push("/admin/revenue"),
    },
    {
      id: "nav-ai",
      category: "nav",
      title: t("admin.navAiAnalytics"),
      subtitle: "/admin/ai-analytics",
      icon: "🤖",
      keywords: ["ai", "tokens", "analytics", "claude", "gpt", "biaya"],
      action: () => router.push("/admin/ai-analytics"),
    },
    {
      id: "nav-support",
      category: "nav",
      title: t("admin.supportInbox"),
      subtitle: "/admin/support",
      icon: "📥",
      keywords: ["support", "tickets", "bantuan", "inbox", "cs", "issues"],
      action: () => router.push("/admin/support"),
    },
    {
      id: "nav-extension",
      category: "nav",
      title: t("admin.extensionFleet"),
      subtitle: "/admin/extension",
      icon: "🧩",
      keywords: ["extension", "chrome", "fleet", "versions", "versi", "heartbeat"],
      action: () => router.push("/admin/extension"),
    },
    {
      id: "nav-email",
      category: "nav",
      title: t("admin.emailHealth"),
      subtitle: "/admin/email-health",
      icon: "✉️",
      keywords: ["email", "resend", "health", "surat", "deliverability"],
      action: () => router.push("/admin/email-health"),
    },
    {
      id: "nav-security",
      category: "nav",
      title: t("admin.auditTitle"),
      subtitle: "/admin/security-audit",
      icon: "🛡️",
      keywords: ["security", "audit", "logs", "keamanan", "access"],
      action: () => router.push("/admin/security-audit"),
    },
    {
      id: "nav-system",
      category: "nav",
      title: t("admin.systemDrive"),
      subtitle: "/admin/system",
      icon: "🛠️",
      keywords: ["system", "drive", "google", "sistem", "database", "supabase", "health"],
      action: () => router.push("/admin/system"),
    },

    // Quick Actions
    {
      id: "action-lang",
      category: "action",
      title: locale === "id" ? "Switch to English" : "Ganti ke Bahasa Indonesia",
      subtitle: `Current: ${locale.toUpperCase()}`,
      icon: "🌐",
      keywords: ["language", "bahasa", "locale", "translate"],
      action: onToggleLocale,
    },
    {
      id: "action-refresh",
      category: "action",
      title: "Refresh Notifications & Alerts",
      subtitle: "Fetch latest alerts",
      icon: "🔔",
      keywords: ["refresh", "reload", "notif", "alert", "segarkan"],
      action: onRefreshNotifs,
    },
    {
      id: "action-user-dashboard",
      category: "action",
      title: t("admin.toUserDashboard"),
      subtitle: "/dashboard",
      icon: "👤",
      keywords: ["user", "dashboard", "kembali", "app"],
      action: () => router.push("/dashboard"),
    },
    {
      id: "action-lock",
      category: "action",
      title: t("admin.lockConsole"),
      subtitle: "Sign out & lock session",
      icon: "🔒",
      keywords: ["lock", "logout", "keluar", "kunci", "exit"],
      action: onLockConsole,
    },
  ], [router, t, locale, onToggleLocale, onRefreshNotifs, onLockConsole]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase().trim();
    return items.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSubtitle = item.subtitle?.toLowerCase().includes(q);
      const matchKeywords = item.keywords?.some((k) => k.toLowerCase().includes(q));
      return matchTitle || matchSubtitle || matchKeywords;
    });
  }, [items, query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keep selected index in bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + (filteredItems.length || 1)) % (filteredItems.length || 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = filteredItems[selectedIndex];
        if (selected) {
          selected.action();
          onClose();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-24 px-3 sm:px-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3 border-b border-slate-100 dark:border-zinc-800">
          <span className="text-base text-slate-400 dark:text-zinc-500 mr-2.5">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("admin.commandPalettePlaceholder")}
            className="w-full text-xs sm:text-sm bg-transparent outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500"
          />
          <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-bold text-slate-400 dark:text-zinc-500 bg-slate-100 dark:bg-zinc-800 rounded border border-slate-200 dark:border-zinc-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="max-h-[55vh] sm:max-h-80 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-zinc-800/60">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500">
              {t("admin.commandNoResults")}
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredItems.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      item.action();
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                      isSelected
                        ? "bg-[#1f3bb3]/10 dark:bg-indigo-950/60 text-[#1f3bb3] dark:text-indigo-400 font-semibold"
                        : "text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-850"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-base shrink-0">{item.icon}</span>
                      <div className="min-w-0">
                        <span className="truncate block font-medium">{item.title}</span>
                        {item.subtitle && (
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal">
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500 shrink-0 ml-2">
                      {item.category === "nav" ? t("admin.commandNavigation") : t("admin.commandQuickActions")}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/40 flex items-center justify-between text-[11px] text-slate-400 dark:text-zinc-500">
          <div className="flex items-center gap-3">
            <span>↑↓ {locale === "id" ? "Pilih" : "Navigate"}</span>
            <span>↵ {locale === "id" ? "Buka" : "Open"}</span>
          </div>
          <span>BugSnap Command Bar</span>
        </div>
      </div>
    </div>
  );
}
