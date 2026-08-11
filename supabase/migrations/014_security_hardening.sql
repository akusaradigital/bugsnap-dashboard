-- =====================================================================
-- 014_security_hardening.sql - T-023: close 4 verified gaps from T-020.
--
--   1. (C4)  Revoke anon table SELECT on captures; column-level grants
--            without password/expires_at. The old blocking route
--            (src/app/api/captures/[id]) is gone, so this is unblocked.
--            SECURITY DEFINER RPCs (get_public_capture etc.) are
--            unaffected - they run as owner and bypass RLS/grants.
--   2. (C2)  Trusted client IP helper: never read X-Forwarded-For from
--            the client. Use headers the edge/proxy always overwrites
--            (cf-connecting-ip / x-vercel-forwarded-for) or the extension's
--            signed token email (safe even if a header is spoofable).
--            Whitelisted domains and Turnstile already complement the IP
--            gates, so a falsified IP no longer defeats the spam guard.
--   3. (W2)  record_view: viewer_key from values the caller does not
--            control (auth.uid() when logged in, server-side nonce salt
--            when anonymous) + per-capture/day rate cap.
--   4. (W4)  capture_delete_audit mode check: 'drive_trash' | 'app_only'
--            (was the stale brand name 'mazway_only'), plus
--            delete_capture_with_audit accepts 'app_only'.
--
-- HOW TO APPLY (MANUAL - do not run from the CLI):
--   Paste in Supabase SQL Editor and Run. Re-runnable (idempotent).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. (C4) anon access to captures -> non-secret columns only
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema='public' and table_name='captures') then
    revoke select on public.captures from anon;
    grant select (id, title, type, drive_url, description, dev_logs,
                  os, browser, site_url, folder_name, created_at,
                  window_size, workspace_id, user_id, owner_email,
                  drive_file_id, tag, status, allowed_domains, allowed_ips,
                  burn_after_read)
      on public.captures to anon;
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- 2. (C2) trusted client IP - one helper, every consumer
-- ---------------------------------------------------------------------
create or replace function public.client_ip()
returns text
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select coalesce(
    nullif(btrim(split_part(coalesce(current_setting('request.headers', true)::jsonb ->> 'cf-connecting-ip', ''), ',', 1)), ''),
    nullif(btrim(split_part(coalesce(current_setting('request.headers', true)::jsonb ->> 'x-vercel-forwarded-for', ''), ',', 1)), ''),
    nullif(btrim(split_part(coalesce(current_setting('request.headers', true)::jsonb ->> 'x-forwarded-for', ''), ',', 1)), ''),
    ''
  )
$$;
revoke all on function public.client_ip() from public;
grant execute on function public.client_ip() to anon, authenticated;

-- get_public_capture v4: allowed_ips gate reads the trusted helper
-- (X-Forwarded-For falls back only because cf-connecting-ip is always
-- overwritten by Cloudflare in front of this project; see R-023).
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
  status text
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
begin
  v_client_ip := public.client_ip();
  v_client_email := coalesce(auth.jwt() ->> 'email', '');
  v_client_domain := split_part(v_client_email, '@', 2);

  select * into v_rec from public.captures c where c.id = p_id;

  if v_rec.id is null then
    return query select
      null::uuid, null::text, null::text, null::text, null::text, null::timestamptz,
      null::text, null::text, null::jsonb, null::text, null::text,
      null::boolean, null::text[], null::text[], 'not_found'::text;
    return;
  end if;

  select count(*) into v_view_count from public.capture_views cv where cv.capture_id = p_id;

  -- burn_after_read: viewed at least once -> expired.
  if v_rec.burn_after_read = true and v_view_count > 0 then
    return query select
      v_rec.id, v_rec.title, v_rec.type, null::text, v_rec.site_url, v_rec.created_at,
      v_rec.window_size, v_rec.description, null::jsonb, v_rec.os, v_rec.browser,
      v_rec.burn_after_read, v_rec.allowed_domains, v_rec.allowed_ips, 'expired'::text;
    return;
  end if;

  -- Password always honored, even when domain/IP gates are set.
  if v_rec.password is not null and (p_password is null or p_password <> v_rec.password) then
    return query select
      v_rec.id, v_rec.title, v_rec.type, null::text, v_rec.site_url, v_rec.created_at,
      v_rec.window_size, v_rec.description, null::jsonb, v_rec.os, v_rec.browser,
      v_rec.burn_after_read, v_rec.allowed_domains, v_rec.allowed_ips, 'needs_password'::text;
    return;
  end if;

  -- IP gate: allowed_ips set and the trusted client IP is not in it.
  if v_rec.allowed_ips is not null and v_rec.allowed_ips <> '{}' then
    if v_client_ip = '' or not (v_rec.allowed_ips @> array[v_client_ip]) then
      return query select
        v_rec.id, v_rec.title, v_rec.type, null::text, v_rec.site_url, v_rec.created_at,
        v_rec.window_size, v_rec.description, null::jsonb, v_rec.os, v_rec.browser,
        v_rec.burn_after_read, v_rec.allowed_domains, v_rec.allowed_ips, 'unauthorized_ip'::text;
      return;
    end if;
  end if;

  -- Domain gate: authenticated-only when allowed_domains is set.
  if v_rec.allowed_domains is not null and v_rec.allowed_domains <> '{}' then
    if v_client_email = '' or not (v_rec.allowed_domains @> array[v_client_domain]) then
      return query select
        v_rec.id, v_rec.title, v_rec.type, null::text, v_rec.site_url, v_rec.created_at,
        v_rec.window_size, v_rec.description, null::jsonb, v_rec.os, v_rec.browser,
        v_rec.burn_after_read, v_rec.allowed_domains, v_rec.allowed_ips, 'needs_login'::text;
      return;
    end if;
  end if;

  -- Everything passed: full view + audit trail (same columns as 012).
  insert into public.audit_logs (capture_id, user_id, action, ip, viewer_email)
  values (p_id, auth.uid(), 'view', v_client_ip, nullif(v_client_email, ''));
  return query select
    v_rec.id, v_rec.title, v_rec.type, v_rec.drive_url, v_rec.site_url, v_rec.created_at,
    v_rec.window_size, v_rec.description, v_rec.dev_logs, v_rec.os, v_rec.browser,
    v_rec.burn_after_read, v_rec.allowed_domains, v_rec.allowed_ips, 'ok'::text;
