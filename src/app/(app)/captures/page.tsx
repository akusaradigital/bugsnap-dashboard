"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useT } from "@/components/I18nProvider";

export type CaptureFilter = "all" | "video" | "screenshot";

interface Capture {
  id: string;
  title: string;
  type: string;
  drive_url: string;
  created_at: string;
  window_size?: string;
  workspace_id?: string | null;
  description?: string | null;
  password?: string | null;
  expires_at?: string | null;
  duration?: number | null;
  tag?: string | null;
  status?: string | null;
  dev_logs?: { type?: string; level?: string; message?: string; text?: string; url?: string; method?: string; count?: number }[] | { version: number; errors?: number } | null;
  burn_after_read?: boolean;
  allowed_domains?: string[] | null;
  allowed_ips?: string[] | null;
  owner_email?: string | null;
  folder_name?: string | null;
  project_id?: string | null;
  source?: string | null;
  project_name?: string | null;
}

const TAG_OPTIONS = ["bug", "feature-request", "wip", "design", "other"];
const STATUS_OPTIONS = ["open", "in-progress", "fixed", "closed"];
const CHROME_WEB_STORE_URL = "https://chromewebstore.google.com/detail/jfhbmdllebgpmceeoffkfhlhdchhbcg";

interface EditModalProps {
  capture: Capture;
  onClose: () => void;
  onSaved: (updated: Capture) => void;
}

const EXPIRY_OPTIONS: { value: "never" | "24h" | "7d"; labelKey: string }[] = [
  { value: "never", labelKey: "cap.never" },
  { value: "24h", labelKey: "cap.hours24" },
  { value: "7d", labelKey: "cap.days7" },
];

