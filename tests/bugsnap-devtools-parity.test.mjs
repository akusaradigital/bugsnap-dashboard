import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Parity checks against the BugSnap DevTools capture specifications.
// Each case validates the exact requirements for headers, telemetry,
// and console logging across the extension and dashboard.
//
// The suite runs plain `node --test` with no TypeScript loader, so these assert
// against source text - same approach as tests/redact.test.mjs, which diffs the
// inlined redactor literal against redact.js.

const here = dirname(fileURLToPath(import.meta.url));
const dashboardRoot = join(here, "..");
const root = join(here, "..", "..");

const read = (p) => {
  const relPath = p.replace(/^bugsnap-dashboard\//, "");
  const inDashboard = join(dashboardRoot, relPath);
  if (existsSync(inDashboard)) return readFileSync(inDashboard, "utf8");
  const inRoot = join(root, p);
  if (existsSync(inRoot)) return readFileSync(inRoot, "utf8");
  return null;
};

const logger = read("bugsnap-extension/injected_logger.js");
const background = read("bugsnap-extension/background.js");
const devlogs = read("bugsnap-dashboard/src/lib/devlogs.ts");
const exporters = read("bugsnap-dashboard/src/lib/devlogs-export.ts");
const panel = read("bugsnap-dashboard/src/components/DevToolsPanel.tsx");
const i18n = read("bugsnap-dashboard/src/lib/i18n/devtools.ts");

// BugSnap: injected_logger stores fetchDetails.requestHeaders /
// responseHeaders on every intercepted fetch and XHR.
test("network captures request and response headers", (t) => {
  if (!logger) return t.skip("bugsnap-extension sibling directory not present in CI environment");
  assert.match(logger, /collectHeaders\s*=/, "logger needs a header normaliser");
  assert.match(logger, /requestHeaders: reqHeaders/, "fetch must attach request headers");
  assert.match(logger, /responseHeaders: collectHeaders\(response\.headers\)/, "fetch must attach response headers");
  assert.match(logger, /getAllResponseHeaders/, "XHR must read response headers");
  assert.match(logger, /XHR\.prototype\.setRequestHeader = function/, "XHR must record request headers");
});

test("header values are redacted before leaving the page", (t) => {
  if (!logger) return t.skip("bugsnap-extension sibling directory not present in CI environment");
  assert.match(logger, /SENSITIVE_HEADER_RE/, "a sensitive-header matcher must exist");
  for (const name of ["authorization", "cookie", "set-cookie", "x-api-key"]) {
    assert.match(logger, new RegExp(name), `${name} must be in the redaction set`);
  }
  assert.match(logger, /entry\.requestHeaders = redactHeaderMap/, "redaction runs on every entry, not per emit site");
});

// BugSnap: injected_logger rrweb/console patches the full level list and
// records a parsed stack for each call.
test("console patches BugSnap full level list", (t) => {
  if (!logger) return t.skip("bugsnap-extension sibling directory not present in CI environment");
  const fullLevels = ["debug", "error", "info", "log", "table", "trace", "warn", "assert", "dir", "group", "groupCollapsed", "count"];
  const declared = /const CONSOLE_LEVELS = \[([^\]]+)\]/.exec(logger);
  assert.ok(declared, "CONSOLE_LEVELS must be declared");
  for (const lvl of fullLevels) {
    assert.ok(declared[1].includes(`'${lvl}'`), `console level ${lvl} must be intercepted`);
  }
});

test("console errors and warnings carry a call-site stack", (t) => {
  if (!logger) return t.skip("bugsnap-extension sibling directory not present in CI environment");
  assert.match(logger, /captureCallerStack/, "a stack capture helper must exist");
  assert.match(logger, /logEntry\.stack = captureCallerStack\(\)/, "warn/error rows must attach it");
});

test("console.assert only logs when the assertion fails", (t) => {
  if (!logger) return t.skip("bugsnap-extension sibling directory not present in CI environment");
  // BugSnap console plugin forwards assert as a level; wrapping it without
  // this guard turns every passing assert into a phantom error row.
  assert.match(logger, /level === 'assert' && args\[0\]/);
});

