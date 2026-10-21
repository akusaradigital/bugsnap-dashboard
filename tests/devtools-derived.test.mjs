// Logic restated locally, per the convention in ignored-urls.test.mjs: these
// tests do not import from the TSX source.
import { test } from "node:test";
import assert from "node:assert/strict";

// --- action kind classification (DevToolsPanel: ACTION_KINDS + actionKind) ----
const ACTION_KINDS = {
  click: "click", clicked: "click",
  typing: "typing", type: "typing", typed: "typing",
  input: "input",
  navigate: "navigation", navigation: "navigation", navigated: "navigation",
  screenshot: "screenshot",
};
const actionKind = (log) => {
  const firstWord = (log.message || "").toLowerCase().split(/\s+/)[0];
  return ACTION_KINDS[firstWord] || ACTION_KINDS[log.type] || null;
};

test("action kind comes from the message, falling back to the log type", () => {
  assert.equal(actionKind({ type: "step", message: "Clicked Submit" }), "click");
  assert.equal(actionKind({ type: "step", message: "Typed into #email" }), "typing");
  assert.equal(actionKind({ type: "navigation", message: "" }), "navigation");
  assert.equal(actionKind({ type: "screenshot" }), "screenshot");
  // The icon and chip branch on this, so an unknown row must not masquerade
  // as a click - it gets the generic label instead.
  assert.equal(actionKind({ type: "step", message: "Scrolled down" }), null);
});

// --- localized status text (DevToolsPanel: statusLabel) ----------------------
const HTTP_STATUS_TEXT = { 200: "OK", 404: "Not Found" };
const statusLabel = (t, status) => {
  if (!status) return "";
  const key = `dt.st.${status}`;
  const hit = t(key);
  return hit === key ? HTTP_STATUS_TEXT[status] || `HTTP ${status}` : hit;
};

test("statusLabel prefers the translation and degrades in stages", () => {
  const id = (k) => ({ "dt.st.404": "Tidak Ditemukan" }[k] ?? k);
  assert.equal(statusLabel(id, 404), "Tidak Ditemukan");
  // translate() returns the key itself on a miss - that must not reach the UI.
  assert.equal(statusLabel(id, 200), "OK");
  assert.equal(statusLabel(id, 418), "HTTP 418");
  assert.equal(statusLabel(id, undefined), "");
  assert.equal(statusLabel(id, 0), "");
});

// --- synthetic omitted-keys row (DevToolsPanel storage tab) ------------------
// injected_logger.js:276 injects `... N more keys omitted` with an empty value.
const OMITTED_RE = /^\.\.\.\s+(\d+)\s+more keys omitted$/;

test("the synthetic omitted-keys entry is a notice, not a data row", () => {
  const store = {
    token: "abc",
    "... 12 more keys omitted": "",
    // A real key that merely CONTAINS the phrase. Only an anchored pattern
    // leaves it alone; an unanchored one would swallow it and double-count.
    "note: ... 5 more keys omitted from the export": "kept",
  };
  const all = Object.entries(store);
  const omitted = all.reduce((n, [k]) => {
    const m = OMITTED_RE.exec(k);
    return m ? n + Number(m[1]) : n;
  }, 0);
  const rows = all.filter(([k]) => !OMITTED_RE.test(k)).map(([k]) => k);

  assert.equal(omitted, 12);
  assert.deepEqual(rows, ["token", "note: ... 5 more keys omitted from the export"]);
});

// --- value truncation marker -------------------------------------------------
test("truncated values are detected by the marker the extension appends", () => {
  const isTruncated = (v) => String(v).endsWith("... (truncated)");
  assert.ok(isTruncated("x".repeat(200) + "... (truncated)"));
  assert.equal(isTruncated("short value"), false);
});