function timeAgo(iso: string, t: (k: string, vars?: Record<string, string | number>) => string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return t("time.justNow");
  if (m < 60) return t("time.minAgo", { n: m });
  const h = Math.floor(m / 60);
  if (h < 24) return t("time.hrAgo", { n: h });
  const d = Math.floor(h / 24);
  if (d < 7) return t("time.dayAgo", { n: d });
  // Older than a week → compact date, same as before.
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function formatDuration(sec: number | null | undefined): string {
  if (!sec || isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function getAvatarColor(seed: string | null | undefined): string {
  const colors = [
    "bg-indigo-600",
    "bg-emerald-600",
    "bg-rose-600",
    "bg-amber-600",
    "bg-violet-600",
    "bg-teal-600",
    "bg-fuchsia-600",
  ];
  let h = 0;
  const s = seed || "";
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return colors[h % colors.length];
}

function getOwnerInitial(email: string | null | undefined): string {
  if (!email) return "M";
  // Filter out punctuation commonly at the start of title, get clean first letter
  const clean = email.replace(/[^a-zA-Z0-9]/g, "").trim();
  const char = clean.charAt(0);
  return (char || "M").toUpperCase();
}

function driveFileId(driveUrl: string): string | null {
  const m = driveUrl.match(/[?&]id=([^&]+)/) || driveUrl.match(/\/d\/([^/]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

function driveThumbUrl(driveUrl: string, size = 400): string | null {
  const id = driveFileId(driveUrl);
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w${size}` : null;
}

function expiryToOption(expiresAt: string | null | undefined, createdAt: string): string {
  if (!expiresAt) return "never";
  const diffMs = new Date(expiresAt).getTime() - new Date(createdAt).getTime();
  if (diffMs <= 36 * 60 * 60 * 1000) return "24h";
  if (diffMs <= 10.5 * 24 * 60 * 60 * 1000) return "7d";
  return "never";
}

function EditModal({ capture, onClose, onSaved }: EditModalProps) {
  const { t } = useT();
  const [title, setTitle] = useState(capture.title);
  const [description, setDescription] = useState(capture.description || "");
  const [password, setPassword] = useState(capture.password || "");
  const [tag, setTag] = useState(capture.tag || "");
  const [status, setStatus] = useState(capture.status || "open");
  const [expiry, setExpiry] = useState<string>(() =>
    expiryToOption(capture.expires_at, capture.created_at)
  );
  const [burnAfterRead, setBurnAfterRead] = useState(capture.burn_after_read || false);
  const [allowedDomainsText, setAllowedDomainsText] = useState(() => (capture.allowed_domains || []).join(", "));
  const [allowedIpsText, setAllowedIpsText] = useState(() => (capture.allowed_ips || []).join(", "));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);

    const originalExpiry = expiryToOption(capture.expires_at, capture.created_at);
    let expiresAt: string | null = expiry === originalExpiry ? capture.expires_at ?? null : null;
    if (expiry !== originalExpiry && expiry === "24h") expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    if (expiry !== originalExpiry && expiry === "7d") expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const allowed_domains = allowedDomainsText.trim() 
      ? allowedDomainsText.split(",").map(d => d.trim().toLowerCase()).filter(Boolean)
      : null;

    const allowed_ips = allowedIpsText.trim()
      ? allowedIpsText.split(",").map(ip => ip.trim()).filter(Boolean)
      : null;

    const { data, error } = await supabase
      .from("captures")
      .update({
        title: title.trim() || capture.title,
        description: description.trim() || null,
        password: password.trim() || null,
        expires_at: expiresAt,
        tag: tag || null,
        status: status || null,
        burn_after_read: burnAfterRead,
        allowed_domains,
        allowed_ips,
      })
      .eq("id", capture.id)
      .select()
      .single();

    if (error) {
      console.warn("Error updating capture:", error);
      setError(t("cap.saveError"));
      setSaving(false);
      return;
    }
    onSaved(data as Capture);
    onClose();
  }

  const inputClasses =
    "w-full text-sm rounded-lg border border-border px-3 py-2 outline-none focus:border-indigo-500 bg-subtle";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-subtle shadow-xl border border-border flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-base font-bold text-foreground">{t("cap.editTitle")}</h2>
          <button
            onClick={onClose}
            aria-label={t("common.close")}
            className="text-muted hover:text-foreground transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted mb-1.5">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
              {t("cap.titleLabel")}
            </label>
            <input className={inputClasses} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted mb-1.5">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M9 13h6M9 17h6" /></svg>
              {t("cap.descLabel")}
            </label>
            <textarea
              className={`${inputClasses} min-h-[72px] resize-none`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("cap.descPlaceholder")}
            />
          </div>

          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-foreground mb-1">{t("cap.linkSettings")}</h3>
            <p className="text-xs text-muted mb-4">{t("cap.linkSettingsHint")}</p>

            <div className="space-y-4">
              {/* Tag */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted mb-1.5">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17c0 .53.21 1.04.59 1.41l8.83 8.83a2 2 0 0 0 2.83 0l7.17-7.17a2 2 0 0 0 0-2.83Z" /><circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" /></svg>
              {t("cap.tagLabel")}
            </label>
                <select
                  className={inputClasses}
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                >
                  <option value="">{t("cap.noTag")}</option>
                  {TAG_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              {/* Status */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted mb-1.5">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M22 12h-3M5 12H2" /></svg>
              {t("cap.statusLabel")}
            </label>
                <select
                  className={inputClasses}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted mb-1.5">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              {t("cap.passwordLabel")}
            </label>
                <input
                  className={inputClasses}
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("cap.passwordPlaceholder")}
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted mb-1.5">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              {t("cap.expiresLabel")}
            </label>
                <div className="inline-flex rounded-lg border border-border bg-subtle p-1 w-full">
                  {EXPIRY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setExpiry(opt.value)}
                      className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        expiry === opt.value
                          ? "bg-subtle text-foreground shadow-sm"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      {t(opt.labelKey)}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted mt-1.5">
                  {expiry === "never"
                    ? t("cap.neverExpires")
                    : t("cap.expiresOn", { date: new Date(
                        Date.now() + (expiry === "24h" ? 24 : 168) * 60 * 60 * 1000
                      ).toLocaleDateString() })}
                </p>
              </div>

              {/* Advanced Security */}
              <div className="border-t border-border pt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-foreground">{t("cap.advancedProtection")}</h4>
                </div>

                {/* Burn after reading */}
                <label className="flex items-center gap-2.5 text-xs text-foreground select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={burnAfterRead}
                    onChange={(e) => setBurnAfterRead(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <p className="font-medium">{t("cap.burnAfterRead")}</p>
                    <p className="text-[10px] text-muted leading-tight mt-0.5">{t("cap.burnHint")}</p>
                  </div>
                </label>

                {/* Domain Whitelist */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-muted">{t("cap.domainWhitelist")}</label>
                  </div>
                  <input
                    type="text"
                    value={allowedDomainsText}
                    onChange={(e) => setAllowedDomainsText(e.target.value)}
                    placeholder={t("cap.domainPlaceholder")}
                    className={inputClasses}
                  />
                  <p className="text-[9px] text-muted leading-tight mt-1">{t("cap.domainHint")}</p>
                </div>

                {/* IP Whitelist */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-muted">{t("cap.ipWhitelist")}</label>
                  </div>
                  <input
                    type="text"
                    value={allowedIpsText}
                    onChange={(e) => setAllowedIpsText(e.target.value)}
                    placeholder={t("cap.ipPlaceholder")}
                    className={inputClasses}
                  />
                  <p className="text-[9px] text-muted leading-tight mt-1">{t("cap.ipHint")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Sticky Footer Actions */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
          {error && <p className="mr-auto text-xs text-red-600">{error}</p>}
          <button
            onClick={onClose}
            className="rounded-lg border border-border bg-subtle px-4 py-2 text-sm font-medium text-foreground hover:bg-subtle transition-colors"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {saving ? t("settings.saving") : t("cap.saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CapturesList() {
  const { t } = useT();
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-muted">{t("cap.loading")}</div>}>
      <CapturesContent />
    </Suspense>
  );
}

function CapturesContent() {
  const { t } = useT();
  const searchParams = useSearchParams();
  const wsParam = searchParams.get("ws");
  const folderParam = searchParams.get("folder");
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Capture | null>(null);
  const [deleteRequest, setDeleteRequest] = useState<{ ids: string[]; title?: string; operationId: string } | null>(null);
  const [deleteMode, setDeleteMode] = useState<"drive_trash" | "app_only">("drive_trash");
  const [deleting, setDeleting] = useState(false);
  const [driveIssue, setDriveIssue] = useState<"not_connected" | "reconnect_required" | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [moveToOpen, setMoveToOpen] = useState(false);
  const [moving, setMoving] = useState(false);
  const [moveTargetWorkspaceId, setMoveTargetWorkspaceId] = useState<string>("");
  const [moveTargetFolderName, setMoveTargetFolderName] = useState<string>("");
  const [moveWorkspaces, setMoveWorkspaces] = useState<Array<{ id: string; name: string }>>([]);
  const [moveFolders, setMoveFolders] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [thumbFailed, setThumbFailed] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeHoverId, setActiveHoverId] = useState<string | null>(null);
  const [shortcutCopied, setShortcutCopied] = useState(false);
  const shortcutToastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "c" && e.key !== "C") return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (!activeHoverId) return;
      const shareUrl = `${window.location.origin}/v/${activeHoverId}`;
      navigator.clipboard?.writeText(shareUrl).then(() => {
        setShortcutCopied(true);
        if (shortcutToastRef.current) clearTimeout(shortcutToastRef.current);
        shortcutToastRef.current = setTimeout(() => setShortcutCopied(false), 2000);
      }).catch(() => setDeleteError(t("cap.copyError")));
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (shortcutToastRef.current) clearTimeout(shortcutToastRef.current);
    };
  }, [activeHoverId, t]);

  // Dropdown states: false = not actively filtering by this type.
  // If BOTH are false, we show ALL (no filter applied).
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showScreenshot, setShowScreenshot] = useState(false);
  const [filterTag, setFilterTag] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

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
      const gen = loadGenRef.current;
      let query = supabase
        .from("captures")
        .select(CAPTURES_COLUMNS)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);
      if (workspaceParam) {
        query = query.eq("workspace_id", workspaceParam);
      }
      if (folderParam) {
        query = query.eq("folder_name", folderParam);
      }
      if (projectFilter) {
        query = query.eq("project_id", projectFilter);
      }
      const cursor = cursorRef.current;
      if (cursor) {
        query = query
          .lt("created_at", cursor.created_at)
          .or(`and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`);
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
      }
      setHasMore(items.length === PAGE_SIZE);
    },
    [folderParam, projectFilter, workspaceParam]
  );

  // Initial load + reload on workspace / folder change
  useEffect(() => {
    let cancelled = false;
    cursorRef.current = null;
    loadGenRef.current += 1;
    setLoadingMore(false);
    loadPage(true).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [wsParam, folderParam, loadPage]);

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
        { rootMargin: "300px" }
      );
      obs.observe(node);
      observerRef.current = obs;
    },
    [hasMore, loadingMore, loadPage]
  );

  // The Supabase query already applies workspace_id/folder_name filters server-side
  // (see the fetch effect above), so no redundant client-side re-filter is needed here.
  const workspaceCaptures = captures;

  const handleCopyLink = async (id: string) => {
    setDeleteError(null);
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/v/${id}`);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setDeleteError(t("cap.copyError"));
    }
  };

  async function startDriveConnect() {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error(t("cap.sessionExpired"));
    const res = await fetch("/api/google-drive/connect", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    const result = await res.json().catch(() => ({})) as { url?: string; error?: string };
    if (!res.ok || !result.url) throw new Error(result.error || "Could not start Google Drive connection");
    window.location.assign(result.url);
  }

  function openDeleteConfirmation(ids: string[], title?: string) {
    if (ids.length === 0 || deleting) return;
    setDeleteMode("drive_trash");
    setDriveIssue(null);
    setDeleteError(null);
    setDeleteRequest({ ids, title, operationId: crypto.randomUUID() });
  }

  async function submitDelete() {
    if (!deleteRequest || deleting) return;
    setDeleting(true);
    setDriveIssue(null);
    setDeleteError(null);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (sessionError || !token) throw new Error(t("cap.sessionExpired"));

      const response = await fetch("/api/google-drive/delete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ captureIds: deleteRequest.ids, mode: deleteMode, operationId: deleteRequest.operationId }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        deletedIds?: string[];
        deleted_ids?: string[];
        failedIds?: string[];
        failed_ids?: string[];
        results?: Array<{ captureId: string; ok: boolean; outcome?: string; driveOutcome?: "trashed" | "kept" | "unknown"; error?: string }>;
        error?: string;
        message?: string;
        code?: string;
        driveStatus?: "connected" | "reconnect_required" | "not_connected";
      };
      const deletedIds = result.deletedIds ?? result.deleted_ids ?? result.results?.filter((item) => item.ok).map((item) => item.captureId) ?? [];
      const failedIds = result.failedIds ?? result.failed_ids ?? result.results?.filter((item) => !item.ok).map((item) => item.captureId) ?? [];
      const driveIssue = result.code === "DRIVE_RECONNECT_REQUIRED"
        ? "reconnect_required"
        : response.status === 409 || result.code === "DRIVE_NOT_CONNECTED" || /drive.*not connected/i.test(result.error ?? result.message ?? "")
        ? "not_connected"
        : null;

      if (deletedIds.length > 0) {
        const removed = new Set(deletedIds);
        setCaptures((prev) => prev.filter((capture) => !removed.has(capture.id)));
        setSelectedIds((prev) => new Set(Array.from(prev).filter((id) => !removed.has(id))));
      }
      if (driveIssue) {
        setDriveIssue(driveIssue);
        setDeleteError(driveIssue === "reconnect_required" ? t("cap.driveReconnectRequired") : t("cap.driveNotConnected"));
        return;
      }
      if (!response.ok || failedIds.length > 0) {
        const firstFailure = result.results?.find((item) => !item.ok);
        const details = firstFailure?.error
          ? `${firstFailure.error}${firstFailure.driveOutcome ? ` (${firstFailure.driveOutcome === "trashed" ? "Drive file trashed" : firstFailure.driveOutcome === "kept" ? "Drive file kept" : "Drive state unknown"})` : ""}`
          : null;
        setDeleteError(details ?? result.error ?? result.message ?? t("cap.deleteFailed"));
        if (deletedIds.length > 0) setDeleteRequest({
          ids: failedIds.length ? failedIds : deleteRequest.ids.filter((id) => !deletedIds.includes(id)),
          operationId: deleteRequest.operationId,
        });
        return;
      }

      setDeleteRequest(null);
      clearSelection();
    } catch (error) {
      console.warn("Error deleting captures:", error);
      setDeleteError(error instanceof Error ? error.message : "Could not delete the selected captures. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function uploadSelectedFile(file: File) {
    if (!file || uploading) return;
    const title = file.name.replace(/\.[^.]+$/, "") || "Untitled";
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("title", title);
      form.append("type", file.type.startsWith("video/") ? "video" : "screenshot");
      form.append("workspaceId", workspaceParam);
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch("/api/captures/upload", {
        method: "POST",
        headers: sessionData.session?.access_token ? { Authorization: `Bearer ${sessionData.session.access_token}` } : undefined,
        body: form,
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.error || "Upload failed");
      setUploadSuccess(`Uploaded ${file.name}`);
      loadPage(true);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleManualUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await uploadSelectedFile(file);
  }

  async function openMoveToModal() {
    const { data: wsRows, error: wsError } = await supabase.rpc("get_my_workspaces");
    if (wsError) {
      setUploadError(wsError.message);
      return;
    }
    const wsList = ((wsRows ?? []) as Array<{ id: string; name: string }>).map((ws) => ({ id: ws.id, name: ws.name }));
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
      const folderList = ((folderRows ?? []) as Array<{ name: string }>).map((f) => f.name);
      setMoveFolders(folderList);
      setMoveTargetFolderName(folderList[0] || "");
    }
    setMoveToOpen(true);
  }

  async function loadMoveFolders(workspaceId: string) {
    setMoveTargetWorkspaceId(workspaceId);
    const { data: folderRows, error: folderError } = await supabase
      .from("workspace_folders")
      .select("name")
      .eq("workspace_id", workspaceId)
      .order("name", { ascending: true });
    if (folderError) {
      setUploadError(folderError.message);
      return;
    }
    const folderList = ((folderRows ?? []) as Array<{ name: string }>).map((f) => f.name);
    setMoveFolders(folderList);
    setMoveTargetFolderName(folderList[0] || "");
  }

  async function submitMoveTo() {
    if (moving || selectedIds.size === 0 || !moveTargetWorkspaceId) return;
    setMoving(true);
    setUploadError(null);
    try {
      const ids = Array.from(selectedIds);
      for (const captureId of ids) {
        const { error } = await supabase.rpc("move_capture_to_workspace_folder", {
          p_capture_id: captureId,
          p_target_workspace_id: moveTargetWorkspaceId,
          p_target_folder_name: moveTargetFolderName || null,
        });
        if (error) throw error;
      }
      setMoveToOpen(false);
      clearSelection();
      await loadPage(true);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Failed moving captures");
    } finally {
      setMoving(false);
    }
  }

  const filteredCaptures = workspaceCaptures.filter((item) => {
    // No type selected => treat as "All" (don't filter by type).
    const matchesType =
      (!showVideo && !showScreenshot) ||
      (item.type === "video" && showVideo) ||
      (item.type === "screenshot" && showScreenshot);

    const matchesTag = !filterTag || item.tag === filterTag;
    const matchesStatus = !filterStatus || item.status === filterStatus;

    const q = search.trim().toLowerCase();
    const matchesSearch = !q || item.title.toLowerCase().includes(q);

    return matchesType && matchesTag && matchesStatus && matchesSearch;
  });

  const videoCount = workspaceCaptures.filter((c) => c.type === "video").length;
  const screenshotCount = workspaceCaptures.filter((c) => c.type === "screenshot").length;

  return (
    <div
      className="w-full min-w-0 p-3 sm:p-8 max-w-6xl mx-auto"
      onDragEnter={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
    >
      {dragActive && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-indigo-600/10 backdrop-blur-sm border-4 border-dashed border-indigo-600 m-4 rounded-2xl transition-all"
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            const file = e.dataTransfer.files?.[0];
            if (file) void uploadSelectedFile(file);
          }}
        >
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-xl flex flex-col items-center gap-3 max-w-sm text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <svg className="w-6 h-6 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Drop file to upload</p>
              <p className="text-xs text-muted mt-1">Upload your screenshot or video to BugSnap</p>
            </div>
          </div>
        </div>
      )}
      {shortcutCopied && activeHoverId && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white text-xs font-medium px-3 py-2 rounded-lg shadow-lg">
          {t("cap.copiedShortcut")}
        </div>
      )}
      {/* Header & Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 sm:mb-8 gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("cap.title")}</h1>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <div className="relative flex-1 min-w-[200px] lg:flex-none lg:w-64">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input
              type="text"
              placeholder={t("cap.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-9 pr-3 text-sm rounded-lg border border-border bg-subtle focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-full"
            />
          </div>
          {selectedIds.size === 0 ? (
            <>
              <label className="h-10 flex items-center justify-center gap-2 px-4 border border-border bg-subtle text-muted hover:text-foreground hover:bg-subtle/80 text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap">
                <input type="file" className="hidden" onChange={handleManualUpload} accept="image/*,video/*" />
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {uploading ? "Uploading..." : "Upload file"}
              </label>
              <a
                href={CHROME_WEB_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                title="Install BugSnap from the Chrome Web Store"
                className="h-10 flex items-center justify-center gap-2 px-4 bg-emerald-400 text-white text-sm font-medium rounded-lg hover:bg-emerald-500 transition-colors whitespace-nowrap"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                {t("cap.newCapture")}
              </a>
            </>
          ) : (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 w-full lg:w-auto lg:min-w-[420px] justify-between">
              <div className="flex items-center gap-3 text-foreground font-medium">
                <span className="w-7 h-7 rounded-lg bg-foreground text-background flex items-center justify-center">✓</span>
                <span>{selectedIds.size} selected</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => void openMoveToModal()}
                  disabled={moving || deleting}
                  className="h-10 px-4 rounded-xl border border-border bg-subtle text-sm font-medium text-foreground hover:bg-subtle/80 disabled:opacity-40 transition-colors"
                >
                  Move to
                </button>
                <button
                  onClick={() => openDeleteConfirmation(Array.from(selectedIds))}
                  disabled={selectedIds.size === 0 || deleting}
                  className="h-10 px-4 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 disabled:opacity-40 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter Row (Jam.dev style) - sticky so filters stay accessible while scrolling */}
      <div className="sticky top-0 z-10 grid grid-cols-2 min-[430px]:flex min-[430px]:flex-wrap items-center gap-3 mb-6 pb-4 pt-3 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="relative min-w-0">
          <button
            onClick={() => setTypeMenuOpen((o) => !o)}
            className={`w-full min-[430px]:w-auto flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
              typeMenuOpen || showVideo || showScreenshot
                ? "bg-subtle border-indigo-200 text-foreground"
                : "bg-subtle border-border text-muted hover:text-foreground hover:bg-subtle"
            }`}
          >
            <span>{t("cap.type")}</span>
            {(showVideo || showScreenshot) && (
              <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
            )}
            <svg className={`w-3.5 h-3.5 text-muted transition-transform ${typeMenuOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {typeMenuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setTypeMenuOpen(false)} />
              <div className="absolute top-full left-0 mt-1.5 w-[min(16rem,calc(100vw-1.5rem))] z-30 bg-subtle border border-border rounded-xl shadow-xl overflow-hidden">
                <div className="px-3 pt-3 pb-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">{t("cap.type")}</p>
                </div>

                {/* Screenshot row */}
                <label className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors text-sm ${showScreenshot ? "text-foreground" : "text-muted"}`}>
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${showScreenshot ? "bg-indigo-600 border-indigo-600" : "border-border"}`}
                    onClick={() => setShowScreenshot((v) => !v)}>
                    {showScreenshot && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                  </div>
                  <div className="w-7 h-7 rounded-md bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-rose-500 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium leading-none">{t("cap.screenshot")}</p>
                    <p className="text-[11px] text-muted mt-0.5">{t("cap.screenshotHint")}</p>
                  </div>
                  <span className="text-xs text-muted">({screenshotCount})</span>
                </label>

                {/* Video row */}
                <label className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors text-sm ${showVideo ? "text-foreground" : "text-muted"}`}>
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${showVideo ? "bg-indigo-600 border-indigo-600" : "border-border"}`}
                    onClick={() => setShowVideo((v) => !v)}>
                    {showVideo && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                  </div>
                  <div className="w-7 h-7 rounded-md bg-indigo-100 dark:bg-indigo-950/30 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-indigo-500 dark:text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium leading-none">{t("cap.video")}</p>
                    <p className="text-[11px] text-muted mt-0.5">{t("cap.videoHint")}</p>
                  </div>
                  <span className="text-xs text-muted">({videoCount})</span>
                </label>

                <div className="border-t border-border mt-1 px-3 py-2 flex justify-between">
                  <button onClick={() => { setShowVideo(true); setShowScreenshot(true); }} className="text-xs text-muted hover:text-foreground transition-colors">
                    {t("cap.selectAll")}
                  </button>
                  <button onClick={() => { setShowVideo(false); setShowScreenshot(false); }} className="text-xs text-muted hover:text-foreground transition-colors">
                    {t("cap.clear")}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Tag Filter */}
        <div className="flex min-w-0 items-center gap-1.5 text-xs border border-border bg-subtle rounded-lg px-2 py-1.5 text-muted hover:text-foreground hover:bg-subtle transition-colors">
          <span>{t("cap.tagFilter")}</span>
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="min-w-0 flex-1 bg-transparent font-medium text-foreground outline-none cursor-pointer"
          >
            <option value="">{t("cap.all")}</option>
            {TAG_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex min-w-0 items-center gap-1.5 text-xs border border-border bg-subtle rounded-lg px-2 py-1.5 text-muted hover:text-foreground hover:bg-subtle transition-colors">
          <span>{t("cap.statusFilter")}</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="min-w-0 flex-1 bg-transparent font-medium text-foreground outline-none cursor-pointer"
          >
            <option value="">{t("cap.all")}</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {(deleteError || uploadError || uploadSuccess) && (
        <div className={`mb-6 rounded-lg px-4 py-3 text-xs ${deleteError || uploadError ? "border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400" : "border border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {deleteError || uploadError || uploadSuccess}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-white dark:bg-subtle overflow-hidden animate-pulse shadow-sm">
              <div className="aspect-[16/10] bg-slate-200 dark:bg-background" />
              <div className="p-4 flex justify-between">
                <div className="w-1/2 h-4 bg-slate-200 dark:bg-border rounded" />
                <div className="w-16 h-4 bg-slate-200 dark:bg-border rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredCaptures.length === 0 ? (
        <div className="px-4 py-14 sm:py-20 text-center rounded-xl border border-dashed border-border bg-subtle/50 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800/40 flex items-center justify-center">
            <svg className="w-8 h-8 text-indigo-400 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {search.trim() || showVideo || showScreenshot ? t("cap.noMatch") : t("cap.empty")}
            </h3>
            <p className="text-xs text-muted mt-1 max-w-sm mx-auto text-balance">
              {search.trim() || showVideo || showScreenshot
                ? t("cap.noMatchHint")
                : t("cap.emptyHint")}
            </p>
          </div>
          {!search.trim() && !showVideo && !showScreenshot && (
            <a
              href={CHROME_WEB_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              {t("cap.install")}
            </a>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCaptures.map((item) => {
            const isSelected = selectedIds.has(item.id);
            const isSelectionActive = selectedIds.size > 0;
            // When in selection mode (at least 1 item selected), clicking anywhere on the card toggles selection instead of opening the link
            const CardWrapper = (isSelectionActive ? "div" : Link) as React.ElementType;
            const cardProps = isSelectionActive
              ? {
                  onClick: (e: React.MouseEvent) => {
                    e.preventDefault();
                    toggleSelect(item.id);
                  },
                  className: "flex flex-col flex-1 cursor-pointer select-none",
                }
              : { href: `/v/${item.id}`, className: "flex flex-col flex-1 group" };

            return (
            <div
              key={item.id}
              onMouseEnter={() => setActiveHoverId(item.id)}
              onMouseLeave={() => setActiveHoverId((prev) => (prev === item.id ? null : prev))}
              className={`group relative rounded-xl border bg-white dark:bg-subtle shadow-sm hover:shadow-md transition-all flex flex-col ${
                isSelected ? "border-indigo-600 ring-2 ring-indigo-600/20" : "border-border"
              }`}
            >
              <CardWrapper {...cardProps}>
                {/* Thumbnail Container */}
                <div className="aspect-[16/10] rounded-t-xl overflow-hidden bg-slate-100 dark:bg-background flex items-center justify-center text-muted text-sm relative group-hover:bg-slate-200 dark:group-hover:bg-background/80 transition-colors">
                  {driveThumbUrl(item.drive_url) && !thumbFailed[item.id] ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={driveThumbUrl(item.drive_url)!}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        onError={() => setThumbFailed((prev) => ({ ...prev, [item.id]: true }))}
                        className="w-full h-full object-cover"
                      />
                      {/* Play overlay for videos so the grid clearly shows what's a recording */}
                      {item.type === "video" ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/40 transition-colors">
                          <div className="w-10 h-10 rounded-full bg-background/90 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5 text-indigo-600 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-black/25 group-hover:bg-black/40 transition-colors" />
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      {item.type === "video" ? (
                        <svg className="w-9 h-9 text-indigo-600/80 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      ) : (
                        <svg className="w-8 h-8 text-indigo-600/80 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSelect(item.id); }}
                      aria-label="Select capture"
                      className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all shadow-sm ${
                        isSelected
                          ? "bg-indigo-600 border-indigo-600 text-white opacity-100 flex"
                          : "bg-white/90 dark:bg-zinc-900/90 border-slate-300 dark:border-zinc-600 text-transparent opacity-0 group-hover:opacity-100 hidden group-hover:flex"
                      }`}
                    >
                      <svg className={`w-4 h-4 ${isSelected ? "text-white" : "text-transparent group-hover:text-transparent"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>

                    {/* Author Badge: hidden when selected OR on hover */}
                    <div className={`items-center gap-2 transition-opacity ${isSelected ? "hidden" : "flex group-hover:hidden"}`}>
                      <div className={`w-7 h-7 rounded-full ${getAvatarColor(item.owner_email)} text-white text-xs font-bold flex items-center justify-center shadow-sm border border-white/20 shrink-0`}>
                        {getOwnerInitial(item.owner_email)}
                      </div>
                      <span className="text-xs font-medium text-white drop-shadow-sm truncate max-w-[140px]">
                        {item.owner_email ? item.owner_email.split("@")[0] : item.title}
                      </span>
                    </div>
                  </div>

                  {/* Top-Right: Quick Copy Link on Hover (hidden when selection active) */}
                  {!isSelectionActive && (
                    <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        aria-label={t("cap.copyLink")}
                        title={t("cap.copyLink")}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCopyLink(item.id); }}
                        className="w-8 h-8 rounded-lg bg-white/90 hover:bg-white text-slate-700 dark:bg-zinc-900/90 dark:hover:bg-zinc-900 dark:text-slate-200 border border-slate-200/80 dark:border-zinc-700 flex items-center justify-center shadow-md transition-colors"
                      >
                        {copiedId === item.id ? (
                          <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                        ) : (
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Bottom Right Duration (Jam.dev style) - Only shows for video */}
                  {item.type === "video" && (
                    <div className="absolute bottom-2.5 right-2.5 bg-black/70 backdrop-blur-sm text-white text-[11px] font-medium px-2 py-1 rounded flex items-center gap-1.5 shadow-sm">
                      <svg className="w-3.5 h-3.5 text-white fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      <span>{formatDuration(item.duration)}</span>
                    </div>
                  )}

                  {/* Status badges - top right when not hovered */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10 group-hover:opacity-0 transition-opacity">
                    {item.expires_at && new Date(item.expires_at).getTime() < Date.now() && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-red-100 bg-red-600/80 px-2 py-0.5 rounded backdrop-blur-sm shadow-sm">
                        {t("cap.expired")}
                      </span>
                    )}
                    {item.password && (
                      <span className="text-[10px] font-semibold text-amber-100 bg-amber-600/80 px-2 py-0.5 rounded backdrop-blur-sm flex items-center gap-1 shadow-sm">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                        {t("cap.locked")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Meta Footer */}
                <div className="p-3.5 flex items-center justify-between text-xs">
                  <div className="min-w-0 flex-1 pr-2">
                    <h3 className="font-medium text-foreground truncate group-hover:text-indigo-600 transition-colors">
                      {item.title}
                    </h3>
                    {item.folder_name && (
                      <p className="text-[11px] text-muted truncate mt-0.5">{item.folder_name}</p>
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
          Sentinel always stays mounted so IntersectionObserver keeps working;
          it just renders nothing visually when there's nothing to load. */}
      {!loading && filteredCaptures.length > 0 && (
        <div ref={sentinelRef} className="py-8 flex items-center justify-center">
          {loadingMore && hasMore && (
            <div className="flex flex-col items-center gap-2">
              <div className="w-7 h-7 border-[3px] border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <span className="text-xs text-muted">{t("cap.loadingMore")}</span>
            </div>
          )}
        </div>
      )}

      {editing && <EditModal capture={editing} onClose={() => setEditing(null)} onSaved={(updated) => setCaptures((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))} />}

      {moveToOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !moving && setMoveToOpen(false)} />
          <div className="relative w-full max-w-2xl rounded-2xl bg-subtle shadow-xl border border-border p-6">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Move {selectedIds.size} capture{selectedIds.size > 1 ? "s" : ""} to</h2>
            <div className="grid grid-cols-[1fr_220px] gap-4 items-start">
              <div className="space-y-2">
                {moveFolders.map((folder) => {
                  const isCurrent = filteredCaptures.some((c) => selectedIds.has(c.id) && c.workspace_id === moveTargetWorkspaceId && (c.folder_name || "") === folder);
                  return (
                    <button
                      key={folder}
                      type="button"
                      onClick={() => setMoveTargetFolderName(folder)}
                      className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${moveTargetFolderName === folder ? "border-indigo-500 bg-subtle" : "border-border hover:bg-subtle"}`}
                    >
                      <span className="flex items-center gap-3 text-foreground">
                        <svg className="w-5 h-5 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
                        <span>{folder}</span>
                      </span>
                      {isCurrent && <span className="text-xs px-2 py-1 rounded-lg border border-border text-muted">Current location</span>}
                    </button>
                  );
                })}
              </div>
              <div className="rounded-xl border border-border bg-white dark:bg-background overflow-hidden">
                <button type="button" className="w-full flex items-center justify-between gap-2 px-3 py-3 text-left border-b border-border">
                  <span className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-semibold">{(moveWorkspaces.find((ws) => ws.id === moveTargetWorkspaceId)?.name || "W").charAt(0)}</span>
                    <span className="font-medium text-foreground truncate">{moveWorkspaces.find((ws) => ws.id === moveTargetWorkspaceId)?.name || "Workspace"}</span>
                  </span>
                </button>
                {moveWorkspaces.map((ws) => (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => void loadMoveFolders(ws.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 text-left transition-colors ${moveTargetWorkspaceId === ws.id ? "bg-subtle text-foreground font-semibold" : "text-foreground hover:bg-subtle"}`}
                  >
                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-semibold">{ws.name.charAt(0)}</span>
                    <span className="truncate">{ws.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button onClick={() => setMoveToOpen(false)} className="px-4 py-2 text-sm font-medium text-foreground hover:bg-subtle rounded-lg transition-colors">{t("common.cancel")}</button>
              <button onClick={() => void submitMoveTo()} disabled={moving || !moveTargetWorkspaceId} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {moving ? "Moving..." : "Move"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-captures-title">
          <button className="absolute inset-0 bg-black/40" aria-label="Close confirmation" onClick={() => !deleting && setDeleteRequest(null)} />
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl bg-subtle shadow-xl border border-border p-6">
            <div className="mb-4 w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 flex items-center justify-center text-red-600 dark:text-red-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h2 id="delete-captures-title" className="text-lg font-bold text-foreground mb-1">
              {deleteRequest.ids.length === 1 ? t("cap.deleteTitleOne") : t("cap.deleteTitleMany", { count: deleteRequest.ids.length })}
            </h2>
            <p className="text-sm text-muted mb-5">
              {deleteRequest.title ? <>{t("cap.deleteWillRemove", { name: deleteRequest.title })}</> : t("cap.deleteChoose")}
            </p>

            <div className="space-y-2">
              <label className={`block rounded-lg border p-3 cursor-pointer ${deleteMode === "drive_trash" ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30" : "border-border"}`}>
                <span className="flex gap-3">
                  <input type="radio" name="delete-mode" value="drive_trash" checked={deleteMode === "drive_trash"} onChange={() => { setDeleteMode("drive_trash"); setDeleteRequest((request) => request ? { ...request, operationId: crypto.randomUUID() } : request); }} disabled={deleting} className="mt-1" />
                  <span><span className="block text-sm font-semibold text-foreground">{t("cap.moveToTrash")}</span><span className="block text-xs text-muted mt-0.5">{t("cap.trashHint")}</span></span>
                </span>
              </label>
              <label className={`block rounded-lg border p-3 cursor-pointer ${deleteMode === "app_only" ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30" : "border-border"}`}>
                <span className="flex gap-3">
                  <input type="radio" name="delete-mode" value="app_only" checked={deleteMode === "app_only"} onChange={() => { setDeleteMode("app_only"); setDeleteRequest((request) => request ? { ...request, operationId: crypto.randomUUID() } : request); setDriveIssue(null); setDeleteError(null); }} disabled={deleting} className="mt-1" />
                  <span><span className="block text-sm font-semibold text-foreground">{t("cap.BugSnapOnly")}</span><span className="block text-xs text-muted mt-0.5">{t("cap.BugSnapOnlyHint")}</span></span>
                </span>
              </label>
            </div>

            {deleteError && <div className="mt-4 rounded-lg border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/20 px-3 py-2 text-xs text-red-700 dark:text-red-400">{deleteError}</div>}
            {driveIssue && (
              <div className="mt-3 flex items-center gap-3">
                <button onClick={() => void startDriveConnect()} className="text-sm font-semibold text-indigo-600 hover:underline">{driveIssue === "reconnect_required" ? t("cap.reconnectDrive") : t("cap.connectDrive")}</button>
                <button onClick={() => { setDeleteMode("app_only"); setDriveIssue(null); setDeleteError(null); }} className="text-sm font-medium text-foreground hover:underline">{t("cap.useBugSnapOnly")}</button>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
              <button onClick={() => setDeleteRequest(null)} disabled={deleting} className="px-4 py-2 text-sm font-medium text-foreground hover:bg-subtle rounded-lg disabled:opacity-50 transition-colors">{t("common.cancel")}</button>
              <button onClick={submitDelete} disabled={deleting} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors">
                {deleting ? t("layout.deleting") : t("cap.confirmDelete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
