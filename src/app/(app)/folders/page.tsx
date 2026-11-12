"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/lib/iconify";
import { supabase } from "@/lib/supabase";
import { useT } from "@/components/I18nProvider";
import { useToast } from "@/components/Toast";
import { timeAgo } from "@/lib/capture-utils";
import { fetchDriveStatus } from "@/lib/google-drive-values";
import { PageLoader } from "@/components/PageLoader";

function formatBytes(bytes: number | null): string {
  if (!Number.isFinite(bytes) || bytes == null || bytes < 0) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let val = bytes;
  let i = 0;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  const isInteger = Math.abs(val - Math.round(val)) < 0.05;
  const decimals = isInteger || i === 0 ? 0 : 1;
  return `${val.toFixed(decimals)} ${units[i]}`;
}

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

interface FolderRow {
  id: string;
  name: string;
  is_default: boolean;
  color: string | null;
  captureCount: number;
  screenshotCount: number;
  videoCount: number;
  lastModified: string | null;
}

export default function ManageFoldersPage() {
  return (
    <Suspense fallback={<PageLoader message="Loading folders…" />}>
      <ManageFoldersContent />
    </Suspense>
  );
}

function ManageFoldersContent() {
  const { t } = useT();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const wsParam = searchParams.get("ws");

  const [activeWsId, setActiveWsId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<FolderRow[]>([]);
  const [totalScreenshots, setTotalScreenshots] = useState(0);
  const [totalScreenrecords, setTotalScreenrecords] = useState(0);
  const [driveQuota, setDriveQuota] = useState<{ usedBytes: number | null; totalBytes: number | null } | null>(null);

  // Modal state - mirrors the sidebar folder manager in (app)/layout.tsx so
  // both surfaces call the exact same RPCs and stay behaviorally identical.
  const [createOpen, setCreateOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [renameTarget, setRenameTarget] = useState<FolderRow | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<FolderRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [colorTarget, setColorTarget] = useState<FolderRow | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [savingColor, setSavingColor] = useState(false);

  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const loadFolders = useCallback(async (workspaceId: string) => {
    setLoading(true);
    try {
      const [foldersRes, capturesRes] = await Promise.all([
        supabase
          .from("workspace_folders")
          .select("id, name, is_default, color")
          .eq("workspace_id", workspaceId),
        supabase
          .from("captures")
          .select("folder_name, created_at, type")
          .eq("workspace_id", workspaceId)
          .limit(5000),
      ]);

      if (foldersRes.error) throw foldersRes.error;
      if (capturesRes.error) throw capturesRes.error;

      const captureRows = capturesRes.data || [];
      let screenshotCount = 0;
      let screenrecordCount = 0;

      const statsByFolder = new Map<string, { count: number; screenshotCount: number; videoCount: number; lastModified: string | null }>();
      for (const row of captureRows) {
        const isVideo = row.type === "video";
        if (isVideo) screenrecordCount++;
        else screenshotCount++;

        const name = row.folder_name;
        if (!name) continue;
        const existing = statsByFolder.get(name) || { count: 0, screenshotCount: 0, videoCount: 0, lastModified: null };
        existing.count += 1;
        if (isVideo) existing.videoCount += 1;
        else existing.screenshotCount += 1;
        if (!existing.lastModified || row.created_at > existing.lastModified) {
          existing.lastModified = row.created_at;
        }
        statsByFolder.set(name, existing);
      }
      setTotalScreenshots(screenshotCount);
      setTotalScreenrecords(screenrecordCount);

      const rows: FolderRow[] = (foldersRes.data || []).map((f) => ({
        id: f.id,
        name: f.name,
        is_default: !!f.is_default,
        color: f.color,
        captureCount: statsByFolder.get(f.name)?.count ?? 0,
        screenshotCount: statsByFolder.get(f.name)?.screenshotCount ?? 0,
        videoCount: statsByFolder.get(f.name)?.videoCount ?? 0,
        lastModified: statsByFolder.get(f.name)?.lastModified ?? null,
      }));

      // Folders referenced only via captures.folder_name (no workspace_folders
      // row yet) still need a row here, same as the sidebar's `rootFolders`.
      const knownNames = new Set(rows.map((r) => r.name));
      for (const [name, stats] of Array.from(statsByFolder.entries())) {
        if (!knownNames.has(name)) {
          rows.push({
            id: `extra-${name}`,
            name,
            is_default: false,
            color: null,
            captureCount: stats.count,
            screenshotCount: stats.screenshotCount,
            videoCount: stats.videoCount,
            lastModified: stats.lastModified,
          });
        }
      }

      setFolders(rows);
    } catch (err) {
      console.warn("Failed to load folders:", err);
      showToast(t("layout.errCreateFolder"), "error");
    } finally {
      setLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: list, error } = await supabase.rpc("get_my_workspaces");
      if (error || cancelled) return;
      const rows = (list ?? []) as { id: string; role: string }[];
      const target = wsParam ? rows.find((w) => w.id === wsParam) : rows[0];
      if (target) {
        setActiveWsId(target.id);
        setIsOwner(target.role === "owner");
        loadFolders(target.id);
      } else {
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [wsParam, loadFolders]);

  // Same fetch + sessionStorage cache pattern as the dashboard page and
  // DriveStorageMeter, so this reuses the already-cached quota instead of
  // issuing a second Google Drive API call within the same 3-minute window.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        const currentUserId = sessionData.session?.user?.id;
        if (!token) return;

        const cached = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("bs_drive_quota") : null;
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Date.now() - parsed.timestamp < 180000 && parsed.userId === currentUserId && parsed.data?.quota) {
              if (!cancelled) setDriveQuota(parsed.data.quota);
              return;
            }
          } catch {}
        }
        const json = (await fetchDriveStatus(token)) as { quota?: { usedBytes: number | null; totalBytes: number | null } } | null;
        if (!json) return;
        if (!cancelled && json.quota) {
          setDriveQuota(json.quota);
          try {
            sessionStorage.setItem("bs_drive_quota", JSON.stringify({ timestamp: Date.now(), data: json, userId: currentUserId }));
          } catch {}
        }
      } catch (err) {
        console.warn("Failed to load Drive quota:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const storageUsageText = driveQuota?.usedBytes != null ? formatBytes(driveQuota.usedBytes) : "-";
  const storageSubtext = driveQuota?.usedBytes != null && driveQuota?.totalBytes != null
    ? `${formatBytes(driveQuota.usedBytes)} / ${formatBytes(driveQuota.totalBytes)}`
    : null;

  // Grid stays sorted by most recent activity; folders with no captures yet
  // sort last (there's no sort/search control in the UI anymore now that the
  // All Folders table is gone).
  const filteredFolders = [...folders].sort((a, b) => {
    if (!a.lastModified && !b.lastModified) return a.name.localeCompare(b.name);
    if (!a.lastModified) return 1;
    if (!b.lastModified) return -1;
    return b.lastModified.localeCompare(a.lastModified);
  });

  const handleCreateFolder = async () => {
    const trimmed = newFolderName.trim();
    if (!trimmed || !activeWsId || creating) return;
    if (folders.some((f) => f.name.toLowerCase() === trimmed.toLowerCase())) {
      const msg = t("layout.errFolderExists");
      setCreateError(msg);
      showToast(msg, "error");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const { data, error } = await supabase
        .from("workspace_folders")
        .insert({ workspace_id: activeWsId, name: trimmed })
        .select("id, name, is_default, color")
        .single();
      if (error) throw error;
      if (data) {
        setFolders((prev) => [...prev, { id: data.id, name: data.name, is_default: !!data.is_default, color: data.color, captureCount: 0, screenshotCount: 0, videoCount: 0, lastModified: null }]);
      }
      setNewFolderName("");
      setCreateOpen(false);
      showToast(t("layout.folderCreated", { name: trimmed }), "success");
    } catch (err) {
      console.warn("Failed to create folder:", err);
      setCreateError(t("layout.errCreateFolder"));
      showToast(t("layout.folderCreateFailedToast"), "error");
    } finally {
      setCreating(false);
    }
  };

  const openRename = (folder: FolderRow) => {
    setRenameTarget(folder);
    setRenameValue(folder.name);
    setRenameError(null);
  };

  const submitRename = async () => {
    if (!renameTarget || !activeWsId || renaming) return;
    const newName = renameValue.trim();
    if (!newName || newName === renameTarget.name) {
      setRenameTarget(null);
      return;
    }
    if (folders.some((f) => f.name.toLowerCase() === newName.toLowerCase() && f.id !== renameTarget.id)) {
      const msg = t("layout.errFolderExists");
      setRenameError(msg);
      showToast(msg, "error");
      return;
    }
    setRenaming(true);
    try {
      const { error } = await supabase.rpc("rename_workspace_folder", {
        p_workspace_id: activeWsId,
        p_old_name: renameTarget.name,
        p_new_name: newName,
      });
      if (error) throw error;
      setFolders((prev) => prev.map((f) => (f.id === renameTarget.id ? { ...f, name: newName } : f)));
      window.dispatchEvent(new CustomEvent("bugsnap:folder-updated", {
        detail: { action: "renamed", oldName: renameTarget.name, newName },
      }));
      setRenameTarget(null);
      showToast(t("layout.folderRenamedToast"), "success");
    } catch (err) {
      console.warn("Failed to rename folder:", err);
      showToast(t("layout.errRenameFolder"), "error");
    } finally {
      setRenaming(false);
    }
  };

  const submitDelete = async () => {
    if (!deleteTarget || !activeWsId || deleting) return;
    setDeleting(true);
    try {
      const { error } = await supabase.rpc("delete_workspace_folder", {
        p_workspace_id: activeWsId,
        p_folder_name: deleteTarget.name,
      });
      if (error) throw error;
      setFolders((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      window.dispatchEvent(new CustomEvent("bugsnap:folder-updated", {
        detail: { action: "deleted", oldName: deleteTarget.name },
      }));
      setDeleteTarget(null);
      showToast(t("layout.folderQueued", { name: deleteTarget.name }), "success");
    } catch (err) {
      console.warn("Failed to delete folder:", err);
      showToast(t("layout.errDeleteFolder"), "error");
    } finally {
      setDeleting(false);
    }
  };

  const openColorPicker = (folder: FolderRow) => {
    setColorTarget(folder);
    setSelectedColor(folder.color);
  };

  const submitColor = async () => {
    if (!colorTarget || !activeWsId || savingColor) return;
    setSavingColor(true);
    try {
      const { error } = await supabase.rpc("set_workspace_folder_color", {
        p_workspace_id: activeWsId,
        p_folder_name: colorTarget.name,
        p_color: selectedColor,
      });
      if (error) throw error;
      setFolders((prev) => prev.map((f) => (f.id === colorTarget.id ? { ...f, color: selectedColor } : f)));
      window.dispatchEvent(new CustomEvent("bugsnap:folder-updated", {
        detail: { action: "recolored", oldName: colorTarget.name, color: selectedColor },
      }));
      setColorTarget(null);
      showToast(t("layout.colorUpdated"), "success");
    } catch (err) {
      console.warn("Failed to set folder color:", err);
      showToast(t("layout.errRenameFolder"), "error");
    } finally {
      setSavingColor(false);
    }
  };

  if (loading) {
    return <PageLoader message={t("layout.loading")} />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{t("folders.title")}</h1>
        {isOwner && (
          <button
            type="button"
            onClick={() => { setCreateError(null); setNewFolderName(""); setCreateOpen(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-95 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs shadow-[#2563EB]/25 transition-all hover:shadow-md touch-manipulation shrink-0"
          >
            <Icon icon="lucide:plus" className="w-4 h-4 brightness-0 invert" aria-hidden="true" />
            <span>{t("folders.newFolder")}</span>
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-2xl border border-border bg-subtle p-5 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-950/20 text-[#2563EB] dark:text-[#3B82F6] border border-blue-200 dark:border-blue-900/40 shrink-0">
            <Icon icon="lucide:folder" className="w-5 h-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-2xl font-bold tracking-tight text-foreground">{folders.length}</p>
            <p className="text-xs text-muted truncate">{t("folders.totalFolders")}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-subtle p-5 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-950/20 text-[#2563EB] dark:text-[#3B82F6] border border-blue-200 dark:border-blue-900/40 shrink-0">
            <Icon icon="lucide:crop" className="w-5 h-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-2xl font-bold tracking-tight text-foreground">{totalScreenshots}</p>
            <p className="text-xs text-muted truncate">{t("dash.totalScreenshotLabel")}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-subtle p-5 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-950/20 text-[#2563EB] dark:text-[#3B82F6] border border-blue-200 dark:border-blue-900/40 shrink-0">
            <Icon icon="lucide:mic" className="w-5 h-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-2xl font-bold tracking-tight text-foreground">{totalScreenrecords}</p>
            <p className="text-xs text-muted truncate">{t("dash.totalScreenrecordLabel")}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-subtle p-5 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-950/20 text-[#2563EB] dark:text-[#3B82F6] border border-blue-200 dark:border-blue-900/40 shrink-0">
            <Icon icon="lucide:database" className="w-5 h-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-2xl font-bold tracking-tight text-foreground truncate">{storageSubtext ?? storageUsageText}</p>
            <p className="text-xs text-muted truncate">{t("dash.storage")}</p>
          </div>
        </div>
      </div>

      {/* Folder Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {filteredFolders.map((folder) => (
          <div
            key={folder.id}
            className="relative rounded-2xl border border-border bg-subtle p-4 hover:shadow-md transition-all duration-300"
          >
            <Link
              href={`/captures?${activeWsId ? `ws=${activeWsId}&` : ""}folder=${encodeURIComponent(folder.name)}`}
              className="block"
            >
              <span
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mb-3"
                style={{ backgroundColor: folder.color ? `${folder.color}1A` : undefined }}
              >
                <Icon
                  icon={folder.color ? "custom:folder-filled" : "lucide:folder"}
                  className={`w-5 h-5 ${folder.color ? "" : "text-[#2563EB] dark:text-[#3B82F6]"}`}
                  style={folder.color ? { color: folder.color } : undefined}
                  aria-hidden="true"
                />
              </span>
              <h3 className="text-sm font-bold text-foreground truncate pr-6">{folder.name}</h3>
              <p className="text-xs text-muted mt-1">
                {t("qa.capturesCount", { count: folder.captureCount })}
              </p>
              {folder.captureCount > 0 && (
                <p className="text-[11px] text-muted mt-0.5">
                  {t("folders.breakdown", { images: folder.screenshotCount, videos: folder.videoCount })}
                </p>
              )}
              <p className="text-[11px] text-muted mt-0.5">
                {folder.lastModified ? t("folders.updatedAgo", { time: timeAgo(folder.lastModified, t) }) : t("folders.noActivity")}
              </p>
            </Link>

            {isOwner && (
              <div className="absolute top-3 right-3">
                <button
                  type="button"
                  onClick={() => setMenuOpenId((open) => (open === folder.id ? null : folder.id))}
                  aria-label={`${folder.name} actions`}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-background hover:text-foreground transition-colors"
                >
                  <Icon icon="lucide:more-horizontal" className="w-4 h-4" aria-hidden="true" />
                </button>
                {menuOpenId === folder.id && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpenId(null)} />
                    <div className="absolute right-0 top-8 z-50 w-44 rounded-lg border border-border bg-subtle py-1 text-xs shadow-lg">
                      <button
                        type="button"
                        onClick={() => { setMenuOpenId(null); openRename(folder); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-left text-foreground hover:bg-background transition-colors"
                      >
                        <Icon icon="lucide:edit-2" className="w-3.5 h-3.5 text-muted shrink-0" aria-hidden="true" />
                        <span>{t("layout.renameFolder")}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setMenuOpenId(null); openColorPicker(folder); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-left text-foreground hover:bg-background transition-colors"
                      >
                        <Icon icon="lucide:palette" className="w-3.5 h-3.5 text-muted shrink-0" aria-hidden="true" />
                        <span>{t("layout.changeColor")}</span>
                      </button>
                      {!folder.is_default && (
                        <button
                          type="button"
                          onClick={() => { setMenuOpenId(null); setDeleteTarget(folder); }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                          <Icon icon="lucide:trash-2" className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>{t("layout.deleteFolderTitle")}</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}

        {isOwner && (
          <button
            type="button"
            onClick={() => { setCreateError(null); setNewFolderName(""); setCreateOpen(true); }}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border hover:border-[#2563EB] bg-transparent p-6 text-center transition-colors"
          >
            <span className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-50 dark:bg-blue-950/30 text-[#2563EB] dark:text-[#3B82F6]">
              <Icon icon="lucide:plus" className="w-5 h-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-bold text-foreground">{t("folders.createNew")}</span>
              <span className="block text-xs text-muted mt-1">{t("folders.createNewDesc")}</span>
            </span>
          </button>
        )}
      </div>

      {/* Create Folder Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCreateOpen(false)} />
          <div className="relative w-full max-w-sm rounded-xl bg-subtle shadow-xl border border-border p-4 sm:p-6">
            <h2 className="text-lg font-bold text-foreground mb-1">{t("layout.createFolderTitle")}</h2>
            <p className="text-sm text-muted mb-5">{t("layout.createFolderDesc")}</p>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-muted mb-1.5">{t("layout.folderName")}</label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => { setNewFolderName(e.target.value); setCreateError(null); }}
                placeholder="Name your folder"
                className="w-full text-sm rounded-lg border border-border px-3 py-2.5 outline-none focus:border-[#2563EB] bg-subtle text-foreground placeholder:text-muted"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter" && newFolderName.trim()) handleCreateFolder(); }}
              />
              {createError && <p className="text-xs text-red-600 dark:text-red-400 mt-1.5">{createError}</p>}
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button onClick={() => setCreateOpen(false)} className="px-4 py-2 text-sm font-medium text-foreground hover:bg-background rounded-lg transition-colors">
                {t("common.cancel")}
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim() || creating}
                className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] disabled:opacity-50 transition-colors shadow-sm shadow-[#2563EB]/25"
              >
                {creating ? t("layout.creating") : t("layout.createFolderTitle")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Folder Modal */}
      {renameTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setRenameTarget(null)} />
          <div className="relative w-full max-w-sm rounded-xl bg-subtle shadow-xl border border-border p-4 sm:p-6">
            <h2 className="text-lg font-bold text-foreground mb-1">{t("layout.renameFolder")}</h2>
            <p className="text-sm text-muted mb-5">{t("layout.renameFolderDesc")}</p>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-muted mb-1.5">{t("layout.newFolderName")}</label>
              <input
                type="text"
                value={renameValue}
                onChange={(e) => { setRenameValue(e.target.value); setRenameError(null); }}
                className="w-full text-sm rounded-lg border border-border px-3 py-2.5 outline-none focus:border-[#2563EB] bg-subtle text-foreground placeholder:text-muted"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter" && renameValue.trim()) submitRename(); }}
              />
              {renameError && <p className="text-xs text-red-600 dark:text-red-400 mt-1.5">{renameError}</p>}
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button onClick={() => setRenameTarget(null)} className="px-4 py-2 text-sm font-medium text-foreground hover:bg-background rounded-lg transition-colors">
                {t("common.cancel")}
              </button>
              <button
                onClick={submitRename}
                disabled={!renameValue.trim() || renameValue.trim() === renameTarget.name || renaming}
                className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] disabled:opacity-50 transition-colors shadow-sm shadow-[#2563EB]/25"
              >
                {t("layout.saveChanges")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Folder Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteTarget(null)} />
          <div className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-xl bg-subtle shadow-xl border border-border p-4 sm:p-6 text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400">
              <Icon icon="lucide:trash-2" className="w-6 h-6" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">{t("layout.deleteFolderQ")}</h2>
            <p className="text-xs text-muted leading-relaxed mb-6">{t("layout.deleteFolderDesc", { name: deleteTarget.name })}</p>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-medium text-foreground hover:bg-background rounded-lg transition-colors">
                {t("common.cancel")}
              </button>
              <button
                onClick={submitDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? t("layout.deleting") : t("layout.deleteFolderTitle")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Folder Color Modal */}
      {colorTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setColorTarget(null)} />
          <div className="relative w-full max-w-sm rounded-xl bg-subtle shadow-xl border border-border p-4 sm:p-6">
            <h2 className="text-lg font-bold text-foreground mb-1">{t("layout.folderColor")}</h2>
            <p className="text-xs text-muted mb-4">{t("layout.folderColorDesc")}</p>

            <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background mb-4">
              <Icon
                icon={selectedColor ? "custom:folder-filled" : "lucide:folder"}
                className={`w-6 h-6 shrink-0 transition-colors ${selectedColor ? "" : "text-muted"}`}
                style={selectedColor ? { color: selectedColor } : undefined}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{colorTarget.name}</p>
                <p className="text-[11px] text-muted">
                  {selectedColor
                    ? (GOOGLE_DRIVE_FOLDER_COLORS.find((c) => c.value.toLowerCase() === selectedColor.toLowerCase())?.name || selectedColor.toUpperCase())
                    : t("layout.defaultColor")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2.5 mb-3 justify-items-center">
              {GOOGLE_DRIVE_FOLDER_COLORS.map((c) => {
                const isSelected = selectedColor?.toLowerCase() === c.value.toLowerCase();
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setSelectedColor(c.value)}
                    title={c.name}
                    aria-label={c.name}
                    className={`h-8 w-8 rounded-full flex items-center justify-center transition-all hover:scale-110 focus:outline-none ${isSelected ? "ring-2 ring-offset-2 ring-foreground scale-105" : "hover:ring-1 hover:ring-border"
                      }`}
                    style={{ backgroundColor: c.value }}
                  >
                    {isSelected && <Icon icon="lucide:check" className="w-4 h-4 text-white drop-shadow brightness-0 invert" />}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2 mb-5 border-t border-border/60">
              <button
                type="button"
                onClick={() => setSelectedColor(null)}
                className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
              >
                <Icon icon="lucide:rotate-ccw" className="w-3.5 h-3.5" />
                <span>{t("layout.resetColor")}</span>
              </button>
              {selectedColor && <span className="text-[11px] font-mono text-muted uppercase">{selectedColor}</span>}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button type="button" onClick={() => setColorTarget(null)} className="px-4 py-2 text-sm font-medium text-foreground hover:bg-background rounded-lg transition-colors">
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={submitColor}
                disabled={savingColor}
                className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] disabled:opacity-50 transition-colors shadow-sm shadow-[#2563EB]/25"
              >
                {savingColor ? t("common.saving") : t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