// --- breadcrumb index lookup (DevToolsPanel: findPrecedingAction) ------------
test("a spread copy keeps its srcIdx, so breadcrumb lookup needs no identity", () => {
  const logs = [
    { type: "step", message: "Clicked Save", time: 1 },
    { type: "network", url: "/a", time: 2 },
    { type: "network", url: "/b", time: 3 },
  ];
  // This is the shape the derived lists produce - indexOf on it returns -1.
  const copies = logs
    .map((l, srcIdx) => (l.type === "network" ? { ...l, srcIdx } : null))
    .filter(Boolean);

  assert.equal(logs.indexOf(copies[0]), -1, "reference identity is genuinely broken");
  assert.equal(copies[0].srcIdx, 1, "but the position survives");

  // Walk back from the carried index to the preceding action.
  const back = (idx) => {
    for (let i = idx - 1; i >= 0; i--) {
      if (logs[i].type === "step" || logs[i].type === "navigation") return logs[i].message;
    }
    return null;
  };
  assert.equal(back(copies[1].srcIdx), "Clicked Save");
  assert.equal(back(copies[0].srcIdx), "Clicked Save");
  assert.equal(back(0), null, "nothing precedes the first entry");
});

// --- action cleaning & dead action detection (cleanActionMessage + isDeadAction) --
test("cleanActionMessage strips CSS selector soup in parentheses and class soup", () => {
  // Replicating cleanActionMessage logic
  const isClassSoup = (text) => {
    const tokens = text.split(/\s+/).filter(Boolean);
    return tokens.length >= 3 && (tokens.filter((t) => /(?:^|:)(?:[a-z]+-)|\[|#|\//i.test(t)).length >= 2 || text.length > 50);
  };
  const clean = (message) => {
    let text = (message || "").trim();
    if (!text) return "";
    const selectMatch = text.match(/^(Clicked\s+select:\s*)([^\n\r]+)/i);
    if (selectMatch) {
      const rawVal = selectMatch[2].trim();
      const shortVal = rawVal.split(/\s{2,}|\t/)[0].slice(0, 35);
      return `${selectMatch[1]}${shortVal}`;
    }
    text = text.replace(/\s*\([^)]*[\.>:>#][^)]*\)$/, "");
    const match = text.match(/^(Clicked|Typed in)\s+([^:]+):\s+(.+)$/i);
    if (match && isClassSoup(match[3])) return `${match[1]} ${match[2]}`;
    const clickedOnMatch = text.match(/^Clicked on ([a-z0-9_-]+)\.[a-z0-9_\.:-]+/i);
    if (clickedOnMatch) return `Clicked on ${clickedOnMatch[1]}`;
    return text;
  };

  assert.equal(
    clean("Clicked button (div.grid.grid-cols-5 > div.flex.flex-col > button.foo)"),
    "Clicked button",
  );
  assert.equal(
    clean("Clicked button: \"Generate Video\""),
    "Clicked button: \"Generate Video\"",
  );
  assert.equal(
    clean("Clicked select: Select Category\nType Automotive B2B Real Estate"),
    "Clicked select: Select Category",
  );
  assert.equal(
    clean("Clicked on div.p-4.flex.gap-2.border-border"),
    "Clicked on div",
  );
});

test("isDeadAction filters non-interactive layout containers and empty targets", () => {
  const isDeadAction = (log) => {
    if (log.type !== "step") return false;
    const msg = (log.message || "").trim();
    if (!msg) return true;
    return (
      /^(clicked|click)(\s+on)?\s+(page\s+body|body|html|unknown\s+element)$/i.test(msg) ||
      /^(clicked|click)(\s+on)?\s+(div|span|section|main)$/i.test(msg)
    );
  };

  assert.equal(isDeadAction({ type: "step", message: "Clicked on Page Body" }), true);
  assert.equal(isDeadAction({ type: "step", message: "Clicked on Unknown Element" }), true);
  assert.equal(isDeadAction({ type: "step", message: "Clicked on HTML" }), true);
  assert.equal(isDeadAction({ type: "step", message: "Clicked on div" }), true);
  assert.equal(isDeadAction({ type: "step", message: "Clicked div" }), true);
  assert.equal(isDeadAction({ type: "step", message: "Clicked button: \"Submit\"" }), false);
  assert.equal(isDeadAction({ type: "step", message: "Typed in textarea" }), false);
  assert.equal(isDeadAction({ type: "navigation", message: "Navigated to /dashboard" }), false);
});

test("groupActionLogs collapses consecutive identical actions into a single entry with count", () => {
  const groupActionLogs = (items) => {
    const grouped = [];
    for (const item of items) {
      const last = grouped[grouped.length - 1];
      const isSameType = last && last.type === item.type;
      const isSameMessage = last && (last.message || "") === (item.message || "");
      const isSameUrl = last && (last.url || "") === (item.url || "");
      if (last && isSameType && isSameMessage && isSameUrl) {
        last.count = (last.count || 1) + (item.count || 1);
      } else {
        grouped.push({ ...item, count: item.count || 1 });
      }
    }
    return grouped;
  };

  const rawActions = [
    { type: "step", message: "Clicked button: \"Generate Video\"", count: 1 },
    { type: "step", message: "Clicked button: \"Generate Video\"", count: 1 },
    { type: "step", message: "Clicked button: \"Generate Video\"", count: 1 },
    { type: "step", message: "Typed in input", count: 1 },
    { type: "step", message: "Clicked button: \"Generate Video\"", count: 1 },
  ];

  const grouped = groupActionLogs(rawActions);
  assert.equal(grouped.length, 3, "consecutive duplicates should collapse");
  assert.equal(grouped[0].count, 3, "first 3 identical clicks become count 3");
  assert.equal(grouped[1].message, "Typed in input");
  assert.equal(grouped[1].count, 1);
  assert.equal(grouped[2].count, 1, "non-consecutive click remains separate");
});

test("groupConsoleLogs collapses consecutive identical console logs into a single entry with count", () => {
  const groupConsoleLogs = (items) => {
    const grouped = [];
    for (const item of items) {
      const last = grouped[grouped.length - 1];
      const isSameType = Boolean(last && last.type === item.type);
      const isSameLevel = Boolean(last && (last.level || "log").toLowerCase() === (item.level || "log").toLowerCase());
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
  };

  const raw = [
    { type: "console", level: "warn", message: "Warning: Extra attributes from server: class" },
    { type: "console", level: "warn", message: "Warning: Extra attributes from server: class" },
    { type: "console", level: "warn", message: "Warning: Extra attributes from server: class" },
    { type: "console", level: "error", message: "Uncaught TypeError: Failed to fetch" },
    { type: "console", level: "warn", message: "Warning: Extra attributes from server: class" },
  ];

  const grouped = groupConsoleLogs(raw);
  assert.equal(grouped.length, 3);
  assert.equal(grouped[0].count, 3);
  assert.equal(grouped[1].level, "error");
  assert.equal(grouped[1].count, 1);
  assert.equal(grouped[2].count, 1);
});

test("dedupeNetworkLogs merges dual-source webRequest + fetch observations without losing bodies", () => {
  const canonicalUrl = (val) => (val || "").split("#", 1)[0];
  const dedupeNetworkLogs = (logs) => {
    const result = [];
    for (const log of logs) {
      const normUrl = canonicalUrl(log.url);
      const method = (log.method || "GET").toUpperCase();
      const status = Number(log.status || 0);

      const prevIdx = result.findLastIndex((p) => {
        const pNormUrl = canonicalUrl(p.url);
        const pMethod = (p.method || "GET").toUpperCase();
        const pStatus = Number(p.status || 0);
        if (pMethod !== method || pNormUrl !== normUrl || pStatus !== status) return false;

        const pSrc = p.src || "";
        const logSrc = log.src || "";
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
        const pSrc = prev.src || "";
        const logSrc = log.src || "";
        if (pSrc === logSrc) {
          prev.count = (prev.count || 1) + (log.count || 1);
        }
      } else {
        result.push({ ...log });
      }
    }
    return result;
  };

  const rawNetwork = [
    {
      type: "network",
      src: "wr",
      url: "https://api.example.com/v1/orders",
      method: "POST",
      status: 200,
      timestamp: 1000,
      size: 1024,
      duration: 120,
    },
    {
      type: "network",
      src: "fetch",
      url: "https://api.example.com/v1/orders",
      method: "POST",
      status: 200,
      timestamp: 1100,
      requestBody: '{"item":"widget"}',
      responseBody: '{"id":"ord_123"}',
    },
    {
      type: "network",
      url: "https://api.example.com/v1/user",
      method: "GET",
      status: 200,
      timestamp: 2000,
    },
  ];

  const deduped = dedupeNetworkLogs(rawNetwork);
  assert.equal(deduped.length, 2, "dual-source network entry should merge into 1");
  assert.equal(deduped[0].requestBody, '{"item":"widget"}', "preserves body from fetch hook");
  assert.equal(deduped[0].size, 1024, "preserves size from webRequest");
  assert.equal(deduped[0].duration, 120, "preserves duration from webRequest");
  assert.equal(deduped[1].url, "https://api.example.com/v1/user");
});

