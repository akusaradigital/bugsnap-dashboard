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
