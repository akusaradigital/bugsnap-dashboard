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
  let callerUserId: string | null = null;
  let callerEmail: string | null = null;

  const supabase = createServiceClient();

  if (!authorized && token) {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (!authError && user?.email) {
      if (getAdminEmails().includes(user.email.toLowerCase())) {
        authorized = true;
        callerUserId = user.id;
        callerEmail = user.email;
      }
    }
  }

  return { authorized, callerUserId, callerEmail, supabase };
}

export async function GET(req: Request) {
  const { authorized, supabase } = await checkAdminAuth(req);
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  // Single User 360 Detail View
  if (userId) {
    try {
      const { data: user, error: userErr } = await supabase
        .from("users")
        .select("id, email, full_name, plan, created_at, suspended, theme, job_role")
        .eq("id", userId)
        .single();

      if (userErr || !user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Google Drive connection status
      const { data: driveConn } = await supabase
        .from("google_drive_connections")
        .select("google_email")
        .eq("user_id", userId)
        .maybeSingle();

      const enrichedUser = {
        ...user,
        google_drive_connected: Boolean(driveConn),
        google_drive_email: driveConn?.google_email || null,
      };

      // Workspaces where user is owner or member
      const { data: memberRows } = await supabase
        .from("workspace_members")
        .select("workspace_id, role, joined_at, workspaces(id, name, slug, owner_user_id, created_at)")
        .eq("user_id", userId);

      // Recent captures created by this user
      const { data: captures, count: totalCaptures } = await supabase
        .from("captures")
        .select("id, title, type, created_at, size, views_count, is_public", { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      interface WorkspaceMemberRow {
        workspace_id: string;
        role: string;
        workspaces: {
          id: string;
          name: string;
          owner_user_id: string;
          created_at: string;
        } | null;
      }

      return NextResponse.json({
        ok: true,
        user: enrichedUser,
        workspaces: ((memberRows as unknown as WorkspaceMemberRow[]) || []).map((m) => ({
          id: m.workspaces?.id || m.workspace_id,
          name: m.workspaces?.name || "Workspace",
          role: m.role,
          is_owner: m.workspaces?.owner_user_id === userId,
          created_at: m.workspaces?.created_at,
        })),
        recentCaptures: captures || [],
        totalCaptures: totalCaptures || 0,
      });
    } catch (err: unknown) {
      const message = (err as Error)?.message || "Failed to fetch user details";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // Paginated Users List
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
  const search = (searchParams.get("search") || "").trim();
  const plan = searchParams.get("plan") || "all";
  const status = searchParams.get("status") || "all";

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    let query = supabase
      .from("users")
      .select("id, email, full_name, plan, created_at, suspended", { count: "exact" });

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    if (plan !== "all") {
      query = query.eq("plan", plan.toLowerCase());
    }

    if (status === "active") {
      query = query.eq("suspended", false);
    } else if (status === "suspended") {
      query = query.eq("suspended", true);
    }

    const { data: users, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    const userList = users || [];
    let enrichedUsers = userList;

    if (userList.length > 0) {
      const userIds = userList.map((u) => u.id);
      const { data: driveConns } = await supabase
        .from("google_drive_connections")
        .select("user_id")
        .in("user_id", userIds);

      const connectedSet = new Set((driveConns || []).map((d) => d.user_id));
      enrichedUsers = userList.map((u) => ({
        ...u,
        google_drive_connected: connectedSet.has(u.id),
      }));
    }

    return NextResponse.json({
      ok: true,
      users: enrichedUsers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (err: unknown) {
    const message = (err as Error)?.message || "Failed to load users";
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
    const { user_id, action, plan, suspended } = body;

    if (!user_id) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    // 1. Update Subscription Plan
    if (action === "set_plan") {
      const validPlans = ["free", "pro", "team", "enterprise"];
      const targetPlan = (plan || "").toLowerCase();
      if (!validPlans.includes(targetPlan)) {
        return NextResponse.json({ error: "Invalid plan specified" }, { status: 400 });
      }

      const { data, error } = await supabase
        .from("users")
        .update({ plan: targetPlan })
        .eq("id", user_id)
        .select("id, email, plan")
        .single();

      if (error) throw error;

      await logSecurityEvent({
        type: "admin_action",
        title: "User Plan Changed",
        detail: `Admin ${callerEmail || "Console"} changed plan of ${data.email} to ${targetPlan}`,
      });

      return NextResponse.json({ ok: true, user: data });
    }

    // 2. Toggle Suspend
    if (action === "toggle_suspend") {
      const isSuspended = Boolean(suspended);
      const { data, error } = await supabase
        .from("users")
        .update({ suspended: isSuspended })
        .eq("id", user_id)
        .select("id, email, suspended")
        .single();

      if (error) throw error;

      await logSecurityEvent({
        type: "admin_action",
        title: isSuspended ? "User Suspended" : "User Unsuspended",
        detail: `Admin ${callerEmail || "Console"} set suspended=${isSuspended} for ${data.email}`,
      });

      return NextResponse.json({ ok: true, user: data });
    }

    // 3. Send Password Reset
    if (action === "reset_password") {
      const { data: user, error: fetchErr } = await supabase
        .from("users")
        .select("email")
        .eq("id", user_id)
        .single();

      if (fetchErr || !user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const origin = req.headers.get("origin") || "https://bugsnap.site";
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${origin}/login?reset=true`,
      });

      if (resetErr) throw resetErr;

      await logSecurityEvent({
        type: "admin_action",
        title: "Password Reset Triggered",
        detail: `Admin triggered password reset email for ${user.email}`,
      });

      return NextResponse.json({ ok: true, message: `Reset email sent to ${user.email}` });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (err: unknown) {
    const message = (err as Error)?.message || "Internal server error";
    console.error("Admin user PATCH error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { authorized, callerUserId, callerEmail, supabase } = await checkAdminAuth(req);
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    if (callerUserId && userId === callerUserId) {
      return NextResponse.json({ error: "You cannot delete your own admin account" }, { status: 400 });
    }

    // Get user email before deletion for audit log
    const { data: user } = await supabase
      .from("users")
      .select("email")
      .eq("id", userId)
      .maybeSingle();

    const userEmail = user?.email || userId;

    // Delete from auth.users (cascades or service role handles)
    try {
      await supabase.auth.admin.deleteUser(userId);
    } catch (authErr) {
      console.warn("Auth user delete warning:", authErr);
    }

    // Delete from public.users table
    const { error: dbErr } = await supabase.from("users").delete().eq("id", userId);
    if (dbErr) throw dbErr;

    await logSecurityEvent({
      type: "admin_action",
      title: "User Account Deleted",
      detail: `Admin ${callerEmail || "Console"} permanently deleted user account ${userEmail} (${userId})`,
    });

    return NextResponse.json({ ok: true, message: `User ${userEmail} deleted successfully` });
  } catch (err: unknown) {
    const message = (err as Error)?.message || "Failed to delete user";
    console.error("Admin user DELETE error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