// BugSnap: injected_logger installs a WebSocket Proxy with open/message/
// close/send handlers.
test("WebSocket traffic is captured", (t) => {
  if (!logger) return t.skip("bugsnap-extension sibling directory not present in CI environment");
  assert.match(logger, /new Proxy\(NativeWS/, "WebSocket constructor must be proxied");
  for (const evt of ["open", "message", "error", "close"]) {
    assert.match(logger, new RegExp(`addEventListener\\('${evt}'`), `ws ${evt} must be observed`);
  }
  assert.match(logger, /WebSocket send/, "outbound frames must be recorded");
});

// BugSnap: navigator.sendBeacon hook.
test("sendBeacon traffic is captured", (t) => {
  if (!logger) return t.skip("bugsnap-extension sibling directory not present in CI environment");
  assert.match(logger, /navigator\.sendBeacon = function/, "sendBeacon must be wrapped");
  assert.match(logger, /resourceType: 'beacon'/, "beacons must be distinguishable in the panel");
});

test("the capture pipeline does not drop the new fields", (t) => {
  if (!background) return t.skip("bugsnap-extension sibling directory not present in CI environment");
  // The background normalizer whitelists fields; anything unlisted is silently
  // discarded before it ever reaches the dashboard.
  assert.match(background, /requestHeaders:\s*\r?\n\s*typeof logData\.requestHeaders/);
  assert.match(background, /responseHeaders:\s*\r?\n\s*typeof logData\.responseHeaders/);
  assert.match(background, /duplicate\.requestHeaders = logData\.requestHeaders/, "merging the two network sources must not drop headers");
  assert.match(background, /duplicate\.stack = logData\.stack/, "merging must not drop the console stack");
});

test("dashboard types and normalizer carry headers end to end", () => {
  assert.match(devlogs, /requestHeaders\?: Record<string, string>/);
  assert.match(devlogs, /responseHeaders\?: Record<string, string>/);
  assert.match(devlogs, /const requestHeaders = headerMap\(log\.requestHeaders\)/);
  assert.match(devlogs, /type: "network".*requestHeaders, responseHeaders/s, "normalizeDevLog must return them");
});

test("the Network tab renders headers", () => {
  assert.match(panel, /function HeaderTable\(/);
  assert.match(panel, /<HeaderTable headers=\{log\.requestHeaders\}/);
  assert.match(panel, /<HeaderTable headers=\{log\.responseHeaders\}/);
});

test("header labels exist in both locales", () => {
  for (const key of ["dt.requestHeaders", "dt.responseHeaders"]) {
    const hits = i18n.split(`"${key}"`).length - 1;
    assert.equal(hits, 2, `${key} must be defined in both en and id`);
  }
});

// BugSnap's export surface replays a request as it was actually sent.
test("cURL export replays the captured headers", () => {
  assert.match(exporters, /Object\.entries\(log\.requestHeaders \|\| \{\}\)/);
  assert.match(exporters, /hasContentType/, "must not double up Content-Type");
});

test("HAR export emits real headers and mime types", () => {
  assert.match(exporters, /function harHeaders\(/);
  assert.match(exporters, /function mimeOf\(/);
  assert.match(exporters, /headers: harHeaders\(log\.requestHeaders, reqBody\)/);
  assert.match(exporters, /headers: harHeaders\(log\.responseHeaders, resBody\)/);
  assert.doesNotMatch(
    exporters,
    /headers: resBody \? \[\{ name: "Content-Type"/,
    "the hardcoded response Content-Type must be gone",
  );
});

// Behavioural checks: the helpers above are pure string builders, so they can
// be re-implemented here and exercised against real inputs.
test("cURL output is a replayable command with the captured headers", () => {
  const ALLOWED = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);
  // Mirrors buildCurlCommand in src/lib/devlogs-export.ts.
  const buildCurl = (log) => {
    const raw = (log.method || "GET").toUpperCase().trim();
    const method = ALLOWED.has(raw) ? raw : "GET";
    const url = (log.url || "").replace(/[\x00-\x1f\x7f]/g, "").trim().replace(/(["\\$`])/g, "\\$1");
    let cmd = `curl -X ${method} "${url}"`;
    const entries = Object.entries(log.requestHeaders || {});
    for (const [name, value] of entries) {
      const n = String(name).replace(/[^\w.-]/g, "");
      if (!n) continue;
      const v = String(value).replace(/[\x00-\x1f\x7f]/g, "").replace(/(["\\$`])/g, "\\$1");
      cmd += ` -H "${n}: ${v}"`;
    }
    if (log.requestBody) {
      const body = log.requestBody.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "").replace(/'/g, "'\\''");
      if (!entries.some(([n]) => n.toLowerCase() === "content-type")) cmd += ' -H "Content-Type: application/json"';
      cmd += ` -d '${body}'`;
    }
    return cmd;
  };

  const cmd = buildCurl({
    method: "POST",
    url: "https://api.example.com/orders",
    requestHeaders: { "Content-Type": "application/graphql", "X-Request-Id": "abc123", Authorization: "[REDACTED]" },
    requestBody: '{"q":1}',
  });
  assert.match(cmd, /-H "Content-Type: application\/graphql"/);
  assert.match(cmd, /-H "X-Request-Id: abc123"/);
  assert.equal(cmd.match(/Content-Type/g).length, 1, "must not append a second Content-Type");
  assert.match(cmd, /-d '\{"q":1\}'/);
});

test("header redaction keeps names and removes secret values", () => {
  // Mirrors redactHeaderMap in injected_logger.js.
  const SENSITIVE = /^(?:authorization|proxy-authorization|cookie|set-cookie|x-api-key|x-auth-token|x-csrf-token|x-xsrf-token|api-key)$/i;
  const redactMap = (h) =>
    Object.fromEntries(Object.entries(h).map(([k, v]) => [k, SENSITIVE.test(k) ? "[REDACTED]" : String(v)]));

  const out = redactMap({
    Authorization: "Bearer eyJhbGciOi.secret.sig",
    Cookie: "session=abc",
    "Content-Type": "application/json",
    "X-Api-Key": "sk-live-123",
  });
  assert.equal(out.Authorization, "[REDACTED]");
  assert.equal(out.Cookie, "[REDACTED]");
  assert.equal(out["X-Api-Key"], "[REDACTED]");
  assert.equal(out["Content-Type"], "application/json", "benign headers must survive");
  assert.ok(Object.keys(out).includes("Authorization"), "names stay visible; only values are scrubbed");
});

// ---------------------------------------------------------------------------
// Panel surface specifications:
// a resource-type filter row, Type/Size/Time columns, a console level
// selector, and size/protocol in the per-request General block.
// ---------------------------------------------------------------------------

test("Network has resource-type classification buckets", () => {
  // Buckets: All | Fetch/XHR | WS | JS | CSS | Media | Font | Doc | Other
  assert.match(devlogs, /export type NetworkKind =/);
  for (const kind of ["fetchxhr", "ws", "js", "css", "media", "font", "doc", "other"]) {
    assert.match(devlogs, new RegExp(`"${kind}"`), `bucket ${kind} must exist`);
  }
  assert.match(panel, /networkKind\(log\)/, "Type must be derived per row");
});

test("Network is a real table with full column set", () => {
  assert.match(devlogs, /export function formatBytes/);
  assert.match(panel, /function NetworkTable\(/, "the list must be a table component");
  assert.match(panel, /<thead/, "a table needs a header row");
  // Name | Method | Status | Type | Size | Time | Waterfall
  for (const col of ["name", "method", "status", "type", "size", "time", "waterfall"]) {
    assert.match(panel, new RegExp(`dt\\.col\\.${col}`), `column ${col} must exist`);
  }
  assert.match(panel, /formatBytes\(log\.size\)/, "Size must render in its cell");
  assert.match(panel, /networkKind\(log\)/, "Type must be derived per row");
  assert.match(panel, /maxDuration/, "the waterfall bar needs a scale");
});

test("a selected request opens a detail pane with sub-tabs", () => {
  assert.match(panel, /function NetworkDetail\(/);
  assert.match(panel, /selectedNetworkKey/, "the table must track a selected row");
  const tabs = /const TABS: NetDetailTab\[\] = \[([^\]]+)\]/.exec(panel);
  assert.ok(tabs, "the detail pane must declare its sub-tab set");
  for (const tb of ["headers", "request", "response"]) {
    assert.ok(tabs[1].includes(`"${tb}"`), `sub-tab ${tb} must exist`);
  }
  assert.match(panel, /dt\.detail\.\$\{tb\}/, "sub-tab labels must be translated");
  // General block: Request URL / Request Method / Status Code
  for (const key of ["dt.general", "dt.requestUrl", "dt.requestMethod", "dt.statusCode"]) {
    assert.match(panel, new RegExp(key.replace(".", "\\.")), `${key} must render`);
  }
  assert.match(panel, /defaultOpen/, "headers are the content of the pane, not a collapsed extra");
});

test("changing filters cannot strand the detail pane", () => {
  // A selected row hidden by a filter would leave a pane describing a request
  // that is no longer in the list.
  const reset = /const resetLogFilters = useCallback\(\(\) => \{([\s\S]*?)\}, \[\]\);/.exec(panel);
  assert.ok(reset, "resetLogFilters must exist");
  assert.match(reset[1], /setSelectedNetworkKey\(null\)/);
});

test("table column labels exist in both locales", () => {
  const keys = [
    "dt.col.name", "dt.col.method", "dt.col.status", "dt.col.type",
    "dt.col.size", "dt.col.time", "dt.col.frame", "dt.col.waterfall",
    "dt.detail.headers", "dt.detail.request", "dt.detail.response", "dt.detail.timing",
    "dt.general", "dt.requestUrl", "dt.requestMethod", "dt.statusCode",
    "dt.occurrences", "dt.noHeaders", "dt.noRequestBody", "dt.closeDetail", "dt.loadMore",
    "dt.tab.mcp", "dt.mcp.title",
  ];
  for (const key of keys) {
    assert.equal(i18n.split(`"${key}"`).length - 1, 2, `${key} must be in both en and id`);
  }
});

test("size and protocol reach the dashboard types", () => {
  assert.match(devlogs, /size\?: number;/);
  assert.match(devlogs, /protocol\?: string;/);
  assert.match(devlogs, /const size = typeof log\.size === "number"/);
  if (background) {
    assert.match(background, /size: Number\.isFinite\(Number\(logData\.size\)\)/, "normalizer must keep size");
    assert.match(background, /protocol:\s*\r?\n?\s*typeof logData\.protocol === "string"/, "normalizer must keep protocol");
  }
});

test("size is sourced from resource timing, headers, and webRequest", (t) => {
  if (!logger || !background) return t.skip("bugsnap-extension sibling directory not present in CI environment");
  assert.match(logger, /resourceTiming/, "a resource-timing map must exist");
  assert.match(logger, /type: 'resource', buffered: true/, "resource entries must be observed");
  assert.match(logger, /nextHopProtocol/, "protocol comes from the timing entry");
  assert.match(logger, /content-length/, "declared length is the fallback");
  assert.match(background, /details\.responseSize/, "webRequest size covers static assets");
});

test("Console has a level selector, not just an errors toggle", () => {
  assert.match(panel, /consoleLevelFilter/);
  assert.match(panel, /dt\.allLevels/);
  assert.match(panel, /consoleLevelCounts/, "levels absent from the capture must not be offered");
});

test("new filters are cleared by Reset filters", () => {
  // A filter the reset button forgets is a dead end: the empty state tells the
  // user to reset, and resetting leaves the list still empty.
  const reset = /const resetLogFilters = useCallback\(\(\) => \{([\s\S]*?)\}, \[\]\);/.exec(panel);
  assert.ok(reset, "resetLogFilters must exist");
  assert.match(reset[1], /setNetworkStatusFilter\("all"\)/);
  assert.match(reset[1], /setConsoleLevelFilter\("all"\)/);
});

test("new labels exist in both locales", () => {
  const keys = [
    "dt.allLevels", "dt.levelFilter", "dt.kindFilter", "dt.size", "dt.protocol",
    "dt.lvl.error", "dt.lvl.warn", "dt.lvl.info", "dt.lvl.log", "dt.lvl.debug",
    "dt.kind.all", "dt.kind.fetchxhr", "dt.kind.ws", "dt.kind.js",
    "dt.kind.css", "dt.kind.media", "dt.kind.font", "dt.kind.doc", "dt.kind.other",
  ];
  for (const key of keys) {
    assert.equal(i18n.split(`"${key}"`).length - 1, 2, `${key} must be in both en and id`);
  }
});

// Behavioural: networkKind and formatBytes are pure, so exercise them directly.
test("networkKind buckets requests the way the chips claim", () => {
  // Mirrors networkKind in src/lib/devlogs.ts.
  const EXT = [
    [/\.(?:m?js|cjs|jsx?|tsx?)(?:[?#]|$)/i, "js"],
    [/\.(?:css|scss|sass|less)(?:[?#]|$)/i, "css"],
    [/\.(?:png|jpe?g|gif|webp|avif|svg|ico|bmp|mp4|webm|mp3|wav|ogg|mov)(?:[?#]|$)/i, "media"],
    [/\.(?:woff2?|ttf|otf|eot)(?:[?#]|$)/i, "font"],
    [/\.(?:html?|php)(?:[?#]|$)/i, "doc"],
  ];
  const kindOf = (log) => {
    const rt = (log.resourceType || "").toLowerCase();
    if (rt === "websocket" || (log.method || "").toUpperCase() === "WS") return "ws";
    if (rt === "xmlhttprequest" || rt === "fetch" || rt === "beacon" || rt === "ping") return "fetchxhr";
    if (rt === "script") return "js";
    if (rt === "stylesheet") return "css";
    if (rt === "image" || rt === "media") return "media";
    if (rt === "font") return "font";
    if (rt === "main_frame" || rt === "sub_frame" || rt === "document") return "doc";
    if (rt && rt !== "resource" && rt !== "other") return "other";
    const url = log.url || "";
    for (const [re, kind] of EXT) if (re.test(url)) return kind;
    if (/^wss?:\/\//i.test(url)) return "ws";
    return "fetchxhr";
  };

  assert.equal(kindOf({ resourceType: "websocket", url: "ws://x/s" }), "ws");
  assert.equal(kindOf({ method: "WS", url: "ws://x/s" }), "ws");
  assert.equal(kindOf({ resourceType: "beacon", url: "/collect" }), "fetchxhr");
  assert.equal(kindOf({ resourceType: "script", url: "/a" }), "js");
  assert.equal(kindOf({ resourceType: "stylesheet", url: "/a" }), "css");
  assert.equal(kindOf({ resourceType: "image", url: "/a" }), "media");
  assert.equal(kindOf({ resourceType: "font", url: "/a" }), "font");
  assert.equal(kindOf({ resourceType: "main_frame", url: "/" }), "doc");
  // No resourceType: the page-side patches set none, so fall back to the URL.
  assert.equal(kindOf({ url: "https://cdn.example.com/app.min.js" }), "js");
  assert.equal(kindOf({ url: "https://cdn.example.com/theme.css" }), "css");
  assert.equal(kindOf({ url: "https://cdn.example.com/hero.webp" }), "media");
  assert.equal(kindOf({ url: "https://cdn.example.com/Inter.woff2" }), "font");
  // A plain API call is what a fetch/XHR patch necessarily saw.
  assert.equal(kindOf({ url: "https://api.example.com/v1/orders" }), "fetchxhr");
  // A query string must not defeat extension matching.
  assert.equal(kindOf({ url: "https://cdn.example.com/app.js?v=9" }), "js");
});

test("formatBytes renders expected units", () => {
  const fmt = (n) => {
    if (n == null || !Number.isFinite(n) || n < 0) return "-";
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KiB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MiB`;
  };
  assert.equal(fmt(29), "29 B");
  assert.equal(fmt(4403), "4.3 KiB");
  assert.equal(fmt(2621440), "2.5 MiB");
  assert.equal(fmt(undefined), "-");
  assert.equal(fmt(-1), "-", "a negative size is not a size");
  assert.equal(fmt(0), "0 B", "zero bytes is a real answer, not unknown");
});

test("Frame column and Timing sub-tab exist", () => {
  assert.match(panel, /dt\.col\.frame/, "Frame column must be in the table header");
  assert.match(panel, /formatFrame\(log\.frameId\)/, "Frame must render in table rows");
  assert.match(panel, /"timing"/, "Timing sub-tab must exist in NetworkDetail");
  assert.match(devlogs, /frameId\?: number \| string;/, "NetworkLog must support frameId");
  assert.match(devlogs, /timings\?:/, "NetworkLog must support timings breakdown");
  if (background) {
    assert.match(background, /frameId:/, "background.js must normalize frameId");
    assert.match(background, /timings:/, "background.js must normalize timings");
  }
});

test("MCP tab is available in DevTools panel", () => {
  assert.match(panel, /"MCP"/, "MCP tab must exist in TABS");
  assert.match(panel, /function McpTabPanel/, "McpTabPanel component must exist");
  assert.match(panel, /dt\.mcp\.title/, "MCP title must be translated");
});

// ---------------------------------------------------------------------------
// The 89-vs-10 discrepancy: the Network badge summed `count`, so a page polling
// one endpoint 40 times showed "89" above a table holding 4 rows. BugSnap's
// number matches its row count. Counting rows is what makes the two agree.
// ---------------------------------------------------------------------------

test("every request is its own row", () => {
  // BugSnap lists /notifications four times within rows 1-10, so it
  // does not group repeats. Grouping them hid 61 captured requests behind 30
  // rows and threw away each attempt's status and timing.
  assert.match(
    panel,
    /const groupedNetworkLogs = useMemo\(\s*\r?\n\s*\(\) => networkLogs\.map\(/,
    "the network list must be a straight map, not a groupBy",
  );
  assert.doesNotMatch(
    panel,
    /groupedAllNetworkLogs/,
    "the pre-filter grouping existed only to feed the old badge",
  );
});

test("every tab badge equals the rows that tab renders", () => {
  // The reported symptom was a badge that disagreed with its own table.
  assert.match(panel, /if \(tab === "Network"\) return allNetworkLogs\.length;/);
  assert.doesNotMatch(
    panel,
    /if \(tab === "Network"\) return totalLogCount\(allNetworkLogs\);/,
    "summing occurrences is what made 61 requests read as 89",
  );
});

test("a row can still be identified after ungrouping", () => {
  // method+status+url now repeats across rows, so it cannot key one.
  assert.match(panel, /function rowKey\(log: NetworkLog & \{ srcIdx\?: number \}\)/);
  assert.match(panel, /log\.srcIdx \?\? "\?"/, "the capture index is the stable part");
});

test("row identity is unique for repeated polls", () => {
  // Mirrors rowKey in the panel.
  const rowKey = (l) => `${l.srcIdx ?? "?"}|${l.method || "GET"}|${l.status ?? "FAILED"}|${l.url}`;
  const polls = [
    { srcIdx: 3, method: "GET", status: 200, url: "https://api.example.com/notifications?limit=30" },
    { srcIdx: 9, method: "GET", status: 200, url: "https://api.example.com/notifications?limit=30" },
    { srcIdx: 14, method: "GET", status: 200, url: "https://api.example.com/notifications?limit=30" },
  ];
  const keys = new Set(polls.map(rowKey));
  assert.equal(keys.size, 3, "three polls of one endpoint are three distinct rows");

  // The old key collapsed them, which is why selecting one row highlighted all.
  const oldKey = (l) => `${l.method || "GET"}|${l.status ?? "FAILED"}|${l.url}`;
  assert.equal(new Set(polls.map(oldKey)).size, 1, "the old key could not tell them apart");
});

test("the detail pane slides in over the list", () => {
  assert.match(panel, /role="dialog"/, "an overlay needs a dialog role");
  assert.match(panel, /motion-safe:animate-slide-in-right/, "and slide in");
  assert.match(panel, /e\.key === "Escape"/, "Esc must close an overlay that covers the list");
});

test("the slide-in animation actually exists", () => {
  // tailwindcss-animate is NOT installed (plugins: []), so `animate-in
  // slide-in-from-right` compiles to nothing. The keyframe has to be local.
  const tw = read("bugsnap-dashboard/tailwind.config.ts");
  assert.match(tw, /"slide-in-right": \{/, "the keyframe must be defined");
  assert.match(tw, /"slide-in-right": "slide-in-right /, "and registered as an animation");
  assert.doesNotMatch(
    panel,
    /animate-in slide-in-from-right/,
    "that class needs a plugin this project does not have",
  );
});

// ---------------------------------------------------------------------------
// Column set and drawer geometry:
// a row-number column, a per-row type glyph, Domain as its own column, Frame,
// "(Cached)" in Time, an Errors-only checkbox, and a drawer that covers the
// panel cleanly.
// ---------------------------------------------------------------------------

test("the table carries full column set", () => {
  for (const col of ["name", "method", "status", "domain", "type", "size", "time", "frame", "waterfall"]) {
    assert.match(panel, new RegExp(`dt\\.col\\.${col}`), `column ${col} must exist`);
  }
  assert.match(panel, /w-9 text-right tabular-nums">#</, "rows must be numbered");
  assert.match(panel, /\{idx \+ 1\}/, "the number must be the row index");
});

test("each row shows a resource-kind glyph", () => {
  assert.match(devlogs, /export function networkKindIcon/);
  assert.match(panel, /icon=\{networkKindIcon\(kind\)\}/, "the glyph must come from the same kind the Type column shows");
});

test("a cache hit reads as cached, not as a 0ms request", () => {
  assert.match(devlogs, /fromCache\?: boolean;/);
  assert.match(devlogs, /const fromCache = log\.fromCache === true/);
  if (background) {
    assert.match(background, /details\.fromCache === true/, "webRequest is the only source that knows");
    assert.match(background, /fromCache: logData\.fromCache === true/, "the normalizer must keep it");
  }
  assert.match(panel, /log\.fromCache/, "the Time column must branch on it");
  assert.match(panel, /dt\.cached/);
});

test("Errors only is a checkbox, not a pair of buttons", () => {
  // Two buttons for one boolean read as two independent filters.
  assert.match(panel, /type="checkbox"[\s\S]{0,160}checked=\{consoleErrorsOnly\}/);
  assert.doesNotMatch(
    panel,
    /onClick=\{\(\) => setConsoleErrorsOnly\(true\)\}/,
    "the two-button version is what this replaced",
  );
});

test("the drawer covers the panel rather than insetting", () => {
  // Our panel is a ~440px column on the capture page (v/[id]: xl:grid-cols-[1fr_440px]).
  // Insetting to 9.5rem left ~288px, where a Request URL wrapped to one or two characters
  // per line. A readable URL beats a visible strip.
  assert.match(panel, /absolute inset-0 flex flex-col bg-background/, "the drawer fills the panel");
  assert.doesNotMatch(
    panel,
    /sm:left-\[9\.5rem\]/,
    "the inset drawer shredded URLs at this panel width",
  );
  // The panel needs a floor while the drawer is open or the detail is clipped:
  // measured 430px panel -> 252px for the pane -> 79px of content cut off.
  assert.match(panel, /min-h-\[34rem\]/, "an open drawer needs room for its content");
});

test("new column labels exist in both locales", () => {
  for (const key of ["dt.col.domain", "dt.cached"]) {
    assert.equal(i18n.split(`"${key}"`).length - 1, 2, `${key} must be in both en and id`);
  }
});

test("the kind glyph is defined for every bucket", () => {
  // A missing case would silently fall through to the default arrow, making a
  // stylesheet and an API call look identical.
  const icons = /export function networkKindIcon[\s\S]*?\n\}/.exec(devlogs);
  assert.ok(icons, "networkKindIcon must exist");
  for (const kind of ["ws", "js", "css", "media", "font", "doc", "other"]) {
    assert.ok(icons[0].includes(`case "${kind}"`), `kind ${kind} needs its own glyph`);
  }
  assert.match(icons[0], /default:/, "fetch/xhr falls through to the default");
});
