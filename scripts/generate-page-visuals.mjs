import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DASH_DIR = path.resolve(__dirname, "..");
const ROOT_DIR = path.resolve(DASH_DIR, "..");
const EXT_DIR = path.join(ROOT_DIR, "bugsnap-extension");
const DASH_PUBLIC = path.join(DASH_DIR, "public");
const OUT_DIR = path.join(DASH_PUBLIC, "showcase");

fs.mkdirSync(OUT_DIR, { recursive: true });

function fileDataUri(absPath, mime) {
  const buf = fs.readFileSync(absPath);
  return `data:${mime};base64,${buf.toString("base64")}`;
}

const LOGO_DAY_URI = fileDataUri(path.join(DASH_PUBLIC, "logo-day.svg"), "image/svg+xml");
const SUPPORT_MASCOT_URI = fileDataUri(path.join(DASH_PUBLIC, "illustrations", "support-headset.png"), "image/png");
const DRIVE_LOGO_URI = fileDataUri(path.join(DASH_PUBLIC, "icons", "logos-google-drive.svg"), "image/svg+xml");
const CHROME_LOGO_URI = fileDataUri(path.join(DASH_PUBLIC, "icons", "logos-chrome.svg"), "image/svg+xml");

const LOGOS = {
  jira: fileDataUri(path.join(DASH_PUBLIC, "integrations", "jira.png"), "image/png"),
  linear: fileDataUri(path.join(DASH_PUBLIC, "integrations", "linear.png"), "image/png"),
  github: fileDataUri(path.join(DASH_PUBLIC, "integrations", "github.png"), "image/png"),
  gitlab: fileDataUri(path.join(DASH_PUBLIC, "integrations", "gitlab.png"), "image/png"),
  slack: fileDataUri(path.join(DASH_PUBLIC, "integrations", "slack.png"), "image/png"),
  notion: fileDataUri(path.join(DASH_PUBLIC, "integrations", "notion.png"), "image/png"),
  clickup: fileDataUri(path.join(DASH_PUBLIC, "integrations", "clickup.png"), "image/png"),
  claude: fileDataUri(path.join(DASH_PUBLIC, "integrations", "claude.png"), "image/png"),
};

function buildChromeStub(initialStorage = {}) {
  return `
    (() => {
      const store = ${JSON.stringify(initialStorage)};
      const noop = () => {};
      window.chrome = {
        runtime: {
          id: "klbgjodcbhopcjpfehjkbgofjdelohlf",
          lastError: null,
          getManifest: () => ({ version: "1.0.80", name: "BugSnap" }),
          getURL: (p) => p,
          sendMessage: (msg, cb) => {
            if (typeof cb === "function") {
              if (msg && msg.action === "get_auth_status") {
                cb({ authenticated: true, email: "qa@bugsnap.dev", plan: "pro" });
              } else if (msg && msg.action === "get_recording_state") {
                cb({ isRecording: false });
              } else if (msg && msg.action === "get_pending_drafts") {
                cb({ drafts: [] });
              } else if (msg && msg.action === "get_workspace_context") {
                cb({
                  ok: true,
                  workspaces: [
                    { id: "ws-1", name: "BugSnap QA Workspace", role: "owner" },
                    { id: "ws-2", name: "Engineering Team", role: "admin" }
                  ],
                  folders: [
                    { id: "f-1", name: "Checkout Flow", color: "#2563EB", parent_id: null },
                    { id: "f-2", name: "Auth & Billing", color: "#89BD49", parent_id: null },
                    { id: "f-3", name: "Mobile Web", color: "#F59E0B", parent_id: null },
                    { id: "f-4", name: "API Errors", color: "#EF4444", parent_id: null }
                  ],
                  activeWorkspaceId: "ws-1"
                });
              } else {
                cb({ ok: true });
              }
            }
            return Promise.resolve({ ok: true });
          },
          onMessage: { addListener: noop, removeListener: noop },
        },
        storage: {
          local: {
            get: (keys, cb) => {
              let out = {};
              if (!keys) out = { ...store };
              else if (typeof keys === "string") out[keys] = store[keys];
              else if (Array.isArray(keys)) keys.forEach(k => { if (k in store) out[k] = store[k]; });
              else Object.keys(keys).forEach(k => { out[k] = k in store ? store[k] : keys[k]; });
              if (typeof cb === "function") cb(out);
              return Promise.resolve(out);
            },
            set: (obj, cb) => {
              Object.assign(store, obj);
              if (typeof cb === "function") cb();
              return Promise.resolve();
            },
            remove: (keys, cb) => {
              (Array.isArray(keys) ? keys : [keys]).forEach(k => delete store[k]);
              if (typeof cb === "function") cb();
              return Promise.resolve();
            },
          },
          sync: {
            get: (keys, cb) => { if (typeof cb === "function") cb({}); return Promise.resolve({}); },
            set: (obj, cb) => { if (typeof cb === "function") cb(); return Promise.resolve(); },
          },
          onChanged: { addListener: noop, removeListener: noop },
        },
        tabs: {
          query: (_q, cb) => {
            const tabs = [{ id: 1, url: "https://app.acmeshop.io/checkout", title: "AcmeShop Checkout", active: true }];
            if (typeof cb === "function") cb(tabs);
            return Promise.resolve(tabs);
          },
          create: noop,
        },
        commands: {
          getAll: (cb) => {
            const cmds = [
              { name: "take-screenshot", shortcut: "Ctrl+Shift+S" },
              { name: "start-recording", shortcut: "Ctrl+Shift+F" },
            ];
            if (typeof cb === "function") cb(cmds);
            return Promise.resolve(cmds);
          },
        },
        permissions: {
          contains: (_p, cb) => { if (typeof cb === "function") cb(true); return Promise.resolve(true); },
        },
      };
    })();
  `;
}

