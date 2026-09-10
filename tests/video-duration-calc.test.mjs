import assert from "node:assert/strict";

function getApproxDurationFromLogs(logs, explicitDuration) {
  if (typeof explicitDuration === "number" && explicitDuration > 0) {
    return explicitDuration;
  }
  if (!Array.isArray(logs) || logs.length === 0) return 0;

  let maxSec = 0;
  let earliest = 0;
  let latest = 0;

  for (const log of logs) {
    if (!log) continue;
    if (typeof log.time === "string") {
      const match = log.time.match(/^(\d{1,3}):(\d{2})$/);
      if (match) {
        const sec = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
        if (sec > maxSec) maxSec = sec;
      }
    }
    const raw = log.timestamp;
    const ts = typeof raw === "number" ? raw : typeof raw === "string" && !/^\d{1,2}:\d{2}$/.test(raw) ? new Date(raw).getTime() : 0;
    if (Number.isFinite(ts) && ts > 0) {
      if (earliest === 0 || ts < earliest) earliest = ts;
      if (ts > latest) latest = ts;
    }
  }

  const span = earliest > 0 && latest > earliest ? Math.ceil((latest - earliest) / 1000) : 0;
  return Math.max(maxSec, span);
}

// 1. Explicit duration wins
assert.equal(getApproxDurationFromLogs([], 14.5), 14.5);

// 2. Derive from log `time` strings (e.g. "0:08", "1:15")
assert.equal(getApproxDurationFromLogs([
  { time: "0:01", message: "click" },
  { time: "0:08", message: "error" },
  { time: "0:05", message: "scroll" }
]), 8);

assert.equal(getApproxDurationFromLogs([
  { time: "1:20", message: "click" }
]), 80);

// 3. Derive from unix timestamps in ms
const base = 1725978700000;
assert.equal(getApproxDurationFromLogs([
  { timestamp: base, message: "start" },
  { timestamp: base + 4200, message: "action" },
  { timestamp: base + 9100, message: "end" }
]), 10);

// 4. Empty or invalid logs return 0
assert.equal(getApproxDurationFromLogs([]), 0);
assert.equal(getApproxDurationFromLogs(null), 0);

console.log("All video duration calculation assertions passed!");
