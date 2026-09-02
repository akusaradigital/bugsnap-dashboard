import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

function extractCaptureId(urlStr: string): string | null {
  try {
    const parsed = new URL(urlStr);
    const match = parsed.pathname.match(/\/v\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  } catch {
    const match = urlStr.match(/\/v\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }
}

function driveFileId(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  const idParam = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParam) return idParam[1];
  return null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  const captureId = extractCaptureId(targetUrl);
  if (!captureId) {
    return NextResponse.json({ error: "Could not extract capture ID from URL" }, { status: 400 });
  }

  try {
    const supabase = createServiceClient();
    const { data: rawCapture, error } = await supabase
      .rpc("get_public_capture", { p_id: captureId })
      .maybeSingle();

    if (error) throw error;
    if (!rawCapture) {
      return NextResponse.json({ error: "Capture not found or private" }, { status: 404 });
    }

    const capture = rawCapture as {
      id?: string;
      title?: string;
      description?: string;
      type?: string;
      drive_url?: string;
      site_url?: string;
      owner_email?: string;
      created_at?: string;
    };

    const fid = driveFileId(capture.drive_url || null);
    const thumbnailUrl = fid
      ? `https://drive.google.com/thumbnail?id=${fid}&sz=w600`
      : null;

    return NextResponse.json(
      {
        version: "1.0",
        type: "rich",
        provider_name: "BugSnap",
        provider_url: "https://bugsnap.akusaraproject.my.id",
        title: capture.title || "BugSnap Capture",
        description: capture.description || "",
        capture_type: capture.type || "screenshot",
        thumbnail_url: thumbnailUrl,
        web_url: targetUrl,
        author_name: capture.owner_email ? capture.owner_email.split("@")[0] : undefined,
        site_url: capture.site_url || undefined,
        created_at: capture.created_at,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=600",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch capture oEmbed" },
      { status: 500 }
    );
  }
}
