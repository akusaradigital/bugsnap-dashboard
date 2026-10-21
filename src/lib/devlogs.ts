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
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  /** Transferred bytes, from resource timing or content-length. */
  size?: number;
  /** Negotiated protocol (h2, http/1.1), from resource timing. */
  protocol?: string;
  /** Frame ID or label (0 for top/main, >0 for iframe). */
  frameId?: number | string;
  /** Served from the HTTP cache: a 0ms row is otherwise ambiguous. */
  fromCache?: boolean;
  /** Detailed network timing breakdown from Resource Timing API. */
  timings?: {
    dns?: number;
    connect?: number;
    ssl?: number;
    ttfb?: number;
    download?: number;
  };
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
    initialDomNodes?: number | null;
    peakDomNodes?: number;
    domGrowthPct?: number;
    jsHeapUsedMB?: number | null;
    initialHeapMB?: number | null;
    peakHeapMB?: number;
    heapGrowthMB?: number;
    jsHeapTotalMB?: number | null;
    spaHealth?: {
      isBloated?: boolean;
      isMemoryLeakSuspected?: boolean;
      status?: "healthy" | "warning" | "critical";
      warning?: string | null;
    };
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
  const headerMap = (v: unknown): Record<string, string> | undefined =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, val]) => [k, String(val)]))
      : undefined;
  const requestHeaders = headerMap(log.requestHeaders);
  const responseHeaders = headerMap(log.responseHeaders);
  const size = typeof log.size === "number" ? log.size : undefined;
  const protocol = typeof log.protocol === "string" ? log.protocol : undefined;
  const frameId = typeof log.frameId === "number" || typeof log.frameId === "string" ? log.frameId : undefined;
  const fromCache = log.fromCache === true ? true : undefined;
  const timings = typeof log.timings === "object" && log.timings !== null
    ? (log.timings as NetworkLog["timings"])
    : undefined;
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
    return { type: "network", level, method, status, resourceType, url, statusText, duration, requestBody, responseBody, requestHeaders, responseHeaders, size, protocol, frameId, fromCache, timings, error, time, timestamp, count };
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
  id?: string;
  title?: string | null;
  description?: string | null;
  type?: string;
  drive_url: string;
  site_url?: string | null;
  created_at: string;
  window_size?: string | null;
  os?: string | null;
  browser?: string | null;
  dev_logs?: CapturedLogs;
}

/** One row of a log table: the entry, plus how many identical reports it
 *  absorbed upstream (1 for a request seen once). */
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

export type NetworkKind = "fetchxhr" | "ws" | "js" | "css" | "media" | "font" | "doc" | "other";

export const NETWORK_KINDS: NetworkKind[] = ["fetchxhr", "ws", "js", "css", "media", "font", "doc", "other"];

