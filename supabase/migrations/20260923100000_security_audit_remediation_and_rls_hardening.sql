-- Migration: 20260923100000_security_audit_remediation_and_rls_hardening.sql
-- Security Hardening, RLS Authorization Enforcement & Privilege Revocation
-- Remediates DB-01 through DB-08 from Full-System Production Audit

-- 1. Fix workspace_members INSERT IDOR (DB-01)
-- Only workspace owners (or service role) can add members to a workspace.
DROP POLICY IF EXISTS "members owner insert" ON public.workspace_members;
CREATE POLICY "members owner insert" ON public.workspace_members
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_members.workspace_id AND w.owner_user_id = auth.uid()
    )
  );

-- 2. Restrict workspace_settings modification to owners and admins (DB-04)
DROP POLICY IF EXISTS "workspace_settings_upsert" ON public.workspace_settings;
CREATE POLICY "workspace_settings_upsert" ON public.workspace_settings
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspace_settings.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_settings.workspace_id AND w.owner_user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspace_settings.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = workspace_settings.workspace_id AND w.owner_user_id = auth.uid()
    )
  );

-- 3. Hardening captures UPDATE and DELETE RLS policies (DB-04)
DROP POLICY IF EXISTS "captures_update" ON public.captures;
CREATE POLICY "captures_update" ON public.captures
  FOR UPDATE TO authenticated USING (
    (user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = captures.workspace_id AND w.owner_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = captures.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'creator', 'member')
    )
  ) WITH CHECK (
    (user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = captures.workspace_id AND w.owner_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = captures.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin', 'creator', 'member')
    )
  );

