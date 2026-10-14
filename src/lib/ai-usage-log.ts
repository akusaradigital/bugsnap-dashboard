import { createServiceClient } from "@/lib/supabase-server";

export type AiUsageSource =
  | "extension_polish"
  | "ai_clue"
  | "admin_ping"
  | "admin_test_polish";

export interface AiUsageEntry {
  source: AiUsageSource;
  workspaceId?: string | null;
  userEmail?: string | null;
  model: string;
  endpointHost?: string | null;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  latencyMs?: number;
  success: boolean;
  errorMessage?: string | null;
}

/** Records one real LLM call (tokens from the provider's own `usage`, never guessed). */
export async function logAiUsage(entry: AiUsageEntry) {
  try {
    const db = createServiceClient();
    await db.from("ai_usage_logs").insert({
      id: `aiu_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      source: entry.source,
      workspace_id: entry.workspaceId || null,
      user_email: entry.userEmail?.toLowerCase() || null,
      model: entry.model,
      endpoint_host: entry.endpointHost || null,
      prompt_tokens: entry.promptTokens || 0,
      completion_tokens: entry.completionTokens || 0,
      total_tokens: entry.totalTokens || 0,
      latency_ms: entry.latencyMs ?? null,
      success: entry.success,
      error_message: entry.errorMessage?.slice(0, 300) || null,
    });
  } catch (err) {
    console.warn("[AI Usage Log] Failed to persist entry:", err);
  }
}
