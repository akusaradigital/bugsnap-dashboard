"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useT } from "@/components/I18nProvider";
import { useToast } from "@/components/Toast";
import { normalizePlan, seatLimit, tierLabel, type Plan } from "@/lib/tiers";
import { AuthRequiredCard } from "@/components/AuthRequiredCard";

const navItems = [
  { labelKey: "nav.dashboard", href: "/dashboard", icon: "📊" },
  { labelKey: "nav.captures", href: "/captures", icon: "▦" },
];

type Workspace = {
  id: string;
  name: string;
  slug?: string;
  owner_user_id: string | null;
  created_at: string;
  role: string;
  member_count: number;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useT();
  const { showToast } = useToast();
  const [wsParam, setWsParam] = useState<string | null>(null);
  const [wsOpen, setWsOpen] = useState(false);
  const [workspacePickerOpen, setWorkspacePickerOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [promoBanner, setPromoBanner] = useState<{ enabled: boolean; message: string } | null>(null);
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
  const [, setProjects] = useState<{ id: string; name: string; description: string; is_default: boolean }[]>([]);
  const [folderMenuOpen, setFolderMenuOpen] = useState<string | null>(null);
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
  
  const [deleteFolderModalOpen, setDeleteFolderModalOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
  const [deletingFolder, setDeletingFolder] = useState(false);

  // Custom Rename & Delete Workspace Modal states

  const [session, setSession] = useState<{
    loading: boolean;
    user: null | { id: string; email: string; name: string; avatar: string; plan: Plan };
    suspended?: boolean;
  }>({ loading: true, user: null });
  const [billingModalOpen, setBillingModalOpen] = useState(false);
  const [newCommentCount, setNewCommentCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLastSeen, setNotifLastSeen] = useState<number>(() => {
    try {
      return Number(localStorage.getItem("BugSnap_notif_last_seen") || 0);
    } catch {
      return 0;
    }
  });

  // In-app notification: count comments on this user's captures posted
  // after last-seen (or within the last 7 days if never seen).
  useEffect(() => {
    const email = session.user?.email;
    if (!email) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const lastSeenMs = notifLastSeen || Date.now() - 7 * 24 * 60 * 60 * 1000;
        const since = new Date(lastSeenMs).toISOString();
        // One SECURITY DEFINER RPC joins comments to the caller's captures and
        // checks EXISTS() for rows newer than `since` - no unbounded
        // fetch-every-id + oversized .in() on every 60s tick (T-022). The
        // badge only needs "new or not", so the RPC returns boolean and the
        // index scan stops at the first match.
        const { data: hasNew, error } = await supabase.rpc("count_unseen_comments", { p_since: since });
        if (error) throw error;
        if (!cancelled) setNewCommentCount(hasNew ? 1 : 0);
      } catch (error) {
        console.warn("Failed to load notifications:", error);
      }
    };
    poll();
    const t = setInterval(poll, 60_000);
    return () => { cancelled = true; clearInterval(t); };
  }, [session.user?.email, notifLastSeen]);

  // Mark all notifications as read
  const handleClearNotifications = () => {
    const now = Date.now();
    setNotifLastSeen(now);
    setNewCommentCount(0);
    setNotifOpen(false);
    try {
      localStorage.setItem("BugSnap_notif_last_seen", String(now));
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
        const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        router.replace(`/login?redirectTo=${encodeURIComponent(current || "/dashboard")}`);
        return;
      }
      const meta = u.user_metadata || {};
      const userEmail = u.email || "";
      
      // Read the plan from public.users (source of truth updated by the
      // Stripe webhook) so upgrades take effect immediately without re-login.
      let dbPlan: Plan = normalizePlan(meta.plan);
      let suspended = false;
      if (userEmail) {
        const { data: userRow } = await supabase
          .from("users")
          .select("plan, suspended")
          .ilike("email", userEmail)
          .maybeSingle();
        // users.plan is the source of truth (Stripe webhook writes it). Fall
        // back to auth metadata only as a bootstrap for pre-webhook accounts.
        if (userRow?.plan) dbPlan = normalizePlan(userRow.plan);
        if (userRow?.suspended) suspended = true;
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
          name: meta.full_name || meta.name || userEmail?.split("@")[0] || "User",
          avatar: meta.avatar_url || meta.picture || "",
          plan: dbPlan,
        },
      });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!active) return;
      if (!s) {
        const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        router.replace(`/login?redirectTo=${encodeURIComponent(current || "/dashboard")}`);
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  // Read ?ws= from the URL without useSearchParams (avoids the
  // suspense-boundary requirement for prerendered layouts).
  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      setWsParam(url.searchParams.get("ws"));
    }
  }, []);

  // Load the user's workspaces (owned or invited) via the RLS-safe RPC
  // once the session resolves. Falls back to the default single-workspace
  // view if the fetch fails so the sidebar never goes blank.
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
            router.replace(`${pathname}?ws=${rows[0].id}`, { scroll: false });
          }
        }

        if (!active) return;
        setWorkspaces(rows);
        // Initialize from the URL ?ws= param when valid, else first workspace.
        const initialWs =
          wsParam && rows.some((w) => w.id === wsParam)
            ? wsParam
            : rows[0]?.id ?? null;
        setActiveWsId(initialWs);
        if (!wsParam && initialWs) {
          router.replace(`${pathname}?ws=${initialWs}`, { scroll: false });
        }
      } catch (err) {
        console.warn("Failed to load workspaces:", err);
        // Degrade gracefully: the default "Personal Workspace" view (no
        // members) stays in place.
      }
    })();

    return () => {
      active = false;
    };
  }, [session.user?.id, wsParam, pathname, router]);

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

  // Check if current user is a super admin
  useEffect(() => {
    if (!session.user?.id) {
      setIsSuperAdmin(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        const { data: authData } = await supabase.auth.getSession();
        const token = authData.session?.access_token;
        if (!token) return;
        const res = await fetch("/api/admin/check", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (active) {
          setIsSuperAdmin(Boolean(json.isAdmin));
        }
      } catch {
        // ignore - admin link simply won't show
      }
    })();
    return () => { active = false; };
  }, [session.user?.id, session.user?.email]);

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
      } catch {}
    })();
    return () => { active = false; };
  }, []);

  // Load the list of unique folders for the active workspace
  useEffect(() => {
    if (!activeWsId) return;
    let active = true;

    (async () => {
      try {
        // 1. Fetch folders that have captures
        const { data: capturesData, error: capturesErr } = await supabase
          .from("captures")
          .select("folder_name")
          .eq("workspace_id", activeWsId)
          .not("folder_name", "is", null);

        if (capturesErr) throw capturesErr;

        // 2. Fetch custom created folders in workspace (legacy surface)
        const { data: customFoldersData, error: customFoldersErr } = await supabase
          .from("workspace_folders")
          .select("name, is_default")
          .eq("workspace_id", activeWsId);

        if (customFoldersErr) throw customFoldersErr;

        // 3. Fetch projects in workspace (new surface)
        const { data: projectsData, error: projectsErr } = await supabase
          .rpc("get_workspace_projects", { p_workspace_id: activeWsId });
        if (projectsErr) throw projectsErr;
        
        // Deduplicate folder names from both sources
        const allFolderNames = [
          ...(capturesData || []).map((c) => c.folder_name),
          ...(customFoldersData || []).map((f) => f.name)
        ].filter(Boolean) as string[];

        const uniqueFolders = Array.from(new Set(allFolderNames));
        const defaultName = (customFoldersData || []).find((folder) => folder.is_default)?.name;

        if (active) {
          const typedProjects = (projectsData || []) as { id: string; name: string; description?: string | null; is_default?: boolean }[];
          setProjects(typedProjects.map((p) => ({ id: p.id, name: p.name, description: p.description || "", is_default: !!p.is_default })));
          setFolders(uniqueFolders.sort((a, b) => a === defaultName ? -1 : b === defaultName ? 1 : a.localeCompare(b)));
        }
      } catch (err) {
        console.warn("Failed to load workspace folders:", err);
      }
    })();

    return () => {
      active = false;
    };
  }, [activeWsId]);

  if (session.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" aria-hidden="true" />
          <p className="text-sm text-muted">{t("layout.loading")}</p>
        </div>
      </div>
    );
  }

  if (!session.user && session.suspended) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full bg-subtle border border-border rounded-xl p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
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
    return <AuthRequiredCard title="404 - Dashboard Access Protected" />;
  }

  if (!session.user) {
    return null;
  }

  const currentUser = session.user;
  const activeWs = workspaces.find((w) => w.id === activeWsId) ?? null;
  const activeWsName = activeWs?.name ?? "Personal Workspace";
  const activeMembers = members[activeWs?.id ?? ""] ?? [];

  const handleCreateFolder = async (name: string) => {
    if (!name || !activeWsId || creatingFolder) return;
    setCreatingFolder(true);
    setCreateFolderError(null);
    try {
      const { error } = await supabase
        .from("workspace_folders")
        .insert({ workspace_id: activeWsId, name: name.trim() });
      if (error) throw error;
      setFolders((prev) => Array.from(new Set([...prev, name.trim()])).sort());
      setNewFolderName("");
      setCreateFolderModalOpen(false);
    } catch (err) {
      console.warn("Failed to create folder:", err);
      setCreateFolderError("Could not create folder. Maybe it already exists?");
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
    } catch (err) {
      console.warn("Failed to create project:", err);
      setCreateProjectError("Could not create project. Maybe it already exists?");
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
    } catch (err) {
      console.warn("Failed to rename project:", err);
      setRenameProjectError("Could not rename project.");
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
    } catch (err) {
      console.warn("Failed to delete project:", err);
      showToast("Could not delete project", "error");
    } finally {
      setDeletingProject(false);
    }
  };



  const handleRenameFolder = (currentName: string) => {
    setFolderToRename(currentName);
    setRenameFolderNameInput(currentName);
    setRenameFolderModalOpen(true);
  };

  const submitRenameFolder = async () => {
    if (!activeWsId || !folderToRename) return;
    const newName = renameFolderNameInput.trim();
    if (!newName || newName === folderToRename) {
      setRenameFolderModalOpen(false);
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
      
      // Redirect if current folder was active
      const url = new URL(window.location.href);
      if (url.searchParams.get("folder") === folderToRename) {
        router.replace(`/captures?ws=${activeWsId}&folder=${encodeURIComponent(newName)}`, { scroll: false });
      }
      setRenameFolderModalOpen(false);
    } catch (err) {
      console.warn("Failed to rename folder:", err);
        showToast(t("layout.errRenameFolder"), "error");
    }
  };

  const handleDeleteFolder = (folderName: string) => {
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

  const handleCreateWorkspace = async (name: string) => {
    if (!name || creating) return;
    setCreating(true);
    setCreateWsError(null);
    try {
      // RPC returns the new workspace UUID directly.
      const { data: newWsId, error: wsErr } = await supabase.rpc(
        "create_workspace",
        { p_name: name }
      );
      if (wsErr) throw wsErr;
      const created = {
        id: String(newWsId),
        name,
        slug: undefined,
        owner_user_id: currentUser.id,
        created_at: new Date().toISOString(),
        role: "owner",
        member_count: 1,
      };
      setWorkspaces((prev) => [...prev, created]);
      setMembers((prev) => ({ ...prev, [created.id]: [] }));
      setActiveWsId(created.id);
      router.replace(`${pathname}?ws=${created.id}`, { scroll: false });
      setNewWsName("");
      setCreateWsModalOpen(false);
    } catch (err) {
      console.warn("Failed to create workspace:", err);
      setCreateWsError("Could not create workspace. Please try again.");
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
      await fetch("/api/notifications/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authData.session?.access_token ? { Authorization: `Bearer ${authData.session.access_token}` } : {}),
        },
        body: JSON.stringify({ email, workspaceId: activeWsId }),
      }).catch(() => null);
      setInviteEmail("");
      setInviteModalOpen(false);
      setMembers((prev) => ({
        ...prev,
        [activeWsId]: [...(prev[activeWsId] || []), email],
      }));
    } catch (err) {
      console.warn("Failed to invite member:", err);
      setInviteError(
        (err as { message?: string })?.message ||
          t("layout.errInvite")
      );
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {promoBanner && promoBanner.enabled && promoBanner.message && !promoDismissed && (
        <div className="shrink-0 bg-indigo-600 text-white px-4 py-2.5 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0 text-sm font-medium leading-snug text-center">
            {promoBanner.message}
          </div>
          <button
            type="button"
            aria-label={t("layout.dismissPromo")}
            onClick={() => {
              try { localStorage.setItem("BugSnap_promo_dismissed", promoBanner.message); } catch {}
              setPromoDismissed(true);
            }}
            className="shrink-0 text-white/80 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </div>
      )}
      {/* Mobile top bar */}
      <header className="lg:hidden shrink-0 border-b border-border bg-subtle flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2.5 rounded-lg text-muted hover:text-foreground hover:bg-subtle transition-colors"
          aria-label="Open menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <a href="/dashboard" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="BugSnap" className="w-6 h-6 object-contain" />
          <span className="text-sm font-bold tracking-tight">BugSnap</span>
        </a>
        <button
          onClick={() => setNotifOpen((o) => !o)}
          className="relative p-2.5 rounded-lg text-muted hover:text-foreground hover:bg-subtle transition-colors"
          aria-label={t("layout.notifications")}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {newCommentCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
              {newCommentCount}
            </span>
          )}
        </button>
      </header>

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
          className={`w-60 border-r border-border bg-subtle shrink-0 flex flex-col h-full overflow-visible max-h-screen lg:relative lg:translate-x-0 fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
        <div className="px-5 py-5 border-b border-border flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="BugSnap" className="w-7 h-7 shrink-0 object-contain" />
          <div>
            <h1 className="text-sm font-bold tracking-tight text-foreground leading-none">
              BugSnap
            </h1>
            <p className="text-[10px] text-muted mt-1 leading-none font-medium">{t("layout.screenRecorder")}</p>
          </div>

          {/* Notification Bell */}
          <div className="relative ml-auto hidden lg:block">
            <button
              onClick={() => setNotifOpen((o) => !o)}
              className="relative p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-subtle transition-colors"
              aria-label={t("layout.notifications")}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {newCommentCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {newCommentCount > 99 ? "99+" : newCommentCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <>
                {/* Click-catcher that closes the dropdown without blocking page scroll */}
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} onWheel={() => setNotifOpen(false)} />
                <div className="fixed left-4 top-16 z-50 w-64 rounded-xl border border-border bg-subtle shadow-xl py-2 px-1">
                  <div className="flex items-center justify-between px-3 py-1 mb-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{t("layout.notifications")}</p>
                    {newCommentCount > 0 && (
                      <button
                        onClick={handleClearNotifications}
                        className="text-[10px] font-semibold text-indigo-600 hover:underline"
                      >
                        {t("layout.clearAll")}
                      </button>
                    )}
                  </div>
                  {newCommentCount > 0 ? (
                    <div
                      className="px-3 py-2 text-xs text-foreground cursor-pointer hover:bg-subtle rounded-lg transition-colors"
                      onClick={() => {
                        handleClearNotifications();
                        router.push("/captures");
                      }}
                    >
                      <p className="font-medium">💬 {t(newCommentCount > 1 ? "notif.newComments" : "notif.newComment", { count: newCommentCount })}</p>
                    </div>
                  ) : (
                    <div className="px-3 py-4 text-center">
                      <p className="text-xs text-muted/60">{t("layout.noNotifications")}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Workspace Switcher */}
        <div className="px-3 pt-4 relative">
          <button
            onClick={() => setWsOpen((o) => !o)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-xl border border-border bg-subtle hover:bg-subtle transition-colors text-left"
          >
            <span className="w-6 h-6 rounded-md bg-indigo-600 text-white text-[11px] font-semibold flex items-center justify-center shrink-0">
              {activeWsName.charAt(0)}
            </span>
            <span className="flex-1 truncate">{activeWsName}</span>
            <svg className={`w-3.5 h-3.5 text-muted transition-transform ${wsOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {wsOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setWsOpen(false)} />
              <div className="absolute left-3 right-3 top-[calc(100%+8px)] z-50 rounded-2xl border border-border bg-subtle shadow-xl overflow-visible">
                <div className="p-4 flex items-center gap-3 border-b border-border">
                  <span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 text-lg font-semibold flex items-center justify-center shrink-0">
                    {activeWsName.charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-base font-semibold text-foreground truncate">{activeWsName}</p>
                      <span className="text-[11px] px-2 py-0.5 rounded-md border border-border text-muted shrink-0">{tierLabel(currentUser.plan)}</span>
                    </div>
                    <p className="text-xs text-muted truncate">{currentUser.email}</p>
                  </div>
                </div>

                <Link
                  href={activeWsId ? `/settings?ws=${activeWsId}` : "/settings"}
                  onClick={() => setWsOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-subtle transition-colors border-b border-border"
                >
                  <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {t("nav.settings")}
                </Link>

                <div
                  className="px-4 py-3 border-b border-border relative"
                  onMouseEnter={() => setWorkspacePickerOpen(true)}
                  onMouseLeave={() => setWorkspacePickerOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => setWorkspacePickerOpen((o) => !o)}
                    className="w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-subtle transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Switch workspace
                    </span>
                    <svg className={`w-4 h-4 text-muted transition-transform ${workspacePickerOpen ? "rotate-90" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  {workspacePickerOpen && (
                    <>
                      <div className="absolute left-full top-0 ml-0 w-3 h-full z-[55]" />
                      <div className="absolute left-full top-0 ml-2 w-72 rounded-2xl border border-border bg-white dark:bg-background shadow-xl overflow-hidden z-[60]">
                      {workspaces.map((ws) => (
                        <button
                          key={ws.id}
                          onClick={() => {
                            setActiveWsId(ws.id);
                            setWorkspacePickerOpen(false);
                            setWsOpen(false);
                            router.replace(`?ws=${ws.id}`, { scroll: false });
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors ${activeWsId === ws.id ? "bg-subtle text-foreground font-semibold" : "text-foreground hover:bg-subtle"}`}
                        >
                          <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 text-sm font-semibold flex items-center justify-center shrink-0">{ws.name.charAt(0)}</span>
                          <span className="truncate flex-1">{ws.name}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded-md border border-border text-muted shrink-0">{tierLabel(currentUser.plan)}</span>
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          setWorkspacePickerOpen(false);
                          setWsOpen(false);
                          setCreateWsModalOpen(true);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-3 text-sm text-left text-foreground hover:bg-subtle transition-colors border-t border-border"
                      >
                        <span className="text-xl leading-none">+</span>
                        Join or create workspace
                      </button>
                    </div>
                    </>
                  )}
                </div>

                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    router.replace("/");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-subtle transition-colors"
                >
                  <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {t("nav.signOut")}
                </button>
              </div>
            </>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            // Preserve the active workspace across navigation so the
            // captures/dashboard filters keep applying.
            const href = activeWsId ? `${item.href}?ws=${activeWsId}` : item.href;
            return (
              <Link
                key={item.href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  active
                    ? "bg-subtle text-foreground"
                    : "text-muted hover:text-foreground hover:bg-subtle"
                }`}
              >
                <span className="text-base" aria-hidden="true">{item.icon}</span>
                {t(item.labelKey)}
              </Link>
            );
          })}

          {isSuperAdmin && (
            <Link
              href="/admin"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                pathname === "/admin" ? "bg-subtle text-foreground" : "text-muted hover:text-foreground hover:bg-subtle"
              }`}
            >
              <span className="text-base" aria-hidden="true">🛡️</span>
              {t("nav.admin")}
            </Link>
          )}

          {/* Google Drive Folders List (Sync Bridge) */}
          <div className="pt-4 space-y-1">
            <div className="flex items-center justify-between px-3 pb-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                </svg>
                {t("layout.folders")}
              </p>
              <button
                onClick={() => setCreateFolderModalOpen(true)}
                className="text-[10px] font-bold text-indigo-600 hover:underline"
              >
                {t("layout.create")}
              </button>
            </div>
            
            <div className="max-h-40 overflow-visible space-y-0.5">
              <Link
                href={activeWsId ? `/captures?ws=${activeWsId}` : "/captures"}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs transition-colors ${
                  pathname === "/captures" && typeof window !== "undefined" && !new URL(window.location.href).searchParams.get("folder")
                    ? "bg-indigo-50 dark:bg-indigo-950/30 font-semibold text-indigo-600 dark:text-indigo-400"
                    : "text-muted hover:bg-subtle hover:text-foreground"
                }`}
              >
                <span className="text-xs shrink-0">📂</span>
                <span className="truncate">All Captures</span>
              </Link>
              {folders.map((folder) => {
                const isActiveFolder = typeof window !== "undefined" && new URL(window.location.href).searchParams.get("folder") === folder;
                const activeWsRole = workspaces.find(w => w.id === activeWsId)?.role;
                return (
                  <div
                    key={folder}
                    className={`relative w-full flex items-center justify-between gap-1 px-1 rounded-lg group/folder transition-colors ${
                      isActiveFolder ? "bg-indigo-50 dark:bg-indigo-950/30 font-semibold" : "hover:bg-subtle"
                    }`}
                  >
                    <Link
                      href={`/captures?ws=${activeWsId}&folder=${encodeURIComponent(folder)}`}
                      className={`flex-1 flex items-center gap-2.5 px-2 py-1.5 text-xs truncate ${
                        isActiveFolder ? "text-indigo-600 font-semibold" : "text-muted hover:text-foreground"
                      }`}
                    >
                      <span className="text-xs shrink-0">📁</span>
                      <span className="truncate">{folder}</span>
                    </Link>

                    {/* Folder actions stay behind one menu to keep the sidebar quiet. */}
                    {activeWsRole === "owner" && (
                      <div className="shrink-0 pr-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setFolderMenuOpen((open) => (open === folder ? null : folder));
                          }}
                          aria-label={`${folder} actions`}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-muted hover:bg-subtle hover:text-foreground transition-colors"
                        >
                          <span aria-hidden="true">⋯</span>
                        </button>
                        {folderMenuOpen === folder && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setFolderMenuOpen(null)} />
                            <div className="absolute right-1 top-full z-50 mt-1 w-28 overflow-hidden rounded-lg border border-border bg-subtle py-1 text-xs shadow-lg">
                              <button
                                type="button"
                                onClick={() => {
                                  setFolderMenuOpen(null);
                                  handleRenameFolder(folder);
                                }}
                                className="block w-full px-3 py-2 text-left text-foreground hover:bg-subtle"
                              >
                                Rename
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setFolderMenuOpen(null);
                                  handleDeleteFolder(folder);
                                }}
                                className="block w-full px-3 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {folders.length === 0 && (
                <div className="px-3 py-2 text-center rounded-lg border border-dashed border-border/80 mx-1 bg-subtle/30">
                  <p className="text-[10px] text-muted">{t("layout.noFolders")}</p>
                  <button
                    onClick={() => setCreateFolderModalOpen(true)}
                    className="text-[10px] font-semibold text-indigo-600 hover:underline mt-1"
                  >
                    {t("layout.createFolder")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>

        <div className="mt-auto shrink-0" />
      </aside>
      )}

      {/* Main content */}
      <main className="flex-1 h-full overflow-y-auto">{children}</main>

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setInviteModalOpen(false)} />
          <div className="relative w-full max-w-sm rounded-xl bg-subtle shadow-xl border border-border p-6">
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
                  className="w-full text-sm rounded-lg border border-border px-3 py-2.5 outline-none focus:border-indigo-500 bg-subtle"
                  autoFocus
                />
              </div>
              {inviteError && (
                <p className="text-xs text-red-600">{inviteError}</p>
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
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {t("layout.sendInvite")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Workspace Modal */}
      {createWsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCreateWsModalOpen(false)} />
          <div className="relative w-full max-w-sm rounded-xl bg-subtle shadow-xl border border-border p-6">
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
                className="w-full text-sm rounded-lg border border-border px-3 py-2.5 outline-none focus:border-indigo-500 bg-subtle"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newWsName.trim()) {
                    handleCreateWorkspace(newWsName.trim());
                  }
                }}
              />
              {createWsError && (
                <p className="text-xs text-red-600 mt-1.5">{createWsError}</p>
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
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {t("layout.createWorkspace")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade CTA — read-only; upgrades activate via the Stripe webhook
          (checkout.session.completed → users.plan). No client-side plan flip. */}
      {billingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setBillingModalOpen(false)} />
          <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-xl bg-subtle shadow-xl border border-border p-6 text-center">
            <h2 className="text-xl font-bold text-foreground mb-1">{t("layout.upgradeTitle")}</h2>
            <p className="text-sm text-muted mb-6">
              {t("layout.upgradeSub")}
            </p>

            <Link
              href="/pricing"
              onClick={() => setBillingModalOpen(false)}
              className="block w-full rounded-lg bg-indigo-600 text-white text-sm font-semibold px-6 py-3 hover:bg-indigo-700 transition-colors shadow-sm"
            >
              {t("layout.upgradeToPro")}
            </Link>
            <p className="text-[11px] text-muted mt-3">
              {t("layout.upgradeViaStripe")}
            </p>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {createProjectModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCreateProjectModalOpen(false)} />
          <div className="relative w-full max-w-sm rounded-xl bg-subtle shadow-xl border border-border p-6">
            <h2 className="text-lg font-bold text-foreground mb-1">Create Project</h2>
            <p className="text-sm text-muted mb-5">Organize captures inside this workspace.</p>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-muted mb-1.5">Project name</label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g. Checkout Flow"
                className="w-full text-sm rounded-lg border border-border px-3 py-2.5 outline-none focus:border-indigo-500 bg-subtle"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newProjectName.trim()) {
                    handleCreateProject(newProjectName.trim());
                  }
                }}
              />
              {createProjectError && (
                <p className="text-xs text-red-600 mt-1.5">{createProjectError}</p>
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
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {creatingProject ? "Creating..." : "Create Project"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Project Modal */}
      {projectToRename && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setProjectToRename(null)} />
          <div className="relative w-full max-w-sm rounded-xl bg-subtle shadow-xl border border-border p-6">
            <h2 className="text-lg font-bold text-foreground mb-1">Rename Project</h2>
            <p className="text-sm text-muted mb-5">Update the project name for this workspace.</p>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-muted mb-1.5">Project name</label>
              <input
                type="text"
                value={renameProjectName}
                onChange={(e) => setRenameProjectName(e.target.value)}
                className="w-full text-sm rounded-lg border border-border px-3 py-2.5 outline-none focus:border-indigo-500 bg-subtle"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && renameProjectName.trim()) submitRenameProject();
                }}
              />
              {renameProjectError && <p className="text-xs text-red-600 mt-1.5">{renameProjectError}</p>}
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button onClick={() => setProjectToRename(null)} className="px-4 py-2 text-sm font-medium text-foreground hover:bg-subtle rounded-lg transition-colors">{t("common.cancel")}</button>
              <button onClick={submitRenameProject} disabled={!renameProjectName.trim() || renamingProject} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {renamingProject ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Project Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setProjectToDelete(null)} />
          <div className="relative w-full max-w-sm rounded-xl bg-subtle shadow-xl border border-border p-6 text-center">
            <h2 className="text-lg font-bold text-foreground mb-2">Delete Project?</h2>
            <p className="text-xs text-muted leading-relaxed mb-6">{projectToDelete.name} will be removed and captures will stay unassigned.</p>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button onClick={() => setProjectToDelete(null)} className="px-4 py-2 text-sm font-medium text-foreground hover:bg-subtle rounded-lg transition-colors">{t("common.cancel")}</button>
              <button onClick={submitDeleteProject} disabled={deletingProject} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors">
                {deletingProject ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {createFolderModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCreateFolderModalOpen(false)} />
          <div className="relative w-full max-w-sm rounded-xl bg-subtle shadow-xl border border-border p-6">
            <h2 className="text-lg font-bold text-foreground mb-1">{t("layout.createFolderTitle")}</h2>
            <p className="text-sm text-muted mb-5">
              {t("layout.createFolderDesc")}
            </p>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-muted mb-1.5">{t("layout.folderName")}</label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g. Eyden - Quaker"
                className="w-full text-sm rounded-lg border border-border px-3 py-2.5 outline-none focus:border-indigo-500 bg-subtle"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newFolderName.trim()) {
                    handleCreateFolder(newFolderName.trim());
                  }
                }}
              />
              {createFolderError && (
                <p className="text-xs text-red-600 mt-1.5">{createFolderError}</p>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setCreateFolderModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-foreground hover:bg-subtle rounded-lg transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={() => handleCreateFolder(newFolderName.trim())}
                disabled={!newFolderName.trim() || creatingFolder}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {creatingFolder ? t("layout.creating") : t("layout.createFolderTitle")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Folder Modal */}
      {renameFolderModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setRenameFolderModalOpen(false)} />
          <div className="relative w-full max-w-sm rounded-xl bg-subtle shadow-xl border border-border p-6">
            <h2 className="text-lg font-bold text-foreground mb-1">{t("layout.renameFolder")}</h2>
            <p className="text-sm text-muted mb-5">
              {t("layout.renameFolderDesc")}
            </p>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-muted mb-1.5">{t("layout.newFolderName")}</label>
              <input
                type="text"
                value={renameFolderNameInput}
                onChange={(e) => setRenameFolderNameInput(e.target.value)}
                placeholder="e.g. Eyden - Quaker"
                className="w-full text-sm rounded-lg border border-border px-3 py-2.5 outline-none focus:border-indigo-500 bg-subtle"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && renameFolderNameInput.trim()) {
                    submitRenameFolder();
                  }
                }}
              />
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
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {t("layout.saveChanges")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Folder Modal (Jira Style Popup Confirmation) */}
      {deleteFolderModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteFolderModalOpen(false)} />
          <div className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-xl bg-subtle shadow-xl border border-border p-6 text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
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
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deletingFolder ? t("layout.deleting") : t("layout.deleteFolderTitle")}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
    </div>
  );
}
