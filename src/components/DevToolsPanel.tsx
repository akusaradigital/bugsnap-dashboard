"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useT } from "@/components/I18nProvider";
import { Icon } from "@/lib/iconify";
import { decompressDevLogs } from "@/lib/devlogs-compression";
import { supabase } from "@/lib/supabase";
import { isIgnoredUrl, TRACKER_PATTERNS } from "@/lib/ignored-urls";
import {
  type ActionLog,
  type CaptureMeta,
  type CapturedLogs,
  type ConsoleLog,
  type DeviceSpecsLog,
  type DevLog,
  type DevLogSummary,
  type DriveExternalLogReference,
  type NavigationLog,
  type Grouped,
  type NetworkLog,
  type PerformanceLog,
  type ScreenshotLog,
  type StorageLog,
  type TimedLog,
  actionKind,
  canonicalUrl,
  cleanActionMessage,
  cleanStackTrace,
  conciseConsoleText,
  consoleDetail,
  consoleText,
  dedupeNetworkLogs,
  getTargetHost,
  groupActionLogs,
  groupConsoleLogs,
  isConsoleError,
  isDeadAction,
  isFirstPartyUrl,
  isNetworkFailed,
  isSummary,
  isTracker,
  logCount,
  formatBytes,
  formatFrame,
  formatFrameDetailed,
  getTimingBreakdown,
  networkKind,
  networkKindIcon,
  networkLocation,
  normalizeDevLog,
  normalizeLevel,
  statusLabel,
} from "@/lib/devlogs";
import { buildCurlCommand, buildHarExport, buildMarkdownBugReport } from "@/lib/devlogs-export";

// Re-exported so existing importers of this module keep working.
export { isIgnoredUrl, TRACKER_PATTERNS, normalizeDevLog, cleanStackTrace, isFirstPartyUrl };
export { buildCurlCommand, buildHarExport, buildMarkdownBugReport };
export type { ConsoleLog, NetworkLog, ActionLog, NavigationLog, ScreenshotLog, PerformanceLog, StorageLog, DeviceSpecsLog, DevLog, DevLogSummary, DriveExternalLogReference, CapturedLogs };

interface Props {
  capture: CaptureMeta;
  currentTime?: number;
  onSeekToTime?: (timeSec: number) => void;
  /** Unlock password for a protected public capture: externally-stored logs go
   *  through the same gated stream route, which needs proof for those now. */
  unlockPassword?: string | null;
  className?: string;
}

const TABS = ["Info", "Console", "Network", "Actions", "MCP"] as const;
type Tab = typeof TABS[number];

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
      <p className="text-[11px] font-mono text-foreground/90 break-all leading-relaxed whitespace-pre-wrap">
        {msg}
      </p>
    </div>
  );
}


function HeaderTable({
  headers,
  title,
  defaultOpen = false,
}: {
  headers?: Record<string, string>;
  title: string;
  defaultOpen?: boolean;
}) {
  const entries = Object.entries(headers || {});
  if (entries.length === 0) return null;
  return (
    <details className="group/h mt-1.5" open={defaultOpen}>
      <summary className="flex list-none cursor-pointer items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted hover:text-foreground">
        <Icon icon="lucide:chevron-right" className="w-3 h-3 transition-transform group-open/h:rotate-90 shrink-0" />
        <span>{title}</span>
        <span className="text-[9px] font-mono lowercase">({entries.length})</span>
      </summary>
      <div className="mt-1 rounded-lg border border-border bg-subtle overflow-hidden">
        {entries.map(([name, value]) => (
          <div key={name} className="flex flex-col gap-0.5 px-2 py-1.5 border-b border-border/40 last:border-b-0">
            <span className="font-mono text-[10px] font-semibold text-muted break-all">{name}</span>
            <span className="font-mono text-[10px] text-foreground break-all min-w-0 select-all">{value}</span>
          </div>
        ))}
      </div>
    </details>
  );
}

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
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#89BD49]/10 dark:bg-[#89BD49]/20 text-[#6B9A35] dark:text-[#A8D666] border border-[#89BD49]/30 dark:border-[#89BD49]/40">
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
              <Icon icon="lucide:copy" className="w-2.5 h-2.5" />
              <span>{t("dt.copy") || "Copy"}</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-2 rounded-lg bg-subtle text-foreground border border-border font-mono text-[10px] leading-relaxed whitespace-pre-wrap break-all max-h-48 overflow-y-auto select-all">
        {formatted}
      </pre>
    </div>
  );
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
      <Icon icon="lucide:search" className="w-7 h-7 opacity-30" />
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

type NetRow = Grouped<NetworkLog & { srcIdx?: number }>;
type NetDetailTab = "headers" | "request" | "response" | "timing";

/** Identity of one table row. srcIdx is the request's position in the capture:
 *  method+status+url repeats now that every request gets its own row, so it
 *  can no longer tell two polls of the same endpoint apart. */
function rowKey(log: NetworkLog & { srcIdx?: number }) {
  return `${log.srcIdx ?? "?"}|${log.method || "GET"}|${log.status ?? "FAILED"}|${log.url}`;
}

