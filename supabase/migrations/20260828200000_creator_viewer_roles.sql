-- Invite role picker: Creator (can create + comment) vs Viewer (view + comment only).
-- Viewer is enforced server-side in insert_capture_by_email and the web upload route,
-- since both bypass RLS via the service-role client.

drop function if exists public.invite_member_by_email(uuid, text) cascade;
create or replace function public.invite_member_by_email(p_workspace_id uuid, p_email text, p_role text default 'creator')
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_email text := lower(btrim(p_email));
  v_role text := lower(btrim(coalesce(p_role, 'creator')));
begin
  if v_email = '' then
    raise exception 'Email is required';
  end if;

  if v_role not in ('creator', 'viewer') then
    raise exception 'Invalid role';
  end if;

  if not exists (
    select 1 from public.workspaces w
    where w.id = p_workspace_id and w.owner_user_id = auth.uid()
  ) then
    raise exception 'You are not the owner of this workspace';
  end if;

  select id into v_user_id from auth.users where lower(email) = v_email;

  if v_user_id is null then
    insert into public.workspace_invites (workspace_id, email, role, invited_by, created_at)
    values (p_workspace_id, v_email, v_role, auth.uid(), now())
    on conflict (workspace_id, lower(email)) do update
      set invited_by = excluded.invited_by,
          role = excluded.role,
          created_at = now(),
          accepted_at = null;
    return 'pending';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role, joined_at)
  values (p_workspace_id, v_user_id, v_role, now())
  on conflict (workspace_id, user_id) do update set role = excluded.role;

  update public.workspace_invites
  set accepted_at = now()
  where workspace_id = p_workspace_id and lower(email) = v_email and accepted_at is null;

  return 'added';
end;
$$;

grant execute on function public.invite_member_by_email(uuid, text, text) to authenticated;

-- Viewers cannot create captures (extension + service-role capture insert path).
create or replace function public.insert_capture_by_email(
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
  v_role         TEXT;
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

  SELECT role INTO v_role FROM public.workspace_members WHERE workspace_id = v_workspace_id AND user_id = v_user_id;
  IF v_role = 'viewer' THEN
    RAISE EXCEPTION 'Viewers cannot create captures' USING ERRCODE = '42501';
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
