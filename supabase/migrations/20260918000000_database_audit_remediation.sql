-- =====================================================================
-- Migration: 20260918000000_database_audit_remediation.sql
-- Description: Security hardening and schema integrity fixes
--   1. Revoke public/authenticated access to sensitive cron & monitoring RPCs
--   2. Enforce search_path = public, pg_temp across utility SECURITY DEFINER functions
--   3. Secure get_capture_by_drive_id to prevent sensitive column disclosure
--   4. Fix column mapping bug in get_workspaces_by_email (out_user_id, out_workspace_id)
--   5. Restore complete admin log pruning in prune_admin_logs()
--   6. Restrict comments SELECT policy to authorized viewers
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Revoke excessive execution grants from public & authenticated
-- ---------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.get_database_system_stats() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_database_system_stats() TO service_role;

REVOKE ALL ON FUNCTION public.get_expired_captures_batch(int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_expired_captures_batch(int) TO service_role;

REVOKE ALL ON FUNCTION public.auto_prune_all_expired_captures(int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auto_prune_all_expired_captures(int) TO service_role;

REVOKE ALL ON FUNCTION public.prune_expired_captures() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prune_expired_captures() TO service_role;

-- ---------------------------------------------------------------------
-- 2. Enforce SET search_path = public, pg_temp on utility functions
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.client_ip()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT coalesce(
    nullif(current_setting('request.headers', true)::json->>'x-forwarded-for', ''),
    nullif(current_setting('request.headers', true)::json->>'cf-connecting-ip', ''),
    ''
  );
$$;

-- ---------------------------------------------------------------------
-- 3. Secure get_capture_by_drive_id (Prevent information disclosure)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_capture_by_drive_id(p_drive_id TEXT)
RETURNS TABLE (
  id uuid,
  title text,
  access_mode text,
  has_password boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    c.id,
    c.title,
    coalesce(c.access_mode, 'public') as access_mode,
    (c.password IS NOT NULL) as has_password
  FROM public.captures c
  WHERE c.drive_url IS NOT NULL
    AND p_drive_id IS NOT NULL
    AND position(LOWER(TRIM(p_drive_id)) IN LOWER(c.drive_url)) > 0
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_capture_by_drive_id(TEXT) TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- 4. Fix get_workspaces_by_email column reference (out_user_id, out_workspace_id)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_workspaces_by_email(p_email text)
RETURNS TABLE(
  workspace_id uuid,
  workspace_name text,
  workspace_slug text,
  role text,
  is_owner boolean,
  avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_workspace_id uuid;
  v_email_norm text := lower(trim(p_email));
BEGIN
  IF v_email_norm = '' THEN
    RETURN;
  END IF;

  SELECT prov.out_user_id, prov.out_workspace_id INTO v_user_id, v_workspace_id
  FROM public.ensure_user_and_workspace_by_email(v_email_norm) prov;

  RETURN QUERY
  SELECT
    w.id AS workspace_id,
    w.name AS workspace_name,
    w.slug AS workspace_slug,
    'owner'::text AS role,
    true AS is_owner,
    w.avatar_url
  FROM public.workspaces w
  WHERE w.id = v_workspace_id

  UNION ALL

  SELECT
    w.id AS workspace_id,
    w.name AS workspace_name,
    w.slug AS workspace_slug,
    wm.role,
    false AS is_owner,
    w.avatar_url
  FROM public.workspace_members wm
  JOIN public.workspaces w ON w.id = wm.workspace_id
  WHERE wm.user_id = v_user_id
    AND wm.workspace_id <> v_workspace_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_workspaces_by_email(text) TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- 5. Restore complete admin log pruning in prune_admin_logs()
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prune_admin_logs()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  DELETE FROM public.audit_logs           WHERE created_at < now() - interval '30 days';
  DELETE FROM public.rate_limits          WHERE created_at < now() - interval '7 days';
  DELETE FROM public.security_audit_logs  WHERE created_at < now() - interval '90 days';
  DELETE FROM public.extension_error_logs WHERE created_at < now() - interval '30 days';
  DELETE FROM public.support_tickets      WHERE created_at < now() - interval '180 days';
$$;

REVOKE ALL ON FUNCTION public.prune_admin_logs() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prune_admin_logs() TO service_role;

-- ---------------------------------------------------------------------
-- 6. Restrict comments SELECT policy to authorized viewers
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "comments read" ON public.comments;

CREATE POLICY "comments read" ON public.comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.captures c
    WHERE c.id = comments.capture_id
      AND (
        coalesce(c.access_mode, 'public') = 'public'
        OR (
          auth.uid() IS NOT NULL AND (
            EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = c.workspace_id AND w.owner_user_id = auth.uid())
            OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = c.workspace_id AND wm.user_id = auth.uid())
          )
        )
      )
  )
);
