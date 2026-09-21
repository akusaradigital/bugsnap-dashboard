-- =====================================================================
-- 20260921130000_production_database_hardening_and_retention.sql
--
-- Production Database Audit Hardening & Retention Automation:
-- 1. Secure comments RLS (prevent data leak of private comments to anon)
-- 2. Drop duplicate RLS policies on comments and workspace_settings
-- 3. Drop duplicate/redundant indexes (idx_comments_capture, idx_bugsnap_api_keys_hash_active)
-- 4. Add supporting indexes on captures(project_id), capture_delete_audit(created_at), and comment_spam_guard(last_post_at)
-- 5. Harden move_capture_to_workspace_folder to support admin/owner workspace members and set pg_temp
-- 6. Add idempotent prune_ephemeral_data() RPC for automated retention cleanup of expired OAuth states, rate limits, spam guard, and old audit logs
-- 7. Ensure security definer functions use search_path = public, pg_temp
-- =====================================================================

-- 1. Deduplicate & Secure Comments RLS
DROP POLICY IF EXISTS "comments read" ON public.comments;
DROP POLICY IF EXISTS "comments_select" ON public.comments;

CREATE POLICY "comments_select" ON public.comments
  FOR SELECT TO public
  USING (
    -- Authenticated member of the workspace owning the capture
    (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.captures c
      JOIN public.workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE c.id = comments.capture_id AND wm.user_id = auth.uid()
    ))
    OR
    -- Capture is public (not restricted to workspace members)
    EXISTS (
      SELECT 1 FROM public.captures c
      WHERE c.id = comments.capture_id
        AND COALESCE(c.access_mode, 'public') <> 'members'
    )
  );

-- 2. Deduplicate workspace_settings SELECT policies
DROP POLICY IF EXISTS "workspace settings members select" ON public.workspace_settings;

-- 3. Drop duplicate / redundant indexes
DROP INDEX IF EXISTS public.idx_comments_capture;
DROP INDEX IF EXISTS public.idx_bugsnap_api_keys_hash_active;

-- 4. Add supporting indexes
CREATE INDEX IF NOT EXISTS captures_project_id_idx
  ON public.captures (project_id)
  WHERE (project_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_capture_delete_audit_created_at
  ON public.capture_delete_audit (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_comment_spam_guard_last_post
  ON public.comment_spam_guard (last_post_at);

-- 5. Enhance move_capture_to_workspace_folder
CREATE OR REPLACE FUNCTION public.move_capture_to_workspace_folder(
  p_capture_id uuid,
  p_target_workspace_id uuid,
  p_target_folder_name text DEFAULT NULL::text
)
RETURNS public.captures
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_capture public.captures%rowtype;
  v_target_folder text := nullif(btrim(coalesce(p_target_folder_name, '')), '');
BEGIN
  SELECT * INTO v_capture
  FROM public.captures
  WHERE id = p_capture_id;

  IF v_capture.id IS NULL THEN
    RAISE EXCEPTION 'Capture not found' USING errcode = 'P0002';
  END IF;

  -- Verify source workspace authorization: workspace owner or member with owner/admin role
  IF NOT EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = v_capture.workspace_id
      AND (
        w.owner_user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.workspace_members wm
          WHERE wm.workspace_id = w.id AND wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')
        )
      )
  ) THEN
    RAISE EXCEPTION 'Permission denied for source workspace' USING errcode = '42501';
  END IF;

  -- Verify target workspace authorization: workspace owner or member with owner/admin role
  IF NOT EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = p_target_workspace_id
      AND (
        w.owner_user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.workspace_members wm
          WHERE wm.workspace_id = w.id AND wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')
        )
      )
  ) THEN
    RAISE EXCEPTION 'Permission denied for target workspace' USING errcode = '42501';
  END IF;

  IF v_target_folder IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.workspace_folders wf
    WHERE wf.workspace_id = p_target_workspace_id AND wf.name = v_target_folder
  ) THEN
    RAISE EXCEPTION 'Target folder not found' USING errcode = 'P0002';
  END IF;

  UPDATE public.captures
  SET workspace_id = p_target_workspace_id,
      folder_name = v_target_folder,
      project_id = NULL
  WHERE id = p_capture_id
  RETURNING * INTO v_capture;

  RETURN v_capture;
END;
$$;

GRANT EXECUTE ON FUNCTION public.move_capture_to_workspace_folder(uuid, uuid, text) TO authenticated;

-- 6. Ephemeral retention cleanup function
CREATE OR REPLACE FUNCTION public.prune_ephemeral_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_oauth_deleted int := 0;
  v_rate_limits_deleted int := 0;
  v_spam_guard_deleted int := 0;
  v_audit_deleted int := 0;
BEGIN
  -- 1. Expired OAuth states (older than expires_at)
  DELETE FROM public.google_drive_oauth_states
  WHERE expires_at < now();
  GET DIAGNOSTICS v_oauth_deleted = ROW_COUNT;

  -- 2. Expired rate limits (reset_at older than 1 hour)
  DELETE FROM public.rate_limits
  WHERE reset_at < now() - interval '1 hour';
  GET DIAGNOSTICS v_rate_limits_deleted = ROW_COUNT;

  -- 3. Stale comment spam guard (older than 1 day)
  DELETE FROM public.comment_spam_guard
  WHERE last_post_at < now() - interval '1 day';
  GET DIAGNOSTICS v_spam_guard_deleted = ROW_COUNT;

  -- 4. Old capture delete audit logs (older than 90 days)
  DELETE FROM public.capture_delete_audit
  WHERE created_at < now() - interval '90 days';
  GET DIAGNOSTICS v_audit_deleted = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'oauth_states_deleted', v_oauth_deleted,
    'rate_limits_deleted', v_rate_limits_deleted,
    'spam_guard_deleted', v_spam_guard_deleted,
    'delete_audit_deleted', v_audit_deleted,
    'timestamp', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.prune_ephemeral_data() TO service_role;

-- 7. Harden search_path on key functions
CREATE OR REPLACE FUNCTION public.prune_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  DELETE FROM public.rate_limits WHERE reset_at < now() - interval '1 hour';
$$;

CREATE OR REPLACE FUNCTION public.prune_admin_logs()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  DELETE FROM public.security_audit_logs  WHERE created_at < now() - interval '90 days';
  DELETE FROM public.extension_error_logs WHERE created_at < now() - interval '30 days';
  DELETE FROM public.support_tickets      WHERE status = 'resolved' AND created_at < now() - interval '180 days';
$$;
