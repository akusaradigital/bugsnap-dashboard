import "server-only";

import { createClient } from "@supabase/supabase-js";

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase server credentials are not configured");

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface AuthUserRow {
  id: string;
  email: string;
  plan: string | null;
  suspended: boolean | null;
}

/**
 * Resolve the Bearer-token user server-side (service role → auth.getUser) and
 * fetch their `public.users` row (plan, suspended). Returns null when the token
 * is missing/invalid. Used by gated API routes so plan checks happen on the
 * server, never trust the client.
 */
export async function getAuthenticatedUser(req: Request): Promise<AuthUserRow | null> {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.getUser(token);
  const email = data.user?.email;
  if (error || !data.user || !email) return null;

  const { data: row } = await supabase
    .from("users")
    .select("plan, suspended")
    .ilike("email", email)
    .maybeSingle();

  return {
    id: data.user.id,
    email,
    plan: (row?.plan as string | null) ?? null,
    suspended: row?.suspended ?? false,
  };
}
