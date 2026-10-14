import test from "node:test";
import assert from "node:assert/strict";
import { normalizeEndpointUrl, parseLlmContent } from "../src/lib/ai-endpoint.ts";

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
