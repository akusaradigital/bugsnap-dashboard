"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/Toast";
import { useT } from "@/components/I18nProvider";
import { CommandPalette } from "./CommandPalette";

interface AdminNotificationItem {
  id: string;
  category: "support" | "security" | "extension" | "email" | "integrations" | "system";
  title: string;
  description: string;
  time: string;
  href: string;
  severity: "info" | "warning" | "error" | "success";
  unread: boolean;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { showToast } = useToast();
  const { locale, setLocale, t } = useT();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [adminIdentity, setAdminIdentity] = useState("akusaradigital");
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [signingInGoogle, setSigningInGoogle] = useState(false);

  // Sidebar & Topbar UI State (defaults to false on mobile, true on desktop)
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      setSidebarOpen(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  // Notifications State
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [notifCount, setNotifCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  // Command Palette State
  const [commandOpen, setCommandOpen] = useState(false);

  // Profile Menu & Change Password Modal State
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  interface NavSubItem {
    href: string;
    label: string;
    badgeKey?: string;
  }

  interface MasterHub {
    title: string;
    href: string;
    icon: string;
    badgeKey?: string;
    subItems?: NavSubItem[];
  }

  const masterHubs: MasterHub[] = [
    {
      title: t("admin.hubOverview"),
      href: "/admin",
      icon: "📊",
    },
    {
      title: t("admin.hubUsers"),
      href: "/admin/users",
      icon: "👥",
      subItems: [
        { href: "/admin/users", label: t("admin.manageUsers") },
        { href: "/admin/workspaces", label: t("admin.navWorkspaces") },
        { href: "/admin/captures", label: t("admin.navCaptures") },
      ],
    },
    {
      title: t("admin.hubRevenue"),
      href: "/admin/revenue",
      icon: "💰",
      subItems: [
        { href: "/admin/revenue", label: t("admin.navRevenue") },
        { href: "/admin/ai-analytics", label: t("admin.navAiAnalytics") },
      ],
    },
    {
      title: t("admin.hubOperations"),
      href: "/admin/support",
      icon: "📥",
      badgeKey: "support",
      subItems: [
        { href: "/admin/support", label: t("admin.supportInbox"), badgeKey: "support" },
        { href: "/admin/extension", label: t("admin.extensionFleet") },
        { href: "/admin/email-health", label: t("admin.emailHealth") },
      ],
    },
    {
      title: t("admin.hubSystem"),
      href: "/admin/system",
      icon: "🛠️",
      subItems: [
        { href: "/admin/system", label: t("admin.systemDrive") },
        { href: "/admin/security-audit", label: t("admin.auditTitle") },
      ],
    },
  ];

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click-outside listener for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      // The admin session lives in an httpOnly cookie the browser sends
      // automatically. Asking the server keeps the token out of JS entirely —
      // a token in sessionStorage is readable by any XSS on this origin.
      try {
        const res = await fetch("/api/admin/session");
        if (res.ok) {
          if (isMounted) {
            setIsAuthenticated(true);
            setCheckingAuth(false);
            loadNotifications();
          }
          return;
        }
      } catch {
        // Fall through to the Google-admin path below.
      }

      try {
        const { data: authData } = await supabase.auth.getSession();
        const user = authData.session?.user;
        const accessToken = authData.session?.access_token;

        if (user && accessToken) {
          const email = (user.email || "").trim().toLowerCase();

          if (email === "contact.akusaraproject@gmail.com") {
            const res = await fetch("/api/admin/login-google", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            });

            const json = await res.json().catch(() => ({}));
            // The route also sets the httpOnly session cookie; json.token is
            // only used here as a success signal, never stored.
            if (res.ok && json.token) {
              if (isMounted) {
                setAdminIdentity(email);
                setIsAuthenticated(true);
                showToast("Login Google Admin Berhasil", "success");
                loadNotifications();
              }
            } else {
              if (isMounted) setLoginError(json.error || "Akses Google Admin gagal.");
            }
          } else {
            if (isMounted) {
              setLoginError(
                `Akses Ditolak: Email (${user.email}) tidak diizinkan masuk. Hanya contact.akusaraproject@gmail.com yang berhak mengakses Admin Console.`
              );
            }
          }
        }
      } catch {
        // Ignore silent auth error
      }

      if (isMounted) setCheckingAuth(false);
    }

    checkSession();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadNotifications() {
    try {
      const res = await fetch("/api/admin/notifications");
      const json = await res.json();
      if (res.ok && json.notifications) {
        setNotifications(json.notifications);
        setNotifCount(json.count || 0);
      }
    } catch {
      // silent
    }
  }

