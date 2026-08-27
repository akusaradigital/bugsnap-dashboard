import { test } from "node:test";
import assert from "node:assert/strict";

// Replica of normalizeDevLog from src/components/DevToolsPanel.tsx
// ponytail: sync with src/components/DevToolsPanel.tsx normalizeDevLog
function normalizeDevLog(log) {
  if (!log) return { type: "step", message: "" };
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
  const time = typeof log.time === "string" || typeof log.time === "number" ? log.time : undefined;
  const timestamp = typeof log.timestamp === "string" || typeof log.timestamp === "number" ? log.timestamp : undefined;
  const count = typeof log.count === "number" ? log.count : undefined;

  if (type === "console" || (type === "" && (level !== undefined || stack !== undefined || text !== undefined))) {
    return { type: "console", level, message, text, stack, time, timestamp, count };
  }
  if (type === "network" || (type === "" && (method !== undefined || status !== undefined || requestBody !== undefined || responseBody !== undefined))) {
    return { type: "network", level, method, status, resourceType, url, statusText, duration, requestBody, responseBody, error, time, timestamp, count };
  }
  if (type === "navigation") {
    return { type: "navigation", message, url, time, timestamp, count };
  }
  if (type === "screenshot") {
    return { type: "screenshot", message, url, time, timestamp, count };
  }
  return { type: "step", message: message || text || "", time, timestamp, count };
}

test("Cross-project contract: validate simulated extension capture payload", () => {
  // Simulated extension payload sent to the dashboard api or stored in DB
  const mockPayload = {
    title: "Bug Report - Checkout Page",
    type: "video",
    drive_url: "https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J/view",
    window_size: "1920x1080",
    os: "Windows 11",
    browser: "Chrome 127.0.0",
    folder_name: "Sprint 4 Bugs",
    dev_logs: [
      {
        type: "console",
        level: "error",
        message: "Failed to load resource: the server responded with a status of 404 (Not Found)",
        text: "Uncaught Error: Invalid token",
        stack: "Error: Invalid token\n    at login (auth.js:10:15)",
        timestamp: "12:34:56"
      },
      {
        type: "network",
        method: "POST",
        status: 500,
        url: "https://api.bugsnap.com/v1/captures",
        statusText: "Internal Server Error",
        duration: 120,
        requestBody: '{"title":"Test"}',
        responseBody: '{"error":"Db connection timed out"}',
        timestamp: "12:35:00"
      },
      {
        type: "step",
        message: "User clicked submit button",
        timestamp: "12:35:05"
      }
    ]
  };

  // Validate root payload structure
  assert.equal(typeof mockPayload.title, "string", "payload must have a string title");
  assert.ok(["video", "screenshot"].includes(mockPayload.type), "payload type must be video or screenshot");
  assert.match(mockPayload.drive_url, /^https:\/\/drive\.google\.com\//, "drive_url must be a valid Google Drive URL");
  assert.equal(typeof mockPayload.window_size, "string", "window_size must be a string");
  assert.equal(typeof mockPayload.os, "string", "os must be a string");
  assert.equal(typeof mockPayload.browser, "string", "browser must be a string");
  assert.equal(typeof mockPayload.folder_name, "string", "folder_name must be a string");
  assert.ok(Array.isArray(mockPayload.dev_logs), "dev_logs must be an array");

  // Verify normalizeDevLog contracts hold for the payload items
  const normalizedLogs = mockPayload.dev_logs.map(log => normalizeDevLog(log));

  // Console Log Checks
  const consoleLog = normalizedLogs.find(l => l.type === "console");
  assert.ok(consoleLog, "must contain a console log");
  assert.equal(consoleLog.level, "error");
  assert.equal(consoleLog.message, "Failed to load resource: the server responded with a status of 404 (Not Found)");
  assert.equal(consoleLog.text, "Uncaught Error: Invalid token");
  assert.equal(consoleLog.stack, "Error: Invalid token\n    at login (auth.js:10:15)");

  // Network Log Checks
  const networkLog = normalizedLogs.find(l => l.type === "network");
  assert.ok(networkLog, "must contain a network log");
  assert.equal(networkLog.method, "POST");
  assert.equal(networkLog.status, 500);
  assert.equal(networkLog.url, "https://api.bugsnap.com/v1/captures");
  assert.equal(networkLog.requestBody, '{"title":"Test"}');
  assert.equal(networkLog.responseBody, '{"error":"Db connection timed out"}');

  // Action/Step Log Checks
  const stepLog = normalizedLogs.find(l => l.type === "step");
  assert.ok(stepLog, "must contain a step/action log");
  assert.equal(stepLog.message, "User clicked submit button");
});

test("normalizeDevLog: handles fallback values and heuristics", () => {
  // Missing type heuristic for console log (has level / stack / text)
  const fallbackConsole = normalizeDevLog({
    level: "warn",
    text: "Deprecation warning"
  });
  assert.equal(fallbackConsole.type, "console");
  assert.equal(fallbackConsole.level, "warn");
  assert.equal(fallbackConsole.text, "Deprecation warning");

  // Missing type heuristic for network log (has method / status)
  const fallbackNetwork = normalizeDevLog({
    method: "GET",
    status: 200,
    url: "https://example.com"
  });
  assert.equal(fallbackNetwork.type, "network");
  assert.equal(fallbackNetwork.method, "GET");
  assert.equal(fallbackNetwork.status, 200);

  // Fallback to step/action log if no other matches
  const fallbackStep = normalizeDevLog({
    message: "Unknown log entry"
  });
  assert.equal(fallbackStep.type, "step");
  assert.equal(fallbackStep.message, "Unknown log entry");
});
