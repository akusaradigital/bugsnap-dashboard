import { isDisposableEmail } from "@/lib/disposable-email";
import { resolvePlanWithExpiry, normalizePlan, PLANS } from "@/lib/tiers";
import { NextResponse } from "next/server";
import { checkAdminAuth, isSuperAdminEmail } from "@/lib/admin-auth";
import { logSecurityEvent } from "@/lib/security-audit";
import { sanitizePostgrestFilter } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { authorized, callerEmail, supabase } = await checkAdminAuth(req);
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
        .select("id, email, full_name, plan, plan_expires_at, created_at, suspended, theme, job_role")
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
        effective_plan: resolvePlanWithExpiry(user.plan, (user as { plan_expires_at?: string | null }).plan_expires_at),
        is_disposable: isDisposableEmail(user.email),
        stripe_search_url: `https://dashboard.stripe.com/customers?query=${encodeURIComponent(user.email)}`,
        paddle_search_url: "https://vendors.paddle.com/customers",
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
        .select("id, title, type, created_at, drive_url, password", { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      const capIds = (captures || []).map((c) => c.id).filter(Boolean);
      const capViewsMap: Record<string, number> = {};
      if (capIds.length > 0) {
        const { data: vData } = await supabase
          .from("capture_views")
          .select("capture_id")
          .in("capture_id", capIds);
        (vData || []).forEach((v) => {
          if (v.capture_id) capViewsMap[v.capture_id] = (capViewsMap[v.capture_id] || 0) + 1;
        });
      }

      // Recent comments left on this user's captures - support context without
      // needing their password or a screen-share.
      let recentComments: Array<{ id: string; capture_id: string; author_name: string | null; body: string; created_at: string }> = [];
      if (capIds.length > 0) {
        const { data: cData } = await supabase
          .from("comments")
          .select("id, capture_id, author_name, body, created_at")
          .in("capture_id", capIds)
          .order("created_at", { ascending: false })
          .limit(10);
        recentComments = cData || [];
      }

      const enrichedCaptures = (captures || []).map((c) => ({
        id: c.id,
        title: c.title,
        type: c.type,
        created_at: c.created_at,
        url: c.drive_url,
        size: 0,
        views_count: capViewsMap[c.id] || 0,
        is_public: !c.password,
      }));

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

      await logSecurityEvent({
        type: "admin_action",
        title: "User Detail Viewed",
        detail: `Admin ${callerEmail || "Console"} viewed account detail for ${user.email}`,
      });

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
        recentCaptures: enrichedCaptures,
        totalCaptures: totalCaptures || 0,
        recentComments,
      });
    } catch (err: unknown) {
      const message = (err as Error)?.message || "Failed to fetch user details";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // Paginated Users List
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
  const search = sanitizePostgrestFilter(searchParams.get("search"));
  const plan = searchParams.get("plan") || "all";
  const status = searchParams.get("status") || "all";

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    let query = supabase
      .from("users")
      .select("id, email, full_name, plan, plan_expires_at, created_at, suspended", { count: "exact" });

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
    } else if (status === "stuck") {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      query = query.eq("suspended", false).lt("created_at", threeDaysAgo);

      // Exclude users who have at least one capture
      const { data: capUsers } = await supabase
        .from("captures")
        .select("user_id")
        .not("user_id", "is", null);
      const activeUserIds = Array.from(new Set((capUsers || []).map((c) => c.user_id as string).filter(Boolean)));
      if (activeUserIds.length > 0) {
        query = query.not("id", "in", `(${activeUserIds.join(",")})`);
      }
    }

    const { data: users, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    const userList = (users || []) as Array<{
      id: string;
      email: string;
      full_name: string | null;
      plan: string;
      plan_expires_at?: string | null;
      created_at: string;
      suspended: boolean;
      google_drive_connected?: boolean;
      effective_plan?: string;
      is_disposable?: boolean;
    }>;

    let connectedSet = new Set<string>();
    if (userList.length > 0) {
      const userIds = userList.map((u) => u.id);
      const { data: driveConns } = await supabase
        .from("google_drive_connections")
        .select("user_id")
        .in("user_id", userIds);
      connectedSet = new Set((driveConns || []).map((d) => d.user_id));
    }

    const enrichedUsers = userList.map((u) => ({
      ...u,
      effective_plan: resolvePlanWithExpiry(u.plan, u.plan_expires_at),
      is_disposable: isDisposableEmail(u.email),
      google_drive_connected: connectedSet.has(u.id),
    }));

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
  const { authorized, callerUserId, callerEmail, supabase } = await checkAdminAuth(req);
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }
    const { user_id, action, plan, suspended } = body;

    if (!user_id) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    // 1. Update Subscription Plan (with optional expiry / comp duration)
    if (action === "set_plan") {
      // Was a hand-written ["free","pro","team","enterprise"] that diverged
      // from tiers.ts's real Plan type: "team" has no distinct pricing (it's
      // aliased to "pro" in paddle.ts) and silently normalized to "free"
      // everywhere else via normalizePlan(), while "pro_plus" - a real tier
      // with its own Paddle pricing - couldn't be granted here at all.
      const targetPlan = (plan || "").toLowerCase();
      if (!PLANS.includes(targetPlan as (typeof PLANS)[number])) {
        return NextResponse.json({ error: "Invalid plan specified" }, { status: 400 });
      }

      const { expires_in } = body;
      let planExpiresAt: string | null = null;
      if (targetPlan !== "free") {
        if (expires_in === "7d") {
          planExpiresAt = new Date(Date.now() + 7 * 86400 * 1000).toISOString();
        } else if (expires_in === "30d" || expires_in === "1m") {
          planExpiresAt = new Date(Date.now() + 30 * 86400 * 1000).toISOString();
        } else if (expires_in === "90d" || expires_in === "3m") {
          planExpiresAt = new Date(Date.now() + 90 * 86400 * 1000).toISOString();
        } else if (expires_in === "180d" || expires_in === "6m") {
          planExpiresAt = new Date(Date.now() + 180 * 86400 * 1000).toISOString();
        } else if (expires_in === "365d" || expires_in === "1y") {
          planExpiresAt = new Date(Date.now() + 365 * 86400 * 1000).toISOString();
        } else if (expires_in && expires_in !== "permanent" && expires_in !== "never") {
          const parsed = new Date(expires_in).getTime();
          if (!isNaN(parsed)) planExpiresAt = new Date(parsed).toISOString();
        }
      }

      const { data, error } = await supabase
        .from("users")
        .update({ plan: targetPlan, plan_expires_at: planExpiresAt })
        .eq("id", user_id)
        .select("id, email, plan, plan_expires_at")
        .single();

      if (error) throw error;

      const expiryNote = planExpiresAt ? ` (expires ${new Date(planExpiresAt).toLocaleDateString()})` : " (permanent)";
      await logSecurityEvent({
        type: "admin_action",
        title: "User Plan Changed",
        detail: `Admin ${callerEmail || "Console"} changed plan of ${data.email} to ${targetPlan}${expiryNote}`,
      });

      return NextResponse.json({ ok: true, user: data });
    }

    // 1b. Sync / Reconcile Subscription with Stripe or Paddle
    if (action === "sync_subscription") {
      const { data: user, error: fetchErr } = await supabase
        .from("users")
        .select("id, email, plan")
        .eq("id", user_id)
        .single();

      if (fetchErr || !user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const stripeSecret = process.env.STRIPE_SECRET_KEY;
      let synced = false;
      let gatewayPlan: string | null = null;
      let gatewayExpiresAt: string | null = null;
      let source: string | null = null;

      if (stripeSecret) {
        try {
          const stripeRes = await fetch(
            `https://api.stripe.com/v1/customers?email=${encodeURIComponent(user.email)}&expand[]=data.subscriptions`,
            {
              headers: { Authorization: `Bearer ${stripeSecret}` },
            }
          );
          if (stripeRes.ok) {
            const stripeData = await stripeRes.json();
            // A re-signup or a test+prod split can leave >1 Stripe customer
            // record for the same email - data[0] silently ignored every
            // subscription that wasn't on the first one.
            const customers = Array.isArray(stripeData.data) ? stripeData.data : [];
            let activeSub: { status?: string; cancel_at_period_end?: boolean; current_period_end?: number; metadata?: { plan?: string }; items?: { data?: Array<{ price?: { metadata?: { plan?: string } } }> } } | undefined;
            for (const customer of customers) {
              const subs = customer?.subscriptions?.data || [];
              activeSub = subs.find(
                (s: { status?: string }) => s.status === "active" || s.status === "trialing"
              );
              if (activeSub) break;
            }
            if (activeSub) {
              synced = true;
              source = "Stripe";
              const metaPlan =
                activeSub.metadata?.plan || activeSub.items?.data?.[0]?.price?.metadata?.plan;
              gatewayPlan = metaPlan ? normalizePlan(String(metaPlan).toLowerCase()) : "pro";
              // A subscription can be status "active" and still be scheduled
              // to end (cancel_at_period_end) - writing null here silently
              // turned a scheduled cancellation into permanent access.
              gatewayExpiresAt =
                activeSub.cancel_at_period_end && activeSub.current_period_end
                  ? new Date(activeSub.current_period_end * 1000).toISOString()
                  : null;
            }
          }
        } catch (stripeErr) {
          console.warn("[Admin] Stripe subscription sync warning:", stripeErr);
        }
      }

      if (synced && gatewayPlan) {
        await supabase
          .from("users")
          .update({ plan: gatewayPlan, plan_expires_at: gatewayExpiresAt, checkout_status: "completed" })
          .eq("id", user_id);

        await logSecurityEvent({
          type: "admin_action",
          title: "Subscription Reconciled",
          detail: `Admin reconciled ${user.email} from ${source}: set plan to ${gatewayPlan}${gatewayExpiresAt ? ` (expires ${gatewayExpiresAt})` : ""}`,
        });

        return NextResponse.json({
          ok: true,
          synced: true,
          plan: gatewayPlan,
          message: `Successfully synchronized ${gatewayPlan.toUpperCase()} subscription from ${source}!`,
        });
      }

      return NextResponse.json({
        ok: true,
        synced: false,
        message: "No active gateway subscription found.",
        stripe_search_url: `https://dashboard.stripe.com/customers?query=${encodeURIComponent(user.email)}`,
        paddle_search_url: "https://vendors.paddle.com/customers",
      });
    }

    // 2. Toggle Suspend
    if (action === "toggle_suspend") {
      const isSuspended = Boolean(suspended);

      if (isSuspended) {
        const { data: targetUser } = await supabase
          .from("users")
          .select("id, email")
          .eq("id", user_id)
          .maybeSingle();

        if (targetUser) {
          if (
            (callerUserId && user_id === callerUserId) ||
            (callerEmail && targetUser.email?.toLowerCase() === callerEmail.toLowerCase())
          ) {
            return NextResponse.json({ error: "You cannot suspend your own account" }, { status: 400 });
          }
          if (isSuperAdminEmail(targetUser.email)) {
            return NextResponse.json({ error: "Super admin accounts cannot be suspended" }, { status: 400 });
          }
        }
      }

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

      const origin = (process.env.NEXT_PUBLIC_APP_URL || "https://bugsnap.akusaraproject.my.id").replace(/\/+$/, "");
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

    // 4. Send Onboarding Re-engagement Email
    if (action === "send_reengagement") {
      const { data: user, error: fetchErr } = await supabase
        .from("users")
        .select("id, email, full_name")
        .eq("id", user_id)
        .single();

      if (fetchErr || !user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (!process.env.RESEND_API_KEY) {
        return NextResponse.json({ error: "RESEND_API_KEY is not configured" }, { status: 400 });
      }

      const userName = user.full_name || "there";
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://bugsnap.akusaraproject.my.id").replace(/\/+$/, "");
      const chromeStoreUrl = "https://chromewebstore.google.com";

      const htmlBody = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; line-height: 1.6;">
        <h2 style="color: #0f172a; margin-top: 0;">Halo ${userName}! 👋</h2>
        <p>Kami melihat Anda telah mendaftar di BugSnap, tetapi belum sempat mencoba capture bug pertama Anda.</p>
        <p>Dengan ekstensi Chrome BugSnap, Anda bisa merekam layar, tangkapan layar, dan dev logs (Console error & Network 4xx/5xx) hanya dengan 1 klik langsung ke Google Drive Anda!</p>
        <div style="margin: 28px 0;">
          <a href="${chromeStoreUrl}" style="background-color: #89BD49; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
            Pasang Ekstensi Chrome & Mulai Capture 🚀
          </a>
        </div>
        <p style="font-size: 13px; color: #64748b;">Butuh bantuan atau panduan? Kunjungi <a href="${appUrl}/dashboard" style="color: #89BD49;">Dashboard BugSnap</a> atau balas email ini langsung.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">Email ini dikirim oleh tim BugSnap.</p>
      </div>`;

      const fromEmail = process.env.RESEND_FROM_EMAIL || "BugSnap <noreply@akusaraproject.my.id>";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [user.email],
          subject: "Ambil Bug Pertama Anda dengan BugSnap ⚡",
          html: htmlBody,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Failed to send email via Resend");
      }

      await logSecurityEvent({
        type: "admin_action",
        title: "Re-engagement Email Sent",
        detail: `Admin ${callerEmail || "Console"} sent onboarding re-engagement email to ${user.email}`,
      });

      return NextResponse.json({ ok: true, message: `Re-engagement email sent to ${user.email}` });
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

    // Get user email before deletion for authorization and audit log
    const { data: user } = await supabase
      .from("users")
      .select("email")
      .eq("id", userId)
      .maybeSingle();

    if (
      (callerUserId && userId === callerUserId) ||
      (callerEmail && user?.email && user.email.toLowerCase() === callerEmail.toLowerCase())
    ) {
      return NextResponse.json({ error: "You cannot delete your own admin account" }, { status: 400 });
    }

    if (user?.email && isSuperAdminEmail(user.email)) {
      return NextResponse.json({ error: "Cannot delete a Super Admin account" }, { status: 400 });
    }

    const userEmail = user?.email || userId;

    // Clean up associated relations to prevent foreign key violations
    await supabase.from("google_drive_connections").delete().eq("user_id", userId);
    await supabase.from("google_drive_oauth_states").delete().eq("user_id", userId);
    await supabase.from("comments").delete().eq("user_id", userId);

    const { data: ownedWorkspaces } = await supabase
      .from("workspaces")
      .select("id")
      .eq("owner_user_id", userId);

    const ownedWsIds = (ownedWorkspaces || []).map((w) => w.id);
    if (ownedWsIds.length > 0) {
      await supabase.from("captures").delete().in("workspace_id", ownedWsIds);
      await supabase.from("workspace_settings").delete().in("workspace_id", ownedWsIds);
      await supabase.from("workspace_members").delete().in("workspace_id", ownedWsIds);
      await supabase.from("bugsnap_api_keys").delete().in("workspace_id", ownedWsIds);
      await supabase.from("workspaces").delete().in("id", ownedWsIds);
    }

    await supabase.from("captures").delete().eq("user_id", userId);
    await supabase.from("workspace_members").delete().eq("user_id", userId);

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
