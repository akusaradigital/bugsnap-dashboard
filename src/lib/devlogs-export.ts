// Export formats built from a capture's dev logs: curl, markdown bug report,
// HAR. Split out of DevToolsPanel.tsx - pure string building, no React.
import {
  type ActionLog,
  type CaptureMeta,
  type ConsoleLog,
  type NavigationLog,
  type NetworkLog,
  type ScreenshotLog,
  type StorageLog,
  type TimedLog,
  HTTP_STATUS_TEXT,
  cleanStackTrace,
  conciseConsoleText,
} from "@/lib/devlogs";

const ALLOWED_CURL_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);

function harHeaders(headers: Record<string, string> | undefined, body: string) {
  const list = Object.entries(headers || {}).map(([name, value]) => ({ name, value: String(value) }));
  if (list.length === 0 && body) return [{ name: "Content-Type", value: "application/json" }];
  return list;
}

function mimeOf(headers: Record<string, string> | undefined): string {
  const hit = Object.entries(headers || {}).find(([n]) => n.toLowerCase() === "content-type");
  return hit ? String(hit[1]).split(";")[0].trim() : "application/json";
}

export function buildCurlCommand(log: NetworkLog): string {
  const rawMethod = (log.method || "GET").toUpperCase().trim();
  const method = ALLOWED_CURL_METHODS.has(rawMethod) ? rawMethod : "GET";
  const cleanUrl = (log.url || "").replace(/[\x00-\x1f\x7f]/g, "").trim();
  const safeUrl = cleanUrl.replace(/(["\\$`])/g, "\\$1");
  let cmd = `curl -X ${method} "${safeUrl}"`;
  // Replaying a request needs the headers it actually carried; the old
  // hardcoded Content-Type produced a curl that 415s on half the APIs.
  const headerEntries = Object.entries(log.requestHeaders || {});
  for (const [name, value] of headerEntries) {
    const safeName = String(name).replace(/[^\w.-]/g, "");
    if (!safeName) continue;
    const safeValue = String(value).replace(/[\x00-\x1f\x7f]/g, "").replace(/(["\\$`])/g, "\\$1");
    cmd += ` -H "${safeName}: ${safeValue}"`;
  }
  if (log.requestBody) {
    const cleanBody = log.requestBody.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "");
    const escaped = cleanBody.replace(/'/g, "'\\''");
    const hasContentType = headerEntries.some(([n]) => n.toLowerCase() === "content-type");
    if (!hasContentType) cmd += ' -H "Content-Type: application/json"';
    cmd += ` -d '${escaped}'`;
  }
  return cmd;
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
  capture: CaptureMeta;
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

    let entryStartedDateTime = startedDateTime;
    if (log.timestamp) {
      const parsed = typeof log.timestamp === "number" ? new Date(log.timestamp) : new Date(String(log.timestamp));
      if (!isNaN(parsed.getTime())) {
        entryStartedDateTime = parsed.toISOString();
      }
    }

    return {
      _index: index,
      startedDateTime: entryStartedDateTime,
      time: duration,
      request: {
        method: (log.method || "GET").toUpperCase(),
        url: log.url || "",
        httpVersion: "HTTP/1.1",
        cookies: [],
        headers: harHeaders(log.requestHeaders, reqBody),
        queryString: [],
        postData: reqBody ? { mimeType: mimeOf(log.requestHeaders), text: reqBody } : undefined,
        headersSize: -1,
        bodySize: reqBody ? reqBody.length : 0,
      },
      response: {
        status,
        statusText,
        httpVersion: "HTTP/1.1",
        cookies: [],
        headers: harHeaders(log.responseHeaders, resBody),
        content: {
          size: resBody ? resBody.length : 0,
          mimeType: mimeOf(log.responseHeaders),
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

export interface PlaywrightTestOptions {
  capture: CaptureMeta;
  targetHost?: string;
  actionLogs?: (ActionLog | NavigationLog | ScreenshotLog)[];
  networkErrors?: NetworkLog[];
  consoleErrors?: ConsoleLog[];
}

export function buildPlaywrightTest({
  capture,
  targetHost,
  actionLogs = [],
  networkErrors = [],
  consoleErrors = [],
}: PlaywrightTestOptions): string {
  const title = (capture.title || "Bug Reproduction").replace(/['"\\]/g, "");
  const targetUrl = capture.site_url || (targetHost ? `https://${targetHost}` : "http://localhost:3000");
  const cleanTargetUrl = targetUrl.replace(/["\\$`]/g, "\\$1");

  const lines: string[] = [];
  lines.push("// Automatically generated by BugSnap (https://bugsnap.akusaraproject.my.id)");
  lines.push("// Run this test locally: npx playwright test");
  lines.push("import { test, expect } from '@playwright/test';");
  lines.push("");
  lines.push(`test.describe('BugSnap Regression Suite', () => {`);
  lines.push(`  test('reproduce: ${title}', async ({ page }) => {`);

  // Window size
  if (capture.window_size && /^\d+\s*x\s*\d+$/i.test(capture.window_size)) {
    const [w, h] = capture.window_size.toLowerCase().split("x").map((s) => parseInt(s.trim(), 10));
    if (w > 0 && h > 0) {
      lines.push(`    // Set viewport matching capture`);
      lines.push(`    await page.setViewportSize({ width: ${w}, height: ${h} });`);
      lines.push("");
    }
  }

  // Network mocks for failed requests
  if (networkErrors.length > 0) {
    lines.push(`    // Mock failing network requests to deterministically trigger bug conditions`);
    networkErrors.slice(0, 3).forEach((req) => {
      try {
        const parsed = new URL(req.url || "");
        const pathPattern = `**${parsed.pathname}*`;
        const status = req.status || 500;
        const bodyObj = req.responseBody ? req.responseBody.slice(0, 500) : JSON.stringify({ error: `Mocked ${status} error from BugSnap` });
        lines.push(`    await page.route('${pathPattern}', async (route) => {`);
        lines.push(`      await route.fulfill({`);
        lines.push(`        status: ${status},`);
        lines.push(`        contentType: 'application/json',`);
        lines.push(`        body: ${JSON.stringify(bodyObj)},`);
        lines.push(`      });`);
        lines.push(`    });`);
      } catch {
        const safeUrl = (req.url || "").replace(/['"\\]/g, "");
        lines.push(`    await page.route('**/${safeUrl}', async (route) => {`);
        lines.push(`      await route.fulfill({ status: ${req.status || 500} });`);
        lines.push(`    });`);
      }
    });
    lines.push("");
  }

  // 1. Initial navigation
  lines.push(`    // 1. Navigate to target application`);
  lines.push(`    await page.goto('${cleanTargetUrl}', { waitUntil: 'domcontentloaded' });`);
  lines.push("");

  // 2. User actions
  if (actionLogs.length > 0) {
    lines.push(`    // 2. Replay recorded user steps`);
    const recent = actionLogs.slice(-10);
    recent.forEach((act) => {
      const msg = (act.message || ("url" in act && act.url ? `Navigate to ${act.url}` : "")).trim();
      if (!msg) return;

      if (/^click/i.test(msg)) {
        const btnMatch = msg.match(/(?:button|link|element)?[:\s]+["']?([^"'\n\r]+)["']?$/i);
        const name = btnMatch && btnMatch[1] ? btnMatch[1].trim().slice(0, 40) : "";
        if (name && !name.includes(">") && !name.includes(".")) {
          lines.push(`    await page.getByRole('button', { name: '${name.replace(/['\\]/g, "\\'")}' }).click();`);
        } else {
          lines.push(`    await page.locator('button, a, [role="button"]').first().click();`);
        }
      } else if (/^(?:typed|type|input)/i.test(msg)) {
        const inputMatch = msg.match(/in\s+([^:]+):\s*(.*)$/i);
        if (inputMatch) {
          const selector = inputMatch[1].trim();
          const val = inputMatch[2].trim().replace(/['\\]/g, "\\'");
          lines.push(`    await page.locator('${selector.replace(/['\\]/g, "\\'")}').fill('${val}');`);
        } else {
          lines.push(`    await page.locator('input').first().fill('test-input');`);
        }
      } else if (/^navigate/i.test(msg)) {
        const urlMatch = msg.match(/to\s+(https?:\/\/[^\s]+)/i);
        if (urlMatch) {
          lines.push(`    await page.goto('${urlMatch[1]}');`);
        }
      }
    });
    lines.push("");
  }

  // 3. Assertion & Quality Gate
  lines.push(`    // 3. Assert error state & quality gate`);
  if (consoleErrors.length > 0) {
    lines.push(`    // Expect alert, toast error, or validation banner to be visible`);
    lines.push(`    const errorNotice = page.locator('[role="alert"], .toast-error, .error-banner, [data-testid="error"]');`);
    lines.push(`    await expect(errorNotice.first()).toBeVisible({ timeout: 5000 });`);
  } else {
    lines.push(`    // Verify target element remains responsive`);
    lines.push(`    await expect(page.locator('body')).toBeVisible();`);
  }

  lines.push(`  });`);
  lines.push(`});`);

  return lines.join("\n");
}

export interface GitHubActionWorkflowOptions {
  capture: CaptureMeta;
  targetHost?: string;
  testFileName?: string;
}

export function buildGitHubActionWorkflow({
  capture,
  targetHost,
  testFileName,
}: GitHubActionWorkflowOptions): string {
  const safeId = (capture.id || "capture").replace(/[^a-z0-9_-]/gi, "-").toLowerCase();
  const file = testFileName || `tests/regression/bugsnap-${safeId}.spec.ts`;
  const hostLabel = targetHost || "Application";

  return `name: BugSnap Quality Gate (Regression Test)

# Automated regression quality gate generated by BugSnap
# Prevents defect "${(capture.title || "BugSnap Issue").replace(/['"\\]/g, "")}" from regressing in production.

on:
  pull_request:
    branches: [main, master, develop]
  workflow_dispatch:

concurrency:
  group: bugsnap-quality-gate-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  regression-test:
    name: Verify BugSnap Fix (${hostLabel})
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci || npm install

      - name: Install Playwright Chromium
        run: npx playwright install --with-deps chromium

      - name: Execute BugSnap Regression Test
        run: npx playwright test ${file}
        env:
          CI: true

      - name: Upload Playwright Report on Failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: bugsnap-playwright-report
          path: playwright-report/
          retention-days: 7
`;
}

export interface AiMcpPromptOptions {
  capture: CaptureMeta;
  targetHost?: string;
  detectedOs: string;
  detectedBrowser: string;
  shareUrl: string;
  consoleErrors: ConsoleLog[];
  networkErrors: NetworkLog[];
  actionLogs: (ActionLog | NavigationLog | ScreenshotLog)[];
}

export function buildAiMcpPrompt({
  capture,
  targetHost,
  detectedOs,
  detectedBrowser,
  shareUrl,
  consoleErrors,
  networkErrors,
  actionLogs,
}: AiMcpPromptOptions): string {
  const title = capture.title || "Bug Report";
  const desc = capture.description ? capture.description.trim() : "No description provided.";
  const siteUrl = capture.site_url || (targetHost ? `https://${targetHost}` : "Unknown");
  const winSize = capture.window_size || "Unknown";

  const stepsText =
    actionLogs.length > 0
      ? actionLogs
          .slice(-8)
          .map((act, i) => `${i + 1}. ${(act.message || ("url" in act && act.url ? `Navigate to ${act.url}` : "") || "Recorded action").trim()}`)
          .join("\n")
      : "No user actions were recorded.";

  const netErrorsText =
    networkErrors.length > 0
      ? networkErrors.slice(0, 3).map((n) => `- ${n.method || "GET"} ${n.status || "FAIL"} ${n.url || ""}`).join("\n")
      : "None detected.";

  const consoleErrorsText =
    consoleErrors.length > 0
      ? consoleErrors.slice(0, 3).map((c) => `- ${conciseConsoleText(c)}`).join("\n")
      : "None detected.";

  return `Fix this BugSnap issue: ${title}
Capture URL: ${shareUrl}
Target Site: ${siteUrl}
Environment: ${detectedBrowser} on ${detectedOs} (Viewport: ${winSize})

Problem Description:
${desc}

Recorded Steps to Reproduce:
${stepsText}

Network Errors:
${netErrorsText}

Console Exceptions:
${consoleErrorsText}

Instructions for AI Agent (Claude Code / Cursor / Windsurf / Hermes):
1. Use BugSnap MCP (tool 'get_capture' with ID '${capture.id || ""}') or inspect the telemetry above.
2. Locate the source code responsible for this failure in the local project repository.
3. Review the synthesized Playwright reproduction test to reproduce the issue locally.
4. Implement the minimal code fix that addresses the root cause without regressions.
5. Verify the fix passes and commit the changes.`;
}

export function buildClaudeCliCommand({
  capture,
  shareUrl,
}: {
  capture: CaptureMeta;
  shareUrl: string;
}): string {
  const cleanTitle = (capture.title || "Bug").replace(/["`$\\]/g, "");
  return `claude "Fix BugSnap issue '${cleanTitle}': ${shareUrl}. Inspect the console/network errors and Playwright repro test, locate the bug in this codebase, and fix it."`;
}
