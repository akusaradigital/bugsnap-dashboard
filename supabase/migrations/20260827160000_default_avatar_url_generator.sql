-- =====================================================================
-- 20260827160000_default_avatar_url_generator.sql
-- Sets fallback UI-Avatar for all users so avatar_url is never NULL
-- =====================================================================

-- 1. Helper to generate consistent avatar URL from name/email
CREATE OR REPLACE FUNCTION public.default_avatar_url(p_name text, p_email text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT 'https://ui-avatars.com/api/?name=' ||
         encode(convert_to(COALESCE(NULLIF(TRIM(p_name), ''), split_part(p_email, '@', 1), 'User'), 'UTF-8'), 'escape') ||
         '&background=4f46e5&color=fff&bold=true&size=128';
$$;

-- 2. Update existing NULL avatar_url in public.users
UPDATE public.users
SET avatar_url = public.default_avatar_url(full_name, email)
WHERE avatar_url IS NULL OR avatar_url = '';

-- 3. Update handle_new_user trigger with default avatar fallback
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ws_id UUID;
  v_name TEXT;
  v_avatar TEXT;
  v_slug TEXT;
BEGIN
  v_name := COALESCE(
    NULLIF(TRIM(new.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(TRIM(new.raw_user_meta_data ->> 'name'), ''),
    split_part(new.email, '@', 1)
  );

  v_avatar := COALESCE(
    NULLIF(TRIM(new.raw_user_meta_data ->> 'avatar_url'), ''),
    NULLIF(TRIM(new.raw_user_meta_data ->> 'picture'), ''),
    public.default_avatar_url(v_name, new.email)
  );

  -- 1. Insert into public.users with guaranteed non-null avatar
  INSERT INTO public.users (id, email, full_name, avatar_url, theme, plan)
  VALUES (
    new.id,
    new.email,
    v_name,
    v_avatar,
    'system',
    'free'
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(NULLIF(TRIM(EXCLUDED.full_name), ''), users.full_name),
        avatar_url = COALESCE(NULLIF(TRIM(EXCLUDED.avatar_url), ''), users.avatar_url, v_avatar);

  -- 2. Accept any pending workspace invites for this email
  INSERT INTO public.workspace_members (workspace_id, user_id, role, joined_at)
  SELECT i.workspace_id, new.id, COALESCE(i.role, 'member'), now()
  FROM public.workspace_invites i
  WHERE LOWER(TRIM(i.email)) = LOWER(TRIM(new.email))
    AND i.accepted_at IS NULL
  ON CONFLICT (workspace_id, user_id) DO NOTHING;

  UPDATE public.workspace_invites
  SET accepted_at = now()
  WHERE LOWER(TRIM(email)) = LOWER(TRIM(new.email))
    AND accepted_at IS NULL;

  -- 3. Automatically provision a Default Personal Workspace for this user if none exists
  IF NOT EXISTS (
    SELECT 1 FROM public.workspace_members WHERE user_id = new.id
  ) THEN
    v_slug := lower(regexp_replace(v_name || ' Workspace', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(md5(random()::text), 1, 6);

    INSERT INTO public.workspaces (name, slug, owner_user_id)
    VALUES (v_name || ' Workspace', v_slug, new.id)
    RETURNING id INTO v_ws_id;

    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (v_ws_id, new.id, 'owner')
    ON CONFLICT (workspace_id, user_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$;

-- 4. Update ensure_user_and_workspace_by_email with guaranteed default avatar
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
  v_avatar TEXT;
  v_slug TEXT;
BEGIN
  IF v_email_norm IS NULL OR v_email_norm = '' THEN
    RETURN;
  END IF;

  v_name := split_part(v_email_norm, '@', 1);
  v_avatar := public.default_avatar_url(v_name, v_email_norm);

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
