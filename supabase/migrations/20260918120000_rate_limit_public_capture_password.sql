-- =====================================================================
-- 20260918120000_rate_limit_public_capture_password.sql
--
-- Throttle password guesses against share links.
--
-- /v/[id] calls get_public_capture directly from the browser with the anon
-- key (src/app/v/[id]/page.tsx submitPassword), so there is no Route Handler
-- where src/lib/rate-limit.ts could be applied. An attacker could loop the
-- RPC and brute force a share password at full speed.
--
-- The limit therefore lives inside the RPC. get_public_capture is SECURITY
-- DEFINER, so it can call check_rate_limit even though that function is
-- revoked from anon/authenticated.
--
-- Keyed by (capture, client IP) and only counted when a password was actually
-- supplied: an unauthenticated page load passes p_password => null and must
-- never consume budget, or a popular link would lock itself out.
--
-- 10 attempts / 5 min per IP, plus 100 / 5 min per capture as the backstop for a
-- distributed attacker and for callers with no resolvable IP. Fails open on a DB
-- error - the password comparison below is still the enforcement boundary.
-- =====================================================================

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
      v_rec.burn_after_read, v_rec.allowed_domains, v_rec.allowed_ips, 'needs_login'::text, 'members'::text,
      v_rec.workspace_id;
    return;
  end if;

  select count(*) into v_view_count from public.capture_views cv where cv.capture_id = p_id;

  if (v_rec.burn_after_read = true and v_view_count > 0)
     or (v_rec.expires_at is not null and v_rec.expires_at < now()) then
    return query select
      v_rec.id, v_rec.title, v_rec.type, null::text, null::text, v_rec.created_at,
      v_rec.window_size, null::text, null::jsonb, null::text, null::text,
      v_rec.burn_after_read, v_rec.allowed_domains, v_rec.allowed_ips, 'expired'::text, coalesce(v_rec.access_mode, 'public')::text,
      v_rec.workspace_id;
    return;
  end if;

  -- Count only real guesses. The page's own initial load passes null and must
  -- not burn the budget, otherwise a shared link locks out its own viewers.
  --
  -- Two buckets. Per-IP catches the ordinary single-source loop. Per-capture is
  -- the backstop for a distributed one, and is also the only bucket that applies
  -- when client_ip() comes back empty - a shared 'unknown' per-IP bucket would
  -- let one anonymous guesser lock out every other proxy-less viewer at 10.
  --
  -- Fail open: the throttle is defence in depth, the password comparison below is
  -- the real boundary. A wedged rate_limits table must not 500 every viewer out.
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
        v_rec.burn_after_read, v_rec.allowed_domains, v_rec.allowed_ips, 'rate_limited'::text, coalesce(v_rec.access_mode, 'public')::text,
        v_rec.workspace_id;
      return;
    end if;
  end if;

  if v_rec.password is not null and (p_password is null or p_password <> v_rec.password) then
    return query select
      v_rec.id, v_rec.title, v_rec.type, null::text, null::text, v_rec.created_at,
      v_rec.window_size, null::text, null::jsonb, null::text, null::text,
      v_rec.burn_after_read, v_rec.allowed_domains, v_rec.allowed_ips, 'needs_password'::text, coalesce(v_rec.access_mode, 'public')::text,
      v_rec.workspace_id;
    return;
  end if;

  if v_rec.allowed_ips is not null and v_rec.allowed_ips <> '{}' then
    if v_client_ip = '' or not (v_rec.allowed_ips @> array[v_client_ip]) then
      return query select
        v_rec.id, v_rec.title, v_rec.type, null::text, null::text, v_rec.created_at,
        v_rec.window_size, null::text, null::jsonb, null::text, null::text,
        v_rec.burn_after_read, v_rec.allowed_domains, v_rec.allowed_ips, 'unauthorized_ip'::text, coalesce(v_rec.access_mode, 'public')::text,
        v_rec.workspace_id;
      return;
    end if;
  end if;

  if v_rec.allowed_domains is not null and v_rec.allowed_domains <> '{}' then
    if v_client_email = '' or not (v_rec.allowed_domains @> array[v_client_domain]) then
      return query select
        v_rec.id, v_rec.title, v_rec.type, null::text, null::text, v_rec.created_at,
        v_rec.window_size, null::text, null::jsonb, null::text, null::text,
        v_rec.burn_after_read, v_rec.allowed_domains, v_rec.allowed_ips, 'needs_login'::text, coalesce(v_rec.access_mode, 'public')::text,
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

grant execute on function public.get_public_capture(uuid, text) to anon, authenticated;
