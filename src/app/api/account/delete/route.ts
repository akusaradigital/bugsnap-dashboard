import { NextResponse } from "next/server";
import { createServiceClient, getAuthenticatedUser } from "@/lib/supabase-server";
import { logSecurityEvent } from "@/lib/security-audit";
import { isSuperAdminEmail } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const userEmail = user.email;

    if (isSuperAdminEmail(userEmail)) {
      return NextResponse.json(
        { error: "Akun Super Admin tidak dapat dihapus secara mandiri." },
        { status: 403 }
      );
    }
    const db = createServiceClient();

    // 1. Remove Google Drive integrations & state tokens
    await db.from("google_drive_connections").delete().eq("user_id", userId);
    await db.from("google_drive_oauth_states").delete().eq("user_id", userId);

    // 2. Remove comments written by user
    await db.from("comments").delete().eq("user_id", userId);

    // 3. Find and clean up workspaces owned by user
    const { data: ownedWorkspaces } = await db
      .from("workspaces")
      .select("id")
      .eq("owner_user_id", userId);

    const ownedWsIds = (ownedWorkspaces || []).map((w) => w.id);

    if (ownedWsIds.length > 0) {
      await db.from("captures").delete().in("workspace_id", ownedWsIds);
      await db.from("workspace_settings").delete().in("workspace_id", ownedWsIds);
      await db.from("workspace_members").delete().in("workspace_id", ownedWsIds);
      await db.from("bugsnap_api_keys").delete().in("workspace_id", ownedWsIds);
      await db.from("workspaces").delete().in("id", ownedWsIds);
    }

    // 4. Delete captures created directly by user outside owned workspaces
    await db.from("captures").delete().eq("user_id", userId);

    // 5. Remove membership from other workspaces
    await db.from("workspace_members").delete().eq("user_id", userId);

    // 6. Delete from public.users table
    await db.from("users").delete().eq("id", userId);

    // 7. Delete from Supabase Auth
    try {
      await db.auth.admin.deleteUser(userId);
    } catch (authErr) {
      console.warn("[Account Delete] Supabase auth deletion warning:", authErr);
    }

    // 8. Log security event for audit trail
    await logSecurityEvent({
      type: "admin_action",
      title: "User Self-Deleted Account",
      detail: `User permanently deleted account ${userEmail} (${userId})`,
    });

    return NextResponse.json({ ok: true, message: "Account deleted successfully" });
  } catch (err: unknown) {
    console.error("[Account Delete] Error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Failed to delete account" },
      { status: 500 }
    );
  }
}
