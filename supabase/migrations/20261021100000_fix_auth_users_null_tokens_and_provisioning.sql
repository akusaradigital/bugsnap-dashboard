-- =====================================================================
-- 20261021100000_fix_auth_users_null_tokens_and_provisioning.sql
-- Fix GoTrue scan error on auth.users (confirmation_token converting NULL to string is unsupported)
-- 1. Backfill all existing auth.users rows where token columns are NULL to empty string ''.
-- 2. Update ensure_user_and_workspace_by_email() to always supply empty strings for token columns
--    when auto-provisioning new auth.users rows.
-- =====================================================================

-- 1. Backfill existing auth.users records
UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  reauthentication_token = COALESCE(reauthentication_token, '')
WHERE
  confirmation_token IS NULL
  OR recovery_token IS NULL
  OR email_change_token_new IS NULL
  OR email_change IS NULL
  OR phone_change IS NULL
  OR phone_change_token IS NULL
  OR email_change_token_current IS NULL
  OR reauthentication_token IS NULL;

-- 2. Update ensure_user_and_workspace_by_email function with explicit empty string tokens
CREATE OR REPLACE FUNCTION public.ensure_user_and_workspace_by_email(p_email text)
RETURNS TABLE(out_user_id uuid, out_workspace_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
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
      email_confirmed_at, last_sign_in_at,
      confirmation_token, recovery_token,
      email_change_token_new, email_change,
      phone_change, phone_change_token,
      email_change_token_current, reauthentication_token
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
      now(),
      '', '', '', '',
      '', '', '', ''
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
$function$;