const EXT_KIND: Array<[RegExp, NetworkKind]> = [
  [/\.(?:m?js|cjs|jsx?|tsx?)(?:[?#]|$)/i, "js"],
  [/\.(?:css|scss|sass|less)(?:[?#]|$)/i, "css"],
  [/\.(?:png|jpe?g|gif|webp|avif|svg|ico|bmp|mp4|webm|mp3|wav|ogg|mov)(?:[?#]|$)/i, "media"],
  [/\.(?:woff2?|ttf|otf|eot)(?:[?#]|$)/i, "font"],
  [/\.(?:html?|php)(?:[?#]|$)/i, "doc"],
];

/** Which filter bucket a request belongs to. One source of truth so the chip
 *  counts and the Type column can never disagree. */
export function networkKind(log: { resourceType?: string; method?: string; url?: string }): NetworkKind {
  const rt = (log.resourceType || "").toLowerCase();
  if (rt === "websocket" || (log.method || "").toUpperCase() === "WS") return "ws";
  if (rt === "xmlhttprequest" || rt === "fetch" || rt === "beacon" || rt === "ping") return "fetchxhr";
  if (rt === "script") return "js";
  if (rt === "stylesheet") return "css";
  if (rt === "image" || rt === "media") return "media";
  if (rt === "font") return "font";
  if (rt === "main_frame" || rt === "sub_frame" || rt === "document") return "doc";
  if (rt && rt !== "resource" && rt !== "other") return "other";
  // No usable resourceType: fall back to the URL, then to fetch/XHR, which is
  // what a page-side patch necessarily observed.
  const url = log.url || "";
  for (const [re, kind] of EXT_KIND) if (re.test(url)) return kind;
  if (/^wss?:\/\//i.test(url)) return "ws";
  return "fetchxhr";
}

/** Byte count as a short human string: 29 B, 4.3 KiB, 2.5 MiB. */
export function formatBytes(n?: number): string {
  if (n == null || !Number.isFinite(n) || n < 0) return "-";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KiB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MiB`;
}

/** Format frame ID as display string: "top", "iframe #1", etc. */
/** Iconify name for a resource kind, so the row glyph and the Type column
 *  can never disagree about what a request is. */
export function networkKindIcon(kind: NetworkKind): string {
  switch (kind) {
    case "ws": return "lucide:plug-zap";
    case "js": return "lucide:file-code-2";
    case "css": return "lucide:palette";
    case "media": return "lucide:image";
    case "font": return "lucide:type";
    case "doc": return "lucide:file-text";
    case "other": return "lucide:file";
    default: return "lucide:arrow-left-right";
  }
}

export function formatFrame(frameId?: number | string): string {
  if (frameId == null || frameId === 0 || frameId === "0" || frameId === "top") return "top";
  return typeof frameId === "number" ? `iframe #${frameId}` : String(frameId);
}

export function formatFrameDetailed(frameId?: number | string): string {
  if (frameId == null || frameId === 0 || frameId === "0" || frameId === "top") return "top (main frame)";
  return typeof frameId === "number" ? `iframe (id: ${frameId})` : `iframe (${frameId})`;
}

export interface TimingBreakdown {
  dns?: number;
  connect?: number;
  ssl?: number;
  ttfb?: number;
  download?: number;
  total?: number;
}

export function getTimingBreakdown(log: NetworkLog): TimingBreakdown | null {
  if (log.timings && (log.timings.dns != null || log.timings.connect != null || log.timings.ttfb != null || log.timings.download != null)) {
    return {
      ...log.timings,
      total: log.duration,
    };
  }
  if (log.duration != null && log.duration > 0) {
    // Basic estimation when granular timings are unavailable: ~75% waiting (TTFB), ~25% download
    const ttfb = Math.round(log.duration * 0.75);
    const download = Math.max(1, log.duration - ttfb);
    return {
      ttfb,
      download,
      total: log.duration,
    };
  }
  return null;
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
  let text = (message || "").trim();
  if (!text) return "";

  // Format "Clicked select: Select Category Type Automotive B2B..." -> "Clicked select: Select Category"
  const selectMatch = text.match(/^(Clicked\s+select:\s*)([^\n\r]+)/i);
  if (selectMatch) {
    const rawVal = selectMatch[2].trim();
    const shortVal = rawVal.split(/\s{2,}|\t/)[0].slice(0, 35);
    return `${selectMatch[1]}${shortVal}`;
  }

  // Strip selector soup in parentheses: e.g. "Clicked button (div.grid.grid-cols-5 > ...)" -> "Clicked button"
  text = text.replace(/\s*\([^)]*[\.>:>#][^)]*\)$/, "");

  const match = text.match(/^(Clicked|Typed in)\s+([^:]+):\s+(.+)$/i);
  if (match && isClassSoup(match[3])) {
    return `${match[1]} ${match[2]}`;
  }

  // Format "Clicked on tag.class.soup" -> "Clicked on tag"
  const clickedOnMatch = text.match(/^Clicked on ([a-z0-9_-]+)\.[a-z0-9_\.:-]+/i);
  if (clickedOnMatch) {
    return `Clicked on ${clickedOnMatch[1]}`;
  }

  return text;
}

export function isDeadAction(log: { type: string; message?: string }) {
  if (log.type !== "step") return false;
  const msg = (log.message || "").trim();
  if (!msg) return true;
  return (
    /^(clicked|click)(\s+on)?\s+(page\s+body|body|html|unknown\s+element)$/i.test(msg) ||
    /^(clicked|click)(\s+on)?\s+(div|span|section|main|svg|path|canvas)$/i.test(msg) ||
    /^(typed\s+in|type)(\s+on)?\s*(unknown\s+element)?$/i.test(msg)
  );
}

export function groupConsoleLogs<T extends { type: string; level?: string; message?: string; text?: string; count?: number; stack?: string | null }>(
  items: T[]
): (T & { count: number })[] {
  const grouped: (T & { count: number })[] = [];
  for (const item of items) {
    const last = grouped[grouped.length - 1];
    const isSameType = Boolean(last && last.type === item.type);
    const isSameLevel = Boolean(last && normalizeLevel(last.level) === normalizeLevel(item.level));
    const lastMsg = (last ? last.message || last.text || "" : "").trim();
    const itemMsg = (item.message || item.text || "").trim();
    const isSameMessage = Boolean(last && lastMsg === itemMsg);

    if (last && isSameType && isSameLevel && isSameMessage) {
      last.count = (last.count || 1) + (item.count || 1);
      if (!last.stack && item.stack) last.stack = item.stack;
    } else {
      grouped.push({
        ...item,
        count: item.count || 1,
      });
    }
  }
  return grouped;
}

export function dedupeNetworkLogs<T extends NetworkLog>(logs: T[]): T[] {
  const result: T[] = [];
  for (const log of logs) {
    const normUrl = canonicalUrl(log.url);
    const method = (log.method || "GET").toUpperCase();
    const status = Number(log.status || 0);

    // Look back for a duplicate observation of the same HTTP transaction
    // (e.g. chrome.webRequest vs page-side fetch hook, or consecutive identical requests within 3s)
    const prevIdx = result.findLastIndex((p) => {
      const pNormUrl = canonicalUrl(p.url);
      const pMethod = (p.method || "GET").toUpperCase();
      const pStatus = Number(p.status || 0);
      if (pMethod !== method || pNormUrl !== normUrl || pStatus !== status) return false;

      const pSrc = (p as Record<string, unknown>).src || "";
      const logSrc = (log as Record<string, unknown>).src || "";
      const isDualSource = (pSrc === "wr") !== (logSrc === "wr");
      const timeDiff = Math.abs(Number(log.timestamp || 0) - Number(p.timestamp || 0));

      return isDualSource || timeDiff <= 3000;
    });

    if (prevIdx >= 0) {
      const prev = result[prevIdx];
      if (!prev.requestBody && log.requestBody) prev.requestBody = log.requestBody;
      if (!prev.responseBody && log.responseBody) prev.responseBody = log.responseBody;
      if (!prev.requestHeaders && log.requestHeaders) prev.requestHeaders = log.requestHeaders;
      if (!prev.responseHeaders && log.responseHeaders) prev.responseHeaders = log.responseHeaders;
      if (prev.duration == null && log.duration != null) prev.duration = log.duration;
      if (prev.size == null && log.size != null) prev.size = log.size;
      if (!prev.protocol && log.protocol) prev.protocol = log.protocol;
      if (prev.frameId == null && log.frameId != null) prev.frameId = log.frameId;
      if (!prev.timings && log.timings) prev.timings = log.timings;
      if (prev.fromCache == null && log.fromCache != null) prev.fromCache = log.fromCache;
      if (!prev.error && log.error) prev.error = log.error;

      const pSrc = (prev as Record<string, unknown>).src || "";
      const logSrc = (log as Record<string, unknown>).src || "";
      if (pSrc === logSrc) {
        prev.count = (prev.count || 1) + (log.count || 1);
      }
    } else {
      result.push({ ...log });
    }
  }
  return result;
}

export function groupActionLogs<T extends { type: string; message?: string; count?: number; url?: string }>(
  items: T[]
): (T & { count: number })[] {
  const grouped: (T & { count: number })[] = [];
  for (const item of items) {
    const last = grouped[grouped.length - 1];
    const isSameType = last && last.type === item.type;
    const isSameMessage = last && (last.message || "") === (item.message || "");
    const isSameUrl = last && (last.url || "") === (item.url || "");

    if (last && isSameType && isSameMessage && isSameUrl) {
      last.count = (last.count || 1) + (item.count || 1);
    } else {
      grouped.push({
        ...item,
        count: item.count || 1,
      });
    }
  }
  return grouped;
}

export function isTracker(url?: string) {
  return isIgnoredUrl(url);
}