  async function handleGoogleLogin() {
    setLoginError(null);
    setSigningInGoogle(true);
    try {
      const redirectTo = `${window.location.origin}${pathname}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) throw error;
    } catch (err: unknown) {
      setLoginError((err as Error)?.message || "Gagal membuka login Google.");
      setSigningInGoogle(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: usernameInput.trim(),
          password: passwordInput,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || "Username atau password salah.");
      }

      // Session lives in the httpOnly cookie /api/admin/login just set.
      setAdminIdentity(usernameInput.trim());
      setIsAuthenticated(true);
      setUsernameInput("");
      setPasswordInput("");
      showToast("Akses Admin Terbuka", "success");
      loadNotifications();
    } catch (err: unknown) {
      setLoginError((err as Error)?.message || "Gagal masuk admin.");
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    setIsAuthenticated(false);
    setProfileOpen(false);
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    await supabase.auth.signOut().catch(() => {});
    showToast(t("admin.lockConsole"), "info");
  }

  async function handleChangePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 8) {
      setPasswordError("Password baru minimal 8 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Konfirmasi password baru tidak cocok.");
      return;
    }

    setSavingPassword(true);
    try {
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;

      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Gagal mengubah password.");

      showToast(t("admin.passwordChangedSuccess"), "success");
      setChangePasswordOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setPasswordError((err as Error)?.message || "Gagal mengubah password.");
    } finally {
      setSavingPassword(false);
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-500 font-medium">{t("layout.loading")}</p>
        </div>
      </div>
    );
  }

  // --- LOGIN LOCK SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-7 shadow-xl">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white dark:bg-zinc-800 p-2 mb-3 shadow-md border border-slate-200 dark:border-zinc-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon.svg" alt="BugSnap" className="h-8 w-8 object-contain" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">BugSnap Admin Console</h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Area terbatas. Masuk melalui akun Google khusus atau kredensial admin.
            </p>
          </div>

          <div className="space-y-4">
            {/* GOOGLE SIGN-IN BUTTON */}
            <div className="space-y-2">
              <button
                type="button"
                disabled={signingInGoogle || loggingIn}
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2.5 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 text-xs font-semibold py-2.5 transition-colors shadow-sm disabled:opacity-50"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{signingInGoogle ? "Menghubungkan Google..." : "Masuk dengan Google"}</span>
              </button>
              <p className="text-[10px] text-center text-slate-400 dark:text-zinc-500">
                Khusus akun: <span className="font-semibold text-slate-600 dark:text-zinc-300">contact.akusaraproject@gmail.com</span>
              </p>
            </div>

            {/* DIVIDER */}
            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-slate-200 dark:border-zinc-800 w-full" />
              <span className="bg-white dark:bg-zinc-900 px-2 text-[10px] uppercase tracking-wider text-slate-400 dark:text-zinc-500 absolute font-semibold">
                atau gunakan kredensial
              </span>
            </div>

            {/* CREDENTIALS FORM */}
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="akusaradigital"
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2.5 outline-none focus:border-[#1f3bb3] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2.5 outline-none focus:border-[#1f3bb3] transition-colors"
                />
              </div>

              {loginError && (
                <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 p-2.5 text-xs text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 leading-snug">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={loggingIn || signingInGoogle || !usernameInput || !passwordInput}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#1f3bb3] hover:bg-[#182f8f] disabled:opacity-50 text-white text-xs font-semibold py-2.5 transition-colors shadow-sm"
              >
                {loggingIn ? (
                  <>
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <span>Buka Admin Console →</span>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800 text-center">
            <Link
              href="/dashboard"
              className="text-xs text-slate-500 dark:text-zinc-400 hover:text-[#1f3bb3] transition-colors"
            >
              ← Kembali ke Dashboard User
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- STARADMIN-STYLE DASHBOARD LAYOUT ---
  return (
    <div className="h-screen flex bg-slate-100 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 overflow-hidden">
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-150"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR - Drawer on Mobile, Pinned on Desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 md:relative md:z-40 h-full shrink-0 bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 flex flex-col transition-all duration-200 ease-in-out select-none shadow-xl md:shadow-xs ${
          sidebarOpen
            ? "w-64 translate-x-0"
            : "-translate-x-full md:translate-x-0 md:w-20"
        }`}
      >
        {/* Brand Header with Official BugSnap Logo */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 dark:bg-zinc-800 shrink-0 p-1.5 shadow-xs border border-indigo-100 dark:border-zinc-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon.svg" alt="BugSnap" className="h-6 w-6 object-contain" />
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden whitespace-nowrap">
                <h2 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                  BugSnap Admin
                </h2>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">
                  Platform Console
                </span>
              </div>
            )}
          </div>

