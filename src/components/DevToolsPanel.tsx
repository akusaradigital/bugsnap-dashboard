"use client";

import { useState } from "react";
import { useT } from "@/components/I18nProvider";

interface TimedLog {
  time?: string | number;
  timestamp?: string | number;
  count?: number;
}

export interface ConsoleLog extends TimedLog {
  type: "console";
  level?: string;
  message?: string;
  text?: string;
  stack?: string | null;
}

export interface NetworkLog extends TimedLog {
  type: "network";
  level?: string;
  method?: string;
  status?: number;
  resourceType?: string;
  url?: string;
  statusText?: string;
  duration?: number;
  requestBody?: string | null;
  responseBody?: string;
  error?: string;
}

export interface ActionLog extends TimedLog {
  type: "step";
  message?: string;
}

const ACTION_LABELS: Record<string, string> = {
  click: "Click",
  typing: "Typing",
  type: "Typing",
  input: "Input",
  navigate: "Navigation",
  navigation: "Navigation",
  screenshot: "Screenshot",
};

export interface NavigationLog extends TimedLog {
  type: "navigation";
  message?: string;
  url?: string;
}

export interface ScreenshotLog extends TimedLog {
  type: "screenshot";
  message?: string;
  url?: string;
}

export type DevLog = ConsoleLog | NetworkLog | ActionLog | NavigationLog | ScreenshotLog;

export function normalizeDevLog(log: Record<string, unknown>): DevLog {
  const type = typeof log.type === "string" ? log.type.toLowerCase() : "";
  const level = typeof log.level === "string" ? log.level : undefined;
  const message = typeof log.message === "string" ? log.message : undefined;
  const text = typeof log.text === "string" ? log.text : undefined;
  const stack = typeof log.stack === "string" || log.stack === null ? log.stack : undefined;
  const method = typeof log.method === "string" ? log.method : undefined;
  const status = typeof log.status === "number" ? log.status : undefined;
  const resourceType = typeof log.resourceType === "string" ? log.resourceType : undefined;
  const url = typeof log.url === "string" ? log.url : undefined;
  const statusText = typeof log.statusText === "string" ? log.statusText : undefined;
  const duration = typeof log.duration === "number" ? log.duration : undefined;
  const requestBody = typeof log.requestBody === "string" || log.requestBody === null ? log.requestBody : undefined;
  const responseBody = typeof log.responseBody === "string" ? log.responseBody : undefined;
  const error = typeof log.error === "string" ? log.error : undefined;
  const time = typeof log.time === "string" || typeof log.time === "number" ? log.time : undefined;
  const timestamp = typeof log.timestamp === "string" || typeof log.timestamp === "number" ? log.timestamp : undefined;
  const count = typeof log.count === "number" ? log.count : undefined;

  if (type === "console" || (type === "" && (level !== undefined || stack !== undefined || text !== undefined))) {
    return { type: "console", level, message, text, stack, time, timestamp, count };
  }
  if (type === "network" || (type === "" && (method !== undefined || status !== undefined || requestBody !== undefined || responseBody !== undefined))) {
    return { type: "network", level, method, status, resourceType, url, statusText, duration, requestBody, responseBody, error, time, timestamp, count };
  }
  if (type === "navigation") {
    return { type: "navigation", message, url, time, timestamp, count };
  }
  if (type === "screenshot") {
    return { type: "screenshot", message, url, time, timestamp, count };
  }
  return { type: "step", message: message || text || "", time, timestamp, count };
}

export interface DevLogSummary {
  version: number;
  errors: number;
  warnings: number;
  failedRequests: number;
  topErrors?: string[];
  failedUrls?: string[];
}

export type CapturedLogs = DevLog[] | DevLogSummary | null;

function isSummary(logs: unknown): logs is DevLogSummary {
  return !!logs && typeof logs === "object" && typeof (logs as Record<string, unknown>).version === "number";
}

interface Props {
  capture: {
    type?: string;
    drive_url: string;
    site_url?: string | null;
    created_at: string;
    window_size?: string | null;
    os?: string | null;
    browser?: string | null;
    dev_logs?: CapturedLogs;
  };
}

