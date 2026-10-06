"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useT } from "@/components/I18nProvider";
import { useToast } from "@/components/Toast";
import { Dropdown } from "@/components/Dropdown";
import { pickAvatar, initialOf } from "@/lib/avatar";
import EditModal from "@/components/CaptureEditModal";
import {
  type Capture,
  type UploadTask,
  STATUS_OPTIONS,
  TAG_OPTIONS,
  driveFileId,
  driveThumbUrl,
  formatDuration,
  getAvatarColor,
  getOwnerInitial,
  timeAgo,
} from "@/lib/capture-utils";

const CHROME_WEB_STORE_URL =
  "https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf";

function getSavedViewMode(): "grid" | "list" {
  if (typeof window === "undefined") return "grid";
  try {
    const v = localStorage.getItem("bugsnap_captures_view");
    return v === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

function saveViewMode(mode: "grid" | "list") {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("bugsnap_captures_view", mode);
  } catch {}
}

export default function CapturesList() {
  const { t } = useT();
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-sm text-muted">
          {t("cap.loading")}
        </div>
      }
    >
      <CapturesContent />
    </Suspense>
  );
}

function CapturesContent() {
  const { t } = useT();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const wsParam = searchParams.get("ws");
  const folderParam = searchParams.get("folder");
  const [captures, setCaptures] = useState<Capture[]>([]);
  // Same source as Settings > Account, so a card's author badge shows the
  // real profile name/photo (not the email-derived username) when the
  // capture belongs to the signed-in user.
  const [myProfile, setMyProfile] = useState<{
    email: string;
    name: string;
    avatar: string;
  } | null>(null);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user;
      const email = u?.email;
      if (!u || !email) return;
      const meta = u.user_metadata || {};
      const { data: row } = await supabase
        .from("users")
        .select("full_name, avatar_url")
        .ilike("email", email)
        .maybeSingle();
      setMyProfile({
        email,
        name:
          row?.full_name || meta.full_name || meta.name || email.split("@")[0],
        avatar: pickAvatar(row?.avatar_url, meta.avatar_url, meta.picture),
      });
    })();
    const onProfileUpdated = (e: Event) => {
      const detail = (
        e as CustomEvent<{ fullName?: string; avatarUrl?: string }>
      ).detail;
      if (!detail) return;
      setMyProfile((prev) =>
        prev
          ? {
              ...prev,
              name: detail.fullName?.trim() || prev.name,
              avatar: pickAvatar(detail.avatarUrl, prev.avatar),
            }
          : prev,
      );
    };
    window.addEventListener("bugsnap:profile-updated", onProfileUpdated);
    return () =>
      window.removeEventListener("bugsnap:profile-updated", onProfileUpdated);
  }, []);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">(() =>
    getSavedViewMode(),
  );
  useEffect(() => {
    saveViewMode(viewMode);
  }, [viewMode]);
  // Filters live in the URL so a filtered view is shareable and survives reload.
  // Seeded once from searchParams; the sync effect below writes them back.
  const [search, setSearch] = useState(() => searchParams.get("q") || "");
  const [editing, setEditing] = useState<Capture | null>(null);
  const [deleteRequest, setDeleteRequest] = useState<{
    ids: string[];
    title?: string;
    operationId: string;
  } | null>(null);
  const [deleteMode, setDeleteMode] = useState<"drive_trash" | "app_only">(
    "drive_trash",
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [driveIssue, setDriveIssue] = useState<
    "not_connected" | "reconnect_required" | null
  >(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [currentUpload, setCurrentUpload] = useState<UploadTask | null>(null);
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
  const uploadDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (uploadDismissTimer.current) clearTimeout(uploadDismissTimer.current);
    };
  }, []);
  const [moveToOpen, setMoveToOpen] = useState(false);
  const [moving, setMoving] = useState(false);
  const [moveTargetWorkspaceId, setMoveTargetWorkspaceId] =
    useState<string>("");
  const [moveTargetFolderName, setMoveTargetFolderName] = useState<string>("");
  const [moveWorkspaces, setMoveWorkspaces] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [moveFolders, setMoveFolders] = useState<string[]>([]);
  const [isCreatingMoveFolder, setIsCreatingMoveFolder] = useState(false);
  const [newMoveFolderName, setNewMoveFolderName] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);
  const [dragActive, setDragActive] = useState(false);
  const [thumbFailed, setThumbFailed] = useState<Record<string, boolean>>({});
  const [scannedMissingIds, setScannedMissingIds] = useState<string[]>([]);
  const [scanningDrive, setScanningDrive] = useState(false);
  const scanningRef = useRef(false);

  const missingDriveIds = useMemo(() => {
    return captures
      .filter(
        (c) =>
          (thumbFailed[c.id] ||
            (Boolean(c.drive_url) && !driveFileId(c.drive_url))) &&
          c.source !== "demo",
      )
      .map((c) => c.id);
  }, [captures, thumbFailed]);

  const allMissingDriveIds = useMemo(() => {
    return Array.from(new Set([...missingDriveIds, ...scannedMissingIds]));
  }, [missingDriveIds, scannedMissingIds]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const activeHoverRef = useRef<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null,
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "c" && e.key !== "C") return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (!activeHoverRef.current) return;
      const shareUrl = `${window.location.origin}/v/${activeHoverRef.current}`;
      navigator.clipboard
        ?.writeText(shareUrl)
        .then(() => {
          showToast(t("cap.linkCopied"), "success");
        })
        .catch(() => showToast(t("cap.copyError"), "error"));
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showToast, t]);

  // Dropdown states: false = not actively filtering by this type.
  // If BOTH are false, we show ALL (no filter applied).
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const typeMenuRef = useRef<HTMLDivElement>(null);
  const initialTypes = (searchParams.get("type") || "").split(",");
  const [showVideo, setShowVideo] = useState(() =>
    initialTypes.includes("video"),
  );
  const [showScreenshot, setShowScreenshot] = useState(() =>
    initialTypes.includes("screenshot"),
  );
  const [filterTag, setFilterTag] = useState(
    () => searchParams.get("tag") || "",
  );
  const [filterStatus, setFilterStatus] = useState(
    () => searchParams.get("status") || "",
  );

  // Typing must not fire a query per keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState(search.trim());
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  // Both checked (or neither) means "all", so there is only ever one type to filter on.
  const typeFilter =
    showVideo === showScreenshot ? "" : showVideo ? "video" : "screenshot";

  useEffect(() => {
    const url = new URL(window.location.href);
    const put = (k: string, v: string) =>
      v ? url.searchParams.set(k, v) : url.searchParams.delete(k);
    put("q", debouncedSearch);
    put("tag", filterTag);
    put("status", filterStatus);
    put(
      "type",
      [showScreenshot ? "screenshot" : "", showVideo ? "video" : ""]
        .filter(Boolean)
        .join(","),
    );
    const next = `${url.pathname}${url.search}`;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      router.replace(next, { scroll: false });
    }
  }, [
    debouncedSearch,
    filterTag,
    filterStatus,
    showVideo,
    showScreenshot,
    router,
  ]);

  // Close type filter dropdown when clicking outside without blocking scroll
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        typeMenuOpen &&
        typeMenuRef.current &&
        !typeMenuRef.current.contains(e.target as Node)
      ) {
        setTypeMenuOpen(false);
      }
      if (
        activeMenuId &&
        !(e.target as HTMLElement)?.closest?.("[data-capture-menu]")
      ) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [typeMenuOpen, activeMenuId]);

  // Infinite scroll / pagination state
  const PAGE_SIZE = 12;
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  // Keyset cursor: the last row of the loaded set, (created_at, id). Filters
  // like wsParam/folderParam change the sort context, so a cursor from one
  // filter is invalid under another - reset it whenever they change. NULL
  // means "start at the newest". (created_at,id) is an exact tiebreak for
  // the captures_ws_created_idx sort.
  const cursorRef = useRef<{ created_at: string; id: string } | null>(null);
  // Bumped on every filter change; in-flight loadPage() from an old filter
  // that resolves afterwards is discarded (no stale append to the new list).
  const loadGenRef = useRef(0);

  // Explicit column list (no dev_logs) keeps the grid fast - logs are only
  // needed on the detail page.
  const projectParam = searchParams.get("project");
  const projectFilter = projectParam ?? "";
  const workspaceParam = wsParam && wsParam !== "all" ? wsParam : "";
  const CAPTURES_COLUMNS =
    "id, title, type, drive_url, created_at, window_size, workspace_id, folder_name, project_id, source, tag, status, expires_at, password, duration, owner_email, burn_after_read";

  const loadPage = useCallback(
    async (replace: boolean) => {
      if (replace) {
        cursorRef.current = null;
      }
      const gen = loadGenRef.current;
      let query = supabase
        .from("captures")
        .select(CAPTURES_COLUMNS)
        // id is the cursor's tiebreak, so it has to be in the sort too - without
        // it, rows sharing a created_at come back in arbitrary order and the
        // keyset either skips or repeats them across page boundaries.
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(PAGE_SIZE);
      if (workspaceParam) {
        query = query.or(
          `workspace_id.eq.${workspaceParam},workspace_id.is.null`,
        );
      }
      if (folderParam) {
        query = query.eq("folder_name", folderParam);
      }
      if (projectFilter) {
        query = query.eq("project_id", projectFilter);
      }
      // Server-side, not post-filtering the loaded page: with keyset pagination a
      // capture that has not been scrolled into memory yet is otherwise unfindable.
      if (typeFilter) {
        query = query.eq("type", typeFilter);
      }
      if (filterTag) {
        query = query.eq("tag", filterTag);
      }
      if (filterStatus) {
        query = query.eq("status", filterStatus);
      }
      if (debouncedSearch) {
        // Escape PostgREST's pattern/list metacharacters so a title containing
        // a comma or quote does not break out of the filter expression.
        query = query.ilike(
          "title",
          `%${debouncedSearch.replace(/[%_,"\\()]/g, "\\$&")}%`,
        );
      }
      const cursor = cursorRef.current;
      if (cursor) {
        // ponytail: .lt(...).or(...) chains as AND, making every page-2+
        // query self-contradictory (0 rows forever). Must be one OR.
        query = query.or(
          `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`,
        );
      }
      const { data, error } = await query;
      // Stale response for a filter that changed mid-flight - drop it.
      if (gen !== loadGenRef.current) return;
      if (error) {
        console.warn("Error fetching captures:", error);
        setHasMore(false);
        return;
      }
      const items = data || [];
      setCaptures((prev) => (replace ? items : [...prev, ...items]));
      if (items.length > 0) {
        const last = items[items.length - 1];
        cursorRef.current = { created_at: last.created_at, id: last.id };
      } else if (replace) {
        cursorRef.current = null;
      }
      setHasMore(items.length === PAGE_SIZE);
    },
    [
      folderParam,
      projectFilter,
      workspaceParam,
      typeFilter,
      filterTag,
      filterStatus,
      debouncedSearch,
    ],
  );

  // Initial load + reload on any filter change (loadPage's identity covers them all)
  useEffect(() => {
    let cancelled = false;
    cursorRef.current = null;
    loadGenRef.current += 1;
    setLoadingMore(false);
    setLoading(true);
    setCaptures([]);
    setThumbFailed({});
    setScannedMissingIds([]);
    loadPage(true).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [loadPage]);

  // Handle Escape key to cancel/clear active selection
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (selectedIds.size > 0 && !moveToOpen && !deleteRequest && !editing) {
          clearSelection();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds.size, moveToOpen, deleteRequest, editing, clearSelection]);

  // Clear any active bulk selection when switching workspaces
  useEffect(() => {
    clearSelection();
  }, [workspaceParam, clearSelection]);

  // Automatically scan missing Drive files on workspace load or manual request
  const scanMissingDrive = useCallback(
    async (manual = false) => {
      if (scanningRef.current) return;
      scanningRef.current = true;
      setScanningDrive(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) return;

        const query = workspaceParam
          ? `?workspaceId=${encodeURIComponent(workspaceParam)}`
          : "";
        const res = await fetch(`/api/google-drive/scan-missing${query}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          missingIds?: string[];
          totalMissing?: number;
        };
        const ids = data.missingIds ?? [];
        if (ids.length > 0) {
          setScannedMissingIds(ids);
          setThumbFailed((prev) => {
            const next = { ...prev };
            ids.forEach((id) => {
              next[id] = true;
            });
            return next;
          });
          if (manual) {
            showToast(t("cap.scanFoundMissing", { count: ids.length }), "info");
          }
        } else {
          setScannedMissingIds([]);
          if (manual) {
            showToast(t("cap.scanNoMissing"), "info");
          }
        }
      } catch {
        // Non-fatal
      } finally {
        scanningRef.current = false;
        setScanningDrive(false);
      }
    },
    [workspaceParam, t, showToast],
  );

  useEffect(() => {
    void scanMissingDrive(false);
  }, [workspaceParam, scanMissingDrive]);

  // IntersectionObserver: Callback Ref to safely load more when the sentinel enters the viewport
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node || !hasMore || loadingMore) return;

      const obs = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !loadingMore) {
            setLoadingMore(true);
            loadPage(false).finally(() => setLoadingMore(false));
          }
        },
        { rootMargin: "300px" },
      );
      obs.observe(node);
      observerRef.current = obs;
    },
    [hasMore, loadingMore, loadPage],
  );

  // The Supabase query already applies workspace_id/folder_name filters server-side
  // (see the fetch effect above), so no redundant client-side re-filter is needed here.
  const workspaceCaptures = captures;

  const handleCopyLink = async (id: string) => {
    setDeleteError(null);
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/v/${id}`);
      setCopiedId(id);
      showToast(t("cap.linkCopied"), "success");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast(t("cap.copyError"), "error");
    }
  };

  async function startDriveConnect() {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error(t("cap.sessionExpired"));
    const res = await fetch("/api/google-drive/connect", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = (await res.json().catch(() => ({}))) as {
      url?: string;
      error?: string;
    };
    if (!res.ok || !result.url)
      throw new Error(result.error || t("cap.driveConnectError"));
    window.location.assign(result.url);
  }

  function openDeleteConfirmation(
    ids: string[],
    title?: string,
    defaultMode?: "drive_trash" | "app_only",
  ) {
    if (ids.length === 0 || deleting) return;
    const isMissingCleanup =
      defaultMode === "app_only" ||
      ids.every((id) => allMissingDriveIds.includes(id));
    setDeleteMode(
      isMissingCleanup ? "app_only" : (defaultMode ?? "drive_trash"),
    );
    setDriveIssue(null);
    setDeleteError(null);
    setDeleteRequest({ ids, title, operationId: crypto.randomUUID() });
  }

  async function submitDelete() {
    if (!deleteRequest || deleting) return;
    setDeleting(true);
    setDriveIssue(null);
    setDeleteError(null);

    const allIds = deleteRequest.ids;
    setDeleteProgress({ current: 0, total: allIds.length });

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (sessionError || !token) throw new Error(t("cap.sessionExpired"));

      const BATCH_SIZE = 50;
      const allDeletedIds: string[] = [];
      const allFailedIds: string[] = [];
      let detectedDriveIssue: "reconnect_required" | "not_connected" | null =
        null;
      let lastErrorMessage: string | null = null;

      for (let i = 0; i < allIds.length; i += BATCH_SIZE) {
        const chunk = allIds.slice(i, i + BATCH_SIZE);
        const chunkOperationId = crypto.randomUUID();

        const response = await fetch("/api/google-drive/delete", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            captureIds: chunk,
            mode: deleteMode,
            operationId: chunkOperationId,
          }),
        });
        const result = (await response.json().catch(() => ({}))) as {
          deletedIds?: string[];
          deleted_ids?: string[];
          failedIds?: string[];
          failed_ids?: string[];
          results?: Array<{
            captureId: string;
            ok: boolean;
            outcome?: string;
            driveOutcome?: "trashed" | "kept" | "unknown";
            error?: string;
          }>;
          error?: string;
          message?: string;
          code?: string;
          driveStatus?: "connected" | "reconnect_required" | "not_connected";
        };
        const deletedIds =
          result.deletedIds ??
          result.deleted_ids ??
          result.results
            ?.filter((item) => item.ok)
            .map((item) => item.captureId) ??
          [];
        const failedIds =
          result.failedIds ??
          result.failed_ids ??
          result.results
            ?.filter((item) => !item.ok)
            .map((item) => item.captureId) ??
          [];

        allDeletedIds.push(...deletedIds);

        // Progressively remove deleted captures from state
        if (deletedIds.length > 0) {
          const removed = new Set(deletedIds);
          setCaptures((prev) =>
            prev.filter((capture) => !removed.has(capture.id)),
          );
          setScannedMissingIds((prev) => prev.filter((id) => !removed.has(id)));
          setSelectedIds(
            (prev) => new Set(Array.from(prev).filter((id) => !removed.has(id))),
          );
        }

        setDeleteProgress({
          current: allDeletedIds.length,
          total: allIds.length,
        });

        const driveIssue =
          result.code === "DRIVE_RECONNECT_REQUIRED"
            ? "reconnect_required"
            : response.status === 409 ||
                result.code === "DRIVE_NOT_CONNECTED" ||
                /drive.*not connected/i.test(result.error ?? result.message ?? "")
              ? "not_connected"
              : null;

        if (driveIssue) {
          detectedDriveIssue = driveIssue;
          lastErrorMessage =
            driveIssue === "reconnect_required"
              ? t("cap.driveReconnectRequired")
              : t("cap.driveNotConnected");
          const remainingUnattempted = allIds.slice(i + chunk.length);
          allFailedIds.push(
            ...chunk.filter((id) => !deletedIds.includes(id)),
            ...remainingUnattempted,
          );
          break;
        }

        if (!response.ok || failedIds.length > 0) {
          const firstFailure = result.results?.find((item) => !item.ok);
          const details = firstFailure?.error
            ? `${firstFailure.error}${firstFailure.driveOutcome ? ` (${firstFailure.driveOutcome === "trashed" ? "Drive file trashed" : firstFailure.driveOutcome === "kept" ? "Drive file kept" : "Drive state unknown"})` : ""}`
            : null;
          lastErrorMessage =
            details ?? result.error ?? result.message ?? t("cap.deleteFailed");
          allFailedIds.push(
            ...(failedIds.length > 0
              ? failedIds
              : chunk.filter((id) => !deletedIds.includes(id))),
          );
        }
      }

      if (detectedDriveIssue) {
        setDriveIssue(detectedDriveIssue);
        setDeleteError(lastErrorMessage);
        const remaining = allIds.filter((id) => !allDeletedIds.includes(id));
        if (remaining.length > 0) {
          setDeleteRequest({
            ids: remaining,
            operationId: crypto.randomUUID(),
          });
        } else {
          setDeleteRequest(null);
          clearSelection();
        }
        return;
      }

      if (allFailedIds.length > 0) {
        setDeleteError(lastErrorMessage ?? t("cap.deleteFailed"));
        const remaining = Array.from(new Set(allFailedIds));
        setDeleteRequest({
          ids: remaining,
          operationId: crypto.randomUUID(),
        });
        return;
      }

      const deletedCount = allDeletedIds.length || allIds.length;
      setDeleteRequest(null);
      clearSelection();
      showToast(
        deletedCount === 1
          ? t("cap.deletedCount", { count: deletedCount })
          : t("cap.deletedCountPlural", { count: deletedCount }),
        "success",
      );
    } catch (error) {
      console.warn("Error deleting captures:", error);
      setDeleteError(
        error instanceof Error ? error.message : t("cap.deleteFailed"),
      );
      showToast(t("cap.deleteFailedToast"), "error");
    } finally {
      setDeleting(false);
      setDeleteProgress(null);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function uploadSelectedFiles(files: File[]) {
    const validFiles = files.filter(
      (f) =>
        f.type.startsWith("image/") ||
        f.type.startsWith("video/") ||
        /\.(png|jpe?g|webp|gif|svg|mp4|webm|mov)$/i.test(f.name),
    );
    if (!validFiles.length || uploading) return;

    setUploading(true);
    setUploadError(null);
    if (uploadDismissTimer.current) {
      clearTimeout(uploadDismissTimer.current);
    }

    const initialTasks: UploadTask[] = validFiles.map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type.startsWith("video/") ? "video" : "screenshot",
      progress: 0,
      status: "uploading",
    }));

    setUploadTasks(initialTasks);
    setCurrentUpload(initialTasks[0]);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    let completedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const isVideo = file.type.startsWith("video/");
      const title = file.name.replace(/\.[^.]+$/, "") || "Untitled";

      setUploadTasks((prev) =>
        prev.map((t, idx) =>
          idx === i ? { ...t, status: "uploading", progress: 5 } : t,
        ),
      );
      setCurrentUpload(initialTasks[i]);

      try {
        await new Promise<void>((resolve, reject) => {
          const form = new FormData();
          form.append("file", file);
          form.append("title", title);
          form.append("type", isVideo ? "video" : "screenshot");
          form.append("workspaceId", workspaceParam);
          if (folderParam) {
            form.append("folderName", folderParam);
          }
          if (projectFilter) {
            form.append("projectId", projectFilter);
          }

          const xhr = new XMLHttpRequest();
          let syncTimer: ReturnType<typeof setInterval> | null = null;

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const pct = Math.max(
                5,
                Math.min(75, Math.round((event.loaded / event.total) * 75)),
              );
              setUploadTasks((prev) =>
                prev.map((t, idx) =>
                  idx === i ? { ...t, progress: pct, status: "uploading" } : t,
                ),
              );
              setCurrentUpload((prev) =>
                prev ? { ...prev, progress: pct, status: "uploading" } : null,
              );
            }
          };

          xhr.upload.onload = () => {
            setUploadTasks((prev) =>
              prev.map((t, idx) =>
                idx === i ? { ...t, progress: 80, status: "syncing" } : t,
              ),
            );
            setCurrentUpload((prev) =>
              prev ? { ...prev, progress: 80, status: "syncing" } : null,
            );
            let currentPct = 80;
            syncTimer = setInterval(() => {
              if (currentPct < 96) {
                currentPct += 2;
                setUploadTasks((prev) =>
                  prev.map((t, idx) =>
                    idx === i
                      ? { ...t, progress: currentPct, status: "syncing" }
                      : t,
                  ),
                );
                setCurrentUpload((prev) =>
                  prev
                    ? { ...prev, progress: currentPct, status: "syncing" }
                    : null,
                );
              }
            }, 250);
          };

          xhr.onload = () => {
            if (syncTimer) clearInterval(syncTimer);
            if (xhr.status >= 200 && xhr.status < 300) {
              let res: { capture?: Capture; error?: string } = {};
              try {
                res = JSON.parse(xhr.responseText);
              } catch {}

              if (res.capture) {
                setCaptures((prev) => {
                  if (prev.some((c) => c.id === res.capture!.id)) return prev;
                  return [res.capture!, ...prev];
                });
              }

              completedCount++;
              setUploadTasks((prev) =>
                prev.map((t, idx) =>
                  idx === i ? { ...t, progress: 100, status: "completed" } : t,
                ),
              );
              setCurrentUpload((prev) =>
                prev ? { ...prev, progress: 100, status: "completed" } : null,
              );
              resolve();
            } else {
              let errorMsg = t("cap.uploadFailed");
              try {
                const res = JSON.parse(xhr.responseText);
                if (res.error) errorMsg = res.error;
              } catch {}
              failedCount++;
              setUploadTasks((prev) =>
                prev.map((t, idx) =>
                  idx === i ? { ...t, status: "error", error: errorMsg } : t,
                ),
              );
              setCurrentUpload((prev) =>
                prev ? { ...prev, status: "error", error: errorMsg } : null,
              );
              reject(new Error(errorMsg));
            }
          };

          xhr.onerror = () => {
            if (syncTimer) clearInterval(syncTimer);
            failedCount++;
            const netErr = t("cap.networkErrorUpload");
            setUploadTasks((prev) =>
              prev.map((t, idx) =>
                idx === i ? { ...t, status: "error", error: netErr } : t,
              ),
            );
            setCurrentUpload((prev) =>
              prev ? { ...prev, status: "error", error: netErr } : null,
            );
            reject(new Error(netErr));
          };

          xhr.open("POST", "/api/captures/upload");
          if (token) {
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          }
          xhr.send(form);
        });
      } catch (err) {
        console.warn("Upload failed for item:", file.name, err);
      }
    }

    setUploading(false);
    loadPage(true);

    if (validFiles.length === 1 && completedCount === 1) {
      showToast(t("cap.uploadedFile", { name: validFiles[0].name }), "success");
    } else if (completedCount > 0) {
      showToast(
        t("cap.uploadedFilesCount", { count: completedCount }),
        "success",
      );
    }
    if (failedCount > 0) {
      const errMsg = t("cap.batchFailedCount", {
        failed: failedCount,
        total: validFiles.length,
      });
      setUploadError(errMsg);
      showToast(errMsg, "error");
    }

    if (uploadDismissTimer.current) clearTimeout(uploadDismissTimer.current);
    uploadDismissTimer.current = setTimeout(() => {
      setUploadTasks((prev) =>
        prev.every((t) => t.status === "completed") ? [] : prev,
      );
      setCurrentUpload((prev) => (prev?.status === "completed" ? null : prev));
    }, 4500);
  }

  async function handleManualUpload(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    event.target.value = "";
    await uploadSelectedFiles(files);
  }

  async function openMoveToModal() {
    setUploadError(null);
    setIsCreatingMoveFolder(false);
    setNewMoveFolderName("");
    const { data: wsRows, error: wsError } =
      await supabase.rpc("get_my_workspaces");
    if (wsError) {
      setUploadError(wsError.message);
      return;
    }
    const wsList = ((wsRows ?? []) as Array<{ id: string; name: string }>).map(
      (ws) => ({ id: ws.id, name: ws.name }),
    );
    setMoveWorkspaces(wsList);
    const initialWorkspaceId = workspaceParam || wsList[0]?.id || "";
    setMoveTargetWorkspaceId(initialWorkspaceId);
    if (initialWorkspaceId) {
      const { data: folderRows, error: folderError } = await supabase
        .from("workspace_folders")
        .select("name")
        .eq("workspace_id", initialWorkspaceId)
        .order("name", { ascending: true });
      if (folderError) {
        setUploadError(folderError.message);
        return;
      }
      const folderList = ((folderRows ?? []) as Array<{ name: string }>).map(
        (f) => f.name,
      );
      setMoveFolders(folderList);
      setMoveTargetFolderName("");
    } else {
      setMoveFolders([]);
      setMoveTargetFolderName("");
    }
    setMoveToOpen(true);
  }

  async function loadMoveFolders(workspaceId: string) {
    setMoveTargetWorkspaceId(workspaceId);
    setIsCreatingMoveFolder(false);
    setNewMoveFolderName("");
    const { data: folderRows, error: folderError } = await supabase
      .from("workspace_folders")
      .select("name")
      .eq("workspace_id", workspaceId)
      .order("name", { ascending: true });
    if (folderError) {
      setUploadError(folderError.message);
      return;
    }
    const folderList = ((folderRows ?? []) as Array<{ name: string }>).map(
      (f) => f.name,
    );
    setMoveFolders(folderList);
    setMoveTargetFolderName("");
  }

  // Bulk tag / status. One update for the whole selection - RLS decides which
  // rows it may touch, same as the single-card edit path.
  const [bulkField, setBulkField] = useState<"tag" | "status" | null>(null);
  const [bulkSaving, setBulkSaving] = useState(false);
  async function applyBulkField(field: "tag" | "status", value: string) {
    if (bulkSaving || selectedIds.size === 0) return;
    setBulkSaving(true);
    const ids = Array.from(selectedIds);
    // .select() so RLS-skipped rows are visible: an update that touches nothing
    // returns no error, and without this the UI would claim rows it never changed.
    const { data, error } = await supabase
      .from("captures")
      .update({ [field]: value })
      .in("id", ids)
      .select("id");
    setBulkSaving(false);
    setBulkField(null);
    if (error) {
      showToast(error.message, "error");
      return;
    }
    const updated = new Set(
      ((data ?? []) as Array<{ id: string }>).map((r) => r.id),
    );
    setCaptures((prev) =>
      prev.map((c) => (updated.has(c.id) ? { ...c, [field]: value } : c)),
    );
    clearSelection();
    showToast(t("cap.bulkUpdated", { count: updated.size }), "success");
  }

  async function submitMoveTo() {
    if (moving || selectedIds.size === 0 || !moveTargetWorkspaceId) return;
    setMoving(true);
    setUploadError(null);
    try {
      const ids = Array.from(selectedIds);
      const targetFolder = moveTargetFolderName || null;

      const results = await Promise.allSettled(
        ids.map((captureId) =>
          supabase.rpc("move_capture_to_workspace_folder", {
            p_capture_id: captureId,
            p_target_workspace_id: moveTargetWorkspaceId,
            p_target_folder_name: targetFolder,
          }),
        ),
      );

      const failed = results.filter(
        (r) =>
          r.status === "rejected" ||
          (r.status === "fulfilled" && r.value.error),
      );
      if (failed.length > 0 && failed.length === ids.length) {
        const firstErr =
          failed[0].status === "rejected"
            ? failed[0].reason
            : (
                failed[0] as PromiseFulfilledResult<{
                  error?: { message?: string };
                }>
              ).value.error?.message;
        throw new Error(firstErr || t("cap.moveFailed"));
      }

      const failedIds = new Set<string>();
      results.forEach((r, idx) => {
        if (
          r.status === "rejected" ||
          (r.status === "fulfilled" && r.value.error)
        ) {
          failedIds.add(ids[idx]);
        }
      });
      const successfulIds = new Set(ids.filter((id) => !failedIds.has(id)));

      // Optimistically update local captures state strictly for successful IDs
      setCaptures((prev) =>
        prev
          .map((c) => {
            if (!successfulIds.has(c.id)) return c;
            return {
              ...c,
              workspace_id: moveTargetWorkspaceId,
              folder_name: targetFolder,
            };
          })
          .filter((c) => {
            if (workspaceParam && c.workspace_id !== workspaceParam)
              return false;
            if (folderParam && c.folder_name !== folderParam) return false;
            return true;
          }),
      );

      const movedCount = successfulIds.size;
      setMoveToOpen(false);
      clearSelection();
      await loadPage(true);
      if (failedIds.size > 0) {
        showToast(
          t("cap.movedWithFailures", {
            moved: movedCount,
            failed: failedIds.size,
          }),
          "info",
        );
      } else {
        showToast(
          movedCount === 1
            ? t("cap.movedCount", { count: movedCount })
            : t("cap.movedCountPlural", { count: movedCount }),
          "success",
        );
      }
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : t("cap.moveFailed"),
      );
      showToast(t("cap.moveFailed"), "error");
    } finally {
      setMoving(false);
    }
  }

  const handleBulkCopyLinks = useCallback(() => {
    if (selectedIds.size === 0) return;
    const links = Array.from(selectedIds)
      .map((id) => `${window.location.origin}/v/${id}`)
      .join("\n");
    navigator.clipboard
      ?.writeText(links)
      .then(() => {
        showToast(
          t("cap.copyLinksSuccess", { count: selectedIds.size }),
          "success",
        );
      })
      .catch(() => {
        showToast(t("cap.copyLinksFailed"), "error");
      });
  }, [selectedIds, showToast, t]);

  const activeFilterCount =
    (showVideo || showScreenshot ? 1 : 0) +
    (filterTag ? 1 : 0) +
    (filterStatus ? 1 : 0) +
    (search.trim() ? 1 : 0);
  function clearAllFilters() {
    setShowVideo(false);
    setShowScreenshot(false);
    setFilterTag("");
    setFilterStatus("");
    setSearch("");
    if (folderParam || projectParam) {
      const url = new URL(window.location.href);
      url.searchParams.delete("folder");
      url.searchParams.delete("project");
      router.replace(`${url.pathname}${url.search}`, { scroll: false });
    }
  }

  // loadPage already applied every filter server-side.
  const filteredCaptures = workspaceCaptures;

  // Type counts are for the whole scope, not the loaded page - a head count is
  // the cheapest way to get that without fetching the rows.
  const [typeCounts, setTypeCounts] = useState({ video: 0, screenshot: 0 });
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const counts = await Promise.all(
        (["video", "screenshot"] as const).map(async (type) => {
          let q = supabase
            .from("captures")
            .select("id", { count: "exact", head: true })
            .eq("type", type);
          if (workspaceParam) q = q.eq("workspace_id", workspaceParam);
          if (folderParam) q = q.eq("folder_name", folderParam);
          if (projectFilter) q = q.eq("project_id", projectFilter);
          const { count } = await q;
          return count || 0;
        }),
      );
      if (!cancelled)
        setTypeCounts({ video: counts[0], screenshot: counts[1] });
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceParam, folderParam, projectFilter]);
  const videoCount = typeCounts.video;
  const screenshotCount = typeCounts.screenshot;

  const toggleSelectAllVisible = useCallback(() => {
    if (filteredCaptures.length === 0) return;
    const allSelected = filteredCaptures.every((c) => selectedIds.has(c.id));
    if (allSelected) {
      clearSelection();
    } else {
      setSelectedIds(new Set(filteredCaptures.map((c) => c.id)));
    }
  }, [filteredCaptures, selectedIds, clearSelection]);

  return (
    <div
      className="w-full min-w-0 p-3 sm:p-8 max-w-6xl mx-auto"
      onDragEnter={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        const files = Array.from(e.dataTransfer.files || []);
        if (files.length > 0) void uploadSelectedFiles(files);
      }}
    >
      {dragActive && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/40 dark:bg-black/60 backdrop-blur-sm border-4 border-dashed border-[#89BD49] m-3 sm:m-6 rounded-3xl transition-all animate-in fade-in zoom-in-95 duration-200"
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={(e) => {
            if (e.currentTarget === e.target) {
              setDragActive(false);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            const files = Array.from(e.dataTransfer.files || []);
            if (files.length > 0) void uploadSelectedFiles(files);
          }}
        >
          <div className="bg-white dark:bg-zinc-900 border border-border p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 max-w-md text-center pointer-events-none transform transition-transform">
            <div className="w-16 h-16 rounded-2xl bg-[#89BD49]/10 dark:bg-[#89BD49]/20 border border-[#89BD49]/30 dark:border-[#89BD49]/40 flex items-center justify-center text-[#6B9A35] dark:text-[#A8D666] shadow-inner">
              <svg
                className="w-8 h-8 animate-bounce"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-foreground text-base">
                {t("cap.dropFile")}
              </p>
              <p className="text-xs text-muted mt-1.5 max-w-xs">
                {t("cap.dropFileHint")}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-subtle border border-border text-muted">
                PNG
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-subtle border border-border text-muted">
                JPG
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-subtle border border-border text-muted">
                MP4
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-subtle border border-border text-muted">
                WEBM
              </span>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 sm:mb-8 gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("cap.title")}
        </h1>

        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 min-w-[150px] sm:min-w-[200px] lg:flex-none lg:w-64">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
            <input
              type="text"
              placeholder={t("cap.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-9 pr-3 text-sm rounded-lg border border-border bg-subtle text-foreground placeholder:text-muted focus:outline-none focus:border-[#89BD49] focus:ring-1 focus:ring-[#89BD49]/20 w-full"
            />
          </div>

          {/* Compact upload icon button */}
          {(() => {
            const ringProgress =
              uploadTasks.length > 1
                ? Math.round(
                    uploadTasks.reduce(
                      (acc, t) =>
                        acc + (t.status === "completed" ? 100 : t.progress),
                      0,
                    ) / uploadTasks.length,
                  )
                : (currentUpload?.progress ?? 0);
            return (
              <label
                title={
                  uploading
                    ? uploadTasks.length > 1
                      ? t("cap.uploadingBatch", {
                          current: String(
                            Math.min(
                              uploadTasks.length,
                              uploadTasks.filter((t) => t.status === "completed")
                                .length + 1,
                            ),
                          ),
                          total: String(uploadTasks.length),
                        })
                      : currentUpload?.status === "syncing"
                        ? t("cap.syncingToDrive")
                        : t("cap.uploadingTitle", {
                            progress: String(currentUpload?.progress ?? 0),
                          })
                    : t("cap.uploadBtnTitle")
                }
                className={`relative h-10 w-10 flex items-center justify-center rounded-lg border transition-colors shrink-0 cursor-pointer ${
                  uploading
                    ? "border-[#89BD49]/40 bg-[#89BD49]/10 text-[#6B9A35] dark:text-[#A8D666] cursor-wait"
                    : "border-border bg-subtle text-muted hover:text-foreground hover:border-[#89BD49]/40"
                }`}
              >
                <input
                  type="file"
                  className="hidden"
                  onChange={handleManualUpload}
                  accept="image/*,video/*"
                  multiple
                  disabled={uploading}
                />
                {uploading ? (
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                )}
                {/* Progress ring overlay */}
                {uploading && ringProgress > 0 && (
                  <svg
                    className="absolute inset-0 w-10 h-10 -rotate-90 pointer-events-none"
                    viewBox="0 0 40 40"
                  >
                    <circle
                      cx="20"
                      cy="20"
                      r="17"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className="text-[#89BD49]/20"
                    />
                    <circle
                      cx="20"
                      cy="20"
                      r="17"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className="text-[#89BD49] transition-all duration-300"
                      strokeDasharray={`${2 * Math.PI * 17}`}
                      strokeDashoffset={`${2 * Math.PI * 17 * (1 - ringProgress / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </label>
            );
          })()}
        </div>
      </div>

      {/* Filter & Selection Row - sticky so filters and multi-select actions stay accessible while scrolling */}
      <div className="relative sm:sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 mb-6 pb-4 pt-3 border-b border-border bg-background">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div ref={typeMenuRef} className="relative min-w-0">
            <button
              onClick={() => setTypeMenuOpen((o) => !o)}
              className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                typeMenuOpen || showVideo || showScreenshot
                  ? "bg-subtle border-[#89BD49]/40 text-foreground"
                  : "bg-subtle border-border text-muted hover:text-foreground hover:bg-subtle"
              }`}
            >
              <span>{t("cap.type")}</span>
              {(showVideo || showScreenshot) && (
                <span className="w-2 h-2 rounded-full bg-[#89BD49] shrink-0" />
              )}
              <svg
                className={`w-3.5 h-3.5 text-muted transition-transform ${typeMenuOpen ? "rotate-180" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {typeMenuOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-[min(16rem,calc(100vw-1.5rem))] z-30 bg-subtle border border-border rounded-lg shadow-lg overflow-hidden">
                <div className="px-3 pt-3 pb-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                    {t("cap.type")}
                  </p>
                </div>

                {/* Screenshot row */}
                <label
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors text-sm ${showScreenshot ? "text-foreground" : "text-muted"}`}
                >
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${showScreenshot ? "bg-[#89BD49] border-[#89BD49]" : "border-border"}`}
                    onClick={() => setShowScreenshot((v) => !v)}
                  >
                    {showScreenshot && (
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="w-7 h-7 rounded-md bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center shrink-0">
                    <svg
                      className="w-4 h-4 text-rose-500 dark:text-rose-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium leading-none">
                      {t("cap.screenshot")}
                    </p>
                    <p className="text-[11px] text-muted mt-0.5">
                      {t("cap.screenshotHint")}
                    </p>
                  </div>
                  <span className="text-xs text-muted">
                    ({screenshotCount})
                  </span>
                </label>

                {/* Video row */}
                <label
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors text-sm ${showVideo ? "text-foreground" : "text-muted"}`}
                >
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${showVideo ? "bg-[#89BD49] border-[#89BD49]" : "border-border"}`}
                    onClick={() => setShowVideo((v) => !v)}
                  >
                    {showVideo && (
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="w-7 h-7 rounded-md bg-[#89BD49]/15 dark:bg-[#89BD49]/20 flex items-center justify-center shrink-0">
                    <svg
                      className="w-4 h-4 text-[#89BD49] dark:text-[#A8D666]"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium leading-none">{t("cap.video")}</p>
                    <p className="text-[11px] text-muted mt-0.5">
                      {t("cap.videoHint")}
                    </p>
                  </div>
                  <span className="text-xs text-muted">({videoCount})</span>
                </label>

                <div className="border-t border-border mt-1 px-3 py-2 flex justify-between">
                  <button
                    onClick={() => {
                      setShowVideo(true);
                      setShowScreenshot(true);
                    }}
                    className="text-xs text-muted hover:text-foreground transition-colors"
                  >
                    {t("cap.selectAll")}
                  </button>
                  <button
                    onClick={() => {
                      setShowVideo(false);
                      setShowScreenshot(false);
                    }}
                    className="text-xs text-muted hover:text-foreground transition-colors"
                  >
                    {t("cap.clear")}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tag Filter */}
          <div className="flex min-w-0 items-center gap-1.5 text-xs border border-border bg-subtle rounded-lg px-2 py-1.5 text-muted hover:text-foreground hover:bg-subtle transition-colors">
            <span>{t("cap.tagFilter")}</span>
            <Dropdown
              variant="inline"
              className="flex-1"
              value={filterTag}
              onChange={setFilterTag}
              options={[
                { value: "", label: t("cap.all") },
                ...TAG_OPTIONS.map((t) => ({ value: t, label: t })),
              ]}
            />
          </div>

          {/* Status Filter */}
          <div className="flex min-w-0 items-center gap-1.5 text-xs border border-border bg-subtle rounded-lg px-2 py-1.5 text-muted hover:text-foreground hover:bg-subtle transition-colors">
            <span>{t("cap.statusFilter")}</span>
            <Dropdown
              variant="inline"
              className="flex-1"
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: "", label: t("cap.all") },
                ...STATUS_OPTIONS.map((s) => ({ value: s, label: s })),
              ]}
            />
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors"
            >
              <span className="w-4 h-4 rounded-md bg-[#89BD49] text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
              {t("cap.clearFilters")}
            </button>
          )}

          {/* Quick Select All in Filter Bar (only visible when no items are selected) */}
          {filteredCaptures.length > 0 && selectedIds.size === 0 && (
            <button
              type="button"
              onClick={toggleSelectAllVisible}
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-border bg-subtle text-muted hover:text-foreground hover:bg-subtle/80 transition-colors cursor-pointer"
              title={t("cap.selectAll")}
            >
              <span className="w-3.5 h-3.5 rounded border border-slate-300 dark:border-zinc-600 flex items-center justify-center text-[10px]" />
              <span>{t("cap.selectAll")}</span>
            </button>
          )}

          {/* Scan Missing Drive files button */}
          <button
            type="button"
            onClick={() => scanMissingDrive(true)}
            disabled={scanningDrive}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-border bg-subtle text-muted hover:text-foreground hover:bg-subtle/80 transition-colors cursor-pointer disabled:opacity-50"
            title={t("cap.scanMissing")}
          >
            <svg
              className={`w-3.5 h-3.5 ${scanningDrive ? "animate-spin text-amber-500" : "text-muted"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="hidden md:inline">
              {scanningDrive ? t("cap.scanning") : t("cap.scanMissing")}
            </span>
          </button>
        </div>

        {/* View Mode Toggle (Grid / List) */}
        <div className="flex items-center gap-1 border border-border bg-subtle rounded-lg p-0.5 shrink-0 ml-auto sm:ml-0">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            aria-pressed={viewMode === "grid"}
            aria-label={t("cap.viewGrid")}
            title={t("cap.viewGrid")}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === "grid"
                ? "bg-white dark:bg-background text-foreground shadow-xs"
                : "text-muted hover:text-foreground"
            }`}
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            aria-pressed={viewMode === "list"}
            aria-label={t("cap.viewList")}
            title={t("cap.viewList")}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === "list"
                ? "bg-white dark:bg-background text-foreground shadow-xs"
                : "text-muted hover:text-foreground"
            }`}
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="8" y1="6" x2="21" y2="6" strokeLinecap="round" />
              <line x1="8" y1="12" x2="21" y2="12" strokeLinecap="round" />
              <line x1="8" y1="18" x2="21" y2="18" strokeLinecap="round" />
              <circle cx="4" cy="6" r="1" fill="currentColor" />
              <circle cx="4" cy="12" r="1" fill="currentColor" />
              <circle cx="4" cy="18" r="1" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>

      {/* Upload toast - fixed bottom-20 right-4 so it floats comfortably above FloatingSupport */}
      {(uploadTasks.length > 0 || currentUpload !== null) && (
        <div
          className="fixed bottom-20 right-4 sm:bottom-22 sm:right-5 z-40 w-[min(22rem,calc(100vw-2rem))] sm:w-96 rounded-2xl border bg-background/95 backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200 overflow-hidden"
          style={{
            borderColor:
              uploadTasks.length > 1
                ? uploadTasks.some((t) => t.status === "error")
                  ? "rgb(239 68 68 / 0.4)"
                  : uploadTasks.every((t) => t.status === "completed")
                    ? "rgb(34 197 94 / 0.4)"
                    : "rgb(137 189 73 / 0.4)"
                : currentUpload?.status === "error"
                  ? "rgb(239 68 68 / 0.4)"
                  : currentUpload?.status === "completed"
                    ? "rgb(34 197 94 / 0.4)"
                    : "rgb(137 189 73 / 0.4)",
          }}
        >
          {uploadTasks.length > 1 ? (
            /* Multi-file batch upload progress view */
            (() => {
              const totalCount = uploadTasks.length;
              const completedCount = uploadTasks.filter(
                (t) => t.status === "completed",
              ).length;
              const failedCount = uploadTasks.filter(
                (t) => t.status === "error",
              ).length;
              const allDone = completedCount + failedCount === totalCount;
              const avgProgress = Math.round(
                uploadTasks.reduce(
                  (acc, t) =>
                    acc + (t.status === "completed" ? 100 : t.progress),
                  0,
                ) / totalCount,
              );

              return (
                <div>
                  <div className="flex items-center gap-3 px-3.5 py-3">
                    {/* Status icon */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        allDone && failedCount === 0
                          ? "bg-emerald-500/15 text-emerald-500"
                          : failedCount > 0
                            ? "bg-red-500/15 text-red-500"
                            : "bg-[#89BD49]/15 text-[#6B9A35] dark:text-[#A8D666]"
                      }`}
                    >
                      {allDone && failedCount === 0 ? (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : failedCount > 0 && allDone ? (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8H4z"
                          />
                        </svg>
                      )}
                    </div>

                    {/* Summary text */}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {allDone
                          ? failedCount > 0
                            ? t("cap.batchFailedCount", {
                                failed: String(failedCount),
                                total: String(totalCount),
                              })
                            : t("cap.savedAllToDrive", {
                                count: String(totalCount),
                              })
                          : t("cap.uploadingBatch", {
                              current: String(
                                Math.min(totalCount, completedCount + 1),
                              ),
                              total: String(totalCount),
                            })}
                      </p>
                      <p
                        className={`text-[11px] mt-0.5 truncate ${
                          failedCount > 0 && allDone
                            ? "text-red-500"
                            : allDone
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-muted"
                        }`}
                      >
                        {allDone
                          ? `${completedCount} of ${totalCount} completed`
                          : `${completedCount} of ${totalCount} completed (${avgProgress}%)`}
                      </p>
                    </div>

                    {/* Right action / percentage */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded-full bg-subtle text-muted border border-border">
                        {avgProgress}%
                      </span>
                      {allDone && (
                        <button
                          type="button"
                          onClick={() => {
                            setUploadTasks([]);
                            setCurrentUpload(null);
                          }}
                          className="p-1 rounded-md text-muted hover:text-foreground hover:bg-subtle transition-colors"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Slim overall progress bar */}
                  <div className="h-1 w-full bg-border/40">
                    <div
                      className={`h-full transition-all duration-300 ${
                        allDone && failedCount === 0
                          ? "bg-emerald-500"
                          : failedCount > 0
                            ? "bg-red-500"
                            : "bg-[#89BD49]"
                      }`}
                      style={{ width: `${avgProgress}%` }}
                    />
                  </div>

                  {/* Collapsible item list */}
                  <div className="max-h-36 overflow-y-auto divide-y divide-border/20 px-3 py-1 bg-subtle/30">
                    {uploadTasks.map((taskItem, idx) => (
                      <div
                        key={`${taskItem.name}-${idx}`}
                        className="flex items-center justify-between gap-2 py-1.5 text-xs min-w-0"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {taskItem.status === "completed" ? (
                            <svg
                              className="w-3.5 h-3.5 text-emerald-500 shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : taskItem.status === "error" ? (
                            <svg
                              className="w-3.5 h-3.5 text-red-500 shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          ) : taskItem.status === "syncing" || taskItem.status === "uploading" ? (
                            <svg
                              className="w-3.5 h-3.5 text-[#89BD49] animate-spin shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8H4z"
                              />
                            </svg>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-muted-foreground/30 ml-0.5 mr-1 shrink-0" />
                          )}
                          <span className="truncate font-medium text-foreground/90 max-w-[170px] sm:max-w-[210px]">
                            {taskItem.name}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-medium shrink-0 tabular-nums ${
                            taskItem.status === "completed"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : taskItem.status === "error"
                                ? "text-red-500"
                                : taskItem.status === "syncing"
                                  ? "text-[#6B9A35] dark:text-[#A8D666]"
                                  : "text-muted"
                          }`}
                        >
                          {taskItem.status === "completed"
                            ? "Done"
                            : taskItem.status === "error"
                              ? "Failed"
                              : taskItem.status === "syncing"
                                ? t("cap.syncingToDrive")
                                : `${taskItem.progress}%`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()
          ) : (
            /* Single-file upload progress view */
            (() => {
              const activeTask = uploadTasks[0] || currentUpload;
              if (!activeTask) return null;
              return (
                <div>
                  <div className="flex items-center gap-3 px-3 py-3">
                    {/* Status icon */}
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        activeTask.status === "completed"
                          ? "bg-emerald-500/15 text-emerald-500"
                          : activeTask.status === "error"
                            ? "bg-red-500/15 text-red-500"
                            : "bg-[#89BD49]/15 text-[#6B9A35] dark:text-[#A8D666]"
                      }`}
                    >
                      {activeTask.status === "completed" ? (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : activeTask.status === "error" ? (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8H4z"
                          />
                        </svg>
                      )}
                    </div>

                    {/* Text */}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {activeTask.name}
                      </p>
                      <p
                        className={`text-[11px] mt-0.5 ${
                          activeTask.status === "error"
                            ? "text-red-500"
                            : activeTask.status === "completed"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-muted"
                        }`}
                      >
                        {activeTask.status === "uploading" &&
                          t("cap.uploadingTitle", {
                            progress: String(activeTask.progress),
                          })}
                        {activeTask.status === "syncing" &&
                          t("cap.syncingToDrive")}
                        {activeTask.status === "completed" &&
                          t("cap.savedToDrive")}
                        {activeTask.status === "error" &&
                          (activeTask.error ?? t("cap.uploadFailed"))}
                      </p>
                    </div>

                    {/* Dismiss (only when done) */}
                    {(activeTask.status === "completed" ||
                      activeTask.status === "error") && (
                      <button
                        type="button"
                        onClick={() => {
                          setUploadTasks([]);
                          setCurrentUpload(null);
                        }}
                        className="p-1 rounded-md text-muted hover:text-foreground hover:bg-subtle transition-colors shrink-0"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Slim progress bar */}
                  <div className="h-0.5 w-full bg-border/40">
                    <div
                      className={`h-full transition-all duration-300 ${
                        activeTask.status === "completed"
                          ? "bg-emerald-500"
                          : activeTask.status === "error"
                            ? "bg-red-500"
                            : "bg-[#89BD49]"
                      }`}
                      style={{ width: `${activeTask.progress}%` }}
                    />
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

      {(deleteError || (!currentUpload && uploadTasks.length === 0 && uploadError)) && (
        <div className="mb-6 rounded-lg px-4 py-3 text-xs border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400">
          {deleteError || uploadError}
        </div>
      )}

      {/* 1-Click Ghost Cleanup Banner for Missing Drive Files */}
      {allMissingDriveIds.length > 0 && !currentUpload && uploadTasks.length === 0 && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-xs text-amber-900 dark:text-amber-200 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <span className="font-semibold">
                {allMissingDriveIds.length === 1
                  ? t("cap.missingBannerOne")
                  : t("cap.missingBannerMany", {
                      count: allMissingDriveIds.length,
                    })}
              </span>
              <span className="text-amber-700/80 dark:text-amber-400/80 ml-1.5 hidden sm:inline">
                {t("cap.missingBannerHint")}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                openDeleteConfirmation(
                  allMissingDriveIds,
                  `${allMissingDriveIds.length} missing captures`,
                  "app_only",
                )
              }
              className="rounded-lg bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-medium px-3 py-1.5 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            >
              {t("cap.cleanUpDashboard", { count: allMissingDriveIds.length })}
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set(allMissingDriveIds))}
              className="rounded-lg border border-amber-300 dark:border-amber-800/60 bg-white dark:bg-subtle text-amber-800 dark:text-amber-200 font-medium px-3 py-1.5 hover:bg-amber-100/50 transition-colors cursor-pointer whitespace-nowrap"
            >
              {t("cap.selectAll")}
            </button>
            <button
              type="button"
              onClick={() => scanMissingDrive(true)}
              disabled={scanningDrive}
              className="rounded-lg border border-amber-300 dark:border-amber-800/60 bg-white dark:bg-subtle text-amber-800 dark:text-amber-200 font-medium px-2.5 py-1.5 hover:bg-amber-100/50 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 disabled:opacity-50"
              title={t("cap.scanMissing")}
            >
              <svg
                className={`w-3.5 h-3.5 ${scanningDrive ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>
                {scanningDrive ? t("cap.scanning") : t("cap.scanMissing")}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-white dark:bg-subtle overflow-hidden animate-pulse shadow-sm"
            >
              <div className="aspect-[16/10] bg-slate-200 dark:bg-background" />
              <div className="p-4 flex justify-between">
                <div className="w-1/2 h-4 bg-slate-200 dark:bg-border rounded" />
                <div className="w-16 h-4 bg-slate-200 dark:bg-border rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredCaptures.length === 0 ? (
        activeFilterCount > 0 ? (
          <div className="px-4 py-14 sm:py-20 text-center rounded-xl border border-dashed border-border bg-subtle/50 flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-[#89BD49]/10 dark:bg-[#89BD49]/20 border border-[#89BD49]/30 dark:border-[#89BD49]/40 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-[#6B9A35] dark:text-[#A8D666]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {t("cap.noMatch")}
              </h3>
              <p className="text-xs text-muted mt-1 max-w-sm mx-auto text-balance">
                {t("cap.noMatchHint")}
              </p>
            </div>
            <button
              onClick={clearAllFilters}
              className="mt-1 px-4 py-2 rounded-lg border border-border bg-subtle text-sm font-semibold text-foreground hover:bg-subtle/80 transition-colors"
            >
              {t("cap.clearFilters")}
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/80 bg-white/80 dark:bg-subtle/70 p-6 sm:p-10 text-center shadow-lg shadow-slate-200/50 dark:shadow-none backdrop-blur-sm space-y-8">
            <div className="max-w-xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg border border-[#89BD49]/30 bg-[#89BD49]/10 text-[#6B9A35] dark:text-[#A8D666] text-xs font-semibold">
                <span>{t("cap.quickStartTitle")}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-foreground tracking-tight">
                {t("cap.empty")}
              </h2>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                {t("cap.quickStartDesc")}
              </p>
            </div>

            {/* 3 Step Onboarding Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              {/* Step 1 */}
              <div className="rounded-xl border border-border bg-white dark:bg-subtle p-5 flex flex-col justify-between space-y-4 hover:border-[#89BD49]/40 transition-colors">
                <div className="space-y-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#89BD49]/15 text-[#6B9A35] dark:text-[#A8D666] flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <h3 className="text-sm font-bold text-foreground">
                    {t("cap.step1Title")}
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    {t("cap.step1Desc")}
                  </p>
                </div>
                <a
                  href={CHROME_WEB_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-[#89BD49] hover:bg-[#6B9A35] text-white text-xs font-semibold shadow-xs shadow-[#89BD49]/25 transition-all w-full"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/icons/chrome.svg"
                    alt="Chrome"
                    className="w-3.5 h-3.5 shrink-0"
                  />
                  <span>{t("cap.install")}</span>
                </a>
              </div>

              {/* Step 2 */}
              <div className="rounded-xl border border-border bg-white dark:bg-subtle p-5 flex flex-col justify-between space-y-4 hover:border-[#89BD49]/40 transition-colors">
                <div className="space-y-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#89BD49]/15 text-[#6B9A35] dark:text-[#A8D666] flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <h3 className="text-sm font-bold text-foreground">
                    {t("cap.step2Title")}
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    {t("cap.step2Desc")}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg border border-border/80 bg-slate-50 dark:bg-subtle/50 flex items-center justify-center gap-2 text-xs">
                  <span className="text-muted text-[11px]">
                    {t("cap.hotkey")}
                  </span>
                  <kbd className="px-2 py-0.5 text-[11px] font-mono font-bold bg-white dark:bg-subtle text-foreground border border-slate-300 dark:border-border rounded-md shadow-2xs">
                    Alt + Shift + S
                  </kbd>
                </div>
              </div>

              {/* Step 3 */}
              <div className="rounded-xl border border-border bg-white dark:bg-subtle p-5 flex flex-col justify-between space-y-4 hover:border-[#89BD49]/40 transition-colors">
                <div className="space-y-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#89BD49]/15 text-[#6B9A35] dark:text-[#A8D666] flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <h3 className="text-sm font-bold text-foreground">
                    {t("cap.step3Title")}
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    {t("cap.step3Desc")}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg border border-border/80 bg-slate-50 dark:bg-subtle/50 flex items-center justify-between text-xs text-muted">
                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-sm bg-emerald-500" />
                    {t("cap.autoDriveSync")}
                  </span>
                  <span className="text-[10px] font-mono">
                    {t("cap.oneClickShare")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      ) : viewMode === "list" ? (
        <div className="rounded-xl border border-border bg-white dark:bg-subtle divide-y divide-border overflow-hidden shadow-xs">
          {filteredCaptures.map((item) => {
            const isSelected = selectedIds.has(item.id);
            const isSelectionActive = selectedIds.size > 0;
            const isMe =
              !!myProfile &&
              !!item.owner_email &&
              item.owner_email.toLowerCase() === myProfile.email.toLowerCase();
            const CardWrapper = (
              isSelectionActive ? "div" : Link
            ) as React.ElementType;
            const cardProps = isSelectionActive
              ? {
                  onClick: (e: React.MouseEvent) => {
                    e.preventDefault();
                    toggleSelect(item.id);
                  },
                  className:
                    "flex items-center gap-3 p-3 flex-1 cursor-pointer select-none min-w-0",
                }
              : {
                  href: `/v/${item.id}`,
                  className: "flex items-center gap-3 p-3 flex-1 group min-w-0",
                };

            return (
              <div
                key={item.id}
                onMouseEnter={() => {
                  activeHoverRef.current = item.id;
                }}
                onMouseLeave={() => {
                  if (activeHoverRef.current === item.id)
                    activeHoverRef.current = null;
                }}
                className={`group relative flex items-center transition-colors hover:bg-slate-50 dark:hover:bg-subtle/80 ${
                  isSelected ? "bg-[#89BD49]/5 dark:bg-[#89BD49]/10" : ""
                }`}
              >
                {/* Checkbox */}
                <div className="pl-3 shrink-0 flex items-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleSelect(item.id);
                    }}
                    aria-label={t("cap.selectCapture")}
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-[#89BD49] border-[#89BD49] text-white"
                        : isSelectionActive
                          ? "border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-transparent"
                          : "border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-transparent opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <svg
                      className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-transparent"}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </button>
                </div>

                <CardWrapper {...cardProps}>
                  {/* Compact Thumbnail */}
                  <div className="w-16 h-10 sm:w-20 sm:h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-background flex items-center justify-center text-muted text-xs relative shrink-0">
                    {driveThumbUrl(item.drive_url, 120) &&
                    !thumbFailed[item.id] ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={driveThumbUrl(item.drive_url, 120)!}
                          alt={item.title}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setThumbFailed((prev) => ({
                              ...prev,
                              [item.id]: true,
                            }))
                          }
                          className="w-full h-full object-cover"
                        />
                        {item.type === "video" && (
                          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/25">
                            <svg
                              className="w-4 h-4 text-white fill-current"
                              viewBox="0 0 24 24"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        )}
                      </>
                    ) : item.type === "video" ? (
                      <svg
                        className="w-5 h-5 text-[#89BD49]"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5 text-rose-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Title + Folder + Badges */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-foreground truncate group-hover:text-[#6B9A35] dark:group-hover:text-[#A8D666] transition-colors">
                        {item.title}
                      </h3>
                      {item.type === "video" && item.duration ? (
                        <span className="text-[10px] text-muted shrink-0 hidden sm:inline">
                          {formatDuration(item.duration)}
                        </span>
                      ) : null}
                      {item.expires_at &&
                        new Date(item.expires_at).getTime() < Date.now() && (
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-red-600 bg-red-100 dark:bg-red-950/40 dark:text-red-400 px-1.5 py-0.5 rounded shrink-0">
                            {t("cap.expired")}
                          </span>
                        )}
                      {item.password && (
                        <span className="text-[9px] font-semibold text-amber-700 bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0">
                          <svg
                            className="w-2.5 h-2.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect x="3" y="11" width="18" height="11" rx="2" />
                            <path d="M7 11V7a5 5 0 0110 0v4" />
                          </svg>
                          {t("cap.locked")}
                        </span>
                      )}
                      {(thumbFailed[item.id] ||
                        (Boolean(item.drive_url) &&
                          !driveFileId(item.drive_url)) ||
                        scannedMissingIds.includes(item.id)) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openDeleteConfirmation(
                              [item.id],
                              item.title,
                              "app_only",
                            );
                          }}
                          className="text-[9px] font-semibold text-amber-700 bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/60 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                          title={t("cap.driveMissingTooltip")}
                        >
                          <svg
                            className="w-2.5 h-2.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                          </svg>
                          <span>{t("cap.driveMissing")}</span>
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted">
                      {item.folder_name && (
                        <span className="truncate max-w-[120px]">
                          {item.folder_name}
                        </span>
                      )}
                      {item.folder_name && (item.tag || item.status) && (
                        <span>•</span>
                      )}
                      {item.tag && (
                        <span className="px-1.5 py-0.2 rounded bg-subtle border border-border text-[10px]">
                          {item.tag}
                        </span>
                      )}
                      {item.status && (
                        <span className="capitalize text-[10px]">
                          {item.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Owner & Time */}
                  <div className="hidden md:flex items-center gap-2 shrink-0 text-xs text-muted">
                    {isMe && myProfile?.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={myProfile.avatar}
                        alt=""
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setMyProfile((prev) =>
                            prev ? { ...prev, avatar: "" } : null,
                          )
                        }
                        className="w-5 h-5 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div
                        className={`w-5 h-5 rounded-full ${getAvatarColor(item.owner_email)} text-white text-[10px] font-bold flex items-center justify-center shrink-0`}
                      >
                        {isMe
                          ? initialOf(myProfile?.name)
                          : getOwnerInitial(item.owner_email)}
                      </div>
                    )}
                    <span className="text-muted shrink-0 text-[11px]">
                      {timeAgo(item.created_at, t)}
                    </span>
                  </div>
                </CardWrapper>

                {/* Row Actions */}
                {!isSelectionActive && (
                  <div className="pr-3 shrink-0 flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={t("cap.copyLink")}
                      title={t("cap.copyLink")}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCopyLink(item.id);
                      }}
                      className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-subtle text-muted hover:text-foreground flex items-center justify-center transition-colors"
                    >
                      {copiedId === item.id ? (
                        <svg
                          className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : (
                        <svg
                          className="w-3.5 h-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                      )}
                    </button>

                    <button
                      type="button"
                      aria-label={t("cap.captureOptions")}
                      title={t("cap.optionsMenu")}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        const left =
                          typeof window !== "undefined"
                            ? Math.max(
                                12,
                                Math.min(
                                  rect.right - 128,
                                  window.innerWidth - 136,
                                ),
                              )
                            : rect.right - 128;
                        const top =
                          typeof window !== "undefined"
                            ? Math.min(
                                rect.bottom + 6,
                                window.innerHeight - 150,
                              )
                            : rect.bottom + 6;
                        setMenuPos({ top, left });
                        setActiveMenuId((prev) =>
                          prev === item.id ? null : item.id,
                        );
                      }}
                      className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-subtle text-muted hover:text-foreground flex items-center justify-center transition-colors"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <circle cx="12" cy="5" r="1.75" />
                        <circle cx="12" cy="12" r="1.75" />
                        <circle cx="12" cy="19" r="1.75" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCaptures.map((item) => {
            const isSelected = selectedIds.has(item.id);
            const isSelectionActive = selectedIds.size > 0;
            const isMe =
              !!myProfile &&
              !!item.owner_email &&
              item.owner_email.toLowerCase() === myProfile.email.toLowerCase();
            // When in selection mode (at least 1 item selected), clicking anywhere on the card toggles selection instead of opening the link
            const CardWrapper = (
              isSelectionActive ? "div" : Link
            ) as React.ElementType;
            const cardProps = isSelectionActive
              ? {
                  onClick: (e: React.MouseEvent) => {
                    e.preventDefault();
                    toggleSelect(item.id);
                  },
                  className: "flex flex-col flex-1 cursor-pointer select-none",
                }
              : {
                  href: `/v/${item.id}`,
                  className: "flex flex-col flex-1 group",
                };

            return (
              <div
                key={item.id}
                onMouseEnter={() => {
                  activeHoverRef.current = item.id;
                }}
                onMouseLeave={() => {
                  if (activeHoverRef.current === item.id)
                    activeHoverRef.current = null;
                }}
                className={`group relative rounded-xl border bg-white dark:bg-subtle shadow-sm hover:shadow-md transition-all flex flex-col ${
                  isSelected
                    ? "border-[#89BD49] ring-2 ring-[#89BD49]/20"
                    : "border-border"
                }`}
              >
                <CardWrapper {...cardProps}>
                  {/* Thumbnail Container */}
                  <div className="aspect-[16/10] rounded-t-xl overflow-hidden bg-slate-100 dark:bg-background flex items-center justify-center text-muted text-sm relative group-hover:bg-slate-200 dark:group-hover:bg-background/80 transition-colors">
                    {driveThumbUrl(item.drive_url, 400) &&
                    !thumbFailed[item.id] ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={driveThumbUrl(item.drive_url, 400)!}
                          alt={item.title}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setThumbFailed((prev) => ({
                              ...prev,
                              [item.id]: true,
                            }))
                          }
                          className="w-full h-full object-cover"
                        />
                        {/* Play overlay for videos so the grid clearly shows what's a recording */}
                        {item.type === "video" ? (
                          <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                            <div className="w-12 h-12 rounded-full bg-white/95 dark:bg-zinc-900/95 text-slate-900 dark:text-white shadow-xl flex items-center justify-center border border-white/30 group-hover:bg-[#89BD49] group-hover:text-white group-hover:scale-110 group-hover:border-[#89BD49]/40 group-hover:shadow-[#89BD49]/40 transition-all duration-200">
                              <svg
                                className="w-6 h-6 fill-current"
                                viewBox="0 0 24 24"
                              >
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                        ) : (
                          <div className="absolute inset-0 bg-black/15 group-hover:bg-black/35 transition-colors pointer-events-none" />
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5">
                        {item.type === "video" ? (
                          <div className="w-12 h-12 rounded-full bg-[#89BD49]/15 dark:bg-[#89BD49]/20 text-[#6B9A35] dark:text-[#A8D666] flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                            <svg
                              className="w-6 h-6"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        ) : (
                          <svg
                            className="w-8 h-8 text-[#6B9A35]/80 group-hover:scale-110 transition-transform"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                      </div>
                    )}

                    {/* Gradient Overlay for Top Badges */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/30 opacity-80 pointer-events-none" />

                    {/* Top-Left: Normal = Author Avatar & Name; Hover / Selected = Checkbox */}
                    <div className="absolute top-3 left-3 z-20 flex items-center">
                      {/* Checkbox: visible when selected OR on hover */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleSelect(item.id);
                        }}
                        aria-label={t("cap.selectCapture")}
                        className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all shadow-sm ${
                          isSelected
                            ? "bg-[#89BD49] border-[#89BD49] text-white opacity-100 flex"
                            : "bg-white/90 dark:bg-zinc-900/90 border-slate-300 dark:border-zinc-600 text-transparent opacity-0 group-hover:opacity-100 hidden group-hover:flex"
                        }`}
                      >
                        <svg
                          className={`w-4 h-4 ${isSelected ? "text-white" : "text-transparent group-hover:text-transparent"}`}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </button>

                      {/* Author Badge: hidden when selected OR on hover */}
                      <div
                        className={`items-center gap-2 transition-opacity ${isSelected ? "hidden" : "flex group-hover:hidden"}`}
                      >
                        {isMe && myProfile?.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={myProfile.avatar}
                            alt=""
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setMyProfile((prev) =>
                                prev ? { ...prev, avatar: "" } : null,
                              )
                            }
                            className="w-7 h-7 rounded-full object-cover shadow-sm border border-white/20 shrink-0"
                          />
                        ) : (
                          <div
                            className={`w-7 h-7 rounded-full ${getAvatarColor(item.owner_email)} text-white text-xs font-bold flex items-center justify-center shadow-sm border border-white/20 shrink-0`}
                          >
                            {isMe
                              ? initialOf(myProfile?.name)
                              : getOwnerInitial(item.owner_email)}
                          </div>
                        )}
                        <span className="text-xs font-medium text-white drop-shadow-sm truncate max-w-[140px]">
                          {isMe
                            ? myProfile?.name
                            : item.owner_email
                              ? item.owner_email.split("@")[0]
                              : item.title}
                        </span>
                      </div>
                    </div>

                    {/* Top-Right: Actions (always visible on mobile touch, hover on desktop) */}
                    {!isSelectionActive && (
                      <div className="absolute top-3 right-3 z-20 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          aria-label={t("cap.copyLink")}
                          title={t("cap.copyLink")}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCopyLink(item.id);
                          }}
                          className="w-7 h-7 rounded-lg bg-white/90 hover:bg-white text-slate-700 dark:bg-zinc-900/90 dark:hover:bg-zinc-900 dark:text-slate-200 border border-slate-200/80 dark:border-zinc-700 flex items-center justify-center shadow-md transition-colors"
                        >
                          {copiedId === item.id ? (
                            <svg
                              className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          ) : (
                            <svg
                              className="w-3.5 h-3.5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                          )}
                        </button>

                        <div className="relative" data-capture-menu>
                          <button
                            type="button"
                            aria-label={t("cap.captureOptions")}
                            title={t("cap.optionsMenu")}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const rect =
                                e.currentTarget.getBoundingClientRect();
                              const left =
                                typeof window !== "undefined"
                                  ? Math.max(
                                      12,
                                      Math.min(
                                        rect.right - 128,
                                        window.innerWidth - 136,
                                      ),
                                    )
                                  : rect.right - 128;
                              const top =
                                typeof window !== "undefined"
                                  ? Math.min(
                                      rect.bottom + 6,
                                      window.innerHeight - 150,
                                    )
                                  : rect.bottom + 6;
                              setMenuPos({ top, left });
                              setActiveMenuId((prev) =>
                                prev === item.id ? null : item.id,
                              );
                            }}
                            className="w-7 h-7 rounded-lg bg-white/90 hover:bg-white text-slate-700 dark:bg-zinc-900/90 dark:hover:bg-zinc-900 dark:text-slate-200 border border-slate-200/80 dark:border-zinc-700 flex items-center justify-center shadow-md transition-colors"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <circle cx="12" cy="5" r="1.75" />
                              <circle cx="12" cy="12" r="1.75" />
                              <circle cx="12" cy="19" r="1.75" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Bottom Right Duration - Only shows for video */}
                    {item.type === "video" && (
                      <div className="absolute bottom-2.5 right-2.5 bg-black/70 backdrop-blur-sm text-white text-[11px] font-medium px-2 py-1 rounded flex items-center gap-1.5 shadow-sm">
                        <svg
                          className="w-3.5 h-3.5 text-white fill-current"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        <span>{formatDuration(item.duration)}</span>
                      </div>
                    )}

                    {/* Status badges - top right when not hovered on desktop, shifted left on mobile to prevent overlap with actions */}
                    <div className="absolute top-3 right-20 sm:right-3 flex items-center gap-1.5 z-10 sm:group-hover:opacity-0 transition-opacity pointer-events-none">
                      {item.expires_at &&
                        new Date(item.expires_at).getTime() < Date.now() && (
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-red-100 bg-red-600/80 px-2 py-0.5 rounded backdrop-blur-sm shadow-sm">
                            {t("cap.expired")}
                          </span>
                        )}
                      {item.password && (
                        <span className="text-[10px] font-semibold text-amber-100 bg-amber-600/80 px-2 py-0.5 rounded backdrop-blur-sm flex items-center gap-1 shadow-sm">
                          <svg
                            className="w-3 h-3"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect x="3" y="11" width="18" height="11" rx="2" />
                            <path d="M7 11V7a5 5 0 0110 0v4" />
                          </svg>
                          {t("cap.locked")}
                        </span>
                      )}
                    </div>

                    {/* Drive File Missing Badge */}
                    {(thumbFailed[item.id] ||
                      (Boolean(item.drive_url) &&
                        !driveFileId(item.drive_url)) ||
                      scannedMissingIds.includes(item.id)) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openDeleteConfirmation(
                            [item.id],
                            item.title,
                            "app_only",
                          );
                        }}
                        className="absolute bottom-2.5 left-2.5 z-20 inline-flex items-center gap-1 rounded-md bg-amber-600/90 hover:bg-amber-700 active:scale-95 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 shadow-sm transition-all cursor-pointer"
                        title={t("cap.driveMissingTooltip")}
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        <span>{t("cap.driveMissing")}</span>
                      </button>
                    )}
                  </div>

                  {/* Meta Footer */}
                  <div className="p-3.5 flex items-center justify-between text-xs">
                    <div className="min-w-0 flex-1 pr-2">
                      <h3 className="font-medium text-foreground truncate group-hover:text-[#6B9A35] dark:group-hover:text-[#A8D666] transition-colors">
                        {item.title}
                      </h3>
                      {item.folder_name && (
                        <p className="text-[11px] text-muted truncate mt-0.5">
                          {item.folder_name}
                        </p>
                      )}
                    </div>
                    <span className="text-muted shrink-0">
                      {timeAgo(item.created_at, t)}
                    </span>
                  </div>
                </CardWrapper>
              </div>
            );
          })}
        </div>
      )}

      {/* Infinite scroll sentinel + loading indicator.
          Sentinel always stays mounted when hasMore is true so IntersectionObserver
          can trigger loading subsequent batches even if current batch yielded 0 filter matches. */}
      {!loading && hasMore && (
        <div
          ref={sentinelRef}
          className="py-8 flex items-center justify-center"
        >
          {loadingMore && hasMore && (
            <div className="flex flex-col items-center gap-2">
              <div className="w-7 h-7 border-[3px] border-[#89BD49]/20 border-t-[#89BD49] rounded-full animate-spin" />
              <span className="text-xs text-muted">{t("cap.loadingMore")}</span>
            </div>
          )}
        </div>
      )}

      {activeMenuId &&
        menuPos &&
        (() => {
          const item = captures.find((c) => c.id === activeMenuId);
          if (!item) return null;
          const isItemDeleting =
            deleting && (deleteRequest?.ids.includes(item.id) ?? false);
          return (
            <div
              data-capture-menu
              style={{ top: menuPos.top, left: menuPos.left }}
              className="fixed z-50 w-32 overflow-hidden rounded-xl border border-border bg-white dark:bg-background p-1 shadow-2xl text-xs text-foreground"
            >
              <button
                type="button"
                disabled={isItemDeleting}
                onClick={() => {
                  setActiveMenuId(null);
                  setEditing(item);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left font-medium hover:bg-subtle disabled:opacity-50"
              >
                <svg
                  className="w-3.5 h-3.5 text-muted"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
                {t("cap.rename")}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  setActiveMenuId(null);
                  openDeleteConfirmation([item.id], item.title);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Delete
              </button>
            </div>
          );
        })()}

      {editing && (
        <EditModal
          capture={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) =>
            setCaptures((prev) =>
              prev.map((c) => (c.id === updated.id ? updated : c)),
            )
          }
        />
      )}

      {moveToOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="move-captures-title"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !moving && setMoveToOpen(false)}
          />
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-subtle shadow-2xl border border-border overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div>
                <h2
                  id="move-captures-title"
                  className="text-xl font-bold text-foreground"
                >
                  {selectedIds.size === 1
                    ? t("cap.moveToTitle", { count: selectedIds.size })
                    : t("cap.moveToTitlePlural", { count: selectedIds.size })}
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  {t("cap.moveToSubtitle")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => !moving && setMoveToOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-slate-100 dark:hover:bg-background transition-colors"
                aria-label="Close dialog"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-6 items-start">
                {/* Left Column: Folders */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2.5">
                    {t("cap.folderInWs", {
                      name:
                        moveWorkspaces.find(
                          (ws) => ws.id === moveTargetWorkspaceId,
                        )?.name || "Workspace",
                    })}
                  </label>
                  <div className="space-y-2">
                    {/* Root / Default Folder Option */}
                    <button
                      type="button"
                      onClick={() => setMoveTargetFolderName("")}
                      className={`w-full flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition-all ${
                        moveTargetFolderName === ""
                          ? "border-[#89BD49] bg-[#89BD49]/10 dark:bg-[#89BD49]/20 text-[#6B9A35] dark:text-[#A8D666] ring-1 ring-[#89BD49]"
                          : "border-border bg-slate-50/50 dark:bg-background/50 hover:bg-slate-100 dark:hover:bg-background text-foreground"
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <svg
                          className="w-4 h-4 shrink-0 text-muted"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                          />
                        </svg>
                        <span className="text-sm font-medium truncate">
                          {t("cap.noFolderGeneral")}
                        </span>
                      </span>
                    </button>

                    {/* Available folders in target workspace */}
                    {moveFolders.map((folder) => {
                      const isCurrent = filteredCaptures.some(
                        (c) =>
                          selectedIds.has(c.id) &&
                          c.workspace_id === moveTargetWorkspaceId &&
                          (c.folder_name || "") === folder,
                      );
                      const isSelected = moveTargetFolderName === folder;
                      return (
                        <button
                          key={folder}
                          type="button"
                          onClick={() => setMoveTargetFolderName(folder)}
                          className={`w-full flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition-all ${
                            isSelected
                              ? "border-[#89BD49] bg-[#89BD49]/10 dark:bg-[#89BD49]/20 text-[#6B9A35] dark:text-[#A8D666] ring-1 ring-[#89BD49]"
                              : "border-border bg-slate-50/50 dark:bg-background/50 hover:bg-slate-100 dark:hover:bg-background text-foreground"
                          }`}
                        >
                          <span className="flex items-center gap-2.5 min-w-0 pr-2">
                            <svg
                              className="w-4 h-4 shrink-0 text-muted"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                              />
                            </svg>
                            <span className="text-sm font-medium truncate">
                              {folder}
                            </span>
                          </span>
                          {isCurrent && (
                            <span className="shrink-0 text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded border border-border text-muted bg-background">
                              {t("cap.current")}
                            </span>
                          )}
                        </button>
                      );
                    })}

                    {/* Create New Folder Inline */}
                    {isCreatingMoveFolder ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const trimmed = newMoveFolderName.trim();
                          if (trimmed) {
                            if (!moveFolders.includes(trimmed)) {
                              setMoveFolders((prev) =>
                                [...prev, trimmed].sort(),
                              );
                            }
                            setMoveTargetFolderName(trimmed);
                            setNewMoveFolderName("");
                            setIsCreatingMoveFolder(false);
                          }
                        }}
                        className="flex items-center gap-2 pt-1"
                      >
                        <input
                          autoFocus
                          type="text"
                          value={newMoveFolderName}
                          onChange={(e) => setNewMoveFolderName(e.target.value)}
                          placeholder={t("cap.newFolderPlaceholder")}
                          className="flex-1 rounded-xl border border-border bg-white dark:bg-zinc-800 text-foreground px-3 py-2 text-xs outline-none focus:border-[#89BD49] focus:ring-1 focus:ring-[#89BD49]/30"
                        />
                        <button
                          type="submit"
                          disabled={!newMoveFolderName.trim()}
                          className="px-3 py-2 rounded-xl bg-[#89BD49] text-white text-xs font-semibold hover:bg-[#6B9A35] shadow-xs shadow-[#89BD49]/25 disabled:opacity-50 cursor-pointer transition-colors"
                        >
                          {t("cap.add")}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingMoveFolder(false);
                            setNewMoveFolderName("");
                          }}
                          className="px-2 py-2 text-xs text-muted hover:text-foreground cursor-pointer"
                        >
                          {t("common.cancel")}
                        </button>
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsCreatingMoveFolder(true)}
                        className="w-full flex items-center gap-2 rounded-xl border border-dashed border-border px-3.5 py-2 text-left text-xs font-semibold text-[#6B9A35] dark:text-[#A8D666] hover:bg-[#89BD49]/10 dark:hover:bg-[#89BD49]/20 transition-all cursor-pointer"
                      >
                        <span className="text-sm leading-none">+</span>
                        <span>{t("cap.newFolder")}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Column: Workspaces */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2.5">
                    {t("cap.targetWorkspace")}
                  </label>
                  <div className="rounded-xl border border-border bg-slate-50/50 dark:bg-background/40 p-1.5 space-y-1">
                    {moveWorkspaces.map((ws) => {
                      const isTargetWs = moveTargetWorkspaceId === ws.id;
                      return (
                        <button
                          key={ws.id}
                          type="button"
                          onClick={() => void loadMoveFolders(ws.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
                            isTargetWs
                              ? "bg-white dark:bg-subtle text-foreground font-semibold shadow-sm border border-border"
                              : "text-muted hover:text-foreground hover:bg-white/60 dark:hover:bg-subtle/50"
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                              isTargetWs
                                ? "bg-[#89BD49] text-white"
                                : "bg-slate-200 dark:bg-zinc-800 text-foreground"
                            }`}
                          >
                            {ws.name.charAt(0).toUpperCase()}
                          </span>
                          <span className="text-xs truncate">{ws.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {uploadError && (
                <div className="mt-4 rounded-lg border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/20 px-3 py-2 text-xs text-red-700 dark:text-red-400">
                  {uploadError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-slate-50/50 dark:bg-background/50">
              <button
                type="button"
                onClick={() => setMoveToOpen(false)}
                disabled={moving}
                className="px-4 py-2 text-sm font-medium text-foreground hover:bg-slate-200/60 dark:hover:bg-subtle rounded-lg transition-colors disabled:opacity-50"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={() => void submitMoveTo()}
                disabled={moving || !moveTargetWorkspaceId}
                className="px-5 py-2 rounded-lg bg-[#89BD49] text-white text-sm font-semibold hover:bg-[#6B9A35] shadow-xs shadow-[#89BD49]/25 disabled:opacity-50 transition-colors"
              >
                {moving ? t("cap.moving") : t("cap.move")}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteRequest && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-captures-title"
        >
          <button
            className="absolute inset-0 bg-black/40"
            aria-label="Close confirmation"
            onClick={() => !deleting && setDeleteRequest(null)}
          />
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl bg-subtle shadow-xl border border-border p-4 sm:p-6">
            <div className="mb-4 w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 flex items-center justify-center text-red-600 dark:text-red-400">
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <h2
              id="delete-captures-title"
              className="text-lg font-bold text-foreground mb-1"
            >
              {deleteRequest.ids.length === 1
                ? t("cap.deleteTitleOne")
                : t("cap.deleteTitleMany", { count: deleteRequest.ids.length })}
            </h2>
            <p className="text-sm text-muted mb-5">
              {deleteRequest.title ? (
                <>{t("cap.deleteWillRemove", { name: deleteRequest.title })}</>
              ) : (
                t("cap.deleteChoose")
              )}
            </p>

            <div className="space-y-2">
              <label
                className={`block rounded-lg border p-3 cursor-pointer ${deleteMode === "drive_trash" ? "border-[#89BD49] bg-[#89BD49]/10 dark:bg-[#89BD49]/20" : "border-border"}`}
              >
                <span className="flex gap-3">
                  <input
                    type="radio"
                    name="delete-mode"
                    value="drive_trash"
                    checked={deleteMode === "drive_trash"}
                    onChange={() => {
                      setDeleteMode("drive_trash");
                      setDeleteRequest((request) =>
                        request
                          ? { ...request, operationId: crypto.randomUUID() }
                          : request,
                      );
                    }}
                    disabled={deleting}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-foreground">
                      {t("cap.moveToTrash")}
                    </span>
                    <span className="block text-xs text-muted mt-0.5">
                      {t("cap.trashHint")}
                    </span>
                  </span>
                </span>
              </label>
              <label
                className={`block rounded-lg border p-3 cursor-pointer ${deleteMode === "app_only" ? "border-[#89BD49] bg-[#89BD49]/10 dark:bg-[#89BD49]/20" : "border-border"}`}
              >
                <span className="flex gap-3">
                  <input
                    type="radio"
                    name="delete-mode"
                    value="app_only"
                    checked={deleteMode === "app_only"}
                    onChange={() => {
                      setDeleteMode("app_only");
                      setDeleteRequest((request) =>
                        request
                          ? { ...request, operationId: crypto.randomUUID() }
                          : request,
                      );
                      setDriveIssue(null);
                      setDeleteError(null);
                    }}
                    disabled={deleting}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-foreground">
                      {t("cap.BugSnapOnly")}
                    </span>
                    <span className="block text-xs text-muted mt-0.5">
                      {t("cap.BugSnapOnlyHint")}
                    </span>
                  </span>
                </span>
              </label>
            </div>

            {deleteError && (
              <div className="mt-4 rounded-lg border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/20 px-3 py-2 text-xs text-red-700 dark:text-red-400">
                {deleteError}
              </div>
            )}
            {driveIssue && (
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={() => void startDriveConnect()}
                  className="text-sm font-semibold text-[#6B9A35] dark:text-[#A8D666] hover:underline"
                >
                  {driveIssue === "reconnect_required"
                    ? t("cap.reconnectDrive")
                    : t("cap.connectDrive")}
                </button>
                <button
                  onClick={() => {
                    setDeleteMode("app_only");
                    setDriveIssue(null);
                    setDeleteError(null);
                  }}
                  className="text-sm font-medium text-foreground hover:underline"
                >
                  {t("cap.useBugSnapOnly")}
                </button>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
              <button
                onClick={() => setDeleteRequest(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-foreground hover:bg-subtle rounded-lg disabled:opacity-50 transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={submitDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting
                  ? deleteProgress && deleteProgress.total > 50
                    ? `${t("layout.deleting")} (${deleteProgress.current}/${deleteProgress.total})`
                    : t("layout.deleting")
                  : t("cap.confirmDelete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Batch Selection Actions Toolbar */}
      {selectedIds.size > 0 && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-1.5rem)] sm:w-[calc(100vw-2rem)] max-w-2xl bg-white/95 dark:bg-zinc-900/95 text-foreground backdrop-blur-md rounded-2xl shadow-xl dark:shadow-2xl px-3 sm:px-4 py-2 sm:py-2.5 border border-border dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 sm:gap-2.5 animate-in slide-in-from-bottom-5 duration-200"
        >
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <span className="w-5 h-5 rounded-md bg-[#89BD49] text-white flex items-center justify-center text-[11px] font-bold shadow-xs shrink-0">
              ✓
            </span>
            <span className="font-bold text-xs text-foreground whitespace-nowrap">
              {selectedIds.size === filteredCaptures.length
                ? t("cap.allSelected", { count: selectedIds.size })
                : t("cap.selectedOfTotal", {
                    count: selectedIds.size,
                    total: filteredCaptures.length,
                  })}
            </span>

            <span className="text-border text-xs select-none">|</span>

            {selectedIds.size < filteredCaptures.length && (
              <button
                type="button"
                onClick={() =>
                  setSelectedIds(new Set(filteredCaptures.map((c) => c.id)))
                }
                className="text-xs font-semibold text-[#6B9A35] dark:text-[#A8D666] hover:text-[#557A2B] dark:hover:text-[#C2E688] hover:underline transition-colors cursor-pointer whitespace-nowrap"
              >
                {t("cap.selectAllCount", { count: filteredCaptures.length })}
              </button>
            )}

            <button
              type="button"
              onClick={clearSelection}
              className="text-xs text-muted hover:text-foreground underline underline-offset-2 transition-colors cursor-pointer whitespace-nowrap"
              title={t("cap.deselect")}
            >
              {t("cap.deselect")}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Copy Links */}
            <button
              type="button"
              onClick={handleBulkCopyLinks}
              disabled={moving || deleting}
              className="h-8 px-2.5 rounded-xl border border-border bg-subtle hover:bg-background hover:border-[#89BD49]/40 dark:hover:border-[#89BD49]/50 text-xs font-semibold text-foreground hover:text-[#6B9A35] dark:hover:text-[#A8D666] disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title={t("cap.copyAllLinks")}
            >
              <svg
                className="w-3.5 h-3.5 text-muted"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                />
              </svg>
              <span>{t("cap.bulkLinks")}</span>
            </button>

            {/* Move */}
            <button
              type="button"
              onClick={() => void openMoveToModal()}
              disabled={moving || deleting}
              className="h-8 px-2.5 rounded-xl border border-border bg-subtle hover:bg-background hover:border-[#89BD49]/40 dark:hover:border-[#89BD49]/50 text-xs font-semibold text-foreground hover:text-[#6B9A35] dark:hover:text-[#A8D666] disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <svg
                className="w-3.5 h-3.5 text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
              <span>{t("cap.bulkMove")}</span>
            </button>

            {/* Tag / Status */}
            {(["tag", "status"] as const).map((field) => (
              <div key={field} className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setBulkField((f) => (f === field ? null : field))
                  }
                  disabled={moving || deleting || bulkSaving}
                  className="h-8 px-2.5 rounded-xl border border-border bg-subtle hover:bg-background hover:border-[#89BD49]/40 dark:hover:border-[#89BD49]/50 text-xs font-semibold text-foreground hover:text-[#6B9A35] dark:hover:text-[#A8D666] disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>
                    {field === "tag" ? t("cap.bulkTag") : t("cap.bulkStatus")}
                  </span>
                </button>
                {bulkField === field && (
                  <div className="absolute bottom-full mb-1.5 left-0 z-50 min-w-[9rem] bg-white dark:bg-zinc-900 border border-border rounded-lg shadow-lg overflow-hidden">
                    {(field === "tag" ? TAG_OPTIONS : STATUS_OPTIONS).map(
                      (opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => void applyBulkField(field, opt)}
                          className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-subtle transition-colors cursor-pointer"
                        >
                          {opt}
                        </button>
                      ),
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Delete */}
            <button
              type="button"
              onClick={() => openDeleteConfirmation(Array.from(selectedIds))}
              disabled={selectedIds.size === 0 || deleting}
              className="h-8 px-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              <span>{t("cap.bulkDelete")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
