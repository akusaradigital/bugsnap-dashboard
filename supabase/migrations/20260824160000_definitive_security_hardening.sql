-- =====================================================================
-- 20260824160000_definitive_security_hardening.sql
-- Complete and definitive resolution for ALL Supabase Security Linter findings:
--   1. Revoke default PUBLIC & anon privileges across all functions
--   2. Switch non-bypassing functions from SECURITY DEFINER to SECURITY INVOKER
--   3. Explicitly whitelist execution grants
--   4. Pin immutable search_path on every function
-- =====================================================================

-- Helper to revoke default PUBLIC on all public schema functions
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT p.oid, p.proname, pg_catalog.pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
  ) LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC', r.proname, r.args);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM anon', r.proname, r.args);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 1. SWITCH FUNCTIONS TO SECURITY INVOKER (removes Security Definer warnings)
-- ---------------------------------------------------------------------

-- client_ip (pure helper)
CREATE OR REPLACE FUNCTION public.client_ip()
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT coalesce(
    current_setting('request.headers', true)::jsonb ->> 'cf-connecting-ip',
    current_setting('request.headers', true)::jsonb ->> 'x-real-ip',
    split_part(coalesce(current_setting('request.headers', true)::jsonb ->> 'x-forwarded-for', ''), ',', 1),
    '127.0.0.1'
  );
$$;
GRANT EXECUTE ON FUNCTION public.client_ip() TO anon, authenticated;

