-- =====================================================================
-- 20260827130000_full_auto_provision_auth_user.sql
-- Completely automates user & workspace provisioning in auth.users
-- so extension captures succeed immediately without requiring manual web login first.
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

  -- 1. Check if user already exists in auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE LOWER(TRIM(email)) = v_email_norm
  LIMIT 1;

  -- 2. If not in auth.users, create in auth.users directly
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    v_name := split_part(v_email_norm, '@', 1);

    INSERT INTO auth.users (
      id, instance_id, aud, role, email,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at,
      email_confirmed_at, last_sign_in_at
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      v_email_norm,
      '{"provider":"google","providers":["google"]}'::jsonb,
      jsonb_build_object('full_name', v_name, 'name', v_name),
      false,
      now(),
      now(),
      now(),
      now()
    );
  END IF;

  -- 3. Ensure record exists in public.users
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = v_user_id) THEN
    v_name := split_part(v_email_norm, '@', 1);
    INSERT INTO public.users (id, email, full_name, plan)
    VALUES (v_user_id, v_email_norm, v_name, 'free')
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  END IF;

  -- 4. Get or create default workspace for this user
  SELECT w.id INTO v_workspace_id
  FROM public.workspaces w
  JOIN public.workspace_members wm ON wm.workspace_id = w.id
  WHERE wm.user_id = v_user_id
  ORDER BY (wm.role = 'owner') DESC, w.created_at ASC
  LIMIT 1;

  IF v_workspace_id IS NULL THEN
    v_name := split_part(v_email_norm, '@', 1);
    INSERT INTO public.workspaces (name, owner_user_id)
    VALUES (COALESCE(v_name, 'Personal') || ' Workspace', v_user_id)
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

-- Update insert_capture_by_email to use ensure_user_and_workspace_by_email
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

  -- 1. Automatically ensure user & workspace exists (zero friction)
  SELECT prov.user_id, prov.workspace_id INTO v_user_id, v_workspace_id
  FROM public.ensure_user_and_workspace_by_email(v_email_norm) prov;

  IF v_user_id IS NULL OR v_workspace_id IS NULL THEN
    RAISE EXCEPTION 'Unable to initialize account for %', v_email_norm USING ERRCODE = 'P0002';
  END IF;

  -- 2. If explicit workspace_id is provided, verify membership
  IF p_workspace_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM public.workspace_members wm
      WHERE wm.workspace_id = p_workspace_id AND wm.user_id = v_user_id
    ) THEN
      v_workspace_id := p_workspace_id;
    END IF;
  END IF;

  -- 3. If folder_name is provided and not default, ensure folder exists
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