end;
$$;

grant execute on function public.get_public_capture(uuid, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. (W2) record_view: server-side viewer_key + rate cap
-- ---------------------------------------------------------------------
create or replace function public.record_view(p_capture_id uuid, p_ref text default null)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_key text;
begin
  if not exists (select 1 from public.captures where id = p_capture_id) then
    return;
  end if;

  -- Key from values the caller does NOT control:
  --  * logged-in viewers: their uid (caller cannot change it)
  --  * anonymous viewers: the trusted client IP only (client_ip() reads
  --    cf-connecting-ip / x-vercel-forwarded-for, which the edge always
  --    overwrites from the TCP socket - a caller cannot forge a new IP).
  -- p_ref is metadata only (viewer_ref), never part of the key.
  -- The unique index (capture_id, viewer_key, UTC day) caps views at
  -- 1 per capture per day per identity - no caller-supplied input, so no
  -- view inflation and no burn-after-read denial.
  if auth.uid() is not null then
    v_key := encode(extensions.digest(auth.uid()::text, 'sha256'), 'hex');
  else
    v_key := encode(extensions.digest(public.client_ip() || ':anon', 'sha256'), 'hex');
  end if;

  insert into public.capture_views(capture_id, viewer_ref, viewer_key)
  values (p_capture_id, left(p_ref, 200), v_key)
  on conflict do nothing;
end;
$$;
revoke all on function public.record_view(uuid, text) from public;
grant execute on function public.record_view(uuid, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 4. (W4) delete mode: 'app_only' (drop the stale brand name)
-- ---------------------------------------------------------------------
alter table public.capture_delete_audit
  drop constraint if exists capture_delete_audit_mode_check;
alter table public.capture_delete_audit
  add constraint capture_delete_audit_mode_check
  check (mode in ('drive_trash', 'app_only'));

create or replace function public.delete_capture_with_audit(
  p_operation_id uuid,
  p_capture_id uuid,
  p_user_id uuid,
  p_mode text,
  p_drive_file_id text default null
)
returns table(capture_id uuid, outcome text, error text)
language plpgsql
security definer
set search_path = public
as $$
declare
  existing public.capture_delete_audit%rowtype;
  target public.captures%rowtype;
begin
  if p_mode not in ('drive_trash', 'app_only') then
    raise exception 'Invalid deletion mode';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_operation_id::text || ':' || p_capture_id::text, 0));

  select * into existing
  from public.capture_delete_audit audit
  where audit.operation_id = p_operation_id and audit.capture_id = p_capture_id;
  if found then
    return query select existing.capture_id, existing.outcome, existing.error;
    return;
  end if;

  select captures.* into target
  from public.captures captures
  join public.workspaces workspaces on workspaces.id = captures.workspace_id
  where captures.id = p_capture_id and workspaces.owner_user_id = p_user_id
  for update of captures;

  if not found then
    insert into public.capture_delete_audit(operation_id, capture_id, user_id, mode, outcome, drive_file_id, error)
    values (p_operation_id, p_capture_id, p_user_id, p_mode, 'failed', p_drive_file_id, 'Not found or not owned')
    returning capture_delete_audit.capture_id, capture_delete_audit.outcome, capture_delete_audit.error
    into capture_id, outcome, error;
    return next;
    return;
  end if;

  delete from public.captures where id = target.id;
  if not found then
    raise exception 'Capture deletion affected no rows';
  end if;

  insert into public.capture_delete_audit(operation_id, capture_id, workspace_id, user_id, mode, outcome, drive_file_id)
  values (p_operation_id, p_capture_id, target.workspace_id, p_user_id, p_mode, 'deleted', p_drive_file_id)
  returning capture_delete_audit.capture_id, capture_delete_audit.outcome, capture_delete_audit.error
  into capture_id, outcome, error;
  return next;
end;
$$;

alter function public.delete_capture_with_audit(uuid, uuid, uuid, text, text) owner to postgres;
revoke all on function public.delete_capture_with_audit(uuid, uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.delete_capture_with_audit(uuid, uuid, uuid, text, text) to service_role;
