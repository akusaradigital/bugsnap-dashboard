import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/admin-auth";
import { assertPublicUrl } from "@/lib/safe-url";
import { logSecurityEvent } from "@/lib/security-audit";
import { normalizeEndpointUrl, parseLlmContent, parseLlmUsage } from "@/lib/ai-endpoint";
import { logAiUsage } from "@/lib/ai-usage-log";

export const runtime = "nodejs";
// See the matching comment in api/extension/ai-polish/route.ts: reasoning
// models can take 15-25s, longer than Vercel Hobby's legacy 10s default.
export const maxDuration = 60;

const SETTINGS_KEY = "ai_polish_config";

export interface AiPolishConfig {
  provider: "akusara" | "openrouter" | "openai" | "groq" | "custom";
  endpointUrl: string;
  apiKey: string;
  model: string;
  enabled: boolean;
  maxTokens?: number;
  temperature?: number;
  updatedAt?: string;
  updatedBy?: string;
}

const DEFAULT_CONFIG: AiPolishConfig = {
  provider: "openrouter",
  endpointUrl: "https://openrouter.ai/api/v1/chat/completions",
  apiKey: "",
  model: "qwen/qwen-2.5-72b-instruct",
  enabled: true,
  maxTokens: 500,
  temperature: 0.3,
};

function maskApiKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}

