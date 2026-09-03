import { NextResponse } from "next/server";

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

// ponytail: same zero-width/BOM strip as lib/google-drive.ts's env() -
// Vercel env vars pasted from elsewhere can carry an invisible leading char
// that breaks the extension's client_id regex validation.
function clean(value: string | undefined) {
  return value?.replace(/^[﻿​‌‍￾]+|[﻿​‌‍￾]+$/g, "").trim();
}

export async function GET() {
  return NextResponse.json(
    {
      supabaseUrl: clean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      supabaseAnonKey: clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      googleDriveClientId: clean(process.env.GOOGLE_DRIVE_CLIENT_ID),
      apiVersion: "1.0.24",
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
