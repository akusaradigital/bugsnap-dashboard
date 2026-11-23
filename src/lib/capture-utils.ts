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
  /** Grouping key for the same underlying error; null when the capture has none. */
  error_fingerprint?: string | null;
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
  // Older than a week  compact date, same as before.
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
    "bg-red-600",
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

export interface CaptureErrorCounts {
  consoleErrors: number;
  networkErrors: number;
  hasErrors: boolean;
  total: number;
}

export function getCaptureErrorCounts(dev_logs: unknown): CaptureErrorCounts {
  if (!dev_logs || typeof dev_logs !== "object") {
    return { consoleErrors: 0, networkErrors: 0, hasErrors: false, total: 0 };
  }

  let consoleErrors = 0;
  let networkErrors = 0;

  const logs = dev_logs as Record<string, unknown>;

  // Structured { console: [...], network: [...] }
  if (Array.isArray(logs.console)) {
    for (const item of logs.console) {
      if (item && typeof item === "object" && (item as { level?: string }).level === "error") {
        consoleErrors += Number((item as { count?: number }).count || 1);
      }
    }
  }

  if (Array.isArray(logs.network)) {
    for (const item of logs.network) {
      if (item && typeof item === "object") {
        const net = item as { status?: number; level?: string; count?: number };
        if ((typeof net.status === "number" && net.status >= 400) || net.level === "error") {
          networkErrors += Number(net.count || 1);
        }
      }
    }
  }

  // Flat array of logs [{ type: 'console', level: 'error' }, ...]
  if (Array.isArray(dev_logs)) {
    for (const item of dev_logs) {
      if (item && typeof item === "object") {
        const entry = item as { type?: string; level?: string; status?: number; count?: number };
        if (entry.type === "console" && entry.level === "error") {
          consoleErrors += Number(entry.count || 1);
        } else if (entry.type === "network" && ((entry.status && entry.status >= 400) || entry.level === "error")) {
          networkErrors += Number(entry.count || 1);
        }
      }
    }
  }

  // Summary object fallback { errors: number }
  if (consoleErrors === 0 && networkErrors === 0 && typeof logs.errors === "number") {
    consoleErrors = logs.errors;
  }

  const total = consoleErrors + networkErrors;
  return {
    consoleErrors,
    networkErrors,
    hasErrors: total > 0,
    total,
  };
}

