import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function GET() {
  const start = Date.now();
  try {
    const db = createServiceClient();
    const { error } = await db.from("users").select("id", { head: true, count: "exact" }).limit(1);
    const latency = Date.now() - start;

    if (error) {
      console.error("[HealthCheck] Database error:", error.message);
      return NextResponse.json(
        { status: "degraded", database: "error", latencyMs: latency },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: "healthy",
      database: "connected",
      latencyMs: latency,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[HealthCheck] Database connection failed:", err);
    return NextResponse.json(
      {
        status: "unhealthy",
        database: "disconnected",
        latencyMs: Date.now() - start,
      },
      { status: 503 }
    );
  }
}
