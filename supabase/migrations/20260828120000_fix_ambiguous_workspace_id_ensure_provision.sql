-- ponytail: RETURNS TABLE(user_id, workspace_id) shadows the real
-- workspace_members.workspace_id/user_id columns inside this function's
-- body, so bare ON CONFLICT (workspace_id, user_id) target lists become
-- ambiguous (42702) once the invite-acceptance INSERT started running
-- unconditionally on every call. Rename the OUT columns so they can never
-- collide with a table column, and update the one live caller.
DROP FUNCTION IF EXISTS public.ensure_user_and_workspace_by_email(TEXT);

CREATE OR REPLACE FUNCTION public.ensure_user_and_workspace_by_email(p_email TEXT)
RETURNS TABLE (out_user_id UUID, out_workspace_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_email_norm TEXT := LOWER(TRIM(p_email));
  v_user_id UUID;
  v_workspace_id UUID;
  v_name TEXT;
  v_avatar TEXT := 'https://bugsnap.akusaraproject.my.id/icon.svg';
  v_slug TEXT;
BEGIN
  IF v_email_norm IS NULL OR v_email_norm = '' THEN
    RETURN;
  END IF;

  v_name := split_part(v_email_norm, '@', 1);

  SELECT id INTO v_user_id
  FROM auth.users
  WHERE LOWER(TRIM(email)) = v_email_norm
  LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

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
      jsonb_build_object('full_name', v_name, 'name', v_name, 'avatar_url', v_avatar),
      false,
      now(),
      now(),
      now(),
      now()
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = v_user_id) THEN
    INSERT INTO public.users (id, email, full_name, avatar_url, plan)
    VALUES (v_user_id, v_email_norm, v_name, v_avatar, 'free')
    ON CONFLICT (id) DO UPDATE
      SET email = EXCLUDED.email,
          avatar_url = COALESCE(NULLIF(TRIM(users.avatar_url), ''), v_avatar);
  ELSE
    UPDATE public.users
    SET avatar_url = v_avatar
    WHERE id = v_user_id AND (avatar_url IS NULL OR avatar_url = '');
  END IF;

  -- Accept pending invites BEFORE checking/creating workspace
  INSERT INTO public.workspace_members (workspace_id, user_id, role, joined_at)
  SELECT i.workspace_id, v_user_id, COALESCE(i.role, 'member'), now()
  FROM public.workspace_invites i
  WHERE LOWER(i.email) = v_email_norm
    AND i.accepted_at IS NULL
  ON CONFLICT (workspace_id, user_id) DO NOTHING;

  UPDATE public.workspace_invites
  SET accepted_at = now()
  WHERE LOWER(email) = v_email_norm
    AND accepted_at IS NULL;

  SELECT w.id INTO v_workspace_id
  FROM public.workspaces w
  JOIN public.workspace_members wm ON wm.workspace_id = w.id
  WHERE wm.user_id = v_user_id
  ORDER BY (wm.role = 'owner') DESC, w.created_at ASC
  LIMIT 1;

  IF v_workspace_id IS NULL THEN
    v_slug := lower(regexp_replace(COALESCE(v_name, 'Personal') || ' Workspace', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(md5(random()::text), 1, 6);

    INSERT INTO public.workspaces (name, slug, owner_user_id)
    VALUES (COALESCE(v_name, 'Personal') || ' Workspace', v_slug, v_user_id)
    RETURNING id INTO v_workspace_id;

    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (v_workspace_id, v_user_id, 'owner')
    ON CONFLICT (workspace_id, user_id) DO NOTHING;
  END IF;

  RETURN QUERY SELECT v_user_id, v_workspace_id;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_user_and_workspace_by_email(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ensure_user_and_workspace_by_email(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.ensure_user_and_workspace_by_email(TEXT) TO authenticated;

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

  SELECT prov.out_user_id, prov.out_workspace_id INTO v_user_id, v_workspace_id
  FROM public.ensure_user_and_workspace_by_email(v_email_norm) prov;

  IF v_user_id IS NULL OR v_workspace_id IS NULL THEN
    RAISE EXCEPTION 'Unable to initialize account for %', v_email_norm USING ERRCODE = 'P0002';
  END IF;

  IF p_workspace_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM public.workspace_members wm
      WHERE wm.workspace_id = p_workspace_id AND wm.user_id = v_user_id
    ) THEN
      v_workspace_id := p_workspace_id;
    END IF;
  END IF;

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
