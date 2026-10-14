import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { isRateLimited } from "@/lib/rate-limit";
import { sanitizePromptData, cleanUrlForTelemetry } from "@/lib/redact";
import { assertPublicUrl } from "@/lib/safe-url";
import { normalizeEndpointUrl, parseLlmContent, parseLlmUsage } from "@/lib/ai-endpoint";
import { logAiUsage } from "@/lib/ai-usage-log";

export const runtime = "nodejs";
// Reasoning models can take 15-25s. Vercel Hobby's legacy default is 10s, so
// without this the platform kills the function before our own AbortController
// timeout (30s below) ever fires, turning a clean "timed out" JSON reply into
// a raw 504. 60s stays within the Hobby ceiling on both the legacy (10s
// default / 60s max) and Fluid Compute (300s default/max) billing models.
export const maxDuration = 60;

const SETTINGS_KEY = "ai_polish_config";
const POLISH_RATE_LIMIT = 30; // 30 calls
const POLISH_RATE_WINDOW_S = 60; // per minute

interface AiPolishConfig {
  provider: string;
  endpointUrl: string;
  apiKey: string;
  model: string;
  enabled: boolean;
  maxTokens?: number;
  temperature?: number;
}

export async function POST(req: Request) {
  try {
    // Basic IP rate limiting
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous-ip";
    if (await isRateLimited(`ai-polish:${ip}`, POLISH_RATE_LIMIT, POLISH_RATE_WINDOW_S)) {
      return NextResponse.json(
        { ok: false, error: "Too many AI polish requests. Please wait a moment." },
        { status: 429 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const { text, title, siteUrl, devLogs, endpointUrl: customEndpointUrl, apiKey: customApiKey, model: customModel, workspaceId, ownerEmail } = (body as {
      text?: string;
      title?: string;
      siteUrl?: string;
      devLogs?: Array<{ type?: string; message?: string; level?: string; status?: number; url?: string }>;
      endpointUrl?: string;
      apiKey?: string;
      model?: string;
      workspaceId?: string;
      ownerEmail?: string;
    }) || {};

    const rawText = (text || "").trim();
    const sanitizedTitle = sanitizePromptData(title || "", 150);
    const sanitizedUrl = cleanUrlForTelemetry(siteUrl || "", 200);

    // If text is totally empty and no title/url, require at least something
    if (!rawText && !sanitizedTitle && !sanitizedUrl) {
      return NextResponse.json(
        { ok: false, error: "Please enter some text or notes to polish." },
        { status: 400 }
      );
    }

    // 1. Resolve AI Configuration (Custom Override -> Admin DB Priority -> Env Fallback)
    const db = createServiceClient();
    const { data: settingsRow } = await db
      .from("app_settings")
      .select("value")
      .eq("key", SETTINGS_KEY)
      .maybeSingle();

    const storedConfig = (settingsRow?.value as Partial<AiPolishConfig>) || null;

    let endpointUrl = "";
    let apiKey = "";
    let model = "";
    let maxTokens = 500;
    let temperature = 0.2;

    if (customEndpointUrl) {
      endpointUrl = customEndpointUrl;
      apiKey = customApiKey || storedConfig?.apiKey || "custom-key";
      model = customModel || storedConfig?.model || "gpt-4o-mini";
      maxTokens = Math.min(storedConfig?.maxTokens || 200, 250);
      temperature = storedConfig?.temperature ?? 0.2;
    } else if (storedConfig && storedConfig.enabled !== false && storedConfig.apiKey && storedConfig.endpointUrl) {
      endpointUrl = storedConfig.endpointUrl;
      apiKey = storedConfig.apiKey;
      model = customModel || storedConfig.model || "qwen/qwen-2.5-72b-instruct";
      maxTokens = Math.min(storedConfig.maxTokens || 200, 250);
      temperature = storedConfig.temperature ?? 0.2;
    } else {
      // Fallback to environment variables
      if (process.env.CUSTOM_ROUTER_API_KEY) {
        endpointUrl = process.env.CUSTOM_ROUTER_URL || "https://router.akusaraproject.my.id/v1/chat/completions";
        apiKey = process.env.CUSTOM_ROUTER_API_KEY;
        model = "free";
      } else if (process.env.OPENROUTER_API_KEY) {
        endpointUrl = "https://openrouter.ai/api/v1/chat/completions";
        apiKey = process.env.OPENROUTER_API_KEY;
        model = "qwen/qwen-2.5-72b-instruct";
      } else if (process.env.OPENAI_API_KEY) {
        endpointUrl = "https://api.openai.com/v1/chat/completions";
        apiKey = process.env.OPENAI_API_KEY;
        model = "gpt-4o-mini";
      }
    }

    if (!endpointUrl || !apiKey || !model) {
      return NextResponse.json(
        {
          ok: false,
          error: "AI Provider is not configured. Please set Endpoint and API Key in Admin Dashboard (/admin/ai-analytics).",
        },
        { status: 503 }
      );
    }

    endpointUrl = normalizeEndpointUrl(endpointUrl);

    // SSRF verification: block localhost, private IPs, metadata endpoints
    try {
      await assertPublicUrl(endpointUrl);
    } catch (ssrfErr) {
      return NextResponse.json(
        { ok: false, error: (ssrfErr as Error)?.message || "Blocked private or unroutable endpoint URL" },
        { status: 400 }
      );
    }

    // Extract relevant telemetry summary if present
    let errorClue = "";
    if (Array.isArray(devLogs) && devLogs.length > 0) {
      const topError = devLogs.find(
        (l) =>
          (l.type === "console" && (l.level === "error" || /error|uncaught/i.test(l.message || ""))) ||
          (l.type === "network" && Number(l.status) >= 400)
      );
      if (topError) {
        errorClue = topError.message || (topError.status ? `HTTP ${topError.status} on ${topError.url}` : "");
      }
    }

    // 2. Build Multilingual Polish Prompt
    const systemInstruction = `You are a professional QA lead, software engineer, and technical copy editor.
Your task is to refine, polish, and structure draft notes into a crystal-clear, professional bug or task summary.

STRICT INSTRUCTIONS:
1. MULTILINGUAL AUTO-DETECTION: Read the user's input language (Indonesian, English, Japanese, etc.) and write the entire response in the EXACT SAME LANGUAGE as the user wrote.
2. CLARITY & PRECISION: Turn fragmented, informal, or confusing draft sentences into a clear, direct, and well-structured statement.
3. CONTEXT INTEGRATION: If page URL, page title, or error clues are provided, use them naturally to give precise context without hallucinating facts.
4. ZERO CHATTER: Do NOT include conversational filler like "Tentu, ini ringkasannya:", "Here is the polished summary:", or markdown code fences (\`\`\`).
5. Output ONLY the polished summary text directly.`;

    const userContent = rawText
      ? `Draft Note from User:\n"${sanitizePromptData(rawText, 800)}"\n\nContext:\n- Target Page: ${sanitizedUrl || "Unknown"}\n- Title: ${sanitizedTitle || "Untitled"}${errorClue ? `\n- Technical Clue: ${sanitizePromptData(errorClue, 200)}` : ""}`
      : `Create a clean, 1-2 sentence bug report summary based on this captured context:\n- Target Page: ${sanitizedUrl || "Unknown"}\n- Title: ${sanitizedTitle || "Untitled"}${errorClue ? `\n- Technical Clue: ${sanitizePromptData(errorClue, 200)}` : ""}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout for reasoning models & tunnel proxies
    const startTime = Date.now();
    const endpointHost = (() => {
      try { return new URL(endpointUrl).host; } catch { return null; }
    })();
    const logUsage = (fields: { success: boolean; usage?: ReturnType<typeof parseLlmUsage>; errorMessage?: string }) =>
      logAiUsage({
        source: "extension_polish",
        workspaceId,
        userEmail: ownerEmail,
        model,
        endpointHost,
        promptTokens: fields.usage?.promptTokens,
        completionTokens: fields.usage?.completionTokens,
        totalTokens: fields.usage?.totalTokens,
        latencyMs: Date.now() - startTime,
        success: fields.success,
        errorMessage: fields.errorMessage,
      });

    try {
      const aiRes = await fetch(endpointUrl, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://bugsnap.akusaraproject.my.id",
          "X-Title": "BugSnap AI Polish",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: userContent },
          ],
          max_tokens: maxTokens,
          temperature,
          stream: false,
        }),
      });

      if (!aiRes.ok) {
        const errText = await aiRes.text().catch(() => "");
        console.warn(`[AI Polish] Provider responded with status ${aiRes.status}:`, errText.slice(0, 200));
        await logUsage({ success: false, errorMessage: `HTTP ${aiRes.status}: ${errText}` });
        return NextResponse.json(
          { ok: false, error: `AI provider error (HTTP ${aiRes.status}). Check settings in Admin.` },
          { status: 502 }
        );
      }

      const rawText = await aiRes.text().catch(() => "");
      let polished = parseLlmContent(rawText);
      const usage = parseLlmUsage(rawText);

      // Clean any accidental markdown quotes or prefixes
      polished = polished.replace(/^["'`]|["'`]$/g, "").trim();

      if (!polished) {
        await logUsage({ success: false, usage: usage || undefined, errorMessage: "Empty response" });
        return NextResponse.json(
          { ok: false, error: "AI returned an empty response. Try again." },
          { status: 502 }
        );
      }

      await logUsage({ success: true, usage: usage || undefined });

      return NextResponse.json({
        ok: true,
        polishedText: polished,
        model,
      });
    } catch (fetchErr: unknown) {
      const isTimeout = (fetchErr as Error)?.name === "AbortError";
      await logUsage({
        success: false,
        errorMessage: isTimeout ? "Request timed out" : (fetchErr as Error)?.message || "Request failed",
      });
      throw fetchErr;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (err: unknown) {
    const isTimeout = (err as Error)?.name === "AbortError";
    console.error("[AI Polish] Request failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: isTimeout
          ? "AI Polish request timed out. Please try again."
          : (err as Error)?.message || "Failed to polish text.",
      },
      { status: 500 }
    );
  }
}
