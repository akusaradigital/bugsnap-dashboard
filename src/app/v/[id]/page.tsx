"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { CapturedLogs } from "@/components/DevToolsPanel";
import Comments from "@/components/Comments";
import MediaViewer from "@/components/MediaViewer";
import { useT } from "@/components/I18nProvider";
import { useToast } from "@/components/Toast";
import { Dropdown } from "@/components/Dropdown";

const DevToolsPanel = dynamic(() => import("@/components/DevToolsPanel"), {
  ssr: false,
  loading: () => <div className="w-full lg:w-[360px] border-t lg:border-t-0 lg:border-l border-border bg-subtle animate-pulse h-[450px] lg:h-auto" />
});

interface Capture {
  id: string;
  title: string;
  type: string;
  drive_url: string | null;
  created_at: string;
  window_size?: string | null;
  description?: string | null;
  dev_logs?: CapturedLogs;
  os?: string | null;
  browser?: string | null;
  site_url?: string | null;
  workspace_id?: string | null;
  tag?: string | null;
  status?: string | null;
  allowed_domains?: string[] | null;
  allowed_ips?: string[] | null;
  burn_after_read?: boolean;
  expires_at?: string | null;
  project_id?: string | null;
  project_name?: string | null;
  source?: string | null;
  access_mode?: "public" | "members" | null;
}

const TAG_OPTIONS = ["bug", "feature-request", "wip", "design", "other"];
const STATUS_OPTIONS = ["open", "in-progress", "fixed", "closed"];

const viewCountCache = new Map<string, { value: number; expiresAt: number }>();

function driveFileId(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/[?&]id=([A-Za-z0-9_-]{10,200})/) || url.match(/\/d\/([A-Za-z0-9_-]{10,200})/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function hostnameOf(url: string | null | undefined): string {
  try {
    return new URL(url || "").hostname;
  } catch {
    return url || "-";
  }
}

function getExpiryCountdown(expiresAt: string, t: (k: string, vars?: Record<string, string | number>) => string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return t("v.expired");
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) {
    if (hours < 2) return t("v.expiresUnder1h");
    return t("v.expiresInHours", { n: hours });
  }
  const days = Math.ceil(hours / 24);
  return t("v.expiresInDays", { n: days });
}

function SingleViewContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id;
  const { t } = useT();
  const { showToast } = useToast();

  const hideDevTools = searchParams.get("devtools") === "false" || searchParams.get("embed") === "true";

  const [capture, setCapture] = useState<Capture | null>(null);
  const [status, setStatus] = useState<"loading" | "locked" | "expired" | "notfound" | "unauthorized_ip" | "needs_login" | "unauthorized_domain" | "ready">("loading");
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [checkingPassword, setCheckingPassword] = useState(false);
  const [viewCount, setViewCount] = useState<number | null>(null);
  const recordedViewRef = useRef<string | null>(null);

  // Modals & Popovers
  const [moveSubmenuOpen, setMoveSubmenuOpen] = useState(false);
  const moveMenuRef = useRef<HTMLDivElement>(null);
  const [capFolders, setCapFolders] = useState<string[]>([]);
  const [movingCapture, setMovingCapture] = useState(false);
  const [newFolderMode, setNewFolderMode] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [copied, setCopied] = useState(false);
  const [shareType, setShareType] = useState<"devtools" | "content">("devtools");
  const [accessMode, setAccessMode] = useState<"public" | "members">("public");
  const [accessSaving, setAccessSaving] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const accessMenuRef = useRef<HTMLDivElement>(null);
  const [deleteCaptureModalOpen, setDeleteCaptureModalOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState<"drive_trash" | "app_only">("drive_trash");
  const [deletingCapture, setDeletingCapture] = useState(false);
  const [deleteCaptureError, setDeleteCaptureError] = useState<string | null>(null);
  const [driveIssue, setDriveIssue] = useState<"not_connected" | "reconnect_required" | null>(null);
  const [deleteOperationId, setDeleteOperationId] = useState<string | null>(null);

  // Edit / Delete for internal workspace members
  const [isTeamMember, setIsTeamMember] = useState(false);
  const [isWorkspaceOwner, setIsWorkspaceOwner] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editTag, setEditTag] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editAllowedDomains, setEditAllowedDomains] = useState("");
  const [editAllowedIps, setEditAllowedIps] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Send to Aksora
  const [sendingToAksora, setSendingToAksora] = useState(false);
  const [sentToAksora, setSentToAksora] = useState(false);

  const [viewerEmail, setViewerEmail] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [brand, setBrand] = useState({ name: "BugSnap", logo: "", hideWatermark: false });

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moveSubmenuOpen && moveMenuRef.current && !moveMenuRef.current.contains(e.target as Node)) {
        setMoveSubmenuOpen(false);
        setNewFolderMode(false);
      }
      if (accessOpen && accessMenuRef.current && !accessMenuRef.current.contains(e.target as Node)) {
        setAccessOpen(false);
      }
    }
    if (moveSubmenuOpen || accessOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [moveSubmenuOpen, accessOpen]);

  // 1. Initial Access Check (Non-Login default)
  useEffect(() => {
    // Branding is a per-workspace paid feature stored in workspace_settings.
    // Legacy localStorage (BugSnap_settings) remains as a fallback for very
    // old captures/links, but the live table is the source of truth.
    try {
      const savedData = localStorage.getItem("BugSnap_settings");
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setBrand({
          name: parsed.brandName || "BugSnap",
          logo: parsed.logoUrl || "",
          hideWatermark: !!parsed.hideWatermark,
        });
      }
    } catch {}

    let cancelled = false;
    if (!id) { setStatus("notfound"); return; }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      setStatus("notfound");
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      const u = data.session?.user;
      setIsAuthenticated(!!u);
      setViewerEmail(u?.email ?? null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setIsAuthenticated(!!session?.user);
      setViewerEmail(session?.user?.email ?? null);
    });

    // 1b. Fetch live workspace branding (fire-and-forget; RLS only returns
    // rows for members, so non-members keep defaults).
    (async () => {
      try {
        const { data: wsRow } = await supabase
          .from("captures")
          .select("workspace_id")
          .eq("id", id)
          .maybeSingle();
        if (cancelled || !wsRow?.workspace_id) return;
        const { data: settingsRow } = await supabase
          .from("workspace_settings")
          .select("brand_name, custom_logo_url, hide_watermark")
          .eq("workspace_id", wsRow.workspace_id)
          .maybeSingle();
        if (cancelled) return;
        setBrand((prev) => ({
          name: settingsRow?.brand_name || prev.name,
          logo: settingsRow?.custom_logo_url || prev.logo,
          hideWatermark: prev.hideWatermark || !!settingsRow?.hide_watermark,
        }));
      } catch {
        // Keep defaults; branding is a best-effort enhancement.
      }
    })();

    supabase
      .rpc("get_public_capture", { p_id: id, p_password: null })
      .then(async ({ data, error }) => {
        if (cancelled) return;
        if (error) {
          showToast(error.message || "Failed to load capture", "error");
          setStatus("notfound");
          return;
        }
        if (!data || data.length === 0) { setStatus("notfound"); return; }

        const row = data[0] as Capture & { status: string };
        
        // Check if the user is a logged-in member to bypass password/whitelist gates
        let bypass = false;
        try {
          const { data: authData } = await supabase.auth.getSession();
          const userId = authData.session?.user?.id;
          if (userId) {
          // get_public_capture does NOT return workspace_id, so fetch it directly
          // from the captures table (member-scoped, safe via RLS).
          let wsId = row.workspace_id || null;
          if (!wsId) {
            const { data: wsData } = await supabase
              .from("captures")
              .select("workspace_id")
              .eq("id", id)
              .single();
            wsId = (wsData as { workspace_id: string } | null)?.workspace_id || null;
          }

          if (wsId) {
            const { data: members } = await supabase.rpc("get_workspace_members", {
              p_workspace_id: wsId,
            });
            const memberList = (members ?? []) as { user_id: string; role?: string }[];
            const currentMember = memberList.find((member) => member.user_id === userId);
            if (currentMember) {
              bypass = true;
              setIsTeamMember(true);
              setIsWorkspaceOwner(currentMember.role === "owner");
            }
          }
          }
        } catch {}

        if (bypass) {
          // Force bypass password/domain whitelists for authenticated workspace members.
          // Explicit column list - never `select *`: anon column grants (014) hide
          // password/expires_at from the public key, and this client only uses the
          // anonymous key, so the grant is the enforcement boundary here.
          const { data: directData } = await supabase
            .from("captures")
            .select(
              "id, title, type, drive_url, description, dev_logs, os, browser, site_url, window_size, created_at, workspace_id, tag, status, allowed_domains, allowed_ips, burn_after_read, expires_at, project_id, source, access_mode"
            )
            .eq("id", id)
            .single();
          if (directData && !cancelled) {
            setCapture(directData as Capture);
            setAccessMode(directData.access_mode === "members" ? "members" : "public");
            setStatus("ready");
          }
          return;
        }

        setAccessMode(row.access_mode === "members" ? "members" : "public");

        switch (row.status) {
          case "not_found":
            setStatus("notfound");
            break;
          case "expired":
            setStatus("expired");
            break;
          case "needs_password":
            setCapture(row);
            setStatus("locked");
            break;
          case "unauthorized_ip":
            setCapture(row);
            setStatus("unauthorized_ip");
            break;
          case "needs_login":
            setCapture(row);
            setStatus("needs_login");
            break;
          case "unauthorized_domain":
            setCapture(row);
            setStatus("unauthorized_domain");
            break;
          default:
            setCapture(row);
            setStatus("ready");
        }
      });

    const cachedView = viewCountCache.get(id);
    if (cachedView && cachedView.expiresAt > Date.now()) {
      setViewCount(cachedView.value);
    } else {
      supabase.rpc("get_view_count", { p_capture_id: id }).then(({ data }) => {
        if (!cancelled && data != null) {
          const value = Number(data);
          setViewCount(value);
          viewCountCache.set(id, { value, expiresAt: Date.now() + 60_000 });
        }
      });
    }

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
    };
  }, [id, showToast]);

  // 2. View Tracking Effect
  useEffect(() => {
    if (!id || !capture || status !== "ready") return;
    if (recordedViewRef.current === id) return;
    recordedViewRef.current = id;

    let cancelled = false;
    (async () => {
      try {
        // p_ref omitted when not logged in: anonymous viewer_key is derived
        // from the trusted client IP (014), so a referrer value must never
        // be part of the key - send it only as metadata for members.
        const { error } = await supabase.rpc("record_view", {
          p_capture_id: id,
          ...(isAuthenticated ? { p_ref: document.referrer || null } : {}),
        });
        if (error && !cancelled) recordedViewRef.current = null;
      } catch {
        if (!cancelled) recordedViewRef.current = null;
      }
    })();
    (async () => {
      try {
        const { data } = await supabase.rpc("get_view_count", { p_capture_id: id });
        if (!cancelled && typeof data === "number") {
          setViewCount(data);
          viewCountCache.set(id, { value: data, expiresAt: Date.now() + 60_000 });
        }
      } catch {}
    })();

    return () => { cancelled = true; };
  }, [id, capture, status, isAuthenticated]);

  function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordInput) return;
    setCheckingPassword(true);
    setPasswordError(false);
    supabase
      .rpc("get_public_capture", { p_id: id, p_password: passwordInput })
      .then(({ data, error }) => {
        setCheckingPassword(false);
        if (error || !data || data.length === 0) { setStatus("notfound"); return; }

        const row = data[0] as Capture & { status: string };
        setAccessMode(row.access_mode === "members" ? "members" : "public");
        if (row.status === "ok") {
          setCapture(row);
          setStatus("ready");
        } else if (row.status === "not_found") {
          setStatus("notfound");
        } else if (row.status === "expired") {
          setStatus("expired");
        } else if (row.status === "unauthorized_ip") {
          setStatus("unauthorized_ip");
        } else if (row.status === "needs_login") {
          setStatus("needs_login");
        } else if (row.status === "unauthorized_domain") {
          setStatus("unauthorized_domain");
        } else {
          setCapture(row);
          setPasswordError(true);
        }
      });
  }

  async function handleCopyLink() {
    if (!capture) return;
    try {
      const url = shareType === "content"
        ? `${window.location.origin}/v/${capture.id}?devtools=false`
        : `${window.location.origin}/v/${capture.id}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast(t("v.clipboardDenied"), "error");
    }
  }

  async function saveAccessMode(nextMode: "public" | "members") {
    if (!capture || accessSaving || nextMode === accessMode) return;
    setAccessSaving(true);
    const previous = accessMode;
    setAccessMode(nextMode);
    setCapture({ ...capture, access_mode: nextMode });
    try {
      const { error } = await supabase.from("captures").update({ access_mode: nextMode }).eq("id", capture.id);
      if (error) throw error;
      showToast(nextMode === "public" ? "Link set to public" : "Link restricted to members", "success");
    } catch {
      setAccessMode(previous);
      setCapture({ ...capture, access_mode: previous });
      showToast("Permission denied", "error");
    } finally {
      setAccessSaving(false);
      setAccessOpen(false);
    }
  }

  // Edit / Delete logic
  function openEditModal() {
    if (!capture) return;
    setEditTitle(capture.title || "");
    setEditDesc(capture.description || "");
    setEditTag(capture.tag || "");
    setEditStatus(capture.status || "open");
    setEditAllowedDomains((capture.allowed_domains || []).join(", "));
    setEditAllowedIps((capture.allowed_ips || []).join(", "));
    setEditModalOpen(true);
  }

  async function handleSaveEdit() {
    if (!capture || savingEdit) return;
    setSavingEdit(true);
    setEditError(null);
    try {
      const parsedDomains = editAllowedDomains.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
      const parsedIps = editAllowedIps.split(",").map((s) => s.trim()).filter(Boolean);

      const { data, error } = await supabase
        .from("captures")
        .update({
          title: editTitle.trim() || capture.title,
          description: editDesc.trim() || null,
          tag: editTag || null,
          status: editStatus || null,
          allowed_domains: parsedDomains.length > 0 ? parsedDomains : null,
          allowed_ips: parsedIps.length > 0 ? parsedIps : null,
        })
        .eq("id", capture.id)
        .select()
        .single();
      if (error) throw error;
      setCapture(data as Capture);
      setEditModalOpen(false);
      showToast("Capture saved", "success");
    } catch (err) {
      console.warn("Failed to save captures changes:", err);
      setEditError(t("v.saveError"));
      showToast("Save failed", "error");
    } finally {
      setSavingEdit(false);
    }
  }

  async function startDriveConnect() {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error(t("v.signInToDelete"));
    const response = await fetch("/api/google-drive/connect", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    const result = await response.json().catch(() => ({})) as { url?: string; error?: string };
    if (!response.ok || !result.url) throw new Error(result.error || "Could not start Google Drive connection");
    window.location.assign(result.url);
  }

  async function loadCapFolders() {
    if (!capture?.workspace_id) return;
    const { data } = await supabase
      .from("workspace_folders")
      .select("name")
      .eq("workspace_id", capture.workspace_id)
      .order("name");
    setCapFolders((data || []).map((r) => r.name as string));
  }

  async function handleMoveCapture(folderName: string | null) {
    if (!capture?.workspace_id || movingCapture) return;
    setMovingCapture(true);
    try {
      const { error } = await supabase.rpc("move_capture_to_workspace_folder", {
        p_capture_id: capture.id,
        p_target_workspace_id: capture.workspace_id,
        p_target_folder_name: folderName,
      });
      if (error) throw error;
      setMoveSubmenuOpen(false);
      setNewFolderMode(false);
      showToast(folderName ? `Moved to "${folderName}"` : "Removed from folder", "success");
    } catch (err) {
      console.warn("Failed to move capture:", err);
      showToast("Move failed", "error");
    } finally {
      setMovingCapture(false);
    }
  }

  async function handleCreateFolderAndMove() {
    const name = newFolderName.trim();
    if (!name || !capture?.workspace_id) return;
    try {
      const { error } = await supabase.from("workspace_folders").insert({ workspace_id: capture.workspace_id, name });
      if (error) throw error;
      setCapFolders((prev) => Array.from(new Set([...prev, name])).sort());
      setNewFolderName("");
      await handleMoveCapture(name);
    } catch (err) {
      console.warn("Failed to create folder:", err);
      showToast("Folder create failed", "error");
    }
  }

  function handleDeleteCapture() {
    if (!capture || !isWorkspaceOwner) return;
    setDeleteMode("drive_trash");
    setDeleteCaptureError(null);
    setDriveIssue(null);
    setDeleteOperationId(crypto.randomUUID());
    setDeleteCaptureModalOpen(true);
  }

  async function submitDeleteCapture() {
    if (!capture || !isWorkspaceOwner || deletingCapture || !deleteOperationId) return;
    setDeletingCapture(true);
    setDeleteCaptureError(null);
    setDriveIssue(null);
    try {
      const { data, error } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (error || !token) throw new Error(t("v.signInToDelete"));

      const response = await fetch("/api/google-drive/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ captureIds: [capture.id], mode: deleteMode, operationId: deleteOperationId }),
      });
      const result = await response.json().catch(() => ({})) as {
        results?: Array<{ captureId: string; ok: boolean; outcome?: string; driveOutcome?: "trashed" | "kept" | "unknown"; error?: string }>;
        error?: string;
        code?: string;
      };
      const captureResult = result.results?.find((item) => item.captureId === capture.id);
      if (captureResult?.ok) {
        setDeleteCaptureModalOpen(false);
        setDeleteOperationId(null);
        showToast("Capture deleted", "success");
        router.push("/captures");
        return;
      }

      const issue = result.code === "DRIVE_RECONNECT_REQUIRED"
        ? "reconnect_required"
        : response.status === 409 || /drive.*not connected/i.test(result.error || "")
        ? "not_connected"
        : null;
      if (issue) {
        setDriveIssue(issue);
        throw new Error(issue === "reconnect_required" ? t("cap.driveReconnectRequired") : t("v.driveNotConnected"));
      }
      const detail = captureResult?.error
        ? `${captureResult.error}${captureResult.driveOutcome ? ` (${captureResult.driveOutcome === "trashed" ? "Drive file trashed" : captureResult.driveOutcome === "kept" ? "Drive file kept" : "Drive state unknown"})` : ""}`
        : null;
      throw new Error(detail || result.error || t("v.deleteFailed"));
    } catch (err) {
      console.warn("Failed to delete capture:", err);
      setDeleteCaptureError(err instanceof Error ? err.message : t("v.deleteFailed"));
      showToast("Delete failed", "error");
    } finally {
      setDeletingCapture(false);
    }
  }

  function handleDownloadDirectMedia() {
    if (!capture?.drive_url) return;
    const fileId = driveFileId(capture.drive_url);
    if (!fileId) return;
    window.location.href = `/api/google-drive/download?id=${encodeURIComponent(fileId)}&type=${capture.type === "video" ? "video" : "screenshot"}&filename=${encodeURIComponent(capture.title || "capture")}`;
  }

  async function handleSendToAksora() {
    if (!capture?.id || sendingToAksora) return;
    setSendingToAksora(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch(`/api/captures/${capture.id}/send-to-aksora`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to create task in Aksora");
      }
      setSentToAksora(true);
      showToast(data.message || "Task created in Aksora!", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to send to Aksora", "error");
    } finally {
      setSendingToAksora(false);
    }
  }

  return (
    <div className="h-screen bg-white dark:bg-background flex flex-col font-sans overflow-y-auto lg:overflow-hidden">
      <header className="h-16 border-b border-border px-6 flex items-center justify-between shrink-0 bg-white dark:bg-background">
        <Link href={isTeamMember ? "/dashboard" : "/"} className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          {brand.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logo} alt={brand.name} className="h-8 w-auto object-contain" />
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon.svg" alt="BugSnap" className="w-8 h-8 shrink-0 object-contain" />
              <div>
                <span className="text-sm font-bold tracking-tight text-foreground leading-none block">{brand.name}</span>
                {!brand.hideWatermark && <span className="text-[10px] text-muted leading-none font-medium block">Dashboard</span>}
              </div>
            </>
          )}
        </Link>
        {isTeamMember && (
          <Link
            href="/captures"
            className="px-4 py-2 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-subtle flex items-center gap-2 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {t("v.backToDashboard")}
          </Link>
        )}
      </header>

      {status !== "ready" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          {status === "loading" && (
            <div className="w-full max-w-5xl flex flex-col gap-6 animate-pulse">
              <div className="h-[clamp(16rem,40vh,28rem)] sm:h-[clamp(28rem,72vh,60rem)] bg-subtle rounded-2xl border border-border/70" />
              <div className="h-40 bg-subtle rounded-xl border border-border/70" />
            </div>
          )}

          {status === "notfound" && (
            <div className="text-center max-w-sm">
              <svg className="w-12 h-12 mx-auto text-muted/40 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h1 className="text-lg font-semibold text-foreground">{t("v.notFoundTitle")}</h1>
              <p className="text-sm text-muted mt-1 mb-4">{t("v.notFoundHint")}</p>
              <Link href="/" className="text-sm text-indigo-600 font-medium hover:underline">{t("v.loginToBugSnap")}</Link>
            </div>
          )}

          {status === "expired" && (
            <div className="text-center max-w-sm">
              <svg className="w-12 h-12 mx-auto text-muted/40 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h1 className="text-lg font-semibold text-foreground">{t("v.expiredTitle")}</h1>
              <p className="text-sm text-muted mt-1 mb-4">{t("v.expiredHint")}</p>
              <Link href="/" className="text-sm text-indigo-600 font-medium hover:underline">{t("v.loginToBugSnap")}</Link>
            </div>
          )}

          {status === "unauthorized_ip" && (
            <div className="text-center max-w-sm">
              <h1 className="text-lg font-semibold text-foreground">{t("v.accessRestricted")}</h1>
              <p className="text-sm text-muted mt-1">{t("v.ipNotAuthorized")}</p>
            </div>
          )}

          {status === "needs_login" && (
            <div className="text-center max-w-sm">
              <h1 className="text-lg font-semibold text-foreground">{t("v.loginRequired")}</h1>
              <p className="text-sm text-muted mt-1 mb-6">{accessMode === "members" ? "Only workspace members can view this capture." : t("v.domainRestricted")}</p>
              <a href="/" className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold">{t("v.signIn")}</a>
            </div>
          )}

          {status === "unauthorized_domain" && (
            <div className="text-center max-w-sm">
              <h1 className="text-lg font-semibold text-foreground">{t("v.accessDenied")}</h1>
              <p className="text-sm text-muted mt-1">{t("v.domainNotAuthorized")}</p>
            </div>
          )}

          {status === "locked" && (
            <div className="w-full max-w-sm text-center">
              <h1 className="text-lg font-semibold text-foreground mb-4">{t("v.passwordProtected")}</h1>
              <form onSubmit={submitPassword} className="flex flex-col gap-3">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
                  placeholder={t("v.passwordPlaceholder")}
                  className={`w-full text-sm rounded-lg border px-3 py-2.5 outline-none bg-white ${passwordError ? "border-red-400" : "border-border focus:border-indigo-500"}`}
                />
                {passwordError && <p className="text-xs text-red-600 text-left">{t("v.incorrectPassword")}</p>}
                <button type="submit" disabled={checkingPassword} className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white disabled:opacity-50">
                  {checkingPassword ? t("v.unlocking") : t("v.unlock")}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {status === "ready" && capture && (
        <main className="flex-1 overflow-y-auto bg-[#fbfbfd] px-6 py-4 dark:bg-background">
          <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-3">
            <div className="flex justify-end gap-3">
              {driveFileId(capture.drive_url || null) && (
                <button type="button" onClick={handleDownloadDirectMedia} className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground shadow-sm hover:bg-subtle">
                  <svg className="h-4 w-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download
                </button>
              )}
              {isTeamMember && (
                <button
                  type="button"
                  disabled={sendingToAksora}
                  onClick={handleSendToAksora}
                  title="Create a new task in Aksora from this capture"
                  className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 shadow-sm hover:bg-blue-100 disabled:opacity-50 transition"
                >
                  <svg className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>
                  {sendingToAksora ? "Sending..." : sentToAksora ? "Sent to Aksora ✓" : "Send to Aksora"}
                </button>
              )}
              {isTeamMember && (
                <button type="button" onClick={openEditModal} className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground shadow-sm hover:bg-subtle">
                  <svg className="h-4 w-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                  Edit Capture
                </button>
              )}
              {isWorkspaceOwner && (
                <div ref={moveMenuRef} className="relative">
                  <button type="button" onClick={() => { setMoveSubmenuOpen((o) => !o); if (capFolders.length === 0) loadCapFolders(); }} className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground shadow-sm hover:bg-subtle">
                    <svg className="h-4 w-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></svg>
                    Move to Folder
                  </button>
                  {moveSubmenuOpen && (
                    <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-border bg-white p-1 shadow-xl">
                      <button type="button" disabled={movingCapture} onClick={() => handleMoveCapture(null)} className="w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-subtle disabled:opacity-50">No folder</button>
                      {capFolders.map((folder) => (
                        <button key={folder} type="button" disabled={movingCapture} onClick={() => handleMoveCapture(folder)} className="w-full truncate rounded-lg px-3 py-2 text-left text-xs hover:bg-subtle disabled:opacity-50">{folder}</button>
                      ))}
                      {newFolderMode ? (
                        <form onSubmit={(e) => { e.preventDefault(); handleCreateFolderAndMove(); }} className="p-2">
                          <input autoFocus value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Folder name" className="w-full rounded-md border border-border px-2 py-1 text-xs outline-none" />
                        </form>
                      ) : (
                        <button type="button" onClick={() => setNewFolderMode(true)} className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-indigo-600 hover:bg-indigo-50">+ New folder</button>
                      )}
                    </div>
                  )}
                </div>
              )}
              {isWorkspaceOwner && (
                <button type="button" onClick={handleDeleteCapture} className="inline-flex items-center gap-2 rounded-lg border border-red-100 bg-white px-4 py-2 text-xs font-semibold text-red-600 shadow-sm hover:bg-red-50">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/></svg>
                  Delete
                </button>
              )}
              <button type="button" onClick={handleCopyLink} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                {copied ? t("v.copied") : "Copy Link"}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_440px]">
              <section className="rounded-xl border border-border bg-white p-7 shadow-sm dark:bg-background">
                <MediaViewer type={capture.type} driveUrl={capture.drive_url} title={capture.title} />
                <div className="mt-7 space-y-4">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{capture.title}</h2>
                    {capture.description && <p className="mt-1 text-sm text-muted">{capture.description}</p>}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
                      {capture.site_url && (
                        <a href={capture.site_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 font-medium text-indigo-600 hover:bg-indigo-100">
                          🌈 {hostnameOf(capture.site_url)}
                        </a>
                      )}
                      <span>•</span>
                      <span>{new Date(capture.created_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Jakarta", timeZoneName: "short" })}</span>
                      {viewCount !== null && <><span>•</span><span>{t("v.viewCount", { count: viewCount })}</span></>}
                    </div>
                    {capture.expires_at && <p className="mt-2 text-[11px] font-medium text-muted">{getExpiryCountdown(capture.expires_at, t)}</p>}
                  </div>
                  <div className="border-t border-border pt-4">
                    <Comments captureId={capture.id} isVideo={capture.type === "video"} authorName={viewerEmail ? viewerEmail.split("@")[0] : undefined} authorEmail={viewerEmail || undefined} />
                  </div>
                </div>
              </section>

              <aside className="space-y-3">
                {!hideDevTools && <DevToolsPanel capture={capture as unknown as React.ComponentProps<typeof DevToolsPanel>["capture"]} />}
                <section className="rounded-xl border border-border bg-white p-5 shadow-sm dark:bg-background">
                  <h3 className="mb-4 text-base font-bold text-foreground">Share BugSnap</h3>
                  <div className="grid grid-cols-2 gap-5 text-center">
                    <button type="button" onClick={() => setShareType("devtools")} className={`rounded-lg border p-4 text-xs font-semibold ${shareType === "devtools" ? "border-indigo-500 text-indigo-600" : "border-border text-muted hover:text-foreground"}`}>
                      <div className="mx-auto mb-3 flex h-12 w-20 items-center justify-center rounded-md border border-indigo-100 bg-indigo-50 text-indigo-500">▷ ▯</div>
                      With DevTools
                      <p className="mt-1 text-[10px] font-normal text-muted">Includes logs, network & events</p>
                    </button>
                    <button type="button" onClick={() => setShareType("content")} className={`rounded-lg border p-4 text-xs font-semibold ${shareType === "content" ? "border-indigo-500 text-indigo-600" : "border-border text-muted hover:text-foreground"}`}>
                      <div className="mx-auto mb-3 flex h-12 w-20 items-center justify-center rounded-md border border-indigo-100 bg-indigo-50 text-indigo-500">▷</div>
                      Content Only
                      <p className="mt-1 text-[10px] font-normal text-muted">Screenshot & basic info</p>
                    </button>
                  </div>
                  <div className="mt-5">
                    <label className="mb-2 block text-xs font-semibold text-muted">General access</label>
                    <div ref={accessMenuRef} className="relative">
                      <button type="button" onClick={() => setAccessOpen((open) => !open)} className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-subtle">
                        <span className="flex items-center gap-2"><svg className="h-4 w-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20"/></svg>{accessMode === "members" ? "Workspace members only" : t("v.anyoneWithLink")}</span>
                        <svg className="h-3 w-3 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                      </button>
                      {accessOpen && (
                        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-border bg-white p-1 shadow-xl">
                          <button type="button" onClick={() => void saveAccessMode("public")} disabled={accessSaving} className="w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-subtle disabled:opacity-50">{t("v.anyoneWithLink")}</button>
                          <button type="button" onClick={() => void saveAccessMode("members")} disabled={accessSaving} className="w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-subtle disabled:opacity-50">Workspace members only</button>
                        </div>
                      )}
                    </div>
                  </div>
                  <button type="button" onClick={handleCopyLink} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    {copied ? t("v.copiedLink") : "Copy Link"}
                  </button>
                </section>
              </aside>
            </div>
          </div>
        </main>
      )}

      {/* Edit Modal (Workspace Members only) */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditModalOpen(false)} />
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl border border-border p-6">
            <h2 className="text-base font-bold text-foreground mb-4">{t("v.editCapture")}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">{t("v.titleLabel")}</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-sm rounded-lg border border-border px-3 py-2 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">{t("v.descLabel")}</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full text-sm rounded-lg border border-border px-3 py-2 bg-white min-h-[72px] resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5">{t("v.tagLabel")}</label>
                  <Dropdown
                    variant="field"
                    value={editTag}
                    onChange={setEditTag}
                    options={[{ value: "", label: t("v.noTag") }, ...TAG_OPTIONS.map(t => ({ value: t, label: t }))]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5">{t("v.statusLabel")}</label>
                  <Dropdown
                    variant="field"
                    value={editStatus}
                    onChange={setEditStatus}
                    options={STATUS_OPTIONS.map(s => ({ value: s, label: s }))}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-border/60 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">{t("v.domainsLabel")}</label>
                  <input
                    type="text"
                    value={editAllowedDomains}
                    onChange={(e) => setEditAllowedDomains(e.target.value)}
                    placeholder={t("v.domainsPlaceholder")}
                    className="w-full text-xs font-mono rounded-lg border border-border px-3 py-2 bg-white"
                  />
                  <p className="text-[10px] text-muted mt-1">{t("v.domainsHint")}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">{t("v.ipsLabel")}</label>
                  <input
                    type="text"
                    value={editAllowedIps}
                    onChange={(e) => setEditAllowedIps(e.target.value)}
                    placeholder={t("v.ipsPlaceholder")}
                    className="w-full text-xs font-mono rounded-lg border border-border px-3 py-2 bg-white"
                  />
                  <p className="text-[10px] text-muted mt-1">{t("v.ipsHint")}</p>
                </div>
              </div>
              {editError && <p className="text-xs text-red-600">{editError}</p>}
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
              <button onClick={() => setEditModalOpen(false)} className="px-4 py-2 text-xs font-medium text-muted hover:text-foreground">{t("common.cancel")}</button>
              <button onClick={handleSaveEdit} disabled={savingEdit} className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                {savingEdit ? t("v.saving") : t("v.saveChanges")}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Delete Capture Modal */}
      {deleteCaptureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { if (!deletingCapture) { setDeleteCaptureModalOpen(false); setDeleteOperationId(null); } }} />
          <div className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl border border-border p-6 text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">{t("v.deleteCaptureQ")}</h2>
            <p className="text-xs text-muted leading-relaxed mb-4">
              {t("v.deleteConfirm", { title: capture?.title ?? "" })}
            </p>
            <fieldset className="space-y-2 text-left mb-4" disabled={deletingCapture}>
              <legend className="text-xs font-semibold text-foreground mb-2">{t("v.deleteFrom")}</legend>
              <label className="flex items-start gap-2 rounded-lg border border-border p-3 cursor-pointer">
                <input type="radio" name="delete-mode" value="drive_trash" checked={deleteMode === "drive_trash"} onChange={() => { setDeleteMode("drive_trash"); setDeleteOperationId(crypto.randomUUID()); }} className="mt-0.5" />
                <span><span className="block text-xs font-semibold text-foreground">{t("v.moveToTrash")}</span><span className="block text-[11px] text-muted mt-0.5">{t("v.trashHint")}</span></span>
              </label>
              <label className="flex items-start gap-2 rounded-lg border border-border p-3 cursor-pointer">
                <input type="radio" name="delete-mode" value="app_only" checked={deleteMode === "app_only"} onChange={() => { setDeleteMode("app_only"); setDeleteOperationId(crypto.randomUUID()); setDriveIssue(null); setDeleteCaptureError(null); }} className="mt-0.5" />
                <span><span className="block text-xs font-semibold text-foreground">{t("v.BugSnapOnly")}</span><span className="block text-[11px] text-muted mt-0.5">{t("v.BugSnapOnlyHint")}</span></span>
              </label>
            </fieldset>
            {driveIssue && <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3 flex items-center justify-between gap-3"><span>{driveIssue === "reconnect_required" ? t("cap.driveReconnectRequired") : t("v.driveNotConnected")}</span><button type="button" onClick={() => void startDriveConnect()} className="font-semibold text-indigo-600 hover:underline">{driveIssue === "reconnect_required" ? t("cap.reconnectDrive") : t("cap.connectDrive")}</button></div>}
            {deleteCaptureError && <p role="alert" className="text-xs text-red-600 mb-3">{deleteCaptureError}</p>}
            
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button
                onClick={() => { setDeleteCaptureModalOpen(false); setDeleteOperationId(null); }}
                disabled={deletingCapture}
                className="px-4 py-2 text-sm font-medium text-foreground hover:bg-subtle rounded-lg transition-colors disabled:opacity-50"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={submitDeleteCapture}
                disabled={deletingCapture}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deletingCapture ? t("v.deleting") : t("v.confirmDelete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SingleViewPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-white" />}>
      <SingleViewContent />
    </Suspense>
  );
}
