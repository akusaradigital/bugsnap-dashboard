"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useT } from "@/components/I18nProvider";
import { decompressDevLogs } from "@/lib/devlogs-compression";
import { supabase } from "@/lib/supabase";
import { isIgnoredUrl, TRACKER_PATTERNS } from "@/lib/ignored-urls";

export { isIgnoredUrl, TRACKER_PATTERNS };

interface TimedLog {
  /** Position in the original `logs` array. Set when a derived list makes a
   *  spread copy, so breadcrumb lookup does not need reference identity. */
  srcIdx?: number;
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

// One place decides an action's kind, so the chip filter and the row badge can
// never disagree about what a row is.
function actionKind(log: { type: string; message?: string }): "click" | "typing" | "input" | "navigation" | "screenshot" | null {
  const firstWord = (log.message || "").toLowerCase().split(/\s+/)[0];
  return ACTION_KINDS[firstWord] || ACTION_KINDS[log.type] || null;
}

// Values are i18n keys, not display strings - the label is resolved at render.
// The bare kind (right column) is what the UI branches on, so it stays stable
// regardless of locale; only the visible label goes through t().
const ACTION_KINDS: Record<string, "click" | "typing" | "input" | "navigation" | "screenshot"> = {
  click: "click",
  clicked: "click",
  typing: "typing",
  type: "typing",
  typed: "typing",
  input: "input",
  navigate: "navigation",
  navigation: "navigation",
  navigated: "navigation",
  screenshot: "screenshot",
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

export interface PerformanceLog extends TimedLog {
  type: "performance";
  metrics?: {
    domNodes?: number;
    jsHeapUsedMB?: number | null;
    jsHeapTotalMB?: number | null;
    lcpMs?: number | null;
    cls?: number;
    inpMs?: number | null;
    fcpMs?: number | null;
    ttfbMs?: number | null;
  };
}

export interface StorageLog extends TimedLog {
  type: "storage";
  storage?: {
    localStorage?: Record<string, string>;
    sessionStorage?: Record<string, string>;
  };
}

export interface DeviceSpecsLog extends TimedLog {
  type: "device_specs";
  specs?: Record<string, unknown>;
}

export type DevLog = ConsoleLog | NetworkLog | ActionLog | NavigationLog | ScreenshotLog | PerformanceLog | StorageLog | DeviceSpecsLog;

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
  const metrics = typeof log.metrics === "object" && log.metrics !== null ? (log.metrics as PerformanceLog["metrics"]) : undefined;
  const storage = typeof log.storage === "object" && log.storage !== null ? (log.storage as StorageLog["storage"]) : undefined;
  const specs = typeof log.specs === "object" && log.specs !== null ? (log.specs as DeviceSpecsLog["specs"]) : undefined;

  if (type === "performance") {
    return { type: "performance", metrics, time, timestamp, count };
  }
  if (type === "storage") {
    return { type: "storage", storage, time, timestamp, count };
  }
  if (type === "device_specs") {
    return { type: "device_specs", specs, time, timestamp, count };
  }
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

export interface DriveExternalLogReference {
  driveFileId: string;
  driveUrl?: string;
  errors?: number;
  warnings?: number;
  totalLogs?: number;
  duration?: number;
}

export type CapturedLogs = DevLog[] | DevLogSummary | DriveExternalLogReference | string | null;

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
  currentTime?: number;
  onSeekToTime?: (timeSec: number) => void;
}

const TABS = ["Info", "Console", "Network", "Actions", "Storage", "Issues"] as const;
type Tab = typeof TABS[number];
type Grouped<T> = { log: T; count: number };

function normalizeText(value?: string) {
  return (value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeLevel(level?: string) {
  const normalized = normalizeText(level) || "error";
  return normalized === "warning" ? "warn" : normalized;
}

function isConsoleError(log: ConsoleLog) {
  const level = normalizeLevel(log.level);
  return level === "error" || Boolean(log.stack) || /(uncaught|exception|error|failed)/i.test(consoleText(log));
}

function isNetworkFailed(log: NetworkLog) {
  return !log.status || log.status >= 400 || log.status === 0 || Boolean(log.error);
}

function consoleDetail(log: ConsoleLog | NavigationLog | ScreenshotLog) {
  return log.type === "console" ? consoleText(log) : log.message || ("url" in log ? log.url : "") || "";
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
  return meaningful || lines[0] || "";
}

function cleanStackTrace(stack?: string | null): string {
  if (!stack || typeof stack !== "string") return "";
  return stack
    .split(/\r?\n/)
    .filter((line) => {
      const lower = line.toLowerCase();
      return (
        !lower.includes("chrome-extension://") &&
        !lower.includes("moz-extension://") &&
        !lower.includes("safari-extension://") &&
        !lower.includes("edge-extension://") &&
        !lower.includes("injected_logger.js") &&
        !lower.includes("rrweb-record") &&
        !lower.includes("record_controls")
      );
    })
    .join("\n")
    .trim();
}

function networkLocation(value?: string) {
  try {
    const url = new URL(value || "");
    return { domain: url.hostname, path: `${url.pathname}${url.search}` || "/" };
  } catch {
    return { domain: value || "-", path: "" };
  }
}

function getTargetHost(siteUrl?: string | null): string {
  if (!siteUrl) return "";
  try {
    const parsed = new URL(siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`);
    // Strip www. so "www.example.com" matches a request to "example.com".
    // The reverse already matches via the endsWith("." + target) check below.
    return parsed.hostname.replace(/^www\./i, "");
  } catch {
    return "";
  }
}

function isFirstPartyUrl(url?: string, targetHost?: string): boolean {
  if (!url || !targetHost) return true;
  const target = targetHost.toLowerCase();
  try {
    // Relative paths ("/api/orders") are the shape a first-party API call takes
    // and throw without a base, so resolve against the site under test.
    const host = new URL(url, `https://${target}`).hostname.toLowerCase();
    // data: and blob: parse fine but have no hostname - they came from the page.
    if (!host) return true;
    return host === target || host.endsWith("." + target);
  } catch {
    return true;
  }
}

const HTTP_STATUS_TEXT: Record<number, string> = {
  200: "OK",
  201: "Created",
  204: "No Content",
  301: "Moved Permanently",
  302: "Found",
  304: "Not Modified",
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  408: "Request Timeout",
  409: "Conflict",
  422: "Unprocessable Entity",
  429: "Too Many Requests",
  500: "Internal Server Error",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
};

function statusLabel(t: (k: string) => string, status?: number): string {
  if (!status) return "";
  const key = `dt.st.${status}`;
  const hit = t(key);
  // translate() returns the key itself when there is no entry.
  return hit === key ? HTTP_STATUS_TEXT[status] || `HTTP ${status}` : hit;
}

function isClassSoup(text: string) {
  const tokens = text.split(/\s+/).filter(Boolean);
  return tokens.length >= 3 && (tokens.filter((token) => /(?:^|:)(?:[a-z]+-)|\[|#|\//i.test(token)).length >= 2 || text.length > 50);
}

function cleanActionMessage(message?: string) {
  const text = (message || "").trim();
  if (!text) return "";

  // Format "Clicked select: Select Category Type Automotive B2B..." -> "Clicked select: Select Category"
  const selectMatch = text.match(/^(Clicked\s+select:\s*)([^\n]+)$/i);
  if (selectMatch) {
    const rawVal = selectMatch[2].trim();
    const shortVal = rawVal.split(/\s{2,}|\t|\n/)[0].slice(0, 35);
    return `${selectMatch[1]}${shortVal}`;
  }

  const match = text.match(/^(Clicked|Typed in)\s+([^:]+):\s+(.+)$/i);
  if (!match) return text;
  return isClassSoup(match[3]) ? `${match[1]} ${match[2]}` : text;
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

function isTracker(url?: string) {
  return isIgnoredUrl(url);
}

// Formats error messages cleanly (e.g. converts "POST\nhttps://..." into structured method + URL badges)
function FormattedErrorMessage({ msg }: { msg: string }) {
  const lines = msg.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length >= 2 && /^(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)$/i.test(lines[0])) {
    const method = lines[0].toUpperCase();
    const url = lines[1];
    return (
      <div className="pl-2.5 border-l-2 border-red-300 dark:border-red-800/50 space-y-1 py-0.5">
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
    <div className="pl-2.5 border-l-2 border-red-200 dark:border-red-800/40 py-0.5">
      <p className="text-[11px] font-mono text-foreground/90 break-words leading-relaxed whitespace-pre-wrap">
        {msg}
      </p>
    </div>
  );
}

export function buildCurlCommand(log: NetworkLog): string {
  const method = (log.method || "GET").toUpperCase();
  const url = log.url || "";
  let cmd = `curl -X ${method} "${url}"`;
  if (log.requestBody) {
    const escaped = log.requestBody.replace(/'/g, "'\\''");
    cmd += ` -H "Content-Type: application/json" -d '${escaped}'`;
  }
  return cmd;
}

export { cleanStackTrace, isFirstPartyUrl };

function FormattedJsonBody({
  content,
  title,
  t,
}: {
  content?: string | null;
  title?: string;
  t: (key: string) => string;
}) {
  const [copied, setCopied] = useState(false);

  if (!content) return null;

  let isJson = false;
  let formatted = content;

  const trimmed = content.trim();
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    try {
      const parsed = JSON.parse(trimmed);
      formatted = JSON.stringify(parsed, null, 2);
      isJson = true;
    } catch {
      // Not valid JSON, keep formatted content
    }
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="space-y-1 mt-1.5">
      <div className="flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-1.5 font-semibold text-muted uppercase tracking-wider">
          <span>{title || "Body"}</span>
          {isJson && (
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40">
              JSON
            </span>
          )}
          <span className="text-[9px] font-mono text-muted lowercase">
            ({content.length > 1024 ? `${(content.length / 1024).toFixed(1)} KB` : `${content.length} B`})
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="px-1.5 py-0.5 rounded text-[10px] text-muted hover:text-foreground bg-subtle hover:bg-subtle/80 border border-border transition-colors flex items-center gap-1 cursor-pointer"
        >
          {copied ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">{t("dt.urlCopied") || "Copied!"}</span>
          ) : (
            <>
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>{t("dt.copy") || "Copy"}</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-2 rounded-lg bg-subtle border border-border font-mono text-[10px] leading-relaxed whitespace-pre-wrap break-all max-h-48 overflow-y-auto select-all">
        {formatted}
      </pre>
    </div>
  );
}

export function buildMarkdownBugReport({
  capture,
  targetHost,
  detectedOs,
  detectedBrowser,
  createdAt,
  consoleErrors,
  networkErrors,
  actionLogs,
  storage,
  findPrecedingAction,
}: {
  capture: Props["capture"];
  targetHost?: string;
  detectedOs: string;
  detectedBrowser: string;
  createdAt: string;
  consoleErrors: ConsoleLog[];
  networkErrors: NetworkLog[];
  actionLogs: (ActionLog | NavigationLog | ScreenshotLog)[];
  storage?: StorageLog["storage"];
  findPrecedingAction: (log: TimedLog, knownIdx?: number) => { message: string; deltaSec: number | null } | null;
}): string {
  const totalIssues = consoleErrors.length + networkErrors.length;
  const sections: string[] = [];

  // Plain headings and no zero-valued lines: a pasted report is read in an issue
  // tracker, where emoji headings and "Failed Network Requests: 0" are noise the
  // reader has to scan past to reach the two lines that matter.
  sections.push(`## Bug Report: ${capture.site_url || "Session Capture"}`);
  sections.push("");
  sections.push("### Environment");
  sections.push(`- **URL**: ${capture.site_url || "-"}`);
  if (targetHost) sections.push(`- **Target Host**: ${targetHost}`);
  sections.push(`- **OS**: ${detectedOs}`);
  sections.push(`- **Browser**: ${detectedBrowser}`);
  if (capture.window_size) sections.push(`- **Window Size**: ${capture.window_size}`);
  sections.push(`- **Captured At**: ${createdAt}`);
  if (capture.drive_url) sections.push(`- **Session Recording**: [View Recording](${capture.drive_url})`);

  if (totalIssues > 0) {
    sections.push("");
    sections.push(`### Issues Overview (${totalIssues} detected)`);
    if (consoleErrors.length > 0) sections.push(`- **Console Errors**: ${consoleErrors.length}`);
    if (networkErrors.length > 0) sections.push(`- **Failed Network Requests**: ${networkErrors.length}`);
  }

  if (consoleErrors.length > 0) {
    sections.push("");
    sections.push("### Console Errors");
    consoleErrors.slice(0, 5).forEach((err, idx) => {
      const msg = conciseConsoleText(err) || "Console error";
      const preceding = findPrecedingAction(err);
      sections.push(`${idx + 1}. \`${msg}\``);
      if (preceding) {
        const delta = preceding.deltaSec != null ? ` (${preceding.deltaSec < 1 ? "<1s" : `${preceding.deltaSec.toFixed(1)}s`} prior)` : "";
        sections.push(`   - ↳ *Triggered after*: ${preceding.message}${delta}`);
      }
      const stack = cleanStackTrace(err.stack);
      if (stack) {
        const topLines = stack.split("\n").slice(0, 4).join("\n");
        sections.push("   ```stack");
        sections.push(`   ${topLines}`);
        sections.push("   ```");
      }
    });
  }

  if (networkErrors.length > 0) {
    sections.push("");
    sections.push("### Failed Network Requests");
    networkErrors.slice(0, 5).forEach((req, idx) => {
      const method = (req.method || "GET").toUpperCase();
      const status = req.status || "FAIL";
      const preceding = findPrecedingAction(req);
      sections.push(`${idx + 1}. **${method} ${status}** \`${req.url || "-"}\``);
      if (preceding) {
        const delta = preceding.deltaSec != null ? ` (${preceding.deltaSec < 1 ? "<1s" : `${preceding.deltaSec.toFixed(1)}s`} prior)` : "";
        sections.push(`   - ↳ *Triggered after*: ${preceding.message}${delta}`);
      }
      sections.push("   ```bash");
      sections.push(`   ${buildCurlCommand(req)}`);
      sections.push("   ```");
    });
  }

  if (actionLogs.length > 0) {
    sections.push("");
    sections.push("### Steps to Reproduce (Recent Actions)");
    const recent = actionLogs.slice(-10);
    let step = 0;
    recent.forEach((act) => {
      const msg = (act.message || ("url" in act && act.url ? `Navigate to ${act.url}` : "")).trim();
      // A step with no target is not reproducible, so it is not a step.
      if (!msg) return;
      sections.push(`${++step}. ${msg}`);
    });
    // Heading AND the blank line before it, or the report grows a stray gap.
    if (step === 0) sections.splice(-2, 2);
  }

  if (storage) {
    const localKeys = Object.keys(storage.localStorage || {});
    const sessionKeys = Object.keys(storage.sessionStorage || {});
    if (localKeys.length > 0 || sessionKeys.length > 0) {
      sections.push("");
      sections.push("### Storage Snapshot");
      if (localKeys.length > 0) {
        sections.push(`- **localStorage** (${localKeys.length} items): \`${localKeys.slice(0, 10).join("`, `")}${localKeys.length > 10 ? "..." : ""}\``);
      }
      if (sessionKeys.length > 0) {
        sections.push(`- **sessionStorage** (${sessionKeys.length} items): \`${sessionKeys.slice(0, 10).join("`, `")}${sessionKeys.length > 10 ? "..." : ""}\``);
      }
    }
  }

  sections.push("");
  sections.push("---");
  sections.push("*Generated via BugSnap DevTools*");

  return sections.join("\n");
}

export function buildHarExport(networkLogs: NetworkLog[], siteUrl?: string | null): string {
  const startedDateTime = new Date().toISOString();
  const entries = networkLogs.map((log, index) => {
    const duration = typeof log.duration === "number" && log.duration > 0 ? log.duration : 50;
    const status = log.status || (log.error ? 0 : 200);
    const statusText = log.statusText || (HTTP_STATUS_TEXT[status] || (status === 0 ? "Failed" : "OK"));
    const reqBody = log.requestBody || "";
    const resBody = log.responseBody || "";

    return {
      _index: index,
      startedDateTime: log.timestamp ? new Date(Number(log.timestamp)).toISOString() : startedDateTime,
      time: duration,
      request: {
        method: (log.method || "GET").toUpperCase(),
        url: log.url || "",
        httpVersion: "HTTP/1.1",
        cookies: [],
        headers: reqBody ? [{ name: "Content-Type", value: "application/json" }] : [],
        queryString: [],
        postData: reqBody ? { mimeType: "application/json", text: reqBody } : undefined,
        headersSize: -1,
        bodySize: reqBody ? reqBody.length : 0,
      },
      response: {
        status,
        statusText,
        httpVersion: "HTTP/1.1",
        cookies: [],
        headers: resBody ? [{ name: "Content-Type", value: "application/json" }] : [],
        content: {
          size: resBody ? resBody.length : 0,
          mimeType: "application/json",
          text: resBody,
        },
        redirectURL: "",
        headersSize: -1,
        bodySize: resBody ? resBody.length : 0,
      },
      cache: {},
      timings: {
        blocked: -1,
        dns: -1,
        connect: -1,
        send: 0,
        wait: duration,
        receive: 0,
        ssl: -1,
      },
    };
  });

  const har = {
    log: {
      version: "1.2",
      creator: {
        name: "BugSnap DevTools",
        version: "1.0.0",
      },
      pages: [
        {
          startedDateTime,
          id: "page_1",
          title: siteUrl || "BugSnap Session",
          pageTimings: {
            onContentLoad: -1,
            onLoad: -1,
          },
        },
      ],
      entries,
    },
  };

  return JSON.stringify(har, null, 2);
}

// Zero rows has two causes that used to print the same sentence: the capture
// holds nothing, or a filter hid everything. The second needs a way out, so it
// gets the reason and a reset button instead of a dead end.
function EmptyLogState({
  filtered,
  emptyText,
  onReset,
  t,
}: {
  filtered: boolean;
  emptyText: string;
  onReset: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  if (!filtered) {
    return <div className="py-14 text-center text-xs text-muted">{emptyText}</div>;
  }
  return (
    <div className="py-14 flex flex-col items-center gap-2 text-center text-xs text-muted px-4">
      <svg className="w-7 h-7 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <p>{t("dt.noMatches") || "No rows match the current filters"}</p>
      <button
        type="button"
        onClick={onReset}
        className="mt-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-subtle border border-border text-foreground hover:bg-subtle/70 transition-colors"
      >
        {t("dt.resetFilters") || "Reset filters"}
      </button>
    </div>
  );
}

function ActionBreadcrumb({
  action,
  t,
}: {
  action: { message: string; deltaSec: number | null };
  t: (key: string) => string;
}) {
  return (
    /* Wraps rather than truncates: the action label is the whole point of the
       breadcrumb, and `Clicked button: "Re...` identifies nothing. */
    <div className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-[10px] text-zinc-600 dark:text-zinc-400 bg-amber-500/10 dark:bg-amber-500/15 px-2 py-1 rounded-md border border-amber-500/20 dark:border-amber-500/30 font-sans">
      <span className="text-amber-600 dark:text-amber-400 font-semibold shrink-0">
        ↳ {t("dt.triggeredAfter") || "Triggered after"}:
      </span>
      <span className="font-medium text-foreground break-words min-w-0">
        {action.message}
      </span>
      {action.deltaSec != null && (
        <span className="text-[9px] font-mono text-muted shrink-0 tabular-nums">
          ({action.deltaSec < 1 ? "<1s" : `${action.deltaSec.toFixed(1)}s`} {t("dt.prior") || "prior"})
        </span>
      )}
    </div>
  );
}

export default function DevToolsPanel({ capture, currentTime, onSeekToTime }: Props) {
  const { t } = useT();
  const [activeTab, setActiveTab] = useState<Tab>("Info");
  const [consoleErrorsOnly, setConsoleErrorsOnly] = useState(false);
  const [networkFailedOnly, setNetworkFailedOnly] = useState(false);
  const [networkPartyFilter, setNetworkPartyFilter] = useState<"all" | "1st" | "3rd">("all");
  // Actions was the only list tab with no chips - just the shared search box.
  const [actionKindFilter, setActionKindFilter] = useState<string>("all");
  const [logSearch, setLogSearch] = useState("");
  const resetLogFilters = () => {
    setLogSearch("");
    setConsoleErrorsOnly(false);
    setNetworkFailedOnly(false);
    setNetworkPartyFilter("all");
    setActionKindFilter("all");
  };
  const [decompressedLogs, setDecompressedLogs] = useState<CapturedLogs>(capture.dev_logs || null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [copiedCurl, setCopiedCurl] = useState<string | null>(null);
  const [copiedConsole, setCopiedConsole] = useState<string | null>(null);

  const handleCopyUrl = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch {}
  };

  // Network rows already had copy-URL and copy-curl; a console error had none, so
  // pasting one into a ticket meant hand-selecting message and stack separately.
  const handleCopyConsole = (log: ConsoleLog | NavigationLog | ScreenshotLog, e: React.MouseEvent) => {
    e.stopPropagation();
    const body = log.type === "console" ? consoleText(log) : log.message || ("url" in log ? log.url || "" : "");
    const stack = log.type === "console" ? cleanStackTrace(log.stack) : "";
    try {
      navigator.clipboard.writeText(stack ? `${body}

${stack}` : body);
      setCopiedConsole(body);
      setTimeout(() => setCopiedConsole(null), 2000);
    } catch {}
  };

  const handleCopyCurl = (log: NetworkLog, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const curl = buildCurlCommand(log);
      navigator.clipboard.writeText(curl);
      setCopiedCurl(log.url || "");
      setTimeout(() => setCopiedCurl(null), 2000);
    } catch {}
  };

  useEffect(() => {
    // Switching captures while a slow Drive fetch is in flight used to let the
    // old capture's logs land in the new capture's panel. Ignore any resolution
    // that arrives after this effect has been superseded.
    let cancelled = false;
    let raw: unknown = capture.dev_logs;
    if (typeof raw === "string" && (raw.startsWith("{") || raw.startsWith("["))) {
      try {
        raw = JSON.parse(raw);
      } catch {
        // Leave raw string as is if not valid JSON
      }
    }

    if (raw && typeof raw === "object" && "driveFileId" in raw && typeof (raw as DriveExternalLogReference).driveFileId === "string") {
      const fileId = (raw as DriveExternalLogReference).driveFileId;
      // Bearer token when signed in: the stream route needs it for members-only
      // captures. Public ones ignore it, so sending it unconditionally is fine.
      supabase.auth
        .getSession()
        .then(({ data }) => {
          const token = data.session?.access_token;
          return fetch(`/api/google-drive/download?id=${encodeURIComponent(fileId)}&type=logs`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
        })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((fullLogs) => {
          if (cancelled) return;
          if (Array.isArray(fullLogs)) {
            setDecompressedLogs(fullLogs as CapturedLogs);
          }
        })
        .catch((err) => {
          if (cancelled) return;
          console.warn("Could not load external logs from Google Drive:", err);
          // The bare Drive reference has no `version`, so isSummary() rejects it
          // and the panel renders empty. Surface the counts it does carry.
          const ref = raw as DriveExternalLogReference;
          setDecompressedLogs({
            version: 1,
            errors: ref.errors || 0,
            warnings: ref.warnings || 0,
            failedRequests: 0,
          } satisfies DevLogSummary);
        });
      return;
    }

    if (typeof capture.dev_logs === "string" && capture.dev_logs.startsWith("gz:")) {
      decompressDevLogs(capture.dev_logs).then((res) => {
        if (!cancelled && res) setDecompressedLogs(res as CapturedLogs);
      });
    } else {
      setDecompressedLogs(capture.dev_logs || null);
    }

    return () => {
      cancelled = true;
    };
  }, [capture.dev_logs]);

  const effectiveDevLogs = decompressedLogs;
  const summaryOnly = !Array.isArray(effectiveDevLogs) && isSummary(effectiveDevLogs);
  // Must be memoized: a fresh array identity here invalidates every downstream
  // useMemo that lists `logs` as a dependency, which is all of them. Without
  // this, one keystroke in the log search re-normalizes and re-groups the whole
  // 500-entry ring.
  const logs: DevLog[] = useMemo(
    () =>
      Array.isArray(effectiveDevLogs)
        ? (effectiveDevLogs as unknown[]).map((log) => normalizeDevLog((log || {}) as Record<string, unknown>))
        : [],
    [effectiveDevLogs]
  );
  const summary = summaryOnly ? (effectiveDevLogs as DevLogSummary) : null;

  const earliestTimestamp = useMemo(
    () =>
      logs.reduce<number>((min, log) => {
        const raw = log.timestamp;
        const ts =
          typeof raw === "number"
            ? raw
            : typeof raw === "string" && !/^\d{1,2}:\d{2}$/.test(raw)
              ? new Date(raw).getTime()
              : 0;
        return Number.isFinite(ts) && ts > 0 && (min === 0 || ts < min) ? ts : min;
      }, 0),
    [logs]
  );

  // Both are dependencies of the memos below, so they need stable identities of
  // their own or those memos never hit cache.
  const getRelativeTime = useCallback((log: TimedLog) => {
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
  }, [capture.type, earliestTimestamp]);

  const getLogSeconds = useCallback((log: TimedLog): number | null => {
    const value = log.time || log.timestamp;
    if (!value) return null;
    if (typeof value === "string") {
      const match = value.match(/^(\d{1,2}):(\d{2})$/);
      if (match) {
        return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
      }
    }
    const ts = typeof value === "number" ? value : new Date(value).getTime();
    if (Number.isFinite(ts) && earliestTimestamp > 0 && ts >= earliestTimestamp) {
      return (ts - earliestTimestamp) / 1000;
    }
    return null;
  }, [earliestTimestamp]);

  const targetHost = useMemo(() => {
    if (capture.site_url) return getTargetHost(capture.site_url);
    const firstNav = logs.find((l): l is NavigationLog => l.type === "navigation");
    if (firstNav?.url) return getTargetHost(firstNav.url);
    return "";
  }, [capture.site_url, logs]);

  // Every action/navigation index, ascending, built once per capture. The
  // timestamp fallback below scanned and sorted the whole log for each rendered
  // error row - O(n log n) per row over a 500-entry ring.
  const actionIndex = useMemo(() => {
    const out: { idx: number; sec: number | null; log: ActionLog | NavigationLog }[] = [];
    logs.forEach((l, idx) => {
      if (l.type === "step" || l.type === "navigation") out.push({ idx, sec: getLogSeconds(l), log: l });
    });
    return out;
  }, [logs, getLogSeconds]);

  const findPrecedingAction = useCallback(
    (errLog: TimedLog, knownIdx?: number) => {
      const errSec = getLogSeconds(errLog);
      // indexOf is reference-based, but actionLogs and groupedNetworkLogs both
      // hand out spread copies - it returned -1 for every row from those lists
      // and silently fell through to the slow path. Callers that know their own
      // position pass it in; the lookup stays as a fallback for those that don't.
      const errIdx = knownIdx ?? logs.indexOf(errLog as DevLog);

      if (errIdx > 0) {
        for (let i = errIdx - 1; i >= 0; i--) {
          const item = logs[i];
          if (item.type === "step" || item.type === "navigation") {
            const itemSec = getLogSeconds(item);
            const deltaSec = errSec != null && itemSec != null ? Math.max(0, errSec - itemSec) : null;
            const message = cleanActionMessage(item.message || ("url" in item ? `Navigated to ${item.url}` : ""));
            if (message) {
              return { message, deltaSec };
            }
          }
        }
      }

      if (errSec !== null) {
        // actionIndex is already in log order; walk back for the latest action
        // at or before the error instead of re-filtering and sorting.
        let best: { sec: number | null; log: ActionLog | NavigationLog } | null = null;
        for (let i = actionIndex.length - 1; i >= 0; i--) {
          const cand = actionIndex[i];
          if (cand.sec !== null && cand.sec <= errSec) {
            if (best === null || (cand.sec as number) > (best.sec as number)) best = cand;
          }
        }

        if (best) {
          const deltaSec = errSec - (best.sec as number);
          if (deltaSec <= 30) {
            const message = cleanActionMessage(best.log.message || ("url" in best.log ? `Navigated to ${best.log.url}` : ""));
            if (message) {
              return { message, deltaSec };
            }
          }
        }
      }

      return null;
    },
    [logs, getLogSeconds, actionIndex]
  );

  const isLogActive = (log: TimedLog) => {
    if (currentTime === undefined || capture.type !== "video") return false;
    const sec = getLogSeconds(log);
    if (sec === null) return false;
    return Math.abs(currentTime - sec) < 1.5;
  };

  // The time badge was the only way to jump the video, and nobody finds a 10px
  // pill. Whole row is the target now; the badge stays as the visible affordance.
  const seekProps = (log: TimedLog) => {
    const sec = getLogSeconds(log);
    if (!onSeekToTime || sec === null || capture.type !== "video") return {};
    const jump = () => onSeekToTime(sec);
    return {
      onClick: jump,
      // A div is not focusable or Enter-activatable on its own, and this is the
      // primary way to navigate the capture - it has to reach the keyboard.
      role: "button" as const,
      tabIndex: 0,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          jump();
        }
      },
      title: t("dt.jumpVideoTo", { time: getRelativeTime(log) }),
      className: "cursor-pointer",
    };
  };

  const renderTimeBadge = (log: TimedLog) => {
    const relTime = getRelativeTime(log);
    if (relTime === "-") return null;
    const sec = getLogSeconds(log);

    if (onSeekToTime && sec !== null && capture.type === "video") {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSeekToTime(sec);
          }}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-100 hover:bg-indigo-100 text-muted hover:text-indigo-600 dark:bg-zinc-800 dark:hover:bg-indigo-900/60 dark:hover:text-indigo-300 border border-border/80 transition-colors cursor-pointer shrink-0"
          title={t("dt.jumpVideoTo", { time: relTime })}
        >
          <span className="text-[8px] text-indigo-500">▶</span>
          <span>{relTime}</span>
        </button>
      );
    }

    return (
      <span className="pt-0.5 text-[10px] font-mono text-muted shrink-0 tabular-nums">
        {relTime}
      </span>
    );
  };

  // all* is tracker-filtered but not search-filtered. Tracker rows are noise that
  // is never wanted; the search query is a view the tab badges must not follow.
  //
  // Every one of these used to recompute on each render - which meant on every
  // search keystroke AND every currentTime tick from the video player, for a
  // list that can hold 500 entries. The memo deps are the only real inputs.
  const matchesSearch = useCallback(
    (text: string) => !logSearch || text.toLowerCase().includes(logSearch.toLowerCase()),
    [logSearch]
  );

  const allNetworkLogs = useMemo(
    () =>
      logs
        .map((l, srcIdx) => (l.type === "network" ? { ...l, srcIdx } : null))
        .filter((l): l is NetworkLog & { srcIdx: number } => l !== null && !isTracker(l.url)),
    [logs]
  );
  const networkLogs = useMemo(
    () => allNetworkLogs.filter((l) => matchesSearch(l.url || "")),
    [allNetworkLogs, matchesSearch]
  );

  const eventTime = (log: TimedLog) => log.time || log.timestamp || "";

  const allConsoleLogs = useMemo<(ConsoleLog | NavigationLog | ScreenshotLog)[]>(
    () =>
      logs
        .map((log, srcIdx) => ({ log, srcIdx }))
        .filter((e): e is { log: ConsoleLog | NavigationLog | ScreenshotLog; srcIdx: number } =>
          e.log.type === "console" || e.log.type === "navigation" || e.log.type === "screenshot")
        .filter(({ log }) => !isTracker(consoleDetail(log)) && !("url" in log && isTracker(log.url)))
        .map(({ log, srcIdx }) => ({ ...log, srcIdx })),
    [logs]
  );
  const consoleLogs = useMemo(
    () => allConsoleLogs.filter((log) => matchesSearch(consoleDetail(log))),
    [allConsoleLogs, matchesSearch]
  );

  const allActionLogs = useMemo(
    () =>
      logs
        .map((log, srcIdx) => ({ log, srcIdx }))
        .filter((e): e is { log: ActionLog | NavigationLog | ScreenshotLog; srcIdx: number } =>
          e.log.type === "step" || e.log.type === "navigation" || e.log.type === "screenshot")
        .map(({ log, srcIdx }) => ({ ...log, srcIdx, message: cleanActionMessage(log.message) })),
    [logs]
  );
  const actionLogs = useMemo(
    () =>
      allActionLogs
        .filter((l) => actionKindFilter === "all" || actionKind(l) === actionKindFilter)
        .filter((l) => matchesSearch(`${l.message || ""} ${"url" in l ? l.url || "" : ""}`)),
    [allActionLogs, matchesSearch, actionKindFilter]
  );

  // Only offer a chip for a kind the capture contains - a zero chip is a dead
  // control. Counted before the search filter, like the tab badges.
  const actionKindCounts = useMemo(() => {
    const counts = new Map<string, number>();
    allActionLogs.forEach((l) => {
      const k = actionKind(l);
      if (k) counts.set(k, (counts.get(k) || 0) + 1);
    });
    return counts;
  }, [allActionLogs]);

  const groupedNetworkLogs = useMemo(
    () =>
      groupBy(
        networkLogs,
        (log) => `${(log.method || "GET").toUpperCase()}\u0000${log.status ?? "FAILED"}\u0000${canonicalUrl(log.url)}`,
        (log) => ({ ...log, url: canonicalUrl(log.url) })  // srcIdx rides along in the spread
      ),
    [networkLogs]
  );

  const consoleErrors = useMemo(
    () => consoleLogs.filter((l): l is ConsoleLog => l.type === "console" && isConsoleError(l)),
    [consoleLogs]
  );
  const networkErrors = useMemo(() => networkLogs.filter(isNetworkFailed), [networkLogs]);
  const totalIssuesCount = summary
    ? (summary.errors || 0) + (summary.failedRequests || 0)
    : consoleErrors.length + networkErrors.length;

  type IssueItem = {
    id: string;
    type: "console" | "network";
    log: ConsoleLog | NetworkLog;
  };

  const issueItems: IssueItem[] = useMemo(
    () => [
      ...consoleErrors.map((log, i) => ({ id: `err_c_${i}`, type: "console" as const, log })),
      ...networkErrors.map((log, i) => ({ id: `err_n_${i}`, type: "network" as const, log })),
    ],
    [consoleErrors, networkErrors]
  );

  const visibleConsoleLogs = useMemo(
    () => (consoleErrorsOnly ? consoleLogs.filter((l) => l.type === "console" && isConsoleError(l)) : consoleLogs),
    [consoleLogs, consoleErrorsOnly]
  );

  const visibleGroupedNetworkLogs = useMemo(
    () =>
      groupedNetworkLogs
        .filter(({ log }) => !networkFailedOnly || isNetworkFailed(log))
        .filter(({ log }) => {
          if (networkPartyFilter === "all" || !targetHost) return true;
          const is1st = isFirstPartyUrl(log.url, targetHost);
          return networkPartyFilter === "1st" ? is1st : !is1st;
        }),
    [groupedNetworkLogs, networkFailedOnly, networkPartyFilter, targetHost]
  );

  const firstPartyCount = useMemo(
    () => (targetHost ? networkLogs.filter((l) => isFirstPartyUrl(l.url, targetHost)).length : 0),
    [networkLogs, targetHost]
  );
  const thirdPartyCount = useMemo(
    () => (targetHost ? networkLogs.filter((l) => !isFirstPartyUrl(l.url, targetHost)).length : 0),
    [networkLogs, targetHost]
  );
  // A per-row 1ST/3RD badge only informs when the capture actually mixes the two.
  // When every request is one party the badge is 96 identical stamps of noise -
  // and it reads as wrong on sibling subdomains (dev-fe -> dev-be is stamped 3RD).
  const partyIsMixed = firstPartyCount > 0 && thirdPartyCount > 0;

  const performanceLog = logs.findLast((l): l is PerformanceLog => l.type === "performance");
  const metrics = performanceLog?.metrics;

  const storageLog = logs.findLast((l): l is StorageLog => l.type === "storage");
  const storageData = storageLog?.storage;
  const [storageType, setStorageType] = useState<"local" | "session">("local");
  const [copiedStorageKey, setCopiedStorageKey] = useState<string | null>(null);
  const [copiedAllStorage, setCopiedAllStorage] = useState(false);
  const [copiedBugReport, setCopiedBugReport] = useState(false);

  // <details> closes itself on the summary, but not on a click elsewhere. One
  // capture-phase listener flips `open` back off; no state, so no re-render.
  const eventMenuRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (e: Event) => {
      const el = eventMenuRef.current;
      if (el?.open && !el.contains(e.target as Node)) el.open = false;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && eventMenuRef.current?.open) eventMenuRef.current.open = false;
    };
    document.addEventListener("pointerdown", close, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", close, true);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const [timeZoneMode, setTimeZoneMode] = useState<"capture" | "local" | "utc">("capture");
  const [showTzMenu, setShowTzMenu] = useState(false);
  const tzMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (tzMenuRef.current && !tzMenuRef.current.contains(e.target as Node)) {
        setShowTzMenu(false);
      }
    }
    if (showTzMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showTzMenu]);

  // Formats date according to selected timezone mode
  const formatDateWithTz = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";

    if (timeZoneMode === "utc") {
      return d.toLocaleString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        timeZone: "UTC",
        timeZoneName: "short",
      });
    }

    if (timeZoneMode === "capture") {
      // Indonesia / Default capture timezone or standard capture locale
      return d.toLocaleString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        timeZone: "Asia/Jakarta",
        timeZoneName: "short",
      });
    }

    // "local" mode uses viewer's local browser timezone
    return d.toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      timeZoneName: "short",
    });
  };

  const createdAt = formatDateWithTz(capture.created_at);

  const legacyLogsText = JSON.stringify(capture.dev_logs || []);
  const detectedOs = capture.os || (legacyLogsText.toLowerCase().includes("macintosh") || legacyLogsText.toLowerCase().includes("mac os") ? "macOS" : "Windows");
  const detectedBrowser = capture.browser || "Chrome";

  const handleCopyBugReport = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const report = buildMarkdownBugReport({
        capture,
        targetHost,
        detectedOs,
        detectedBrowser,
        createdAt,
        consoleErrors,
        networkErrors,
        actionLogs,
        storage: storageData,
        findPrecedingAction,
      });
      navigator.clipboard.writeText(report);
      setCopiedBugReport(true);
      setTimeout(() => setCopiedBugReport(false), 2000);
    } catch (err) {
      console.error("Failed to copy bug report:", err);
    }
  };

  const handleExportHar = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const harContent = buildHarExport(networkLogs, capture.site_url);
      const blob = new Blob([harContent], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const host = targetHost ? targetHost.replace(/[^a-z0-9]/gi, "_") : "session";
      a.href = url;
      a.download = `bugsnap-${host}-${Date.now()}.har`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export HAR:", err);
    }
  };

  // Name and count are separate so the count can render as a compact pill: six
  // tabs with "(96)" inline overflowed the panel width and forced a scrollbar.
  // Counted from the unfiltered logs: these badges are the shape of the capture,
  // not of the current query. Reading consoleLogs/networkLogs here meant typing
  // in Console also shrank the Network and Actions badges, while Storage - which
  // is filtered elsewhere - never shrank at all.
  const tabCount = (tab: Tab): number => {
    if (tab === "Issues") return totalIssuesCount;
    if (tab === "Console") return totalLogCount(allConsoleLogs);
    if (tab === "Network") return totalLogCount(allNetworkLogs);
    if (tab === "Actions") return totalLogCount(allActionLogs);
    if (tab === "Storage") return Object.keys(storageData?.localStorage || {}).length + Object.keys(storageData?.sessionStorage || {}).length;
    return 0;
  };

  // Arrow/Home/End roving focus. Focusing the next button is enough - each one
  // selects on click and the list is short, so no separate selection model.
  const onTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    let next: Tab | null = null;
    if (delta !== 0) {
      const i = TABS.indexOf(activeTab);
      next = TABS[(i + delta + TABS.length) % TABS.length];
    } else if (e.key === "Home") next = TABS[0];
    else if (e.key === "End") next = TABS[TABS.length - 1];
    if (!next) return;
    e.preventDefault();
    setLogSearch("");
    setActiveTab(next);
    document.getElementById(`dt-tab-${next}`)?.focus();
  };

  const tabName = (tab: Tab) => {
    if (tab === "Issues") return t("dt.issues") || "Issues";
    if (tab === "Storage") return t("dt.storage") || "Storage";
    return t(`dt.${tab.toLowerCase()}`);
  };

  // Header pill: the same total it always showed, plus the per-kind split behind it.
  const eventBreakdown = (() => {
    const rows = summary
      ? [
          { key: "errors", label: t("dt.errors") || "Errors", n: summary.errors || 0 },
          { key: "warnings", label: t("dt.warnings") || "Warnings", n: summary.warnings || 0 },
          { key: "failed", label: t("dt.failedReq") || "Failed requests", n: summary.failedRequests || 0 },
        ]
      : [
          { key: "errors", label: t("dt.errors") || "Errors", n: consoleErrors.length },
          { key: "failed", label: t("dt.failedReq") || "Failed requests", n: networkErrors.length },
          { key: "console", label: tabName("Console"), n: totalLogCount(consoleLogs) },
          { key: "network", label: tabName("Network"), n: totalLogCount(networkLogs) },
          { key: "actions", label: tabName("Actions"), n: totalLogCount(actionLogs) },
        ];
    const total = summary
      ? rows.reduce((sum, r) => sum + r.n, 0)
      : totalLogCount(consoleLogs) + totalLogCount(networkLogs) + totalLogCount(actionLogs);
    const label = summary && total === 0 ? t("dt.clean", { n: 0 }) : t("dt.events", { n: total });
    return { label, rows };
  })();

  // Search placeholder still wants one string.
  const tabLabel = (tab: Tab) => {
    const n = tabCount(tab);
    return n > 0 ? `${tabName(tab)} (${n})` : tabName(tab);
  };

  // Typing in the search box silently changes the list length. Announce the new
  // count, or a screen-reader user gets no feedback that the query did anything.
  // Storage filters its rows inside its own render block, so it is left out.
  const searchMatchCount = (): number | null => {
    if (activeTab === "Console") return visibleConsoleLogs.length;
    if (activeTab === "Network") return visibleGroupedNetworkLogs.length;
    if (activeTab === "Actions") return actionLogs.length;
    return null;
  };

  return (
    // Was a hard 520px: cramped on a short laptop, wasteful on a tall monitor.
    // clamp() is a one-value fix and needs no resize listener.
    <div className="w-full h-[clamp(360px,60vh,760px)] rounded-xl border border-border bg-white shadow-sm dark:bg-background flex flex-col shrink-0 overflow-hidden">
      {/* Header */}
      <div className="h-11 border-b border-border px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-foreground">{t("v.devTools")}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* <details> instead of a bare pill: the number alone never said what it
              counted. Native disclosure - no state, no outside-click handler. */}
          <details ref={eventMenuRef} className="relative group">
            <summary className="list-none cursor-pointer flex items-center gap-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors">
              <span className="tabular-nums">{eventBreakdown.label}</span>
              <svg className="w-2.5 h-2.5 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </summary>
            <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-lg border border-border bg-white dark:bg-background shadow-lg p-1">
              {eventBreakdown.rows.map(({ key, label, n }) => (
                <div key={key} className="flex items-center justify-between gap-2 px-2 py-1 rounded text-[10px]">
                  <span className="text-muted truncate">{label}</span>
                  <span className={`font-semibold tabular-nums shrink-0 ${n > 0 && (key === "errors" || key === "failed") ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>{n}</span>
                </div>
              ))}
            </div>
          </details>
        </div>
      </div>

      {/* Tabs */}
      {/* A real tablist, not aria-current="page" (that is a nav idiom): screen
          readers now announce "tab 3 of 6" and arrow keys move between tabs. */}
      <div
        role="tablist"
        aria-label={t("dt.title") || "DevTools"}
        onKeyDown={onTabKeyDown}
        className="flex border-b border-border shrink-0 px-2.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {TABS.map((tab) => {
          const isIssues = tab === "Issues";
          const hasIssues = isIssues && totalIssuesCount > 0;
          const count = tabCount(tab);
          return (
            <button
              key={tab}
              onClick={() => {
                // One search box serves every tab. Carrying the query across a tab
                // switch showed an empty list with no visible reason - it reads as
                // lost data, not as an active filter.
                if (tab !== activeTab) setLogSearch("");
                setActiveTab(tab);
              }}
              role="tab"
              id={`dt-tab-${tab}`}
              aria-controls="dt-tabpanel"
              aria-selected={activeTab === tab}
              // Only the selected tab is tabbable; arrows move within the set.
              tabIndex={activeTab === tab ? 0 : -1}
              className={`px-2 py-2 text-[11px] font-medium relative transition-colors whitespace-nowrap flex items-center gap-1 ${
                activeTab === tab
                  ? isIssues && hasIssues
                    ? "text-red-600 dark:text-red-400 font-semibold"
                    : "text-indigo-600 font-semibold"
                  : isIssues && hasIssues
                  ? "text-red-600/90 dark:text-red-400/90 hover:text-red-700 font-medium"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {tabName(tab)}
              {count > 0 && (
                <span className={`px-1 py-px rounded text-[9px] font-semibold leading-none tabular-nums ${
                  isIssues
                    ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                    : activeTab === tab
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                    : "bg-subtle text-muted"
                }`}>{count}</span>
              )}
              {isIssues && hasIssues && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              )}
              {activeTab === tab && (
                <span
                  className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${
                    isIssues && hasIssues ? "bg-red-600" : "bg-indigo-600"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div
        role="tabpanel"
        id="dt-tabpanel"
        aria-labelledby={`dt-tab-${activeTab}`}
        className="flex-1 min-h-0 flex flex-col overflow-hidden"
      >
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
                className="w-full pl-8 pr-8 py-1.5 rounded-lg border border-border text-xs bg-subtle outline-none focus:border-indigo-500 shadow-sm"
              />
              {logSearch && (
                <button
                  type="button"
                  onClick={() => setLogSearch("")}
                  aria-label={t("dt.clearSearch") || "Clear search"}
                  title={t("dt.clearSearch") || "Clear search"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
              <span role="status" aria-live="polite" className="sr-only">
                {logSearch && searchMatchCount() !== null
                  ? t("dt.searchResults", { n: searchMatchCount() as number })
                  : ""}
              </span>
            </div>
            {/* Quick Filter for Console */}
            {activeTab === "Console" && consoleErrors.length > 0 && (
              <div className="flex items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setConsoleErrorsOnly(false)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
                    !consoleErrorsOnly
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/40 font-semibold"
                      : "text-muted hover:text-foreground border border-transparent"
                  }`}
                >
                  {t("dt.all") || "All"} ({consoleLogs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setConsoleErrorsOnly(true)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors flex items-center gap-1 ${
                    consoleErrorsOnly
                      ? "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/40 font-semibold"
                      : "text-red-600/80 hover:text-red-700 border border-transparent"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {t("dt.errorsOnly") || "Errors Only"} ({consoleErrors.length})
                </button>
              </div>
            )}
            {/* Quick Filter for Actions */}
            {activeTab === "Actions" && actionKindCounts.size > 1 && (
              <div
                role="group"
                aria-label={t("dt.actionKindFilter")}
                className="flex flex-wrap items-center gap-1.5 pt-0.5"
              >
                {(["all", "click", "typing", "input", "navigation", "screenshot"] as const)
                  .filter((k) => k === "all" || actionKindCounts.has(k))
                  .map((k) => {
                    const on = actionKindFilter === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setActionKindFilter(k)}
                        aria-pressed={on}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${
                          on
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/40 font-semibold"
                            : "text-muted hover:text-foreground border border-transparent"
                        }`}
                      >
                        {k === "all"
                          ? `${t("dt.allOrigins") || "All"} (${allActionLogs.length})`
                          : `${t(`dt.act.${k}`)} (${actionKindCounts.get(k)})`}
                      </button>
                    );
                  })}
              </div>
            )}
            {/* Quick Filter for Network */}
            {activeTab === "Network" && (
              <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5">
                <div className="flex items-center gap-1.5">
                  {/* No "All" chip: its count is the ungrouped total, which disagreed with
                      the tab and search counts (they sum repeat requests), and "off" is
                      already expressible by unpressing Failed Requests. */}
                  {networkErrors.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setNetworkFailedOnly(!networkFailedOnly)}
                      aria-pressed={networkFailedOnly}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors flex items-center gap-1 ${
                        networkFailedOnly
                          ? "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/40 font-semibold"
                          : "text-red-600/80 hover:text-red-700 border border-transparent"
                      }`}
                      title={networkFailedOnly ? t("dt.showAllRequests") : t("dt.showOnlyFailed")}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      {t("dt.failedReq") || "Failed Requests"} ({networkErrors.length})
                    </button>
                  )}
                  {targetHost && networkErrors.length > 0 && (
                    /* Status and origin are independent filters; the rule marks the
                       boundary. Pointless when there is no status chip to separate. */
                    <span className="w-px h-3.5 bg-border mx-0.5" aria-hidden="true" />
                  )}
                  {targetHost && (
                    <>
                      <button
                        type="button"
                        onClick={() => setNetworkPartyFilter("all")}
                        aria-pressed={networkPartyFilter === "all"}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
                          networkPartyFilter === "all"
                            ? "bg-subtle text-foreground border border-border font-semibold"
                            : "text-muted hover:text-foreground border border-transparent"
                        }`}
                      >
                        {t("dt.allOrigins") || "All Origins"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setNetworkPartyFilter("1st")}
                        aria-pressed={networkPartyFilter === "1st"}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors flex items-center gap-1 ${
                          networkPartyFilter === "1st"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40 font-semibold"
                            : "text-muted hover:text-emerald-600 border border-transparent"
                        }`}
                        title={`Requests to ${targetHost} or subdomains`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {t("dt.firstParty") || "1st-Party"} ({firstPartyCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setNetworkPartyFilter("3rd")}
                        aria-pressed={networkPartyFilter === "3rd"}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
                          networkPartyFilter === "3rd"
                            ? "bg-subtle text-foreground border border-border font-semibold"
                            : "text-muted hover:text-foreground border border-transparent"
                        }`}
                        title="External SaaS, CDNs, 3rd-party APIs"
                      >
                        {t("dt.thirdParty") || "3rd-Party"} ({thirdPartyCount})
                      </button>
                    </>
                  )}
                </div>

                {networkLogs.length > 0 && (
                  <button
                    type="button"
                    onClick={handleExportHar}
                    className="px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors bg-subtle hover:bg-subtle/80 text-muted hover:text-foreground border border-border flex items-center gap-1 cursor-pointer ml-auto"
                    title={t("dt.exportHar") || "Export network session as HTTP Archive (.har)"}
                  >
                    <svg className="w-3 h-3 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>{t("dt.exportHar") || "Export HAR"}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ISSUES TAB */}
        {activeTab === "Issues" && (
          <div className="flex-1 min-h-0 overflow-y-auto">
            {totalIssuesCount === 0 ? (
              <div className="py-14 flex flex-col items-center gap-2 text-center text-xs text-muted p-4">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm mt-1">{t("dt.pageRanClean")}</p>
                <p className="text-xs text-muted max-w-sm">No console errors or failed network requests were detected during this capture session.</p>
              </div>
            ) : summary ? (
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/80 dark:border-red-800/40 px-3.5 py-2.5 shadow-sm">
                  <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 flex items-center justify-center shrink-0 text-red-600 dark:text-red-400 text-xs font-bold">
                    {totalIssuesCount}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-red-800 dark:text-red-300 leading-tight">
                      {t("dt.issuesDetected", { n: totalIssuesCount })}
                    </p>
                    <p className="text-[10px] text-red-700/80 dark:text-red-400/80 mt-0.5">
                      {t("dt.issueSplit", { errors: summary.errors, failed: summary.failedRequests })}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  {(summary.topErrors || []).filter((msg) => !isIgnoredUrl(msg)).map((msg, i) => (
                    <FormattedErrorMessage key={`se_${i}`} msg={msg} />
                  ))}
                  {(summary.failedUrls || []).filter((url) => !isIgnoredUrl(url)).map((url, i) => (
                    <div key={`su_${i}`} className="pl-2.5 border-l-2 border-red-300 dark:border-red-800/40 py-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-red-600 bg-red-50 dark:bg-red-950/30 px-1 py-0.2 rounded border border-red-200 dark:border-red-800/40 mr-1.5">FAIL</span>
                      <span className="text-[11px] font-mono text-red-700 dark:text-red-400 break-all">{url}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 space-y-2.5">
                {/* Issues Stat Banner */}
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/30 text-xs text-red-800 dark:text-red-300">
                  <span className="font-semibold flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {t("dt.issuesDetected", { n: totalIssuesCount })}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] font-medium text-red-700 dark:text-red-400">
                    <span>{consoleErrors.length} console</span>
                    <span>•</span>
                    <span>{networkErrors.length} network</span>
                  </div>
                </div>

                <div className="divide-y divide-border/60 border border-border rounded-lg overflow-hidden bg-background">
                  {issueItems.map(({ id, type, log }) => {
                    const active = isLogActive(log);
                    if (type === "console") {
                      const cLog = log as ConsoleLog;
                      const detail = conciseConsoleText(cLog) || t("dt.consoleError");
                      const fullText = consoleText(cLog);
                      const preceding = findPrecedingAction(cLog, cLog.srcIdx);
                      return (
                        <div
                          key={id}
                          className={`p-3 text-xs transition-all ${
                            active ? "ring-2 ring-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40" : "bg-red-50/30 dark:bg-red-950/10 hover:bg-red-50/60 dark:hover:bg-red-950/20"
                          }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            {renderTimeBadge(cLog)}
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase shrink-0 bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/40">
                              CONSOLE
                            </span>
                            <div className="min-w-0 flex-1">
                              <FormattedErrorMessage msg={fullText || detail} />
                              {preceding && <ActionBreadcrumb action={preceding} t={t} />}
                              {cleanStackTrace(cLog.stack) ? (
                                <details className="group mt-2">
                                  <summary className="flex list-none cursor-pointer items-center gap-1 text-[10px] font-semibold text-muted hover:text-foreground">
                                    <svg className="w-3 h-3 transition-transform group-open:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                                    {t("dt.stack")}
                                  </summary>
                                  <pre className="mt-1.5 p-2 rounded-lg bg-red-950 text-red-200 font-mono text-[10px] leading-relaxed whitespace-pre-wrap break-all overflow-x-auto">
                                    {cleanStackTrace(cLog.stack)}
                                  </pre>
                                </details>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Network failed log
                    const nLog = log as NetworkLog;
                    const { domain, path } = networkLocation(nLog.url);
                    const preceding = findPrecedingAction(nLog, nLog.srcIdx);
                    return (
                      <details
                        key={id}
                        className={`group transition-all ${
                          active ? "ring-2 ring-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40" : "bg-red-50/20 dark:bg-red-950/10 hover:bg-red-50/50 dark:hover:bg-red-950/20"
                        }`}
                      >
                        <summary
                          onClick={seekProps(nLog).onClick}
                          className="p-3 cursor-pointer list-none flex items-center justify-between gap-2 min-w-0"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {renderTimeBadge(nLog)}
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono uppercase bg-subtle text-foreground border border-border shrink-0">
                              {nLog.method || "GET"}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono shrink-0 bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/40">
                              {nLog.status || "FAIL"}
                            </span>
                            {partyIsMixed && (
                              <span
                                className={`px-1 py-0.2 rounded text-[8px] font-bold font-mono shrink-0 uppercase tracking-tight ${
                                  isFirstPartyUrl(nLog.url, targetHost)
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40"
                                    : "bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                                }`}
                              >
                                {isFirstPartyUrl(nLog.url, targetHost) ? "1ST" : "3RD"}
                              </span>
                            )}
                            <div className="min-w-0 flex-1 truncate">
                              <span className="font-mono text-muted text-[11px]">{domain}</span>
                              <span className="font-mono text-foreground font-medium text-[11px]">{path}</span>
                            </div>
                          </div>
                          <svg className="w-3.5 h-3.5 text-muted transition-transform group-open:rotate-180 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                        </summary>
                        <div className="px-3.5 pb-3.5 pt-1 space-y-2 border-t border-border/40 text-[11px] bg-subtle/30 font-mono">
                          {preceding && <ActionBreadcrumb action={preceding} t={t} />}
                          {nLog.url && (
                            <div className="flex items-center justify-between gap-2 p-1.5 rounded bg-background border border-border/60">
                              <span className="text-muted truncate min-w-0 flex-1"><span className="text-foreground font-semibold">URL:</span> {nLog.url}</span>
                              <button
                                type="button"
                                onClick={(e) => handleCopyCurl(nLog, e)}
                                className="shrink-0 text-[10px] px-2 py-0.5 rounded bg-subtle hover:bg-subtle/80 text-muted hover:text-foreground border border-border transition-colors flex items-center gap-1 cursor-pointer"
                                title={t("dt.copyCurl") || "Copy as cURL"}
                              >
                                {copiedCurl === nLog.url ? (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">{t("dt.curlCopied") || "Copied!"}</span>
                                ) : (
                                  <>
                                    <span className="font-mono text-[9px] font-bold text-indigo-500">cURL</span>
                                    <span>{t("dt.copyCurl") || "Copy as cURL"}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                          <p className="text-muted">
                            <span className="text-foreground font-semibold">Status:</span>{" "}
                            {nLog.status || "FAIL"}{" "}
                            {nLog.statusText || statusLabel(t, nLog.status) ? `(${nLog.statusText || statusLabel(t, nLog.status)})` : ""}
                          </p>
                          {nLog.resourceType && (
                            <p className="text-muted"><span className="text-foreground font-semibold">Type:</span> <span className="capitalize">{nLog.resourceType}</span></p>
                          )}
                          {nLog.error && <p className="text-red-600 dark:text-red-400"><span className="font-semibold">Error:</span> {nLog.error}</p>}
                          {nLog.responseBody && (
                            <FormattedJsonBody content={nLog.responseBody} title="Response Body" t={t} />
                          )}
                        </div>
                      </details>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* INFO TAB */}
        {activeTab === "Info" && (
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
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

            <div className="rounded-xl border border-border overflow-visible bg-subtle shadow-sm">
              {/* Timestamp Row with Timezone Switcher Dropdown */}
              <div className="relative flex items-center justify-between px-3 py-2 border-b border-border/60">
                <div className="flex items-center gap-2 text-muted">
                  <svg className="w-3.5 h-3.5 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span className="text-xs">{t("dt.timestamp")}</span>
                </div>

                <div className="relative" ref={tzMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowTzMenu((prev) => !prev)}
                    className="flex items-center gap-1 text-xs font-medium text-foreground hover:text-indigo-600 dark:hover:text-indigo-400 px-1.5 py-0.5 rounded hover:bg-subtle/80 transition-colors group cursor-pointer"
                    title={t("dt.changeTz")}
                  >
                    <span>{createdAt}</span>
                    <svg
                      className={`w-3 h-3 text-muted group-hover:text-foreground transition-transform ${showTzMenu ? "rotate-180" : ""}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {showTzMenu && (
                    <div className="absolute right-0 top-full mt-1.5 z-50 w-56 rounded-xl border border-border bg-subtle p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100 text-xs">
                      <div className="px-2 py-1 text-[10px] font-semibold text-muted uppercase tracking-wider">
                        Select Timezone
                      </div>

                      <button
                        type="button"
                        onClick={() => { setTimeZoneMode("capture"); setShowTzMenu(false); }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors ${
                          timeZoneMode === "capture" ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold" : "text-foreground hover:bg-subtle/70"
                        }`}
                      >
                        <div>
                          <p className="leading-none">Captured time</p>
                          <p className="text-[10px] text-muted mt-0.5 font-normal">Asia/Jakarta (GMT+7)</p>
                        </div>
                        {timeZoneMode === "capture" && (
                          <svg className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => { setTimeZoneMode("local"); setShowTzMenu(false); }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors ${
                          timeZoneMode === "local" ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold" : "text-foreground hover:bg-subtle/70"
                        }`}
                      >
                        <div>
                          <p className="leading-none">Your time (Local)</p>
                          <p className="text-[10px] text-muted mt-0.5 font-normal">
                            {typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "Device Time"}
                          </p>
                        </div>
                        {timeZoneMode === "local" && (
                          <svg className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => { setTimeZoneMode("utc"); setShowTzMenu(false); }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors ${
                          timeZoneMode === "utc" ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold" : "text-foreground hover:bg-subtle/70"
                        }`}
                      >
                        <div>
                          <p className="leading-none">Universal time (UTC)</p>
                          <p className="text-[10px] text-muted mt-0.5 font-normal">UTC / GMT+0</p>
                        </div>
                        {timeZoneMode === "utc" && (
                          <svg className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {[
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

            {metrics && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-1.5">Web Vitals & Performance</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl border border-border bg-subtle/80 flex flex-col justify-between">
                    <span className="text-[10px] text-muted font-medium">LCP (Largest Paint)</span>
                    <span className={`text-xs font-mono font-bold mt-1 ${metrics.lcpMs && metrics.lcpMs > 2500 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {metrics.lcpMs != null ? `${metrics.lcpMs}ms` : "-"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-border bg-subtle/80 flex flex-col justify-between">
                    <span className="text-[10px] text-muted font-medium">CLS (Layout Shift)</span>
                    <span className={`text-xs font-mono font-bold mt-1 ${metrics.cls && metrics.cls > 0.1 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {metrics.cls != null ? metrics.cls : "0"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-border bg-subtle/80 flex flex-col justify-between">
                    <span className="text-[10px] text-muted font-medium">JS Heap Memory</span>
                    <span className="text-xs font-mono font-bold mt-1 text-foreground">
                      {metrics.jsHeapUsedMB != null ? `${metrics.jsHeapUsedMB} MB` : "-"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-border bg-subtle/80 flex flex-col justify-between">
                    <span className="text-[10px] text-muted font-medium">DOM Elements</span>
                    <span className="text-xs font-mono font-bold mt-1 text-foreground">
                      {metrics.domNodes != null ? `${metrics.domNodes.toLocaleString()}` : "-"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Export Bug Report Card */}
            <div className="p-3 rounded-xl border border-indigo-200/80 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20 flex items-center justify-between gap-3 shadow-2xs">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span className="text-indigo-600 dark:text-indigo-400">📋</span>
                  <span>Markdown Bug Report</span>
                </p>
                <p className="text-[11px] text-muted truncate mt-0.5">
                  Environment, causality timeline, top errors, failed cURLs & reproduction steps.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyBugReport}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                {copiedBugReport ? (
                  <>
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    <span>{t("dt.bugReportCopied") || "Report Copied!"}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    <span>{t("dt.copyBugReport") || "Copy Bug Report"}</span>
                  </>
                )}
              </button>
            </div>

          </div>
        )}

        {/* CONSOLE TAB */}
        {activeTab === "Console" && (
          <div className="flex-1 min-h-0 overflow-y-auto">
            {visibleConsoleLogs.length === 0 ? (
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
                <EmptyLogState
                  filtered={consoleErrorsOnly || Boolean(logSearch)}
                  emptyText={t("dt.noConsoleEvents")}
                  onReset={resetLogFilters}
                  t={t}
                />
              )
            ) : (
              <div className="divide-y divide-border/60">
                {visibleConsoleLogs.map((log) => {
                  const level = log.type === "console" ? normalizeLevel(log.level) : log.type;
                  const isWarn = level === "warn";
                  const isErr = level === "error";
                  const preceding = isErr ? findPrecedingAction(log, log.srcIdx) : null;
                  const detail = log.type === "console" ? conciseConsoleText(log) || t("dt.consoleError")
                    : log.message || ("url" in log ? log.url : "") || (log.type === "screenshot" ? t("dt.screenshotTaken") : t("dt.navigation"));
                  const fullText = log.type === "console" ? consoleText(log) : detail;
                  const active = isLogActive(log);
                  const seek = seekProps(log);
                  return (
                    <div
                      key={log.srcIdx}
                      {...seek}
                      className={`group p-3 text-xs transition-all ${seek.className || ""} ${
                        active ? "ring-2 ring-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-sm" : isWarn ? "bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50/70 dark:hover:bg-amber-950/30" : isErr ? "bg-red-50/40 dark:bg-red-950/20 hover:bg-red-50/70 dark:hover:bg-red-950/30" : "hover:bg-subtle/50"
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        {renderTimeBadge(log)}
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
                          {preceding && <ActionBreadcrumb action={preceding} t={t} />}
                          {log.type === "console" && cleanStackTrace(log.stack) ? (
                            <details className="group mt-2">
                              <summary className="flex list-none cursor-pointer items-center gap-1 text-[10px] font-semibold text-muted hover:text-foreground">
                                <svg className="w-3 h-3 transition-transform group-open:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                                {t("dt.stack")}
                              </summary>
                              <pre className="mt-1.5 p-2 rounded-lg bg-red-950 text-red-200 font-mono text-[10px] leading-relaxed whitespace-pre-wrap break-all overflow-x-auto">
                                {cleanStackTrace(log.stack)}
                              </pre>
                            </details>
                          ) : null}
                        </div>
                        {logCount(log) > 1 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-subtle text-[10px] font-bold text-muted border border-border shrink-0">
                            ×{logCount(log)}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleCopyConsole(log, e)}
                          aria-label={t("dt.copyLog") || "Copy log"}
                          title={t("dt.copyLog") || "Copy log"}
                          className="shrink-0 p-1 rounded text-muted opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-foreground hover:bg-subtle transition-all"
                        >
                          {copiedConsole === (log.type === "console" ? consoleText(log) : log.message || ("url" in log ? log.url || "" : "")) ? (
                            <svg className="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                          )}
                        </button>
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
          <div className="flex-1 min-h-0 overflow-y-auto">
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
                      <div className="space-y-1.5 pt-1">
                        {(summary.failedUrls || []).map((url, i) => (
                          <div key={i} className="pl-2.5 border-l-2 border-red-200 dark:border-red-800/40 py-0.5">
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
            ) : visibleGroupedNetworkLogs.length === 0 ? (
              <EmptyLogState
                filtered={networkFailedOnly || networkPartyFilter !== "all" || Boolean(logSearch)}
                emptyText={t("dt.noNetworkErrors")}
                onReset={resetLogFilters}
                t={t}
              />
            ) : (
              <div className="divide-y divide-border/60">
                {visibleGroupedNetworkLogs.map(({ log, count }) => {
                  const { domain, path } = networkLocation(log.url);
                  const isFailed = !log.status || log.status >= 400;
                  const isOk = log.status && log.status < 300;
                  const active = isLogActive(log);
                  const effectiveStatusText = log.statusText || statusLabel(t, log.status) || undefined;
                  const hasPayload = log.requestBody != null || Boolean(log.responseBody);
                  return (
                    <details key={`${log.method || "GET"}|${log.status ?? "FAILED"}|${log.url}`} className={`group hover:bg-subtle/50 transition-all ${active ? "ring-2 ring-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-sm" : ""}`}>
                      <summary
                        onClick={seekProps(log).onClick}
                        className="p-3 cursor-pointer list-none flex items-center justify-between gap-2 min-w-0"
                      >
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
                          {partyIsMixed && (
                            <span
                              className={`px-1 py-0.2 rounded text-[8px] font-bold font-mono shrink-0 uppercase tracking-tight ${
                                isFirstPartyUrl(log.url, targetHost)
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40"
                                  : "bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                              }`}
                              title={isFirstPartyUrl(log.url, targetHost) ? `1st-Party: matches ${targetHost}` : "3rd-Party: external host"}
                            >
                              {isFirstPartyUrl(log.url, targetHost) ? "1ST" : "3RD"}
                            </span>
                          )}
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
                          {renderTimeBadge(log)}
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
                      <div className="px-3 pb-3 pt-2 space-y-2.5 border-t border-border/40 bg-subtle/20 text-xs">
                        {isFailed && (() => {
                          const preceding = findPrecedingAction(log, log.srcIdx);
                          return preceding ? <ActionBreadcrumb action={preceding} t={t} /> : null;
                        })()}
                        {/* Full URL row with copy button */}
                        {log.url && (
                          <div className="flex items-start justify-between gap-2 p-2 rounded-lg bg-background border border-border/60">
                            <div className="min-w-0 flex-1 font-mono text-[11px] break-all leading-relaxed">
                              <span className="text-muted select-none font-semibold mr-1.5">URL:</span>
                              <span className="text-foreground select-all">{log.url}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => handleCopyCurl(log, e)}
                                className="shrink-0 text-[10px] px-2 py-1 rounded bg-subtle hover:bg-subtle/80 text-muted hover:text-foreground border border-border transition-colors flex items-center gap-1 cursor-pointer"
                                title={t("dt.copyCurl") || "Copy as cURL"}
                              >
                                {copiedCurl === log.url ? (
                                  <>
                                    <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">{t("dt.curlCopied") || "Copied!"}</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="font-mono text-[9px] font-bold text-indigo-500">cURL</span>
                                    <span>{t("dt.copyCurl") || "Copy as cURL"}</span>
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleCopyUrl(log.url!, e)}
                                className="shrink-0 text-[10px] px-2 py-1 rounded bg-subtle hover:bg-subtle/80 text-muted hover:text-foreground border border-border transition-colors flex items-center gap-1 cursor-pointer"
                                title={t("dt.copyUrl")}
                              >
                                {copiedUrl === log.url ? (
                                  <>
                                    <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">{t("dt.urlCopied")}</span>
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                    <span>{t("dt.copyUrl")}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Metadata Row */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-[10px]">
                          {log.method && (
                            <span><span className="text-muted">{t("dt.method")}:</span> <span className="font-semibold text-foreground">{log.method}</span></span>
                          )}
                          {log.status !== undefined && (
                            <span>
                              <span className="text-muted">{t("dt.status")}:</span>{" "}
                              <span className={`font-semibold ${isFailed ? "text-red-600 dark:text-red-400" : isOk ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                                {log.status} {effectiveStatusText ? `(${effectiveStatusText})` : ""}
                              </span>
                            </span>
                          )}
                          {log.resourceType && (
                            <span><span className="text-muted">{t("dt.resourceType")}:</span> <span className="text-foreground capitalize">{log.resourceType}</span></span>
                          )}
                          {log.duration != null && (
                            <span><span className="text-muted">{t("dt.duration")}:</span> <span className="text-foreground">{log.duration}ms</span></span>
                          )}
                          {log.error && (
                            <span className="text-red-600 dark:text-red-400 font-semibold">{t("dt.error")}: {log.error}</span>
                          )}
                        </div>

                        {/* Request Body */}
                        {log.requestBody != null && (
                          <FormattedJsonBody content={log.requestBody} title={t("dt.requestBody")} t={t} />
                        )}

                        {/* Response Body */}
                        {log.responseBody ? (
                          <FormattedJsonBody content={log.responseBody} title={t("dt.responseBody")} t={t} />
                        ) : !hasPayload && (
                          <div className="py-2 px-2.5 rounded bg-subtle/50 border border-border/40 text-[11px] text-muted italic">
                            {log.resourceType === "image" || log.resourceType === "stylesheet" || log.resourceType === "font"
                              ? t("dt.noBodyStatic")
                              : t("dt.noBodyRecorded")}
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
          <div className="flex-1 min-h-0 overflow-y-auto p-3">
            {actionLogs.length === 0 ? (
              logSearch || actionKindFilter !== "all" ? (
                <EmptyLogState filtered emptyText="" onReset={resetLogFilters} t={t} />
              ) : (
                <div className="py-14 flex flex-col items-center gap-2 text-muted">
                  <svg className="w-8 h-8 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"/>
                  </svg>
                  <p className="text-xs">{t("dt.noActions")}</p>
                </div>
              )
            ) : (
              <div className="space-y-2">
                {actionLogs.map((log) => {
                  const kind = actionKind(log);
                  const label = kind ? t(`dt.act.${kind}`) : t("dt.act.generic");
                  const lowerMsg = (log.message || "").toLowerCase();
                  // Branch on the kind, not the localised label - comparing against
                  // "Click" broke the icon the moment the locale changed.
                  const isClick = kind === "click" || lowerMsg.includes("click");
                  const isType = kind === "typing" || kind === "input" || lowerMsg.includes("type") || lowerMsg.includes("input");
                  const isScreenshot = log.type === "screenshot";
                  const active = isLogActive(log);

                  const actionText = log.type === "navigation"
                    ? t("dt.navigateTo", { url: log.url || log.message || "" })
                    : log.type === "screenshot"
                    ? t("dt.screenshotTaken")
                    : cleanActionMessage(log.message) || log.message || "";

                  const seek = seekProps(log);
                  return (
                    <div
                      key={log.srcIdx}
                      {...seek}
                      className={`group flex items-start gap-2.5 p-2.5 rounded-lg border transition-all ${seek.className || ""} ${
                        active
                          ? "ring-2 ring-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60 shadow-xs"
                          : "bg-background hover:bg-subtle/50 border-border/80"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${
                          isScreenshot
                            ? "bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40"
                            : isClick
                            ? "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40"
                            : isType
                            ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40"
                            : "bg-subtle text-muted border border-border"
                        }`}
                      >
                        {isScreenshot ? (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          </svg>
                        ) : isClick ? (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                          </svg>
                        ) : isType ? (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <circle cx="12" cy="12" r="3" fill="currentColor" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              isScreenshot
                                ? "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/40"
                                : isClick
                                ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/40"
                                : isType
                                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40"
                                : "bg-subtle text-muted border border-border"
                            }`}
                          >
                            {label}
                          </span>
                          {eventTime(log) && renderTimeBadge(log)}
                        </div>
                        <p className="text-xs text-foreground font-medium leading-snug break-words mt-1">
                          {actionText}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STORAGE TAB */}
        {activeTab === "Storage" && (() => {
          const currentStore = storageType === "local" ? (storageData?.localStorage || {}) : (storageData?.sessionStorage || {});
          // The extension caps a snapshot at 50 keys and signals the rest by
          // injecting a synthetic `... N more keys omitted` key with an empty
          // value (injected_logger.js:276). Rendered as a data row it read as a
          // real storage entry with no value - it belongs in a notice.
          const OMITTED_RE = /^\.\.\.\s+(\d+)\s+more keys omitted$/;
          const allEntries = Object.entries(currentStore);
          const omittedCount = allEntries.reduce((n, [k]) => {
            const m = OMITTED_RE.exec(k);
            return m ? n + Number(m[1]) : n;
          }, 0);
          const entries = allEntries
            .filter(([k]) => !OMITTED_RE.test(k))
            .filter(([k, v]) => {
              if (!logSearch) return true;
              const q = logSearch.toLowerCase();
              return k.toLowerCase().includes(q) || String(v).toLowerCase().includes(q);
            });
          const localCount = Object.keys(storageData?.localStorage || {}).length;
          const sessionCount = Object.keys(storageData?.sessionStorage || {}).length;

          const handleCopyAllStorage = () => {
            try {
              navigator.clipboard.writeText(JSON.stringify(Object.fromEntries(allEntries.filter(([k]) => !OMITTED_RE.test(k))), null, 2));
              setCopiedAllStorage(true);
              setTimeout(() => setCopiedAllStorage(false), 2000);
            } catch {}
          };

          const handleCopyKey = (key: string, val: string) => {
            try {
              navigator.clipboard.writeText(val);
              setCopiedStorageKey(key);
              setTimeout(() => setCopiedStorageKey(null), 2000);
            } catch {}
          };

          return (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {/* Storage Switcher Toolbar */}
              <div className="p-3 border-b border-border bg-subtle/20 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setStorageType("local")}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      storageType === "local"
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/40 font-semibold"
                        : "text-muted hover:text-foreground border border-transparent"
                    }`}
                  >
                    {t("dt.localStorage") || "Local Storage"} ({localCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStorageType("session")}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      storageType === "session"
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/40 font-semibold"
                        : "text-muted hover:text-foreground border border-transparent"
                    }`}
                  >
                    {t("dt.sessionStorage") || "Session Storage"} ({sessionCount})
                  </button>
                </div>
                {entries.length > 0 && (
                  <button
                    type="button"
                    onClick={handleCopyAllStorage}
                    className="px-2 py-1 rounded text-xs font-medium text-muted hover:text-foreground bg-subtle hover:bg-subtle/80 border border-border transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {copiedAllStorage ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{t("dt.urlCopied") || "Copied!"}</span>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        <span>{t("dt.copyAll") || "Copy All"}</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Storage Entries */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                {omittedCount > 0 && (
                  <p className="px-3 py-2 text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/20 border-b border-amber-200/60 dark:border-amber-800/40">
                    {t("dt.storageOmitted", { n: omittedCount })}
                  </p>
                )}
                {entries.length === 0 ? (
                  <EmptyLogState
                    filtered={Boolean(logSearch)}
                    emptyText={t("dt.noStorage") || "No storage data recorded"}
                    onReset={resetLogFilters}
                    t={t}
                  />
                ) : (
                  <div className="divide-y divide-border/60">
                    {entries.map(([key, rawValue]) => {
                      const valStr = String(rawValue);
                      const isCopied = copiedStorageKey === key;
                      // injected_logger.js:410 caps a value at 200 chars and
                      // appends this marker. Nothing labelled it, so a clipped
                      // value looked like the real stored content.
                      const isTruncated = valStr.endsWith("... (truncated)");
                      let isJson = false;
                      let prettyVal = valStr;
                      const trimmed = valStr.trim();
                      if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
                        try {
                          prettyVal = JSON.stringify(JSON.parse(trimmed), null, 2);
                          isJson = true;
                        } catch {}
                      }

                      return (
                        <div key={key} className="p-3 text-xs hover:bg-subtle/40 transition-colors space-y-1.5">
                          <div className="flex items-center justify-between gap-2 min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-mono font-semibold text-foreground text-xs truncate max-w-sm" title={key}>
                                {key}
                              </span>
                              {isJson && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40">
                                  JSON
                                </span>
                              )}
                              <span className="text-[9px] font-mono text-muted">
                                ({valStr.length} chars)
                              </span>
                              {isTruncated && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40">
                                  {t("dt.storageTruncated")}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyKey(key, prettyVal)}
                              className="px-1.5 py-0.5 rounded text-[10px] text-muted hover:text-foreground bg-subtle hover:bg-subtle/80 border border-border transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              {isCopied ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">{t("dt.urlCopied") || "Copied!"}</span>
                              ) : (
                                <span>{t("dt.copy") || "Copy"}</span>
                              )}
                            </button>
                          </div>
                          <pre className="p-2 rounded bg-subtle border border-border font-mono text-[10px] leading-relaxed whitespace-pre-wrap break-all max-h-36 overflow-y-auto select-all">
                            {prettyVal}
                          </pre>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
