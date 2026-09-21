import { NextResponse } from "next/server";
import { driveAccessToken, isUuid } from "@/lib/google-drive";
import { createServiceClient, getAuthenticatedUser } from "@/lib/supabase-server";
import { verifyDownloadSig } from "@/lib/download-signing";

export const runtime = "nodejs";

interface CachedCap {
  user_id: string | null;
  workspace_id: string | null;
  expires_at: string | null;
  access_mode: "public" | "members" | null;
  password: string | null;
}

// ponytail: 60s in-memory cache to prevent repeated Supabase queries during multi-chunk video streaming
const capCache = new Map<string, { data: CachedCap | null; expiresAt: number }>();

function safeFilename(value: string, type: string) {
  const ext = type === "video" ? ".webm" : type === "logs" ? ".json" : ".png";
  const base = (value || "capture")
    .replace(/[\r\n"\\/;:*?<>|\s]+/g, "-")
    .trim()
    .slice(0, 180) || "capture";
  return base.toLowerCase().endsWith(ext) ? base : `${base}${ext}`;
}

function resolveMime(type: string, upstreamType: string | null): string {
  const raw = (upstreamType || "").toLowerCase().trim();
  if (type === "video") {
    if (raw === "video/mp4" || raw === "video/webm" || raw === "video/quicktime") return raw;
    return "video/webm";
  }
  if (type === "logs") {
    return "application/json";
  }
  if (raw === "image/jpeg" || raw === "image/webp" || raw === "image/gif") return raw;
  return "image/png";
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") || "";
  const type = url.searchParams.get("type") || "screenshot";
  const disposition = url.searchParams.get("disposition") === "inline" ? "inline" : "attachment";
  if (!/^[A-Za-z0-9_-]{10,200}$/.test(id)) {
    return NextResponse.json({ error: "Invalid file id" }, { status: 400 });
  }

  // Resolve the capture first: expiry has to be enforced before ANY byte is
  // streamed, otherwise the public-Drive path below serves expired captures.
  let cap: CachedCap | null = null;
  const cached = capCache.get(id);
  if (cached && cached.expiresAt > Date.now()) {
    cap = cached.data;
  } else {
    const supabase = createServiceClient();
    const filter = isUuid(id)
      ? `drive_file_id.eq.${id},id.eq.${id},drive_url.ilike.%${id}%,dev_logs->>driveFileId.eq.${id}`
      : `drive_file_id.eq.${id},drive_url.ilike.%${id}%,dev_logs->>driveFileId.eq.${id}`;
    const { data } = await supabase
      .from("captures")
      .select("user_id, workspace_id, expires_at, access_mode, password")
      .or(filter)
      .limit(1)
      .maybeSingle();
    cap = (data as CachedCap | null) ?? null;
    if (capCache.size >= 500) {
      const oldestKey = capCache.keys().next().value;
      if (oldestKey) capCache.delete(oldestKey);
    }
    capCache.set(id, { data: cap, expiresAt: Date.now() + 60_000 });
  }

  // An id that belongs to no capture is not ours to serve. Without this the
  // public-Drive fallback below turns this route into an open proxy for any
  // world-readable Drive file, on our domain and our egress.
  if (!cap) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (cap.expires_at && new Date(cap.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "Capture expired" }, { status: 410 });
  }

  // A members-only capture must not stream to anyone holding the file id.
  // Two ways in: a Bearer token (fetch callers) or a signature minted by
  // /api/google-drive/sign (<img>/<video>, which cannot send headers).
  // Unprotected public captures skip this entirely — unchanged for them.
  // A password on a public capture gates the page but did nothing here: the raw
  // media streamed to anyone holding the Drive id. The signature from
  // /api/google-drive/sign is the unlock proof (it mints one for a correct
  // password), so the same gate covers both cases.
  if (cap.access_mode === "members" || cap.password) {
    let allowed = verifyDownloadSig(id, url.searchParams.get("sig"), url.searchParams.get("exp"));
    if (!allowed) {
      const user = await getAuthenticatedUser(req);
      if (user) {
        allowed = cap.user_id === user.id;
        if (!allowed && cap.workspace_id) {
          const supabase = createServiceClient();
          const { data: ws } = await supabase
            .from("workspaces")
            .select("owner_user_id")
            .eq("id", cap.workspace_id)
            .maybeSingle();

          if (ws?.owner_user_id === user.id) {
            allowed = true;
          } else {
            const { data: member } = await supabase
              .from("workspace_members")
              .select("user_id")
              .eq("workspace_id", cap.workspace_id)
              .eq("user_id", user.id)
              .maybeSingle();
            allowed = !!member;
          }
        }
      }
    }
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // A shared CDN cache must not hold a members-only body: the next request for
  // the same id would be served the bytes without ever reaching the gate above.
  const cacheControl =
    cap?.access_mode === "members" ? "private, max-age=3600" : "public, max-age=3600";

  const rangeHeader = req.headers.get("range");
  const forwardHeaders: Record<string, string> = {};
  if (rangeHeader) {
    forwardHeaders["Range"] = rangeHeader;
  }

  // 1. For video or when Range is requested, try authenticated Drive API v3 first if owner token is available,
  // as it natively supports HTTP 206 Partial Content and Range headers for video seeking.
  if (cap?.user_id && (type === "video" || rangeHeader)) {
    try {
      const accessToken = await driveAccessToken(cap.user_id).catch(() => null);
      if (accessToken) {
        const authRes = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media&supportsAllDrives=true`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            ...forwardHeaders,
          },
          cache: "no-store",
        });

        // Handle 416 Range Not Satisfiable explicitly so seeking beyond EOF returns 416 instead of falling through to 403
        if (authRes.status === 416) {
          const contentRange = authRes.headers.get("content-range");
          const resHeaders: Record<string, string> = {
            "Accept-Ranges": "bytes",
            "Content-Type": type === "video" ? "video/webm" : "application/octet-stream",
          };
          if (contentRange) resHeaders["Content-Range"] = contentRange;
          return new NextResponse(null, {
            status: 416,
            headers: resHeaders,
          });
        }

        if (authRes.ok && authRes.body) {
          const rawAuthType = authRes.headers.get("content-type");
          const finalContentType = resolveMime(type, rawAuthType);
          const contentDisp = disposition === "inline" ? "inline" : `attachment; filename="${safeFilename(url.searchParams.get("filename") || "capture", type)}"`;
          const resHeaders: Record<string, string> = {
            "Content-Type": finalContentType,
            "Content-Disposition": contentDisp,
            "Cache-Control": cacheControl,
            "Accept-Ranges": "bytes",
          };
          const contentRange = authRes.headers.get("content-range");
          if (contentRange) resHeaders["Content-Range"] = contentRange;
          const contentLength = authRes.headers.get("content-length");
          if (contentLength) resHeaders["Content-Length"] = contentLength;

          return new NextResponse(authRes.body, {
            status: authRes.status,
            headers: resHeaders,
          });
        }
      }
    } catch (authErr) {
      console.warn("Drive API v3 fetch failed, falling back to direct uc fetch:", authErr);
    }
  }

  // 2. Try fetching directly via Google Drive download
  try {
    const driveRes = await fetch(`https://drive.google.com/uc?export=download&id=${id}`, {
      headers: forwardHeaders,
      cache: "no-store",
    });
    const contentType = driveRes.headers.get("content-type") || "";
    const isHtmlChallenge = contentType.includes("text/html");

    if (driveRes.ok && driveRes.body && !isHtmlChallenge) {
      const contentDisp = disposition === "inline" ? "inline" : `attachment; filename="${safeFilename(url.searchParams.get("filename") || "capture", type)}"`;
      const resolvedContentType = resolveMime(type, contentType);
      const resHeaders: Record<string, string> = {
        "Content-Type": resolvedContentType,
        "Content-Disposition": contentDisp,
        "Cache-Control": cacheControl,
        "Accept-Ranges": "bytes",
      };
      const contentRange = driveRes.headers.get("content-range");
      if (contentRange) resHeaders["Content-Range"] = contentRange;
      const contentLength = driveRes.headers.get("content-length");
      if (contentLength) resHeaders["Content-Length"] = contentLength;

      return new NextResponse(driveRes.body, {
        status: driveRes.status,
        headers: resHeaders,
      });
    }
  } catch (err) {
    console.warn("Direct Drive fetch failed, falling back to owner auth token:", err);
  }

  // 3. Fallback: Authenticated proxy using capture owner's Drive token if not tried yet.
  // This proxy IS the access path for members-only captures, so the file itself
  // stays private in Drive — we never grant `type: "anyone"` here. Doing so made
  // the sharing setting irreversible: flipping a capture back to "members" left
  // the raw Drive URL world-readable forever.
  try {
    if (cap?.user_id) {
      const accessToken = await driveAccessToken(cap.user_id).catch(() => null);
      if (accessToken) {
        const authRes = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media&supportsAllDrives=true`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            ...forwardHeaders,
          },
          cache: "no-store",
        });

        // Handle 416 Range Not Satisfiable explicitly so seeking beyond EOF returns 416 instead of falling through to 403
        if (authRes.status === 416) {
          const contentRange = authRes.headers.get("content-range");
          const resHeaders: Record<string, string> = {
            "Accept-Ranges": "bytes",
            "Content-Type": type === "video" ? "video/webm" : "application/octet-stream",
          };
          if (contentRange) resHeaders["Content-Range"] = contentRange;
          return new NextResponse(null, {
            status: 416,
            headers: resHeaders,
          });
        }

        if (authRes.ok && authRes.body) {
          const rawAuthType = authRes.headers.get("content-type");
          const finalContentType = resolveMime(type, rawAuthType);
          const contentDisp = disposition === "inline" ? "inline" : `attachment; filename="${safeFilename(url.searchParams.get("filename") || "capture", type)}"`;
          const resHeaders: Record<string, string> = {
            "Content-Type": finalContentType,
            "Content-Disposition": contentDisp,
            "Cache-Control": cacheControl,
            "Accept-Ranges": "bytes",
          };
          const contentRange = authRes.headers.get("content-range");
          if (contentRange) resHeaders["Content-Range"] = contentRange;
          const contentLength = authRes.headers.get("content-length");
          if (contentLength) resHeaders["Content-Length"] = contentLength;

          return new NextResponse(authRes.body, {
            status: authRes.status,
            headers: resHeaders,
          });
        }
      }
    }
  } catch (authErr) {
    console.warn("Owner authenticated fetch failed:", authErr);
  }

  return NextResponse.json({ error: "Download failed or file not accessible" }, { status: 403 });
}
