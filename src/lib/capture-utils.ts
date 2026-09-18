// Capture row shape, its option lists and the pure formatting helpers the
// captures page and its edit modal share. Split out of captures/page.tsx.

export type CaptureFilter = "all" | "video" | "screenshot";

export interface Capture {
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

export const TAG_OPTIONS = ["bug", "feature-request", "wip", "design", "other"];
export const STATUS_OPTIONS = ["open", "in-progress", "fixed", "closed"];

export const EXPIRY_OPTIONS: { value: "never" | "24h" | "7d"; labelKey: string }[] = [
  { value: "never", labelKey: "cap.never" },
  { value: "24h", labelKey: "cap.hours24" },
  { value: "7d", labelKey: "cap.days7" },
];

export function timeAgo(iso: string, t: (k: string, vars?: Record<string, string | number>) => string): string {
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

export function formatDuration(sec: number | null | undefined): string {
  if (!sec || isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function getAvatarColor(seed: string | null | undefined): string {
  const colors = [
    "bg-[#89BD49]",
    "bg-emerald-600",
    "bg-rose-600",
    "bg-amber-600",
    "bg-slate-700",
    "bg-teal-600",
    "bg-sky-600",
  ];
  let h = 0;
  const s = seed || "";
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return colors[h % colors.length];
}

export function getOwnerInitial(email: string | null | undefined): string {
  if (!email) return "M";
  // Filter out punctuation commonly at the start of title, get clean first letter
  const clean = email.replace(/[^a-zA-Z0-9]/g, "").trim();
  const char = clean.charAt(0);
  return (char || "M").toUpperCase();
}

export function driveFileId(driveUrl: string | null | undefined): string | null {
  if (!driveUrl) return null;
  const m = driveUrl.match(/[?&]id=([^&]+)/) || driveUrl.match(/\/d\/([^/]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export function driveThumbUrl(driveUrl: string | null | undefined, size = 800): string | null {
  if (!driveUrl) return null;
  const id = driveFileId(driveUrl);
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w${size}` : null;
}

export function expiryToOption(expiresAt: string | null | undefined, createdAt: string): string {
  if (!expiresAt) return "never";
  const diffMs = new Date(expiresAt).getTime() - new Date(createdAt).getTime();
  if (diffMs <= 36 * 60 * 60 * 1000) return "24h";
  if (diffMs <= 10.5 * 24 * 60 * 60 * 1000) return "7d";
  return "never";
}

export interface UploadTask {
  name: string;
  size: number;
  type: "video" | "screenshot";
  progress: number;
  status: "uploading" | "syncing" | "completed" | "error";
  error?: string;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}
