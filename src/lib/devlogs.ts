// Pure dev-log layer: types, normalization and the derived helpers the DevTools
// panel renders from. Split out of DevToolsPanel.tsx - none of this touches
// React, so it stays testable and keeps the component file to markup.
import { isIgnoredUrl } from "@/lib/ignored-urls";

export interface TimedLog {
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
export function actionKind(log: { type: string; message?: string }): "click" | "typing" | "input" | "navigation" | "screenshot" | null {
  const firstWord = (log.message || "").toLowerCase().split(/\s+/)[0];
  return ACTION_KINDS[firstWord] || ACTION_KINDS[log.type] || null;
}

// Values are i18n keys, not display strings - the label is resolved at render.
// The bare kind (right column) is what the UI branches on, so it stays stable
// regardless of locale; only the visible label goes through t().
export const ACTION_KINDS: Record<string, "click" | "typing" | "input" | "navigation" | "screenshot"> = {
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
  // Captures uploaded before extension 1.0.44 had navigation/screenshot logs
  // flattened to "step" by editor.js, which emptied the Console tab. The
  // extension's own "step" normalizer drops `url`, so a step that still carries
  // one can only be one of those two - recover it.
  if (type === "step" && url) {
    return { type: "navigation", message, url, time, timestamp, count };
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

export function isSummary(logs: unknown): logs is DevLogSummary {
  return !!logs && typeof logs === "object" && typeof (logs as Record<string, unknown>).version === "number";
}

/** The capture fields the panel and the exporters read. */
export interface CaptureMeta {
  type?: string;
  drive_url: string;
  site_url?: string | null;
  created_at: string;
  window_size?: string | null;
  os?: string | null;
  browser?: string | null;
  dev_logs?: CapturedLogs;
}

export type Grouped<T> = { log: T; count: number };

export function normalizeText(value?: string) {
  return (value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

export function normalizeLevel(level?: string) {
  const normalized = normalizeText(level) || "error";
  return normalized === "warning" ? "warn" : normalized;
}

export function isConsoleError(log: ConsoleLog) {
  const level = normalizeLevel(log.level);
  return level === "error" || Boolean(log.stack) || /(uncaught|exception|error|failed)/i.test(consoleText(log));
}

export function isNetworkFailed(log: NetworkLog) {
  return !log.status || log.status >= 400 || log.status === 0 || Boolean(log.error);
}

export function consoleDetail(log: ConsoleLog | NavigationLog | ScreenshotLog) {
  return log.type === "console" ? consoleText(log) : log.message || ("url" in log ? log.url : "") || "";
}

export function canonicalUrl(value?: string) {
  return (value || "").split("#", 1)[0];
}

export function logCount(log: TimedLog) {
  return Math.max(1, Number(log.count) || 1);
}

export function totalLogCount(items: TimedLog[]) {
  return items.reduce((total, log) => total + logCount(log), 0);
}

export function consoleText(log: ConsoleLog) {
  return log.message || log.text || "";
}

export function conciseConsoleText(log: ConsoleLog) {
  const lines = consoleText(log)
    .replace(/^\[console\]\s*Uncaught Exception:\s*/i, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const meaningful = lines.find((line, index) => index === 0 || !/(webpack|node_modules|react-dom|chrome-extension:|^at (?:__webpack|webpack))/i.test(line));
  return meaningful || lines[0] || "";
}

export function cleanStackTrace(stack?: string | null): string {
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

export function networkLocation(value?: string) {
  try {
    const url = new URL(value || "");
    return { domain: url.hostname, path: `${url.pathname}${url.search}` || "/" };
  } catch {
    return { domain: value || "-", path: "" };
  }
}

export function getTargetHost(siteUrl?: string | null): string {
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

export function isFirstPartyUrl(url?: string, targetHost?: string): boolean {
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

export const HTTP_STATUS_TEXT: Record<number, string> = {
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

export function statusLabel(t: (k: string) => string, status?: number): string {
  if (!status) return "";
  const key = `dt.st.${status}`;
  const hit = t(key);
  // translate() returns the key itself when there is no entry.
  return hit === key ? HTTP_STATUS_TEXT[status] || `HTTP ${status}` : hit;
}

export function isClassSoup(text: string) {
  const tokens = text.split(/\s+/).filter(Boolean);
  return tokens.length >= 3 && (tokens.filter((token) => /(?:^|:)(?:[a-z]+-)|\[|#|\//i.test(token)).length >= 2 || text.length > 50);
}

export function cleanActionMessage(message?: string) {
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

export function groupBy<T extends TimedLog>(items: T[], keyFor: (item: T) => string, mapItem?: (item: T) => T): Grouped<T>[] {
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

export function isTracker(url?: string) {
  return isIgnoredUrl(url);
}