DROP POLICY IF EXISTS "captures_delete" ON public.captures;
CREATE POLICY "captures_delete" ON public.captures
  FOR DELETE TO authenticated USING (
    (user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = captures.workspace_id AND w.owner_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = captures.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
  );

-- 4. Secure get_capture_by_drive_id against Info Disclosure (DB-03)
-- Return TABLE(id uuid) instead of SETOF captures to prevent leaking sensitive columns to anon.
DROP FUNCTION IF EXISTS public.get_capture_by_drive_id(text);
CREATE OR REPLACE FUNCTION public.get_capture_by_drive_id(p_drive_id text)
RETURNS TABLE (id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id
  FROM public.captures c
  WHERE c.drive_url IS NOT NULL
    AND p_drive_id IS NOT NULL
    AND position(LOWER(TRIM(p_drive_id)) IN LOWER(c.drive_url)) > 0
    AND (c.expires_at IS NULL OR c.expires_at > now())
    AND c.access_mode != 'members'
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_capture_by_drive_id(text) TO anon, authenticated, service_role;

-- 5. Secure post_comment: enforce access mode, expiry check, link user_id (DB-08)
CREATE OR REPLACE FUNCTION public.post_comment(
  p_capture_id uuid,
  p_visitor_ref text,
  p_body text,
  p_author_name text DEFAULT NULL::text,
  p_author_email text DEFAULT NULL::text,
  p_video_timestamp integer DEFAULT NULL::integer,
  p_parent_id uuid DEFAULT NULL::uuid,
  p_pin_x numeric DEFAULT NULL::numeric,
  p_pin_y numeric DEFAULT NULL::numeric
)
RETURNS comments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_comment public.comments;
  v_workspace_id UUID;
  v_access_mode TEXT;
  v_expires_at TIMESTAMPTZ;
  v_ip TEXT := btrim(split_part(coalesce(current_setting('request.headers', true)::jsonb ->> 'x-forwarded-for', ''), ',', 1));
  v_key TEXT;
  v_count INTEGER;
BEGIN
  -- Body validation
  IF p_body IS NULL OR char_length(btrim(p_body)) NOT BETWEEN 1 AND 5000 THEN
    RAISE EXCEPTION 'Comment body must contain 1 to 5000 characters' USING errcode = '23502';
  END IF;

  -- Video timestamp validation
  IF p_video_timestamp IS NOT NULL AND p_video_timestamp NOT BETWEEN 0 AND 86400 THEN
    RAISE EXCEPTION 'Invalid video timestamp' USING errcode = '22003';
  END IF;

  -- Capture existence and security check
  SELECT c.workspace_id, c.access_mode, c.expires_at
  INTO v_workspace_id, v_access_mode, v_expires_at
  FROM public.captures c WHERE c.id = p_capture_id;

  IF v_workspace_id IS NULL THEN
    RAISE EXCEPTION 'Capture not found' USING errcode = 'P0002';
  END IF;

  IF v_expires_at IS NOT NULL AND v_expires_at <= now() THEN
    RAISE EXCEPTION 'Capture has expired' USING errcode = '42501';
  END IF;

  -- Members-only gate
  IF v_access_mode = 'members' THEN
    IF auth.uid() IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = v_workspace_id AND wm.user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Permission denied: capture is members-only' USING errcode = '42501';
    END IF;
  END IF;

  -- Parent comment validation
  IF p_parent_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.comments WHERE id = p_parent_id AND capture_id = p_capture_id AND parent_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Invalid parent comment' USING errcode = '23503';
  END IF;

  -- Spam guard rate limiting: max 5 comments per 10 minutes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comment_spam_guard') THEN
    v_key := encode(extensions.digest(coalesce(nullif(v_ip, ''), nullif(left(p_visitor_ref, 128), ''), 'unknown'), 'sha256'), 'hex');
    INSERT INTO public.comment_spam_guard(ip, last_post_at, post_count)
    VALUES (v_key, now(), 1)
    ON CONFLICT (ip) DO UPDATE SET
      post_count = CASE WHEN comment_spam_guard.last_post_at > now() - interval '10 minutes'
                        THEN comment_spam_guard.post_count + 1 ELSE 1 END,
      last_post_at = now()
    RETURNING post_count INTO v_count;
    IF v_count > 5 THEN
      RAISE EXCEPTION 'Too many comments. Please wait 10 minutes.' USING errcode = 'P0001';
    END IF;
  END IF;

  -- Insert comment with pin_x, pin_y, and populated user_id
  INSERT INTO public.comments (
    capture_id,
    user_id,
    author_name,
    author_email,
    body,
    video_timestamp,
    parent_id,
    pin_x,
    pin_y,
    created_at
  )
  VALUES (
    p_capture_id,
    auth.uid(),
    left(coalesce(nullif(btrim(p_author_name), ''), 'Visitor'), 200),
    nullif(left(btrim(p_author_email), 320), ''),
    btrim(p_body),
    p_video_timestamp,
    p_parent_id,
    p_pin_x,
    p_pin_y,
    now()
  )
  RETURNING * INTO v_comment;

  RETURN v_comment;
END;
$$;
GRANT EXECUTE ON FUNCTION public.post_comment TO anon, authenticated, service_role;

-- 6. Privilege Revocations (DB-02, DB-05, DB-06)
-- get_database_system_stats is strictly internal for admin API route (service role only)
REVOKE EXECUTE ON FUNCTION public.get_database_system_stats() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_database_system_stats() TO service_role;

-- insert_capture_by_email must only be called via server route verifying Google OAuth token
REVOKE EXECUTE ON FUNCTION public.insert_capture_by_email(text, text, text, text, jsonb, text, text, integer, text, text, text, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.insert_capture_by_email(text, text, text, text, jsonb, text, text, integer, text, text, text, text, uuid) TO service_role;

-- Folder management RPCs must only be called by service_role (via verified Google OAuth route)
REVOKE EXECUTE ON FUNCTION public.delete_workspace_folder_by_email(text, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_workspace_folder_by_email(text, uuid, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.rename_workspace_folder_by_email(text, uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rename_workspace_folder_by_email(text, uuid, text, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.delete_deleted_drive_folder_by_email(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_deleted_drive_folder_by_email(text, uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.insert_folder_by_email(text, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.insert_folder_by_email(text, text, uuid) TO service_role;

-- 7. Add Foreign Key Supporting Indexes (DB-07)
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_capture_delete_audit_user_id ON public.capture_delete_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_google_drive_oauth_states_user_id ON public.google_drive_oauth_states(user_id);
CREATE INDEX IF NOT EXISTS idx_bugsnap_api_keys_created_by ON public.bugsnap_api_keys(created_by);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_invited_by ON public.workspace_invites(invited_by);
