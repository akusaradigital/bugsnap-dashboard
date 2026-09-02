import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

// ponytail: in-memory rate limiter (30 req/min per key), ceiling is single-instance reset on restart
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(key) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT_MAX) return false;
  timestamps.push(now);
  rateLimitMap.set(key, timestamps);
  return true;
}

export async function POST(request: Request) {
  try {
    const auth = await authenticateApiRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized. Missing or invalid API key. Expected: Bearer bugsnap_..." },
        { status: 401 }
      );
    }

    if (!checkRateLimit(auth.workspaceId)) {
      return NextResponse.json({ error: "Rate limit exceeded (30 req/min)" }, { status: 429 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const input = body as { title?: unknown; description?: unknown; evidenceUrl?: unknown; type?: unknown };
    const { title, description, evidenceUrl, type } = input || {};

    if (!evidenceUrl || typeof evidenceUrl !== "string" || !evidenceUrl.trim()) {
      return NextResponse.json({ error: 'Field "evidenceUrl" is required' }, { status: 400 });
    }

    const captureTitle = (typeof title === "string" && title.trim()) ? title.trim() : "Imported Capture";
    const captureType = type === "video" ? "video" : "screenshot";
    const db = createServiceClient();

    const insertPayload = {
      title: captureTitle,
      type: captureType,
      drive_url: evidenceUrl.trim(),
      description: typeof description === "string" ? description.trim() : "",
      workspace_id: auth.workspaceId,
      source: "api",
      is_starred: false,
      is_archived: false,
    };

    const { data, error } = await db
      .from("captures")
      .insert(insertPayload)
      .select("id, title, type, drive_url, description, workspace_id, created_at")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "Failed to create capture" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: data.id,
          title: data.title,
          type: data.type,
          url: data.drive_url,
          description: data.description,
          workspaceId: data.workspace_id,
          createdAt: data.created_at,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