function frameShell({ bodyHtml, extraCss = "", width = 1200, height = 750 }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: ${width}px;
    height: ${height}px;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
    color: #0F172A;
    background: linear-gradient(150deg, #F8FAFC 0%, #F1F5F9 52%, #EDF4FF 100%);
  }
  .canvas {
    position: relative;
    width: ${width}px;
    height: ${height}px;
    padding: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .canvas::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image: radial-gradient(rgba(15, 23, 42, 0.055) 1px, transparent 1px);
    background-size: 22px 22px;
    pointer-events: none;
  }
  .glow-blue {
    position: absolute;
    width: 460px;
    height: 460px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%);
    top: -120px;
    right: -80px;
    pointer-events: none;
  }
  .glow-green {
    position: absolute;
    width: 420px;
    height: 420px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(137,189,73,0.13) 0%, transparent 70%);
    bottom: -140px;
    left: -80px;
    pointer-events: none;
  }
  .window {
    position: relative;
    z-index: 2;
    background: #FFFFFF;
    border: 1px solid #CBD5E1;
    border-radius: 20px;
    box-shadow: 0 26px 60px -16px rgba(15, 23, 42, 0.16), 0 4px 12px rgba(15, 23, 42, 0.05);
    overflow: hidden;
  }
  .win-bar {
    height: 40px;
    background: #F8FAFC;
    border-bottom: 1px solid #E2E8F0;
    display: flex;
    align-items: center;
    padding: 0 16px;
    gap: 8px;
  }
  .dot { width: 11px; height: 11px; border-radius: 50%; display: inline-block; }
  .dot-r { background: #F87171; }
  .dot-y { background: #FBBF24; }
  .dot-g { background: #4ADE80; }
  .url-pill {
    margin-left: 12px;
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    padding: 4px 12px;
    font-size: 12px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    color: #475569;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
  .pill-green {
    display: inline-flex; align-items: center; gap: 6px;
    background: #F2F9E8; color: #3D7A24; border: 1px solid #CBE5AC;
    border-radius: 999px; padding: 4px 11px; font-size: 12px; font-weight: 700;
  }
  .pill-blue {
    display: inline-flex; align-items: center; gap: 6px;
    background: #EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE;
    border-radius: 999px; padding: 4px 11px; font-size: 12px; font-weight: 700;
  }
  .pill-red {
    display: inline-flex; align-items: center; gap: 6px;
    background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA;
    border-radius: 999px; padding: 4px 11px; font-size: 12px; font-weight: 700;
  }
  ${extraCss}
</style>
</head>
<body>
  <div class="canvas">
    <div class="glow-blue"></div>
    <div class="glow-green"></div>
    ${bodyHtml}
  </div>
</body>
</html>`;
}

function buildCheckoutDemoHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 860px; height: 560px; overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif;
    background: #F8FAFC; color: #0F172A; padding: 24px 30px;
  }
  .top { display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-bottom: 1px solid #E2E8F0; margin-bottom: 20px; }
  .brand { font-size: 17px; font-weight: 800; color: #0F172A; display: flex; align-items: center; gap: 9px; }
  .brand-mark { width: 26px; height: 26px; border-radius: 7px; background: #2563EB; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 13px; }
  .steps { display: flex; gap: 16px; font-size: 12px; color: #64748B; font-weight: 600; }
  .steps .active { color: #2563EB; }
  .grid { display: grid; grid-template-columns: 1.3fr 0.85fr; gap: 20px; }
  .card { background: #fff; border: 1px solid #E2E8F0; border-radius: 14px; padding: 18px 20px; box-shadow: 0 2px 8px rgba(15,23,42,0.03); }
  h2 { font-size: 15px; font-weight: 700; margin-bottom: 13px; }
  .field { margin-bottom: 11px; }
  .field label { display: block; font-size: 11px; font-weight: 600; color: #475569; margin-bottom: 5px; }
  .input { width: 100%; padding: 8px 12px; border-radius: 9px; border: 1px solid #CBD5E1; font-size: 13px; color: #0F172A; background: #F8FAFC; }
  .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .err-banner { margin-top: 13px; padding: 11px 13px; border-radius: 10px; background: #FEF2F2; border: 1px solid #FECACA; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .err-title { font-size: 12px; font-weight: 700; color: #B91C1C; }
  .err-sub { font-size: 10.5px; color: #DC2626; margin-top: 2px; font-family: monospace; }
  .err-badge { padding: 3px 8px; border-radius: 6px; background: #FEE2E2; color: #B91C1C; font-family: monospace; font-size: 11px; font-weight: 700; flex-shrink: 0; }
  .pay-btn { margin-top: 14px; width: 100%; padding: 11px; border-radius: 10px; background: #2563EB; color: #fff; font-size: 13.5px; font-weight: 700; border: none; }
  .line { display: flex; justify-content: space-between; font-size: 12.5px; padding: 8px 0; border-bottom: 1px solid #F1F5F9; color: #475569; }
  .line strong { color: #0F172A; }
  .total { display: flex; justify-content: space-between; font-size: 15px; font-weight: 800; padding-top: 12px; color: #0F172A; }
  .plan-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 12px; margin-bottom: 12px; }
</style>
</head>
<body>
  <div class="top">
    <div class="brand"><span class="brand-mark">A</span> AcmeShop Enterprise</div>
    <div class="steps"><span>1. Cart</span><span>2. Billing</span><span class="active">3. Payment</span></div>
  </div>
  <div class="grid">
    <div class="card">
      <h2>Payment Details</h2>
      <div class="field"><label>Cardholder Name</label><div class="input">Jordan Rivera</div></div>
      <div class="field"><label>Card Number</label><div class="input">4242 •••• •••• 8842</div></div>
      <div class="row2">
        <div class="field"><label>Expiry Date</label><div class="input">09 / 28</div></div>
        <div class="field"><label>Security Code</label><div class="input">842</div></div>
      </div>
      <div class="err-banner">
        <div>
          <div class="err-title">Payment gateway failed to authorize</div>
          <div class="err-sub">POST /api/v1/checkout/charge · req_8f21a90c</div>
        </div>
        <span class="err-badge">HTTP 500</span>
      </div>
      <button class="pay-btn">Pay $2,499.00</button>
    </div>
    <div class="card">
      <h2>Order Summary</h2>
      <div class="plan-box">
        <div style="font-weight:700;font-size:13px;">Annual Team License (25 seats)</div>
        <div style="font-size:11px;color:#64748B;margin-top:4px;">SSO, audit logs &amp; priority SLA</div>
      </div>
      <div class="line"><span>Subtotal</span><strong>$2,299.00</strong></div>
      <div class="line"><span>Tax (estimated)</span><strong>$200.00</strong></div>
      <div class="total"><span>Total Due</span><span>$2,499.00</span></div>
    </div>
  </div>
</body>
</html>`;
}

async function captureRealPopups(browser) {
  const ctx = await browser.newContext({ viewport: { width: 420, height: 600 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript(buildChromeStub({
    oauth_token: "demo_valid_token",
    oauth_expiry: Date.now() + 86400000,
    user_email: "qa@bugsnap.dev",
    user_plan: "pro",
    review_dismissed: true,
    review_prompt_shown: true,
    capture_count: 14,
    theme: "light",
  }));
  await page.goto(pathToFileURL(path.join(EXT_DIR, "popup.html")).href, { waitUntil: "networkidle" });
  await page.waitForTimeout(350);
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-theme", "light");
    document.getElementById("auth-warning")?.classList.add("hidden");
    document.getElementById("review-banner")?.classList.add("hidden");
    document.getElementById("remote-status")?.classList.add("hidden");
    const footerUser = document.getElementById("footer-user");
    if (footerUser) {
      footerUser.classList.remove("hidden");
      footerUser.classList.add("active");
    }
    const footerEmail = document.getElementById("footer-email");
    if (footerEmail) footerEmail.textContent = "qa@bugsnap.dev";
    document.getElementById("screenshot-options")?.classList.remove("hidden");
    document.getElementById("record-options")?.classList.add("hidden");
    document.getElementById("toggle-screenshot-options")?.classList.add("open");
  });
  await page.waitForTimeout(150);
  const target = page.locator(".app-container, .popup-container, .container, body").first();
  const shotBuf = await target.screenshot({ type: "png" });

  await page.evaluate(() => {
    document.getElementById("screenshot-options")?.classList.add("hidden");
    document.getElementById("record-options")?.classList.remove("hidden");
    document.getElementById("toggle-screenshot-options")?.classList.remove("open");
    document.getElementById("toggle-record-options")?.classList.add("open");
  });
  await page.waitForTimeout(150);
  const recBuf = await target.screenshot({ type: "png" });

  await ctx.close();
  return {
    popupScreenshotUri: `data:image/png;base64,${shotBuf.toString("base64")}`,
    popupRecordUri: `data:image/png;base64,${recBuf.toString("base64")}`,
  };
}

async function captureCheckoutDemo(browser) {
  const ctx = await browser.newContext({ viewport: { width: 860, height: 560 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.setContent(buildCheckoutDemoHtml(), { waitUntil: "load" });
  const buf = await page.screenshot({ type: "png" });
  await ctx.close();
  return `data:image/png;base64,${buf.toString("base64")}`;
}

async function captureRealEditor(browser, checkoutDataUri) {
  const ctx = await browser.newContext({ viewport: { width: 1240, height: 730 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript(buildChromeStub({
    oauth_token: "demo_valid_token",
    oauth_expiry: Date.now() + 86400000,
    user_email: "qa@bugsnap.dev",
    user_plan: "pro",
    theme: "light",
    temp_screenshot: checkoutDataUri,
    temp_capture_meta: {
      url: "https://app.acmeshop.io/checkout",
      title: "Checkout payment fails with HTTP 500",
      mode: "area",
      timestamp: Date.now(),
    },
    workspace_selected_id: "ws-1",
    workspace_selected_name: "BugSnap QA Workspace",
    workspace_selected_folder_name: "Checkout Flow",
  }));
  await page.goto(pathToFileURL(path.join(EXT_DIR, "editor.html")).href, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.evaluate(async (imgSrc) => {
    document.documentElement.setAttribute("data-theme", "light");
    document.getElementById("editor-loading")?.classList.add("hidden");
    document.getElementById("editor-loading")?.style.setProperty("display", "none");
    document.querySelectorAll('.toast, .toast-container, [class*="toast"], [role="alert"]').forEach((el) => {
      el.style.display = "none";
    });
    // Hide Connect Google Drive prompt so editor reflects connected state
    const driveCta = document.getElementById("editor-drive-cta");
    if (driveCta) {
      driveCta.classList.add("hidden");
      driveCta.style.display = "none";
    }
    // Set folder display text to Checkout Flow
    document.querySelectorAll("button, span").forEach((el) => {
      if (el.children.length === 0 && el.textContent?.trim() === "No folder") {
        el.textContent = "Checkout Flow";
      }
    });

    const titleInput = document.getElementById("input-title");
    if (titleInput) titleInput.value = "Checkout payment fails with HTTP 500";
    const descInput = document.getElementById("input-desc");
    if (descInput) {
      descInput.value = "Clicking Pay $2,499.00 returns HTTP 500 on /api/v1/checkout/charge. Card number blurred before sharing.";
      descInput.dispatchEvent(new Event("input", { bubbles: true }));
    }

    const canvas = document.getElementById("editor-canvas");
    if (canvas) {
      const img = new Image();
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = imgSrc;
      });
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.style.width = "100%";
      canvas.style.height = "auto";
      canvas.style.maxHeight = "100%";
      canvas.style.display = "block";
      const c = canvas.getContext("2d");
      c.drawImage(img, 0, 0);

      const s = canvas.width / 860;
      const bx = Math.round(58 * s), by = Math.round(234 * s), bw = Math.round(240 * s), bh = Math.round(26 * s);
      const block = Math.max(7, Math.round(8 * s));
      for (let y = by; y < by + bh; y += block) {
        for (let x = bx; x < bx + bw; x += block) {
          const p = c.getImageData(x, y, 1, 1).data;
          c.fillStyle = `rgb(${p[0]},${p[1]},${p[2]})`;
          c.fillRect(x, y, block, block);
        }
      }
      c.strokeStyle = "#2563EB";
      c.lineWidth = 2 * s;
      c.setLineDash([5 * s, 4 * s]);
      c.strokeRect(bx - 2 * s, by - 2 * s, bw + 4 * s, bh + 4 * s);
      c.setLineDash([]);

      c.fillStyle = "#2563EB";
      c.beginPath();
      c.roundRect(bx + bw + 10 * s, by + 1 * s, 96 * s, 24 * s, 6 * s);
      c.fill();
      c.fillStyle = "#FFFFFF";
      c.font = `700 ${11 * s}px Inter, system-ui, sans-serif`;
      c.fillText("Blurred PII", bx + bw + 20 * s, by + 17 * s);

      c.strokeStyle = "#E11D48";
      c.lineWidth = 3.5 * s;
      c.beginPath();
      c.roundRect(47 * s, 344 * s, 444 * s, 62 * s, 11 * s);
      c.stroke();

      const ax1 = 550 * s, ay1 = 442 * s, ax2 = 493 * s, ay2 = 392 * s;
      c.strokeStyle = "#E11D48";
      c.lineWidth = 4 * s;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(ax1, ay1);
      c.lineTo(ax2, ay2);
      c.stroke();
      const angle = Math.atan2(ay2 - ay1, ax2 - ax1);
      const head = 13 * s;
      c.fillStyle = "#E11D48";
      c.beginPath();
      c.moveTo(ax2, ay2);
      c.lineTo(ax2 - head * Math.cos(angle - Math.PI / 6), ay2 - head * Math.sin(angle - Math.PI / 6));
      c.lineTo(ax2 - head * Math.cos(angle + Math.PI / 6), ay2 - head * Math.sin(angle + Math.PI / 6));
      c.closePath();
      c.fill();

      c.fillStyle = "#E11D48";
      c.beginPath();
      c.roundRect(536 * s, 434 * s, 286 * s, 38 * s, 9 * s);
      c.fill();
      c.fillStyle = "#FFFFFF";
      c.font = `700 ${13 * s}px Inter, system-ui, sans-serif`;
      c.fillText("POST /api/v1/checkout/charge → 500", 552 * s, 458 * s);
    }
  }, checkoutDataUri);
  await page.waitForTimeout(250);
  const buf = await page.screenshot({ type: "png" });
  await ctx.close();
  return `data:image/png;base64,${buf.toString("base64")}`;
}

async function renderPng(browser, filename, html, width = 1200, height = 750) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.waitForTimeout(150);
  const outPath = path.join(OUT_DIR, filename);
  await page.screenshot({ path: outPath, type: "png" });
  await ctx.close();
  console.log(`Generated ${filename}`);
}

async function main() {
  const browser = await chromium.launch();
  try {
    const { popupScreenshotUri, popupRecordUri } = await captureRealPopups(browser);
    const checkoutUri = await captureCheckoutDemo(browser);
    const editorUri = await captureRealEditor(browser, checkoutUri);

    // 1. ui-capture-popup.png (How It Works Step 01)
    await renderPng(
      browser,
      "ui-capture-popup.png",
      frameShell({
        bodyHtml: `
        <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;align-items:center;gap:26px;">
          <div class="window" style="flex:1;height:100%;display:flex;flex-direction:column;">
            <div class="win-bar">
              <span class="dot dot-r"></span><span class="dot dot-y"></span><span class="dot dot-g"></span>
              <div class="url-pill"><span style="color:#16A34A;">●</span> https://app.acmeshop.io/checkout</div>
              <div style="margin-left:auto;display:flex;align-items:center;gap:8px;">
                <span class="pill-blue" style="padding:3px 10px;font-size:11px;">DevTools Attached</span>
                <img src="${LOGO_DAY_URI}" style="width:20px;height:20px;" />
              </div>
            </div>
            <div style="position:relative;flex:1;background:#F8FAFC;display:flex;align-items:center;justify-content:center;padding:14px;">
              <img src="${checkoutUri}" style="width:100%;height:100%;object-fit:contain;border-radius:10px;border:1px solid #E2E8F0;" />
            </div>
          </div>
          <div style="width:338px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:14px;">
            <div style="border-radius:18px;overflow:hidden;border:1px solid #CBD5E1;box-shadow:0 24px 55px -12px rgba(15,23,42,0.22);background:#fff;width:334px;">
              <img src="${popupScreenshotUri}" style="width:100%;display:block;" />
            </div>
            <div style="display:flex;gap:8px;">
              <span class="pill-green">● Connected · qa@bugsnap.dev</span>
            </div>
          </div>
        </div>`,
      }),
    );

    // 2. ui-editor-annotations.png (How It Works Step 02 & Features Section 2)
    await renderPng(
      browser,
      "ui-editor-annotations.png",
      frameShell({
        bodyHtml: `
        <div class="window" style="width:100%;height:100%;display:flex;flex-direction:column;">
          <div class="win-bar">
            <span class="dot dot-r"></span><span class="dot dot-y"></span><span class="dot dot-g"></span>
            <div class="url-pill"><img src="${LOGO_DAY_URI}" style="width:14px;height:14px;" /> BugSnap Visual Editor - Checkout Flow</div>
            <div style="margin-left:auto;display:flex;gap:8px;">
              <span class="pill-blue" style="font-size:11px;padding:3px 10px;">AI Polish Ready</span>
              <span class="pill-green" style="font-size:11px;padding:3px 10px;">Blur PII Applied</span>
            </div>
          </div>
          <div style="flex:1;background:#F8FAFC;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:8px;">
            <img src="${editorUri}" style="width:100%;height:100%;object-fit:contain;border-radius:10px;" />
          </div>
        </div>`,
      }),
    );

    // 3. ui-devtools-telemetry.png (Features Section 1 & Solutions Section 2)
    await renderPng(
      browser,
      "ui-devtools-telemetry.png",
      frameShell({
        bodyHtml: `
        <div class="window" style="width:100%;height:100%;display:flex;flex-direction:column;">
          <div class="win-bar">
            <span class="dot dot-r"></span><span class="dot dot-y"></span><span class="dot dot-g"></span>
            <div class="url-pill"><img src="${LOGO_DAY_URI}" style="width:14px;height:14px;" /> bugsnap.app/v/cap_9a8f2</div>
            <div style="margin-left:auto;display:flex;gap:8px;align-items:center;">
              <span style="font-size:12px;font-weight:600;color:#475569;border:1px solid #CBD5E1;background:#fff;padding:4px 10px;border-radius:8px;">Copy cURL</span>
              <span style="font-size:12px;font-weight:600;color:#475569;border:1px solid #CBD5E1;background:#fff;padding:4px 10px;border-radius:8px;">Export HAR</span>
              <span style="font-size:12px;font-weight:700;color:#fff;background:#89BD49;padding:5px 12px;border-radius:8px;">Copy Bug Report</span>
            </div>
          </div>
          <div style="flex:1;display:grid;grid-template-columns:0.92fr 1.08fr;overflow:hidden;">
            <div style="background:#F8FAFC;border-right:1px solid #E2E8F0;padding:18px;display:flex;flex-direction:column;gap:14px;">
              <div style="background:#fff;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;padding:8px;">
                <img src="${checkoutUri}" style="width:100%;display:block;border-radius:8px;" />
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div style="background:#fff;border:1px solid #E2E8F0;border-radius:10px;padding:10px 12px;">
                  <div style="font-size:10px;font-weight:700;color:#64748B;text-transform:uppercase;">Environment</div>
                  <div style="font-size:13px;font-weight:700;margin-top:3px;">Chrome 134 · macOS</div>
                </div>
                <div style="background:#fff;border:1px solid #E2E8F0;border-radius:10px;padding:10px 12px;">
                  <div style="font-size:10px;font-weight:700;color:#64748B;text-transform:uppercase;">Viewport & DPR</div>
                  <div style="font-size:13px;font-weight:700;margin-top:3px;">1920 × 1080 · 2x</div>
                </div>
              </div>
              <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;padding:12px;">
                <div style="font-size:11px;font-weight:700;color:#DC2626;margin-bottom:4px;">✕ Console Exception (1)</div>
                <div class="mono" style="font-size:12px;color:#991B1B;line-height:1.45;">
                  TypeError: Cannot read properties of undefined (reading 'checkoutSessionId')<br/>
                  <span style="color:#DC2626;opacity:0.8;">at submitPayment (checkout.ts:148:19)</span>
                </div>
              </div>
            </div>
            <div style="padding:18px;display:flex;flex-direction:column;gap:14px;background:#fff;">
              <div style="display:flex;gap:18px;border-bottom:1px solid #E2E8F0;padding-bottom:10px;font-size:13px;font-weight:700;">
                <span style="color:#2563EB;border-bottom:2px solid #2563EB;padding-bottom:10px;margin-bottom:-11px;">Network (24)</span>
                <span style="color:#64748B;">Console (3)</span>
                <span style="color:#64748B;">User Steps (6)</span>
                <span style="color:#64748B;">Storage</span>
              </div>
              <div style="border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;font-size:12.5px;">
                <div style="display:grid;grid-template-columns:64px 72px 1fr 76px;padding:9px 14px;background:#F8FAFC;border-bottom:1px solid #E2E8F0;font-weight:700;color:#64748B;font-size:11px;text-transform:uppercase;">
                  <span>Status</span><span>Method</span><span>Endpoint</span><span style="text-align:right;">Time</span>
                </div>
                <div style="display:grid;grid-template-columns:64px 72px 1fr 76px;padding:10px 14px;background:#FEF2F2;border-bottom:1px solid #FECACA;align-items:center;">
                  <span class="mono" style="font-weight:800;color:#DC2626;">500</span>
                  <span class="mono" style="font-weight:700;color:#0F172A;">POST</span>
                  <span class="mono" style="font-weight:700;color:#991B1B;">/api/v1/checkout/charge</span>
                  <span class="mono" style="text-align:right;color:#DC2626;font-weight:700;">248 ms</span>
                </div>
                <div style="display:grid;grid-template-columns:64px 72px 1fr 76px;padding:10px 14px;border-bottom:1px solid #F1F5F9;align-items:center;">
                  <span class="mono" style="font-weight:800;color:#16A34A;">200</span>
                  <span class="mono" style="font-weight:700;color:#475569;">GET</span>
                  <span class="mono" style="color:#334155;">/api/v1/cart/summary</span>
                  <span class="mono" style="text-align:right;color:#64748B;">42 ms</span>
                </div>
                <div style="display:grid;grid-template-columns:64px 72px 1fr 76px;padding:10px 14px;align-items:center;">
                  <span class="mono" style="font-weight:800;color:#16A34A;">200</span>
                  <span class="mono" style="font-weight:700;color:#475569;">GET</span>
                  <span class="mono" style="color:#334155;">/api/v1/auth/session</span>
                  <span class="mono" style="text-align:right;color:#64748B;">19 ms</span>
                </div>
              </div>
              <div style="flex:1;background:#0F172A;border-radius:12px;padding:16px;color:#E2E8F0;display:flex;flex-direction:column;gap:8px;">
                <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #1E293B;padding-bottom:8px;">
                  <span style="font-size:12px;font-weight:700;color:#F8FAFC;">POST /api/v1/checkout/charge · Headers & Payload</span>
                  <span style="font-size:11px;font-weight:700;color:#A8D666;background:rgba(137,189,73,0.16);border:1px solid rgba(137,189,73,0.35);padding:2px 8px;border-radius:999px;">Auto-Redacted</span>
                </div>
                <pre class="mono" style="font-size:12px;line-height:1.6;color:#CBD5E1;white-space:pre-wrap;">Authorization: <span style="color:#86EFAC;font-weight:700;">Bearer [REDACTED_BEARER_TOKEN]</span>
Content-Type: application/json
{
  "orderId": "ord_48291",
  "amount": 249900,
  "currency": "USD",
  "error": <span style="color:#FCA5A5;">"UPSTREAM_GATEWAY_TIMEOUT"</span>
}</pre>
              </div>
            </div>
          </div>
        </div>`,
      }),
    );

    // 4. ui-privacy-redaction.png (Features Section 3 & How It Works Step 03)
    await renderPng(
      browser,
      "ui-privacy-redaction.png",
      frameShell({
        bodyHtml: `
        <div class="window" style="width:100%;height:100%;display:flex;flex-direction:column;">
          <div class="win-bar">
            <span class="dot dot-r"></span><span class="dot dot-y"></span><span class="dot dot-g"></span>
            <div class="url-pill"><img src="${LOGO_DAY_URI}" style="width:14px;height:14px;" /> Client-Side Privacy Shield · Zero Server Retention</div>
            <div style="margin-left:auto;display:flex;gap:8px;align-items:center;">
              <span class="pill-green">✓ Redacted In-Browser</span>
            </div>
          </div>
          <div style="flex:1;display:grid;grid-template-columns:1.05fr 0.95fr;gap:22px;padding:24px;background:#F8FAFC;">
            <div style="background:#fff;border:1px solid #E2E8F0;border-radius:16px;padding:20px;display:flex;flex-direction:column;justify-content:space-between;">
              <div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                  <div style="font-size:16px;font-weight:800;">Detected PII & Secrets</div>
                  <span class="pill-blue" style="font-size:11px;">4 items masked</span>
                </div>
                <div style="display:flex;flex-direction:column;gap:12px;">
                  ${[
            ["Billing Email", "j••••@acmeshop.io", "Masked"],
            ["Credit Card", "•••• •••• •••• 4242", "Masked"],
            ["Authorization", "Bearer [REDACTED_TOKEN]", "Stripped"],
            ["API Secret Key", "sk_live_••••••••••••••••", "Stripped"],
          ].map(([lbl, val, status]) => `
                    <div style="display:flex;align-items:center;justify-content:space-between;padding:13px 14px;border-radius:12px;border:1px solid #E2E8F0;background:#F8FAFC;">
                      <div>
                        <div style="font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;">${lbl}</div>
                        <div class="mono" style="font-size:14px;font-weight:700;color:#0F172A;margin-top:2px;">${val}</div>
                      </div>
                      <span class="pill-green" style="font-size:11px;padding:3px 10px;">✓ ${status}</span>
                    </div>
                  `).join("")}
                </div>
              </div>
              <div style="margin-top:14px;padding:12px 14px;border-radius:12px;background:#EFF6FF;border:1px solid #BFDBFE;display:flex;align-items:center;gap:10px;font-size:12.5px;color:#1E3A8A;font-weight:600;">
                <img src="${DRIVE_LOGO_URI}" style="width:20px;height:20px;" />
                <span>Media uploads directly to your Google Drive - never touches BugSnap servers.</span>
              </div>
            </div>

            <div style="background:#fff;border:1px solid #E2E8F0;border-radius:16px;padding:20px;display:flex;flex-direction:column;justify-content:space-between;">
              <div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                  <div style="font-size:16px;font-weight:800;">Auto-Redaction Rules</div>
                  <span style="font-size:12px;font-weight:700;color:#fff;background:#89BD49;padding:5px 12px;border-radius:8px;">+ Add Rule</span>
                </div>
                <div style="display:flex;flex-direction:column;gap:12px;">
                  ${[
            ["Email Addresses", "[\\w.-]+@[\\w.-]+\\.\\w+", true],
            ["Credit Card Numbers", "\\b(?:\\d[- ]*){13,16}\\b", true],
            ["Bearer & API Tokens", "(Bearer|sk_live|ghp_)[\\w-]+", true],
            ["Phone Numbers", "\\+?\\d{8,15}", true],
            ["Session Cookies", "Set-Cookie / Cookie headers", true],
          ].map(([name, regex]) => `
                    <div style="display:flex;align-items:center;justify-content:space-between;padding:11px 14px;border-radius:12px;border:1px solid #E2E8F0;">
                      <div>
                        <div style="font-size:13.5px;font-weight:700;color:#0F172A;">${name}</div>
                        <div class="mono" style="font-size:11px;color:#64748B;margin-top:2px;">${regex}</div>
                      </div>
                      <div style="width:42px;height:24px;border-radius:999px;background:#89BD49;position:relative;flex-shrink:0;">
                        <div style="width:18px;height:18px;border-radius:50%;background:#fff;position:absolute;top:3px;right:3px;box-shadow:0 1px 3px rgba(0,0,0,0.2);"></div>
                      </div>
                    </div>
                  `).join("")}
                </div>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid #F1F5F9;font-size:12px;color:#475569;">
                <span>Processed locally in browser memory</span>
                <strong style="color:#16A34A;">0 bytes retained</strong>
              </div>
            </div>
          </div>
        </div>`,
      }),
    );

    // 5. ui-drive-storage.png (How It Works Step 04)
    await renderPng(
      browser,
      "ui-drive-storage.png",
      frameShell({
        bodyHtml: `
        <div class="window" style="width:100%;height:100%;display:flex;flex-direction:column;">
          <div class="win-bar">
            <span class="dot dot-r"></span><span class="dot dot-y"></span><span class="dot dot-g"></span>
            <div class="url-pill"><img src="${DRIVE_LOGO_URI}" style="width:15px;height:15px;" /> My Drive / BugSnap Captures / Checkout Flow</div>
            <div style="margin-left:auto;display:flex;gap:8px;">
              <span class="pill-green">100% Your Storage</span>
              <span class="pill-blue">OAuth 2.0 Direct Stream</span>
            </div>
          </div>
          <div style="flex:1;display:grid;grid-template-columns:240px 1fr;background:#fff;">
            <div style="border-right:1px solid #E2E8F0;background:#F8FAFC;padding:18px;display:flex;flex-direction:column;justify-content:space-between;">
              <div>
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;padding:10px 12px;background:#fff;border:1px solid #E2E8F0;border-radius:12px;">
                  <img src="${DRIVE_LOGO_URI}" style="width:24px;height:24px;" />
                  <div>
                    <div style="font-size:13px;font-weight:800;">Google Drive</div>
                    <div style="font-size:11px;color:#64748B;">qa@bugsnap.dev</div>
                  </div>
                </div>
                <div style="font-size:10.5px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;padding-left:8px;">Folders</div>
                ${[
            ["Checkout Flow", "#2563EB", true, "18"],
            ["Auth & Billing", "#89BD49", false, "12"],
            ["Mobile Web", "#F59E0B", false, "9"],
            ["API Errors", "#EF4444", false, "7"],
          ].map(([name, color, active, cnt]) => `
                  <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 10px;border-radius:10px;margin-bottom:4px;background:${active ? "#EFF6FF" : "transparent"};color:${active ? "#1D4ED8" : "#334155"};font-weight:${active ? "700" : "600"};font-size:13px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                      <span style="width:10px;height:10px;border-radius:3px;background:${color};"></span>
                      <span>${name}</span>
                    </div>
                    <span style="font-size:11px;opacity:0.7;">${cnt}</span>
                  </div>
                `).join("")}
              </div>
              <div style="background:#F2F9E8;border:1px solid #CBE5AC;border-radius:12px;padding:12px;">
                <div style="font-size:11.5px;font-weight:800;color:#3D7A24;">Zero-Server-Retention</div>
                <div style="font-size:11px;color:#4D7C0F;margin-top:3px;line-height:1.4;">Revoke access or delete files anytime directly in Drive.</div>
              </div>
            </div>

            <div style="padding:22px;display:flex;flex-direction:column;gap:16px;">
              <div style="display:flex;align-items:center;justify-content:space-between;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:14px;padding:14px 18px;">
                <div style="display:flex;align-items:center;gap:10px;">
                  <img src="${CHROME_LOGO_URI}" style="width:24px;height:24px;" />
                  <div>
                    <div style="font-size:13px;font-weight:700;">Browser Extension</div>
                    <div style="font-size:11px;color:#64748B;">Direct client-side upload</div>
                  </div>
                </div>
                <div style="flex:1;margin:0 18px;border-top:2px dashed #89BD49;position:relative;text-align:center;">
                  <span style="position:relative;top:-11px;background:#F2F9E8;border:1px solid #CBE5AC;color:#3D7A24;font-size:11px;font-weight:700;padding:2px 10px;border-radius:999px;">TLS 1.3 Encrypted →</span>
                </div>
                <div style="display:flex;align-items:center;gap:10px;">
                  <img src="${DRIVE_LOGO_URI}" style="width:24px;height:24px;" />
                  <div>
                    <div style="font-size:13px;font-weight:700;">Your Google Drive</div>
                    <div style="font-size:11px;color:#16A34A;font-weight:600;">Synced · 14.2 MB</div>
                  </div>
                </div>
              </div>

              <div style="border:1px solid #E2E8F0;border-radius:14px;overflow:hidden;flex:1;">
                <div style="display:grid;grid-template-columns:1fr 110px 130px;padding:11px 16px;background:#F8FAFC;border-bottom:1px solid #E2E8F0;font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;">
                  <span>Capture Artifact</span><span>Size</span><span style="text-align:right;">Uploaded</span>
                </div>
                ${[
            ["checkout-500-recording.webm", "Video · 60fps Tab Recording", "#FEF3C7", "#D97706", "8.4 MB", "Just now"],
            ["checkout-annotated.png", "PNG · 2x Retina Annotated", "#EFF6FF", "#2563EB", "1.2 MB", "Just now"],
            ["console-logs.json", "DevTools · 1 Runtime Error", "#FEF2F2", "#DC2626", "48 KB", "Just now"],
            ["network-trace.har", "HAR · Bearer Tokens Redacted", "#F2F9E8", "#3D7A24", "312 KB", "Just now"],
            ["environment-meta.json", "Env · Chrome 134 · macOS 15", "#F1F5F9", "#475569", "14 KB", "Just now"],
            ["checkout-500.spec.ts", "Test · Playwright Regression", "#F5F3FF", "#6D28D9", "3 KB", "Just now"],
          ].map(([file, sub, bg, col, size, time]) => `
                  <div style="display:grid;grid-template-columns:1fr 110px 130px;padding:12px 16px;border-bottom:1px solid #F1F5F9;align-items:center;">
                    <div style="display:flex;align-items:center;gap:12px;">
                      <span style="min-width:68px;text-align:center;padding:5px 8px;border-radius:8px;background:${bg};color:${col};font-size:11px;font-weight:800;">${sub.split(" · ")[0]}</span>
                      <div>
                        <div class="mono" style="font-size:13px;font-weight:700;color:#0F172A;">${file}</div>
                        <div style="font-size:11px;color:#64748B;">${sub}</div>
                      </div>
                    </div>
                    <span class="mono" style="font-size:12.5px;color:#475569;font-weight:600;">${size}</span>
                    <span style="text-align:right;font-size:12px;color:#16A34A;font-weight:700;">✓ ${time}</span>
                  </div>
                `).join("")}
              </div>
            </div>
          </div>
        </div>`,
      }),
    );

    // 6. ui-triage-export.png (How It Works Step 05)
    await renderPng(
      browser,
      "ui-triage-export.png",
      frameShell({
        bodyHtml: `
        <div style="position:relative;z-index:2;width:100%;height:100%;display:grid;grid-template-columns:1.02fr 0.98fr;gap:24px;align-items:center;">
          <div class="window" style="height:100%;display:flex;flex-direction:column;padding:24px;justify-content:space-between;">
            <div>
              <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:16px;border-bottom:1px solid #F1F5F9;">
                <div style="display:flex;align-items:center;gap:10px;">
                  <img src="${LOGO_DAY_URI}" style="width:24px;height:24px;" />
                  <div>
                    <div style="font-size:16px;font-weight:800;">Share & Access Controls</div>
                    <div style="font-size:12px;color:#64748B;">Checkout Pay HTTP 500 · cap_9a8f2</div>
                  </div>
                </div>
                <span class="pill-green">Link Ready</span>
              </div>

              <div style="margin-top:18px;display:flex;flex-direction:column;gap:12px;">
                <div style="border:2px solid #2563EB;background:#EFF6FF;border-radius:14px;padding:14px;display:flex;justify-content:space-between;align-items:center;">
                  <div>
                    <div style="font-size:14px;font-weight:700;color:#1E3A8A;">Anyone with the link</div>
                    <div style="font-size:12px;color:#3B82F6;">View capture, DevTools logs & add comments</div>
                  </div>
                  <div style="width:20px;height:20px;border-radius:50%;border:6px solid #2563EB;background:#fff;"></div>
                </div>
                <div style="border:1px solid #E2E8F0;border-radius:14px;padding:14px;display:flex;justify-content:space-between;align-items:center;">
                  <div>
                    <div style="font-size:14px;font-weight:700;color:#0F172A;">Workspace members only</div>
                    <div style="font-size:12px;color:#64748B;">Restricted to BugSnap QA Workspace</div>
                  </div>
                  <div style="width:20px;height:20px;border-radius:50%;border:2px solid #CBD5E1;"></div>
                </div>
                <div style="border:1px solid #E2E8F0;border-radius:14px;padding:14px;display:flex;justify-content:space-between;align-items:center;">
                  <div>
                    <div style="font-size:14px;font-weight:700;color:#0F172A;">Auto-expire link</div>
                    <div style="font-size:12px;color:#64748B;">Expires automatically in 7 days</div>
                  </div>
                  <div style="width:40px;height:22px;border-radius:999px;background:#89BD49;position:relative;"><div style="width:16px;height:16px;border-radius:50%;background:#fff;position:absolute;top:3px;right:3px;"></div></div>
                </div>
              </div>
            </div>

            <div style="display:flex;gap:10px;padding-top:16px;border-top:1px solid #F1F5F9;">
              <div class="mono" style="flex:1;background:#F8FAFC;border:1px solid #CBD5E1;border-radius:10px;padding:10px 12px;font-size:12.5px;color:#334155;">https://bugsnap.app/v/cap_9a8f2</div>
              <div style="background:#89BD49;color:#fff;font-weight:700;font-size:13px;padding:10px 18px;border-radius:10px;white-space:nowrap;">Copy Link</div>
            </div>
          </div>

          <div class="window" style="height:100%;display:flex;flex-direction:column;padding:24px;justify-content:space-between;">
            <div>
              <div style="font-size:16px;font-weight:800;margin-bottom:4px;">Export to Issue Trackers</div>
              <div style="font-size:12.5px;color:#64748B;margin-bottom:18px;">Sends annotated media, console errors, failed APIs & environment specs</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                ${[
            ["Jira Cloud", "ENG-412 Created", LOGOS.jira, true],
            ["Linear", "Connected · ENG", LOGOS.linear, true],
            ["GitHub Issues", "acme/web-app", LOGOS.github, true],
            ["Slack Alerts", "#qa-triage", LOGOS.slack, true],
            ["Notion Docs", "Bug Tracker DB", LOGOS.notion, false],
            ["GitLab", "Ready to connect", LOGOS.gitlab, false],
            ["ClickUp", "Sprint Backlog", LOGOS.clickup, false],
            ["Claude MCP", "Agent Debug", LOGOS.claude, true],
          ].map(([name, sub, logo, active]) => `
                  <div style="border:1px solid ${active ? "#CBE5AC" : "#E2E8F0"};background:${active ? "#F9FDF4" : "#fff"};border-radius:12px;padding:12px;display:flex;align-items:center;gap:10px;">
                    <img src="${logo}" style="width:28px;height:28px;object-fit:contain;border-radius:6px;" />
                    <div style="min-width:0;">
                      <div style="font-size:13px;font-weight:700;color:#0F172A;">${name}</div>
                      <div style="font-size:11px;color:${active ? "#3D7A24" : "#64748B"};font-weight:600;">${sub}</div>
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>
            <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;font-size:12px;">
              <span style="color:#475569;font-weight:600;">Formatted Markdown & cURL included</span>
              <span style="color:#2563EB;font-weight:700;">Instant Sync →</span>
            </div>
          </div>
        </div>`,
      }),
    );

    // 7. ui-spa-performance.png (Features Section 4)
    await renderPng(
      browser,
      "ui-spa-performance.png",
      frameShell({
        bodyHtml: `
        <div class="window" style="width:100%;height:100%;display:flex;flex-direction:column;">
          <div class="win-bar">
            <span class="dot dot-r"></span><span class="dot dot-y"></span><span class="dot dot-g"></span>
            <div class="url-pill"><img src="${LOGO_DAY_URI}" style="width:14px;height:14px;" /> Performance & SPA Diagnostics · checkout.acmeshop.io</div>
            <div style="margin-left:auto;display:flex;gap:8px;">
              <span class="pill-red">⚠ Memory Growth Detected</span>
            </div>
          </div>
          <div style="flex:1;padding:22px;display:flex;flex-direction:column;gap:18px;background:#fff;">
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;">
              ${[
            ["JS Heap Used", "48.2 MB", "+14.6 MB / 60s", "#DC2626", "#FEF2F2", "#FECACA"],
            ["DOM Nodes", "1,842", "+410 detached", "#2563EB", "#EFF6FF", "#BFDBFE"],
            ["Event Listeners", "276", "12 uncleaned", "#D97706", "#FFFBEB", "#FDE68A"],
            ["Long Tasks", "3 tasks", "Max 142 ms", "#3D7A24", "#F2F9E8", "#CBE5AC"],
          ].map(([label, val, sub, col, bg, bdr]) => `
                <div style="border:1px solid ${bdr};background:${bg};border-radius:14px;padding:14px 16px;">
                  <div style="font-size:11.5px;font-weight:700;color:#475569;">${label}</div>
                  <div class="mono" style="font-size:24px;font-weight:900;color:#0F172A;margin-top:4px;">${val}</div>
                  <div style="font-size:11.5px;font-weight:700;color:${col};margin-top:4px;">${sub}</div>
                </div>
              `).join("")}
            </div>

            <div style="flex:1;border:1px solid #E2E8F0;border-radius:16px;padding:18px 20px;background:#F8FAFC;display:flex;flex-direction:column;justify-content:space-between;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <div style="font-size:15px;font-weight:800;">Live Runtime Timeline (Last 60s)</div>
                  <div style="font-size:12px;color:#64748B;">Detached modal listeners climbing after repeated route transitions</div>
                </div>
                <div style="display:flex;gap:14px;font-size:12px;font-weight:700;">
                  <span style="color:#DC2626;">● JS Heap</span>
                  <span style="color:#2563EB;">● DOM Nodes</span>
                  <span style="color:#D97706;">● Listeners</span>
                </div>
              </div>
              <svg viewBox="0 0 980 230" style="width:100%;height:230px;overflow:visible;">
                <line x1="50" y1="25" x2="960" y2="25" stroke="#E2E8F0" stroke-dasharray="4 4" />
                <line x1="50" y1="90" x2="960" y2="90" stroke="#E2E8F0" stroke-dasharray="4 4" />
                <line x1="50" y1="155" x2="960" y2="155" stroke="#E2E8F0" stroke-dasharray="4 4" />
                <line x1="50" y1="205" x2="960" y2="205" stroke="#CBD5E1" />
                <text x="0" y="30" font-size="12" fill="#64748B" font-family="monospace">60 MB</text>
                <text x="0" y="95" font-size="12" fill="#64748B" font-family="monospace">40 MB</text>
                <text x="0" y="160" font-size="12" fill="#64748B" font-family="monospace">20 MB</text>
                <text x="6" y="209" font-size="12" fill="#64748B" font-family="monospace">0 MB</text>
                <defs>
                  <linearGradient id="heapFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#EF4444" stop-opacity="0.22" />
                    <stop offset="100%" stop-color="#EF4444" stop-opacity="0.01" />
                  </linearGradient>
                </defs>
                <path d="M50,175 C180,168 300,150 430,128 C560,104 690,74 820,48 L955,30 L955,205 L50,205 Z" fill="url(#heapFill)" />
                <path d="M50,175 C180,168 300,150 430,128 C560,104 690,74 820,48 L955,30" fill="none" stroke="#DC2626" stroke-width="3.5" stroke-linecap="round" />
                <path d="M50,185 C200,180 350,165 500,145 C650,125 800,102 955,82" fill="none" stroke="#2563EB" stroke-width="3" stroke-linecap="round" />
                <path d="M50,165 C220,164 380,156 540,142 C700,130 830,118 955,108" fill="none" stroke="#D97706" stroke-width="2.5" stroke-dasharray="6 4" stroke-linecap="round" />
                <circle cx="820" cy="48" r="7" fill="#DC2626" stroke="#fff" stroke-width="3" />
                <rect x="650" y="6" width="210" height="32" rx="8" fill="#0F172A" />
                <text x="664" y="26" font-size="12" font-weight="700" fill="#fff" font-family="sans-serif">⚠ Leak spike at 00:48 (+8.2 MB)</text>
              </svg>
              <div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid #E2E8F0;">
                <div style="display:flex;gap:12px;">
                  <span class="pill-green">LCP 1.8s · Good</span>
                  <span class="pill-green">CLS 0.02 · Good</span>
                  <span class="pill-blue">INP 64ms · Responsive</span>
                </div>
                <span class="mono" style="font-size:12px;color:#64748B;">0s · 15s · 30s · 45s · 60s</span>
              </div>
            </div>
          </div>
        </div>`,
      }),
    );

    // 8. ui-playwright-ai.png (Features Section 5 & How It Works Step 06)
    await renderPng(
      browser,
      "ui-playwright-ai.png",
      frameShell({
        bodyHtml: `
        <div class="window" style="width:100%;height:100%;display:flex;flex-direction:column;">
          <div class="win-bar">
            <span class="dot dot-r"></span><span class="dot dot-y"></span><span class="dot dot-g"></span>
            <div class="url-pill"><img src="${LOGO_DAY_URI}" style="width:14px;height:14px;" /> Playwright Regression Generator & AI Blueprint</div>
            <div style="margin-left:auto;display:flex;gap:8px;">
              <span class="pill-green">Runnable Test Ready</span>
              <span class="pill-blue">MCP Compatible</span>
            </div>
          </div>
          <div style="flex:1;display:grid;grid-template-columns:0.86fr 1.14fr;overflow:hidden;">
            <div style="padding:20px;background:#F8FAFC;border-right:1px solid #E2E8F0;display:flex;flex-direction:column;justify-content:space-between;">
              <div>
                <div style="font-size:14px;font-weight:800;margin-bottom:14px;">Captured User Actions</div>
                <div style="display:flex;flex-direction:column;gap:10px;">
                  ${[
            ["00:01", "Navigate", "app.acmeshop.io/checkout", false],
            ["00:03", "Fill Email", "finance@acmeshop.io", false],
            ["00:05", "Click Button", 'Pay $2,499.00', false],
            ["00:06", "Network 500", "POST /api/v1/checkout/charge", true],
            ["00:06", "Console Error", "TypeError: checkoutSessionId", true],
          ].map(([t, act, det, err]) => `
                    <div style="padding:11px 13px;border-radius:12px;border:1px solid ${err ? "#FECACA" : "#E2E8F0"};background:${err ? "#FEF2F2" : "#fff"};display:flex;align-items:flex-start;gap:10px;">
                      <span class="mono" style="font-size:11px;font-weight:700;color:${err ? "#DC2626" : "#2563EB"};background:${err ? "#FEE2E2" : "#EFF6FF"};padding:2px 7px;border-radius:6px;">${t}</span>
                      <div>
                        <div style="font-size:13px;font-weight:700;color:${err ? "#991B1B" : "#0F172A"};">${act}</div>
                        <div class="mono" style="font-size:11.5px;color:${err ? "#DC2626" : "#64748B"};margin-top:2px;">${det}</div>
                      </div>
                    </div>
                  `).join("")}
                </div>
              </div>
              <div style="background:#fff;border:1px solid #E2E8F0;border-radius:12px;padding:12px 14px;display:flex;align-items:center;gap:10px;">
                <img src="${LOGOS.claude}" style="width:24px;height:24px;border-radius:6px;" />
                <div style="font-size:12px;color:#334155;"><strong>AI Fix Blueprint:</strong> Guard null <span class="mono">checkoutSessionId</span> before charge submit.</div>
              </div>
            </div>

            <div style="background:#0F172A;padding:22px;display:flex;flex-direction:column;justify-content:space-between;color:#E2E8F0;">
              <div>
                <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:14px;border-bottom:1px solid #1E293B;margin-bottom:16px;">
                  <div style="display:flex;gap:16px;font-size:13px;font-weight:700;">
                    <span style="color:#A8D666;border-bottom:2px solid #89BD49;padding-bottom:14px;margin-bottom:-15px;">checkout-500.spec.ts</span>
                    <span style="color:#64748B;">Repro Steps</span>
                    <span style="color:#64748B;">MCP JSON</span>
                  </div>
                  <span style="background:#1E293B;border:1px solid #334155;color:#E2E8F0;font-size:12px;font-weight:600;padding:5px 12px;border-radius:8px;">Copy Spec</span>
                </div>
                <pre class="mono" style="font-size:13.5px;line-height:1.8;color:#E2E8F0;">
<span style="color:#64748B;"> 1</span>  <span style="color:#C084FC;">import</span> { test, expect } <span style="color:#C084FC;">from</span> <span style="color:#86EFAC;">'@playwright/test'</span>;
<span style="color:#64748B;"> 2</span>
<span style="color:#64748B;"> 3</span>  <span style="color:#60A5FA;">test</span>(<span style="color:#86EFAC;">'checkout charge handles missing session'</span>, <span style="color:#C084FC;">async</span> ({ page }) =&gt; {
<span style="color:#64748B;"> 4</span>    <span style="color:#C084FC;">await</span> page.<span style="color:#60A5FA;">goto</span>(<span style="color:#86EFAC;">'https://app.acmeshop.io/checkout'</span>);
<span style="color:#64748B;"> 5</span>    <span style="color:#C084FC;">await</span> page.<span style="color:#60A5FA;">fill</span>(<span style="color:#86EFAC;">'input[name="email"]'</span>, <span style="color:#86EFAC;">'finance@acmeshop.io'</span>);
<span style="color:#64748B;"> 6</span>    <span style="color:#C084FC;">await</span> page.<span style="color:#60A5FA;">getByRole</span>(<span style="color:#86EFAC;">'button'</span>, { name: <span style="color:#86EFAC;">'Pay $2,499.00'</span> }).<span style="color:#60A5FA;">click</span>();
<span style="color:#64748B;"> 7</span>
<span style="color:#64748B;"> 8</span>    <span style="color:#C084FC;">await</span> <span style="color:#60A5FA;">expect</span>(page.<span style="color:#60A5FA;">getByText</span>(<span style="color:#86EFAC;">'HTTP 500'</span>)).<span style="color:#60A5FA;">toBeHidden</span>();
<span style="color:#64748B;"> 9</span>    <span style="color:#C084FC;">await</span> <span style="color:#60A5FA;">expect</span>(page).<span style="color:#60A5FA;">toHaveURL</span>(<span style="color:#FBBF24;">/order-confirmed/</span>);
<span style="color:#64748B;">10</span>  });</pre>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;padding-top:14px;border-top:1px solid #1E293B;font-size:12px;">
                <span class="mono" style="color:#94A3B8;">npx playwright test checkout-500.spec.ts</span>
                <span style="background:#89BD49;color:#fff;font-weight:700;padding:6px 14px;border-radius:8px;">Export to Repo</span>
              </div>
            </div>
          </div>
        </div>`,
      }),
    );

    // 9. ui-qa-workflow.png (Solutions Section 1: QA)
    await renderPng(
      browser,
      "ui-qa-workflow.png",
      frameShell({
        bodyHtml: `
        <div style="position:relative;z-index:2;width:100%;height:100%;display:grid;grid-template-columns:328px 1fr;gap:22px;align-items:center;">
          <div style="border-radius:18px;overflow:hidden;border:1px solid #CBD5E1;box-shadow:0 24px 55px -12px rgba(15,23,42,0.2);background:#fff;">
            <img src="${popupRecordUri}" style="width:100%;display:block;" />
          </div>
          <div class="window" style="height:100%;display:flex;flex-direction:column;">
            <div class="win-bar">
              <span class="dot dot-r"></span><span class="dot dot-y"></span><span class="dot dot-g"></span>
              <div class="url-pill"><span style="color:#EF4444;">● REC 00:24</span> QA Step & Voice Log</div>
              <div style="margin-left:auto;display:flex;align-items:center;gap:8px;">
                <img src="${LOGOS.jira}" style="width:18px;height:18px;" />
                <span class="pill-green" style="font-size:11px;padding:3px 10px;">Synced to ENG-412</span>
              </div>
            </div>
            <div style="flex:1;padding:22px;display:flex;flex-direction:column;justify-content:space-between;background:#fff;">
              <div style="display:flex;flex-direction:column;gap:12px;">
                <div style="padding:14px 16px;border-radius:14px;border:1px solid #E2E8F0;background:#F8FAFC;">
                  <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;color:#2563EB;margin-bottom:4px;">
                    <span>Step 1 · 00:04</span><span class="mono" style="color:#64748B;">10:14:23</span>
                  </div>
                  <div style="font-size:14.5px;font-weight:700;color:#0F172A;">Entered billing email &amp; clicked &quot;Pay $2,499.00&quot;</div>
                </div>
                <div style="padding:14px 16px;border-radius:14px;border:1px solid #FECACA;background:#FEF2F2;">
                  <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;color:#DC2626;margin-bottom:4px;">
                    <span>Step 2 · 00:12 - Unhandled Exception</span><span class="mono" style="color:#DC2626;">10:14:31</span>
                  </div>
                  <div class="mono" style="font-size:13px;font-weight:700;color:#991B1B;">POST /api/v1/checkout/charge → 500 Internal Server Error</div>
                  <div class="mono" style="font-size:12px;color:#B91C1C;margin-top:4px;">TypeError: Cannot read properties of undefined (checkout.ts:148)</div>
                </div>
                <div style="padding:14px 16px;border-radius:14px;border:1px solid #E2E8F0;background:#F8FAFC;">
                  <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;color:#3D7A24;margin-bottom:4px;">
                    <span>Step 3 · 00:18 - Visual Annotation</span><span class="mono" style="color:#64748B;">10:14:37</span>
                  </div>
                  <div style="font-size:14px;font-weight:600;color:#334155;">Highlighted failed payment CTA &amp; auto-blurred card digits</div>
                </div>
              </div>

              <div style="border:1px solid #E2E8F0;border-radius:14px;padding:14px 16px;background:#F8FAFC;display:flex;align-items:center;justify-content:space-between;gap:14px;">
                <div style="display:flex;align-items:center;gap:12px;">
                  <div style="width:36px;height:36px;border-radius:50%;background:#2563EB;color:#fff;display:grid;place-items:center;font-weight:800;font-size:13px;">▶</div>
                  <div>
                    <div style="font-size:13px;font-weight:700;color:#0F172A;">Voice Narration Attached</div>
                    <div style="font-size:12px;color:#64748B;">&quot;Clicking Pay throws HTTP 500 on Enterprise annual plan.&quot;</div>
                  </div>
                </div>
                <span class="mono" style="font-size:12.5px;font-weight:700;color:#2563EB;white-space:nowrap;">00:24 · HD</span>
              </div>

              <div style="display:flex;gap:10px;flex-wrap:wrap;">
                <span class="pill-blue">Chrome 134 · macOS 15</span>
                <span class="pill-green">Saved to Google Drive</span>
                <span class="pill-red">2 Errors Auto-Attached</span>
              </div>
            </div>
          </div>
        </div>`,
      }),
    );

    // 10. ui-product-review.png (Solutions Section 3: Product Management)
    await renderPng(
      browser,
      "ui-product-review.png",
      frameShell({
        bodyHtml: `
        <div class="window" style="width:100%;height:100%;display:flex;flex-direction:column;">
          <div class="win-bar">
            <span class="dot dot-r"></span><span class="dot dot-y"></span><span class="dot dot-g"></span>
            <div class="url-pill"><img src="${LOGO_DAY_URI}" style="width:14px;height:14px;" /> Q2 Launch / Pricing Review · Visual Feedback</div>
            <div style="margin-left:auto;display:flex;gap:8px;">
              <span class="pill-blue">2 Pinned Comments</span>
              <span class="pill-green">In Review</span>
            </div>
          </div>
          <div style="flex:1;display:grid;grid-template-columns:1.18fr 0.82fr;overflow:hidden;">
            <div style="position:relative;background:#F8FAFC;border-right:1px solid #E2E8F0;padding:24px;display:flex;align-items:center;justify-content:center;">
              <div style="width:100%;background:#fff;border:1px solid #CBD5E1;border-radius:16px;padding:22px;box-shadow:0 12px 30px rgba(15,23,42,0.06);position:relative;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
                  <div>
                    <div style="font-size:18px;font-weight:800;">AcmeShop Plans</div>
                    <div style="font-size:12px;color:#64748B;">Upgrade your workspace anytime</div>
                  </div>
                  <div style="background:#EFF6FF;color:#2563EB;font-size:12px;font-weight:700;padding:5px 12px;border-radius:999px;">Annual Billing</div>
                </div>
                <div style="border:2.5px dashed #EF4444;background:#FEF2F2;border-radius:12px;padding:14px 16px;text-align:center;position:relative;margin-bottom:18px;">
                  <span style="position:absolute;top:-14px;left:-14px;width:28px;height:28px;border-radius:50%;background:#EF4444;color:#fff;font-weight:800;font-size:13px;display:grid;place-items:center;box-shadow:0 4px 10px rgba(239,68,68,0.4);">1</span>
                  <div style="font-size:15px;font-weight:800;color:#DC2626;">Get 30% off for all visitors - Limited Offer</div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
                  <div style="border:1px solid #E2E8F0;border-radius:12px;padding:16px;">
                    <div style="font-size:13px;font-weight:700;color:#64748B;">Starter</div>
                    <div style="font-size:26px;font-weight:900;margin:6px 0;">$19<span style="font-size:13px;font-weight:500;color:#64748B;">/mo</span></div>
                    <div style="height:34px;border-radius:8px;background:#F1F5F9;display:grid;place-items:center;font-size:12px;font-weight:700;color:#334155;margin-top:12px;">Current Plan</div>
                  </div>
                  <div style="border:2px solid #2563EB;border-radius:12px;padding:16px;position:relative;">
                    <span style="position:absolute;bottom:-12px;right:-12px;width:28px;height:28px;border-radius:50%;background:#2563EB;color:#fff;font-weight:800;font-size:13px;display:grid;place-items:center;box-shadow:0 4px 10px rgba(37,99,235,0.4);">2</span>
                    <div style="font-size:13px;font-weight:700;color:#2563EB;">Enterprise</div>
                    <div style="font-size:26px;font-weight:900;margin:6px 0;">$99<span style="font-size:13px;font-weight:500;color:#64748B;">/mo</span></div>
                    <div style="height:34px;border-radius:8px;background:#2563EB;color:#fff;display:grid;place-items:center;font-size:12px;font-weight:700;margin-top:12px;">Upgrade Workspace</div>
                  </div>
                </div>
              </div>
            </div>

            <div style="padding:20px;background:#fff;display:flex;flex-direction:column;justify-content:space-between;">
              <div>
                <div style="font-size:15px;font-weight:800;margin-bottom:14px;">Pinned Thread Comments</div>
                <div style="display:flex;flex-direction:column;gap:14px;">
                  <div style="border:1px solid #FECACA;background:#FFFBFB;border-radius:14px;padding:14px;">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                      <span style="width:24px;height:24px;border-radius:50%;background:#EF4444;color:#fff;font-weight:800;font-size:12px;display:grid;place-items:center;">1</span>
                      <strong style="font-size:13px;">Sarah (PM)</strong>
                      <span style="font-size:11px;color:#94A3B8;margin-left:auto;">2m ago</span>
                    </div>
                    <div style="font-size:13px;color:#334155;line-height:1.5;">This 30% discount banner should only appear for annual members, not anonymous visitors.</div>
                  </div>
                  <div style="border:1px solid #BFDBFE;background:#F8FBFF;border-radius:14px;padding:14px;">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                      <span style="width:24px;height:24px;border-radius:50%;background:#2563EB;color:#fff;font-weight:800;font-size:12px;display:grid;place-items:center;">2</span>
                      <strong style="font-size:13px;">Alex (Design)</strong>
                      <span style="font-size:11px;color:#94A3B8;margin-left:auto;">Just now</span>
                    </div>
                    <div style="font-size:13px;color:#334155;line-height:1.5;">Updated CTA contrast and aligned card padding to our 16px grid. Ready for QA sign-off.</div>
                  </div>
                </div>
              </div>
              <div style="display:flex;gap:8px;padding-top:12px;border-top:1px solid #F1F5F9;">
                <div style="flex:1;border:1px solid #CBD5E1;border-radius:10px;padding:10px 12px;font-size:12.5px;color:#94A3B8;">Add a pinned comment...</div>
                <div style="background:#89BD49;color:#fff;font-weight:700;font-size:12.5px;padding:10px 16px;border-radius:10px;">Post</div>
              </div>
            </div>
          </div>
        </div>`,
      }),
    );

    // 11. ui-support-escalation.png (Solutions Section 4: Customer Support)
    await renderPng(
      browser,
      "ui-support-escalation.png",
      frameShell({
        bodyHtml: `
        <div class="window" style="width:100%;height:100%;display:flex;flex-direction:column;">
          <div class="win-bar">
            <span class="dot dot-r"></span><span class="dot dot-y"></span><span class="dot dot-g"></span>
            <div class="url-pill"><img src="${LOGO_DAY_URI}" style="width:14px;height:14px;" /> Support Escalation · Ticket #SUP-1084</div>
            <div style="margin-left:auto;display:flex;gap:8px;">
              <span class="pill-green">Ready for Engineering</span>
            </div>
          </div>
          <div style="flex:1;padding:24px;background:#F8FAFC;display:grid;grid-template-columns:1.05fr 0.95fr;gap:22px;">
            <div style="background:#fff;border:1px solid #E2E8F0;border-radius:16px;padding:18px;display:flex;flex-direction:column;justify-content:space-between;">
              <div>
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
                  <img src="${SUPPORT_MASCOT_URI}" style="width:42px;height:42px;object-fit:contain;" />
                  <div>
                    <div style="font-size:15px;font-weight:800;">Customer Session Recording</div>
                    <div style="font-size:12px;color:#64748B;">Reported by: E-Commerce Billing Admin</div>
                  </div>
                </div>
                <div style="position:relative;border-radius:12px;overflow:hidden;border:1px solid #CBD5E1;background:#0F172A;">
                  <img src="${checkoutUri}" style="width:100%;display:block;opacity:0.9;" />
                  <div style="position:absolute;inset:0;display:grid;place-items:center;background:rgba(15,23,42,0.18);">
                    <div style="width:58px;height:58px;border-radius:50%;background:rgba(15,23,42,0.86);color:#fff;display:grid;place-items:center;font-size:20px;box-shadow:0 10px 25px rgba(0,0,0,0.35);">▶</div>
                  </div>
                  <div class="mono" style="position:absolute;bottom:10px;right:10px;background:rgba(15,23,42,0.85);color:#fff;font-size:11px;font-weight:700;padding:4px 9px;border-radius:6px;">00:42 · HD</div>
                </div>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:12px;border-top:1px solid #F1F5F9;font-size:12px;color:#475569;">
                <span class="mono">Jakarta, ID · Chrome 134 · 1920×1080</span>
                <span style="color:#16A34A;font-weight:700;">PII Masked</span>
              </div>
            </div>

            <div style="background:#fff;border:1px solid #E2E8F0;border-radius:16px;padding:20px;display:flex;flex-direction:column;justify-content:space-between;">
              <div>
                <div style="font-size:15px;font-weight:800;margin-bottom:4px;">Zero Back-and-Forth Diagnostics</div>
                <div style="font-size:12.5px;color:#64748B;margin-bottom:16px;">Captured silently in the background - no DevTools knowledge required.</div>
                <div style="display:flex;flex-direction:column;gap:10px;">
                  <div style="padding:12px 14px;border-radius:12px;border:1px solid #FECACA;background:#FEF2F2;display:flex;justify-content:space-between;align-items:center;">
                    <div>
                      <div style="font-size:13px;font-weight:700;color:#991B1B;">Failed API Request</div>
                      <div class="mono" style="font-size:11.5px;color:#DC2626;">POST /api/v1/checkout/charge · 500</div>
                    </div>
                    <span class="pill-red" style="font-size:11px;">500</span>
                  </div>
                  <div style="padding:12px 14px;border-radius:12px;border:1px solid #E2E8F0;background:#F8FAFC;display:flex;justify-content:space-between;align-items:center;">
                    <div>
                      <div style="font-size:13px;font-weight:700;color:#0F172A;">Console Stack Trace</div>
                      <div class="mono" style="font-size:11.5px;color:#64748B;">2 runtime errors captured</div>
                    </div>
                    <span class="pill-blue" style="font-size:11px;">Attached</span>
                  </div>
                  <div style="padding:12px 14px;border-radius:12px;border:1px solid #CBE5AC;background:#F9FDF4;display:flex;justify-content:space-between;align-items:center;">
                    <div>
                      <div style="font-size:13px;font-weight:700;color:#3D7A24;">Shareable Capture URL</div>
                      <div class="mono" style="font-size:11.5px;color:#4D7C0F;">bugsnap.app/v/cap_9a8f2</div>
                    </div>
                    <span class="pill-green" style="font-size:11px;">Copied</span>
                  </div>
                </div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding-top:14px;border-top:1px solid #F1F5F9;">
                <div style="border:1px solid #E2E8F0;border-radius:12px;padding:10px 12px;display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:700;">
                  <img src="${LOGOS.slack}" style="width:20px;height:20px;" /> Escalate to Slack
                </div>
                <div style="border:1px solid #CBE5AC;background:#F2F9E8;border-radius:12px;padding:10px 12px;display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:700;color:#3D7A24;">
                  <img src="${LOGOS.jira}" style="width:20px;height:20px;" /> Create Jira Bug
                </div>
              </div>
            </div>
          </div>
        </div>`,
      }),
    );

    // 12. ui-mcp-workflow.png (/docs/mcp architecture & agent workflow)
    await renderPng(
      browser,
      "ui-mcp-workflow.png",
      frameShell({
        width: 1200,
        height: 620,
        bodyHtml: `
        <div style="position:relative;z-index:2;width:100%;height:100%;display:grid;grid-template-columns:1fr 44px 0.92fr 44px 1.12fr;align-items:center;">
          <div class="window" style="height:100%;padding:20px;display:flex;flex-direction:column;justify-content:space-between;">
            <div>
              <span class="pill-blue" style="font-size:11px;margin-bottom:10px;">1 · Live Capture Context</span>
              <div style="font-size:16px;font-weight:800;margin-bottom:12px;">BugSnap Report</div>
              <div style="border:1px solid #E2E8F0;border-radius:10px;overflow:hidden;margin-bottom:12px;">
                <img src="${checkoutUri}" style="width:100%;display:block;" />
              </div>
              <div style="display:flex;flex-direction:column;gap:8px;font-size:12px;">
                <div style="padding:8px 10px;border-radius:8px;background:#FEF2F2;border:1px solid #FECACA;color:#991B1B;font-weight:700;">✕ HTTP 500 · /api/v1/checkout/charge</div>
                <div style="padding:8px 10px;border-radius:8px;background:#F8FAFC;border:1px solid #E2E8F0;color:#334155;font-weight:600;">Pinned comments + Console trace</div>
              </div>
            </div>
            <div style="font-size:11.5px;color:#64748B;display:flex;align-items:center;gap:6px;">
              <img src="${DRIVE_LOGO_URI}" style="width:16px;height:16px;" /> Stored privately in Google Drive
            </div>
          </div>

          <div style="display:grid;place-items:center;color:#2563EB;font-size:26px;font-weight:900;">→</div>

          <div class="window" style="height:100%;padding:20px;display:flex;flex-direction:column;justify-content:space-between;border:2px solid #89BD49;">
            <div>
              <span class="pill-green" style="font-size:11px;margin-bottom:10px;">2 · MCP Server</span>
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
                <img src="${LOGO_DAY_URI}" style="width:28px;height:28px;" />
                <div>
                  <div class="mono" style="font-size:14.5px;font-weight:800;">@bugsnap/mcp</div>
                  <div style="font-size:11.5px;color:#64748B;">Model Context Protocol</div>
                </div>
              </div>
              <div style="display:flex;flex-direction:column;gap:10px;">
                ${[
            ["list_reports", "Search captures by workspace"],
            ["get_report_context", "Screenshot + logs + blueprint"],
            ["create_report", "Capture & file new report"],
            ["get_report_status", "Fetch report status & URL"],
          ].map(([fn, desc]) => `
                  <div style="padding:10px 12px;border-radius:10px;background:#F8FAFC;border:1px solid #E2E8F0;">
                    <div class="mono" style="font-size:12px;font-weight:800;color:#2563EB;">${fn}()</div>
                    <div style="font-size:11.5px;color:#475569;margin-top:2px;">${desc}</div>
                  </div>
                `).join("")}
              </div>
            </div>
            <div class="mono" style="font-size:11px;color:#3D7A24;font-weight:700;background:#F2F9E8;padding:8px 10px;border-radius:8px;text-align:center;">BUGSNAP_API_KEY authenticated</div>
          </div>

          <div style="display:grid;place-items:center;color:#89BD49;font-size:26px;font-weight:900;">→</div>

          <div class="window" style="height:100%;background:#0F172A;border-color:#1E293B;color:#E2E8F0;padding:20px;display:flex;flex-direction:column;justify-content:space-between;">
            <div>
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
                <span style="background:rgba(137,189,73,0.18);color:#A8D666;border:1px solid rgba(137,189,73,0.4);border-radius:999px;padding:3px 10px;font-size:11px;font-weight:700;">3 · AI Coding Agent</span>
                <div style="display:flex;align-items:center;gap:6px;">
                  <img src="${LOGOS.claude}" style="width:20px;height:20px;border-radius:4px;" />
                  <span style="font-size:12px;font-weight:700;color:#F8FAFC;">Claude Code / Cursor</span>
                </div>
              </div>
              <div style="background:#1E293B;border:1px solid #334155;border-radius:10px;padding:11px 13px;font-size:12px;color:#E2E8F0;margin-bottom:12px;">
                <span style="color:#94A3B8;">Prompt:</span> &quot;Inspect latest BugSnap checkout 500 capture and fix the root cause.&quot;
              </div>
              <div class="mono" style="font-size:11.5px;color:#94A3B8;margin-bottom:10px;">
                ✓ Called <span style="color:#60A5FA;">get_report_context(cap_9a8f2)</span><br/>
                ✓ Found null <span style="color:#FCA5A5;">checkoutSessionId</span> in checkout.ts:148
              </div>
              <pre class="mono" style="background:#020617;border:1px solid #1E293B;border-radius:10px;padding:12px;font-size:11.5px;line-height:1.65;color:#CBD5E1;">
<span style="color:#F87171;">- const id = session.checkoutSessionId;</span>
<span style="color:#86EFAC;">+ const id = session?.checkoutSessionId</span>
<span style="color:#86EFAC;">+   ?? await createCheckoutSession(cart);</span>
  return postCharge({ orderId, id });</pre>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid #1E293B;font-size:12px;">
              <span style="color:#86EFAC;font-weight:700;">✓ Root cause fixed &amp; verified</span>
              <span style="background:#89BD49;color:#fff;font-weight:700;padding:5px 12px;border-radius:8px;">Apply Fix</span>
            </div>
          </div>
        </div>`,
      }),
      1200,
      620,
    );
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