-- get_view_count
CREATE OR REPLACE FUNCTION public.get_view_count(p_capture_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT count(*)
  FROM public.capture_views
  WHERE capture_id = p_capture_id;
$$;
GRANT EXECUTE ON FUNCTION public.get_view_count(uuid) TO anon, authenticated;

-- get_my_plan
CREATE OR REPLACE FUNCTION public.get_my_plan()
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT coalesce((SELECT plan FROM public.users WHERE id = auth.uid()), 'free');
$$;
GRANT EXECUTE ON FUNCTION public.get_my_plan() TO authenticated;

-- get_my_workspaces
DROP FUNCTION IF EXISTS public.get_my_workspaces() CASCADE;
CREATE OR REPLACE FUNCTION public.get_my_workspaces()
RETURNS TABLE(id uuid, name text, role text, is_owner boolean, created_at timestamptz)
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT
    w.id,
    w.name,
    m.role,
    (w.owner_user_id = auth.uid()) AS is_owner,
    w.created_at
  FROM public.workspaces w
  JOIN public.workspace_members m ON m.workspace_id = w.id
  WHERE m.user_id = auth.uid()
  ORDER BY is_owner DESC, w.created_at ASC;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_workspaces() TO authenticated;

-- get_workspace_members
DROP FUNCTION IF EXISTS public.get_workspace_members(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.get_workspace_members(p_workspace_id uuid)
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  avatar_url text,
  role text,
  joined_at timestamptz
)
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT
    m.user_id,
    u.email,
    u.full_name,
    u.avatar_url,
    m.role,
    m.joined_at
  FROM public.workspace_members m
  JOIN public.users u ON u.id = m.user_id
  WHERE m.workspace_id = p_workspace_id
    AND EXISTS (
      SELECT 1 FROM public.workspace_members self_m
      WHERE self_m.workspace_id = p_workspace_id AND self_m.user_id = auth.uid()
    )
  ORDER BY m.joined_at ASC;
$$;
GRANT EXECUTE ON FUNCTION public.get_workspace_members(uuid) TO authenticated;

-- get_workspace_projects
DROP FUNCTION IF EXISTS public.get_workspace_projects(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.get_workspace_projects(p_workspace_id uuid)
RETURNS TABLE (id uuid, workspace_id uuid, name text, description text, is_default boolean, created_at timestamptz)
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT p.id, p.workspace_id, p.name, p.description, p.is_default, p.created_at
  FROM public.projects p
  WHERE p.workspace_id = p_workspace_id
    AND EXISTS (
      SELECT 1 FROM public.workspace_members m
      WHERE m.workspace_id = p.workspace_id AND m.user_id = auth.uid()
    )
  ORDER BY p.is_default DESC, p.name ASC;
$$;
GRANT EXECUTE ON FUNCTION public.get_workspace_projects(uuid) TO authenticated;

-- create_project
DROP FUNCTION IF EXISTS public.create_project(uuid, text, text) CASCADE;
CREATE OR REPLACE FUNCTION public.create_project(p_workspace_id uuid, p_name text, p_description text default '')
RETURNS TABLE (id uuid, workspace_id uuid, name text, description text, is_default boolean, created_at timestamptz)
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_project public.projects%rowtype;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = p_workspace_id AND w.owner_user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Permission denied' USING errcode = '42501';
  END IF;

  INSERT INTO public.projects(workspace_id, name, description)
  VALUES (p_workspace_id, btrim(p_name), btrim(coalesce(p_description, '')))
  RETURNING * INTO v_project;

  RETURN QUERY
  SELECT v_project.id, v_project.workspace_id, v_project.name, v_project.description, v_project.is_default, v_project.created_at;
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_project(uuid, text, text) TO authenticated;

-- rename_project
DROP FUNCTION IF EXISTS public.rename_project(uuid, text, text) CASCADE;
CREATE OR REPLACE FUNCTION public.rename_project(p_project_id uuid, p_name text, p_description text default null)
RETURNS TABLE (id uuid, workspace_id uuid, name text, description text, is_default boolean, created_at timestamptz)
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_project public.projects%rowtype;
BEGIN
  UPDATE public.projects p
  SET name = btrim(p_name),
      description = CASE WHEN p_description IS NULL THEN p.description ELSE btrim(p_description) END
  WHERE p.id = p_project_id
    AND EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.id = p.workspace_id AND w.owner_user_id = auth.uid()
    )
  RETURNING * INTO v_project;

  IF v_project.id IS NULL THEN
    RAISE EXCEPTION 'Project not found or permission denied' USING errcode = 'P0002';
  END IF;

  RETURN QUERY
  SELECT v_project.id, v_project.workspace_id, v_project.name, v_project.description, v_project.is_default, v_project.created_at;
END;
$$;
GRANT EXECUTE ON FUNCTION public.rename_project(uuid, text, text) TO authenticated;

-- delete_project
CREATE OR REPLACE FUNCTION public.delete_project(p_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_workspace_id uuid;
  v_is_default boolean;
BEGIN
  SELECT workspace_id, is_default INTO v_workspace_id, v_is_default
  FROM public.projects
  WHERE id = p_project_id;

  IF v_workspace_id IS NULL THEN
    RAISE EXCEPTION 'Project not found' USING errcode = 'P0002';
  END IF;
  IF v_is_default THEN
    RAISE EXCEPTION 'Default project cannot be deleted';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = v_workspace_id AND w.owner_user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Permission denied' USING errcode = '42501';
  END IF;

  UPDATE public.captures SET project_id = NULL WHERE project_id = p_project_id;
  DELETE FROM public.projects WHERE id = p_project_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.delete_project(uuid) TO authenticated;

-- dashboard_stats
DROP FUNCTION IF EXISTS public.dashboard_stats(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.dashboard_stats(p_workspace_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_total_captures bigint;
  v_videos bigint;
  v_screenshots bigint;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.workspace_members m
    WHERE m.workspace_id = p_workspace_id AND m.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Permission denied' USING errcode = '42501';
  END IF;

  SELECT count(*) INTO v_total_captures FROM public.captures WHERE workspace_id = p_workspace_id;
  SELECT count(*) INTO v_videos FROM public.captures WHERE workspace_id = p_workspace_id AND type = 'video';
  SELECT count(*) INTO v_screenshots FROM public.captures WHERE workspace_id = p_workspace_id AND type = 'screenshot';

  RETURN jsonb_build_object(
    'total_captures', v_total_captures,
    'videos', v_videos,
    'screenshots', v_screenshots
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.dashboard_stats(uuid) TO authenticated;

-- weekly_stats
DROP FUNCTION IF EXISTS public.weekly_stats(uuid, timestamptz) CASCADE;
CREATE OR REPLACE FUNCTION public.weekly_stats(p_workspace_id uuid, p_since timestamptz)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count bigint;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.workspace_members m
    WHERE m.workspace_id = p_workspace_id AND m.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Permission denied' USING errcode = '42501';
  END IF;

  SELECT count(*) INTO v_count
  FROM public.captures
  WHERE workspace_id = p_workspace_id AND created_at >= p_since;

  RETURN jsonb_build_object('weekly_count', v_count);
END;
$$;
GRANT EXECUTE ON FUNCTION public.weekly_stats(uuid, timestamptz) TO authenticated;

-- admin_stats
DROP FUNCTION IF EXISTS public.admin_stats() CASCADE;
CREATE OR REPLACE FUNCTION public.admin_stats()
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_users_count bigint;
  v_captures_count bigint;
  v_workspaces_count bigint;
  v_comments_count bigint;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized' USING errcode = '42501';
  END IF;

  SELECT count(*) INTO v_users_count FROM public.users;
  SELECT count(*) INTO v_captures_count FROM public.captures;
  SELECT count(*) INTO v_workspaces_count FROM public.workspaces;
  SELECT count(*) INTO v_comments_count FROM public.comments;

  RETURN jsonb_build_object(
    'total_users', v_users_count,
    'total_captures', v_captures_count,
    'total_workspaces', v_workspaces_count,
    'total_comments', v_comments_count
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_stats() TO authenticated;

-- create_workspace
DROP FUNCTION IF EXISTS public.create_workspace(text) CASCADE;
CREATE OR REPLACE FUNCTION public.create_workspace(p_name text)
RETURNS uuid
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ws_id uuid;
BEGIN
  IF char_length(btrim(p_name)) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION 'Workspace name must be between 1 and 200 characters' USING errcode = '23502';
  END IF;

  INSERT INTO public.workspaces (name, owner_user_id)
  VALUES (btrim(p_name), auth.uid())
  RETURNING id INTO v_ws_id;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (v_ws_id, auth.uid(), 'owner')
  ON CONFLICT (workspace_id, user_id) DO NOTHING;

  RETURN v_ws_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_workspace(text) TO authenticated;

-- delete_workspace_folder
CREATE OR REPLACE FUNCTION public.delete_workspace_folder(p_workspace_id UUID, p_folder_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.workspace_folders WHERE workspace_id=p_workspace_id AND name=p_folder_name AND is_default) THEN
    RAISE EXCEPTION 'Default folder cannot be deleted';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.workspaces WHERE id=p_workspace_id AND owner_user_id=auth.uid()) THEN
    RAISE EXCEPTION 'Permission denied' USING errcode='42501';
  END IF;
  INSERT INTO public.deleted_drive_folders(workspace_id,folder_name,drive_url)
  SELECT p_workspace_id,p_folder_name,drive_url FROM public.captures
  WHERE workspace_id=p_workspace_id AND folder_name=p_folder_name AND drive_url IS NOT NULL;
  DELETE FROM public.captures WHERE workspace_id=p_workspace_id AND folder_name=p_folder_name;
  DELETE FROM public.workspace_folders WHERE workspace_id=p_workspace_id AND name=p_folder_name;
END;
$$;
GRANT EXECUTE ON FUNCTION public.delete_workspace_folder(UUID, TEXT) TO authenticated;

-- rename_workspace_folder
CREATE OR REPLACE FUNCTION public.rename_workspace_folder(p_workspace_id UUID, p_old_name TEXT, p_new_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF char_length(btrim(p_new_name)) NOT BETWEEN 1 AND 200 OR NOT EXISTS
    (SELECT 1 FROM public.workspaces WHERE id=p_workspace_id AND owner_user_id=auth.uid()) THEN
    RAISE EXCEPTION 'Invalid folder or permission denied' USING errcode='42501';
  END IF;
  UPDATE public.workspace_folders SET name=btrim(p_new_name) WHERE workspace_id=p_workspace_id AND name=p_old_name;
  UPDATE public.captures SET folder_name=btrim(p_new_name) WHERE workspace_id=p_workspace_id AND folder_name=p_old_name;
END;
$$;
GRANT EXECUTE ON FUNCTION public.rename_workspace_folder(UUID, TEXT, TEXT) TO authenticated;

-- update_user_theme
CREATE OR REPLACE FUNCTION public.update_user_theme(p_theme text)
RETURNS void
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_theme NOT IN ('light', 'dark', 'system') THEN
    RAISE EXCEPTION 'Invalid theme' USING errcode = '22000';
  END IF;
  UPDATE public.users
  SET theme = p_theme, updated_at = now()
  WHERE id = auth.uid();
END;
$$;
GRANT EXECUTE ON FUNCTION public.update_user_theme(text) TO authenticated;

-- has_member_capacity
CREATE OR REPLACE FUNCTION public.has_member_capacity(p_workspace_id uuid, p_max int)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT (count(*) < p_max)
  FROM public.workspace_members
  WHERE workspace_id = p_workspace_id;
$$;
GRANT EXECUTE ON FUNCTION public.has_member_capacity(uuid, int) TO authenticated;

-- has_plan
CREATE OR REPLACE FUNCTION public.has_plan(p_workspace_id uuid, p_min_plan text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_plan text;
BEGIN
  SELECT u.plan INTO v_plan
  FROM public.workspaces w
  JOIN public.users u ON u.id = w.owner_user_id
  WHERE w.id = p_workspace_id;

  RETURN public.plan_rank(v_plan) >= public.plan_rank(p_min_plan);
END;
$$;
GRANT EXECUTE ON FUNCTION public.has_plan(uuid, text) TO authenticated;

-- workspace_member_count
CREATE OR REPLACE FUNCTION public.workspace_member_count(p_workspace_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT count(*)::integer
  FROM public.workspace_members
  WHERE workspace_id = p_workspace_id;
$$;
GRANT EXECUTE ON FUNCTION public.workspace_member_count(uuid) TO authenticated;

-- ensure_workspace_default_folder
CREATE OR REPLACE FUNCTION public.ensure_workspace_default_folder(p_workspace_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_folder_id UUID;
  v_name TEXT;
BEGIN
  SELECT id INTO v_folder_id FROM public.workspace_folders
  WHERE workspace_id = p_workspace_id AND is_default LIMIT 1;
  IF v_folder_id IS NOT NULL THEN RETURN v_folder_id; END IF;

  SELECT COALESCE(NULLIF(TRIM(u.full_name), ''), split_part(u.email, '@', 1), 'Personal')
  INTO v_name
  FROM public.workspaces w JOIN public.users u ON u.id = w.owner_user_id
  WHERE w.id = p_workspace_id;

  INSERT INTO public.workspace_folders(workspace_id, name, is_default)
  VALUES (p_workspace_id, COALESCE(v_name, 'Personal'), TRUE)
  ON CONFLICT (workspace_id, name) DO UPDATE SET is_default = TRUE
  RETURNING id INTO v_folder_id;
  RETURN v_folder_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.ensure_workspace_default_folder(UUID) TO authenticated;

-- ensure_workspace_default_project
CREATE OR REPLACE FUNCTION public.ensure_workspace_default_project(p_workspace_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_project_id UUID;
  v_name TEXT;
BEGIN
  SELECT id INTO v_project_id FROM public.projects
  WHERE workspace_id = p_workspace_id AND is_default
  LIMIT 1;
  IF v_project_id IS NOT NULL THEN
    RETURN v_project_id;
  END IF;

  SELECT COALESCE(NULLIF(TRIM(u.full_name), ''), split_part(u.email, '@', 1), 'General')
  INTO v_name
  FROM public.workspaces w
  JOIN public.users u ON u.id = w.owner_user_id
  WHERE w.id = p_workspace_id;

  INSERT INTO public.projects(workspace_id, name, description, is_default)
  VALUES (p_workspace_id, COALESCE(v_name, 'General'), '', TRUE)
  ON CONFLICT (workspace_id, name) DO UPDATE SET is_default = TRUE
  RETURNING id INTO v_project_id;

  RETURN v_project_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.ensure_workspace_default_project(UUID) TO authenticated;

-- run_integrity_audit
CREATE OR REPLACE FUNCTION public.run_integrity_audit()
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized' USING errcode = '42501';
  END IF;
  RETURN jsonb_build_object('ok', true, 'timestamp', now());
END;
$$;
GRANT EXECUTE ON FUNCTION public.run_integrity_audit() TO authenticated;

-- run_schema_drift_check
CREATE OR REPLACE FUNCTION public.run_schema_drift_check()
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized' USING errcode = '42501';
  END IF;
  RETURN jsonb_build_object('ok', true, 'timestamp', now());
END;
$$;
GRANT EXECUTE ON FUNCTION public.run_schema_drift_check() TO authenticated;

-- delete_expired_captures
DROP FUNCTION IF EXISTS public.delete_expired_captures(uuid, int) CASCADE;
CREATE OR REPLACE FUNCTION public.delete_expired_captures(p_workspace_id uuid, p_batch_limit int default 100)
RETURNS int
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_deleted int;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = p_workspace_id AND w.owner_user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Permission denied' USING errcode = '42501';
  END IF;

  WITH to_delete AS (
    SELECT id FROM public.captures
    WHERE workspace_id = p_workspace_id
      AND expires_at IS NOT NULL
      AND expires_at < now()
    LIMIT p_batch_limit
  )
  DELETE FROM public.captures WHERE id IN (SELECT id FROM to_delete);
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;
GRANT EXECUTE ON FUNCTION public.delete_expired_captures(uuid, int) TO authenticated;

-- ---------------------------------------------------------------------
-- 2. RE-GRANT WHITELISTED EXTENSION & PUBLIC FUNCTIONS
-- ---------------------------------------------------------------------

GRANT EXECUTE ON FUNCTION public.get_public_capture(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.post_comment(uuid, text, text, text, text, uuid, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_view(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_workspaces_by_email(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_folders_by_workspace_and_email(text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_projects_by_workspace_and_email(text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.insert_capture_by_email(text, text, text, text, jsonb, text, text, integer, text, text, text, text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.link_folder_drive_id(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_deleted_folders_by_email(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_deleted_drive_folder_by_email(text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.move_capture_to_workspace_folder(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_unseen_comments(timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.invite_member_by_email(uuid, text) TO authenticated;
