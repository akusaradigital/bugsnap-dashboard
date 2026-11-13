"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/Toast";
import { useT } from "@/components/I18nProvider";
import { PageLoader } from "@/components/PageLoader";
import { Icon, withAssetVersion } from "@/lib/iconify";
import { clearAdminCache } from "@/lib/admin-cache";
import { initialOf, isRealAvatar, pickAvatar } from "@/lib/avatar";
import { AppHeader } from "@/components/AppHeader";
import HelpMenu from "@/components/HelpMenu";
import { SiteThemeToggle } from "@/components/site/SiteThemeToggle";
import { ADMIN_NAV_ROUTES, ADMIN_NAV_HUBS, ADMIN_NAV_HUB_ORDER } from "./adminNav";

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
  const router = useRouter();
  const [adminSearch, setAdminSearch] = useState("");
  const { showToast } = useToast();
  const { t } = useT();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [adminIdentity, setAdminIdentity] = useState("akusaradigital");
  // Same account as the user dashboard, so the profile photo must match it.
  const [adminAvatar, setAdminAvatar] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signingInGoogle, setSigningInGoogle] = useState(false);

  // Sidebar & Topbar UI State (defaults to false on mobile, true on desktop)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Sub-menus start hidden; this tracks the hubs the user expanded via the chevron.
  const [expandedHubs, setExpandedHubs] = useState<Set<string>>(() => new Set());

  function toggleHub(key: string) {
    setExpandedHubs((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Keep the hub that owns the current page open, including after a refresh.
  // Other hubs stay collapsed until the user expands them.
  useEffect(() => {
    const activeHub = ADMIN_NAV_ROUTES.find((r) => r.href === pathname)?.hub;
    if (!activeHub) return;
    setExpandedHubs((prev) => (prev.has(activeHub) ? prev : new Set(prev).add(activeHub)));
  }, [pathname]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth > 768) {
      setSidebarOpen(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  // Notifications State
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [notifCount, setNotifCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  // Profile Menu State
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  interface NavSubItem {
    href: string;
    label: string;
    badgeKey?: string;
  }

  interface MasterHub {
    key: string;
    title: string;
    href: string;
    icon: string;
    badgeKey?: string;
    subItems?: NavSubItem[];
  }

  const masterHubs: MasterHub[] = ADMIN_NAV_HUB_ORDER.map((hubKey) => {
    const hub = ADMIN_NAV_HUBS[hubKey];
    const routes = ADMIN_NAV_ROUTES.filter((r) => r.hub === hubKey);
    return {
      key: hubKey,
      title: t(hub.titleKey),
      href: hub.href,
      icon: hub.icon,
      badgeKey: hub.badgeKey,
      subItems:
        routes.length > 1
          ? routes.map((r) => ({ href: r.href, label: t(r.titleKey), badgeKey: r.badgeKey }))
          : undefined,
    };
  });

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

    // Same source as the user dashboard (users.avatar_url, falling back to the
    // Google auth metadata picture) so the admin header shows the same photo.
    async function loadAdminAvatar(email: string | undefined, metaAvatar?: string, metaPicture?: string) {
      let dbAvatar: string | undefined;
      if (email) {
        const { data: userRow } = await supabase
          .from("users")
          .select("avatar_url")
          .ilike("email", email)
          .maybeSingle();
        if (userRow?.avatar_url) dbAvatar = userRow.avatar_url;
      }
      if (isMounted) setAdminAvatar(pickAvatar(dbAvatar, metaAvatar, metaPicture));
    }

    async function checkSession() {
      // The admin session lives in an httpOnly cookie the browser sends
      // automatically. Asking the server keeps the token out of JS entirely -
      // a token in sessionStorage is readable by any XSS on this origin.
      try {
        const res = await fetch("/api/admin/session");
        if (res.ok) {
          const json = await res.json().catch(() => ({}));
          if (isMounted) {
            // Show the signed-in account's email (same as the user dashboard) when Supabase has one.
            const { data: sessionData } = await supabase.auth.getSession();
            const sessionUser = sessionData.session?.user;
            const sessionEmail = sessionUser?.email;
            if (sessionEmail) {
              setAdminIdentity(sessionEmail);
              const meta = sessionUser?.user_metadata || {};
              loadAdminAvatar(sessionEmail, meta.avatar_url, meta.picture);
            } else if (json.username) {
              setAdminIdentity(json.username);
            }
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

          // Validate admin authorization against server-side config
          let isAdmin = false;
          try {
            const checkRes = await fetch("/api/admin/check", {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (checkRes.ok) {
              const checkJson = await checkRes.json();
              isAdmin = Boolean(checkJson.isAdmin);
            }
          } catch {
            // Fall through to fallback
          }

          if (!isAdmin) {
            isAdmin = email === "contact.akusaraproject@gmail.com";
          }

          if (isAdmin) {
            const res = await fetch("/api/admin/login-google", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            });

            const json = await res.json().catch(() => ({}));
            // The route sets the httpOnly session cookie; json.ok signals success.
            if (res.ok && json.ok) {
              if (isMounted) {
                setAdminIdentity(email);
                const meta = user.user_metadata || {};
                loadAdminAvatar(email, meta.avatar_url, meta.picture);
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
                t("admin.accessDeniedDesc").replace("{email}", user.email || "")
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

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        if (session?.access_token && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
          checkSession();
        }
      }
    );

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
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
        options: {
          redirectTo,
          queryParams: { prompt: "select_account", access_type: "offline" },
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      setLoginError((err as Error)?.message || t("adminMisc.errLoginGoogle"));
      setSigningInGoogle(false);
    }
  }

  async function handleLogout() {
    setIsAuthenticated(false);
    setProfileOpen(false);
    clearAdminCache();
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    await supabase.auth.signOut().catch(() => {});
    showToast(t("admin.lockConsole"), "info");
  }

  if (checkingAuth) {
    return <PageLoader message={t("layout.loading")} fullScreen />;
  }

  // Login lock screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-7 shadow-xl">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white dark:bg-zinc-800 p-2 mb-3 shadow-md border border-slate-200 dark:border-zinc-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-day.svg" alt="BugSnap" className="h-8 w-8 object-contain dark:hidden" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-dark.svg" alt="BugSnap" className="h-8 w-8 object-contain hidden dark:block" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">{t("adminCopy.consoleTitle")}</h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              {t("adminCopy.loginScopeDesc")}
            </p>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              disabled={signingInGoogle}
              onClick={handleGoogleLogin}
              className="w-full min-h-11 flex items-center justify-center gap-2.5 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 text-xs font-semibold py-2.5 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900 disabled:opacity-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={withAssetVersion("/icons/google.svg")} alt="Google" className="h-4 w-4 shrink-0" />
              <span>{signingInGoogle ? "Menghubungkan Google..." : "Masuk dengan Google"}</span>
            </button>
            <p className="text-[10px] text-center text-slate-600 dark:text-zinc-300">
              {t("admin.superAdminOnlyDesc")}
            </p>

            {loginError && (
              <div className="space-y-2 pt-2">
                <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 p-2.5 text-xs text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 leading-snug">
                  {loginError}
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    clearAdminCache();
                    await supabase.auth.signOut().catch(() => {});
                    window.location.assign("/admin");
                  }}
                  className="text-[11px] text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 underline text-center w-full block cursor-pointer"
                >
                  {t("adminCopy.signOutSwitch")}
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800 text-center">
            <Link
              href="/dashboard"
              className="text-xs text-slate-500 dark:text-zinc-400 hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-colors"
            >
              {t("adminCopy.backToUser")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Admin console shell
  return (
    <div className="h-screen flex bg-slate-100 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 overflow-hidden">
      <a
        href="#main-admin-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg"
      >
        {t("adminCopy.skipToMain")}
      </a>

      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-150"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR - Drawer on Mobile, Pinned on Desktop */}
      <aside
        className={`w-60 border-r border-border bg-subtle shrink-0 flex flex-col h-full overflow-visible max-h-screen lg:relative lg:translate-x-0 fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand block: same as the user dashboard (logo, BugSnap, Screen Recorder) */}
        <div className="px-5 py-5 border-b border-border flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-day.svg" alt="BugSnap" width={28} height={28} decoding="async" className="w-7 h-7 shrink-0 object-contain dark:hidden" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-dark.svg" alt="BugSnap" width={28} height={28} decoding="async" className="w-7 h-7 shrink-0 object-contain hidden dark:block" />
            <div>
              <h1 className="text-sm font-bold tracking-tight text-foreground leading-none">BugSnap</h1>
              <p className="text-[10px] text-muted mt-1 leading-none font-medium">{t("layout.screenRecorder")}</p>
            </div>
          </div>

          {/* Close button on mobile */}
          {sidebarOpen && (
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-muted hover:text-foreground text-sm cursor-pointer"
              title={t("layout.closeMenu")}
              aria-label={t("layout.closeMenu")}
            >
              <Icon icon="lucide:x" className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 5 Master Hubs Navigation List */}
        <nav className="flex-1 flex flex-col min-h-0 px-3 py-3 overflow-y-auto space-y-1">
          {masterHubs.map((hub) => {
            const isHubActive = pathname === hub.href || Boolean(hub.subItems?.some((s) => s.href === pathname));
            const badgeCount = hub.badgeKey === "support" ? notifCount : 0;
            const hasSubItems = Boolean(hub.subItems && hub.subItems.length > 0);
            const isHubExpanded = expandedHubs.has(hub.key);

            return (
              <div key={hub.key}>
                {(() => {
                  const rowClass = `flex w-full items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isHubActive
                      ? "bg-blue-50 dark:bg-blue-950/25 text-[#2563EB] dark:text-[#3B82F6]"
                      : "text-muted hover:text-foreground hover:bg-subtle"
                  }`;
                  const rowContent = (
                    <>
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon icon={hub.icon} className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {sidebarOpen && <span className="truncate">{hub.title}</span>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {sidebarOpen && badgeCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-rose-500 text-white shadow-xs">
                            {badgeCount}
                          </span>
                        )}
                        {sidebarOpen && hasSubItems && (
                          <Icon
                            icon="lucide:chevron-down"
                            className={`w-3.5 h-3.5 transition-transform ${isHubExpanded ? "" : "-rotate-90"}`}
                            aria-hidden="true"
                          />
                        )}
                      </div>
                    </>
                  );

                  // Hubs with sub-menus toggle open on click; collapsed sidebar falls back to the hub link.
                  return hasSubItems && sidebarOpen ? (
                    <button
                      type="button"
                      onClick={() => toggleHub(hub.key)}
                      aria-expanded={isHubExpanded}
                      className={`${rowClass} cursor-pointer`}
                    >
                      {rowContent}
                    </button>
                  ) : (
                    <Link href={hub.href} prefetch={true} className={rowClass}>
                      {rowContent}
                    </Link>
                  );
                })()}

                {/* Sub-items: hidden by default, shown when the chevron expands the hub */}
                {sidebarOpen && hasSubItems && isHubExpanded && (
                  <div className="ml-5 pl-2.5 my-1 space-y-0.5 border-l border-border">
                    {hub.subItems!.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      const subBadge = sub.badgeKey === "support" ? notifCount : 0;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          prefetch={true}
                          className={`flex items-center justify-between gap-2 py-1.5 px-2.5 text-xs font-medium rounded-lg transition-colors ${
                            isSubActive
                              ? "bg-blue-50 dark:bg-blue-950/25 text-[#2563EB] dark:text-[#3B82F6]"
                              : "text-muted hover:text-foreground hover:bg-subtle"
                          }`}
                        >
                          <span className="truncate">{sub.label}</span>
                          {subBadge > 0 && (
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" title={`${subBadge}`} aria-label={`${subBadge}`} />
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

        <div className="mt-auto shrink-0" />
        <div className="px-3 py-2.5 border-t border-border/60 flex items-center justify-between shrink-0 bg-subtle">
          <HelpMenu />
          <SiteThemeToggle compact />
        </div>
      </aside>

      {/* RIGHT MAIN WRAPPER - Scrolls independently */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* TOP NAVBAR: shared AppHeader (same layout as the user dashboard) */}
        <AppHeader
          onOpenMenu={() => setSidebarOpen(true)}
          openMenuLabel={t("layout.openMenu")}
          search={
            /* Same search form shell as the user dashboard: jumps straight to Content & Captures. */
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const q = adminSearch.trim();
                router.push(`/admin/captures${q ? `?q=${encodeURIComponent(q)}` : ""}`);
              }}
            >
              <div className="relative">
                <Icon icon="lucide:search" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" aria-hidden="true" />
                <input
                  type="search"
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  placeholder={t("admin.commandSearchHint")}
                  className="w-full text-sm rounded-xl border border-border bg-background pl-10 pr-3 py-2.5 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 text-foreground placeholder:text-muted"
                />
              </div>
            </form>
          }
          actions={
          <>
            {/* UNIFIED ADMIN NOTIFICATIONS DROPDOWN */}
            <div ref={notifRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  loadNotifications();
                }}
                className="relative p-2 rounded-lg text-muted hover:text-foreground hover:bg-background transition-colors"
                aria-label={t("admin.notificationsTitle")}
                aria-expanded={notifOpen}
              >
                <Icon icon="lucide:bell" className="w-4 h-4" />
                {notifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-md bg-[#2563EB] text-white text-[9px] font-bold flex items-center justify-center">
                    {notifCount > 99 ? "99+" : notifCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="fixed right-3 top-14 sm:absolute sm:right-0 sm:top-full sm:mt-2 w-[min(24rem,calc(100vw-1.5rem))] rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
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
                      className="text-[11px] text-[#2563EB] dark:text-[#3B82F6] font-semibold hover:underline flex items-center gap-1"
                    >
                      <Icon icon="lucide:refresh-cw" className="w-3 h-3" />
                      <span>Segarkan</span>
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500 dark:text-zinc-400">
                        {t("admin.noNotifications")}
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <Link
                          key={n.id}
                          href={n.href}
                          onClick={() => setNotifOpen(false)}
                          className={`block p-3.5 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors ${
                            n.unread ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="shrink-0 mt-0.5">
                              {n.category === "support" && <Icon icon="lucide:inbox" className="w-4 h-4 text-sky-500" />}
                              {n.category === "security" && <Icon icon="lucide:shield-check" className="w-4 h-4 text-emerald-500" />}
                              {n.category === "extension" && <Icon icon="lucide:puzzle" className="w-4 h-4 text-amber-500" />}
                              {n.category === "email" && <Icon icon="lucide:mail" className="w-4 h-4 text-violet-500" />}
                              {n.category === "integrations" && <Icon icon="lucide:globe" className="w-4 h-4 text-teal-500" />}
                              {n.category === "system" && <Icon icon="lucide:check-circle" className="w-4 h-4 text-emerald-500" />}
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
                      className="text-xs font-semibold text-[#2563EB] dark:text-[#3B82F6] hover:underline block"
                    >
                      {t("admin.viewAllInbox")}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* ADMIN IDENTITY CHIP & DROPDOWN MENU */}
            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1 pr-1.5 rounded-full hover:bg-background transition-colors"
                title={t("admin.accountMenu")}
                aria-label={t("admin.accountMenu")}
              >
                {isRealAvatar(adminAvatar) ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={adminAvatar}
                    alt={adminIdentity}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover shrink-0 border border-border"
                  />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-[#2563EB] text-white text-xs font-semibold flex items-center justify-center shrink-0">
                    {initialOf(adminIdentity)}
                  </span>
                )}
                <Icon icon="lucide:chevron-down" className={`w-3.5 h-3.5 text-muted transition-transform ${profileOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>

              {/* Profile Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-72 rounded-2xl border border-border bg-subtle shadow-xl overflow-visible">
                  <div className="px-4 py-3 flex items-center justify-between gap-2 border-b border-border">
                    <p className="text-xs font-medium text-foreground truncate min-w-0">{adminIdentity}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted shrink-0">{t("admin.superAdminBadge")}</span>
                  </div>

                  <Link
                    href="/dashboard"
                    onClick={() => setProfileOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-subtle transition-colors border-b border-border"
                  >
                    <Icon icon="lucide:layout-dashboard" className="w-4 h-4 text-muted shrink-0" />
                    {t("admin.toUserDashboard")}
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-subtle transition-colors"
                  >
                    <Icon icon="lucide:log-out" className="w-4 h-4 text-muted shrink-0" />
                    {t("admin.lockConsole")}
                  </button>
                </div>
              )}
            </div>
          </>
          }
        />

        {/* MAIN BODY CONTENT */}
        <main id="main-admin-content" className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

    </div>
  );
}