          {/* Close button on mobile */}
          {sidebarOpen && (
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 text-sm cursor-pointer"
              title="Close Sidebar"
            >
              ✕
            </button>
          )}
        </div>

        {/* 5 Master Hubs Navigation List */}
        <nav className="flex-1 py-3 px-3 space-y-1.5 overflow-y-auto">
          {masterHubs.map((hub) => {
            const isHubActive = pathname === hub.href || Boolean(hub.subItems?.some((s) => s.href === pathname));
            const badgeCount = hub.badgeKey === "support" ? notifCount : 0;

            return (
              <div key={hub.title} className="space-y-1">
                <Link
                  href={hub.href}
                  prefetch={true}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                    isHubActive
                      ? "bg-[#1f3bb3]/10 dark:bg-indigo-950/60 text-[#1f3bb3] dark:text-indigo-400 font-bold border border-[#1f3bb3]/20 dark:border-indigo-800/40 shadow-xs"
                      : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100 font-semibold"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base shrink-0">{hub.icon}</span>
                    {sidebarOpen && <span className="truncate">{hub.title}</span>}
                  </div>

                  {sidebarOpen && badgeCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-xs">
                      {badgeCount}
                    </span>
                  )}
                </Link>

                {/* Sub-items for active Hub when sidebar is open */}
                {sidebarOpen && isHubActive && hub.subItems && hub.subItems.length > 0 && (
                  <div className="ml-5 pl-2.5 my-1 space-y-0.5 border-l border-slate-200 dark:border-zinc-800">
                    {hub.subItems.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      const subBadge = sub.badgeKey === "support" ? notifCount : 0;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          prefetch={true}
                          className={`flex items-center justify-between py-1 px-2 rounded-md text-[11px] transition-colors ${
                            isSubActive
                              ? "text-[#1f3bb3] dark:text-indigo-400 font-bold bg-[#1f3bb3]/10 dark:bg-indigo-950/40"
                              : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800/50 font-medium"
                          }`}
                        >
                          <span className="truncate">{sub.label}</span>
                          {subBadge > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white">
                              {subBadge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer Area */}
        <div className="p-3 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/40 space-y-1.5 shrink-0">
          <Link
            href="/dashboard"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors font-medium"
          >
            <span className="text-sm">←</span>
            {sidebarOpen && <span className="truncate">{t("admin.toUserDashboard")}</span>}
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors font-semibold"
          >
            <span>🔒</span>
            {sidebarOpen && <span className="truncate">{t("admin.lockConsole")}</span>}
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN WRAPPER - Scrolls independently */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* TOP NAVBAR */}
        <header className="h-16 shrink-0 px-3 sm:px-6 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between z-30 shadow-xs">
          {/* Left: Sidebar Toggle + Info */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
              title="Toggle Sidebar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="hidden md:flex items-center gap-4 text-xs text-slate-500 dark:text-zinc-400 font-medium truncate">
              <span className="flex items-center gap-1.5 shrink-0">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Supabase: Online</span>
              </span>
              <span>•</span>
              <span className="truncate">CS Contact: <strong className="text-slate-700 dark:text-zinc-300">contact.akusaraproject@gmail.com</strong></span>
            </div>
          </div>

          {/* Right: Command Bar (Ctrl+K) + i18n + Notifications + Admin Identity Dropdown */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Desktop Quick Search Trigger (Ctrl+K) */}
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="hidden sm:flex items-center justify-between w-44 lg:w-60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-400 dark:text-zinc-500 hover:border-slate-300 dark:hover:border-zinc-700 hover:text-slate-600 dark:hover:text-zinc-300 text-xs transition-colors cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span>🔍</span>
                <span className="truncate">{t("admin.commandSearchHint")}</span>
              </div>
              <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded shadow-2xs shrink-0">
                ⌘K
              </kbd>
            </button>

            {/* Mobile Search Button (< sm) */}
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="sm:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title={t("admin.commandSearchHint")}
            >
              <span className="text-base">🔍</span>
            </button>

            {/* Language Switcher (i18n) */}
            <button
              type="button"
              onClick={() => setLocale(locale === "id" ? "en" : "id")}
              className="px-2 sm:px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
              title={locale === "id" ? "Switch to English" : "Ganti ke Bahasa Indonesia"}
            >
              <span className="text-sm">🌐</span>
              <span className="uppercase text-[11px]">{locale}</span>
            </button>

            {/* UNIFIED ADMIN NOTIFICATIONS DROPDOWN */}
            <div ref={notifRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  loadNotifications();
                }}
                className="relative p-1.5 sm:p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title={t("admin.notificationsTitle")}
              >
                <span className="text-base">🔔</span>
                {notifCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-white text-[9px] font-black animate-pulse">
                    {notifCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-sm sm:w-96 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        {t("admin.notificationsTitle")}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                        {notifCount > 0 ? `${notifCount} alert aktif` : t("admin.noNotifications")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={loadNotifications}
                      className="text-[11px] text-[#1f3bb3] dark:text-blue-400 font-semibold hover:underline"
                    >
                      Segarkan ⟳
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        {t("admin.noNotifications")}
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <Link
                          key={n.id}
                          href={n.href}
                          onClick={() => setNotifOpen(false)}
                          className={`block p-3.5 hover:bg-slate-50 dark:hover:bg-zinc-850 transition-colors ${
                            n.unread ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="text-base shrink-0 mt-0.5">
                              {n.category === "support" && "📥"}
                              {n.category === "security" && "🛡️"}
                              {n.category === "extension" && "🧩"}
                              {n.category === "email" && "✉️"}
                              {n.category === "integrations" && "🌐"}
                              {n.category === "system" && "✅"}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {n.title}
                                </p>
                                {n.unread && (
                                  <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2 mt-0.5 leading-relaxed">
                                {n.description}
                              </p>
                              <span className="text-[9px] text-slate-400 block mt-1">
                                {new Date(n.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>

                  <div className="p-2.5 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-center">
                    <Link
                      href="/admin/support"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs font-semibold text-[#1f3bb3] dark:text-blue-400 hover:underline block"
                    >
                      {t("admin.viewAllInbox")}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* ADMIN IDENTITY CHIP & DROPDOWN MENU */}
            <div ref={profileRef} className="relative pl-2 border-l border-slate-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 text-left hover:opacity-90 transition-opacity cursor-pointer p-1 rounded-lg"
                title="Admin Account Menu"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1f3bb3] text-white text-xs font-bold uppercase shadow-sm">
                  {adminIdentity[0] || "A"}
                </div>
                <div className="hidden lg:block">
                  <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[130px]">
                    {adminIdentity}
                  </p>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase">
                    Super Admin
                  </span>
                </div>
                <span className="text-slate-400 text-xs">▾</span>
              </button>

              {/* Profile Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-3.5 border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {adminIdentity}
                    </p>
                    <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase">
                      Super Administrator
                    </span>
                  </div>

                  <div className="p-1 space-y-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        setPasswordError(null);
                        setChangePasswordOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors font-medium text-left"
                    >
                      <span>🔑</span>
                      <span>{t("admin.changePassword")}</span>
                    </button>

                    <Link
                      href="/dashboard"
                      onClick={() => setProfileOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors font-medium text-left"
                    >
                      <span>←</span>
                      <span>{t("admin.toUserDashboard")}</span>
                    </Link>

                    <div className="border-t border-slate-100 dark:border-zinc-800 my-1" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors font-semibold text-left"
                    >
                      <span>🚪</span>
                      <span>{t("admin.lockConsole")}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MAIN BODY CONTENT */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* CHANGE PASSWORD MODAL */}
      {changePasswordOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🔑</span>
                <span>{t("admin.changePassword")}</span>
              </h3>
              <button
                type="button"
                onClick={() => setChangePasswordOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 text-sm"
              >
                ✕
              </button>
            </div>

            {passwordError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 leading-snug">
                {passwordError}
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                  {t("admin.currentPassword")}
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 outline-none focus:border-[#1f3bb3]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                  {t("admin.newPassword")}
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 outline-none focus:border-[#1f3bb3]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                  {t("admin.confirmNewPassword")}
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 outline-none focus:border-[#1f3bb3]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setChangePasswordOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  {t("admin.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={savingPassword || !currentPassword || !newPassword}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#1f3bb3] text-white hover:bg-[#182f8f] disabled:opacity-50 transition-colors shadow-sm"
                >
                  {savingPassword ? t("admin.savingPassword") : t("admin.savePassword")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GLOBAL COMMAND PALETTE (CTRL+K / CMD+K) */}
      <CommandPalette
        isOpen={commandOpen}
        onClose={() => setCommandOpen(false)}
        onLockConsole={handleLogout}
        onToggleLocale={() => setLocale(locale === "id" ? "en" : "id")}
        onRefreshNotifs={loadNotifications}
      />
    </div>
  );
}
