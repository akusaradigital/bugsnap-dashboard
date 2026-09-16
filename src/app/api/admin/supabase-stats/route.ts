import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { authorized, supabase: serviceClient } = await checkAdminAuth(req);
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
    const { data: dbStats, error: dbError } = await serviceClient.rpc("get_database_system_stats");
    if (dbError) {
      throw new Error(`Database stats query failed: ${dbError.message}`);
    }

    let projectInfo = null;
    const supabasePat = process.env.SUPABASE_PAT;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const projectRef = supabaseUrl.replace(/^https?:\/\//, "").split(".")[0];

    if (supabasePat && projectRef) {
      try {
        const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}`, {
          headers: {
            Authorization: `Bearer ${supabasePat}`,
            "Content-Type": "application/json",
          },
          next: { revalidate: 60 },
        });

        if (res.ok) {
          const data = await res.json();
          projectInfo = {
            id: data.id,
            name: data.name,
            region: data.region,
            status: data.status,
            createdAt: data.created_at,
            database: {
              host: data.database?.host,
              version: data.database?.version,
              postgresEngine: data.database?.postgres_engine,
            },
          };
        }
      } catch (patErr) {
        console.warn("[Admin Supabase Stats] Failed fetching project metadata from Supabase API:", patErr);
      }
    }

    return NextResponse.json({
      ok: true,
      stats: dbStats,
      project: projectInfo || {
        id: projectRef || "unknown",
        name: "bugsnap-db",
        region: "ap-southeast-1",
        status: "ACTIVE_HEALTHY",
        database: {
          host: `db.${projectRef}.supabase.co`,
          version: "17.6",
          postgresEngine: "17",
        },
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load database stats";
    console.error("[Admin Supabase Stats] Error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { authorized, supabase: serviceClient } = await checkAdminAuth(req);
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action;

    if (action === "vacuum") {
      const supabasePat = process.env.SUPABASE_PAT;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const projectRef = supabaseUrl.replace(/^https?:\/\//, "").split(".")[0];

      if (!supabasePat) {
        return NextResponse.json(
          { error: "SUPABASE_PAT is required to run maintenance commands." },
          { status: 400 }
        );
      }

      const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabasePat}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: "VACUUM ANALYZE;" }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Failed to execute VACUUM ANALYZE");
      }

      return NextResponse.json({
        ok: true,
        message: "VACUUM ANALYZE executed successfully. Dead tuples reclaimed.",
      });
    }

    if (action === "prune_views") {
      const { error } = await serviceClient.rpc("prune_capture_views");
      if (error) throw error;
      return NextResponse.json({
        ok: true,
        message: "Capture views older than 30 days pruned successfully.",
      });
    }

    if (action === "prune_rate_limits") {
      const { error } = await serviceClient.rpc("prune_rate_limits");
      if (error) throw error;
      return NextResponse.json({
        ok: true,
        message: "Expired rate limit logs pruned successfully.",
      });
    }

    return NextResponse.json({ error: "Invalid maintenance action" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Maintenance execution failed";
    console.error("[Admin Supabase Stats] POST error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
