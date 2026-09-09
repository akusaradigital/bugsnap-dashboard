import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

interface EventPayload {
  visitorId?: string;
  experimentId?: string;
  variantId?: string;
  type?: "impression" | "conversion";
  goal?: string;
  metadata?: Record<string, unknown>;
}

interface VariantMetrics {
  impressions: number;
  conversions: Record<string, number>;
  last_event_at: string | null;
}

interface ExperimentMetrics {
  updated_at: string;
  variants: Record<string, VariantMetrics>;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as EventPayload;
    const { experimentId, variantId, type, goal } = body;

    if (!experimentId || !variantId || !type) {
      return NextResponse.json(
        { ok: false, message: "Missing required fields" },
        { status: 400, headers: corsHeaders }
      );
    }

    const cleanExpId = String(experimentId).slice(0, 64);
    const cleanVarId = String(variantId).slice(0, 64);
    const cleanGoal = goal ? String(goal).slice(0, 64) : "default";

    const supabase = createServiceClient();

    // Fetch existing experiments metrics blob
    // ponytail: single key in app_settings, zero migration schema lock-in
    const { data: currentRecord } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "ab_experiments_metrics")
      .maybeSingle();

    const metrics = (currentRecord?.value as Record<string, ExperimentMetrics>) || {};

    if (!metrics[cleanExpId]) {
      metrics[cleanExpId] = { variants: {}, updated_at: new Date().toISOString() };
    }
    if (!metrics[cleanExpId].variants[cleanVarId]) {
      metrics[cleanExpId].variants[cleanVarId] = {
        impressions: 0,
        conversions: {},
        last_event_at: null,
      };
    }

    const varStats = metrics[cleanExpId].variants[cleanVarId];
    varStats.last_event_at = new Date().toISOString();

    if (type === "impression") {
      varStats.impressions = (varStats.impressions || 0) + 1;
    } else if (type === "conversion") {
      if (!varStats.conversions) varStats.conversions = {};
      varStats.conversions[cleanGoal] = (varStats.conversions[cleanGoal] || 0) + 1;
    }

    metrics[cleanExpId].updated_at = new Date().toISOString();

    // Upsert back to app_settings
    await supabase.from("app_settings").upsert({
      key: "ab_experiments_metrics",
      value: metrics,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true }, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = (err as Error)?.message || "Tracking failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500, headers: corsHeaders });
  }
}

export async function GET() {
  try {
    const supabase = createServiceClient();

    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "ab_experiments_metrics")
      .maybeSingle();

    const rawMetrics = (data?.value as Record<string, ExperimentMetrics>) || {};

    // Summarize with computed conversion rates
    const summary: Record<string, {
      updated_at: string;
      variants: Record<string, {
        impressions: number;
        total_conversions: number;
        conversion_rate: string;
        conversions_by_goal: Record<string, number>;
        last_event_at: string | null;
      }>;
    }> = {};

    for (const [expId, expData] of Object.entries(rawMetrics)) {
      summary[expId] = {
        updated_at: expData.updated_at,
        variants: {},
      };

      for (const [varId, varStats] of Object.entries(expData.variants || {})) {
        const impressions = varStats.impressions || 0;
        const conversions = Object.values(varStats.conversions || {}).reduce(
          (a, b) => a + b,
          0
        );
        const rate = impressions > 0 ? ((conversions / impressions) * 100).toFixed(2) + "%" : "0.00%";

        summary[expId].variants[varId] = {
          impressions,
          total_conversions: conversions,
          conversion_rate: rate,
          conversions_by_goal: varStats.conversions || {},
          last_event_at: varStats.last_event_at,
        };
      }
    }

    return NextResponse.json({ ok: true, experiments: summary }, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = (err as Error)?.message || "Failed to fetch metrics";
    return NextResponse.json({ ok: false, error: message }, { status: 500, headers: corsHeaders });
  }
}
