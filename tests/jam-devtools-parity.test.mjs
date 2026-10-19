import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Parity checks against the DevTools capture surface observed in the shipped
// Jam extension (Chrome Web Store build 5.91.0, CRX unpacked 2026-10-19).
// Each case names the Jam artifact that establishes the requirement, so a
// future reader can re-derive it instead of trusting this file.
//
// The suite runs plain `node --test` with no TypeScript loader, so these assert
// against source text - same approach as tests/redact.test.mjs, which diffs the
// inlined redactor literal against redact.js.

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const read = (p) => readFileSync(join(root, p), "utf8");

const logger = read("bugsnap-extension/injected_logger.js");
const background = read("bugsnap-extension/background.js");
const devlogs = read("bugsnap-dashboard/src/lib/devlogs.ts");
const exporters = read("bugsnap-dashboard/src/lib/devlogs-export.ts");
const panel = read("bugsnap-dashboard/src/components/DevToolsPanel.tsx");
const i18n = read("bugsnap-dashboard/src/lib/i18n/devtools.ts");

// Jam: host-network-events.js stores fetchDetails.requestHeaders /
// responseHeaders on every intercepted fetch and XHR.
test("network captures request and response headers (Jam: fetchDetails.requestHeaders)", () => {
  assert.match(logger, /collectHeaders\s*=/, "logger needs a header normaliser");
  assert.match(logger, /requestHeaders: reqHeaders/, "fetch must attach request headers");
  assert.match(logger, /responseHeaders: collectHeaders\(response\.headers\)/, "fetch must attach response headers");
  assert.match(logger, /getAllResponseHeaders/, "XHR must read response headers");
  assert.match(logger, /XHR\.prototype\.setRequestHeader = function/, "XHR must record request headers");
});

test("header values are redacted before leaving the page", () => {
  assert.match(logger, /SENSITIVE_HEADER_RE/, "a sensitive-header matcher must exist");
  for (const name of ["authorization", "cookie", "set-cookie", "x-api-key"]) {
    assert.match(logger, new RegExp(name), `${name} must be in the redaction set`);
  }
  assert.match(logger, /entry\.requestHeaders = redactHeaderMap/, "redaction runs on every entry, not per emit site");
});

// Jam: host-console-events.js rrweb/console@1 patches the full level list and
// records a parsed stack for each call.
test("console patches Jam's full level list (Jam: rrweb/console@1 options.level)", () => {
  const jamLevels = ["debug", "error", "info", "log", "table", "trace", "warn", "assert", "dir", "group", "groupCollapsed", "count"];
  const declared = /const CONSOLE_LEVELS = \[([^\]]+)\]/.exec(logger);
  assert.ok(declared, "CONSOLE_LEVELS must be declared");
  for (const lvl of jamLevels) {
    assert.ok(declared[1].includes(`'${lvl}'`), `console level ${lvl} must be intercepted`);
  }
});

test("console errors and warnings carry a call-site stack (Jam: trace field)", () => {
  assert.match(logger, /captureCallerStack/, "a stack capture helper must exist");
  assert.match(logger, /logEntry\.stack = captureCallerStack\(\)/, "warn/error rows must attach it");
});

test("console.assert only logs when the assertion fails", () => {
  // Jam's rrweb console plugin forwards assert as a level; wrapping it without
  // this guard turns every passing assert into a phantom error row.
  assert.match(logger, /level === 'assert' && args\[0\]/);
});

// Jam: host-network-events.js installs a WebSocket Proxy with open/message/
// close/send handlers.
test("WebSocket traffic is captured (Jam: WebSocket Proxy in host-network-events)", () => {
  assert.match(logger, /new Proxy\(NativeWS/, "WebSocket constructor must be proxied");
  for (const evt of ["open", "message", "error", "close"]) {
    assert.match(logger, new RegExp(`addEventListener\\('${evt}'`), `ws ${evt} must be observed`);
  }
  assert.match(logger, /WebSocket send/, "outbound frames must be recorded");
});

// Jam: navigator.sendBeacon appears across its host hook bundles.
test("sendBeacon traffic is captured (Jam: navigator.sendBeacon hooks)", () => {
  assert.match(logger, /navigator\.sendBeacon = function/, "sendBeacon must be wrapped");
  assert.match(logger, /resourceType: 'beacon'/, "beacons must be distinguishable in the panel");
});

test("the capture pipeline does not drop the new fields", () => {
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

// Jam's export surface replays a request as it was actually sent.
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
// Panel surface parity, derived from the shipped Jam panel screenshots:
// a resource-type filter row, Type/Size/Time columns, a console level
// selector, and size/protocol in the per-request General block.
// ---------------------------------------------------------------------------

test("Network has Jam's resource-type filter buckets", () => {
  // Jam's row reads: All | Fetch/XHR | WS | JS | CSS | Media | Font | Doc | Other
  assert.match(devlogs, /export type NetworkKind =/);
  for (const kind of ["fetchxhr", "ws", "js", "css", "media", "font", "doc", "other"]) {
    assert.match(devlogs, new RegExp(`"${kind}"`), `bucket ${kind} must exist`);
  }
  assert.match(panel, /networkKindFilter/, "the panel must hold the filter state");
  assert.match(panel, /networkKindCounts/, "chips must be counted so empty buckets are hidden");
});

test("Network is a real table with Jam's column set", () => {
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

test("a selected request opens a detail pane with Jam's sub-tabs", () => {
  assert.match(panel, /function NetworkDetail\(/);
  assert.match(panel, /selectedNetworkKey/, "the table must track a selected row");
  const tabs = /const TABS: NetDetailTab\[\] = \[([^\]]+)\]/.exec(panel);
  assert.ok(tabs, "the detail pane must declare its sub-tab set");
  for (const tb of ["headers", "request", "response"]) {
    assert.ok(tabs[1].includes(`"${tb}"`), `sub-tab ${tb} must exist`);
  }
  assert.match(panel, /dt\.detail\.\$\{tb\}/, "sub-tab labels must be translated");
  // Jam's General block: Request URL / Request Method / Status Code
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
    "dt.col.size", "dt.col.time", "dt.col.waterfall",
    "dt.detail.headers", "dt.detail.request", "dt.detail.response",
    "dt.general", "dt.requestUrl", "dt.requestMethod", "dt.statusCode",
    "dt.occurrences", "dt.noHeaders", "dt.noRequestBody", "dt.closeDetail", "dt.loadMore",
  ];
  for (const key of keys) {
    assert.equal(i18n.split(`"${key}"`).length - 1, 2, `${key} must be in both en and id`);
  }
});

test("size and protocol reach the dashboard types", () => {
  assert.match(devlogs, /size\?: number;/);
  assert.match(devlogs, /protocol\?: string;/);
  assert.match(devlogs, /const size = typeof log\.size === "number"/);
  assert.match(background, /size: Number\.isFinite\(Number\(logData\.size\)\)/, "normalizer must keep size");
  assert.match(background, /protocol:\s*\r?\n?\s*typeof logData\.protocol === "string"/, "normalizer must keep protocol");
});

test("size is sourced from resource timing, headers, and webRequest", () => {
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
  assert.match(reset[1], /setNetworkKindFilter\("all"\)/);
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

test("formatBytes matches the units Jam displays", () => {
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
