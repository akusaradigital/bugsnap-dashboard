import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { isRequestAdminAuthenticated } from "@/lib/admin-auth";
import { logSecurityEvent } from "@/lib/security-audit";

export const runtime = "nodejs";

const getAdminEmails = () =>
  (process.env.SUPER_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

async function checkAdminAuth(req: Request) {
  const isAdminAuthenticated = await isRequestAdminAuthenticated(req);
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  let authorized = isAdminAuthenticated;
  let callerEmail: string | null = null;

  const supabase = createServiceClient();

  if (!authorized && token) {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (!authError && user?.email) {
      if (getAdminEmails().includes(user.email.toLowerCase())) {
        authorized = true;
        callerEmail = user.email;
      }
    }
  }

  return { authorized, callerEmail, supabase };
}

export async function GET(req: Request) {
  const { authorized, supabase } = await checkAdminAuth(req);
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
  const search = (searchParams.get("search") || "").trim();
  const type = searchParams.get("type") || "all";
  const visibility = searchParams.get("visibility") || "all";

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    let query = supabase
      .from("captures")
      .select(
        "id, title, type, url, site_url, size, duration, is_public, views_count, created_at, user_id, workspace_id, workspaces(name)",
        { count: "exact" }
      );

    if (search) {
      query = query.or(`title.ilike.%${search}%,site_url.ilike.%${search}%`);
    }

    if (type !== "all") {
      if (type === "video") {
        query = query.ilike("type", "%video%");
      } else if (type === "screenshot") {
        query = query.or("type.ilike.%screen%,type.ilike.%shot%,type.ilike.%image%");
      }
    }

    if (visibility === "public") {
      query = query.eq("is_public", true);
    } else if (visibility === "private") {
      query = query.eq("is_public", false);
    }

    const { data: captures, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    // Fetch creator emails for these captures
    const userIds = Array.from(new Set((captures || []).map((c) => c.user_id).filter(Boolean)));
    const userEmailMap: Record<string, string> = {};

    if (userIds.length > 0) {
      const { data: userData } = await supabase
        .from("users")
        .select("id, email")
        .in("id", userIds);

      (userData || []).forEach((u) => {
        userEmailMap[u.id] = u.email;
      });
    }

    const enriched = (captures || []).map((c: Record<string, unknown>) => ({
      ...c,
      creator_email: typeof c.user_id === "string" ? userEmailMap[c.user_id] || "-" : "-",
      workspace_name: (c.workspaces as { name?: string } | null)?.name || "-",
    }));

    return NextResponse.json({
      ok: true,
      captures: enriched,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (err: unknown) {
    const message = (err as Error)?.message || "Failed to load captures";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const { authorized, callerEmail, supabase } = await checkAdminAuth(req);
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { capture_id, action, is_public } = body;

    if (!capture_id) {
      return NextResponse.json({ error: "Missing capture_id" }, { status: 400 });
    }

    if (action === "toggle_visibility") {
      const nextPublic = Boolean(is_public);
      const { data, error } = await supabase
        .from("captures")
        .update({ is_public: nextPublic })
        .eq("id", capture_id)
        .select("id, title, is_public")
        .single();

      if (error) throw error;

      await logSecurityEvent({
        type: "admin_action",
        title: nextPublic ? "Capture Made Public" : "Capture Forced Private",
        detail: `Admin ${callerEmail || "Console"} set is_public=${nextPublic} on capture ${capture_id}`,
      });

      return NextResponse.json({ ok: true, capture: data });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (err: unknown) {
    const message = (err as Error)?.message || "Internal server error";
    console.error("Admin captures PATCH error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { authorized, callerEmail, supabase } = await checkAdminAuth(req);
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const captureId = searchParams.get("captureId");

    if (!captureId) {
      return NextResponse.json({ error: "Missing captureId" }, { status: 400 });
    }

    // Get capture title before deletion
    const { data: cap } = await supabase
      .from("captures")
      .select("title, url")
      .eq("id", captureId)
      .maybeSingle();

    // Delete comments first
    await supabase.from("comments").delete().eq("capture_id", captureId);

    // Delete views
    await supabase.from("capture_views").delete().eq("capture_id", captureId);

    // Delete capture record
    const { error: delErr } = await supabase.from("captures").delete().eq("id", captureId);
    if (delErr) throw delErr;

    await logSecurityEvent({
      type: "admin_action",
      title: "Capture Takedown / Deleted",
      detail: `Admin ${callerEmail || "Console"} takedown capture ${captureId} ("${cap?.title || "Untitled"}")`,
    });

    return NextResponse.json({ ok: true, message: "Capture removed successfully" });
  } catch (err: unknown) {
    const message = (err as Error)?.message || "Failed to delete capture";
    console.error("Admin captures DELETE error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
