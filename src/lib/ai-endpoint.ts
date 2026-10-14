/**
 * Utility functions for AI LLM endpoint normalization and response parsing.
 * Shared between Admin AI Config and Extension AI Polish routes.
 */

export function normalizeEndpointUrl(rawUrl: string): string {
  let url = (rawUrl || "").trim().replace(/\/+$/, "");
  if (!url) return url;
  if (!url.endsWith("/chat/completions")) {
    if (url.endsWith("/v1")) {
      url = `${url}/chat/completions`;
    } else {
      url = `${url}/v1/chat/completions`;
    }
  }
  return url;
}

export function parseLlmContent(rawText: string): string {
  if (!rawText) return "";

  // 1. Try standard JSON
  try {
    const json = JSON.parse(rawText);
    const content =
      json?.choices?.[0]?.message?.content ||
      json?.choices?.[0]?.text ||
      "";
    if (content) return String(content).trim();
  } catch {
    // Fall through to SSE
  }

  // 2. Fallback: Parse SSE chunks (data: {...})
  if (rawText.includes("data:")) {
    const lines = rawText.split("\n");
    let accumulated = "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data:") && !trimmed.includes("[DONE]")) {
        try {
          const chunk = JSON.parse(trimmed.slice(5).trim());
          const delta =
            chunk?.choices?.[0]?.delta?.content ||
            chunk?.choices?.[0]?.message?.content ||
            chunk?.choices?.[0]?.text ||
            "";
          accumulated += delta;
        } catch {
          // ignore chunk
        }
      }
    }
    if (accumulated.trim()) return accumulated.trim();
  }

  return rawText.trim().slice(0, 300);
}

export interface LlmUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

function usageFrom(raw: unknown): LlmUsage | null {
  const u = raw as { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined;
  if (!u || typeof u !== "object") return null;
  const promptTokens = Number(u.prompt_tokens) || 0;
  const completionTokens = Number(u.completion_tokens) || 0;
  const totalTokens = Number(u.total_tokens) || promptTokens + completionTokens;
  return { promptTokens, completionTokens, totalTokens };
}

/** Real token usage from the provider's response, when it reports one - never guessed. */
export function parseLlmUsage(rawText: string): LlmUsage | null {
  if (!rawText) return null;

  try {
    const json = JSON.parse(rawText);
    const usage = usageFrom(json?.usage);
    if (usage) return usage;
  } catch {
    // Fall through to SSE
  }

  if (rawText.includes("data:")) {
    // Usage (when sent at all) rides on the final chunk, so scan from the end.
    const lines = rawText.split("\n").reverse();
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data:") && !trimmed.includes("[DONE]")) {
        try {
          const chunk = JSON.parse(trimmed.slice(5).trim());
          const usage = usageFrom(chunk?.usage);
          if (usage) return usage;
        } catch {
          // ignore chunk
        }
      }
    }
  }

  return null;
}
