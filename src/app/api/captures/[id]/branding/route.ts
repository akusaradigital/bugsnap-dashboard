import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = await params;
  const captureId = resolvedParams?.id?.trim();
  if (!captureId) {
    return NextResponse.json({ error: "Missing capture ID" }, { status: 400 });
  }

  const db = createServiceClient();
  const { data: capture, error: capError } = await db
    .from("captures")
    .select("workspace_id")
    .eq("id", captureId)
    .maybeSingle();

  if (capError || !capture?.workspace_id) {
    return NextResponse.json({
      brandName: "BugSnap",
      logoUrl: "",
      hideWatermark: false,
      configuredIntegrations: [] as string[],
    });
  }

  const { data: settings } = await db
    .from("workspace_settings")
    .select("brand_name, custom_logo_url, hide_watermark, integrations")
    .eq("workspace_id", capture.workspace_id)
    .maybeSingle();

  const rawIntegrations = (settings?.integrations || {}) as Record<string, Record<string, string>>;
  const configuredIntegrations: string[] = [];
  for (const [k, v] of Object.entries(rawIntegrations)) {
    if (v && typeof v === "object" && Object.values(v).some((val) => typeof val === "string" && val.trim().length > 0)) {
      configuredIntegrations.push(k);
    }
  }

  return NextResponse.json({
    brandName: settings?.brand_name || "BugSnap",
    logoUrl: settings?.custom_logo_url || "",
    hideWatermark: Boolean(settings?.hide_watermark),
    configuredIntegrations,
  });
}
