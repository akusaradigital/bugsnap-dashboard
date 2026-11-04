#!/usr/bin/env node

/**
 * BugSnap Pre-Push Quality Gate Orchestrator
 *
 * Runs all mandatory verification gates in sequence before code push:
 * 1. TypeScript compilation check (tsc --noEmit)
 * 2. Asset integrity check (node tests/check-assets.js)
 * 3. Test suites (npm test including i18n, dead links, devtools parity, helpers)
 *
 * Prints a clean, formatted terminal summary report showing pass/fail status and durations.
 * Exits with code 0 on success, or code 1 if any gate fails.
 */

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const binDir = path.resolve(rootDir, "node_modules", ".bin");
const pathSeparator = process.platform === "win32" ? ";" : ":";

const isVerbose = process.argv.includes("--verbose") || process.argv.includes("-v");
const isBail = process.argv.includes("--bail");

const isColorSupported =
  !process.env.NO_COLOR &&
  (Boolean(process.stdout.isTTY) ||
    Boolean(process.env.CI) ||
    Boolean(process.env.COLORTERM) ||
    Boolean(process.env.TERM && process.env.TERM !== "dumb") ||
    Boolean(process.env.FORCE_COLOR));

const c = {
  reset: isColorSupported ? "\x1b[0m" : "",
  bold: isColorSupported ? "\x1b[1m" : "",
  dim: isColorSupported ? "\x1b[90m" : "",
  green: isColorSupported ? "\x1b[32m" : "",
  red: isColorSupported ? "\x1b[31m" : "",
  yellow: isColorSupported ? "\x1b[33m" : "",
  cyan: isColorSupported ? "\x1b[36m" : "",
  magenta: isColorSupported ? "\x1b[35m" : "",
  white: isColorSupported ? "\x1b[37m" : "",
  gray: isColorSupported ? "\x1b[90m" : "",
};

const customEnv = {
  ...process.env,
  PATH: `${binDir}${pathSeparator}${process.env.PATH || ""}`,
};

const gates = [
  {
    id: 1,
    name: "TypeScript Compilation Check",
    command: "tsc --noEmit",
    displayCommand: "tsc --noEmit",
    validate: (res) => res.code === 0,
    summarize: (res) => {
      if (res.code === 0) return "Clean (0 diagnostics)";
      return "Compilation errors detected";
    },
  },
  {
    id: 2,
    name: "Asset Integrity Check",
    command: "node tests/check-assets.js",
    displayCommand: "node tests/check-assets.js",
    validate: (res) => {
      return (
        res.code === 0 &&
        !res.stdout.includes("MISSING ASSETS") &&
        !res.stderr.includes("MISSING ASSETS")
      );
    },
    summarize: (res) => {
      const match = res.stdout.match(/Checked assets \((\d+)\)/);
      const count = match ? match[1] : "All";
      if (res.code === 0 && !res.stdout.includes("MISSING ASSETS")) {
        return `${count} assets verified, 0 missing`;
      }
      return "Missing assets detected";
    },
  },
  {
    id: 3,
    name: "Test Suites (i18n, links, parity)",
    command: "npm test",
    displayCommand: "npm test",
    validate: (res) => {
      return (
        res.code === 0 &&
        !res.stdout.includes("✖ fail") &&
        !res.stdout.includes("ℹ fail 1") &&
        !res.stdout.includes("ℹ fail 2")
      );
    },
    summarize: (res) => {
      const matchTests = res.stdout.match(/ℹ tests\s+(\d+)/);
      const matchPass = res.stdout.match(/ℹ pass\s+(\d+)/);
      const matchFail = res.stdout.match(/ℹ fail\s+(\d+)/);
      if (matchPass && matchFail) {
        const total = matchTests ? matchTests[1] : matchPass[1];
        const pass = matchPass[1];
        const fail = matchFail[1];
        if (Number(fail) === 0) {
          return `${pass}/${total} tests passed (0 failures)`;
        }
        return `${fail} test(s) failed out of ${total}`;
      }
      return res.code === 0 ? "All tests passed" : "Test suite failures detected";
    },
  },
];

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function runCommand(commandStr) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const child = spawn(commandStr, {
      cwd: rootDir,
      shell: true,
      env: customEnv,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("close", (code) => {
      const durationMs = Date.now() - startTime;
      resolve({
        code: code ?? 1,
        stdout,
        stderr,
        durationMs,
      });
    });

    child.on("error", (err) => {
      const durationMs = Date.now() - startTime;
      resolve({
        code: 1,
        stdout,
        stderr: (stderr ? stderr + "\n" : "") + err.message,
        durationMs,
      });
    });
  });
}

function printHeader() {
  const line = "=".repeat(84);
  console.log(`${c.cyan}${line}${c.reset}`);
  console.log(`${c.cyan}${c.bold}              BugSnap Pre-Push Unified Quality Gate Orchestrator${c.reset}`);
  console.log(`${c.dim}    Validating: TypeScript Types | Static Assets | Unit & Contract Suites${c.reset}`);
  console.log(`${c.cyan}${line}${c.reset}\n`);
}

