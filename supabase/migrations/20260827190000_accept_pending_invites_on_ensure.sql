-- Update ensure_user_and_workspace_by_email to accept pending workspace invites
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
  v_avatar TEXT := 'https://bugsnap.akusaraproject.my.id/icon.svg';
  v_slug TEXT;
BEGIN
  IF v_email_norm IS NULL OR v_email_norm = '' THEN
    RETURN;
  END IF;

  v_name := split_part(v_email_norm, '@', 1);

  -- 1. Check if user already exists in auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE LOWER(TRIM(email)) = v_email_norm
  LIMIT 1;

  -- 2. If not in auth.users, create in auth.users directly
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

  -- 3. Ensure record exists in public.users with avatar
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

  -- 4. Get or create default workspace for this user
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