/** One request's detail pane: the Headers / Request / Response sub-tabs. */
function NetworkDetail({
  log,
  count,
  tab,
  onTab,
  precedingAction,
  onCopyCurl,
  onCopyUrl,
  copiedCurl,
  copiedUrl,
  t,
}: {
  log: NetworkLog;
  count: number;
  tab: NetDetailTab;
  onTab: (tab: NetDetailTab) => void;
  precedingAction: { message: string; deltaSec: number | null } | null;
  onCopyCurl: (log: NetworkLog, e: React.MouseEvent) => void;
  onCopyUrl: (url: string, e: React.MouseEvent) => void;
  copiedCurl: string | null;
  copiedUrl: string | null;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const isFailed = !log.status || log.status >= 400;
  const isOk = Boolean(log.status && log.status < 300);
  const statusText = log.statusText || statusLabel(t, log.status) || undefined;
  const hasPayload = log.requestBody != null || Boolean(log.responseBody);
  const TABS: NetDetailTab[] = ["headers", "request", "response", "timing"];

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden border-t border-border bg-background">
      {/* Sub-tabs + Copy cURL, the row at the top of the detail pane */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border/60 shrink-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((tb) => (
          <button
            key={tb}
            type="button"
            onClick={() => onTab(tb)}
            aria-pressed={tab === tb}
            className={`px-2 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
              tab === tb
                ? "bg-subtle text-foreground border border-border font-semibold"
                : "text-muted hover:text-foreground border border-transparent"
            }`}
          >
            {t(`dt.detail.${tb}`) || tb}
          </button>
        ))}
        <div className="flex-1" />
        {log.url && (
          <button
            type="button"
            onClick={(e) => onCopyCurl(log, e)}
            className="shrink-0 text-[10px] px-2 py-1 rounded bg-subtle hover:bg-subtle/80 text-muted hover:text-foreground border border-border transition-colors flex items-center gap-1 cursor-pointer"
            title={t("dt.copyCurl") || "Copy as cURL"}
          >
            {copiedCurl === log.url ? (
              <>
                <Icon icon="lucide:check" className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">{t("dt.curlCopied") || "Copied!"}</span>
              </>
            ) : (
              <span className="font-mono text-[9px] font-bold text-[#6B9A35] dark:text-[#A8D666]">{t("dt.copyCurl") || "Copy cURL"}</span>
            )}
          </button>
        )}
      </div>

      {/* flex-1 + min-h-0 so the body fills the drawer and scrolls only when its
          content exceeds it. The host is ~252px (flex-1 of the panel), so a long
          Headers tab must scroll; what was wrong before was a scrollbar over
          empty space, caused by the drawer not filling its host. */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-2.5 text-xs">
        {precedingAction && <ActionBreadcrumb action={precedingAction} t={t} />}

        {tab === "headers" && (
          <>
            {/* General: top detail block with standard field order */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="px-2.5 py-1.5 bg-subtle border-b border-border/60 text-[10px] font-semibold uppercase tracking-wider text-muted">
                {t("dt.general") || "General"}
              </div>
              <dl className="divide-y divide-border/40">
                {log.url && (
                  <div className="flex flex-col gap-0.5 px-2.5 py-1.5">
                    <dt className="text-[10px] font-semibold text-muted">{t("dt.requestUrl") || "Request URL"}</dt>
                    <dd className="min-w-0 flex items-start gap-1.5">
                      <span className="font-mono text-[10px] text-foreground break-all select-all min-w-0">{log.url}</span>
                      <button
                        type="button"
                        onClick={(e) => onCopyUrl(log.url!, e)}
                        className="shrink-0 p-0.5 rounded text-muted hover:text-foreground hover:bg-subtle transition-colors cursor-pointer"
                        title={t("dt.copyUrl")}
                      >
                        <Icon icon={copiedUrl === log.url ? "lucide:check" : "lucide:copy"} className="w-3 h-3" />
                      </button>
                    </dd>
                  </div>
                )}
                <div className="flex flex-col gap-0.5 px-2.5 py-1.5">
                  <dt className="text-[10px] font-semibold text-muted">{t("dt.requestMethod") || "Request Method"}</dt>
                  <dd className="font-mono text-[10px] text-foreground">{log.method || "GET"}</dd>
                </div>
                <div className="flex flex-col gap-0.5 px-2.5 py-1.5">
                  <dt className="text-[10px] font-semibold text-muted">{t("dt.statusCode") || "Status Code"}</dt>
                  <dd className="flex items-center gap-1.5 font-mono text-[10px]">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isFailed ? "bg-red-500" : isOk ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                      aria-hidden="true"
                    />
                    <span className={isFailed ? "text-red-600 dark:text-red-400 font-semibold" : "text-foreground"}>
                      {log.status || t("dt.statusFailed") || "Failed"}
                      {statusText ? ` ${statusText}` : ""}
                    </span>
                  </dd>
                </div>
                {log.protocol && (
                  <div className="flex flex-col gap-0.5 px-2.5 py-1.5">
                    <dt className="text-[10px] font-semibold text-muted">{t("dt.protocol") || "Protocol"}</dt>
                    <dd className="font-mono text-[10px] text-foreground">{log.protocol}</dd>
                  </div>
                )}
                {log.size != null && (
                  <div className="flex flex-col gap-0.5 px-2.5 py-1.5">
                    <dt className="text-[10px] font-semibold text-muted">{t("dt.size") || "Size"}</dt>
                    <dd className="font-mono text-[10px] text-foreground tabular-nums" title={`${log.size} bytes`}>{formatBytes(log.size)}</dd>
                  </div>
                )}
                {log.duration != null && (
                  <div className="flex flex-col gap-0.5 px-2.5 py-1.5">
                    <dt className="text-[10px] font-semibold text-muted">{t("dt.duration")}</dt>
                    <dd className={`font-mono text-[10px] tabular-nums ${log.duration > 1000 ? "text-amber-600 dark:text-amber-400 font-semibold" : "text-foreground"}`}>
                      {log.duration} ms
                    </dd>
                  </div>
                )}
                <div className="flex flex-col gap-0.5 px-2.5 py-1.5">
                  <dt className="text-[10px] font-semibold text-muted">{t("dt.frame") || "Frame"}</dt>
                  <dd className="font-mono text-[10px] text-foreground">{formatFrameDetailed(log.frameId)}</dd>
                </div>
                {count > 1 && (
                  <div className="flex flex-col gap-0.5 px-2.5 py-1.5">
                    <dt className="text-[10px] font-semibold text-muted">{t("dt.occurrences") || "Occurrences"}</dt>
                    <dd className="font-mono text-[10px] text-foreground tabular-nums">×{count}</dd>
                  </div>
                )}
                {log.error && (
                  <div className="flex flex-col gap-0.5 px-2.5 py-1.5">
                    <dt className="text-[10px] font-semibold text-muted">{t("dt.error")}</dt>
                    <dd className="font-mono text-[10px] text-red-600 dark:text-red-400 break-all">{log.error}</dd>
                  </div>
                )}
              </dl>
            </div>

            <HeaderTable headers={log.responseHeaders} title={t("dt.responseHeaders") || "Response headers"} defaultOpen />
            <HeaderTable headers={log.requestHeaders} title={t("dt.requestHeaders") || "Request headers"} defaultOpen />
            {!log.responseHeaders && !log.requestHeaders && (
              <p className="px-1 text-[11px] text-muted italic">{t("dt.noHeaders") || "No headers were recorded for this request."}</p>
            )}
          </>
        )}

        {tab === "request" && (
          log.requestBody != null && log.requestBody !== "" ? (
            <FormattedJsonBody content={log.requestBody} title={t("dt.requestBody")} t={t} />
          ) : (
            <p className="px-1 text-[11px] text-muted italic">{t("dt.noRequestBody") || "This request had no body."}</p>
          )
        )}

        {tab === "response" && (
          log.responseBody ? (
            <FormattedJsonBody content={log.responseBody} title={t("dt.responseBody")} t={t} />
          ) : (
            <p className="px-1 text-[11px] text-muted italic">
              {hasPayload || log.resourceType === "image" || log.resourceType === "stylesheet" || log.resourceType === "font"
                ? t("dt.noBodyStatic")
                : t("dt.noBodyRecorded")}
            </p>
          )
        )}

        {tab === "timing" && (() => {
          const tb = getTimingBreakdown(log);
          if (!tb) {
            return (
              <p className="px-1 text-[11px] text-muted italic">
                {t("dt.noTimingData") || "No granular timing breakdown recorded for this request."}
              </p>
            );
          }
          const total = tb.total || log.duration || 1;
          const phases = [
            { key: "dns", label: t("dt.timing.dns") || "DNS Lookup", val: tb.dns, color: "bg-cyan-500" },
            { key: "connect", label: t("dt.timing.connect") || "Initial Connection", val: tb.connect, color: "bg-blue-500" },
            { key: "ssl", label: t("dt.timing.ssl") || "SSL Handshake", val: tb.ssl, color: "bg-indigo-500" },
            { key: "ttfb", label: t("dt.timing.ttfb") || "Waiting (TTFB)", val: tb.ttfb, color: "bg-amber-500" },
            { key: "download", label: t("dt.timing.download") || "Content Download", val: tb.download, color: "bg-emerald-500" },
          ].filter((p) => p.val != null && p.val > 0);

          return (
            <div className="space-y-3">
              <div className="rounded-lg border border-border p-3 bg-subtle/40 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-foreground">{t("dt.timing.total") || "Total Duration"}</span>
                  <span className="font-mono font-bold text-foreground tabular-nums">{log.duration ?? total} ms</span>
                </div>
                <div className="h-2 rounded-full bg-border/60 overflow-hidden flex w-full">
                  {phases.map((p) => (
                    <div
                      key={p.key}
                      className={`h-full ${p.color}`}
                      style={{ width: `${Math.max(2, Math.round(((p.val || 0) / total) * 100))}%` }}
                      title={`${p.label}: ${p.val} ms`}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-border overflow-hidden">
                <dl className="divide-y divide-border/40">
                  {phases.map((p) => (
                    <div key={p.key} className="flex items-center justify-between px-2.5 py-1.5">
                      <dt className="flex items-center gap-2 text-[10px] font-semibold text-muted">
                        <span className={`w-2 h-2 rounded-full ${p.color}`} aria-hidden="true" />
                        <span>{p.label}</span>
                      </dt>
                      <dd className="font-mono text-[10px] text-foreground tabular-nums">{p.val} ms</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

/** BugSnap Network view: a scrollable table, and a detail pane for the selected
 *  row. Selecting a row splits the area rather than pushing rows down, so the
 *  surrounding requests stay visible while one is being read. */
function NetworkTable({
  rows,
  limit,
  onLoadMore,
  selectedKey,
  onSelect,
  detailTab,
  onDetailTab,
  targetHost,
  partyIsMixed,
  isLogActive,
  findPrecedingAction,
  onCopyCurl,
  onCopyUrl,
  copiedCurl,
  copiedUrl,
  t,
}: {
  rows: NetRow[];
  limit: number;
  onLoadMore: () => void;
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  detailTab: NetDetailTab;
  onDetailTab: (tab: NetDetailTab) => void;
  targetHost?: string;
  partyIsMixed: boolean;
  isLogActive: (log: TimedLog) => boolean;
  findPrecedingAction: (log: TimedLog, knownIdx?: number) => { message: string; deltaSec: number | null } | null;
  onCopyCurl: (log: NetworkLog, e: React.MouseEvent) => void;
  onCopyUrl: (url: string, e: React.MouseEvent) => void;
  copiedCurl: string | null;
  copiedUrl: string | null;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  // Esc closes the overlay: it covers the list, so a keyboard user needs a way
  // back that is not the X button.
  useEffect(() => {
    if (!selectedKey) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSelect(null);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [selectedKey, onSelect]);

  const shown = rows.slice(0, limit);
  const selected = selectedKey ? shown.find(({ log }) => rowKey(log) === selectedKey) : undefined;
  // The longest duration sets the waterfall scale, so the bars stay comparable
  // within the current filter instead of against an absolute ceiling.
  const maxDuration = Math.max(1, ...shown.map(({ log }) => log.duration || 0));

  return (
    // The detail pane is an overlay, not a split: the request list stays put
    // behind it, so closing the pane does not reflow the rows you were reading.
    // The table stays in normal flow - the panel is sized by max-height, so an
    // absolutely-positioned table would leave flex-1 with nothing to measure
    // and collapse the whole area to zero height.
    <div className="flex-1 min-h-0 relative flex flex-col">
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full min-w-0 md:min-w-[46rem] border-collapse text-[11px]">
          <thead className="sticky top-0 z-10 bg-subtle">
            <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted">
              {/* Row number: numbers rows consecutively as the stable way to
                  refer to one request among repeated polls of the same endpoint. */}
              <th scope="col" className="hidden sm:table-cell px-1.5 py-1.5 font-semibold border-b border-border w-9 text-right tabular-nums">#</th>
              <th scope="col" className="px-2 py-1.5 font-semibold border-b border-border min-w-0">{t("dt.col.name") || "Name"}</th>
              <th scope="col" className="hidden md:table-cell px-2 py-1.5 font-semibold border-b border-border w-16">{t("dt.col.method") || "Method"}</th>
              <th scope="col" className="px-2 py-1.5 font-semibold border-b border-border w-14">{t("dt.col.status") || "Status"}</th>
              <th scope="col" className="hidden lg:table-cell px-2 py-1.5 font-semibold border-b border-border w-28">{t("dt.col.domain") || "Domain"}</th>
              <th scope="col" className="hidden sm:table-cell px-2 py-1.5 font-semibold border-b border-border w-20">{t("dt.col.type") || "Type"}</th>
              <th scope="col" className="hidden sm:table-cell px-2 py-1.5 font-semibold border-b border-border w-20 text-right">{t("dt.col.size") || "Size"}</th>
              <th scope="col" className="px-2 py-1.5 font-semibold border-b border-border w-20 text-right">{t("dt.col.time") || "Time"}</th>
              <th scope="col" className="hidden md:table-cell px-2 py-1.5 font-semibold border-b border-border w-14">{t("dt.col.frame") || "Frame"}</th>
              <th scope="col" className="hidden sm:table-cell px-2 py-1.5 font-semibold border-b border-border w-24">{t("dt.col.waterfall") || "Waterfall"}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map(({ log, count }, idx) => {
              const key = rowKey(log);
              const { domain, path } = networkLocation(log.url);
              const isFailed = !log.status || log.status >= 400;
              const isOk = Boolean(log.status && log.status < 300);
              const isSelected = key === selectedKey;
              const atPlayhead = isLogActive(log);
              const is1st = isFirstPartyUrl(log.url, targetHost);
              const kind = networkKind(log);
              // Filename-ish tail, which is what identifies a request at a glance.
              const name = (path && path !== "/" ? path.split("?")[0].split("/").filter(Boolean).pop() : "") || domain || "-";
              return (
                <tr
                  key={key}
                  onClick={() => onSelect(isSelected ? null : key)}
                  aria-selected={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(isSelected ? null : key);
                    }
                  }}
                  className={`h-7 cursor-pointer border-b border-border/40 transition-colors ${
                    isSelected
                      ? "bg-[#89BD49]/15 dark:bg-[#89BD49]/20"
                      : atPlayhead
                      ? "bg-[#89BD49]/8 dark:bg-[#89BD49]/12"
                      : isFailed
                      ? "bg-red-50/40 dark:bg-red-950/15 hover:bg-red-50/70 dark:hover:bg-red-950/25"
                      : idx % 2 === 1
                      ? "bg-subtle/30 hover:bg-subtle/60"
                      : "hover:bg-subtle/50"
                  }`}
                >
                  <td className="hidden sm:table-cell px-1.5 py-1 h-7 text-right align-middle font-mono text-[10px] text-muted tabular-nums select-none">
                    {idx + 1}
                  </td>
                  <td className="px-2 py-1 h-7 align-middle min-w-0 sm:w-[11rem]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {partyIsMixed && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${is1st ? "bg-emerald-500" : "bg-zinc-400 dark:bg-zinc-500"}`}
                          title={is1st ? `1st-party: ${targetHost}` : "3rd-party"}
                          aria-hidden="true"
                        />
                      )}
                      <Icon
                        icon={networkKindIcon(kind)}
                        className="w-3.5 h-3.5 shrink-0 text-muted"
                        aria-hidden="true"
                      />
                      <span className="truncate font-medium text-foreground min-w-0 flex-1" title={log.url}>{name}</span>
                      {count > 1 && (
                        <span className="shrink-0 px-1 rounded bg-subtle border border-border text-[9px] font-bold text-muted tabular-nums">×{count}</span>
                      )}
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-2 py-1 h-7 align-middle whitespace-nowrap font-mono text-[10px] text-muted">{log.method || "GET"}</td>
                  <td className="px-2 py-1 h-7 align-middle whitespace-nowrap">
                    <span
                      className={`font-mono text-[10px] font-bold ${
                        isFailed ? "text-red-600 dark:text-red-400" : isOk ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {log.status || "FAIL"}
                    </span>
                  </td>
                  <td className="hidden lg:table-cell px-2 py-1 h-7 align-middle min-w-0 w-[9rem]">
                    <span className="block truncate font-mono text-[10px] text-muted" title={domain}>{domain}</span>
                  </td>
                  <td className="hidden sm:table-cell px-2 py-1 h-7 align-middle whitespace-nowrap font-mono text-[10px] text-muted">{t(`dt.kind.${kind}`) || kind}</td>
                  <td className="hidden sm:table-cell px-2 py-1 h-7 align-middle whitespace-nowrap font-mono text-[10px] text-muted text-right tabular-nums" title={log.size != null ? `${log.size} bytes` : undefined}>
                    {formatBytes(log.size)}
                  </td>
                  <td className={`px-2 py-1 h-7 align-middle whitespace-nowrap font-mono text-[10px] text-right tabular-nums ${log.duration && log.duration > 1000 ? "text-amber-600 dark:text-amber-400 font-semibold" : "text-muted"}`}>
                    {/* A cache hit has no transfer time; printing "0 ms" reads as a
                        suspiciously fast request rather than as no request at all. */}
                    {log.fromCache
                      ? (t("dt.cached") || "(Cached)")
                      : log.duration != null
                      ? `${log.duration} ms`
                      : "-"}
                  </td>
                  <td className="hidden md:table-cell px-2 py-1 h-7 align-middle whitespace-nowrap font-mono text-[10px] text-muted">
                    {formatFrame(log.frameId)}
                  </td>
                  <td className="hidden sm:table-cell px-2 py-1 h-7 align-middle whitespace-nowrap">
                    {(() => {
                      const tb = getTimingBreakdown(log);
                      const total = log.duration || 0;
                      if (tb && (tb.dns != null || tb.connect != null || tb.ttfb != null)) {
                        const phases = [
                          { k: "dns", v: tb.dns, c: "bg-cyan-500", l: "DNS" },
                          { k: "connect", v: tb.connect, c: "bg-blue-500", l: "Connect" },
                          { k: "ssl", v: tb.ssl, c: "bg-indigo-500", l: "SSL" },
                          { k: "ttfb", v: tb.ttfb, c: isFailed ? "bg-red-500" : "bg-amber-500", l: "TTFB" },
                          { k: "dl", v: tb.download, c: "bg-emerald-500", l: "Download" },
                        ].filter((p) => p.v != null && p.v > 0);

                        const tooltip = phases.map((p) => `${p.l}: ${p.v}ms`).join(" • ") + (total > 0 ? ` (Total: ${total}ms)` : "");
                        const barWidth = Math.min(100, Math.max(4, Math.round(((total || 1) / maxDuration) * 100)));

                        return (
                          <div className="h-1.5 rounded-full bg-border/60 overflow-hidden" title={tooltip}>
                            <div className="h-full flex" style={{ width: `${barWidth}%` }}>
                              {phases.map((p) => (
                                <div
                                  key={p.k}
                                  className={`h-full ${p.c}`}
                                  style={{ width: `${Math.max(4, Math.round(((p.v || 0) / (total || 1)) * 100))}%` }}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="h-1.5 rounded-full bg-border/60 overflow-hidden" title={log.duration != null ? `${log.duration} ms` : undefined}>
                          <div
                            className={`h-full rounded-full ${isFailed ? "bg-red-400" : log.duration && log.duration > 1000 ? "bg-amber-400" : "bg-[#89BD49]"}`}
                            style={{ width: `${Math.min(100, Math.max(2, Math.round(((log.duration || 0) / maxDuration) * 100)))}%` }}
                          />
                        </div>
                      );
                    })()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length > limit && (
          <button
            type="button"
            onClick={onLoadMore}
            className="w-full py-2.5 text-center text-xs font-semibold text-muted hover:text-foreground hover:bg-subtle border-t border-border transition-colors cursor-pointer"
          >
            {t("dt.loadMore", { n: rows.length - limit }) || `Load more (${rows.length - limit} remaining)`}
          </button>
        )}
      </div>

      {selected && (
        <div
          role="dialog"
          aria-label={t("dt.detail.headers") || "Request details"}
          /* Covers the table. The panel is only ~440px wide on the capture page,
             so insetting the drawer to keep a row strip visible left ~288px for
             URLs and headers - they shredded one character per line.
             Top-anchored and content-sized, not inset-0: a two-line Headers tab
             used to stretch to the full panel height and scroll over nothing. */
          className="absolute inset-0 flex flex-col bg-background shadow-2xl motion-safe:animate-slide-in-right z-20"
        >
          <div className="flex items-center justify-between gap-2 px-2.5 py-1 bg-subtle border-b border-border shrink-0">
            <span className="truncate font-mono text-[10px] text-muted min-w-0" title={selected.log.url}>
              {selected.log.url}
            </span>
            <button
              type="button"
              onClick={() => onSelect(null)}
              aria-label={t("dt.closeDetail") || "Close details"}
              title={t("dt.closeDetail") || "Close details"}
              className="shrink-0 p-0.5 rounded text-muted hover:text-foreground hover:bg-background transition-colors cursor-pointer"
            >
              <Icon icon="lucide:x" className="w-3.5 h-3.5" />
            </button>
          </div>
          <NetworkDetail
            log={selected.log}
            count={selected.count}
            tab={detailTab}
            onTab={onDetailTab}
            precedingAction={
              (!selected.log.status || selected.log.status >= 400)
                ? findPrecedingAction(selected.log, selected.log.srcIdx)
                : null
            }
            onCopyCurl={onCopyCurl}
            onCopyUrl={onCopyUrl}
            copiedCurl={copiedCurl}
            copiedUrl={copiedUrl}
            t={t}
          />
        </div>
      )}
    </div>
  );
}

function McpTabPanel({
  capture,
  consoleErrors,
  networkFailures,
  t,
}: {
  capture: CaptureMeta;
  consoleErrors: ConsoleLog[];
  networkFailures: NetworkLog[];
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const captureId = capture.id || (typeof window !== "undefined" ? window.location.pathname.split("/").filter(Boolean).pop() : "") || "capture-id";
  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/v/${captureId}`
    : `https://bugsnap.akusaraproject.my.id/v/${captureId}`;

  const promptText = `Fix this BugSnap issue: ${capture.title || "Bug Report"}
Capture URL: ${shareUrl}
Description: ${capture.description || "No description provided"}
Environment: ${capture.browser || "Browser"} / ${capture.os || "OS"} / ${capture.window_size || "Screen"}
Errors detected: ${consoleErrors.length} console error(s), ${networkFailures.length} failed network request(s).

Please inspect the capture details via BugSnap MCP or the link above and propose a fix.`;

  const claudeCodeCmd = `claude mcp add --scope user -e BUGSNAP_API_KEY=YOUR_KEY --transport stdio bugsnap -- npx -y bugsnap-mcp`;

  const claudeDesktopConfig = `{
  "mcpServers": {
    "bugsnap": {
      "command": "npx",
      "args": ["-y", "bugsnap-mcp"],
      "env": { "BUGSNAP_API_KEY": "YOUR_KEY" }
    }
  }
}`;

  const handleCopyPrompt = () => {
    try {
      navigator.clipboard.writeText(promptText);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch {}
  };

  const handleCopyCmd = (text: string, id: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedCmd(id);
      setTimeout(() => setCopiedCmd(null), 2000);
    } catch {}
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
      <div className="rounded-xl border border-border bg-[#89BD49]/10 dark:bg-[#89BD49]/15 p-4 sm:p-5 space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-[#89BD49] text-white font-mono text-[10px] font-bold">MCP</span>
          <h3 className="text-sm font-bold text-foreground">
            {t("dt.mcp.title") || "Fix with AI Coding Agents (BugSnap MCP)"}
          </h3>
        </div>
        <p className="text-muted leading-relaxed text-[11px]">
          {t("dt.mcp.desc") || "Give Claude Code, Cursor, Windsurf, or Claude Desktop direct context to fix this bug report without manual copy-pasting."}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-subtle/80 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 font-semibold text-foreground text-xs">
            <Icon icon="lucide:sparkles" className="w-4 h-4 text-[#6B9A35] dark:text-[#A8D666]" />
            <span>{t("dt.mcp.promptTitle") || "Prompt for AI Assistant"}</span>
          </div>
          <button
            type="button"
            onClick={handleCopyPrompt}
            className="px-3 py-1.5 rounded-md text-xs font-semibold bg-[#89BD49] hover:bg-[#7BAA3F] text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Icon icon={copiedPrompt ? "lucide:check" : "lucide:copy"} className="w-3.5 h-3.5" />
            <span>{copiedPrompt ? (t("dt.mcp.promptCopied") || "Prompt Copied!") : (t("dt.mcp.copyPrompt") || "Copy AI Prompt")}</span>
          </button>
        </div>
        <pre className="p-3 rounded-lg bg-subtle text-foreground border border-border font-mono text-[11px] leading-relaxed whitespace-pre-wrap select-all overflow-x-auto">
          {promptText}
        </pre>
      </div>

      <div className="rounded-xl border border-border bg-subtle/80 p-4 space-y-3">
        <div className="flex items-center gap-1.5 font-semibold text-foreground text-xs">
          <Icon icon="lucide:terminal" className="w-4 h-4 text-[#89BD49]" />
          <span>{t("dt.mcp.setupTitle") || "Connect BugSnap MCP Server"}</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-medium text-muted">
            <span>Claude Code CLI</span>
            <button
              type="button"
              onClick={() => handleCopyCmd(claudeCodeCmd, "claude-code")}
              className="text-[10px] text-[#6B9A35] dark:text-[#A8D666] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Icon icon={copiedCmd === "claude-code" ? "lucide:check" : "lucide:copy"} className="w-3 h-3" />
              <span>{copiedCmd === "claude-code" ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <pre className="p-2.5 rounded bg-subtle text-foreground border border-border font-mono text-[10px] whitespace-pre-wrap break-all select-all">
            {claudeCodeCmd}
          </pre>
        </div>

        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-[11px] font-medium text-muted">
            <span>Cursor / Claude Desktop JSON</span>
            <button
              type="button"
              onClick={() => handleCopyCmd(claudeDesktopConfig, "claude-desktop")}
              className="text-[10px] text-[#6B9A35] dark:text-[#A8D666] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Icon icon={copiedCmd === "claude-desktop" ? "lucide:check" : "lucide:copy"} className="w-3 h-3" />
              <span>{copiedCmd === "claude-desktop" ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <pre className="p-2.5 rounded bg-subtle text-foreground border border-border font-mono text-[10px] whitespace-pre-wrap break-all select-all">
            {claudeDesktopConfig}
          </pre>
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-4 text-[11px]">
          <span className="text-muted">
            {t("dt.mcp.apiKeyHint") || "Need an API key? Generate one in"}{" "}
            <a href="/settings?tab=integrations#bugsnap-api-keys" className="font-semibold text-[#6B9A35] dark:text-[#A8D666] hover:underline">
              {t("dt.mcp.settingsLink") || "Settings → BugSnap API Keys"}
            </a>
          </span>
          <a
            href="/docs/mcp"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#6B9A35] dark:text-[#A8D666] font-semibold hover:underline flex items-center gap-1 ml-auto"
          >
            <span>{t("dt.mcp.docsLink") || "View Full MCP Tutorial"}</span>
            <Icon icon="lucide:external-link" className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default function DevToolsPanel({ capture, currentTime, onSeekToTime, unlockPassword = null, className }: Props) {
  const { t } = useT();
  const [activeTab, setActiveTab] = useState<Tab>("Info");
  const [consoleErrorsOnly, setConsoleErrorsOnly] = useState(false);
  const [networkStatusFilter, setNetworkStatusFilter] = useState<"all" | "4xx" | "5xx" | "failed">("all");
  // Which request the detail pane is showing, and which of its sub-tabs.
  const [selectedNetworkKey, setSelectedNetworkKey] = useState<string | null>(null);
  const [netDetailTab, setNetDetailTab] = useState<NetDetailTab>("headers");
  // Console level filter: a capture with 90 info rows and 2 errors is unreadable
  // without one, and the Errors-only toggle cannot isolate warnings.
  const [consoleLevelFilter, setConsoleLevelFilter] = useState<"all" | "error" | "warn" | "info" | "log" | "debug">("all");
  // Actions was the only list tab with no chips - just the shared search box.
  const [actionKindFilter, setActionKindFilter] = useState<string>("all");
  const [logSearch, setLogSearch] = useState("");
  const [consoleLimit, setConsoleLimit] = useState(100);
  const [networkLimit, setNetworkLimit] = useState(100);
  const resetLogFilters = useCallback(() => {
    setLogSearch("");
    setConsoleErrorsOnly(false);
    setNetworkStatusFilter("all");
    setSelectedNetworkKey(null);
    setConsoleLevelFilter("all");
    setActionKindFilter("all");
    setConsoleLimit(100);
    setNetworkLimit(100);
  }, []);
  // Always null on mount; the effect below resolves and sets this so that
  // capture switches never flash the previous capture's logs.
  const [decompressedLogs, setDecompressedLogs] = useState<CapturedLogs>(null);
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
    // Reset all filter/search state when the capture changes so stale filters
    // from the previous capture never hide rows in the new one.
    resetLogFilters();
    setActiveTab("Info");
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
        .then(async ({ data }) => {
          const token = data.session?.access_token;
          // Protected public capture: no session to send, so trade the unlock
          // password for the same short-lived signature the media tags use.
          let sigQuery = "";
          if (unlockPassword) {
            const sigRes = await fetch("/api/google-drive/sign", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({ fileId, password: unlockPassword }),
            }).catch(() => null);
            if (sigRes?.ok) {
              const { sig, exp } = await sigRes.json();
              if (sig) sigQuery = `&sig=${encodeURIComponent(sig)}&exp=${exp}`;
            }
          }
          return fetch(`/api/google-drive/download?id=${encodeURIComponent(fileId)}&type=logs${sigQuery}`, {
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
    } else if (typeof capture.dev_logs === "string" && capture.dev_logs.startsWith("gz:")) {
      decompressDevLogs(capture.dev_logs).then((res) => {
        if (!cancelled && res) setDecompressedLogs(res as CapturedLogs);
      });
    } else {
      // `raw`, not capture.dev_logs: stringified JSON was already parsed above,
      // and storing the string back makes Array.isArray() false - the panel then
      // renders zero console/network/storage rows for a capture that has them.
      setDecompressedLogs((raw as CapturedLogs) || null);
    }

    return () => {
      cancelled = true;
    };
  }, [capture.dev_logs, unlockPassword, resetLogFilters]);

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
    // If it's not a video (e.g. screenshot or image), there is no video timeline, so display absolute wall clock time.
    const isStaticCapture = capture.type !== "video";
    const rawTs = log.timestamp;
    const parsedTs = typeof rawTs === "number" ? rawTs : rawTs ? new Date(rawTs).getTime() : NaN;
    if (isStaticCapture && !isNaN(parsedTs) && parsedTs > 0) {
      return new Date(parsedTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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

  // Video timeline navigation is triggered exclusively via the visible time badge button
  // (renderTimeBadge). The log row itself remains unattached to click handlers so users
  // can select text, inspect stack traces, or expand details without jumping the video.

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
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-100 hover:bg-[#89BD49]/20 text-muted hover:text-[#6B9A35] dark:bg-zinc-800 dark:hover:bg-[#89BD49]/25 dark:hover:text-[#A8D666] border border-border/80 transition-colors cursor-pointer shrink-0"
          title={t("dt.jumpVideoTo", { time: relTime })}
        >
          <span className="text-[8px] text-[#6B9A35] dark:text-[#A8D666]">▶</span>
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
      dedupeNetworkLogs(
        logs
          .map((l, srcIdx) => (l.type === "network" ? { ...l, srcIdx } : null))
          .filter((l): l is NetworkLog & { srcIdx: number } => l !== null && !isTracker(l.url))
      ),
    [logs]
  );
  const networkLogs = useMemo(
    () => allNetworkLogs.filter((l) => matchesSearch(`${l.url || ""} ${l.method || ""} ${l.status || ""}`)),
    [allNetworkLogs, matchesSearch]
  );

  const eventTime = (log: TimedLog) => log.time || log.timestamp || "";

  const allConsoleLogs = useMemo<(ConsoleLog & { srcIdx: number; count: number })[]>(
    () =>
      groupConsoleLogs(
        logs
          .map((log, srcIdx) => ({ log, srcIdx }))
          .filter((e): e is { log: ConsoleLog; srcIdx: number } => e.log.type === "console")
          .filter(({ log }) => !isTracker(consoleDetail(log)))
          .map(({ log, srcIdx }) => ({ ...log, srcIdx, count: logCount(log) }))
      ),
    [logs]
  );
  const consoleLogs = useMemo(
    () => allConsoleLogs.filter((log) => matchesSearch(consoleDetail(log))),
    [allConsoleLogs, matchesSearch]
  );

  const allActionLogs = useMemo(
    () =>
      groupActionLogs(
        logs
          .map((log, srcIdx) => ({ log, srcIdx }))
          .filter((e): e is { log: ActionLog | NavigationLog | ScreenshotLog; srcIdx: number } =>
            e.log.type === "step" || e.log.type === "navigation" || e.log.type === "screenshot")
          .filter(({ log }) => !isDeadAction(log))
          .map(({ log, srcIdx }) => ({ ...log, srcIdx, message: cleanActionMessage(log.message), count: logCount(log) }))
      ),
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

  // One row per captured request, in capture order. Grouping repeats
  // into one row with a count chip discards each attempt's own status and
  // timing, which is what you read when a retry succeeded and the first did
  // not. Same-millisecond double-reports from the two capture sources are
  // already collapsed upstream in insertDevLog, so these rows are real.
  const groupedNetworkLogs = useMemo(
    () => networkLogs.map((log) => ({ log: { ...log, url: canonicalUrl(log.url) }, count: logCount(log) })),
    [networkLogs]
  );

  const performanceLog = useMemo(
    () => logs.findLast((l): l is PerformanceLog => l.type === "performance"),
    [logs]
  );
  const metrics = performanceLog?.metrics;

  const consoleErrors = useMemo(
    () => consoleLogs.filter((l) => isConsoleError(l)),
    [consoleLogs]
  );
  const networkErrors = useMemo(() => networkLogs.filter(isNetworkFailed), [networkLogs]);

  const visibleConsoleLogs = useMemo(
    () => {
      const base = consoleErrorsOnly
        ? consoleLogs.filter((l) => isConsoleError(l))
        : consoleLogs;
      if (consoleLevelFilter === "all") return base;
      return base.filter((l) => normalizeLevel(l.level) === consoleLevelFilter);
    },
    [consoleLogs, consoleErrorsOnly, consoleLevelFilter]
  );

  const consoleLevelCounts = useMemo(() => {
    const counts = new Map<string, number>();
    allConsoleLogs.forEach((l) => {
      if (l.type !== "console") return;
      const lvl = normalizeLevel(l.level);
      counts.set(lvl, (counts.get(lvl) || 0) + 1);
    });
    return counts;
  }, [allConsoleLogs]);

  const visibleGroupedNetworkLogs = useMemo(
    () =>
      groupedNetworkLogs
        .filter(({ log }) => {
          if (networkStatusFilter === "all") return true;
          const status = log.status ?? 0;
          if (networkStatusFilter === "4xx") return status >= 400 && status < 500;
          if (networkStatusFilter === "5xx") return status >= 500;
          if (networkStatusFilter === "failed") return isNetworkFailed(log) && status < 400;
          return true;
        }),
    [groupedNetworkLogs, networkStatusFilter]
  );

  const count4xx = useMemo(
    () => networkLogs.filter((l) => (l.status ?? 0) >= 400 && (l.status ?? 0) < 500).length,
    [networkLogs]
  );
  const count5xx = useMemo(
    () => networkLogs.filter((l) => (l.status ?? 0) >= 500).length,
    [networkLogs]
  );
  const countFailed = useMemo(
    () => networkLogs.filter((l) => isNetworkFailed(l) && (!l.status || l.status < 400)).length,
    [networkLogs]
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

  const storageLog = logs.findLast((l): l is StorageLog => l.type === "storage");
  const storageData = storageLog?.storage;
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
  // withSeconds=false is for the Info row, where the full string wrapped mid-date at 360px.
  const formatDateWithTz = (dateStr: string, withSeconds = true) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";

    const opts: Intl.DateTimeFormatOptions = {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
      ...(withSeconds ? { second: "2-digit" as const } : {}),
      timeZoneName: "short",
    };

    if (timeZoneMode === "utc") return d.toLocaleString("en-US", { ...opts, timeZone: "UTC" });
    // Indonesia / Default capture timezone or standard capture locale
    if (timeZoneMode === "capture") return d.toLocaleString("en-US", { ...opts, timeZone: "Asia/Jakarta" });
    // "local" mode uses viewer's local browser timezone
    return d.toLocaleString("en-US", opts);
  };

  const createdAt = formatDateWithTz(capture.created_at);
  const createdAtShort = formatDateWithTz(capture.created_at, false);

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

  const handleOpenGitHubIssue = (e?: React.MouseEvent) => {
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
      try {
        navigator.clipboard.writeText(report);
      } catch {}

      const defaultTitle = `Bug: Issue detected on ${targetHost || "session"}`;
      const repo = window.prompt(
        t("dt.promptGithubRepo") || "Enter GitHub repository (owner/repo):",
        ""
      );

      let issueUrl = "https://github.com/issues";
      if (repo && repo.trim()) {
        const cleanRepo = repo.trim().replace(/^https?:\/\/github\.com\//i, "").replace(/\/$/, "");
        if (cleanRepo.includes("/")) {
          const bodyParam = report.length > 4000 ? `${report.slice(0, 3950)}\n\n...(Full report copied to clipboard)` : report;
          issueUrl = `https://github.com/${cleanRepo}/issues/new?title=${encodeURIComponent(defaultTitle)}&body=${encodeURIComponent(bodyParam)}`;
        }
      }

      window.open(issueUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Failed to open GitHub issue:", err);
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
    if (tab === "Console") return allConsoleLogs.length;
    // Rows, which now equal captured requests - the badge and the table cannot
    // disagree because they count the same list.
    if (tab === "Network") return allNetworkLogs.length;
    if (tab === "Actions") return allActionLogs.length;
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
    if (tab === "MCP") return t("dt.tab.mcp") || "MCP";
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
          { key: "console", label: tabName("Console"), n: consoleLogs.length },
          { key: "network", label: tabName("Network"), n: networkLogs.length },
          { key: "actions", label: tabName("Actions"), n: actionLogs.length },
        ];
    const total = summary
      ? rows.reduce((sum, r) => sum + r.n, 0)
      : consoleLogs.length + networkLogs.length + actionLogs.length;
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
    <div className={`w-full rounded-xl border border-border bg-white shadow-sm dark:bg-background flex flex-col shrink-0 ${activeTab === "Network" && selectedNetworkKey ? "min-h-[34rem] " : ""}max-h-[520px] sm:max-h-[600px] xl:max-h-[calc(100vh-16rem)] overflow-hidden ${className || ""}`}>
      <div className="h-11 border-b border-border px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-foreground">{t("v.devTools")}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* <details> instead of a bare pill: the number alone never said what it
              counted. Native disclosure - no state, no outside-click handler. */}
          <details ref={eventMenuRef} className="relative group">
            <summary className="list-none cursor-pointer flex items-center gap-1 text-[10px] font-semibold text-[#6B9A35] dark:text-[#A8D666] bg-[#89BD49]/10 dark:bg-[#89BD49]/20 px-2 py-0.5 rounded-md border border-[#89BD49]/25 dark:border-[#89BD49]/30 hover:bg-[#89BD49]/20 dark:hover:bg-[#89BD49]/30 transition-colors">
              <span className="tabular-nums">{eventBreakdown.label}</span>
              <Icon icon="lucide:chevron-down" className="w-2.5 h-2.5 transition-transform group-open:rotate-180" />
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
                  ? "text-[#6B9A35] dark:text-[#A8D666] font-semibold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {tabName(tab)}
              {count > 0 && (
                <span className={`px-1 py-px rounded text-[9px] font-semibold leading-none tabular-nums ${
                  activeTab === tab
                    ? "bg-[#89BD49]/15 text-[#6B9A35] dark:bg-[#89BD49]/20 dark:text-[#A8D666]"
                    : "bg-subtle text-muted"
                }`}>{count}</span>
              )}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#89BD49]" />
              )}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="dt-tabpanel"
        aria-labelledby={`dt-tab-${activeTab}`}
        className="flex-1 min-h-0 flex flex-col overflow-hidden"
      >
        {/* Global Search & Filters */}
        {activeTab !== "Info" && activeTab !== "MCP" && (
          <div className="p-3 border-b border-border bg-subtle/30 flex flex-col gap-2 shrink-0">
            <div className="relative">
              <Icon icon="lucide:search" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
              <input
                type="text"
                placeholder={t("dt.search", { tab: tabLabel(activeTab) })}
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 rounded-lg border border-border text-xs bg-subtle outline-none focus:border-[#89BD49] focus:ring-1 focus:ring-[#89BD49]/30 shadow-sm"
              />
              {logSearch && (
                <button
                  type="button"
                  onClick={() => setLogSearch("")}
                  aria-label={t("dt.clearSearch") || "Clear search"}
                  title={t("dt.clearSearch") || "Clear search"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  <Icon icon="lucide:x" className="w-3.5 h-3.5" />
                </button>
              )}
              <span role="status" aria-live="polite" className="sr-only">
                {logSearch && searchMatchCount() !== null
                  ? t("dt.searchResults", { n: searchMatchCount() as number })
                  : ""}
              </span>
            </div>
            {/* Quick Filter for Console */}
            {activeTab === "Console" && consoleLevelCounts.size > 1 && (
              <div className="flex items-center gap-1.5 pt-0.5">
                <label htmlFor="dt-level" className="sr-only">
                  {t("dt.levelFilter") || "Filter by level"}
                </label>
                <select
                  id="dt-level"
                  value={consoleLevelFilter}
                  onChange={(e) => setConsoleLevelFilter(e.target.value as typeof consoleLevelFilter)}
                  className="px-2 py-1 rounded-md text-[10px] font-medium bg-subtle border border-border text-foreground cursor-pointer hover:bg-subtle/80 transition-colors"
                >
                  <option value="all">{t("dt.allLevels") || "All levels"}</option>
                  {(["error", "warn", "info", "log", "debug"] as const)
                    .filter((lvl) => consoleLevelCounts.has(lvl))
                    .map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {`${t(`dt.lvl.${lvl}`) || lvl} (${consoleLevelCounts.get(lvl)})`}
                      </option>
                    ))}
                </select>
              </div>
            )}
            {/* A two-state toggle rendered as two buttons read as two filters;
                BugSnap uses one checkbox, which is what the control actually is. */}
            {activeTab === "Console" && consoleErrors.length > 0 && (
              <div className="flex items-center gap-1.5 pt-0.5">
                <label className="flex items-center gap-1.5 text-[10px] font-medium text-muted hover:text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={consoleErrorsOnly}
                    onChange={(e) => setConsoleErrorsOnly(e.target.checked)}
                    className="w-3 h-3 rounded border-border accent-red-600 cursor-pointer"
                  />
                  <span className={consoleErrorsOnly ? "text-red-700 dark:text-red-300 font-semibold" : ""}>
                    {t("dt.errorsOnly") || "Errors only"}
                  </span>
                  <span className="tabular-nums">({consoleErrors.length})</span>
                </label>
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
                            ? "bg-[#89BD49]/15 text-[#6B9A35] border border-[#89BD49]/30 dark:bg-[#89BD49]/20 dark:text-[#A8D666] dark:border-[#89BD49]/40 font-semibold"
                            : "text-muted hover:text-foreground border border-transparent"
                        }`}
                      >
                        {k === "all"
                          ? `${t("dt.all") || "All"} (${allActionLogs.length})`
                          : `${t(`dt.act.${k}`)} (${actionKindCounts.get(k)})`}
                      </button>
                    );
                  })}
              </div>
            )}
            {/* Quick Filter for Network */}
            {activeTab === "Network" && (
              <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5">
                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                  {networkErrors.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setNetworkStatusFilter("all")}
                        aria-pressed={networkStatusFilter === "all"}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${
                          networkStatusFilter === "all"
                            ? "bg-subtle text-foreground border border-border font-semibold"
                            : "text-muted hover:text-foreground border border-transparent"
                        }`}
                      >
                        {t("dt.allStatuses") || "All"}
                      </button>
                      {count4xx > 0 && (
                        <button
                          type="button"
                          onClick={() => setNetworkStatusFilter(networkStatusFilter === "4xx" ? "all" : "4xx")}
                          aria-pressed={networkStatusFilter === "4xx"}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                            networkStatusFilter === "4xx"
                              ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40 font-semibold"
                              : "text-amber-600/80 hover:text-amber-700 border border-transparent"
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          {t("dt.status4xx") || "4xx"} ({count4xx})
                        </button>
                      )}
                      {count5xx > 0 && (
                        <button
                          type="button"
                          onClick={() => setNetworkStatusFilter(networkStatusFilter === "5xx" ? "all" : "5xx")}
                          aria-pressed={networkStatusFilter === "5xx"}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                            networkStatusFilter === "5xx"
                              ? "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/40 font-semibold"
                              : "text-red-600/80 hover:text-red-700 border border-transparent"
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          {t("dt.status5xx") || "5xx"} ({count5xx})
                        </button>
                      )}
                      {countFailed > 0 && (
                        <button
                          type="button"
                          onClick={() => setNetworkStatusFilter(networkStatusFilter === "failed" ? "all" : "failed")}
                          aria-pressed={networkStatusFilter === "failed"}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                            networkStatusFilter === "failed"
                              ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40 font-semibold"
                              : "text-rose-600/80 hover:text-rose-700 border border-transparent"
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          {t("dt.statusFailed") || "Failed"} ({countFailed})
                        </button>
                      )}
                    </>
                  )}
                </div>

                {networkLogs.length > 0 && (
                  <button
                    type="button"
                    onClick={handleExportHar}
                    className="px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors bg-subtle hover:bg-subtle/80 text-muted hover:text-foreground border border-border flex items-center gap-1 cursor-pointer ml-auto shrink-0"
                    title={t("dt.exportHar") || "Export network session as HTTP Archive (.har)"}
                  >
                    <Icon icon="lucide:download" className="w-3 h-3" />
                    <span>{t("dt.exportHar") || "Export HAR"}</span>
                  </button>
                )}
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
                {/^https?:\/\//i.test(capture.site_url) ? (
                  <a
                    href={capture.site_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-[11px] font-mono text-[#6B9A35] dark:text-[#A8D666] hover:underline bg-subtle/60 border border-border rounded-lg px-3 py-2 break-all"
                  >
                    {capture.site_url}
                  </a>
                ) : (
                  <span className="block text-[11px] font-mono text-muted bg-subtle/60 border border-border rounded-lg px-3 py-2 break-all">
                    {capture.site_url}
                  </span>
                )}
              </div>
            )}

            <div className="rounded-xl border border-border overflow-visible bg-subtle shadow-sm">
              {/* Timestamp Row with Timezone Switcher Dropdown */}
              <div className="relative flex items-center justify-between gap-2 px-3 py-2 border-b border-border/60">
                <div className="flex items-center gap-2 text-muted shrink-0">
                  <Icon icon="lucide:clock" className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-xs">{t("dt.timestamp")}</span>
                </div>

                <div className="relative" ref={tzMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowTzMenu((prev) => !prev)}
                    className="flex items-center gap-1 text-[11px] sm:text-xs font-medium text-foreground hover:text-[#6B9A35] dark:hover:text-[#A8D666] px-1.5 py-0.5 rounded hover:bg-subtle/80 transition-colors group cursor-pointer"
                    title={`${createdAt} · ${t("dt.changeTz")}`}
                  >
                    <span className="whitespace-nowrap">{createdAtShort}</span>
                    <Icon
                      icon="lucide:chevron-down"
                      className={`w-3 h-3 transition-transform ${showTzMenu ? "rotate-180" : ""}`}
                    />
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
                          timeZoneMode === "capture" ? "bg-[#89BD49]/15 dark:bg-[#89BD49]/20 text-[#6B9A35] dark:text-[#A8D666] font-semibold" : "text-foreground hover:bg-subtle/70"
                        }`}
                      >
                        <div>
                          <p className="leading-none">Captured time</p>
                          <p className="text-[10px] text-muted mt-0.5 font-normal">Asia/Jakarta (GMT+7)</p>
                        </div>
                        {timeZoneMode === "capture" && (
                          <Icon icon="lucide:check" className="w-3.5 h-3.5 shrink-0" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => { setTimeZoneMode("local"); setShowTzMenu(false); }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors ${
                          timeZoneMode === "local" ? "bg-[#89BD49]/15 dark:bg-[#89BD49]/20 text-[#6B9A35] dark:text-[#A8D666] font-semibold" : "text-foreground hover:bg-subtle/70"
                        }`}
                      >
                        <div>
                          <p className="leading-none">Your time (Local)</p>
                          <p className="text-[10px] text-muted mt-0.5 font-normal">
                            {typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "Device Time"}
                          </p>
                        </div>
                        {timeZoneMode === "local" && (
                          <Icon icon="lucide:check" className="w-3.5 h-3.5 shrink-0" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => { setTimeZoneMode("utc"); setShowTzMenu(false); }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors ${
                          timeZoneMode === "utc" ? "bg-[#89BD49]/15 dark:bg-[#89BD49]/20 text-[#6B9A35] dark:text-[#A8D666] font-semibold" : "text-foreground hover:bg-subtle/70"
                        }`}
                      >
                        <div>
                          <p className="leading-none">Universal time (UTC)</p>
                          <p className="text-[10px] text-muted mt-0.5 font-normal">UTC / GMT+0</p>
                        </div>
                        {timeZoneMode === "utc" && (
                          <Icon icon="lucide:check" className="w-3.5 h-3.5 shrink-0" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {(() => {
                const osLower = (detectedOs || "").toLowerCase();
                const osIcon = osLower.includes("win")
                  ? "lucide:monitor"
                  : osLower.includes("mac") || osLower.includes("apple") || osLower.includes("ios")
                  ? "lucide:laptop"
                  : osLower.includes("linux")
                  ? "lucide:terminal"
                  : "lucide:monitor";

                const browserLower = (detectedBrowser || "").toLowerCase();
                const browserIcon = browserLower.includes("chrome")
                  ? "lucide:chrome"
                  : browserLower.includes("firefox")
                  ? "lucide:globe"
                  : browserLower.includes("safari")
                  ? "lucide:compass"
                  : browserLower.includes("edge")
                  ? "lucide:globe"
                  : "lucide:globe";

                return [
                  {
                    icon: <Icon icon="lucide:map-pin" className="w-3.5 h-3.5 shrink-0" />,
                    labelKey: "dt.location",
                    value: "Indonesia",
                  },
                  {
                    icon: <Icon icon={osIcon} className="w-3.5 h-3.5 shrink-0" />,
                    labelKey: "dt.os",
                    value: detectedOs,
                  },
                  {
                    icon: <Icon icon={browserIcon} className="w-3.5 h-3.5 shrink-0" />,
                    labelKey: "dt.browser",
                    value: detectedBrowser,
                  },
                  {
                    icon: <Icon icon="lucide:maximize" className="w-3.5 h-3.5 shrink-0" />,
                    labelKey: "dt.windowSize",
                    value: capture.window_size || "-",
                  },
                ];
              })().map((row) => (
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
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted font-medium">JS Heap Memory</span>
                      {metrics.heapGrowthMB != null && metrics.heapGrowthMB > 0 && (
                        <span className="text-[9px] font-mono font-bold text-amber-600 dark:text-amber-400">
                          +{metrics.heapGrowthMB}MB
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono font-bold mt-1 text-foreground">
                      {metrics.jsHeapUsedMB != null ? `${metrics.jsHeapUsedMB} MB` : "-"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-border bg-subtle/80 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted font-medium">DOM Elements</span>
                      {metrics.domGrowthPct != null && metrics.domGrowthPct > 0 && (
                        <span className="text-[9px] font-mono font-bold text-amber-600 dark:text-amber-400">
                          +{metrics.domGrowthPct}%
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono font-bold mt-1 text-foreground">
                      {metrics.domNodes != null ? `${metrics.domNodes.toLocaleString()}` : "-"}
                    </span>
                  </div>
                </div>

                {/* SPA Health & Memory Alert */}
                {(metrics.spaHealth?.isBloated || metrics.spaHealth?.isMemoryLeakSuspected || (metrics.domNodes != null && metrics.domNodes > 3000)) && (
                  <div className={`mt-2.5 p-2.5 rounded-xl border flex flex-col gap-1 ${
                    metrics.spaHealth?.status === "critical"
                      ? "bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-300"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
                  }`}>
                    <div className="flex items-center gap-1.5 font-semibold text-xs">
                      <Icon icon={metrics.spaHealth?.status === "critical" ? "lucide:alert-octagon" : "lucide:alert-triangle"} className="w-3.5 h-3.5 shrink-0" />
                      <span>{t("dt.spaHealthAlert")}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed opacity-90">
                      {metrics.spaHealth?.warning || (
                        metrics.domNodes && metrics.domNodes > 3000
                          ? `${t("dt.domBloatWarning")}: ${metrics.domNodes.toLocaleString()} elements.`
                          : t("dt.memoryLeakWarning")
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Quick Export Bug Report Card - always stacked: this card only ever
                renders in the narrow DevTools sidebar, never a wide column, and a
                sm: (viewport-width) breakpoint doesn't know that - it was flipping
                to a cramped row on any desktop viewport regardless of how narrow
                the actual sidebar was. */}
            <div className="p-3 rounded-xl border border-[#89BD49]/30 dark:border-[#89BD49]/40 bg-[#89BD49]/10 dark:bg-[#89BD49]/15 flex flex-col gap-3 shadow-2xs">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Icon icon="lucide:clipboard-list" className="w-3.5 h-3.5 text-[#6B9A35] dark:text-[#A8D666] shrink-0" />
                  <span>Markdown Bug Report</span>
                </p>
                <p className="text-[11px] text-muted mt-0.5">
                  Environment, causality timeline, top errors, failed cURLs & reproduction steps.
                </p>
              </div>
              <div className="flex flex-col items-stretch gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleOpenGitHubIssue}
                  className="w-full justify-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-background hover:bg-subtle text-foreground border border-border shadow-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                  title={t("dt.openGithubIssue") || "Open in GitHub Issues"}
                >
                  <Icon icon="lucide:github" className="w-3.5 h-3.5 shrink-0" />
                  <span>{t("dt.openGithubIssue") || "Open in GitHub Issues"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyBugReport}
                  className="w-full justify-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#89BD49] hover:bg-[#6B9A35] text-white shadow-xs shadow-[#89BD49]/25 transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedBugReport ? (
                    <>
                      <Icon icon="lucide:check" className="w-3.5 h-3.5 shrink-0" />
                      <span>{t("dt.bugReportCopied") || "Report Copied!"}</span>
                    </>
                  ) : (
                    <>
                      <Icon icon="lucide:copy" className="w-3.5 h-3.5 shrink-0" />
                      <span>{t("dt.copyBugReport") || "Copy Bug Report"}</span>
                    </>
                  )}
                </button>
              </div>
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
                      <Icon icon="lucide:check" className="w-8 h-8 text-emerald-500/70" />
                      <p className="font-medium text-emerald-700 dark:text-emerald-400">{t("dt.pageRanClean")}</p>
                      <p className="text-[11px]">{t("dt.noConsoleErrors")}</p>
                    </div>
                  ) : (
                    <>
                      {/* Summary alert banner */}
                      <div className="flex items-center gap-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/80 dark:border-red-800/40 px-3.5 py-2.5 shadow-sm">
                        <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 flex items-center justify-center shrink-0 text-red-600 dark:text-red-400 text-xs font-bold">
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
                {visibleConsoleLogs.slice(0, consoleLimit).map((log) => {
                  const level = normalizeLevel(log.level);
                  const isWarn = level === "warn";
                  const isErr = level === "error";
                  const preceding = isErr ? findPrecedingAction(log, log.srcIdx) : null;
                  const detail = conciseConsoleText(log) || t("dt.consoleError");
                  const fullText = consoleText(log);
                  const active = isLogActive(log);
                  return (
                    <div
                      key={log.srcIdx}
                      className={`group p-3 text-xs transition-all ${
                        active ? "ring-2 ring-[#89BD49] bg-[#89BD49]/10 dark:bg-[#89BD49]/20 rounded-sm" : isWarn ? "bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50/70 dark:hover:bg-amber-950/30" : isErr ? "bg-red-50/40 dark:bg-red-950/20 hover:bg-red-50/70 dark:hover:bg-red-950/30" : "hover:bg-subtle/50"
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
                          {cleanStackTrace(log.stack) ? (
                            <details className="group mt-2">
                              <summary className="flex list-none cursor-pointer items-center gap-1 text-[10px] font-semibold text-muted hover:text-foreground">
                                <Icon icon="lucide:chevron-right" className="w-3 h-3 transition-transform group-open:rotate-90" />
                                {t("dt.stack")}
                              </summary>
                              <pre className="mt-1.5 p-2 rounded-lg bg-subtle text-foreground border border-border font-mono text-[10px] leading-relaxed whitespace-pre-wrap break-all overflow-x-auto">
                                {cleanStackTrace(log.stack)}
                              </pre>
                            </details>
                          ) : null}
                        </div>
                        {logCount(log) > 1 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-[#89BD49]/15 dark:bg-[#89BD49]/20 text-[10px] font-bold text-[#6B9A35] dark:text-[#A8D666] border border-[#89BD49]/30 dark:border-[#89BD49]/40 shrink-0 tabular-nums">
                            ×{logCount(log)}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleCopyConsole(log, e)}
                          aria-label={t("dt.copyLog") || "Copy log"}
                          title={t("dt.copyLog") || "Copy log"}
                          className="shrink-0 p-1 rounded text-muted opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-foreground hover:bg-subtle transition-all cursor-pointer"
                        >
                          {copiedConsole === consoleText(log) ? (
                            <Icon icon="lucide:check" className="w-3.5 h-3.5" />
                          ) : (
                            <Icon icon="lucide:copy" className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
                {visibleConsoleLogs.length > consoleLimit && (
                  <button
                    type="button"
                    onClick={() => setConsoleLimit((prev) => prev + 100)}
                    className="w-full py-2.5 text-center text-xs font-semibold text-muted hover:text-foreground hover:bg-subtle border-t border-border transition-colors"
                  >
                    Load more ({visibleConsoleLogs.length - consoleLimit} remaining)
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* NETWORK TAB */}
        {activeTab === "Network" && (
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
            {networkLogs.length === 0 ? (
              summary ? (
                <div className="p-4 space-y-3">
                  {summary.failedRequests === 0 ? (
                    <div className="py-10 flex flex-col items-center gap-2 text-center text-xs text-muted">
                      <Icon icon="lucide:check" className="w-8 h-8 text-emerald-500/70" />
                      <p className="font-medium text-emerald-700 dark:text-emerald-400">{t("dt.noFailedRequests")}</p>
                      <p className="text-[11px]">{t("dt.allNetworkOk")}</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/80 dark:border-red-800/40 px-3.5 py-2.5 shadow-sm">
                        <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 flex items-center justify-center shrink-0 text-red-600 dark:text-red-400 text-xs font-bold">
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
                  filtered={networkStatusFilter !== "all" || Boolean(logSearch)}
                  emptyText={t("dt.noNetworkErrors")}
                  onReset={resetLogFilters}
                  t={t}
                />
            ) : (
              <NetworkTable
                rows={visibleGroupedNetworkLogs}
                limit={networkLimit}
                onLoadMore={() => setNetworkLimit((prev) => prev + 100)}
                selectedKey={selectedNetworkKey}
                onSelect={setSelectedNetworkKey}
                detailTab={netDetailTab}
                onDetailTab={setNetDetailTab}
                targetHost={targetHost}
                partyIsMixed={partyIsMixed}
                isLogActive={isLogActive}
                findPrecedingAction={findPrecedingAction}
                onCopyCurl={handleCopyCurl}
                onCopyUrl={handleCopyUrl}
                copiedCurl={copiedCurl}
                copiedUrl={copiedUrl}
                t={t}
              />
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
                  <Icon icon="lucide:mouse-pointer" className="w-8 h-8 opacity-30" />
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

                  return (
                    <div
                      key={log.srcIdx}
                      className={`group flex items-start gap-2.5 p-2.5 rounded-lg border transition-all ${
                        active
                          ? "ring-2 ring-[#89BD49] bg-[#89BD49]/10 dark:bg-[#89BD49]/20 border-[#89BD49]/30 dark:border-[#89BD49]/40 shadow-xs"
                          : "bg-background hover:bg-subtle/50 border-border/80"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${
                          isScreenshot
                            ? "bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40"
                            : isClick
                            ? "bg-[#89BD49]/20 dark:bg-[#89BD49]/25 text-[#6B9A35] dark:text-[#A8D666] border border-[#89BD49]/30 dark:border-[#89BD49]/40"
                            : isType
                            ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40"
                            : "bg-subtle text-muted border border-border"
                        }`}
                      >
                        {isScreenshot ? (
                          <Icon icon="lucide:camera" className="w-3.5 h-3.5" />
                        ) : isClick ? (
                          <Icon icon="lucide:mouse-pointer-click" className="w-3.5 h-3.5" />
                        ) : isType ? (
                          <Icon icon="lucide:keyboard" className="w-3.5 h-3.5" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-current" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                isScreenshot
                                  ? "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/40"
                                  : isClick
                                  ? "bg-[#89BD49]/15 dark:bg-[#89BD49]/20 text-[#6B9A35] dark:text-[#A8D666] border border-[#89BD49]/30 dark:border-[#89BD49]/40"
                                  : isType
                                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40"
                                  : "bg-subtle text-muted border border-border"
                              }`}
                            >
                              {label}
                            </span>
                            {logCount(log) > 1 && (
                              <span className="px-1.5 py-0.5 rounded-md bg-[#89BD49]/15 dark:bg-[#89BD49]/20 text-[10px] font-bold text-[#6B9A35] dark:text-[#A8D666] border border-[#89BD49]/30 dark:border-[#89BD49]/40 shrink-0">
                                ×{logCount(log)}
                              </span>
                            )}
                          </div>
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

        {/* MCP TAB */}
        {activeTab === "MCP" && (
          <McpTabPanel
            capture={capture}
            consoleErrors={consoleErrors}
            networkFailures={networkErrors}
            t={t}
          />
        )}
      </div>
    </div>
  );
}
