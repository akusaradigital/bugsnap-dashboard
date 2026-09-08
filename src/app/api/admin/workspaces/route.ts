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
  const workspaceId = searchParams.get("workspaceId");

  // Single Workspace 360 Detail
  if (workspaceId) {
    try {
      const { data: ws, error: wsErr } = await supabase
        .from("workspaces")
        .select("id, name, slug, owner_user_id, owner_email, created_at, updated_at")
        .eq("id", workspaceId)
        .single();

      if (wsErr || !ws) {
        return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
      }

      // Members
      const { data: members } = await supabase
        .from("workspace_members")
        .select("id, user_id, role, joined_at, users(email, full_name, plan)")
        .eq("workspace_id", workspaceId);

      // Captures in this workspace
      const { data: captures, count: totalCaptures } = await supabase
        .from("captures")
        .select("id, title, type, created_at, size, views_count", { count: "exact" })
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(10);

      // Calculate total storage
      const { data: allCaptures } = await supabase
        .from("captures")
        .select("size")
        .eq("workspace_id", workspaceId);

      const totalSizeBytes = (allCaptures || []).reduce((acc, c) => acc + (Number(c.size) || 0), 0);

      interface MemberDetailRow {
        id: string;
        user_id: string;
        role: string;
        joined_at: string;
        users: {
          email?: string;
          full_name?: string | null;
          plan?: string;
        } | null;
      }

      return NextResponse.json({
        ok: true,
        workspace: ws,
        members: ((members as unknown as MemberDetailRow[]) || []).map((m) => ({
          id: m.id,
          user_id: m.user_id,
          role: m.role,
          joined_at: m.joined_at,
          email: m.users?.email || "-",
          full_name: m.users?.full_name || null,
          plan: m.users?.plan || "free",
        })),
        recentCaptures: captures || [],
        totalCaptures: totalCaptures || 0,
        totalSizeBytes,
      });
    } catch (err: unknown) {
      const message = (err as Error)?.message || "Failed to load workspace";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // Paginated Workspaces List
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const search = (searchParams.get("search") || "").trim();

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    let query = supabase
      .from("workspaces")
      .select("id, name, slug, owner_user_id, owner_email, created_at", { count: "exact" });

    if (search) {
      query = query.or(`name.ilike.%${search}%,owner_email.ilike.%${search}%`);
    }

    const { data: workspaces, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    // Fetch member and capture counts for these workspaces
    const wsIds = (workspaces || []).map((w) => w.id);
    const memberCounts: Record<string, number> = {};
    const captureCounts: Record<string, number> = {};

    if (wsIds.length > 0) {
      const [{ data: mData }, { data: cData }] = await Promise.all([
        supabase.from("workspace_members").select("workspace_id").in("workspace_id", wsIds),
        supabase.from("captures").select("workspace_id").in("workspace_id", wsIds),
      ]);

      (mData || []).forEach((m) => {
        if (m.workspace_id) memberCounts[m.workspace_id] = (memberCounts[m.workspace_id] || 0) + 1;
      });
      (cData || []).forEach((c) => {
        if (c.workspace_id) captureCounts[c.workspace_id] = (captureCounts[c.workspace_id] || 0) + 1;
      });
    }

    const enriched = (workspaces || []).map((w) => ({
      ...w,
      member_count: memberCounts[w.id] || 0,
      capture_count: captureCounts[w.id] || 0,
    }));

    return NextResponse.json({
      ok: true,
      workspaces: enriched,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (err: unknown) {
    const message = (err as Error)?.message || "Failed to load workspaces";
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
    const { workspace_id, action, name, new_owner_email } = body;

    if (!workspace_id) {
      return NextResponse.json({ error: "Missing workspace_id" }, { status: 400 });
    }

    if (action === "rename") {
      const newName = (name || "").trim();
      if (!newName) return NextResponse.json({ error: "Name is required" }, { status: 400 });

      const { data, error } = await supabase
        .from("workspaces")
        .update({ name: newName, updated_at: new Date().toISOString() })
        .eq("id", workspace_id)
        .select()
        .single();

      if (error) throw error;

      await logSecurityEvent({
        type: "admin_action",
        title: "Workspace Renamed",
        detail: `Admin ${callerEmail || "Console"} renamed workspace ${workspace_id} to "${newName}"`,
      });

      return NextResponse.json({ ok: true, workspace: data });
    }

    if (action === "transfer_owner") {
      const targetEmail = (new_owner_email || "").trim().toLowerCase();
      if (!targetEmail) {
        return NextResponse.json({ error: "Target new owner email required" }, { status: 400 });
      }

      // Find user
      const { data: targetUser, error: uErr } = await supabase
        .from("users")
        .select("id, email")
        .eq("email", targetEmail)
        .maybeSingle();

      if (uErr || !targetUser) {
        return NextResponse.json({ error: `User with email ${targetEmail} does not exist` }, { status: 404 });
      }

      // Update workspace owner
      const { data: updatedWs, error: updateErr } = await supabase
        .from("workspaces")
        .update({
          owner_user_id: targetUser.id,
          owner_email: targetUser.email,
          updated_at: new Date().toISOString(),
        })
        .eq("id", workspace_id)
        .select()
        .single();

      if (updateErr) throw updateErr;

      // Ensure membership exists with role owner
      await supabase
        .from("workspace_members")
        .upsert(
          {
            workspace_id,
            user_id: targetUser.id,
            role: "owner",
          },
          { onConflict: "workspace_id,user_id" }
        );

      await logSecurityEvent({
        type: "admin_action",
        title: "Workspace Ownership Transferred",
        detail: `Admin ${callerEmail || "Console"} transferred workspace ${workspace_id} to ${targetEmail}`,
      });

      return NextResponse.json({ ok: true, workspace: updatedWs });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (err: unknown) {
    const message = (err as Error)?.message || "Internal server error";
    console.error("Admin workspace PATCH error:", err);
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
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
    }

    // Get workspace name before deletion
    const { data: ws } = await supabase
      .from("workspaces")
      .select("name, owner_email")
      .eq("id", workspaceId)
      .maybeSingle();

    // Delete members
    await supabase.from("workspace_members").delete().eq("workspace_id", workspaceId);

    // Delete or unlink captures
    await supabase.from("captures").delete().eq("workspace_id", workspaceId);

    // Delete workspace
    const { error: delErr } = await supabase.from("workspaces").delete().eq("id", workspaceId);
    if (delErr) throw delErr;

    await logSecurityEvent({
      type: "admin_action",
      title: "Workspace Deleted",
      detail: `Admin ${callerEmail || "Console"} deleted workspace "${ws?.name || workspaceId}" (Owner: ${ws?.owner_email || "-"})`,
    });

    return NextResponse.json({ ok: true, message: "Workspace deleted successfully" });
  } catch (err: unknown) {
    const message = (err as Error)?.message || "Failed to delete workspace";
    console.error("Admin workspace DELETE error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
