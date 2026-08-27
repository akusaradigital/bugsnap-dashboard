-- =====================================================================
-- 20260827120000_auto_create_workspace_on_signup.sql
-- Automatically creates default Personal Workspace and Folder on user signup
-- =====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ws_id UUID;
  v_ws_name TEXT;
BEGIN
  -- 1. Insert into public.users
  INSERT INTO public.users (id, email, full_name, avatar_url, theme, plan)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url',
    'system',
    'free'
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, users.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url);

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
    v_ws_name := COALESCE(
      NULLIF(TRIM(new.raw_user_meta_data ->> 'full_name'), ''),
      NULLIF(TRIM(new.raw_user_meta_data ->> 'name'), ''),
      split_part(new.email, '@', 1),
      'Personal'
    ) || ' Workspace';

    INSERT INTO public.workspaces (name, owner_user_id)
    VALUES (v_ws_name, new.id)
    RETURNING id INTO v_ws_id;

    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (v_ws_id, new.id, 'owner')
    ON CONFLICT (workspace_id, user_id) DO NOTHING;

    INSERT INTO public.workspace_folders (workspace_id, name, is_default)
    VALUES (v_ws_id, 'Personal', TRUE)
    ON CONFLICT (workspace_id, name) DO NOTHING;
  END IF;

  RETURN new;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
