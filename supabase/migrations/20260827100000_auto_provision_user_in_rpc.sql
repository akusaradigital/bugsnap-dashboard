-- =====================================================================
-- 20260827100000_auto_provision_user_in_rpc.sql
-- Auto-provisions new users and default workspaces in extension bridge RPCs
-- so captures succeed seamlessly even before the user opens the dashboard.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.ensure_user_and_workspace_by_email(p_email TEXT)
RETURNS TABLE (user_id UUID, workspace_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_email_norm TEXT := LOWER(TRIM(p_email));
  v_user_id UUID;
  v_workspace_id UUID;
  v_name TEXT;
BEGIN
  IF v_email_norm IS NULL OR v_email_norm = '' THEN
    RETURN;
  END IF;

  -- 1. Get or create user record
  SELECT u.id INTO v_user_id
  FROM public.users u
  WHERE LOWER(TRIM(u.email)) = v_email_norm
  LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    v_name := split_part(v_email_norm, '@', 1);
    INSERT INTO public.users (id, email, full_name, plan)
    VALUES (v_user_id, v_email_norm, v_name, 'free');
  END IF;

  -- 2. Get or create default workspace
  SELECT w.id INTO v_workspace_id
  FROM public.workspaces w
  JOIN public.workspace_members wm ON wm.workspace_id = w.id
  WHERE wm.user_id = v_user_id
  ORDER BY (wm.role = 'owner') DESC, w.created_at ASC
  LIMIT 1;

  IF v_workspace_id IS NULL THEN
    INSERT INTO public.workspaces (name, owner_user_id)
    VALUES ('Personal Workspace', v_user_id)
    RETURNING id INTO v_workspace_id;

    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (v_workspace_id, v_user_id, 'owner')
    ON CONFLICT (workspace_id, user_id) DO NOTHING;

    INSERT INTO public.workspace_folders (workspace_id, name, is_default)
    VALUES (v_workspace_id, 'Personal', TRUE)
    ON CONFLICT (workspace_id, name) DO NOTHING;
  END IF;

  RETURN QUERY SELECT v_user_id, v_workspace_id;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_user_and_workspace_by_email(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ensure_user_and_workspace_by_email(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.ensure_user_and_workspace_by_email(TEXT) TO authenticated;

-- Update insert_capture_by_email with auto-provisioning
CREATE OR REPLACE FUNCTION public.insert_capture_by_email(
  p_owner_email  TEXT,
  p_title        TEXT    DEFAULT 'Untitled',
  p_type         TEXT    DEFAULT 'screenshot',
  p_drive_url    TEXT    DEFAULT '',
  p_dev_logs     JSONB   DEFAULT '[]'::jsonb,
  p_window_size  TEXT    DEFAULT NULL,
  p_description  TEXT    DEFAULT NULL,
  p_duration     INTEGER DEFAULT NULL,
  p_os           TEXT    DEFAULT NULL,
  p_browser      TEXT    DEFAULT NULL,
  p_site_url     TEXT    DEFAULT NULL,
  p_folder_name  TEXT    DEFAULT NULL,
  p_workspace_id UUID    DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id      UUID;
  v_workspace_id UUID;
  v_capture_id   UUID;
  v_email_norm   TEXT := LOWER(TRIM(p_owner_email));
  v_folder_clean TEXT := NULLIF(TRIM(p_folder_name), '');
BEGIN
  IF v_email_norm IS NULL OR v_email_norm = '' THEN
    RAISE EXCEPTION 'owner_email is required' USING ERRCODE = '23502';
  END IF;

  -- Auto-provision user & workspace if not present
  SELECT prov.user_id, prov.workspace_id INTO v_user_id, v_workspace_id
  FROM public.ensure_user_and_workspace_by_email(v_email_norm) prov;

  IF v_user_id IS NULL OR v_workspace_id IS NULL THEN
    RAISE EXCEPTION 'Unable to resolve or initialize workspace for %', v_email_norm USING ERRCODE = 'P0002';
  END IF;

  -- If explicit workspace_id is provided, verify membership
  IF p_workspace_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM public.workspace_members wm
      WHERE wm.workspace_id = p_workspace_id AND wm.user_id = v_user_id
    ) THEN
      v_workspace_id := p_workspace_id;
    END IF;
  END IF;

  -- If folder_name is provided, ensure folder exists in workspace
  IF v_folder_clean IS NOT NULL AND v_folder_clean <> 'No folder' THEN
    INSERT INTO public.workspace_folders (workspace_id, name, is_default)
    VALUES (v_workspace_id, v_folder_clean, FALSE)
    ON CONFLICT (workspace_id, name) DO NOTHING;
  END IF;

  INSERT INTO public.captures (
    workspace_id, user_id, owner_email, title, type, drive_url, dev_logs, window_size, description, duration, os, browser, site_url, folder_name
  ) VALUES (
    v_workspace_id, v_user_id, v_email_norm,
    COALESCE(NULLIF(TRIM(p_title), ''), 'Untitled'),
    p_type,
    p_drive_url,
    COALESCE(p_dev_logs, '[]'::jsonb),
    p_window_size,
    p_description,
    p_duration,
    p_os,
    p_browser,
    p_site_url,
    v_folder_clean
  )
  RETURNING id INTO v_capture_id;

  RETURN v_capture_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_capture_by_email(TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, UUID) TO anon, authenticated;

-- Update get_workspaces_by_email with auto-provisioning
DROP FUNCTION IF EXISTS public.get_workspaces_by_email(TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.get_workspaces_by_email(p_email TEXT)
RETURNS TABLE(id UUID, name TEXT, role TEXT, is_owner BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_email_norm TEXT := LOWER(TRIM(p_email));
  v_user_id UUID;
  v_workspace_id UUID;
BEGIN
  IF v_email_norm IS NULL OR v_email_norm = '' THEN
    RETURN;
  END IF;

  -- Auto-provision user & workspace if not present
  SELECT prov.user_id, prov.workspace_id INTO v_user_id, v_workspace_id
  FROM public.ensure_user_and_workspace_by_email(v_email_norm) prov;

  RETURN QUERY
  SELECT
    w.id,
    w.name,
    wm.role,
    (wm.role = 'owner') AS is_owner
  FROM public.workspaces w
  JOIN public.workspace_members wm ON wm.workspace_id = w.id
  WHERE wm.user_id = v_user_id
  ORDER BY is_owner DESC, w.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_workspaces_by_email(TEXT) TO anon, authenticated;

-- Update get_folders_by_workspace_and_email with auto-provisioning
DROP FUNCTION IF EXISTS public.get_folders_by_workspace_and_email(TEXT, UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.get_folders_by_workspace_and_email(p_email TEXT, p_workspace_id UUID)
RETURNS TABLE (id UUID, workspace_id UUID, name TEXT, drive_folder_id TEXT, is_default BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_email_norm TEXT := LOWER(TRIM(p_email));
  v_user_id UUID;
  v_ws_id UUID;
BEGIN
  IF v_email_norm IS NULL OR v_email_norm = '' THEN
    RETURN;
  END IF;

  SELECT prov.user_id, prov.workspace_id INTO v_user_id, v_ws_id
  FROM public.ensure_user_and_workspace_by_email(v_email_norm) prov;

  RETURN QUERY
  SELECT wf.id, wf.workspace_id, wf.name, wf.drive_folder_id, wf.is_default
  FROM public.workspace_folders wf
  WHERE wf.workspace_id = p_workspace_id
  ORDER BY wf.is_default DESC, wf.name ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_folders_by_workspace_and_email(TEXT, UUID) TO anon, authenticated;
