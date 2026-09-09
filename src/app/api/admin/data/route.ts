import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { isRequestAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const isAdminAuthenticated = await isRequestAdminAuthenticated(req);
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  let authorized = isAdminAuthenticated;
  const serviceClient = createServiceClient();

  if (!authorized && token) {
    const { data: { user }, error: authError } = await serviceClient.auth.getUser(token);
    if (!authError && user?.email) {
      const adminEmails = (process.env.SUPER_ADMIN_EMAILS || "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      if (adminEmails.includes(user.email.toLowerCase())) {
        authorized = true;
      }
    }
  }

  if (!authorized) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
    // 14 days lookback for real time-series chart
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const iso14 = fourteenDaysAgo.toISOString();

    const [
      { count: totalUsers },
      { count: totalWorkspaces },
      { count: totalCaptures },
      { count: totalViews },
      { count: totalComments },
      { data: usersList },
      { data: workspacesList },
      { data: promoSetting },
      { data: recentCaptures },
      { data: recentViews },
      { count: openTicketsCount },
      { count: hotProspectsCount },
      { count: abandonedCartsCount },
    ] = await Promise.all([
      serviceClient.from("users").select("*", { count: "exact", head: true }),
      serviceClient.from("workspaces").select("*", { count: "exact", head: true }),
      serviceClient.from("captures").select("*", { count: "exact", head: true }),
      serviceClient.from("capture_views").select("*", { count: "exact", head: true }),
      serviceClient.from("comments").select("*", { count: "exact", head: true }),
      serviceClient
        .from("users")
        .select("id, email, full_name, plan, created_at, suspended")
        .order("created_at", { ascending: false })
        .limit(200),
      serviceClient
        .from("workspaces")
        .select("id, name, owner_email, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      serviceClient
        .from("app_settings")
        .select("value")
        .eq("key", "promo_banner")
        .maybeSingle(),
      serviceClient
        .from("captures")
        .select("id, created_at, workspace_id, type")
        .gte("created_at", iso14)
        .order("created_at", { ascending: true })
        .limit(1000),
      serviceClient
        .from("capture_views")
        .select("id, viewed_at")
        .gte("viewed_at", iso14)
        .order("viewed_at", { ascending: true })
        .limit(1000),
      serviceClient
        .from("support_tickets")
        .select("id", { count: "exact", head: true })
        .eq("status", "open"),
      serviceClient
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("plan", "free")
        .gt("paywall_hits", 0),
      serviceClient
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("checkout_status", "abandoned"),
    ]);

    // Compute real 7-day daily activity time series
    const dailyMap: Record<
      string,
      { label: string; date: string; captures: number; views: number; workspaces: number; users: number }
    > = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const yyyyMmDd = d.toISOString().split("T")[0];
      const dayLabel = d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric" });
      dailyMap[yyyyMmDd] = { label: dayLabel, date: yyyyMmDd, captures: 0, views: 0, workspaces: 0, users: 0 };
    }

    (recentCaptures || []).forEach((c) => {
      if (c.created_at) {
        const day = c.created_at.split("T")[0];
        if (dailyMap[day]) dailyMap[day].captures += 1;
      }
    });

    (recentViews || []).forEach((v) => {
      if (v.viewed_at) {
        const day = v.viewed_at.split("T")[0];
        if (dailyMap[day]) dailyMap[day].views += 1;
      }
    });

    (usersList || []).forEach((u) => {
      if (u.created_at) {
        const day = u.created_at.split("T")[0];
        if (dailyMap[day]) dailyMap[day].users += 1;
      }
    });

    (workspacesList || []).forEach((w) => {
      if (w.created_at) {
        const day = w.created_at.split("T")[0];
        if (dailyMap[day]) dailyMap[day].workspaces += 1;
      }
    });

    const dailyActivity = Object.values(dailyMap);

    // Compute real top workspaces with real capture counts
    const workspaceCaptureCounts: Record<string, number> = {};
    (recentCaptures || []).forEach((c) => {
      if (c.workspace_id) {
        workspaceCaptureCounts[c.workspace_id] = (workspaceCaptureCounts[c.workspace_id] || 0) + 1;
      }
    });

    const topWorkspaces = (workspacesList || []).map((w) => ({
      id: w.id,
      name: w.name,
      owner_email: w.owner_email || "-",
      capture_count: workspaceCaptureCounts[w.id] || 0,
    }));

    // Compute real plan distribution
    const planCounts: Record<string, number> = { free: 0, pro: 0, team: 0, enterprise: 0 };
    (usersList || []).forEach((u) => {
      const p = (u.plan || "free").toLowerCase();
      if (planCounts[p] !== undefined) {
        planCounts[p] += 1;
      } else {
        planCounts.free += 1;
      }
    });

    // Compute media types breakdown
    const mediaTypes: Record<string, number> = { screenshot: 0, video: 0, other: 0 };
    (recentCaptures || []).forEach((c) => {
      const t = (c.type || "").toLowerCase();
      if (t.includes("video") || t.includes("record")) {
        mediaTypes.video += 1;
      } else if (t.includes("shot") || t.includes("screen") || t.includes("image")) {
        mediaTypes.screenshot += 1;
      } else {
        mediaTypes.other += 1;
      }
    });

    const promoVal = promoSetting?.value as { enabled?: boolean; message?: string } | null;

    // Schema drift & integrity - only run heavy RPCs when explicitly requested by /admin/system
    const { searchParams } = new URL(req.url);
    const includeAudit = searchParams.get("includeAudit") === "true";

    let driftData = null;
    let integrityData = null;
    if (includeAudit) {
      try {
        const [{ data: drift }, { data: integrity }] = await Promise.all([
          serviceClient.rpc("run_schema_drift_check"),
          serviceClient.rpc("run_integrity_audit"),
        ]);
        driftData = drift;
        integrityData = integrity;
      } catch {
        // ignore
      }
    }

    const hasStripeKey = Boolean(process.env.STRIPE_SECRET_KEY);
    const hasGoogleDrive = Boolean(process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
    const hasResend = Boolean(process.env.RESEND_API_KEY);
    const systemPulse = {
      database: "healthy",
      stripe: hasStripeKey ? "configured" : "pending",
      googleDrive: hasGoogleDrive ? "configured" : "pending",
      emailService: hasResend ? "configured" : "pending",
    };

    return NextResponse.json({
      ok: true,
      stats: {
        totalUsers: totalUsers ?? 0,
        totalWorkspaces: totalWorkspaces ?? 0,
        totalCaptures: totalCaptures ?? 0,
        totalViews: totalViews ?? 0,
        totalComments: totalComments ?? 0,
        recentCapturesCount: (recentCaptures || []).length,
        recentViewsCount: (recentViews || []).length,
      },
      dailyActivity,
      planDistribution: planCounts,
      mediaTypes,
      users: (usersList || []).map((u) => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name ?? null,
        plan: u.plan ?? "free",
        created_at: u.created_at,
        suspended: u.suspended ?? false,
      })),
      topWorkspaces,
      needsAttention: {
        openTickets: openTicketsCount || 0,
        hotProspects: hotProspectsCount || 0,
        abandonedCarts: abandonedCartsCount || 0,
      },
      promo: {
        enabled: Boolean(promoVal?.enabled),
        message: String(promoVal?.message || ""),
      },
      systemPulse,
      drift: driftData ?? null,
      integrity: integrityData ?? null,
    });
  } catch (err) {
    console.error("Admin data fetch error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
