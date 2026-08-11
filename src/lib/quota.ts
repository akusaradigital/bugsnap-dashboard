import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { FREE_WEEKLY_CAPTURES, PLAN_FREE, PLAN_PRO, normalizePlan, planAtLeast, type Plan } from "./tiers";

/** Monday 00:00 local server time of the current ISO week. */
export const weekStart = (now: Date = new Date()): Date => {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7; // Mon=0 … Sun=6
  d.setDate(d.getDate() - day);
  return d;
};

export interface WeeklyQuota {
  used: number;
  limit: number; // 0 = unlimited
  remaining: number;
  weekStartISO: string;
  unlimited: boolean;
}

/**
 * Rolling-week capture quota (FREE only). Inserts-only: created_at within the
 * current week, matched on the owner_email bridge key. Edits never count.
 * Lightweight: one indexed COUNT query, no cron, no writes.
 *
 * ponytail: takes a service client so it also runs on the server behind any
 * future insert guard; the dashboard's quota display is the current consumer.
 */
export async function getWeeklyQuota(
  supabase: SupabaseClient,
  email: string,
  plan: Plan = PLAN_FREE
): Promise<WeeklyQuota> {
  const p = normalizePlan(plan);
  const unlimited = planAtLeast(p, PLAN_PRO);
  if (unlimited) {
    return { used: 0, limit: 0, remaining: Infinity, weekStartISO: weekStart().toISOString(), unlimited };
  }

  const start = weekStart();
  // Executed with the service role (bypasses RLS). owner_email is normalized to
  // lowercase at insert time by the RPC, so ilike is a safe bridge lookup.
  const { count, error } = await supabase
    .from("captures")
    .select("id", { count: "exact", head: true })
    .ilike("owner_email", email.trim().toLowerCase())
    .gte("created_at", start.toISOString());

  if (error) {
    console.error("[quota] failed to count weekly captures:", error.message);
    return { used: 0, limit: FREE_WEEKLY_CAPTURES, remaining: FREE_WEEKLY_CAPTURES, weekStartISO: start.toISOString(), unlimited: false };
  }

  const used = count ?? 0;
  const remaining = Math.max(0, FREE_WEEKLY_CAPTURES - used);
  return { used, limit: FREE_WEEKLY_CAPTURES, remaining, weekStartISO: start.toISOString(), unlimited: false };
}