-- Members-only share links for captures.
-- HOW TO APPLY: paste in Supabase SQL Editor and Run. Re-runnable.

alter table public.captures
  add column if not exists access_mode text not null default 'public';

alter table public.captures
  drop constraint if exists captures_access_mode_check;

alter table public.captures
  add constraint captures_access_mode_check
  check (access_mode in ('public', 'members'));

drop function if exists public.get_public_capture(uuid, text);

create function public.get_public_capture(p_id uuid, p_password text)
returns table (
  id uuid,
  title text,
  type text,
  drive_url text,
  site_url text,
  created_at timestamptz,
  window_size text,
  description text,
  dev_logs jsonb,
  os text,
  browser text,
  burn_after_read boolean,
  allowed_domains text[],
  allowed_ips text[],
  status text,
  access_mode text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_client_ip text;
  v_client_email text;
  v_client_domain text;
  v_view_count bigint;
  v_rec record;
  v_is_member boolean;
begin
  v_client_ip := public.client_ip();
  v_client_email := coalesce(auth.jwt() ->> 'email', '');
  v_client_domain := split_part(v_client_email, '@', 2);

  select * into v_rec from public.captures c where c.id = p_id;

  if v_rec.id is null then
    return query select
      null::uuid, null::text, null::text, null::text, null::text, null::timestamptz,
      null::text, null::text, null::jsonb, null::text, null::text,
      null::boolean, null::text[], null::text[], 'not_found'::text, 'public'::text;
    return;
  end if;

  v_is_member := auth.uid() is not null and exists (
    select 1 from public.workspace_members m
    where m.workspace_id = v_rec.workspace_id and m.user_id = auth.uid()
  );

  if coalesce(v_rec.access_mode, 'public') = 'members' and not v_is_member then
    return query select
      v_rec.id, v_rec.title, v_rec.type, null::text, v_rec.site_url, v_rec.created_at,
      v_rec.window_size, v_rec.description, null::jsonb, v_rec.os, v_rec.browser,
      v_rec.burn_after_read, v_rec.allowed_domains, v_rec.allowed_ips, 'needs_login'::text, 'members'::text;
    return;
  end if;

  select count(*) into v_view_count from public.capture_views cv where cv.capture_id = p_id;

  if v_rec.burn_after_read = true and v_view_count > 0 then
    return query select
      v_rec.id, v_rec.title, v_rec.type, null::text, v_rec.site_url, v_rec.created_at,
      v_rec.window_size, v_rec.description, null::jsonb, v_rec.os, v_rec.browser,
      v_rec.burn_after_read, v_rec.allowed_domains, v_rec.allowed_ips, 'expired'::text, coalesce(v_rec.access_mode, 'public')::text;
    return;
  end if;

  if v_rec.password is not null and (p_password is null or p_password <> v_rec.password) then
    return query select
      v_rec.id, v_rec.title, v_rec.type, null::text, v_rec.site_url, v_rec.created_at,
      v_rec.window_size, v_rec.description, null::jsonb, v_rec.os, v_rec.browser,
      v_rec.burn_after_read, v_rec.allowed_domains, v_rec.allowed_ips, 'needs_password'::text, coalesce(v_rec.access_mode, 'public')::text;
    return;
  end if;

  if v_rec.allowed_ips is not null and v_rec.allowed_ips <> '{}' then
    if v_client_ip = '' or not (v_rec.allowed_ips @> array[v_client_ip]) then
      return query select
        v_rec.id, v_rec.title, v_rec.type, null::text, v_rec.site_url, v_rec.created_at,
        v_rec.window_size, v_rec.description, null::jsonb, v_rec.os, v_rec.browser,
        v_rec.burn_after_read, v_rec.allowed_domains, v_rec.allowed_ips, 'unauthorized_ip'::text, coalesce(v_rec.access_mode, 'public')::text;
      return;
    end if;
  end if;

  if v_rec.allowed_domains is not null and v_rec.allowed_domains <> '{}' then
    if v_client_email = '' or not (v_rec.allowed_domains @> array[v_client_domain]) then
      return query select
        v_rec.id, v_rec.title, v_rec.type, null::text, v_rec.site_url, v_rec.created_at,
        v_rec.window_size, v_rec.description, null::jsonb, v_rec.os, v_rec.browser,
        v_rec.burn_after_read, v_rec.allowed_domains, v_rec.allowed_ips, 'needs_login'::text, coalesce(v_rec.access_mode, 'public')::text;
      return;
    end if;
  end if;

  insert into public.audit_logs (capture_id, user_id, action, ip, viewer_email)
  values (p_id, auth.uid(), 'view', v_client_ip, nullif(v_client_email, ''));

  return query select
    v_rec.id, v_rec.title, v_rec.type, v_rec.drive_url, v_rec.site_url, v_rec.created_at,
    v_rec.window_size, v_rec.description, v_rec.dev_logs, v_rec.os, v_rec.browser,
    v_rec.burn_after_read, v_rec.allowed_domains, v_rec.allowed_ips, 'ok'::text, coalesce(v_rec.access_mode, 'public')::text;
end;
$$;

grant execute on function public.get_public_capture(uuid, text) to anon, authenticated;
