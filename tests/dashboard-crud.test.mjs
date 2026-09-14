import { test } from "node:test";
import assert from "node:assert/strict";

// ---------------------------------------------------------------------------
// 1. Captures CRUD Logic & Filters
// ---------------------------------------------------------------------------
test("dashboard captures CRUD: filter and search matching logic", () => {
  const sampleCaptures = [
    { id: "c1", title: "Login button broken", type: "video", tag: "bug", status: "open", folder_name: "Auth" },
    { id: "c2", title: "Checkout flow UX", type: "screenshot", tag: "design", status: "in-progress", folder_name: "Billing" },
    { id: "c3", title: "API latency test", type: "video", tag: "wip", status: "fixed", folder_name: "Auth" },
    { id: "c4", title: "Dark mode glitch", type: "screenshot", tag: "bug", status: "closed", folder_name: null },
  ];

  function filterCaptures(items, { type, tag, status, folder, search }) {
    return items.filter((item) => {
      if (type && type !== "all" && item.type !== type) return false;
      if (tag && item.tag !== tag) return false;
      if (status && item.status !== status) return false;
      if (folder !== undefined && folder !== null && item.folder_name !== folder) return false;
      if (search && !item.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }

  // Type filter
  assert.equal(filterCaptures(sampleCaptures, { type: "video" }).length, 2);
  assert.equal(filterCaptures(sampleCaptures, { type: "screenshot" }).length, 2);

  // Tag filter
  assert.equal(filterCaptures(sampleCaptures, { tag: "bug" }).length, 2);

  // Status filter
  assert.equal(filterCaptures(sampleCaptures, { status: "open" }).length, 1);

  // Folder filter
  assert.equal(filterCaptures(sampleCaptures, { folder: "Auth" }).length, 2);

  // Search filter
  assert.equal(filterCaptures(sampleCaptures, { search: "login" }).length, 1);
});

test("dashboard captures CRUD: edit payload sanitization", () => {
  function prepareEditPayload({ title, description, password, expiry, allowedDomainsText, allowedIpsText }) {
    const originalCreated = Date.now();
    let expires_at = null;
    if (expiry === "24h") expires_at = new Date(originalCreated + 24 * 3600 * 1000).toISOString();
    if (expiry === "7d") expires_at = new Date(originalCreated + 7 * 24 * 3600 * 1000).toISOString();

    const allowed_domains = allowedDomainsText?.trim()
      ? allowedDomainsText.split(",").map((d) => d.trim().toLowerCase()).filter(Boolean)
      : null;

    const allowed_ips = allowedIpsText?.trim()
      ? allowedIpsText.split(",").map((ip) => ip.trim()).filter(Boolean)
      : null;

    return {
      title: title.trim(),
      description: description?.trim() || null,
      password: password?.trim() || null,
      expires_at,
      allowed_domains,
      allowed_ips,
    };
  }

  const payload = prepareEditPayload({
    title: "  Checkout bug  ",
    description: "  Steps to reproduce  ",
    password: "  secretPass123  ",
    expiry: "24h",
    allowedDomainsText: " example.com, app.test.io ",
    allowedIpsText: " 192.168.1.1, 10.0.0.1 ",
  });

  assert.equal(payload.title, "Checkout bug");
  assert.equal(payload.description, "Steps to reproduce");
  assert.equal(payload.password, "secretPass123");
  assert.ok(payload.expires_at !== null);
  assert.deepEqual(payload.allowed_domains, ["example.com", "app.test.io"]);
  assert.deepEqual(payload.allowed_ips, ["192.168.1.1", "10.0.0.1"]);
});

// ---------------------------------------------------------------------------
// 2. Folders CRUD Logic
// ---------------------------------------------------------------------------
test("dashboard folders CRUD: folder management and renaming rules", () => {
  let folders = ["Auth", "Billing", "Mobile"];

  // 1. Create folder
  function createFolder(name) {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Folder name cannot be empty");
    if (folders.includes(trimmed)) throw new Error("Folder already exists");
    folders = [...folders, trimmed].sort();
    return folders;
  }

  createFolder("Landing Page");
  assert.deepEqual(folders, ["Auth", "Billing", "Landing Page", "Mobile"]);

  // 2. Rename folder
  function renameFolder(oldName, newName) {
    const trimmed = newName.trim();
    if (!trimmed || oldName === trimmed) return folders;
    folders = folders.map((f) => (f === oldName ? trimmed : f)).sort();
    return folders;
  }

  renameFolder("Auth", "Authentication");
  assert.deepEqual(folders, ["Authentication", "Billing", "Landing Page", "Mobile"]);

  // 3. Delete folder
  function deleteFolder(name) {
    folders = folders.filter((f) => f !== name);
    return folders;
  }

  deleteFolder("Billing");
  assert.deepEqual(folders, ["Authentication", "Landing Page", "Mobile"]);
});

// ---------------------------------------------------------------------------
// 3. Workspaces & Seats CRUD Logic
// ---------------------------------------------------------------------------
test("dashboard workspaces CRUD: seat limits and workspace invitations", () => {
  function canInviteMember(userPlan, currentMemberCount) {
    // Free plan seat limit: up to 4 additional members (total 5)
    // Pro/Pro+/Enterprise: unlimited
    const seatLimit = userPlan === "free" ? 4 : null;
    if (seatLimit !== null && currentMemberCount >= seatLimit) {
      return { allowed: false, error: "Workspace seat limit reached" };
    }
    return { allowed: true };
  }

  assert.equal(canInviteMember("free", 3).allowed, true);
  assert.equal(canInviteMember("free", 4).allowed, false);
  assert.equal(canInviteMember("pro", 10).allowed, true);
  assert.equal(canInviteMember("pro_plus", 50).allowed, true);
});

// ---------------------------------------------------------------------------
// 4. Defect Intelligence & Analytics Aggregations
// ---------------------------------------------------------------------------
test("dashboard analytics: defect intelligence calculations", () => {
  const captures = [
    { status: "open", browser: "Chrome 120", site_url: "https://shop.com/cart" },
    { status: "in-progress", browser: "Chrome 120", site_url: "https://shop.com/cart" },
    { status: "fixed", browser: "Safari 17", site_url: "https://shop.com/checkout" },
    { status: "closed", browser: "Firefox 119", site_url: "https://shop.com/login" },
  ];

  // Resolution rate = (fixed + closed) / total
  const statusCounts = { open: 0, inProgress: 0, fixed: 0, closed: 0 };
  captures.forEach((c) => {
    if (c.status === "open") statusCounts.open++;
    else if (c.status === "in-progress") statusCounts.inProgress++;
    else if (c.status === "fixed") statusCounts.fixed++;
    else if (c.status === "closed") statusCounts.closed++;
  });

  const total = captures.length;
  const resolutionRate = total > 0 ? Math.round(((statusCounts.fixed + statusCounts.closed) / total) * 100) : 0;

  assert.equal(resolutionRate, 50); // 2 out of 4 fixed/closed
  assert.equal(statusCounts.open, 1);
  assert.equal(statusCounts.inProgress, 1);
});
