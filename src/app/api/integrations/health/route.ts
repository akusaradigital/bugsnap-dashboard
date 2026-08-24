import { NextResponse } from "next/server";
import { authenticatedUser, getDriveConnectionHealth } from "@/lib/google-drive";

export const runtime = "nodejs";

type ServiceState = "healthy" | "action_required" | "not_configured";

export async function GET(request: Request) {
  const user = await authenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const drive = await getDriveConnectionHealth(user.id);
    const aiProvider = process.env.CUSTOM_ROUTER_API_KEY
      ? "custom_router"
      : process.env.OPENROUTER_API_KEY
      ? "openrouter"
      : process.env.OPENAI_API_KEY
      ? "openai"
      : null;

    const emailState: ServiceState = process.env.RESEND_API_KEY ? "healthy" : "not_configured";
    const aiState: ServiceState = aiProvider ? "healthy" : "not_configured";
    const driveState: ServiceState = drive.status === "connected"
      ? "healthy"
      : drive.status === "reconnect_required"
      ? "action_required"
      : "not_configured";

    return NextResponse.json({
      drive: {
        state: driveState,
        status: drive.status,
        email: drive.email,
        updatedAt: drive.updatedAt,
        message: drive.message,
      },
      email: {
        state: emailState,
        provider: process.env.RESEND_API_KEY ? "resend" : null,
        message: process.env.RESEND_API_KEY ? "Email delivery is configured" : "Email delivery is not configured",
      },
      ai: {
        state: aiState,
        provider: aiProvider,
        message: aiProvider ? `AI summaries use ${aiProvider}` : "AI provider is not configured",
      },
    });
  } catch {
    return NextResponse.json({ error: "Unable to read integration health" }, { status: 500 });
  }
}
