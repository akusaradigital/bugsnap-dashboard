import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { driveAccessToken, trashDriveFile } from "@/lib/google-drive";
import { parseDriveFileId } from "@/lib/google-drive-values";

export const runtime = "nodejs";

// Dev logs are diagnostic scratch, not the artifact the user came for.
const DEV_LOG_TTL_DAYS = 30;

type ExpiredCapture = {
  capture_id: string;
  workspace_id: string;
  owner_user_id: string | null;
  user_id: string | null;
  drive_file_id: string | null;
  drive_url: string | null;
  dev_logs: unknown;
  created_at: string;
};

export async function GET(req: Request) {
  const authorization = req.headers.get("authorization");
  // Fail closed: an unset CRON_SECRET used to leave this destructive route open.
  if (!process.env.CRON_SECRET || authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const cronOperationId = crypto.randomUUID();
  const tokenCache = new Map<string, string | null>();

  async function resolveUserDriveToken(userId: string | null): Promise<string | null> {
    if (!userId) return null;
    if (tokenCache.has(userId)) return tokenCache.get(userId) ?? null;
    try {
      const token = await driveAccessToken(userId);
      tokenCache.set(userId, token);
      return token;
    } catch {
      tokenCache.set(userId, null);
      return null;
    }
  }

  let totalPruned = 0;
  let totalDriveTrashed = 0;
  const errors: string[] = [];

  // 0. Age-based retention for the log tables and the rate-limit table. Both
  // functions existed but nothing ever called them, so the rows only grew.
  // Best-effort: a failure here must not stop the capture cleanup below.
  try {
    await Promise.all([supabase.rpc("prune_admin_logs"), supabase.rpc("prune_rate_limits")]);
  } catch (pruneErr) {
    console.warn("[Cron cleanup] prune RPC failed:", pruneErr);
  }

  // 0b. Dev logs outlive their usefulness long before the capture does: they
  // carry request/response bodies and stack traces, and used to sit around for
  // the full 3-12 month capture retention. Drop them at 30 days; the
  // screenshot/recording itself is untouched.
  let devLogsPurged = 0;
  try {
    const cutoff = new Date(Date.now() - DEV_LOG_TTL_DAYS * 86400_000).toISOString();
    const { data: stale } = await supabase
      .from("captures")
      .select("id, user_id, workspace_id, dev_logs")
      .lt("created_at", cutoff)
      .not("dev_logs", "is", null)
      .limit(200);

    for (const row of stale ?? []) {
      // Trash the Drive-hosted copy too, or the bytes just stay in Drive.
      const logs = (row.dev_logs ?? {}) as Record<string, unknown>;
      const logFileId =
        (typeof logs.driveFileId === "string" ? logs.driveFileId : null) ??
        parseDriveFileId(typeof logs.driveUrl === "string" ? logs.driveUrl : null);
      if (logFileId) {
        const token = await resolveUserDriveToken(row.user_id);
        if (token) {
          try {
            await trashDriveFile(token, logFileId);
          } catch (logErr) {
            console.warn(`[Cron cleanup] Could not trash stale dev_logs ${logFileId}:`, logErr);
          }
        }
      }
      const { error } = await supabase.from("captures").update({ dev_logs: null }).eq("id", row.id);
      if (!error) devLogsPurged++;
    }
  } catch (ttlErr) {
    console.warn("[Cron cleanup] dev_logs TTL sweep failed:", ttlErr);
  }

  try {
    // 1. Fetch candidate expired captures using batch RPC or direct query fallback
    let candidates: ExpiredCapture[] = [];
    const { data: rpcData, error: rpcError } = await supabase.rpc("get_expired_captures_batch", { p_batch_limit: 200 });

    if (!rpcError && Array.isArray(rpcData)) {
      candidates = rpcData as ExpiredCapture[];
    } else {
      // Fallback: Query workspaces with active retention and filter expired captures
      const { data: wsRows } = await supabase
        .from("workspace_settings")
        .select("workspace_id, auto_delete_months, workspaces!inner(owner_user_id)")
        .in("auto_delete_months", [3, 6, 12]);

      const wsList = (wsRows ?? []) as unknown as Array<{
        workspace_id: string;
        auto_delete_months: number;
        workspaces: { owner_user_id: string } | null;
      }>;

      for (const ws of wsList) {
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - ws.auto_delete_months);
        const cutoff = cutoffDate.toISOString();

        const { data: capRows } = await supabase
          .from("captures")
          .select("id, workspace_id, user_id, drive_file_id, drive_url, dev_logs, created_at")
          .eq("workspace_id", ws.workspace_id)
          .lt("created_at", cutoff)
          .order("created_at", { ascending: true })
          .limit(100);

        if (capRows && capRows.length > 0) {
          for (const row of capRows) {
            candidates.push({
              capture_id: row.id,
              workspace_id: row.workspace_id,
              owner_user_id: ws.workspaces?.owner_user_id ?? null,
              user_id: row.user_id,
              drive_file_id: row.drive_file_id,
              drive_url: row.drive_url,
              dev_logs: row.dev_logs,
              created_at: row.created_at,
            });
          }
        }
      }
    }

    if (candidates.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "No expired captures to prune",
        totalPruned: 0,
        totalDriveTrashed: 0,
        devLogsPurged,
      });
    }

    // 2. Process each expired capture: trash Drive file first, then delete database row
    const deletedCaptureIds: string[] = [];

    for (const item of candidates) {
      const fileId = item.drive_file_id ?? parseDriveFileId(item.drive_url);

      // Attempt token from workspace owner, fallback to capture creator
      const token = (await resolveUserDriveToken(item.owner_user_id)) ?? (await resolveUserDriveToken(item.user_id));

      if (token && fileId) {
        try {
          await trashDriveFile(token, fileId);
          totalDriveTrashed++;
        } catch (driveErr) {
          console.warn(`Cron: Could not trash Drive file ${fileId}:`, driveErr);
        }

        // Also trash dev_logs file if stored in Drive
        if (item.dev_logs && typeof item.dev_logs === "object") {
          const logs = item.dev_logs as Record<string, unknown>;
          const devLogId = (typeof logs.driveFileId === "string" ? logs.driveFileId : null) ?? parseDriveFileId(typeof logs.driveUrl === "string" ? logs.driveUrl : null);
          if (devLogId) {
            try {
              await trashDriveFile(token, devLogId);
            } catch (logErr) {
              console.warn(`Cron: Could not trash dev_logs file ${devLogId}:`, logErr);
            }
          }
        }
      }

      // 3. Delete capture from database
      const { error: delError } = await supabase.from("captures").delete().eq("id", item.capture_id);
      if (delError) {
        errors.push(`Failed to delete capture ${item.capture_id}: ${delError.message}`);
      } else {
        deletedCaptureIds.push(item.capture_id);
        totalPruned++;

        // Audit log
        try {
          await supabase.from("capture_delete_audit").insert({
            operation_id: cronOperationId,
            capture_id: item.capture_id,
            workspace_id: item.workspace_id,
            user_id: item.owner_user_id || item.user_id,
            mode: "drive_trash",
            outcome: "deleted",
            drive_file_id: fileId,
          });
        } catch {}
      }
    }

    return NextResponse.json({
      ok: true,
      totalPruned,
      totalDriveTrashed,
      devLogsPurged,
      operationId: cronOperationId,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Cleanup failed";
    console.error("Cron cleanup error:", err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