function printSummary(results, totalDurationMs) {
  const line = "=".repeat(84);
  const subline = "-".repeat(84);

  console.log(`\n${c.cyan}${line}${c.reset}`);
  console.log(`${c.cyan}${c.bold}                        PRE-PUSH QUALITY GATE SUMMARY REPORT${c.reset}`);
  console.log(`${c.cyan}${line}${c.reset}`);
  console.log(
    `  ${c.dim}#  Gate                               Command                     Status      Duration${c.reset}`
  );
  console.log(`  ${c.dim}${subline.slice(2)}${c.reset}`);

  let allPassed = true;
  let passCount = 0;

  for (const r of results) {
    if (r.passed) {
      passCount++;
    } else {
      allPassed = false;
    }

    const num = `${r.gate.id}`.padEnd(2);
    const name = r.gate.name.padEnd(34).slice(0, 34);
    const cmd = r.gate.displayCommand.padEnd(26).slice(0, 26);
    const rawStatus = r.passed ? "✔ PASSED" : "✖ FAILED";
    const statusColor = r.passed ? c.green : c.red;
    const coloredStatus = `${statusColor}${c.bold}${rawStatus}${c.reset}  `;
    const duration = formatDuration(r.durationMs).padStart(8);

    console.log(`  ${num} ${c.bold}${name}${c.reset} ${c.dim}${cmd}${c.reset} ${coloredStatus} ${c.dim}${duration}${c.reset}`);
    if (r.summaryNote) {
      console.log(`     ${c.dim}↳ ${r.summaryNote}${c.reset}`);
    }
  }

  console.log(`  ${c.dim}${subline.slice(2)}${c.reset}`);
  const totalFormatted = formatDuration(totalDurationMs);
  console.log(
    `  Total Execution Time: ${c.bold}${totalFormatted}${c.reset} | Gates Evaluated: ${c.bold}${results.length}/${gates.length}${c.reset}`
  );

  if (allPassed) {
    console.log(
      `  Overall Status: ${c.green}${c.bold}✔ ALL QUALITY GATES PASSED (${passCount}/${gates.length})${c.reset} — Safe to push!`
    );
  } else {
    const failedCount = results.length - passCount;
    console.log(
      `  Overall Status: ${c.red}${c.bold}✖ QUALITY GATES BLOCKED (${failedCount} failed, ${passCount} passed)${c.reset}`
    );
  }
  console.log(`${c.cyan}${line}${c.reset}\n`);

  return allPassed;
}

async function main() {
  printHeader();

  const overallStartTime = Date.now();
  const results = [];

  for (let i = 0; i < gates.length; i++) {
    const gate = gates[i];
    const gateLabel = `[${i + 1}/${gates.length}]`;
    console.log(`${c.bold}${gateLabel} Running: ${gate.name}${c.reset} ${c.dim}(${gate.command})${c.reset}...`);

    const res = await runCommand(gate.command);
    const passed = gate.validate(res);
    const summaryNote = gate.summarize(res);

    results.push({
      gate,
      passed,
      summaryNote,
      durationMs: res.durationMs,
      res,
    });

    if (passed) {
      console.log(
        `  ${c.green}${c.bold}✔ PASSED${c.reset} ${c.dim}in ${formatDuration(res.durationMs)} — ${summaryNote}${c.reset}\n`
      );
    } else {
      console.log(
        `  ${c.red}${c.bold}✖ FAILED${c.reset} ${c.dim}in ${formatDuration(res.durationMs)} — ${summaryNote}${c.reset}\n`
      );

      // Print error details
      console.log(`${c.red}------------------------- Failure Output Start -------------------------${c.reset}`);
      const errOut = (res.stderr.trim() || res.stdout.trim()) || "Command exited with non-zero status.";
      console.log(errOut);
      console.log(`${c.red}-------------------------- Failure Output End --------------------------${c.reset}\n`);

      if (isBail) {
        console.log(`${c.yellow}Bailing out immediately due to --bail flag.${c.reset}\n`);
        break;
      }
    }

    if (isVerbose) {
      if (res.stdout.trim()) {
        console.log(`${c.dim}--- STDOUT ---${c.reset}`);
        console.log(res.stdout.trim());
      }
      if (res.stderr.trim()) {
        console.log(`${c.dim}--- STDERR ---${c.reset}`);
        console.log(res.stderr.trim());
      }
      console.log("");
    }
  }

  const totalDurationMs = Date.now() - overallStartTime;
  const allPassed = printSummary(results, totalDurationMs);

  process.exit(allPassed ? 0 : 1);
}

main().catch((err) => {
  console.error(`\n${c.red}${c.bold}FATAL ERROR IN GATE ORCHESTRATOR:${c.reset}`, err);
  process.exit(1);
});
