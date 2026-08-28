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
  const [moreOpen, setMoreOpen] = useState(false);
  const [moveSubmenuOpen, setMoveSubmenuOpen] = useState(false);
  const [capFolders, setCapFolders] = useState<string[]>([]);
  const [movingCapture, setMovingCapture] = useState(false);
  const [newFolderMode, setNewFolderMode] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareType, setShareType] = useState<"devtools" | "content">("devtools");
  const [accessMode, setAccessMode] = useState<"public" | "members">("public");
  const [accessSaving, setAccessSaving] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const [aiModal, setAiModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [aiCopied, setAiCopied] = useState(false);
  const [embedModal, setEmbedModal] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
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

  const [viewerEmail, setViewerEmail] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [brand, setBrand] = useState({ name: "BugSnap", logo: "", hideWatermark: false });

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

  async function handleGenerateAiReport() {
    setAiModal(true);
    if (aiSummary) return;
    setAiLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getSession();
      const token = authData.session?.access_token;
      if (authError || !token) throw new Error(t("v.signInForAi"));
      const res = await fetch("/api/ai-bug-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: capture?.title,
          devLogs: capture?.dev_logs,
          windowSize: capture?.window_size,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(res.status === 401 ? t("v.signInForAi") : json.error || t("v.aiFailed"));
      if (json.summary) setAiSummary(json.summary);
    } catch (error) {
      setAiSummary(error instanceof Error ? error.message : t("v.aiFailed"));
    } finally {
      setAiLoading(false);
    }
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
      showToast("Only workspace owners can change link access.", "error");
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
      showToast("Capture updated", "success");
    } catch (err) {
      console.warn("Failed to save captures changes:", err);
      setEditError(t("v.saveError"));
      showToast("Could not save capture", "error");
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
      setMoreOpen(false);
      setMoveSubmenuOpen(false);
      setNewFolderMode(false);
      showToast(folderName ? `Moved to "${folderName}"` : "Removed from folder", "success");
    } catch (err) {
      console.warn("Failed to move capture:", err);
      showToast("Could not move capture", "error");
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
      showToast("Could not create folder", "error");
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
      showToast("Could not delete capture", "error");
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

  const embedUrl = typeof window !== "undefined" ? `${window.location.origin}/v/${id}?embed=true` : "";
  const embedCode = `<iframe src="${embedUrl}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`;

  return (
    <div className="h-screen bg-white dark:bg-background flex flex-col font-sans overflow-y-auto lg:overflow-hidden">
      <header className="h-14 border-b border-border px-3 sm:px-6 flex items-center justify-between shrink-0 bg-white dark:bg-background">
        <Link href={isTeamMember ? "/dashboard" : "/"} className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          {brand.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logo} alt={brand.name} className="h-7 w-auto object-contain" />
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon.svg" alt="BugSnap" className="w-7 h-7 shrink-0 object-contain" />
              <div>
                <span className="text-sm font-bold tracking-tight text-foreground leading-none block">
                  {brand.name}
                </span>
                {!brand.hideWatermark && (
                  <span className="text-[10px] text-muted mt-0.5 leading-none font-medium block">
                    Dashboard
                  </span>
                )}
              </div>
            </>
          )}
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-3">
          {isTeamMember && (
            <Link
              href="/captures"
              className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-subtle flex items-center gap-1.5 transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span className="hidden md:inline">{t("v.backToDashboard")}</span>
            </Link>
          )}

          {status === "ready" && (
            <button
              onClick={handleGenerateAiReport}
              className="px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>✨ <span className="hidden sm:inline">{t("v.aiBugReport")}</span><span className="sm:hidden">AI</span></span>
            </button>
          )}

          {/* More Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${
                moreOpen
                  ? "bg-subtle border-indigo-200 text-foreground"
                  : "border-border text-muted hover:text-foreground hover:bg-subtle"
              }`}
            >
              <span>{t("v.more")}</span>
              <svg className={`w-3.5 h-3.5 text-muted transition-transform ${moreOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {moreOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-40 z-50 bg-white border border-border rounded-xl shadow-xl py-1 px-1 flex flex-col gap-0.5">
                  {status === "ready" && driveFileId(capture?.drive_url || null) && (
                    <button
                      type="button"
                      onClick={() => { handleDownloadDirectMedia(); setMoreOpen(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-subtle rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Media
                    </button>
                  )}
                  {status === "ready" && (
                    <button
                      onClick={() => { setEmbedModal(true); setMoreOpen(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-subtle rounded-lg transition-colors"
                    >
                      {t("v.embed")}
                    </button>
                  )}
                  {isTeamMember && (
                    <button
                      onClick={() => { openEditModal(); setMoreOpen(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 font-semibold rounded-lg transition-colors"
                    >
                      {t("v.editCapture")}
                    </button>
                  )}
                  {isWorkspaceOwner && (
                    <div
                      className="relative"
                      onMouseEnter={() => { setMoveSubmenuOpen(true); if (capFolders.length === 0) loadCapFolders(); }}
                      onMouseLeave={() => { setMoveSubmenuOpen(false); setNewFolderMode(false); }}
                    >
                      <button
                        type="button"
                        onClick={() => { setMoveSubmenuOpen((o) => !o); if (capFolders.length === 0) loadCapFolders(); }}
                        className="w-full flex items-center justify-between gap-1.5 px-3 py-1.5 text-xs text-foreground hover:bg-subtle rounded-lg transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                          </svg>
                          Move to folder
                        </span>
                        <svg className="w-3 h-3 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      {moveSubmenuOpen && (
                        <div className="absolute right-full top-0 mr-1 w-44 z-50 bg-white border border-border rounded-xl shadow-xl py-1 px-1 flex flex-col gap-0.5">
                          <button
                            type="button"
                            disabled={movingCapture}
                            onClick={() => handleMoveCapture(null)}
                            className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-subtle rounded-lg transition-colors disabled:opacity-50"
                          >
                            No folder (General)
                          </button>
                          {capFolders.map((folder) => (
                            <button
                              key={folder}
                              type="button"
                              disabled={movingCapture}
                              onClick={() => handleMoveCapture(folder)}
                              className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs text-foreground hover:bg-subtle rounded-lg transition-colors disabled:opacity-50"
                            >
                              <svg className="w-3.5 h-3.5 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                              </svg>
                              <span className="truncate">{folder}</span>
                            </button>
                          ))}
                          <div className="my-0.5 border-t border-border" />
                          {newFolderMode ? (
                            <form
                              onSubmit={(e) => { e.preventDefault(); handleCreateFolderAndMove(); }}
                              className="px-2 py-1"
                            >
                              <input
                                autoFocus
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                placeholder="Folder name"
                                className="w-full rounded-md border border-border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
                              />
                            </form>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setNewFolderMode(true)}
                              className="w-full text-left px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              + New folder
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {isWorkspaceOwner && <div className="my-0.5 border-t border-border" />}
                  {isWorkspaceOwner && (
                    <button
                      onClick={() => { handleDeleteCapture(); setMoreOpen(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 font-semibold rounded-lg transition-colors"
                    >
                      {t("v.deleteCapture")}
                    </button>
                  )}
                  {isAuthenticated === false && (
                    <a
                      href="/"
                      onClick={() => setMoreOpen(false)}
                      className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-subtle rounded-lg transition-colors"
                    >
                      {t("v.login")}
                    </a>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Split Copy Link Button */}
          <div className="relative flex items-center">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 bg-emerald-400 hover:bg-emerald-500 text-white text-xs font-semibold rounded-l-lg transition-colors border-r border-emerald-500/20"
            >
              {copied ? t("v.copied") : t("v.copy")}
            </button>
            <button
              onClick={() => { setShareOpen(!shareOpen); setAccessOpen(false); }}
              className="px-2 py-1.5 bg-emerald-400 hover:bg-emerald-500 text-white text-xs rounded-r-lg transition-colors flex items-center justify-center self-stretch"
              aria-label={t("v.shareCapture")}
            >
              <svg className={`w-3 h-3 transition-transform ${shareOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Share Popover */}
            {shareOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShareOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-[min(26rem,calc(100vw-1rem))] z-50 overflow-hidden rounded-2xl border border-border bg-white text-foreground shadow-2xl dark:bg-background">
                  <div className="border-b border-border px-5 py-3">
                    <h3 className="text-lg font-semibold tracking-tight text-foreground">Share BugSnap</h3>
                  </div>

                  {/* Share Cards */}
                  <div className="grid grid-cols-2 gap-7 px-8 py-6 text-center">
                    <button
                      onClick={() => setShareType("devtools")}
                      className={`group flex flex-col items-center gap-3 rounded-xl text-sm font-semibold transition-colors ${shareType === "devtools" ? "text-foreground" : "text-muted hover:text-foreground"}`}
                    >
                      <div className={`flex h-[5.6rem] w-full items-center justify-center rounded-md border transition-colors ${shareType === "devtools" ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30" : "border-transparent bg-indigo-100/70 dark:bg-indigo-950/20"}`}>
                        <div className="flex h-16 w-[6.5rem] items-center justify-center rounded-md border border-indigo-200 bg-white shadow-sm dark:border-indigo-800 dark:bg-subtle">
                          <svg className="h-9 w-9 text-indigo-200 dark:text-indigo-700" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                          <div className="ml-2 hidden h-12 w-8 rounded border border-indigo-100 bg-indigo-50 sm:block dark:border-indigo-800 dark:bg-background" />
                        </div>
                      </div>
                      <span>{t("v.withDevTools")}</span>
                    </button>

                    <button
                      onClick={() => setShareType("content")}
                      className={`group flex flex-col items-center gap-3 rounded-xl text-sm font-semibold transition-colors ${shareType === "content" ? "text-foreground" : "text-muted hover:text-foreground"}`}
                    >
                      <div className={`flex h-[5.6rem] w-full items-center justify-center rounded-md border transition-colors ${shareType === "content" ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30" : "border-transparent bg-indigo-100/70 dark:bg-indigo-950/20"}`}>
                        <div className="flex h-16 w-[6.5rem] items-center justify-center rounded-md border border-indigo-200 bg-white shadow-sm dark:border-indigo-800 dark:bg-subtle">
                          <svg className="h-9 w-9 text-indigo-200 dark:text-indigo-700" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                        </div>
                      </div>
                      <span>{t("v.contentOnly")}</span>
                    </button>
                  </div>

                  {/* General Access Selection */}
                  <div className="relative border-t border-border px-5 py-4">
                    <label className="mb-2 block text-sm font-medium text-muted">General access</label>
                    <button
                      type="button"
                      onClick={() => setAccessOpen((open) => !open)}
                      className="flex w-full items-center justify-between rounded-xl bg-subtle px-4 py-3 text-left text-base font-medium text-foreground hover:bg-subtle/80"
                    >
                      <span className="flex items-center gap-3">
                        <svg className="h-5 w-5 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
                        {accessMode === "members" ? "Workspace members only" : t("v.anyoneWithLink")}
                      </span>
                      <svg className={`h-4 w-4 text-muted transition-transform ${accessOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                    </button>

                    {accessOpen && (
                      <div className="mt-2 overflow-hidden rounded-2xl border border-border bg-white p-2 shadow-xl dark:bg-background">
                        <button type="button" onClick={() => void saveAccessMode("members")} disabled={accessSaving} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm disabled:opacity-60 ${accessMode === "members" ? "bg-subtle text-foreground" : "text-muted hover:bg-subtle hover:text-foreground"}`}>
                          <span className="flex items-center gap-3">
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9h1M9 13h1M9 17h1"/></svg>
                            Workspace members only
                          </span>
                          {accessMode === "members" && <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m5 12 4 4L19 6"/></svg>}
                        </button>
                        <button type="button" onClick={() => void saveAccessMode("public")} disabled={accessSaving} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm disabled:opacity-60 ${accessMode === "public" ? "bg-subtle text-foreground" : "text-muted hover:bg-subtle hover:text-foreground"}`}>
                          <span className="flex items-center gap-3">
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
                            {t("v.anyoneWithLink")}
                          </span>
                          {accessMode === "public" && <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m5 12 4 4L19 6"/></svg>}
                        </button>
                        <a href="/settings" className="mt-2 flex w-full items-center justify-between border-t border-border px-3 py-3 text-sm text-foreground hover:bg-subtle">
                          Manage access
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17 17 7M7 7h10v10"/></svg>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Copy Link Button */}
                  <div className="px-5 pb-4">
                    <button
                      onClick={handleCopyLink}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                      {copied ? t("v.copiedLink") : t("v.copyLinkBtn")}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
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
        <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden min-h-0">
          <div className="flex-1 lg:overflow-y-auto p-4 sm:p-6 flex flex-col gap-6">
            <MediaViewer
              type={capture.type}
              driveUrl={capture.drive_url}
              title={capture.title}
            />

            {/* Title + Comments */}
            <div className="rounded-xl p-4 bg-white dark:bg-background space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-semibold text-foreground">{capture.title}</h2>
                  {capture.description && <p className="text-xs text-muted mt-0.5">{capture.description}</p>}
                  {capture.expires_at && (
                    <p className="text-[11px] text-muted mt-1 font-medium">
                      {getExpiryCountdown(capture.expires_at, t)}
                    </p>
                  )}
                  {capture.drive_url && (
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <a
                        href={capture.drive_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6v6M10 14L20 4" />
                        </svg>
                        {t("v.driveLink")}
                      </a>
                    </div>
                  )}
                </div>
                {viewCount !== null && <span className="shrink-0 text-xs text-muted whitespace-nowrap mt-0.5">{t("v.viewCount", { count: viewCount })}</span>}
              </div>

              <div className="pt-2 border-t border-border/40">
                <Comments
                  captureId={capture.id}
                  isVideo={capture.type === "video"}
                  authorName={viewerEmail ? viewerEmail.split("@")[0] : undefined}
                  authorEmail={viewerEmail || undefined}
                />
              </div>
            </div>
          </div>

          {!hideDevTools && (
            <DevToolsPanel capture={capture as unknown as React.ComponentProps<typeof DevToolsPanel>["capture"]} />
          )}
        </div>
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

      {/* Embed Modal */}
      {embedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEmbedModal(false)} />
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-foreground">{t("v.embedTitle")}</h3>
              <button onClick={() => setEmbedModal(false)} className="text-muted hover:text-foreground">✕</button>
            </div>
            <textarea readOnly value={embedCode} className="w-full h-20 text-xs font-mono p-2 bg-subtle border border-border rounded-lg outline-none resize-none" />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setEmbedModal(false)} className="px-4 py-2 text-xs font-medium text-muted hover:text-foreground">{t("v.close")}</button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(embedCode);
                  setEmbedCopied(true);
                  setTimeout(() => setEmbedCopied(false), 2000);
                }}
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                {embedCopied ? t("v.copiedCode") : t("v.copyCode")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Bug Report Modal */}
      {aiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAiModal(false)} />
          <div className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl border border-border max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-foreground">{t("v.aiReportTitle")}</h3>
              <button onClick={() => setAiModal(false)} className="text-muted hover:text-foreground" aria-label={t("common.close")}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <p className="text-xs text-muted mb-4">
              {t("v.aiDesc")}
            </p>

            {aiLoading ? (
              <div className="py-10 flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-xs text-muted">{t("v.analyzing")}</p>
              </div>
            ) : (
              <pre className="text-xs font-mono whitespace-pre-wrap bg-subtle/60 border border-border rounded-lg p-4 text-foreground leading-relaxed max-h-[50vh] overflow-y-auto">
                {aiSummary || t("v.generatePrompt")}
              </pre>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
              <div className="flex gap-2">
                <a
                  href={`https://github.com/new?title=${encodeURIComponent(capture?.title || "Bug")}&body=${encodeURIComponent(aiSummary)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-subtle transition-colors"
                >
                  {t("v.githubIssue")}
                </a>
                <a
                  href={`https://linear.app/issue?title=${encodeURIComponent(capture?.title || "Bug")}&description=${encodeURIComponent(aiSummary)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-subtle transition-colors"
                >
                  Linear
                </a>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(aiSummary);
                  setAiCopied(true);
                  setTimeout(() => setAiCopied(false), 2000);
                }}
                disabled={!aiSummary}
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {aiCopied ? t("v.copiedReport") : t("v.copyReport")}
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
