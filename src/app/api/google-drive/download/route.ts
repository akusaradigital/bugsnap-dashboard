import { NextResponse } from "next/server";
import { driveAccessToken } from "@/lib/google-drive";
import { createServiceClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

function safeFilename(value: string, type: string) {
  const ext = type === "video" ? ".webm" : type === "logs" ? ".json" : ".png";
  const base = (value || "capture").replace(/[\\/:*?"<>| - ]/g, "-").trim().slice(0, 180) || "capture";
  return base.toLowerCase().endsWith(ext) ? base : `${base}${ext}`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") || "";
  const type = url.searchParams.get("type") || "screenshot";
  const disposition = url.searchParams.get("disposition") === "inline" ? "inline" : "attachment";
  if (!/^[A-Za-z0-9_-]{10,200}$/.test(id)) {
    return NextResponse.json({ error: "Invalid file id" }, { status: 400 });
  }

  // 1. Try fetching directly via Google Drive download
  try {
    const driveRes = await fetch(`https://drive.google.com/uc?export=download&id=${id}`, { cache: "no-store" });
    const contentType = driveRes.headers.get("content-type") || "";
    const isHtmlChallenge = contentType.includes("text/html");

    if (driveRes.ok && driveRes.body && !isHtmlChallenge) {
      const contentDisp = disposition === "inline" ? "inline" : `attachment; filename="${safeFilename(url.searchParams.get("filename") || "capture", type)}"`;
      return new NextResponse(driveRes.body, {
        headers: {
          "Content-Type": contentType || (type === "video" ? "video/webm" : type === "logs" ? "application/json" : "image/png"),
          "Content-Disposition": contentDisp,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }
  } catch (err) {
    console.warn("Direct Drive fetch failed, falling back to owner auth token:", err);
  }

  // 2. Fallback: Authenticated proxy using capture owner's Drive token
  try {
    const supabase = createServiceClient();
    const { data: cap } = await supabase
      .from("captures")
      .select("user_id, expires_at, access_mode")
      .or(`drive_file_id.eq.${id},id.eq.${id}`)
      .limit(1)
      .maybeSingle();

    if (cap) {
      if (cap.expires_at && new Date(cap.expires_at).getTime() < Date.now()) {
        return NextResponse.json({ error: "Capture expired" }, { status: 410 });
      }
    }

    if (cap?.user_id) {
      const accessToken = await driveAccessToken(cap.user_id).catch(() => null);
      if (accessToken) {
        // Self-heal: asynchronously ensure anyone with link can view if access_mode is public
        if (cap.access_mode !== "members") {
          fetch(`https://www.googleapis.com/drive/v3/files/${id}/permissions?supportsAllDrives=true`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ role: "reader", type: "anyone" }),
          }).catch(() => {});
        }

        const authRes = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media&supportsAllDrives=true`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
        });

        if (authRes.ok && authRes.body) {
          const finalContentType = authRes.headers.get("content-type") || (type === "video" ? "video/webm" : type === "logs" ? "application/json" : "image/png");
          const contentDisp = disposition === "inline" ? "inline" : `attachment; filename="${safeFilename(url.searchParams.get("filename") || "capture", type)}"`;
          return new NextResponse(authRes.body, {
            headers: {
              "Content-Type": finalContentType,
              "Content-Disposition": contentDisp,
              "Cache-Control": "public, max-age=3600",
            },
          });
        }
      }
    }
  } catch (authErr) {
    console.warn("Owner authenticated fetch failed:", authErr);
  }

  return NextResponse.json({ error: "Download failed or file not accessible" }, { status: 403 });
}
