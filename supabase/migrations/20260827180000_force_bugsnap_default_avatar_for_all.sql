-- =====================================================================
-- 20260827180000_force_bugsnap_default_avatar_for_all.sql
-- Forces official BugSnap logo as default for all existing and new users.
-- Only changes when manually updated by user in Account Settings.
-- =====================================================================

-- 1. Reset all Google avatars to official BugSnap icon
UPDATE public.users
SET avatar_url = 'https://bugsnap.akusaraproject.my.id/icon.svg'
WHERE avatar_url LIKE '%googleusercontent.com%' OR avatar_url IS NULL OR avatar_url = '';

-- 2. Update handle_new_user trigger so it ignores Google picture and always defaults to BugSnap logo
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ws_id UUID;
  v_name TEXT;
  v_avatar TEXT := 'https://bugsnap.akusaraproject.my.id/icon.svg';
  v_slug TEXT;
BEGIN
  v_name := COALESCE(
    NULLIF(TRIM(new.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(TRIM(new.raw_user_meta_data ->> 'name'), ''),
    split_part(new.email, '@', 1)
  );

  -- 1. Insert into public.users with BugSnap logo as default
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
        avatar_url = COALESCE(NULLIF(TRIM(users.avatar_url), ''), v_avatar);

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
