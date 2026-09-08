import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

function clean(value: string | undefined) {
  return value?.replace(/^[﻿​‌‍]+|[﻿​‌‍]+$/g, "").trim();
}

export async function GET() {
  let extConfig = {
    minVersion: "1.0.24",
    latestVersion: "1.0.24",
    forceUpdate: false,
    updateUrl: "https://chromewebstore.google.com",
    maintenanceMode: false,
    announcement: "",
  };

  try {
    const db = createServiceClient();
    const { data: row } = await db
      .from("app_settings")
      .select("value")
      .eq("key", "extension_config")
      .maybeSingle();

    if (row?.value && typeof row.value === "object") {
      extConfig = { ...extConfig, ...(row.value as Record<string, unknown>) };
    }
  } catch {
    // fallback gracefully to defaults
  }

  return NextResponse.json(
    {
      supabaseUrl: clean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      supabaseAnonKey: clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      googleDriveClientId: clean(process.env.GOOGLE_DRIVE_CLIENT_ID),
      apiVersion: extConfig.latestVersion || "1.0.24",
      extension: extConfig,
      features: {
        watermark: true,
        aiSummary: true,
        uploadQueue: true,
      },
    },
    {
      status: 200,
      headers: corsHeaders,
    }
  );
}
