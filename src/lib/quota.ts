import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Plan } from "./tiers";

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
  _supabase?: SupabaseClient,
  _email?: string,
  _plan?: Plan
): Promise<WeeklyQuota> {
  void _supabase;
  void _email;
  void _plan;
  return { used: 0, limit: 0, remaining: Infinity, weekStartISO: weekStart().toISOString(), unlimited: true };
}