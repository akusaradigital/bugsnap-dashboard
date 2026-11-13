"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useT } from "@/components/I18nProvider";
import { useToast } from "@/components/Toast";
import { PageLoader } from "@/components/PageLoader";
import { normalizePlan, seatLimit, tierLabel, type Plan } from "@/lib/tiers";
import { pickAvatar, initialOf, isRealAvatar } from "@/lib/avatar";
import { AuthRequiredCard } from "@/components/AuthRequiredCard";
import { AppHeader } from "@/components/AppHeader";
import DriveStorageMeter from "@/components/DriveStorageMeter";
import FloatingSupport from "@/components/FloatingSupport";
import HelpMenu from "@/components/HelpMenu";
import { SiteThemeToggle } from "@/components/site/SiteThemeToggle";
import { Dropdown } from "@/components/Dropdown";
import { Icon } from "@/lib/iconify";
import { APP_ICONS } from "@/lib/icons";

const navItems = [
  { labelKey: "nav.dashboard", href: "/dashboard", icon: APP_ICONS.nav.dashboard },
  { labelKey: "nav.captures", href: "/captures", icon: APP_ICONS.nav.captures },
  { labelKey: "nav.compare", href: "/compare", icon: APP_ICONS.nav.compare },
];

const GOOGLE_DRIVE_FOLDER_COLORS = [
  { name: "Chocolate", value: "#8c5e58" },
  { name: "Earth", value: "#8f6c4f" },
  { name: "Radicchio", value: "#d50000" },
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Yellow", value: "#eab308" },
  { name: "Olive", value: "#84cc16" },
  { name: "Green", value: "#22c55e" },
  { name: "Forest green", value: "#10b981" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Peacock", value: "#06b6d4" },
  { name: "Sky", value: "#0ea5e9" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Cobalt", value: "#2563eb" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Purple", value: "#a855f7" },
  { name: "Pink", value: "#ec4899" },
  { name: "Rose", value: "#f43f5e" },
];

type Workspace = {
  id: string;
  name: string;
  slug?: string;
  owner_user_id: string | null;
  created_at: string;
  role: string;
  member_count: number;
  avatar_url?: string | null;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const routerRef = useRef(router);
  routerRef.current = router;
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const { t } = useT();
  const { showToast } = useToast();
  const [wsParam, setWsParam] = useState<string | null>(null);
  const [wsOpen, setWsOpen] = useState(false);
  const [workspacePickerOpen, setWorkspacePickerOpen] = useState(false);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);
  const wsPickerTimerRef = useRef<NodeJS.Timeout | null>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const [topSearch, setTopSearch] = useState("");

  const handleWsPickerEnter = () => {
    if (wsPickerTimerRef.current) {
      clearTimeout(wsPickerTimerRef.current);
      wsPickerTimerRef.current = null;
    }
    setWorkspacePickerOpen(true);
  };

  const handleWsPickerLeave = () => {
    if (wsPickerTimerRef.current) {
      clearTimeout(wsPickerTimerRef.current);
    }
    wsPickerTimerRef.current = setTimeout(() => {
      setWorkspacePickerOpen(false);
    }, 180);
  };

  useEffect(() => {
    return () => {
      if (wsPickerTimerRef.current) {
        clearTimeout(wsPickerTimerRef.current);
      }
    };
  }, []);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [promoBanner, setPromoBanner] = useState<{ enabled: boolean; message: string; expiresAt?: string | null; targetPlan?: string | null; target_plan?: string | null } | null>(null);
  const [promoDismissed, setPromoDismissed] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWsId, setActiveWsId] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [createWsModalOpen, setCreateWsModalOpen] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [createWsError, setCreateWsError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [members, setMembers] = useState<Record<string, string[]>>({});
  const [folders, setFolders] = useState<string[]>([]);
  const [failedWsAvatars, setFailedWsAvatars] = useState<Record<string, boolean>>({});
  const [defaultFolders, setDefaultFolders] = useState<Set<string>>(new Set());
  const activeWsRole = workspaces.find((w) => w.id === activeWsId)?.role;
  const [draggedFolder, setDraggedFolder] = useState<string | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [, setProjects] = useState<{ id: string; name: string; description: string; is_default: boolean }[]>([]);
  const [folderMenuOpen, setFolderMenuOpen] = useState<string | null>(null);
  const [folderMenuPos, setFolderMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [createFolderError, setCreateFolderError] = useState<string | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [createProjectError, setCreateProjectError] = useState<string | null>(null);
  const [creatingProject, setCreatingProject] = useState(false);
  const [projectToRename, setProjectToRename] = useState<{ id: string; name: string } | null>(null);
  const [renameProjectName, setRenameProjectName] = useState("");
  const [renameProjectError, setRenameProjectError] = useState<string | null>(null);
  const [renamingProject, setRenamingProject] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deletingProject, setDeletingProject] = useState(false);

  // Custom Rename & Delete Folder Modal states
  const [renameFolderModalOpen, setRenameFolderModalOpen] = useState(false);
  const [folderToRename, setFolderToRename] = useState<string | null>(null);
  const [renameFolderNameInput, setRenameFolderNameInput] = useState("");
  const [renameFolderError, setRenameFolderError] = useState<string | null>(null);

  const [deleteFolderModalOpen, setDeleteFolderModalOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
  const [deletingFolder, setDeletingFolder] = useState(false);

  // Folder Color Modal states (Google Drive Style)
  const [folderColors, setFolderColors] = useState<Record<string, string>>({});
  const [folderColorModalOpen, setFolderColorModalOpen] = useState(false);
  const [folderToColor, setFolderToColor] = useState<string | null>(null);
  const [selectedFolderColor, setSelectedFolderColor] = useState<string | null>(null);
  const [savingFolderColor, setSavingFolderColor] = useState(false);

  // Nested Folder states (Parent-Child Hierarchy)
  interface FolderItem {
    id: string;
    name: string;
    parent_id: string | null;
    color?: string | null;
    is_default: boolean;
  }
  const [folderItems, setFolderItems] = useState<FolderItem[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [parentFolderId, setParentFolderId] = useState<string | null>(null);

  // Custom Rename & Delete Workspace Modal states

  const [session, setSession] = useState<{
    loading: boolean;
    user: null | { id: string; email: string; name: string; avatar: string; plan: Plan };
    suspended?: boolean;
  }>({ loading: true, user: null });
  // Payment / billing UI temporarily disabled:
  // const [billingModalOpen, setBillingModalOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    comment_id: string; capture_id: string; capture_title: string;
    author_email: string; body: string; created_at: string;
  }>>([]);
  // Track which capture_ids have been clicked/read this session.
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("BugSnap_notif_read_ids");
      return new Set(stored ? JSON.parse(stored) : []);
    } catch { return new Set(); }
  });

  function closeWorkspaceMenus() {
    if (wsPickerTimerRef.current) {
      clearTimeout(wsPickerTimerRef.current);
      wsPickerTimerRef.current = null;
    }
    setWorkspacePickerOpen(false);
    setWsOpen(false);
  }

  // ponytail: sidebar <aside> has a `transform` class, which makes it the
  // containing block for `fixed` descendants - a `fixed inset-0` click-catcher
  // nested inside it only covers the sidebar's box, not the viewport. A
  // document-level capture-phase pointerdown is immune to that, so every
  // sidebar dropdown (workspace switcher, notifications, folder menu) closes
  // on any outside click, not just clicks inside the sidebar.
  useEffect(() => {
    if (!wsOpen && !workspacePickerOpen && !notifOpen && !folderMenuOpen) return;
    const handleOutsidePointer = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      // Mobile and desktop headers are both mounted (one is CSS-hidden per
      // breakpoint), so a single ref can't contain both popover copies -
      // check by data attribute instead, which matches whichever is visible.
      if ((wsOpen || workspacePickerOpen) && !workspaceMenuRef.current?.contains(target)) {
        closeWorkspaceMenus();
      }
      if (notifOpen && !notifMenuRef.current?.contains(target) && !(target instanceof Element && target.closest("[data-notif-trigger]"))) {
        setNotifOpen(false);
      }
      if (folderMenuOpen && !(target instanceof Element && target.closest("[data-folder-actions]"))) {
        setFolderMenuOpen(null);
      }
    };
    document.addEventListener("pointerdown", handleOutsidePointer, true);
    return () => document.removeEventListener("pointerdown", handleOutsidePointer, true);
  }, [wsOpen, workspacePickerOpen, notifOpen, folderMenuOpen]);

  useEffect(() => {
    const updateFolder = () => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      setCurrentFolder(params.get("folder"));
    };
    updateFolder();
    window.addEventListener("popstate", updateFolder);
    return () => window.removeEventListener("popstate", updateFolder);
  }, [pathname]);
  const [notifLastSeen, setNotifLastSeen] = useState<number>(() => {
    try {
      return Number(localStorage.getItem("BugSnap_notif_last_seen") || 0);
    } catch { return 0; }
  });

  // Poll notifications - returns per-capture items within the last 7 days.
  useEffect(() => {
    const email = session.user?.email;
    if (!email) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
        const lastSeenMs = notifLastSeen || Date.now() - SEVEN_DAYS_MS;
        const since = new Date(Math.max(lastSeenMs, Date.now() - SEVEN_DAYS_MS)).toISOString();
        const { data, error } = await supabase.rpc("get_unseen_notifications", { p_since: since });
        if (error) throw error;
        if (!cancelled) setNotifications((data as typeof notifications) ?? []);
      } catch (error) {
        console.warn("Failed to load notifications:", error);
      }
    };
    poll();
    const t = setInterval(poll, 60_000);
    return () => { cancelled = true; clearInterval(t); };
  }, [session.user?.email, notifLastSeen]);

  const newCommentCount = notifications.filter(n => !readIds.has(n.capture_id)).length;

  // Mark a single notification as read (grey out, not deleted).
  const markRead = (captureId: string) => {
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(captureId);
      try { localStorage.setItem("BugSnap_notif_read_ids", JSON.stringify(Array.from(next))); } catch { /* ignore */ }
      return next;
    });
  };

  // Mark all as read.
  const handleClearNotifications = () => {
    const now = Date.now();
    setNotifLastSeen(now);
    setNotifications([]);
    setReadIds(new Set());
    setNotifOpen(false);
    try {
      localStorage.setItem("BugSnap_notif_last_seen", String(now));
      localStorage.removeItem("BugSnap_notif_read_ids");
    } catch { /* ignore */ }
  };

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data, error }) => {
      if (!active) return;
      if (error) {
        console.warn("Failed to load session:", error);
        setSession({ loading: false, user: null });
        return;
      }
      const u = data.session?.user;
      if (!u) {
        setSession({ loading: false, user: null });
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const errDesc = searchParams.get("error_description") || hashParams.get("error_description");
        const errCode = searchParams.get("error") || hashParams.get("error");
        const hasAuthError = !!(errDesc || errCode);

        ["error", "error_description", "error_code", "error_uri", "sb", "state", "code"].forEach((k) => {
          searchParams.delete(k);
        });
        const cleanSearch = searchParams.toString() ? `?${searchParams.toString()}` : "";
        const cleanPath = `${window.location.pathname}${cleanSearch}`;
        const target = hasAuthError || cleanPath === "/login" ? "/dashboard" : cleanPath || "/dashboard";

        const loginUrl = new URL("/login", window.location.origin);
        loginUrl.searchParams.set("redirectTo", target);
        if (errDesc) {
          loginUrl.searchParams.set("error_description", errDesc);
        } else if (errCode) {
          loginUrl.searchParams.set("error_description", errCode);
        }
        router.replace(loginUrl.pathname + loginUrl.search);
        return;
      }
      const meta = u.user_metadata || {};
      const userEmail = u.email || "";

      // Attribute viral signup if referral capture ID exists
      try {
        const refCaptureId = localStorage.getItem("bugsnap_ref_capture_id");
        if (refCaptureId && data.session?.access_token) {
          fetch("/api/track/referral", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${data.session.access_token}`,
            },
            body: JSON.stringify({ captureId: refCaptureId }),
          })
            .then(() => localStorage.removeItem("bugsnap_ref_capture_id"))
            .catch(() => { });
        }
      } catch { }

      // Read the plan from public.users (source of truth updated by the
      // Stripe webhook) so upgrades take effect immediately without re-login.
      let dbPlan: Plan = normalizePlan(meta.plan);
      let suspended = false;
      // Same source as Settings > Account (avatar_url/full_name) so the
      // sidebar profile stays in sync with what the user saved there.
      let dbAvatar: string | undefined;
      let dbName: string | undefined;
      if (userEmail) {
        const { data: userRow } = await supabase
          .from("users")
          .select("plan, suspended, avatar_url, full_name")
          .ilike("email", userEmail)
          .maybeSingle();
        // users.plan is the source of truth (Stripe webhook writes it). Fall
        // back to auth metadata only as a bootstrap for pre-webhook accounts.
        if (userRow?.plan) dbPlan = normalizePlan(userRow.plan);
        if (userRow?.suspended) suspended = true;
        if (userRow?.avatar_url) dbAvatar = userRow.avatar_url;
        if (userRow?.full_name) dbName = userRow.full_name;
      }

      // Block suspended users from the app shell.
      if (suspended) {
        setSession({ loading: false, user: null, suspended: true });
        return;
      }

      setSession({
        loading: false,
        user: {
          id: u.id,
          email: userEmail,
          name: dbName || meta.full_name || meta.name || userEmail?.split("@")[0] || "User",
          avatar: pickAvatar(dbAvatar, meta.avatar_url, meta.picture),
          plan: dbPlan,
        },
      });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (!active) return;
      if (event === "SIGNED_OUT") {
        try {
          if (typeof window !== "undefined") {
            window.postMessage({ source: "bugsnap-web", action: "sync_logout" }, window.location.origin);
          }
          localStorage.removeItem("BugSnap_notif_last_seen");
          localStorage.removeItem("BugSnap_notif_read_ids");
          localStorage.removeItem("BugSnap_promo_dismissed");
          sessionStorage.removeItem("bs_drive_quota");
        } catch { }
        router.replace("/login");
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  // Settings saves the profile on a separate page instance of this same
  // layout - sync in place instead of requiring a reload to see it.
  useEffect(() => {
    const onProfileUpdated = (e: Event) => {
      const detail = (e as CustomEvent<{ fullName?: string; avatarUrl?: string }>).detail;
      if (!detail) return;
      setSession((prev) =>
        prev.user
          ? {
            ...prev,
            user: {
              ...prev.user,
              name: detail.fullName?.trim() || prev.user.name,
              avatar: pickAvatar(detail.avatarUrl, prev.user.avatar),
            },
          }
          : prev
      );
    };
    window.addEventListener("bugsnap:profile-updated", onProfileUpdated);

    const onWorkspaceUpdated = (e: Event) => {
      const detail = (e as CustomEvent<{ id: string; name?: string; avatarUrl?: string | null }>).detail;
      if (!detail?.id) return;
      setWorkspaces((prev) =>
        prev.map((ws) =>
          ws.id === detail.id
            ? { ...ws, name: detail.name ?? ws.name, avatar_url: detail.avatarUrl !== undefined ? detail.avatarUrl : ws.avatar_url }
            : ws
        )
      );
    };
    window.addEventListener("bugsnap:workspace-updated", onWorkspaceUpdated);

    // The /folders page renames, recolors, and deletes folders through the
    // same RPCs as this sidebar's own menu, but it's a separate page
    // instance with its own state - sync in place here too, same pattern
    // as profile/workspace above, instead of requiring a reload to see it.
    const onFolderUpdated = (e: Event) => {
      const detail = (e as CustomEvent<{
        action: "renamed" | "recolored" | "deleted";
        oldName?: string;
        newName?: string;
        color?: string | null;
      }>).detail;
      if (!detail) return;
      if (detail.action === "renamed" && detail.oldName && detail.newName) {
        const { oldName, newName } = detail;
        setFolders((prev) => Array.from(new Set(prev.map((f) => (f === oldName ? newName : f)))).sort());
        setFolderItems((prev) => prev.map((f) => (f.name === oldName ? { ...f, name: newName } : f)));
        setFolderColors((prev) => {
          const next = { ...prev };
          if (next[oldName]) {
            next[newName] = next[oldName];
            delete next[oldName];
          }
          return next;
        });
      } else if (detail.action === "recolored" && detail.oldName) {
        const name = detail.oldName;
        setFolderColors((prev) => {
          const next = { ...prev };
          if (detail.color) next[name] = detail.color;
          else delete next[name];
          return next;
        });
        setFolderItems((prev) => prev.map((f) => (f.name === name ? { ...f, color: detail.color ?? null } : f)));
      } else if (detail.action === "deleted" && detail.oldName) {
        const name = detail.oldName;
        setFolders((prev) => prev.filter((f) => f !== name));
        setFolderItems((prev) => prev.filter((f) => f.name !== name));
        setFolderColors((prev) => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
      }
    };
    window.addEventListener("bugsnap:folder-updated", onFolderUpdated);

    return () => {
      window.removeEventListener("bugsnap:profile-updated", onProfileUpdated);
      window.removeEventListener("bugsnap:workspace-updated", onWorkspaceUpdated);
      window.removeEventListener("bugsnap:folder-updated", onFolderUpdated);
    };
  }, []);

  // Keep workspace state synchronized with browser back/forward navigation.
  useEffect(() => {
    const syncWorkspaceParam = () => {
      const url = new URL(window.location.href);
      setWsParam(url.searchParams.get("ws"));
    };
    syncWorkspaceParam();
    window.addEventListener("popstate", syncWorkspaceParam);
    return () => window.removeEventListener("popstate", syncWorkspaceParam);
  }, [pathname]);

  // Load the user's workspaces (owned or invited) via the RLS-safe RPC
  // once the session resolves.
  useEffect(() => {
    let active = true;
    const uid = session.user?.id;
    if (!uid) return;

    (async () => {
      try {
        const { data: list, error: listErr } = await supabase.rpc(
          "get_my_workspaces"
        );
        if (listErr) throw listErr;
        let rows = (list ?? []) as Workspace[];

        // Preserve the default UX: every user gets a "Personal Workspace".
        // The create_workspace RPC fills slug/updated_at server-side.
        if (rows.length === 0) {
          const { error: createErr } = await supabase.rpc(
            "create_workspace",
            { p_name: "Personal Workspace" }
          );
          if (createErr) throw createErr;
          const { data: refetched, error: refetchErr } = await supabase.rpc(
            "get_my_workspaces"
          );
          if (refetchErr) throw refetchErr;
          rows = (refetched ?? []) as Workspace[];

          // Force set the URL and active state for this newly created workspace
          if (rows[0]?.id) {
            routerRef.current.replace(`${pathnameRef.current}?ws=${rows[0].id}`, { scroll: false });
          }
        }

        if (!active) return;
        setWorkspaces(rows);
      } catch (err) {
        console.warn("Failed to load workspaces:", err);
      }
    })();

    return () => {
      active = false;
    };
  }, [session.user?.id]);

  // Synchronize active workspace ID from wsParam and loaded workspaces
  useEffect(() => {
    if (workspaces.length === 0) return;
    const matchedWs = wsParam
      ? workspaces.find((w) => w.id === wsParam || w.name.toLowerCase() === wsParam.toLowerCase())
      : null;
    const targetWs = matchedWs ? matchedWs.id : workspaces[0]?.id ?? null;
    if (targetWs !== activeWsId) {
      setActiveWsId(targetWs);
    }
    if (targetWs && targetWs !== wsParam) {
      routerRef.current.replace(`${pathnameRef.current}?ws=${targetWs}`, { scroll: false });
    }
  }, [wsParam, workspaces, activeWsId]);

  // Fetch members only for the active workspace to prevent menu navigation delay
  useEffect(() => {
    if (!activeWsId) return;
    let active = true;
    (async () => {
      try {
        const { data: mem, error: memErr } = await supabase.rpc(
          "get_workspace_members",
          { p_workspace_id: activeWsId }
        );
        if (memErr) throw memErr;
        if (!active) return;

        const emails: string[] = [];
        (mem ?? []).forEach((m: { user_id: string; email: string; role: string }) => {
          if (m.role !== "owner" && m.email) {
            emails.push(m.email);
          }
        });
        setMembers((prev) => ({ ...prev, [activeWsId]: emails }));
      } catch (err) {
        console.warn("Failed to load workspace members:", err);
      }
    })();
    return () => {
      active = false;
    };
  }, [activeWsId]);

  // Close mobile sidebar drawer on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Fetch Promo Banner
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/promo");
        if (!res.ok) return;
        const json = await res.json();
        if (active && json.promo && json.promo.enabled && json.promo.message) {
          const promoStr = json.promo.message;
          setPromoBanner(json.promo);
          // Check if user dismissed this exact message
          if (localStorage.getItem("BugSnap_promo_dismissed") === promoStr) {
            setPromoDismissed(true);
          }
        }
      } catch { }
    })();
    return () => { active = false; };
  }, []);

  // Load the list of unique folders for the active workspace
  useEffect(() => {
    if (!activeWsId) return;
    let active = true;

    (async () => {
      try {
        // 1. Fetch folders, custom created folders, and projects in parallel
        const [capturesRes, customFoldersRes, projectsRes] = await Promise.all([
          supabase
            .from("captures")
            .select("folder_name")
            .eq("workspace_id", activeWsId)
            .not("folder_name", "is", null)
            .limit(300),
          supabase
            .from("workspace_folders")
            .select("id, name, is_default, sort_order, color, parent_id")
            .eq("workspace_id", activeWsId),
          supabase
            .rpc("get_workspace_projects", { p_workspace_id: activeWsId }),
        ]);

        if (capturesRes.error) throw capturesRes.error;
        if (customFoldersRes.error) throw customFoldersRes.error;
        if (projectsRes.error) throw projectsRes.error;

        const capturesData = capturesRes.data;
        const customFoldersData = customFoldersRes.data;
        const projectsData = projectsRes.data;

        // Deduplicate folder names from both sources
        const allFolderNames = [
          ...(capturesData || []).map((c) => c.folder_name),
          ...(customFoldersData || []).map((f) => f.name)
        ].filter(Boolean) as string[];

        const uniqueFolders = Array.from(new Set(allFolderNames));
        const defaultName = (customFoldersData || []).find((folder) => folder.is_default)?.name;
        const orderByName = new Map(
          (customFoldersData || []).map((f) => [f.name, f.sort_order ?? Number.MAX_SAFE_INTEGER])
        );

        if (active) {
          const typedProjects = (projectsData || []) as { id: string; name: string; description?: string | null; is_default?: boolean }[];
          setProjects(typedProjects.map((p) => ({ id: p.id, name: p.name, description: p.description || "", is_default: !!p.is_default })));
          const defSet = new Set((customFoldersData || []).filter((f) => f.is_default).map((f) => f.name));
          setDefaultFolders(defSet);

          const colors: Record<string, string> = {};
          const typedFolders: FolderItem[] = [];
          const parentsToExpand = new Set<string>();

          for (const raw of customFoldersData || []) {
            const f = raw as {
              id: string;
              name: string;
              color?: string | null;
              is_default?: boolean;
              parent_id?: string | null;
            };
            if (f.name && f.color) {
              colors[f.name] = f.color;
            }
            if (f.id && f.name) {
              typedFolders.push({
                id: f.id,
                name: f.name,
                parent_id: f.parent_id || null,
                color: f.color,
                is_default: !!f.is_default,
              });
              if (f.parent_id) {
                parentsToExpand.add(f.parent_id);
              }
            }
          }
          setFolderColors(colors);
          setFolderItems(typedFolders);
          setExpandedFolders((prev) => new Set([...Array.from(prev), ...Array.from(parentsToExpand)]));
          setFolders(
            uniqueFolders.sort((a, b) => {
              if (a === defaultName || b === defaultName) return a === defaultName ? -1 : 1;
              const orderA = orderByName.get(a) ?? Number.MAX_SAFE_INTEGER;
              const orderB = orderByName.get(b) ?? Number.MAX_SAFE_INTEGER;
              return orderA !== orderB ? orderA - orderB : a.localeCompare(b);
            })
          );
        }
      } catch (err) {
        console.warn("Failed to load workspace folders:", err);
      }
    })();

    return () => {
      active = false;
    };
  }, [activeWsId]);

  const rootFolders = useMemo(() => {
    const knownNames = new Set(folderItems.map((f) => f.name));
    const extraRoots: FolderItem[] = folders
      .filter((name) => !knownNames.has(name))
      .map((name) => ({
        id: `extra-${name}`,
        name,
        parent_id: null,
        is_default: defaultFolders.has(name),
      }));

    const idSet = new Set(folderItems.map((f) => f.id));
    const roots = folderItems.filter(
      (f) => !f.parent_id || !idSet.has(f.parent_id),
    );
    return [...roots, ...extraRoots];
  }, [folderItems, folders, defaultFolders]);

  const childrenByParentId = useMemo(() => {
    const map = new Map<string, FolderItem[]>();
    for (const f of folderItems) {
      if (f.parent_id) {
        const list = map.get(f.parent_id) || [];
        list.push(f);
        map.set(f.parent_id, list);
      }
    }
    return map;
  }, [folderItems]);

  useEffect(() => {
    if (!currentFolder || folderItems.length === 0) return;
    const currentItem = folderItems.find((f) => f.name === currentFolder);
    if (currentItem?.parent_id) {
      setExpandedFolders((prev) => {
        const next = new Set(prev);
        let pId: string | null = currentItem.parent_id;
        while (pId) {
          next.add(pId);
          const parent = folderItems.find((f) => f.id === pId);
          pId = parent?.parent_id || null;
        }
        return next;
      });
    }
  }, [currentFolder, folderItems]);

  if (session.loading) {
    return <PageLoader message={t("layout.loading")} fullScreen />;
  }

  if (!session.user && session.suspended) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full bg-subtle border border-border rounded-xl p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400">
            <Icon icon="lucide:ban" className="w-7 h-7" />
          </div>
          <h1 className="text-lg font-bold text-foreground">{t("layout.accountSuspended")}</h1>
          <p className="text-sm text-muted mt-2 leading-relaxed">
            {t("layout.suspendedMsg")}
          </p>
        </div>
      </div>
    );
  }

  if (!session.loading && !session.user) {
    return <AuthRequiredCard title={t("auth.dashboardProtectedTitle")} />;
  }

  if (!session.user) {
    return null;
  }

  const currentUser = session.user;
  const isSuperAdmin = currentUser?.email?.toLowerCase().trim() === "contact.akusaraproject@gmail.com";
  const activeWs = workspaces.find((w) => w.id === activeWsId) ?? null;
  const activeWsName = activeWs?.name ?? "Personal Workspace";
  const activeMembers = members[activeWs?.id ?? ""] ?? [];

  const handleCreateFolder = async (name: string, parentId?: string | null) => {
    const trimmed = name.trim();
    if (!trimmed || !activeWsId || creatingFolder) return;

    // Check duplicate folder name (case-insensitive)
    const isDuplicate =
      folderItems.some((f) => f.name.trim().toLowerCase() === trimmed.toLowerCase()) ||
      folders.some((f) => f.trim().toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) {
      const errMsg = t("layout.errFolderExists");
      setCreateFolderError(errMsg);
      showToast(errMsg, "error");
      return;
    }

    setCreatingFolder(true);
    setCreateFolderError(null);
    try {
      const targetParent = parentId !== undefined ? parentId : parentFolderId;
      const insertPayload: {
        workspace_id: string;
        name: string;
        parent_id?: string | null;
      } = {
        workspace_id: activeWsId,
        name: trimmed,
      };
      if (targetParent) {
        insertPayload.parent_id = targetParent;
      }
      const { data, error } = await supabase
        .from("workspace_folders")
        .insert(insertPayload)
        .select("id, name, is_default, sort_order, color, parent_id")
        .single();
      if (error) throw error;
      setFolders((prev) => Array.from(new Set([...prev, trimmed])).sort());
      if (data) {
        setFolderItems((prev) => [
          ...prev,
          {
            id: data.id,
            name: data.name,
            parent_id: data.parent_id || null,
            color: data.color,
            is_default: !!data.is_default,
          },
        ]);
        if (targetParent) {
          setExpandedFolders((prev) => new Set([...Array.from(prev), targetParent]));
        }
      }
      setNewFolderName("");
      setParentFolderId(null);
      setCreateFolderModalOpen(false);
      showToast(t("layout.folderCreated", { name: trimmed }), "success");
    } catch (err) {
      console.warn("Failed to create folder:", err);
      setCreateFolderError(t("layout.errCreateFolder"));
      showToast(t("layout.folderCreateFailedToast"), "error");
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleCreateProject = async (name: string) => {
    if (!name || !activeWsId || creatingProject) return;
    setCreatingProject(true);
    setCreateProjectError(null);
    try {
      const { data, error } = await supabase.rpc("create_project", {
        p_workspace_id: activeWsId,
        p_name: name,
        p_description: "",
      });
      if (error) throw error;
      const created = Array.isArray(data) ? data[0] : data;
      if (created?.id) {
        setProjects((prev) => [...prev, { id: created.id, name: created.name, description: created.description || "", is_default: !!created.is_default }].sort((a, b) => (a.is_default ? -1 : b.is_default ? 1 : a.name.localeCompare(b.name))));
      }
      setNewProjectName("");
      setCreateProjectModalOpen(false);
      showToast(t("layout.workspaceCreatedToast", { name }), "success");
    } catch (err) {
      console.warn("Failed to create project:", err);
      setCreateProjectError(t("layout.createProjectSubtitle"));
      showToast(t("layout.workspaceCreateFailedToast"), "error");
    } finally {
      setCreatingProject(false);
    }
  };

  const submitRenameProject = async () => {
    if (!projectToRename || renamingProject) return;
    const name = renameProjectName.trim();
    if (!name || name === projectToRename.name) return;
    setRenamingProject(true);
    setRenameProjectError(null);
    try {
      const { error } = await supabase.rpc("rename_project", {
        p_project_id: projectToRename.id,
        p_name: name,
        p_description: null,
      });
      if (error) throw error;
      setProjects((prev) => prev.map((p) => p.id === projectToRename.id ? { ...p, name } : p).sort((a, b) => (a.is_default ? -1 : b.is_default ? 1 : a.name.localeCompare(b.name))));
      setProjectToRename(null);
      setRenameProjectName("");
      showToast(t("layout.projectRenamedToast"), "success");
    } catch (err) {
      console.warn("Failed to rename project:", err);
      setRenameProjectError(t("layout.projectRenameFailedToast"));
      showToast(t("layout.projectRenameFailedToast"), "error");
    } finally {
      setRenamingProject(false);
    }
  };

  const submitDeleteProject = async () => {
    if (!projectToDelete || deletingProject) return;
    setDeletingProject(true);
    try {
      const { error } = await supabase.rpc("delete_project", { p_project_id: projectToDelete.id });
      if (error) throw error;
      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
      setProjectToDelete(null);
      showToast(t("layout.projectDeletedToast"), "success");
    } catch (err) {
      console.warn("Failed to delete project:", err);
      showToast(t("layout.projectDeleteFailedToast"), "error");
    } finally {
      setDeletingProject(false);
    }
  };



  const handleFolderDrop = async (targetFolder: string) => {
    const dragged = draggedFolder;
    setDraggedFolder(null);
    setDragOverFolder(null);
    if (!activeWsId || !dragged || dragged === targetFolder) return;

    const reordered = folders.filter((f) => f !== dragged);
    const targetIdx = reordered.indexOf(targetFolder);
    reordered.splice(targetIdx, 0, dragged);
    setFolders(reordered);

    try {
      const { error } = await supabase.rpc("reorder_workspace_folders", {
        p_workspace_id: activeWsId,
        p_folder_names: reordered,
      });
      if (error) throw error;
      showToast(t("layout.folderOrderSavedToast"), "success");
    } catch (err) {
      console.warn("Failed to persist folder order:", err);
      showToast(t("layout.errReorderFolder"), "error");
    }
  };

  const handleRenameFolder = (currentName: string) => {
    setFolderToRename(currentName);
    setRenameFolderNameInput(currentName);
    setRenameFolderError(null);
    setRenameFolderModalOpen(true);
  };

  const submitRenameFolder = async () => {
    if (!activeWsId || !folderToRename) return;
    const newName = renameFolderNameInput.trim();
    if (!newName || newName === folderToRename) {
      setRenameFolderModalOpen(false);
      return;
    }

    // Check duplicate folder name (case-insensitive, exclude current folder)
    const isDuplicate =
      folderItems.some(
        (f) =>
          f.name.trim().toLowerCase() === newName.toLowerCase() &&
          f.name.trim().toLowerCase() !== folderToRename.trim().toLowerCase()
      ) ||
      folders.some(
        (f) =>
          f.trim().toLowerCase() === newName.toLowerCase() &&
          f.trim().toLowerCase() !== folderToRename.trim().toLowerCase()
      );
    if (isDuplicate) {
      const errMsg = t("layout.errFolderExists");
      setRenameFolderError(errMsg);
      showToast(errMsg, "error");
      return;
    }

    try {
      // Single-source-of-truth RPC: validates the name (btrim, 1-200 chars,
      // owner-only) and renames workspace_folders + captures atomically.
      // Previously two raw .update() calls bypassed that contract.
      const { error } = await supabase.rpc("rename_workspace_folder", {
        p_workspace_id: activeWsId,
        p_old_name: folderToRename,
        p_new_name: newName,
      });
      if (error) throw error;

      // 3. Update local state
      setFolders((prev) =>
        prev.map((f) => (f === folderToRename ? newName : f)).sort()
      );
      setFolderItems((prev) =>
        prev.map((f) => (f.name === folderToRename ? { ...f, name: newName } : f))
      );
      setFolderColors((prev) => {
        const next = { ...prev };
        if (next[folderToRename]) {
          next[newName] = next[folderToRename];
          delete next[folderToRename];
        }
        return next;
      });

      // Redirect if current folder was active
      const url = new URL(window.location.href);
      if (url.searchParams.get("folder") === folderToRename) {
        router.replace(`/captures?ws=${activeWsId}&folder=${encodeURIComponent(newName)}`, { scroll: false });
      }
      setRenameFolderModalOpen(false);
      showToast(t("layout.folderRenamedToast"), "success");
    } catch (err) {
      console.warn("Failed to rename folder:", err);
      showToast(t("layout.errRenameFolder"), "error");
    }
  };

  const handleDeleteFolder = (folderName: string) => {
    if (defaultFolders.has(folderName)) {
      showToast(t("layout.defaultFolderDeleteError"), "error");
      return;
    }
    setFolderToDelete(folderName);
    setDeleteFolderModalOpen(true);
  };

  const submitDeleteFolder = async () => {
    if (!activeWsId || !folderToDelete || deletingFolder) return;
    setDeletingFolder(true);

    try {
      // Call postgres RPC to drop folder + captures, and add to deleted_drive_folders queue
      const { error } = await supabase.rpc("delete_workspace_folder", {
        p_workspace_id: activeWsId,
        p_folder_name: folderToDelete,
      });
      if (error) throw error;

      // Update local state
      setFolders((prev) => prev.filter((f) => f !== folderToDelete));
      const deletedItem = folderItems.find((f) => f.name === folderToDelete);
      const deletedId = deletedItem?.id;
      setFolderItems((prev) =>
        prev
          .filter((f) => f.name !== folderToDelete)
          .map((f) => (deletedId && f.parent_id === deletedId ? { ...f, parent_id: null } : f))
      );
      setFolderColors((prev) => {
        const next = { ...prev };
        delete next[folderToDelete];
        return next;
      });

      // Redirect to main captures if current folder was active
      const url = new URL(window.location.href);
      if (url.searchParams.get("folder") === folderToDelete) {
        router.replace(`/captures?ws=${activeWsId}`, { scroll: false });
      }

      setDeleteFolderModalOpen(false);
      showToast(t("layout.folderQueued", { name: folderToDelete }), "success");
    } catch (err) {
      console.warn("Failed to delete folder:", err);
      showToast(t("layout.errDeleteFolder"), "error");
    } finally {
      setDeletingFolder(false);
    }
  };

  const handleOpenFolderColor = (folderName: string) => {
    setFolderToColor(folderName);
    setSelectedFolderColor(folderColors[folderName] || null);
    setFolderColorModalOpen(true);
  };

  const submitFolderColor = async () => {
    if (!activeWsId || !folderToColor || savingFolderColor) return;
    setSavingFolderColor(true);
    const previousColor = folderColors[folderToColor] || null;
    const newColor = selectedFolderColor;

    // Optimistic UI update
    setFolderColors((prev) => {
      const next = { ...prev };
      if (newColor) {
        next[folderToColor] = newColor;
      } else {
        delete next[folderToColor];
      }
      return next;
    });

    try {
      const { error } = await supabase.rpc("set_workspace_folder_color", {
        p_workspace_id: activeWsId,
        p_folder_name: folderToColor,
        p_color: newColor,
      });
      if (error) throw error;
      setFolderColorModalOpen(false);
      showToast(t("layout.colorUpdated"), "success");
    } catch (err) {
      console.warn("Failed to set folder color:", err);
      // Rollback optimistic update
      setFolderColors((prev) => {
        const next = { ...prev };
        if (previousColor) {
          next[folderToColor] = previousColor;
        } else {
          delete next[folderToColor];
        }
        return next;
      });
      showToast(t("layout.errColorFolder"), "error");
    } finally {
      setSavingFolderColor(false);
    }
  };

  const handleCreateWorkspace = async (name: string) => {
    if (!name || creating) return;
    setCreating(true);
    setCreateWsError(null);
    try {
      // RPC returns either UUID directly or [{ id, name, slug }]
      const { data: rpcResult, error: wsErr } = await supabase.rpc(
        "create_workspace",
        { p_name: name }
      );
      if (wsErr) throw wsErr;

      let newId = "";
      let newSlug: string | undefined = undefined;
      if (Array.isArray(rpcResult) && rpcResult.length > 0) {
        newId = String(rpcResult[0].id);
        newSlug = rpcResult[0].slug;
      } else if (rpcResult) {
        newId = String(rpcResult);
      }

      if (!newId) throw new Error("No workspace ID returned");

      const created = {
        id: newId,
        name,
        slug: newSlug,
        owner_user_id: currentUser.id,
        created_at: new Date().toISOString(),
        role: "owner",
        member_count: 1,
      };
      setWorkspaces((prev) => [...prev, created]);
      setMembers((prev) => ({ ...prev, [created.id]: [] }));
      setActiveWsId(created.id);
      setWsParam(created.id);
      router.replace(`${pathname}?ws=${created.id}`, { scroll: false });
      setNewWsName("");
      setCreateWsModalOpen(false);
      showToast(t("layout.wsCreated"), "success");
    } catch (err) {
      console.warn("Failed to create workspace:", err);
      setCreateWsError(t("layout.wsCreateFailed"));
      showToast(t("layout.wsCreateFailedToast"), "error");
    } finally {
      setCreating(false);
    }
  };

  const handleInvite = async () => {
    const email = inviteEmail.trim();
    if (!email || !activeWsId || inviting) return;

    // SaaS Seats Limit: Free tier is capped (owner + 4). Pro+ is unlimited.
    const cap = seatLimit(currentUser.plan);
    if (cap !== null && activeMembers.length >= cap) {
      setInviteError(t("layout.seatLimit"));
      return;
    }

    setInviting(true);
    setInviteError(null);
    try {
      const { error } = await supabase.rpc("invite_member_by_email", {
        p_workspace_id: activeWsId,
        p_email: email,
      });
      if (error) throw error;
      const { data: authData } = await supabase.auth.getSession();
      if (authData.session?.access_token) {
        await fetch("/api/notifications/invite", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authData.session.access_token}`,
          },
          body: JSON.stringify({ email, workspaceId: activeWsId }),
        }).catch(() => null);
      }
      setInviteEmail("");
      setInviteModalOpen(false);
      setMembers((prev) => ({
        ...prev,
        [activeWsId]: [...(prev[activeWsId] || []), email],
      }));
      showToast(t("layout.inviteSentToast"), "success");
    } catch (err) {
      console.warn("Failed to invite member:", err);
      setInviteError(
        (err as { message?: string })?.message ||
        t("layout.errInvite")
      );
      showToast(t("layout.inviteFailedToast"), "error");
    } finally {
      setInviting(false);
    }
  };

  const toggleFolderExpand = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderFolderItemRow = (item: FolderItem, depth = 0): React.ReactNode => {
    const children = item.id ? childrenByParentId.get(item.id) || [] : [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedFolders.has(item.id);
    const folder = item.name;
    const isActiveFolder = pathname === "/captures" && currentFolder === folder;
    const activeWsRole = workspaces.find((w) => w.id === activeWsId)?.role;

    return (
      <div key={item.id || item.name} className="flex flex-col">
        <div
          draggable={activeWsRole === "owner"}
          onDragStart={() => setDraggedFolder(folder)}
          onDragOver={(e) => {
            if (!draggedFolder) return;
            e.preventDefault();
            setDragOverFolder(folder);
          }}
          onDragLeave={() => setDragOverFolder((f) => (f === folder ? null : f))}
          onDrop={(e) => {
            e.preventDefault();
            void handleFolderDrop(folder);
          }}
          onDragEnd={() => {
            setDraggedFolder(null);
            setDragOverFolder(null);
          }}
          style={{ paddingLeft: `${4 + depth * 14}px` }}
          className={`relative w-full flex items-center justify-between gap-1 pr-1 rounded-lg group/folder transition-colors ${isActiveFolder
              ? "bg-blue-50 dark:bg-blue-950/15 font-semibold"
              : "hover:bg-subtle"
            } ${dragOverFolder === folder && draggedFolder && draggedFolder !== folder ? "ring-2 ring-[#2563EB]" : ""} ${draggedFolder === folder ? "opacity-40" : ""
            }`}
        >
          <div className="flex-1 flex items-center min-w-0">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleFolderExpand(item.id, e)}
                className="w-4 h-4 shrink-0 flex items-center justify-center text-muted hover:text-foreground mr-0.5 rounded transition-transform"
                aria-label={isExpanded ? "Collapse folder" : "Expand folder"}
              >
                <Icon
                  icon={isExpanded ? "lucide:chevron-down" : "lucide:chevron-down"}
                  className={`h-3.5 w-3.5 shrink-0 transition-transform ${isExpanded ? "" : "-rotate-90"}`}
                  aria-hidden="true"
                />
              </button>
            ) : depth > 0 ? (
              <span className="w-4 shrink-0 flex items-center justify-center text-muted/50 mr-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-border" />
              </span>
            ) : null}

            <Link
              href={`/captures?ws=${activeWsId}&folder=${encodeURIComponent(folder)}`}
              onClick={() => {
                setCurrentFolder(folder);
                setSidebarOpen(false);
              }}
              className={`flex-1 flex items-center gap-2 px-1.5 py-2 text-xs truncate ${isActiveFolder
                  ? "text-[#2563EB] dark:text-[#3B82F6] font-semibold"
                  : "text-muted hover:text-foreground"
                }`}
            >
              <Icon
                icon={folderColors[folder] ? "custom:folder-filled" : "lucide:folder"}
                className={`w-3.5 h-3.5 shrink-0 ${folderColors[folder] ? "" : "text-muted"}`}
                style={
                  folderColors[folder]
                    ? { color: folderColors[folder] }
                    : undefined
                }
              />
              <span className="truncate">{folder}</span>
            </Link>
          </div>

          {/* Folder actions stay behind one menu to keep the sidebar quiet. */}
          {activeWsRole === "owner" && (
            <div className="shrink-0 pr-1" data-folder-actions>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const left =
                    typeof window !== "undefined"
                      ? Math.max(8, Math.min(rect.right + 4, window.innerWidth - 188))
                      : rect.right + 4;
                  const top =
                    typeof window !== "undefined"
                      ? Math.max(8, Math.min(rect.top, window.innerHeight - 188))
                      : rect.top;
                  setFolderMenuPos({ top, left });
                  setFolderMenuOpen((open) => (open === folder ? null : folder));
                }}
                aria-label={`${folder} actions`}
                className="flex h-6 w-6 items-center justify-center rounded-md text-slate-900 hover:bg-slate-100 hover:text-black transition-colors"
              >
                <Icon icon="lucide:more-horizontal" className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              {folderMenuOpen === folder && folderMenuPos && (
                <div
                  style={{ top: folderMenuPos.top, left: folderMenuPos.left }}
                  className="fixed z-50 w-[180px] max-w-[calc(100vw-1rem)] overflow-hidden rounded-lg border border-border bg-subtle py-1 text-xs shadow-lg"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setFolderMenuOpen(null);
                      handleRenameFolder(folder);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-left text-foreground hover:bg-subtle transition-colors"
                  >
                    <Icon icon="lucide:edit-2" className="w-3.5 h-3.5 text-muted shrink-0" />
                    <span>{t("layout.renameFolder")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFolderMenuOpen(null);
                      handleOpenFolderColor(folder);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-left text-foreground hover:bg-subtle transition-colors"
                  >
                    <Icon icon="lucide:palette" className="w-3.5 h-3.5 text-muted shrink-0" />
                    <span>{t("layout.changeColor")}</span>
                  </button>
                  {item.id && !item.id.startsWith("extra-") && (
                    <button
                      type="button"
                      onClick={() => {
                        setFolderMenuOpen(null);
                        setParentFolderId(item.id);
                        setCreateFolderError(null);
                        setNewFolderName("");
                        setCreateFolderModalOpen(true);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-left text-foreground hover:bg-subtle transition-colors"
                    >
                      <Icon icon="lucide:folder-plus" className="w-3.5 h-3.5 text-muted shrink-0" />
                      <span>{t("layout.addSubfolder")}</span>
                    </button>
                  )}
                  {!defaultFolders.has(folder) && (
                    <button
                      type="button"
                      onClick={() => {
                        setFolderMenuOpen(null);
                        handleDeleteFolder(folder);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <Icon icon="lucide:trash-2" className="w-3.5 h-3.5 shrink-0" />
                      <span>{t("layout.deleteFolderTitle")}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="flex flex-col space-y-0.5">
            {children.map((child: FolderItem) => renderFolderItemRow(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold shadow-lg"
      >
        {t("layout.skipToContent")}
      </a>
      {promoBanner && promoBanner.enabled && promoBanner.message && !promoDismissed && (() => {
        const targetPlan = promoBanner.targetPlan || promoBanner.target_plan;
        if (targetPlan && targetPlan !== "all" && currentUser && currentUser.plan !== targetPlan) {
          return null;
        }
        return (
          <div className="shrink-0 bg-[#2563EB] text-white px-4 py-2.5 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0 text-sm font-medium leading-snug text-center">
              {promoBanner.message}
            </div>
            <button
              type="button"
              aria-label={t("layout.dismissPromo")}
              onClick={() => {
                try { localStorage.setItem("BugSnap_promo_dismissed", promoBanner.message); } catch { }
                setPromoDismissed(true);
              }}
              className="shrink-0 text-white/80 hover:text-white transition-colors"
            >
              <Icon icon="lucide:x" className="w-5 h-5" />
            </button>
          </div>
        );
      })()}

      {/* Mobile drawer backdrop */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex flex-1 min-h-0 bg-background overflow-hidden">
        {/* Sidebar - hidden on settings route so settings page can render its own 2-panel layout with its own sidebar */}
        {!pathname.startsWith("/settings") && (
          <aside
            className={`w-60 border-r border-border bg-subtle shrink-0 flex flex-col h-full overflow-visible max-h-screen lg:relative lg:translate-x-0 fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
              }`}
          >
            <div className="px-5 py-5 border-b border-border flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-day.svg" alt="BugSnap" width={28} height={28} decoding="async" className="w-7 h-7 shrink-0 object-contain dark:hidden" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-dark.svg" alt="BugSnap" width={28} height={28} decoding="async" className="w-7 h-7 shrink-0 object-contain hidden dark:block" />
              <div>
                <h1 className="text-sm font-bold tracking-tight text-foreground leading-none">
                  BugSnap
                </h1>
                <p className="text-[10px] text-muted mt-1 leading-none font-medium">{t("layout.screenRecorder")}</p>
              </div>
            </div>

            <nav className="flex-1 flex flex-col min-h-0 px-3 py-3 overflow-hidden">
              <div className="space-y-1 shrink-0">
                {navItems.map((item) => {
                  const active =
                    item.href === "/captures"
                      ? pathname === "/captures" && !currentFolder
                      : pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  // Preserve the active workspace across navigation so the
                  // captures/dashboard filters keep applying.
                  const href = activeWsId ? `${item.href}?ws=${activeWsId}` : item.href;
                  return (
                    <Link
                      key={item.href}
                      href={href}
                      onClick={() => {
                        if (item.href === "/captures") {
                          setCurrentFolder(null);
                        }
                        setSidebarOpen(false);
                      }}
                      className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${active
                          ? "bg-blue-50 dark:bg-blue-950/25 text-[#2563EB] dark:text-[#3B82F6]"
                          : "text-muted hover:text-foreground hover:bg-subtle"
                        }`}
                    >
                      <Icon icon={item.icon} className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {t(item.labelKey)}
                    </Link>
                  );
                })}
              </div>

              {/* Google Drive Folders List (Sync Bridge) */}
              <div className="flex-1 flex flex-col min-h-0 pt-3 mt-2 border-t border-border/60">
                <div className="flex items-center justify-between px-3 pb-1.5 shrink-0">
                  <Link
                    href={activeWsId ? `/folders?ws=${activeWsId}` : "/folders"}
                    onClick={() => setSidebarOpen(false)}
                    className="text-[10px] font-bold uppercase tracking-wider text-muted hover:text-foreground transition-colors flex items-center gap-1.5"
                  >
                    <Icon icon="lucide:folder" className="w-3.5 h-3.5 shrink-0" />
                    {t("layout.folders")}
                  </Link>
                  {activeWsRole === "owner" && (
                    <button
                      type="button"
                      onClick={() => {
                        setParentFolderId(null);
                        setCreateFolderModalOpen(true);
                      }}
                      className="text-[10px] font-bold text-[#2563EB] dark:text-[#3B82F6] hover:underline"
                    >
                      {t("layout.create")}
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-0.5 pr-0.5">
                  {rootFolders.map((item: FolderItem) => renderFolderItemRow(item, 0))}

                  {folders.length === 0 && (
                    <div className="px-3 py-2 text-center rounded-lg border border-dashed border-border/80 mx-1 bg-subtle/30">
                      <p className="text-[10px] text-muted">{t("layout.noFolders")}</p>
                      {activeWsRole === "owner" && (
                        <button
                          onClick={() => {
                            setParentFolderId(null);
                            setCreateFolderModalOpen(true);
                          }}
                          className="text-[10px] font-semibold text-[#2563EB] dark:text-[#3B82F6] hover:underline mt-1"
                        >
                          {t("layout.createFolder")}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </nav>

            <div className="mt-auto shrink-0" />
            <DriveStorageMeter />
            <div className="px-3 py-2.5 border-t border-border/60 flex items-center justify-between shrink-0 bg-subtle">
              <HelpMenu />
              <SiteThemeToggle compact />
            </div>
          </aside>
        )}

        {/* Main content column */}
        <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
          {/* Top bar: shared AppHeader (same layout as the admin console) */}
          {!pathname.startsWith("/settings") && (
            <AppHeader
              onOpenMenu={() => setSidebarOpen(true)}
              openMenuLabel={t("layout.openMenu")}
              search={
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const q = topSearch.trim();
                  router.push(
                    `/captures${activeWsId ? `?ws=${activeWsId}` : ""}${q ? `${activeWsId ? "&" : "?"}q=${encodeURIComponent(q)}` : ""}`
                  );
                }}
              >
                <div className="relative">
                  <Icon icon="lucide:search" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" aria-hidden="true" />
                  <input
                    type="search"
                    value={topSearch}
                    onChange={(e) => setTopSearch(e.target.value)}
                    placeholder={t("dash.searchPlaceholder")}
                    className="w-full text-sm rounded-xl border border-border bg-background pl-10 pr-3 py-2.5 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 text-foreground placeholder:text-muted"
                  />
                </div>
              </form>
              }
              actions={
              <>

                {/* Notification Bell */}
                <div className="relative">
                  <button
                    data-notif-trigger
                    onClick={() => setNotifOpen((o) => !o)}
                    className="relative p-2 rounded-lg text-muted hover:text-foreground hover:bg-background transition-colors"
                    aria-label={t("layout.notifications")}
                  >
                    <Icon icon="lucide:bell" className="w-4 h-4" />
                    {newCommentCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-md bg-[#2563EB] text-white text-[9px] font-bold flex items-center justify-center">
                        {newCommentCount > 99 ? "99+" : newCommentCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div
                      ref={notifMenuRef}
                      data-notif-menu
                      className="absolute right-0 top-full mt-2 z-[70] w-72 rounded-xl border border-border bg-subtle shadow-2xl py-2 px-1 max-h-80 overflow-y-auto"
                    >
                      <div className="flex items-center justify-between px-3 py-1 mb-1 border-b border-border/50 pb-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{t("layout.notifications")}</p>
                        {notifications.length > 0 && (
                          <button
                            onClick={handleClearNotifications}
                            className="text-[10px] font-semibold text-[#2563EB] dark:text-[#3B82F6] hover:underline"
                          >
                            {t("layout.clearAll")}
                          </button>
                        )}
                      </div>
                      {notifications.length > 0 ? (
                        <div className="space-y-0.5">
                          {notifications.map((n) => {
                            const isRead = readIds.has(n.capture_id);
                            return (
                              <div
                                key={n.comment_id}
                                className={`px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer ${isRead
                                    ? "text-muted hover:bg-subtle"
                                    : "text-foreground bg-blue-50 dark:bg-blue-950/25 hover:bg-blue-100 dark:hover:bg-blue-950/40 font-medium"
                                  }`}
                                onClick={() => {
                                  markRead(n.capture_id);
                                  setNotifOpen(false);
                                  router.push(`/v/${n.capture_id}`);
                                }}
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <Icon icon={isRead ? "lucide:message-square" : "lucide:circle"} className={`w-3.5 h-3.5 shrink-0 ${isRead ? "text-muted" : "text-emerald-500 fill-emerald-500"}`} />
                                  <p className="truncate font-semibold text-[11px] flex-1">
                                    {n.capture_title || "Untitled capture"}
                                  </p>
                                  <span className="text-[9px] text-muted shrink-0">
                                    {new Date(n.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                                  </span>
                                </div>
                                <p className="truncate text-[10px] text-muted pl-4 mt-0.5">
                                  {n.body || "New comment"}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="px-3 py-4 text-center">
                          <p className="text-xs text-muted/60">{t("layout.noNotifications")}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Account / Workspace Dropdown */}
                <div ref={workspaceMenuRef} className="relative">
                  <button
                    data-ws-trigger
                    onClick={() => setWsOpen((o) => !o)}
                    className="flex items-center gap-2 p-1 pr-1.5 rounded-full hover:bg-background transition-colors"
                  >
                    {isRealAvatar(currentUser.avatar) ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full object-cover shrink-0 border border-border"
                      />
                    ) : (
                      <span className="w-8 h-8 rounded-full bg-[#2563EB] text-white text-xs font-semibold flex items-center justify-center shrink-0">
                        {initialOf(currentUser.name)}
                      </span>
                    )}
                    <Icon icon="lucide:chevron-down" className={`w-3.5 h-3.5 text-muted transition-transform ${wsOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                  </button>

                  {wsOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={closeWorkspaceMenus} />
                      <div data-ws-menu className="absolute right-0 top-[calc(100%+8px)] z-50 w-72 rounded-2xl border border-border bg-subtle shadow-xl overflow-visible">
                        <div className="px-4 py-3 flex items-center justify-between gap-2 border-b border-border">
                          <p className="text-xs font-medium text-foreground truncate min-w-0">{currentUser.email || activeWs?.name || "Workspace"}</p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted shrink-0">{tierLabel(currentUser.plan)}</span>
                        </div>

                        <Link
                          href={activeWsId ? `/settings?ws=${activeWsId}` : "/settings"}
                          onClick={() => setWsOpen(false)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-subtle transition-colors border-b border-border"
                        >
                          <Icon icon="lucide:settings" className="w-4 h-4 text-muted shrink-0" />
                          {t("nav.settings")}
                        </Link>

                        <div
                          className="px-4 py-3 border-b border-border relative"
                          onMouseEnter={handleWsPickerEnter}
                          onMouseLeave={handleWsPickerLeave}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              if (wsPickerTimerRef.current) {
                                clearTimeout(wsPickerTimerRef.current);
                                wsPickerTimerRef.current = null;
                              }
                              setWorkspacePickerOpen((o) => !o);
                            }}
                            className="w-full flex items-center justify-between gap-3 rounded-lg py-1 text-left text-sm font-medium text-foreground hover:bg-subtle transition-colors"
                          >
                            <span className="flex items-center gap-3">
                              <Icon icon="lucide:building-2" className="w-4 h-4 text-muted shrink-0" />
                              {t("layout.switchWorkspace")}
                            </span>
                            <Icon icon="lucide:chevron-right" className="w-4 h-4 text-muted shrink-0" aria-hidden="true" />
                          </button>
                          {workspacePickerOpen && (
                            <>
                              {/* Invisible hover bridge over the 8px (lg:ml-2) margin gap to prevent premature closure */}
                              <div
                                className="hidden lg:block absolute right-full top-0 mr-0 w-3 h-full z-[55]"
                                onMouseEnter={handleWsPickerEnter}
                                onMouseLeave={handleWsPickerLeave}
                                aria-hidden="true"
                              />
                              <div
                                onMouseEnter={handleWsPickerEnter}
                                onMouseLeave={handleWsPickerLeave}
                                className="mt-2 w-full rounded-xl border border-border bg-white dark:bg-background/95 shadow-md overflow-hidden lg:absolute lg:right-full lg:top-0 lg:mr-2 lg:mt-0 lg:w-72 lg:rounded-2xl lg:shadow-xl z-[60] before:hidden lg:before:block before:absolute before:-right-3 before:top-0 before:bottom-0 before:w-3 before:content-['']"
                              >
                                {workspaces.map((ws) => (
                                  <button
                                    key={ws.id}
                                    onClick={() => {
                                      setActiveWsId(ws.id);
                                      setWsParam(ws.id);
                                      setCurrentFolder(null);
                                      setWorkspacePickerOpen(false);
                                      setWsOpen(false);
                                      setSidebarOpen(false);
                                      router.replace(`${pathname}?ws=${ws.id}`, { scroll: false });
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors ${activeWsId === ws.id ? "bg-background dark:bg-subtle text-foreground font-semibold" : "text-foreground hover:bg-background dark:hover:bg-subtle"}`}
                                  >
                                    {ws.avatar_url && !failedWsAvatars[ws.id] ? (
                                      /* eslint-disable-next-line @next/next/no-img-element */
                                      <img
                                        src={ws.avatar_url}
                                        alt={ws.name}
                                        onError={() => setFailedWsAvatars((prev) => ({ ...prev, [ws.id]: true }))}
                                        className="w-7 h-7 rounded-lg object-cover shrink-0 bg-subtle border border-border"
                                      />
                                    ) : (
                                      <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center justify-center shrink-0">{ws.name.charAt(0)}</span>
                                    )}
                                    <span className="truncate flex-1">{ws.name}</span>
                                    <span className="text-[11px] px-2 py-0.5 rounded-md border border-border text-muted shrink-0">{tierLabel(currentUser.plan)}</span>
                                  </button>
                                ))}
                                <button
                                  onClick={() => {
                                    setWorkspacePickerOpen(false);
                                    setWsOpen(false);
                                    setSidebarOpen(false);
                                    setCreateWsModalOpen(true);
                                  }}
                                  className="w-full flex items-center gap-3 px-3 py-3 text-sm text-left text-foreground hover:bg-subtle transition-colors border-t border-border"
                                >
                                  <Icon icon="lucide:plus" className="w-4 h-4 shrink-0" />
                                  {t("layout.joinOrCreateWorkspace")}
                                </button>
                              </div>
                            </>
                          )}
                        </div>

                        {isSuperAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setWsOpen(false)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-subtle transition-colors border-t border-border"
                          >
                            <Icon icon="lucide:shield" className="w-4 h-4 text-purple-500 shrink-0" />
                            <span>{t("nav.admin")} Console</span>
                          </Link>
                        )}

                        <button
                          onClick={async () => {
                            try {
                              if (typeof window !== "undefined") {
                                window.postMessage({ source: "bugsnap-web", action: "sync_logout" }, window.location.origin);
                              }
                              localStorage.removeItem("BugSnap_notif_last_seen");
                              localStorage.removeItem("BugSnap_notif_read_ids");
                              localStorage.removeItem("BugSnap_promo_dismissed");
                              sessionStorage.removeItem("bs_drive_quota");
                            } catch { }
                            await supabase.auth.signOut();
                            window.location.assign("/");
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-subtle transition-colors ${!isSuperAdmin ? "border-t border-border" : ""}`}
                        >
                          <Icon icon="lucide:log-out" className="w-4 h-4 text-muted shrink-0" />
                          {t("nav.signOut")}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
              }
            />
          )}

          <main id="main-content" className={`flex-1 min-h-0 ${pathname.startsWith("/settings") ? "overflow-hidden" : "overflow-y-auto"}`}>{children}</main>
        </div>

        {/* Invite Modal */}
        {inviteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setInviteModalOpen(false)} />
            <div className="relative w-full max-w-sm rounded-xl bg-subtle shadow-xl border border-border p-4 sm:p-6">
              <h2 className="text-lg font-bold text-foreground mb-1">{t("layout.inviteToWorkspace")}</h2>
              <p className="text-sm text-muted mb-5">
                {t("layout.inviteDescPre")} <span className="font-semibold text-foreground">{activeWsName}</span> {t("layout.inviteDescPost")}
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-muted mb-1.5">{t("layout.emailAddress")}</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    className="w-full text-sm rounded-lg border border-border px-3 py-2.5 outline-none focus:border-[#2563EB] bg-subtle text-foreground placeholder:text-muted"
                    autoFocus
                  />
                </div>
                {inviteError && (
                  <p className="text-xs text-red-600 dark:text-red-400">{inviteError}</p>
                )}
              </div>
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-foreground hover:bg-subtle rounded-lg transition-colors"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={handleInvite}
                  disabled={!inviteEmail.trim() || inviting}
                  className="px-4 py-2 rounded-lg bg-[#89BD49] text-white text-sm font-semibold hover:bg-[#6B9A35] disabled:opacity-50 transition-colors shadow-sm shadow-[#89BD49]/25"
                >
                  {t("layout.sendInvite")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Workspace Modal */}
        {createWsModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setCreateWsModalOpen(false)} />
            <div className="relative w-full max-w-sm rounded-xl bg-subtle shadow-xl border border-border p-4 sm:p-6">
              <h2 className="text-lg font-bold text-foreground mb-1">{t("layout.createWorkspace")}</h2>
              <p className="text-sm text-muted mb-5">
                {t("layout.createWorkspaceDesc")}
              </p>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-muted mb-1.5">{t("layout.workspaceName")}</label>
                <input
                  type="text"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  placeholder="e.g. QA Team"
                  className="w-full text-sm rounded-lg border border-border px-3 py-2.5 outline-none focus:border-[#2563EB] bg-subtle text-foreground placeholder:text-muted"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newWsName.trim()) {
                      handleCreateWorkspace(newWsName.trim());
                    }
                  }}
                />
                {createWsError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1.5">{createWsError}</p>
                )}
              </div>
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => setCreateWsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-foreground hover:bg-subtle rounded-lg transition-colors"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={() => {
                    const name = newWsName.trim();
                    if (name) handleCreateWorkspace(name);
                  }}
                  disabled={!newWsName.trim() || creating}
                  className="px-4 py-2 rounded-lg bg-[#89BD49] text-white text-sm font-semibold hover:bg-[#6B9A35] disabled:opacity-50 transition-colors shadow-sm shadow-[#89BD49]/25"
                >
                  {t("layout.createWorkspace")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upgrade CTA - temporarily commented out until payment is ready:
      {billingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setBillingModalOpen(false)} />
          <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-xl bg-subtle shadow-xl border border-border p-4 sm:p-6 text-center">
            <h2 className="text-xl font-bold text-foreground mb-1">{t("layout.upgradeTitle")}</h2>
            <p className="text-sm text-muted mb-6">
              {t("layout.upgradeSub")}
            </p>

            <Link
              href="/pricing"
              onClick={() => setBillingModalOpen(false)}
              className="block w-full rounded-lg bg-[#2563EB] text-white text-sm font-semibold px-6 py-3 hover:bg-[#1D4ED8] transition-colors shadow-sm shadow-[#2563EB]/25"
            >
              {t("layout.upgradeToPro")}
            </Link>
            <p className="text-[11px] text-muted mt-3">
              {t("layout.upgradeViaPaddle")}
            </p>
          </div>
        </div>
      )}
      */}

        {/* Create Project Modal */}
        {createProjectModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setCreateProjectModalOpen(false)} />
            <div className="relative w-full max-w-sm rounded-xl bg-subtle shadow-xl border border-border p-4 sm:p-6">
              <h2 className="text-lg font-bold text-foreground mb-1">{t("layout.createProjectTitle")}</h2>
              <p className="text-sm text-muted mb-5">{t("layout.createProjectSubtitle")}</p>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-muted mb-1.5">{t("layout.projectName")}</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder={t("layout.projectNamePlaceholder")}
                  className="w-full text-sm rounded-lg border border-border px-3 py-2.5 outline-none focus:border-[#2563EB] bg-subtle text-foreground placeholder:text-muted"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newProjectName.trim()) {
                      handleCreateProject(newProjectName.trim());
                    }
                  }}
                />
                {createProjectError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1.5">{createProjectError}</p>
                )}
              </div>
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => setCreateProjectModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-foreground hover:bg-subtle rounded-lg transition-colors"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={() => handleCreateProject(newProjectName.trim())}
                  disabled={!newProjectName.trim() || creatingProject}
                  className="px-4 py-2 rounded-lg bg-[#89BD49] text-white text-sm font-semibold hover:bg-[#6B9A35] disabled:opacity-50 transition-colors shadow-sm shadow-[#89BD49]/25"
                >
                  {creatingProject ? t("layout.creating") : t("layout.createProject")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rename Project Modal */}
        {projectToRename && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setProjectToRename(null)} />
            <div className="relative w-full max-w-sm rounded-xl bg-subtle shadow-xl border border-border p-4 sm:p-6">
              <h2 className="text-lg font-bold text-foreground mb-1">{t("layout.renameProjectTitle")}</h2>
              <p className="text-sm text-muted mb-5">{t("layout.renameProjectSubtitle")}</p>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-muted mb-1.5">{t("layout.projectName")}</label>
                <input
                  type="text"
                  value={renameProjectName}
                  onChange={(e) => setRenameProjectName(e.target.value)}
                  className="w-full text-sm rounded-lg border border-border px-3 py-2.5 outline-none focus:border-[#2563EB] bg-subtle text-foreground placeholder:text-muted"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && renameProjectName.trim()) submitRenameProject();
                  }}
                />
                {renameProjectError && <p className="text-xs text-red-600 dark:text-red-400 mt-1.5">{renameProjectError}</p>}
              </div>
              <div className="flex items-center justify-end gap-3 mt-6">
                <button onClick={() => setProjectToRename(null)} className="px-4 py-2 text-sm font-medium text-foreground hover:bg-subtle rounded-lg transition-colors">{t("common.cancel")}</button>
                <button onClick={submitRenameProject} disabled={!renameProjectName.trim() || renamingProject} className="px-4 py-2 rounded-lg bg-[#89BD49] text-white text-sm font-semibold hover:bg-[#6B9A35] disabled:opacity-50 transition-colors shadow-sm shadow-[#89BD49]/25">
                  {renamingProject ? t("common.saving") : t("common.save")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Project Modal */}
        {projectToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setProjectToDelete(null)} />
            <div className="relative w-full max-w-sm rounded-xl bg-subtle shadow-xl border border-border p-4 sm:p-6 text-center">
              <h2 className="text-lg font-bold text-foreground mb-2">{t("layout.deleteProjectTitle")}</h2>
              <p className="text-xs text-muted leading-relaxed mb-6">{t("layout.deleteProjectConfirm", { name: projectToDelete.name })}</p>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button onClick={() => setProjectToDelete(null)} className="px-4 py-2 text-sm font-medium text-foreground hover:bg-subtle rounded-lg transition-colors">{t("common.cancel")}</button>
                <button onClick={submitDeleteProject} disabled={deletingProject} className="px-4 py-2 rounded-lg bg-[#89BD49] text-white text-sm font-semibold hover:bg-[#6B9A35] disabled:opacity-50 transition-colors">
                  {deletingProject ? t("layout.deleting") : t("common.delete")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Folder Modal */}
        {createFolderModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setCreateFolderModalOpen(false)} />
            <div className="relative w-full max-w-sm rounded-xl bg-subtle shadow-xl border border-border p-4 sm:p-6">
              <h2 className="text-lg font-bold text-foreground mb-1">{t("layout.createFolderTitle")}</h2>
              <p className="text-sm text-muted mb-5">
                {t("layout.createFolderDesc")}
              </p>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-muted mb-1.5">{t("layout.folderName")}</label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => {
                    setNewFolderName(e.target.value);
                    setCreateFolderError(null);
                  }}
                  placeholder="Name your folder"
                  className="w-full text-sm rounded-lg border border-border px-3 py-2.5 outline-none focus:border-[#2563EB] bg-subtle text-foreground placeholder:text-muted"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newFolderName.trim()) {
                      handleCreateFolder(newFolderName.trim(), parentFolderId);
                    }
                  }}
                />
                {createFolderError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1.5">{createFolderError}</p>
                )}
              </div>

              <div className="mt-4">
                <label className="block text-xs font-semibold uppercase tracking-widest text-muted mb-1.5">{t("layout.parentFolder")}</label>
                <Dropdown
                  value={parentFolderId || ""}
                  onChange={(val) => setParentFolderId(val || null)}
                  options={[
                    { value: "", label: t("layout.topLevelFolder") },
                    ...folderItems.map((f) => ({ value: f.id, label: f.name })),
                  ]}
                  variant="field"
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setCreateFolderModalOpen(false);
                    setParentFolderId(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-foreground hover:bg-subtle rounded-lg transition-colors"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={() => handleCreateFolder(newFolderName.trim(), parentFolderId)}
                  disabled={!newFolderName.trim() || creatingFolder}
                  className="px-4 py-2 rounded-lg bg-[#89BD49] text-white text-sm font-semibold hover:bg-[#6B9A35] disabled:opacity-50 transition-colors shadow-sm shadow-[#89BD49]/25"
                >
                  {creatingFolder ? t("layout.creating") : t("layout.createFolderTitle")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rename Folder Modal */}
        {renameFolderModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setRenameFolderModalOpen(false)} />
            <div className="relative w-full max-w-sm rounded-xl bg-subtle shadow-xl border border-border p-4 sm:p-6">
              <h2 className="text-lg font-bold text-foreground mb-1">{t("layout.renameFolder")}</h2>
              <p className="text-sm text-muted mb-5">
                {t("layout.renameFolderDesc")}
              </p>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-muted mb-1.5">{t("layout.newFolderName")}</label>
                <input
                  type="text"
                  value={renameFolderNameInput}
                  onChange={(e) => {
                    setRenameFolderNameInput(e.target.value);
                    setRenameFolderError(null);
                  }}
                  placeholder="Name your folder"
                  className="w-full text-sm rounded-lg border border-border px-3 py-2.5 outline-none focus:border-[#2563EB] bg-subtle text-foreground placeholder:text-muted"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && renameFolderNameInput.trim()) {
                      submitRenameFolder();
                    }
                  }}
                />
                {renameFolderError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1.5">{renameFolderError}</p>
                )}
              </div>
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => setRenameFolderModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-foreground hover:bg-subtle rounded-lg transition-colors"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={submitRenameFolder}
                  disabled={!renameFolderNameInput.trim() || renameFolderNameInput.trim() === folderToRename}
                  className="px-4 py-2 rounded-lg bg-[#89BD49] text-white text-sm font-semibold hover:bg-[#6B9A35] disabled:opacity-50 transition-colors shadow-sm shadow-[#89BD49]/25"
                >
                  {t("layout.saveChanges")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Folder Modal (Jira Style Popup Confirmation) */}
        {deleteFolderModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteFolderModalOpen(false)} />
            <div className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-xl bg-subtle shadow-xl border border-border p-4 sm:p-6 text-center">
              <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400">
                <Icon icon="lucide:trash-2" className="w-6 h-6" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-2">{t("layout.deleteFolderQ")}</h2>
              <p className="text-xs text-muted leading-relaxed mb-6">
                {t("layout.deleteFolderDesc", { name: folderToDelete ?? "" })}
              </p>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  onClick={() => setDeleteFolderModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-foreground hover:bg-subtle rounded-lg transition-colors"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={submitDeleteFolder}
                  disabled={deletingFolder}
                  className="px-4 py-2 rounded-lg bg-[#89BD49] text-white text-sm font-semibold hover:bg-[#6B9A35] disabled:opacity-50 transition-colors"
                >
                  {deletingFolder ? t("layout.deleting") : t("layout.deleteFolderTitle")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Folder Color Modal (Google Drive Style) */}
        {folderColorModalOpen && folderToColor && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setFolderColorModalOpen(false)} />
            <div className="relative w-full max-w-sm rounded-xl bg-subtle shadow-xl border border-border p-4 sm:p-6">
              <h2 className="text-lg font-bold text-foreground mb-1">{t("layout.folderColor")}</h2>
              <p className="text-xs text-muted mb-4">
                {t("layout.folderColorDesc")}
              </p>

              {/* Folder preview */}
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card mb-4">
                <Icon
                  icon={selectedFolderColor ? "custom:folder-filled" : "lucide:folder"}
                  className={`w-6 h-6 shrink-0 transition-colors ${selectedFolderColor ? "" : "text-muted"}`}
                  style={
                    selectedFolderColor
                      ? { color: selectedFolderColor }
                      : undefined
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{folderToColor}</p>
                  <p className="text-[11px] text-muted">
                    {selectedFolderColor
                      ? (GOOGLE_DRIVE_FOLDER_COLORS.find((c) => c.value.toLowerCase() === selectedFolderColor.toLowerCase())?.name || selectedFolderColor.toUpperCase())
                      : t("layout.defaultColor")}
                  </p>
                </div>
              </div>

              {/* Google Drive Color Grid */}
              <div className="grid grid-cols-5 gap-2.5 mb-3 justify-items-center">
                {GOOGLE_DRIVE_FOLDER_COLORS.map((c) => {
                  const isSelected = selectedFolderColor?.toLowerCase() === c.value.toLowerCase();
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setSelectedFolderColor(c.value)}
                      title={c.name}
                      aria-label={c.name}
                      className={`h-8 w-8 rounded-full flex items-center justify-center transition-all hover:scale-110 focus:outline-none ${isSelected
                          ? "ring-2 ring-offset-2 ring-foreground scale-105"
                          : "hover:ring-1 hover:ring-border"
                        }`}
                      style={{ backgroundColor: c.value }}
                    >
                      {isSelected && (
                        <Icon icon="lucide:check" className="w-4 h-4 text-white drop-shadow brightness-0 invert" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Reset to default color */}
              <div className="flex items-center justify-between pt-2 mb-5 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setSelectedFolderColor(null)}
                  className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
                >
                  <Icon icon="lucide:rotate-ccw" className="w-3.5 h-3.5" />
                  <span>{t("layout.resetColor")}</span>
                </button>
                {selectedFolderColor && (
                  <span className="text-[11px] font-mono text-muted uppercase">
                    {selectedFolderColor}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setFolderColorModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-foreground hover:bg-subtle rounded-lg transition-colors"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={submitFolderColor}
                  disabled={savingFolderColor}
                  className="px-4 py-2 rounded-lg bg-[#89BD49] text-white text-sm font-semibold hover:bg-[#6B9A35] disabled:opacity-50 transition-colors shadow-sm shadow-[#89BD49]/25"
                >
                  {savingFolderColor ? t("layout.saving") : t("layout.saveChanges")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Customer Support Floating Widget */}
        <FloatingSupport />
      </div>
    </div>
  );
}
