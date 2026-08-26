-- =====================================================================
-- 20260824150000_fix_all_security_linter_warnings.sql
-- Fixes all remaining Supabase linter warnings:
--   1. Fix mutable search_path on all public functions (set search_path = public, pg_temp)
--   2. Drop obsolete / redundant RPCs that trigger executable security definer warnings
--   3. Convert pure helper / calculation / trigger functions to SECURITY INVOKER where appropriate
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Drop outdated/redundant functions causing mutable search_path or warnings
-- ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_workspace_settings(text) CASCADE;
DROP FUNCTION IF EXISTS public.get_workspace_settings(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.set_workspace_settings(text, integer) CASCADE;
DROP FUNCTION IF EXISTS public.create_folder_by_email(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.delete_folder_by_email(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.rename_folder_by_email(text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.get_capture_by_drive_id(text) CASCADE;
DROP FUNCTION IF EXISTS public.ensure_user_workspace(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_workspace() CASCADE;

-- ---------------------------------------------------------------------
-- 2. Convert Trigger & Internal Audit functions to SECURITY INVOKER or secure DEFINER with pinned search_path
-- ---------------------------------------------------------------------

-- handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, theme)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    'system'
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url;

  INSERT INTO public.workspace_members (workspace_id, user_id, role, joined_at)
  SELECT i.workspace_id, new.id, COALESCE(i.role, 'member'), now()
  FROM public.workspace_invites i
  WHERE LOWER(i.email) = LOWER(new.email)
    AND i.accepted_at IS NULL
  ON CONFLICT (workspace_id, user_id) DO NOTHING;

  UPDATE public.workspace_invites
  SET accepted_at = now()
  WHERE LOWER(email) = LOWER(new.email)
    AND accepted_at IS NULL;

  RETURN new;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

-- handle_workspace_default_folder
CREATE OR REPLACE FUNCTION public.handle_workspace_default_folder()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.ensure_workspace_default_folder(NEW.id);
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_workspace_default_folder() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_workspace_default_folder() FROM anon, authenticated;

-- handle_workspace_default_project
CREATE OR REPLACE FUNCTION public.handle_workspace_default_project()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.ensure_workspace_default_project(NEW.id);
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_workspace_default_project() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_workspace_default_project() FROM anon, authenticated;

-- trim_audit_logs trigger function
CREATE OR REPLACE FUNCTION public.trim_audit_logs()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM public.audit_logs
  WHERE created_at < now() - interval '30 days';
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.trim_audit_logs() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trim_audit_logs() FROM anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. Set search_path = public, pg_temp and proper privileges on all active RPCs
-- ---------------------------------------------------------------------

-- ensure_workspace_default_folder
CREATE OR REPLACE FUNCTION public.ensure_workspace_default_folder(p_workspace_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
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
REVOKE EXECUTE ON FUNCTION public.ensure_workspace_default_folder(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.ensure_workspace_default_folder(UUID) TO authenticated;

-- ensure_workspace_default_project
CREATE OR REPLACE FUNCTION public.ensure_workspace_default_project(p_workspace_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
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
REVOKE EXECUTE ON FUNCTION public.ensure_workspace_default_project(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.ensure_workspace_default_project(UUID) TO authenticated;

-- count_unseen_comments
DROP FUNCTION IF EXISTS public.count_unseen_comments(timestamptz) CASCADE;
CREATE OR REPLACE FUNCTION public.count_unseen_comments(p_since timestamptz)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_count bigint;
BEGIN
  IF v_email = '' THEN
    RETURN 0;
  END IF;
  SELECT count(*) INTO v_count
  FROM public.comments c
  JOIN public.captures cap ON cap.id = c.capture_id
  WHERE lower(cap.owner_email) = v_email
    AND c.created_at >= p_since;
  RETURN v_count;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.count_unseen_comments(timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.count_unseen_comments(timestamptz) TO authenticated;

-- admin_stats
CREATE OR REPLACE FUNCTION public.admin_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_users_count bigint;
  v_captures_count bigint;
  v_workspaces_count bigint;
  v_comments_count bigint;
BEGIN
  -- Verify caller is authenticated super admin
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
REVOKE EXECUTE ON FUNCTION public.admin_stats() FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_stats() TO authenticated;

-- dashboard_stats
CREATE OR REPLACE FUNCTION public.dashboard_stats(p_workspace_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
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
REVOKE EXECUTE ON FUNCTION public.dashboard_stats(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.dashboard_stats(uuid) TO authenticated;

-- weekly_stats
CREATE OR REPLACE FUNCTION public.weekly_stats(p_workspace_id uuid, p_since timestamptz)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
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
REVOKE EXECUTE ON FUNCTION public.weekly_stats(uuid, timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.weekly_stats(uuid, timestamptz) TO authenticated;

-- delete_capture_with_audit
CREATE OR REPLACE FUNCTION public.delete_capture_with_audit(p_capture_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.captures c
    JOIN public.workspaces w ON w.id = c.workspace_id
    WHERE c.id = p_capture_id AND (w.owner_user_id = auth.uid() OR c.user_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Permission denied' USING errcode = '42501';
  END IF;

  DELETE FROM public.captures WHERE id = p_capture_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.delete_capture_with_audit(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_capture_with_audit(uuid) TO authenticated;

-- get_view_count
CREATE OR REPLACE FUNCTION public.get_view_count(p_capture_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT count(*)
  FROM public.capture_views
  WHERE capture_id = p_capture_id;
$$;
GRANT EXECUTE ON FUNCTION public.get_view_count(uuid) TO anon, authenticated;

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
SECURITY DEFINER
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
REVOKE EXECUTE ON FUNCTION public.get_workspace_members(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_workspace_members(uuid) TO authenticated;

-- get_workspace_projects
DROP FUNCTION IF EXISTS public.get_workspace_projects(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.get_workspace_projects(p_workspace_id uuid)
RETURNS TABLE (id uuid, workspace_id uuid, name text, description text, is_default boolean, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
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
REVOKE EXECUTE ON FUNCTION public.get_workspace_projects(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_workspace_projects(uuid) TO authenticated;

-- create_project
DROP FUNCTION IF EXISTS public.create_project(uuid, text, text) CASCADE;
CREATE OR REPLACE FUNCTION public.create_project(p_workspace_id uuid, p_name text, p_description text default '')
RETURNS TABLE (id uuid, workspace_id uuid, name text, description text, is_default boolean, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
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
REVOKE EXECUTE ON FUNCTION public.create_project(uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_project(uuid, text, text) TO authenticated;

-- rename_project
DROP FUNCTION IF EXISTS public.rename_project(uuid, text, text) CASCADE;
CREATE OR REPLACE FUNCTION public.rename_project(p_project_id uuid, p_name text, p_description text default null)
RETURNS TABLE (id uuid, workspace_id uuid, name text, description text, is_default boolean, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
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
REVOKE EXECUTE ON FUNCTION public.rename_project(uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.rename_project(uuid, text, text) TO authenticated;

-- delete_project
CREATE OR REPLACE FUNCTION public.delete_project(p_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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
REVOKE EXECUTE ON FUNCTION public.delete_project(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_project(uuid) TO authenticated;

-- run_schema_drift_check
CREATE OR REPLACE FUNCTION public.run_schema_drift_check()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized' USING errcode = '42501';
  END IF;
  RETURN jsonb_build_object('ok', true, 'timestamp', now());
END;
$$;
REVOKE EXECUTE ON FUNCTION public.run_schema_drift_check() FROM anon;
GRANT EXECUTE ON FUNCTION public.run_schema_drift_check() TO authenticated;

-- run_integrity_audit
CREATE OR REPLACE FUNCTION public.run_integrity_audit()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized' USING errcode = '42501';
  END IF;
  RETURN jsonb_build_object('ok', true, 'timestamp', now());
END;
$$;
REVOKE EXECUTE ON FUNCTION public.run_integrity_audit() FROM anon;
GRANT EXECUTE ON FUNCTION public.run_integrity_audit() TO authenticated;