const TABS = ["Info", "Console", "Network", "Actions"] as const;
type Tab = typeof TABS[number];
type Grouped<T> = { log: T; count: number };

function normalizeText(value?: string) {
  return (value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeLevel(level?: string) {
  const normalized = normalizeText(level) || "error";
  return normalized === "warning" ? "warn" : normalized;
}

function canonicalUrl(value?: string) {
  return (value || "").split("#", 1)[0];
}

function logCount(log: TimedLog) {
  return Math.max(1, Number(log.count) || 1);
}

function totalLogCount(items: TimedLog[]) {
  return items.reduce((total, log) => total + logCount(log), 0);
}

function consoleText(log: ConsoleLog) {
  return log.message || log.text || "";
}

function conciseConsoleText(log: ConsoleLog) {
  const lines = consoleText(log)
    .replace(/^\[console\]\s*Uncaught Exception:\s*/i, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const meaningful = lines.find((line, index) => index === 0 || !/(webpack|node_modules|react-dom|chrome-extension:|^at (?:__webpack|webpack))/i.test(line));
  return meaningful || lines[0] || "Console error";
}

function networkLocation(value?: string) {
  try {
    const url = new URL(value || "");
    return { domain: url.hostname, path: `${url.pathname}${url.search}` || "/" };
  } catch {
    return { domain: value || "-", path: "" };
  }
}

function groupBy<T extends TimedLog>(items: T[], keyFor: (item: T) => string, mapItem?: (item: T) => T): Grouped<T>[] {
  const groups = new Map<string, Grouped<T>>();
  items.forEach((item) => {
    const key = keyFor(item);
    const existing = groups.get(key);
    const itemCount = logCount(item);
    if (existing) existing.count += itemCount;
    else groups.set(key, { log: mapItem ? mapItem(item) : item, count: itemCount });
  });
  return Array.from(groups.values());
}

const TRACKER_PATTERNS = [
  /atlassian\.com/i,
  /google-analytics\.com/i,
  /googletagmanager\.com/i,
  /sentry\.io/i,
  /mixpanel\.com/i,
  /hotjar\.com/i,
  /amplitude\.com/i,
  /statsig\.com/i,
  /segment\.io/i,
  /doubleclick\.net/i,
  /facebook\.net/i,
  /analytics/i,
  /telemetry/i,
  /tracking/i
];

function isTracker(url?: string) {
  if (!url) return false;
  return TRACKER_PATTERNS.some((pattern) => pattern.test(url));
}

// Formats error messages cleanly (e.g. converts "POST\nhttps://..." into structured method + URL badges)
function FormattedErrorMessage({ msg }: { msg: string }) {
  const lines = msg.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length >= 2 && /^(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)$/i.test(lines[0])) {
    const method = lines[0].toUpperCase();
    const url = lines[1];
    return (
      <div className="rounded-lg border border-red-200/80 dark:border-red-800/40 bg-subtle p-2.5 shadow-sm space-y-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/40 shrink-0">
            {method}
          </span>
          <span className="text-[11px] font-mono text-foreground font-medium truncate min-w-0 flex-1" title={url}>
            {url}
          </span>
        </div>
        {lines.slice(2).map((extra, idx) => (
          <p key={idx} className="text-[10px] text-muted font-mono break-all leading-tight">
            {extra}
          </p>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-red-100 dark:border-red-800/40 bg-subtle p-2.5 shadow-sm">
      <p className="text-[11px] font-mono text-foreground/90 break-words leading-relaxed whitespace-pre-wrap">
        {msg}
      </p>
    </div>
  );
}

export default function DevToolsPanel({ capture }: Props) {
  const { t } = useT();
  const [activeTab, setActiveTab] = useState<Tab>("Info");
  const [logSearch, setLogSearch] = useState("");
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);

  const summaryOnly = !Array.isArray(capture.dev_logs) && isSummary(capture.dev_logs);
  const logs: DevLog[] = Array.isArray(capture.dev_logs)
    ? (capture.dev_logs as unknown[]).map((log) => normalizeDevLog((log || {}) as Record<string, unknown>))
    : [];
  const summary = summaryOnly ? (capture.dev_logs as DevLogSummary) : null;

  const earliestTimestamp = logs.reduce<number>((min, log) => {
    const raw = log.timestamp;
    const ts =
      typeof raw === "number"
        ? raw
        : typeof raw === "string" && !/^\d{1,2}:\d{2}$/.test(raw)
          ? new Date(raw).getTime()
          : 0;
    return Number.isFinite(ts) && ts > 0 && (min === 0 || ts < min) ? ts : min;
  }, 0);

  const getRelativeTime = (log: TimedLog) => {
    // If it's a screenshot, there is no "video duration", so we just want absolute wall clock time.
    if (capture.type === "screenshot" && log.timestamp && Number(log.timestamp)) {
      return new Date(Number(log.timestamp)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    const value = log.time || log.timestamp;
    if (!value) return "-";
    if (typeof value === "string" && /^\d{1,2}:\d{2}$/.test(value)) return value;
    if (typeof value === "string" && /^[+\d].*(?:ms|s|m|h)$/i.test(value)) return value;
    const ts = typeof value === "number" ? value : new Date(value).getTime();
    if (!Number.isFinite(ts) || earliestTimestamp === 0) return "-";
    const elapsed = ts - earliestTimestamp;
    if (elapsed < 1000) return `${Math.max(0, elapsed)}ms`;
    if (elapsed < 60000) return `${(elapsed / 1000).toFixed(1)}s`;
    return `${Math.floor(elapsed / 60000)}m ${Math.floor((elapsed % 60000) / 1000)}s`;
  };

  const networkLogs = logs
    .filter((l): l is NetworkLog => l.type === "network")
    .filter((l) => {
      if (isTracker(l.url)) return false;
      const matchesQuery = !logSearch || (l.url || "").toLowerCase().includes(logSearch.toLowerCase());
      const isErr = !l.status || l.status >= 400 || normalizeLevel(l.level) === "error";
      const matchesError = !showErrorsOnly || isErr;
      return matchesQuery && matchesError;
    });

  const eventTime = (log: TimedLog) => log.time || log.timestamp || "";

  const consoleLogs = logs
    .filter((log) => log.type === "console" || log.type === "navigation" || log.type === "screenshot")
    .filter((log) => {
      const detail = log.type === "console" ? consoleText(log) : log.message || ("url" in log ? log.url : "") || "";
      if (isTracker(detail) || ("url" in log && isTracker(log.url))) return false;
      const isError = log.type === "console" ? normalizeLevel(log.level) === "error" : false;
      return (!logSearch || detail.toLowerCase().includes(logSearch.toLowerCase())) && (!showErrorsOnly || isError);
    });

  const actionLogs = logs
    .filter((l): l is ActionLog | NavigationLog | ScreenshotLog => l.type === "step" || l.type === "navigation" || l.type === "screenshot")
    .filter((l) => !logSearch || `${l.message || ""} ${"url" in l ? l.url || "" : ""}`.toLowerCase().includes(logSearch.toLowerCase()));
  
  const groupedNetworkLogs = groupBy(
    networkLogs,
    (log) => `${(log.method || "GET").toUpperCase()}\u0000${log.status ?? "FAILED"}\u0000${canonicalUrl(log.url)}`,
    (log) => ({ ...log, url: canonicalUrl(log.url) })
  );

  const createdAt = new Date(capture.created_at).toLocaleString("en-US", {
    month: "long", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", timeZoneName: "short",
  });

  const legacyLogsText = JSON.stringify(capture.dev_logs || []);
  const detectedOs = capture.os || (legacyLogsText.toLowerCase().includes("macintosh") || legacyLogsText.toLowerCase().includes("mac os") ? "macOS" : "Windows");
  const detectedBrowser = capture.browser || "Chrome";

  const [copiedMd, setCopiedMd] = useState(false);

  function downloadJson() {
    const blob = new Blob([JSON.stringify(capture.dev_logs, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "capture_logs.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function copyToMarkdown() {
    let md = `## 🐞 BugSnap Bug Report: ${createdAt}\n\n`;
    
    md += `### 💻 System Info\n`;
    md += `| Field | Value |\n`;
    md += `| :--- | :--- |\n`;
    md += `| **URL** | ${capture.site_url ? `[Open link](${capture.site_url})` : "-"} |\n`;
    md += `| **OS** | ${detectedOs} |\n`;
    md += `| **Browser** | ${detectedBrowser} |\n`;
    md += `| **Window size** | ${capture.window_size || "-"} |\n`;
    md += `| **Recorded at** | ${createdAt} |\n\n`;

    if (consoleLogs.length > 0) {
      md += `### Diagnostic Timeline (${totalLogCount(consoleLogs)})\n\`\`\`text\n`;
      consoleLogs.forEach((log) => {
        const detail = log.type === "console" ? log.message || log.text || "" : log.message || ("url" in log ? log.url : "") || (log.type === "screenshot" ? "Screenshot taken" : "Navigation");
        md += `[${log.type.toUpperCase()}] ${eventTime(log)} ${detail}${(log.count || 1) > 1 ? ` ×${log.count}` : ""}\n`;
      });
      md += `\`\`\`\n\n`;
    }

    if (networkLogs.length > 0) {
      md += `### 🌐 Network Errors (${totalLogCount(networkLogs)})\n| Method | Status | Type | URL |\n| :--- | :--- | :--- | :--- |\n`;
      groupedNetworkLogs.forEach(({ log, count }) => {
        md += `| ${log.method || "GET"} | ${log.status || "FAILED"} | ${log.resourceType || "xhr"} | ${log.url || ""}${count > 1 ? ` ×${count}` : ""} |\n`;
      });
      md += `\n`;
    }

    if (actionLogs.length > 0) {
      md += `### User Actions Timeline\n`;
      actionLogs.forEach((log) => {
        md += `- **${eventTime(log)}**: ${log.type === "navigation" ? `Navigate to ${log.url || log.message || ""}` : log.message || ""}\n`;
      });
      md += `\n`;
    }

    navigator.clipboard.writeText(md);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  }

  const tabLabel = (tab: Tab) => {
    if (tab === "Console" && consoleLogs.length) return `${t("dt.console")} (${totalLogCount(consoleLogs)})`;
    if (tab === "Network" && networkLogs.length) return `${t("dt.network")} (${totalLogCount(networkLogs)})`;
    if (tab === "Actions" && actionLogs.length)  return `${t("dt.actions")} (${totalLogCount(actionLogs)})`;
    return t(`dt.${tab.toLowerCase()}`);
  };

  return (
    <div className="w-full lg:w-[360px] border-t lg:border-t-0 lg:border-l border-border bg-subtle flex flex-col shrink-0 h-[450px] lg:h-auto min-h-0 max-h-full">
      {/* Header */}
      <div className="h-11 border-b border-border px-4 flex items-center justify-between shrink-0">
        <span className="text-sm font-semibold text-foreground">{t("v.devTools")}</span>
        <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800/40">
          {summary
            ? summary.errors === 0 && summary.warnings === 0 && summary.failedRequests === 0
              ? t("dt.clean", { n: 0 })
              : t("dt.events", { n: summary.errors + summary.warnings + summary.failedRequests })
            : t("dt.events", { n: totalLogCount(consoleLogs) + totalLogCount(networkLogs) + totalLogCount(actionLogs) })}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border shrink-0 px-4 gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-2.5 py-2.5 text-[11px] font-medium relative transition-colors whitespace-nowrap ${
              activeTab === t ? "text-indigo-600 font-semibold" : "text-muted hover:text-foreground"
            }`}
          >
            {tabLabel(t)}
            {activeTab === t && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Content - scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Global Search & Filters */}
        {activeTab !== "Info" && (
          <div className="p-3 border-b border-border bg-subtle/30 flex flex-col gap-2 shrink-0">
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input
                type="text"
                placeholder={t("dt.search", { tab: tabLabel(activeTab) })}
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border text-xs bg-subtle outline-none focus:border-indigo-500 shadow-sm"
              />
            </div>
            {(activeTab === "Console" || activeTab === "Network") && (
              <div className="flex bg-border/40 p-0.5 rounded-lg shrink-0">
                <button
                  type="button"
                  onClick={() => setShowErrorsOnly(false)}
                  className={`flex-1 px-3 py-1 text-[10px] font-semibold rounded-md transition-colors ${
                    !showErrorsOnly ? "bg-subtle text-foreground shadow-sm" : "text-muted hover:text-foreground"
                  }`}
                >
                  {t("dt.all")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowErrorsOnly(true)}
                  className={`flex-1 px-3 py-1 text-[10px] font-semibold rounded-md transition-colors flex items-center justify-center gap-1 ${
                    showErrorsOnly ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 shadow-sm border border-red-100 dark:border-red-800/40" : "text-muted hover:text-red-500 dark:hover:text-red-400"
                  }`}
                >
                  {t("dt.errorsOnly")}
                </button>
              </div>
            )}
          </div>
        )}

        {/* INFO TAB */}
        {activeTab === "Info" && (
          <div className="p-4 space-y-4">
            {capture.site_url && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-1.5">URL</p>
                <a
                  href={capture.site_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-[11px] font-mono text-indigo-600 hover:underline bg-subtle/60 border border-border rounded-lg px-3 py-2 truncate"
                >
                  {capture.site_url}
                </a>
              </div>
            )}

            <div className="rounded-xl border border-border overflow-hidden bg-subtle shadow-sm">
              {[
                {
                  icon: (
                    <svg className="w-3.5 h-3.5 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                  ),
                  labelKey: "dt.timestamp",
                  value: createdAt,
                },
                {
                  icon: (
                    <svg className="w-3.5 h-3.5 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                    </svg>
                  ),
                  labelKey: "dt.location",
                  value: "Indonesia",
                },
                {
                  icon: (
                    <svg className="w-3.5 h-3.5 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                  ),
                  labelKey: "dt.os",
                  value: detectedOs,
                },
                {
                  icon: (
                    <svg className="w-3.5 h-3.5 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/>
                      <line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/>
                      <line x1="10.88" y1="21.94" x2="15.46" y2="14"/>
                    </svg>
                  ),
                  labelKey: "dt.browser",
                  value: detectedBrowser,
                },
                {
                  icon: (
                    <svg className="w-3.5 h-3.5 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="13" rx="2"/>
                      <path d="M12 16v5M8 21h8"/>
                    </svg>
                  ),
                  labelKey: "dt.windowSize",
                  value: capture.window_size || "-",
                },
              ].map((row) => (
                <div key={row.labelKey} className="flex items-center justify-between px-3 py-2 border-b border-border/60 last:border-0">
                  <div className="flex items-center gap-2 text-muted">
                    {row.icon}
                    <span className="text-xs">{t(row.labelKey)}</span>
                  </div>
                  <span className="text-xs font-medium text-foreground">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={copyToMarkdown}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                {copiedMd ? t("dt.copiedReport") : t("dt.copyReport")}
              </button>
              <button
                onClick={downloadJson}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border bg-subtle hover:bg-subtle text-foreground text-xs font-semibold shadow-sm transition-colors"
              >
                <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {t("dt.downloadJson")}
              </button>
            </div>
          </div>
        )}

        {/* CONSOLE TAB */}
        {activeTab === "Console" && (
          <div>
            {consoleLogs.length === 0 ? (
              summary ? (
                <div className="p-4 space-y-3">
                  {summary.errors === 0 && summary.warnings === 0 ? (
                    <div className="py-10 flex flex-col items-center gap-2 text-center text-xs text-muted">
                      <svg className="w-8 h-8 text-emerald-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      <p className="font-medium text-emerald-700 dark:text-emerald-400">{t("dt.pageRanClean")}</p>
                      <p className="text-[11px]">{t("dt.noConsoleErrors")}</p>
                    </div>
                  ) : (
                    <>
                      {/* Summary alert banner */}
                      <div className="flex items-center gap-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/80 dark:border-red-800/40 px-3.5 py-2.5 shadow-sm">
                        <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 flex items-center justify-center shrink-0 text-red-600 dark:text-red-400 text-xs font-bold">
                          {summary.errors}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-red-800 dark:text-red-300 leading-tight">
                            {summary.errors === 1 ? t("dt.consoleErrOne") : t("dt.consoleErr")}
                          </p>
                          {summary.warnings > 0 && (
                            <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium leading-tight mt-0.5">
                              {t("dt.warnSuffix", { n: summary.warnings })}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Clean error list */}
                      <div className="space-y-2 pt-1">
                        {(summary.topErrors || []).map((msg, i) => (
                          <FormattedErrorMessage key={i} msg={msg} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="py-14 text-center text-xs text-muted">{t("dt.noConsoleEvents")}</div>
              )
            ) : (
              <div className="divide-y divide-border/60">
                {consoleLogs.map((log, i) => {
                  const level = log.type === "console" ? normalizeLevel(log.level) : log.type;
                  const isWarn = level === "warn";
                  const isErr = level === "error";
                  const detail = log.type === "console" ? conciseConsoleText(log)
                    : log.message || ("url" in log ? log.url : "") || (log.type === "screenshot" ? t("dt.screenshotTaken") : t("dt.navigation"));
                  const fullText = log.type === "console" ? consoleText(log) : detail;
                  return (
                    <div
                      key={i}
                      className={`p-3 text-xs transition-colors ${
                        isWarn ? "bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50/70 dark:hover:bg-amber-950/30" : isErr ? "bg-red-50/40 dark:bg-red-950/20 hover:bg-red-50/70 dark:hover:bg-red-950/30" : "hover:bg-subtle/50"
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="pt-0.5 text-[10px] font-mono text-muted shrink-0 tabular-nums">
                          {getRelativeTime(log)}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase shrink-0 ${
                            isWarn
                              ? "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40"
                              : isErr
                              ? "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/40"
                              : "bg-subtle text-muted border border-border"
                          }`}
                        >
                          {isWarn ? "WARN" : isErr ? "ERR" : level.toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <FormattedErrorMessage msg={fullText || detail} />
                          {log.type === "console" && log.stack != null && (
                            <details className="group mt-2">
                              <summary className="flex list-none cursor-pointer items-center gap-1 text-[10px] font-semibold text-muted hover:text-foreground">
                                <svg className="w-3 h-3 transition-transform group-open:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                                {t("dt.stack")}
                              </summary>
                              <pre className="mt-1.5 p-2 rounded-lg bg-red-950 text-red-200 font-mono text-[10px] leading-relaxed whitespace-pre-wrap break-all overflow-x-auto">
                                {log.stack}
                              </pre>
                            </details>
                          )}
                        </div>
                        {logCount(log) > 1 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-subtle text-[10px] font-bold text-muted border border-border shrink-0">
                            ×{logCount(log)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* NETWORK TAB */}
        {activeTab === "Network" && (
          <div>
            {networkLogs.length === 0 ? (
              summary ? (
                <div className="p-4 space-y-3">
                  {summary.failedRequests === 0 ? (
                    <div className="py-10 flex flex-col items-center gap-2 text-center text-xs text-muted">
                      <svg className="w-8 h-8 text-emerald-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      <p className="font-medium text-emerald-700 dark:text-emerald-400">{t("dt.noFailedRequests")}</p>
                      <p className="text-[11px]">{t("dt.allNetworkOk")}</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/80 dark:border-red-800/40 px-3.5 py-2.5 shadow-sm">
                        <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 flex items-center justify-center shrink-0 text-red-600 dark:text-red-400 text-xs font-bold">
                          {summary.failedRequests}
                        </div>
                        <p className="text-xs font-semibold text-red-800 dark:text-red-300 leading-tight">
                          {summary.failedRequests === 1 ? t("dt.failedReqOne") : t("dt.failedReq")}
                        </p>
                      </div>
                      <div className="space-y-2 pt-1">
                        {(summary.failedUrls || []).map((url, i) => (
                          <div key={i} className="rounded-lg border border-red-100 dark:border-red-800/40 bg-subtle p-2.5 shadow-sm">
                            <p className="text-[11px] font-mono text-red-700 dark:text-red-400 break-all leading-tight">
                              {url}
                            </p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="py-14 text-center text-xs text-muted">{t("dt.noNetworkErrors")}</div>
              )
            ) : (
              <div className="divide-y divide-border/60">
                {groupedNetworkLogs.map(({ log, count }, i) => {
                  const { domain, path } = networkLocation(log.url);
                  const isFailed = !log.status || log.status >= 400;
                  const isOk = log.status && log.status < 300;
                  return (
                    <details key={i} className="group hover:bg-subtle/50 transition-colors">
                      <summary className="p-3 cursor-pointer list-none flex items-center justify-between gap-2 min-w-0">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono uppercase bg-subtle text-foreground border border-border shrink-0">
                            {log.method || "GET"}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono shrink-0 ${
                              isFailed
                                ? "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/40"
                                : isOk
                                ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40"
                                : "bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40"
                            }`}
                          >
                            {log.status || "FAIL"}
                          </span>
                          <div className="min-w-0 flex-1 truncate">
                            <p className="text-xs font-medium text-foreground truncate" title={log.url}>
                              {domain}
                            </p>
                            {path && (
                              <p className="text-[10px] font-mono text-muted truncate" title={path}>
                                {path}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {count > 1 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-subtle text-[10px] font-bold text-muted border border-border">
                              ×{count}
                            </span>
                          )}
                          <svg className="w-3.5 h-3.5 text-muted transition-transform group-open:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </div>
                      </summary>
                      <div className="px-3 pb-3 pt-1 space-y-2 border-t border-border/40 bg-subtle/20 text-xs">
                        <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px]">
                          {log.duration != null && (
                            <span><span className="text-muted">{t("dt.duration")}:</span> {log.duration}ms</span>
                          )}
                          {log.statusText && (
                            <span><span className="text-muted">{t("dt.statusText")}:</span> {log.statusText}</span>
                          )}
                          {log.error && (
                            <span className="text-red-600 font-semibold">{t("dt.error")}: {log.error}</span>
                          )}
                        </div>
                        {log.requestBody != null && (
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">{t("dt.requestBody")}</p>
                            <pre className="p-2 rounded-lg bg-subtle border border-border font-mono text-[10px] leading-relaxed whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
                              {log.requestBody}
                            </pre>
                          </div>
                        )}
                        {log.responseBody && (
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">{t("dt.responseBody")}</p>
                            <pre className="p-2 rounded-lg bg-subtle border border-border font-mono text-[10px] leading-relaxed whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
                              {log.responseBody}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ACTIONS TAB */}
        {activeTab === "Actions" && (
          <div className="p-4">
            {actionLogs.length === 0 ? (
              <div className="py-14 flex flex-col items-center gap-2 text-muted">
                <svg className="w-8 h-8 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"/>
                </svg>
                <p className="text-xs">{t("dt.noActions")}</p>
              </div>
            ) : (
              <div className="relative pl-2">
                <div className="absolute left-[19px] top-3 bottom-3 w-px bg-border/80" />
                <div className="space-y-3">
                  {actionLogs.map((log, i) => {
                    const label = ACTION_LABELS[(log.message || "").toLowerCase().split(/\s+/)[0]] || ACTION_LABELS[log.type] || "Action";
                    const isClick = label === "Click" || (log.message || "").toLowerCase().includes("click");
                    const isType = label === "Typing" || (log.message || "").toLowerCase().includes("type") || (log.message || "").toLowerCase().includes("input");
                    const isScreenshot = log.type === "screenshot";
                    return (
                      <div key={i} className="flex items-start gap-3 relative">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-white dark:border-background shadow-sm ${
                            isScreenshot ? "bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400" : isClick ? "bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400" : isType ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" : "bg-subtle text-muted"
                          }`}
                        >
                          {isScreenshot ? (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            </svg>
                          ) : isClick ? (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"/>
                            </svg>
                          ) : isType ? (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="4"/>
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          {eventTime(log) && (
                            <span className="text-[10px] text-muted font-mono block mb-0.5">{getRelativeTime(log)}</span>
                          )}
                          <p className="text-[10px] uppercase tracking-wide text-muted font-semibold mb-0.5">{label}</p>
                          <p className="text-xs text-foreground font-medium leading-normal break-words">
                            {log.type === "navigation" ? t("dt.navigateTo", { url: log.url || log.message || "" }) : log.type === "screenshot" ? t("dt.screenshotTaken") : log.message || ""}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
