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

export function buildCurlCommand(log: NetworkLog): string {
  const method = (log.method || "GET").toUpperCase();
  const safeUrl = (log.url || "").replace(/(["\\$`])/g, "\\$1");
  let cmd = `curl -X ${method} "${safeUrl}"`;
  if (log.requestBody) {
    const escaped = log.requestBody.replace(/'/g, "'\\''");
    cmd += ` -H "Content-Type: application/json" -d '${escaped}'`;
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

    return {
      _index: index,
      startedDateTime: log.timestamp ? new Date(Number(log.timestamp)).toISOString() : startedDateTime,
      time: duration,
      request: {
        method: (log.method || "GET").toUpperCase(),
        url: log.url || "",
        httpVersion: "HTTP/1.1",
        cookies: [],
        headers: reqBody ? [{ name: "Content-Type", value: "application/json" }] : [],
        queryString: [],
        postData: reqBody ? { mimeType: "application/json", text: reqBody } : undefined,
        headersSize: -1,
        bodySize: reqBody ? reqBody.length : 0,
      },
      response: {
        status,
        statusText,
        httpVersion: "HTTP/1.1",
        cookies: [],
        headers: resBody ? [{ name: "Content-Type", value: "application/json" }] : [],
        content: {
          size: resBody ? resBody.length : 0,
          mimeType: "application/json",
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
