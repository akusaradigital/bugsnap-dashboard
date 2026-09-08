import { createServiceClient } from "@/lib/supabase-server";

export type SecurityEventType =
  | "honeypot_trap"
  | "spam_email"
  | "turnstile_fail"
  | "admin_login_success"
  | "admin_login_failed"
  | "admin_password_change"
  | "admin_action"
  | "rate_limit";

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  title: string;
  detail: string;
  ip?: string;
  created_at: string;
}

export async function logSecurityEvent(event: Omit<SecurityEvent, "id" | "created_at">) {
  try {
    const db = createServiceClient();
    const newEntry: SecurityEvent = {
      id: `sec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      created_at: new Date().toISOString(),
      ...event,
    };
    // Plain insert: the old read-splice-upsert on one app_settings row lost
    // events whenever two fired at once. Retention is prune_admin_logs().
    await db.from("security_audit_logs").insert(newEntry);
  } catch (err) {
    console.warn("[Security Audit] Failed to persist event:", err);
  }
}