export async function GET(req: Request) {
  const { authorized, supabase } = await checkAdminAuth(req);
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
    const { data } = await supabase
      .from("app_settings")
      .select("value, updated_at")
      .eq("key", SETTINGS_KEY)
      .maybeSingle();

    const stored = (data?.value as Partial<AiPolishConfig>) || {};
    const rawApiKey = stored.apiKey || "";

    const config: Omit<AiPolishConfig, "apiKey"> & { apiKeyMasked: string; hasKey: boolean } = {
      provider: stored.provider || DEFAULT_CONFIG.provider,
      endpointUrl: stored.endpointUrl || DEFAULT_CONFIG.endpointUrl,
      model: stored.model || DEFAULT_CONFIG.model,
      enabled: stored.enabled !== undefined ? stored.enabled : DEFAULT_CONFIG.enabled,
      maxTokens: stored.maxTokens || DEFAULT_CONFIG.maxTokens,
      temperature: stored.temperature !== undefined ? stored.temperature : DEFAULT_CONFIG.temperature,
      updatedAt: data?.updated_at || stored.updatedAt,
      updatedBy: stored.updatedBy,
      apiKeyMasked: maskApiKey(rawApiKey),
      hasKey: Boolean(rawApiKey),
    };

    const envFallback = {
      hasCustomRouter: Boolean(process.env.CUSTOM_ROUTER_API_KEY),
      hasOpenRouter: Boolean(process.env.OPENROUTER_API_KEY),
      hasOpenAi: Boolean(process.env.OPENAI_API_KEY),
    };

    return NextResponse.json({ ok: true, config, envFallback });
  } catch (err) {
    console.error("[Admin AI Config] GET error:", err);
    return NextResponse.json({ error: "Failed to load AI config" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { authorized, callerEmail, supabase } = await checkAdminAuth(req);
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { action, config: inputConfig, sampleText } = (body as {
    action?: "ping" | "save" | "test_polish" | "reveal_key";
    config?: Partial<AiPolishConfig>;
    sampleText?: string;
  }) || {};

  // 0. ACTION: REVEAL SAVED KEY (Super Admin only)
  if (action === "reveal_key") {
    const { data: currentData } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", SETTINGS_KEY)
      .maybeSingle();
    const currentConfig = (currentData?.value as Partial<AiPolishConfig>) || {};
    let key = currentConfig.apiKey || "";
    if (!key) {
      if (currentConfig.provider === "akusara" && process.env.CUSTOM_ROUTER_API_KEY) {
        key = process.env.CUSTOM_ROUTER_API_KEY;
      } else if (currentConfig.provider === "openrouter" && process.env.OPENROUTER_API_KEY) {
        key = process.env.OPENROUTER_API_KEY;
      } else if (currentConfig.provider === "openai" && process.env.OPENAI_API_KEY) {
        key = process.env.OPENAI_API_KEY;
      }
    }
    return NextResponse.json({ ok: true, apiKey: key });
  }

  if (!action || !inputConfig) {
    return NextResponse.json({ error: "Action and config are required" }, { status: 400 });
  }

  // Fetch current stored config for password preservation
  const { data: currentData } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", SETTINGS_KEY)
    .maybeSingle();
  const currentConfig = (currentData?.value as Partial<AiPolishConfig>) || {};

  // Resolve API Key: if masked or unchanged, keep stored key
  let resolvedKey = (inputConfig.apiKey || "").trim();
  if (!resolvedKey || resolvedKey.includes("••••")) {
    resolvedKey = currentConfig.apiKey || "";
  }

  // Fallback to env keys if still empty
  if (!resolvedKey) {
    if (inputConfig.provider === "akusara" && process.env.CUSTOM_ROUTER_API_KEY) {
      resolvedKey = process.env.CUSTOM_ROUTER_API_KEY;
    } else if (inputConfig.provider === "openrouter" && process.env.OPENROUTER_API_KEY) {
      resolvedKey = process.env.OPENROUTER_API_KEY;
    } else if (inputConfig.provider === "openai" && process.env.OPENAI_API_KEY) {
      resolvedKey = process.env.OPENAI_API_KEY;
    }
  }

  const rawEndpoint = (inputConfig.endpointUrl || "").trim();
  const endpointUrl = normalizeEndpointUrl(rawEndpoint);
  const model = (inputConfig.model || "").trim();

  // Validate URL format and protect against internal network SSRF
  if (!endpointUrl || !/^https?:\/\//i.test(endpointUrl)) {
    return NextResponse.json({ error: "Endpoint URL must be a valid http or https URL" }, { status: 400 });
  }

  try {
    await assertPublicUrl(endpointUrl);
  } catch (err) {
    return NextResponse.json(
      { error: `Forbidden endpoint: ${(err as Error)?.message || "Blocked private/internal IP address"}` },
      { status: 400 }
    );
  }

  if (!model) {
    return NextResponse.json({ error: "Model name is required" }, { status: 400 });
  }

  const endpointHost = (() => {
    try { return new URL(endpointUrl).host; } catch { return null; }
  })();

  // 1. ACTION: PING / TEST CONNECTION
  if (action === "ping") {
    if (!resolvedKey) {
      return NextResponse.json(
        { ok: false, error: "API Key is required to test the connection." },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    try {
      const pingHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resolvedKey}`,
        "User-Agent": "BugSnap-Admin-Ping/1.0",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://bugsnap.akusaraproject.my.id",
        "X-Title": "BugSnap",
      };

      const testRes = await fetch(endpointUrl, {
        method: "POST",
        signal: controller.signal,
        headers: pingHeaders,
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: "Reply only with the exact word: PONG",
            },
          ],
          max_tokens: 10,
          temperature: 0,
          stream: false,
        }),
      });

      const latencyMs = Date.now() - startTime;

      if (!testRes.ok) {
        let errorDetail = "";
        try {
          const errJson = await testRes.json();
          errorDetail = errJson.error?.message || errJson.message || JSON.stringify(errJson);
        } catch {
          errorDetail = await testRes.text().catch(() => "");
        }
        await logAiUsage({
          source: "admin_ping",
          userEmail: callerEmail,
          model,
          endpointHost,
          latencyMs,
          success: false,
          errorMessage: `HTTP ${testRes.status}: ${errorDetail}`,
        });
        return NextResponse.json({
          ok: false,
          status: testRes.status,
          latencyMs,
          error: `HTTP ${testRes.status}: ${errorDetail.slice(0, 200) || testRes.statusText}`,
        });
      }

      const rawText = await testRes.text().catch(() => "");
      const sampleReply = parseLlmContent(rawText) || "OK";
      const usage = parseLlmUsage(rawText);

      await logAiUsage({
        source: "admin_ping",
        userEmail: callerEmail,
        model,
        endpointHost,
        promptTokens: usage?.promptTokens,
        completionTokens: usage?.completionTokens,
        totalTokens: usage?.totalTokens,
        latencyMs,
        success: true,
      });

      return NextResponse.json({
        ok: true,
        latencyMs,
        model,
        sampleReply: sampleReply.slice(0, 100),
      });
    } catch (fetchErr: unknown) {
      const latencyMs = Date.now() - startTime;
      const isTimeout = (fetchErr as Error)?.name === "AbortError";
      await logAiUsage({
        source: "admin_ping",
        userEmail: callerEmail,
        model,
        endpointHost,
        latencyMs,
        success: false,
        errorMessage: isTimeout ? "Request timed out" : (fetchErr as Error)?.message,
      });
      return NextResponse.json({
        ok: false,
        latencyMs,
        error: isTimeout
          ? "Request timed out after 8s. Check if the endpoint URL and model are correct."
          : (fetchErr as Error)?.message || "Failed to connect to AI provider.",
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // 2. ACTION: TEST POLISH (Interactive Playground)
  if (action === "test_polish") {
    if (!resolvedKey) {
      return NextResponse.json(
        { ok: false, error: "API Key diperlukan untuk menguji coba model." },
        { status: 400 }
      );
    }

    const testDraft = (sampleText || "tombol checkout ga bisa di klik pas pake dark mode").trim();
    const systemInstruction = `You are a professional QA lead, software engineer, and technical copy editor.
Your task is to refine, polish, and structure draft notes into a crystal-clear, professional bug or task summary.

STRICT INSTRUCTIONS:
1. MULTILINGUAL AUTO-DETECTION: Read the user's input language (Indonesian, English, Japanese, etc.) and write the entire response in the EXACT SAME LANGUAGE as the user wrote.
2. CLARITY & PRECISION: Turn fragmented, informal, or confusing draft sentences into a clear, direct, and well-structured statement.
3. CONTEXT INTEGRATION: Output a clear 1-2 sentence issue statement.
4. ZERO CHATTER: Do NOT include conversational filler like "Tentu, ini ringkasannya:", "Here is the polished summary:", or markdown code fences (\`\`\`).
5. Output ONLY the polished summary text directly.`;

    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout for reasoning models & tunnel proxies

    try {
      const polishRes = await fetch(endpointUrl, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resolvedKey}`,
          "User-Agent": "BugSnap-Admin-TestPolish/1.0",
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://bugsnap.akusaraproject.my.id",
          "X-Title": "BugSnap AI Polish Test",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemInstruction },
            {
              role: "user",
              content: `Draft Note:\n"${testDraft}"\n\nContext:\n- Target Page: https://example.com/checkout\n- Title: Checkout Page`,
            },
          ],
          max_tokens: 300,
          temperature: 0.2,
          stream: false,
        }),
      });

      const latencyMs = Date.now() - startTime;

      if (!polishRes.ok) {
        let errorDetail = "";
        try {
          const errJson = await polishRes.json();
          errorDetail = errJson.error?.message || errJson.message || JSON.stringify(errJson);
        } catch {
          errorDetail = await polishRes.text().catch(() => "");
        }
        await logAiUsage({
          source: "admin_test_polish",
          userEmail: callerEmail,
          model,
          endpointHost,
          latencyMs,
          success: false,
          errorMessage: `HTTP ${polishRes.status}: ${errorDetail}`,
        });
        return NextResponse.json({
          ok: false,
          status: polishRes.status,
          latencyMs,
          error: `HTTP ${polishRes.status}: ${errorDetail.slice(0, 250) || polishRes.statusText}`,
        });
      }

      const rawText = await polishRes.text().catch(() => "");
      const polishedText = parseLlmContent(rawText);
      const usage = parseLlmUsage(rawText);

      await logAiUsage({
        source: "admin_test_polish",
        userEmail: callerEmail,
        model,
        endpointHost,
        promptTokens: usage?.promptTokens,
        completionTokens: usage?.completionTokens,
        totalTokens: usage?.totalTokens,
        latencyMs,
        success: true,
      });

      return NextResponse.json({
        ok: true,
        latencyMs,
        model,
        polishedText,
      });
    } catch (fetchErr: unknown) {
      const latencyMs = Date.now() - startTime;
      const isTimeout = (fetchErr as Error)?.name === "AbortError";
      await logAiUsage({
        source: "admin_test_polish",
        userEmail: callerEmail,
        model,
        endpointHost,
        latencyMs,
        success: false,
        errorMessage: isTimeout ? "Request timed out" : (fetchErr as Error)?.message,
      });
      return NextResponse.json({
        ok: false,
        latencyMs,
        error: isTimeout
          ? "Uji coba timeout setelah 12 detik. Pastikan endpoint dan model responsif."
          : (fetchErr as Error)?.message || "Gagal menghubungi provider AI.",
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // 3. ACTION: SAVE CONFIGURATION
  if (action === "save") {
    const finalPayload: AiPolishConfig = {
      provider: inputConfig.provider || "custom",
      endpointUrl,
      apiKey: resolvedKey,
      model,
      enabled: inputConfig.enabled !== false,
      maxTokens: Math.min(Math.max(Number(inputConfig.maxTokens) || 500, 50), 2000),
      temperature: Math.min(Math.max(Number(inputConfig.temperature) || 0.3, 0), 1),
      updatedAt: new Date().toISOString(),
      updatedBy: callerEmail || "super_admin",
    };

    const { error: upsertError } = await supabase.from("app_settings").upsert({
      key: SETTINGS_KEY,
      value: finalPayload,
      updated_at: new Date().toISOString(),
    });

    if (upsertError) {
      console.error("[Admin AI Config] Save error:", upsertError);
      return NextResponse.json({ error: "Failed to save AI configuration to database" }, { status: 500 });
    }

    await logSecurityEvent({
      type: "admin_action",
      title: "AI Polish Configuration Updated",
      detail: `Super Admin ${callerEmail || "Console"} updated AI Polish settings. Provider: ${finalPayload.provider}, Model: ${finalPayload.model}, Enabled: ${finalPayload.enabled}`,
    });

    return NextResponse.json({
      ok: true,
      message: "AI configuration saved successfully",
      config: {
        ...finalPayload,
        apiKeyMasked: maskApiKey(finalPayload.apiKey),
        hasKey: Boolean(finalPayload.apiKey),
        apiKey: undefined, // Never return raw key
      },
    });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
