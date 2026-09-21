-- =====================================================================
-- 20260921120000_redact_ips_domains_in_locked_public_capture.sql
--
-- Security hardening: Redact allowed_ips and allowed_domains on non-ok statuses.
--
-- Previously, when get_public_capture returned 'needs_password', 'needs_login',
-- 'rate_limited', 'unauthorized_ip', or 'expired', it returned the capture's
-- allowed_domains and allowed_ips to unauthenticated callers.
--
-- This allowed arbitrary external viewers to learn internal organization IP
-- addresses and private internal domain names simply by loading a locked link.
--
-- allowed_domains and allowed_ips are now returned as null::text[] on all
-- non-'ok' statuses, and only disclosed once access is granted ('ok').
-- =====================================================================

create or replace function public.get_public_capture(p_id uuid, p_password text)
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
  access_mode text,
  workspace_id uuid
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
  v_rate_limited boolean;
begin
  v_client_ip := public.client_ip();
  v_client_email := coalesce(auth.jwt() ->> 'email', '');
  v_client_domain := split_part(v_client_email, '@', 2);

  -- Explicit column list: avoids TOAST decompression of dev_logs/dom_replay
  -- on every branch that does not need them (not_found, expired, needs_password, etc.)
  select
    c.id, c.title, c.type, c.drive_url, c.site_url, c.created_at, c.window_size,
    c.description, c.dev_logs, c.os, c.browser, c.burn_after_read,
    c.allowed_domains, c.allowed_ips,
    c.password, c.expires_at, c.access_mode, c.duration, c.workspace_id
  into v_rec
  from public.captures c
  where c.id = p_id;

  if v_rec.id is null then
    return query select
      null::uuid, null::text, null::text, null::text, null::text, null::timestamptz,
      null::text, null::text, null::jsonb, null::text, null::text,
      null::boolean, null::text[], null::text[], 'not_found'::text, 'public'::text,
      null::uuid;
    return;
  end if;

  v_is_member := auth.uid() is not null and exists (
    select 1 from public.workspace_members m
    where m.workspace_id = v_rec.workspace_id and m.user_id = (select auth.uid())
  );

  if coalesce(v_rec.access_mode, 'public') = 'members' and not v_is_member then
    return query select
      v_rec.id, v_rec.title, v_rec.type, null::text, null::text, v_rec.created_at,
      v_rec.window_size, null::text, null::jsonb, null::text, null::text,
      v_rec.burn_after_read, null::text[], null::text[], 'needs_login'::text, 'members'::text,
      v_rec.workspace_id;
    return;
  end if;

  select count(*) into v_view_count from public.capture_views cv where cv.capture_id = p_id;

  if (v_rec.burn_after_read = true and v_view_count > 0)
     or (v_rec.expires_at is not null and v_rec.expires_at < now()) then
    return query select
      v_rec.id, v_rec.title, v_rec.type, null::text, null::text, v_rec.created_at,
      v_rec.window_size, null::text, null::jsonb, null::text, null::text,
      v_rec.burn_after_read, null::text[], null::text[], 'expired'::text, coalesce(v_rec.access_mode, 'public')::text,
      v_rec.workspace_id;
    return;
  end if;

  -- Count only real guesses. The page's own initial load passes null and must
  -- not burn the budget, otherwise a shared link locks out its own viewers.
  if v_rec.password is not null and p_password is not null then
    begin
      v_rate_limited := public.check_rate_limit('pubcap:' || p_id::text, 100, 300);
      if not v_rate_limited and v_client_ip <> '' and v_client_ip is not null then
        v_rate_limited := public.check_rate_limit(
          'pubcap:' || p_id::text || ':' || v_client_ip,
          10,
          300
        );
      end if;
    exception when others then
      v_rate_limited := false;
    end;
    if v_rate_limited then
      return query select
        v_rec.id, v_rec.title, v_rec.type, null::text, null::text, v_rec.created_at,
        v_rec.window_size, null::text, null::jsonb, null::text, null::text,
        v_rec.burn_after_read, null::text[], null::text[], 'rate_limited'::text, coalesce(v_rec.access_mode, 'public')::text,
        v_rec.workspace_id;
      return;
    end if;
  end if;

  if v_rec.password is not null and (p_password is null or p_password <> v_rec.password) then
    return query select
      v_rec.id, v_rec.title, v_rec.type, null::text, null::text, v_rec.created_at,
      v_rec.window_size, null::text, null::jsonb, null::text, null::text,
      v_rec.burn_after_read, null::text[], null::text[], 'needs_password'::text, coalesce(v_rec.access_mode, 'public')::text,
      v_rec.workspace_id;
    return;
  end if;

  if v_rec.allowed_ips is not null and v_rec.allowed_ips <> '{}' then
    if v_client_ip = '' or not (v_rec.allowed_ips @> array[v_client_ip]) then
      return query select
        v_rec.id, v_rec.title, v_rec.type, null::text, null::text, v_rec.created_at,
        v_rec.window_size, null::text, null::jsonb, null::text, null::text,
        v_rec.burn_after_read, null::text[], null::text[], 'unauthorized_ip'::text, coalesce(v_rec.access_mode, 'public')::text,
        v_rec.workspace_id;
      return;
    end if;
  end if;

  if v_rec.allowed_domains is not null and v_rec.allowed_domains <> '{}' then
    if v_client_email = '' or not (v_rec.allowed_domains @> array[v_client_domain]) then
      return query select
        v_rec.id, v_rec.title, v_rec.type, null::text, null::text, v_rec.created_at,
        v_rec.window_size, null::text, null::jsonb, null::text, null::text,
        v_rec.burn_after_read, null::text[], null::text[], 'needs_login'::text, coalesce(v_rec.access_mode, 'public')::text,
        v_rec.workspace_id;
      return;
    end if;
  end if;

  insert into public.audit_logs (capture_id, user_id, action, ip, viewer_email)
  values (p_id, auth.uid(), 'view', v_client_ip, nullif(v_client_email, ''));

  return query select
    v_rec.id, v_rec.title, v_rec.type, v_rec.drive_url, v_rec.site_url, v_rec.created_at,
    v_rec.window_size, v_rec.description, v_rec.dev_logs, v_rec.os, v_rec.browser,
    v_rec.burn_after_read, v_rec.allowed_domains, v_rec.allowed_ips, 'ok'::text, coalesce(v_rec.access_mode, 'public')::text,
    v_rec.workspace_id;
end;
$$;
