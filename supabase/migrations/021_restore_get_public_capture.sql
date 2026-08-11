-- 018_convergence dropped this RPC after 014 created its final version.
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

  select count(*) into v_view_count
  from public.capture_views cv
  where cv.capture_id = p_id;

  if (v_rec.burn_after_read = true and v_view_count > 0)
     or (v_rec.expires_at is not null and v_rec.expires_at < now()) then
    return query select
      v_rec.id, v_rec.title, v_rec.type, null::text, v_rec.site_url, v_rec.created_at,
      v_rec.window_size, v_rec.description, null::jsonb, v_rec.os, v_rec.browser,
      v_rec.burn_after_read, null::text[], null::text[], 'expired'::text;
    return;
  end if;

  if v_rec.password is not null and (p_password is null or p_password <> v_rec.password) then
    return query select
      v_rec.id, v_rec.title, v_rec.type, null::text, v_rec.site_url, v_rec.created_at,
      v_rec.window_size, v_rec.description, null::jsonb, v_rec.os, v_rec.browser,
      v_rec.burn_after_read, null::text[], null::text[], 'needs_password'::text;
    return;
  end if;

  if coalesce(cardinality(v_rec.allowed_ips), 0) > 0
     and (v_client_ip = '' or not (v_rec.allowed_ips @> array[v_client_ip])) then
    return query select
      v_rec.id, v_rec.title, v_rec.type, null::text, v_rec.site_url, v_rec.created_at,
      v_rec.window_size, v_rec.description, null::jsonb, v_rec.os, v_rec.browser,
      v_rec.burn_after_read, null::text[], null::text[], 'unauthorized_ip'::text;
    return;
  end if;

  if coalesce(cardinality(v_rec.allowed_domains), 0) > 0 then
    if v_client_email = '' then
      return query select
        v_rec.id, v_rec.title, v_rec.type, null::text, v_rec.site_url, v_rec.created_at,
        v_rec.window_size, v_rec.description, null::jsonb, v_rec.os, v_rec.browser,
        v_rec.burn_after_read, null::text[], null::text[], 'needs_login'::text;
      return;
    elsif not (v_rec.allowed_domains @> array[v_client_domain]) then
      return query select
        v_rec.id, v_rec.title, v_rec.type, null::text, v_rec.site_url, v_rec.created_at,
        v_rec.window_size, v_rec.description, null::jsonb, v_rec.os, v_rec.browser,
        v_rec.burn_after_read, null::text[], null::text[], 'unauthorized_domain'::text;
      return;
    end if;
  end if;

  insert into public.audit_logs (capture_id, user_id, action, ip, viewer_email)
  values (p_id, auth.uid(), 'view', v_client_ip, nullif(v_client_email, ''));

  return query select
    v_rec.id, v_rec.title, v_rec.type, v_rec.drive_url, v_rec.site_url, v_rec.created_at,
    v_rec.window_size, v_rec.description, v_rec.dev_logs, v_rec.os, v_rec.browser,
    v_rec.burn_after_read, v_rec.allowed_domains, v_rec.allowed_ips, 'ok'::text;
end;
$$;

revoke all on function public.get_public_capture(uuid, text) from public;
grant execute on function public.get_public_capture(uuid, text) to anon, authenticated;