export function generateBugReport(
  capture: {
    title?: string;
    site_url?: string | null;
    browser?: string | null;
    os?: string | null;
    window_size?: string | null;
    description?: string | null;
    dev_logs?: unknown;
  },
  format: "markdown" | "jira" | "linear" | "text" | "ai_prompt",
  shareUrl: string,
): string {
  const title = capture.title || "Bug Report";
  const siteUrl = capture.site_url || "N/A";
  const browser = capture.browser || "N/A";
  const os = capture.os || "N/A";
  const windowSize = capture.window_size || "N/A";
  const desc = capture.description ? capture.description.trim() : "";

  const errorCounts = getCaptureErrorCounts(capture.dev_logs);
  const consoleErrors: string[] = [];
  const networkErrors: string[] = [];

  if (capture.dev_logs && typeof capture.dev_logs === "object") {
    const logs = capture.dev_logs as Record<string, unknown>;
    if (Array.isArray(logs.console)) {
      for (const item of logs.console) {
        if (item && typeof item === "object" && (item as { level?: string }).level === "error") {
          const msg = (item as { message?: string; text?: string }).message || (item as { text?: string }).text || "Unknown error";
          consoleErrors.push(msg.trim().slice(0, 160));
        }
      }
    }
    if (Array.isArray(logs.network)) {
      for (const item of logs.network) {
        if (item && typeof item === "object") {
          const net = item as { method?: string; url?: string; status?: number; level?: string };
          if ((typeof net.status === "number" && net.status >= 400) || net.level === "error") {
            networkErrors.push(`${net.method || "GET"} ${net.url || ""} (${net.status || "FAIL"})`.trim().slice(0, 160));
          }
        }
      }
    }
  }

  if (format === "jira") {
    let out = `h3. Bug Report: ${title}\n\n`;
    if (desc) out += `*Description:* ${desc}\n\n`;
    out += `*Environment:*\n`;
    out += `* *Page URL:* ${siteUrl}\n`;
    out += `* *Browser:* ${browser}\n`;
    out += `* *OS:* ${os}\n`;
    out += `* *Resolution:* ${windowSize}\n`;
    out += `* *BugSnap Recording:* [View Capture|${shareUrl}]\n\n`;

    if (consoleErrors.length > 0) {
      out += `h4. Console Errors (${consoleErrors.length}):\n`;
      consoleErrors.slice(0, 5).forEach((err) => {
        out += `* {noformat}${err}{noformat}\n`;
      });
      out += `\n`;
    }

    if (networkErrors.length > 0) {
      out += `h4. Failed Network Requests (${networkErrors.length}):\n`;
      networkErrors.slice(0, 5).forEach((net) => {
        out += `* {noformat}${net}{noformat}\n`;
      });
      out += `\n`;
    }

    return out.trim();
  }

  if (format === "text") {
    let out = `[BUG REPORT] ${title}\n`;
    if (desc) out += `Description: ${desc}\n`;
    out += `Page URL: ${siteUrl}\n`;
    out += `Browser: ${browser} | OS: ${os} | Size: ${windowSize}\n`;
    out += `Capture Link: ${shareUrl}\n`;
    if (errorCounts.consoleErrors > 0) out += `Console Errors: ${errorCounts.consoleErrors}\n`;
    if (errorCounts.networkErrors > 0) out += `Network Failures: ${errorCounts.networkErrors}\n`;
    return out.trim();
  }

  if (format === "ai_prompt") {
    let prompt = `Fix this bug in our codebase based on the BugSnap telemetry:\n\n`;
    prompt += `**Bug Title**: ${title}\n`;
    if (desc) prompt += `**User Description**: ${desc}\n`;
    prompt += `**Affected URL**: ${siteUrl}\n`;
    prompt += `**Environment**: ${browser} on ${os} (${windowSize})\n`;
    prompt += `**BugSnap Replay & Diagnostics**: ${shareUrl}\n\n`;

    if (consoleErrors.length > 0) {
      prompt += `**Console Exceptions**:\n\`\`\`\n${consoleErrors.slice(0, 5).join("\n")}\n\`\`\`\n\n`;
    }
    if (networkErrors.length > 0) {
      prompt += `**Failed HTTP Requests**:\n\`\`\`\n${networkErrors.slice(0, 5).join("\n")}\n\`\`\`\n\n`;
    }
    prompt += `Please inspect the root cause, identify the files involved, and provide a minimal, verified fix.`;
    return prompt.trim();
  }

  // Default: Markdown (compatible with GitHub & Linear)
  let md = `### 🐛 Bug: ${title}\n\n`;
  if (desc) md += `> ${desc}\n\n`;
  md += `**Environment:**\n`;
  md += `- **URL**: ${siteUrl}\n`;
  md += `- **Browser / OS**: ${browser} on ${os} (${windowSize})\n`;
  md += `- **Interactive Replay**: [View BugSnap Capture](${shareUrl})\n\n`;

  if (consoleErrors.length > 0) {
    md += `#### 🔴 Console Errors (${consoleErrors.length}):\n`;
    consoleErrors.slice(0, 5).forEach((err) => {
      md += `- \`${err}\`\n`;
    });
    md += `\n`;
  }

  if (networkErrors.length > 0) {
    md += `#### 🟠 Failed Network Requests (${networkErrors.length}):\n`;
    networkErrors.slice(0, 5).forEach((net) => {
      md += `- \`${net}\`\n`;
    });
    md += `\n`;
  }

  return md.trim();
}
