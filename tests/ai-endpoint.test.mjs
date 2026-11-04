import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = readFileSync(path.resolve(here, "../src/lib/ai-endpoint.ts"), "utf8");
const transpiled = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;

const ctx = { exports: {} };
vm.runInNewContext(transpiled, ctx);
const { normalizeEndpointUrl, parseLlmContent } = ctx.exports;

test("normalizeEndpointUrl: appends /chat/completions to base /v1 endpoint", () => {
  assert.equal(
    normalizeEndpointUrl("https://ramasjl.abc-tunnel.us/v1"),
    "https://ramasjl.abc-tunnel.us/v1/chat/completions"
  );
  assert.equal(
    normalizeEndpointUrl("https://ramasjl.abc-tunnel.us/v1/"),
    "https://ramasjl.abc-tunnel.us/v1/chat/completions"
  );
});

test("normalizeEndpointUrl: appends /v1/chat/completions to root domain", () => {
  assert.equal(
    normalizeEndpointUrl("https://ramasjl.abc-tunnel.us"),
    "https://ramasjl.abc-tunnel.us/v1/chat/completions"
  );
  assert.equal(
    normalizeEndpointUrl("https://ramasjl.abc-tunnel.us/"),
    "https://ramasjl.abc-tunnel.us/v1/chat/completions"
  );
});

test("normalizeEndpointUrl: preserves existing /chat/completions path", () => {
  assert.equal(
    normalizeEndpointUrl("https://openrouter.ai/api/v1/chat/completions"),
    "https://openrouter.ai/api/v1/chat/completions"
  );
});

test("parseLlmContent: parses standard JSON choices", () => {
  const json = JSON.stringify({
    choices: [{ message: { content: "PONG" } }],
  });
  assert.equal(parseLlmContent(json), "PONG");
});

test("parseLlmContent: parses SSE streaming chunks fallback", () => {
  const sse = `data: {"choices":[{"delta":{"content":"Hello"}}]}\n\ndata: {"choices":[{"delta":{"content":" World"}}]}\n\ndata: [DONE]\n`;
  assert.equal(parseLlmContent(sse), "Hello World");
});
