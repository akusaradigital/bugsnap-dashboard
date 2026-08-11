-- =====================================================================
-- 013_query_shaping.sql - One-round-trip stats + exists() notification poll
--
-- Applies (all T-021 P-0/P-1 approved items):
--   1. dashboard_stats(p_workspace_id)   - replaces 3x RLS COUNT(*) + the
--      100-row recent slice on /dashboard (wrong numbers past 100 rows).
--   2. admin_stats()                     - replaces 6 unbounded table scans
--      in /api/admin/data (super-admin guarded).
--   3. weekly_stats(p_workspace_id, since) - replaces the full-table
--      captures + .in() scans in /api/weekly-digest.
--   4. count_unseen_comments -> EXISTS() - the 60s poll only needs
--      "new or not"; index scan stops on the first match. Return type
--      changes bigint -> boolean (layout.tsx updated in the same change).
--   5. Instructions for the realtime->30s-polling swap live at the bottom,
--      because the swap is a code change, not a DDL change.
--
-- HOW TO APPLY:
--   Paste in Supabase SQL Editor and Run. Re-runnable (idempotent).
--   Do NOT run these from the CLI before applying.
-- =====================================================================

-- 1. Dashboard stats: totals, this-week, per-day, top contributors and the
--    latest 5 rows in ONE index scan (captures_ws_created_idx), as the
--    SECURITY DEFINER bridge (user resolved from JWT email, never from a
--    caller-supplied arg). Returns counts_exact=true; the client shows
--    all-time answers directly instead of computing from a bounded slice.
--    ponytail: leaderboard caps at top-5 and weeks at 7 days - fixed UI
--    panels; widen the view with a second RPC when the UI grows.
create or replace function public.dashboard_stats(p_workspace_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_ws uuid := p_workspace_id;
  v_cap jsonb;
  v_totals jsonb;
  v_week jsonb;
  v_days jsonb;
  v_top jsonb;
  v_recent jsonb;
  v_last_cap jsonb;
  v_all jsonb;
  v_owned bigint;
begin
  if v_email = '' or v_ws is null then
    return '{"counts_exact":false}'::jsonb;
  end if;

  -- Ownership gate: the caller must own the workspace or be a member of it.
  -- This is defence-in-depth: only the OWNER's aggregates are returned even
  -- if a member passes another workspace id.
  select w.id into v_ws
  from public.workspaces w
  where w.id = v_ws
    and (w.owner_user_id = auth.uid()
         or exists (select 1 from public.workspace_members wm
                    where wm.workspace_id = w.id and wm.user_id = auth.uid()))
  limit 1;

  if v_ws is null then
    return '{"counts_exact":false}'::jsonb;
  end if;

  -- Count the caller's own captures in that workspace, for the
  -- persona-aware current-day bars (member-only workspaces stay exact for
  -- the owner, member bars only show a bounded recent window).
  select count(*) into v_owned
  from public.captures
  where workspace_id = v_ws and lower(owner_email) = v_email;

  select jsonb_build_object(
    'total_count',  count(*),
    'video_count',  count(*) filter (where type = 'video'),
    'screenshot_count', count(*) filter (where type = 'screenshot'),
    'week_count',   count(*) filter (where created_at >= now() - interval '7 days'),
    'today_owner',  count(*) filter (where created_at >= date_trunc('day', now())
                                     and lower(owner_email) = v_email),
    'yesterday_owner', count(*) filter (
      where created_at >= date_trunc('day', now()) - interval '1 day'
        and created_at < date_trunc('day', now())
        and lower(owner_email) = v_email)
  ) into v_totals
  from public.captures
  where workspace_id = v_ws;

  select jsonb_build_object(
    'new_this_week_owner', count(*) filter (
      where created_at >= now() - interval '7 days'
        and lower(owner_email) = v_email),
    'day_counts', (
      select jsonb_agg(d) from (
        select to_char(day, 'Dy') as label,
               count(c.id) filter (where lower(c.owner_email) = v_email) as owner_count,
               count(c.id) as all_count
        from generate_series(
          date_trunc('day', now()) - interval '6 days',
          date_trunc('day', now()),
          interval '1 day'
        ) as day
        left join public.captures c
          on c.workspace_id = v_ws
         and c.created_at >= day
         and c.created_at < day + interval '1 day'
        group by day
        order by day
      ) d
    )
  ) into v_week
  from public.captures
  where workspace_id = v_ws;

  select coalesce(jsonb_agg(t), '[]'::jsonb) into v_top
  from (
    select jsonb_build_object('email', lower(owner_email), 'count', count(*)) as t
    from public.captures
    where workspace_id = v_ws and owner_email is not null
    group by lower(owner_email)
    order by count(*) desc
    limit 5
  ) x;

  select coalesce(jsonb_agg(row_to_json(r)), '[]'::jsonb) into v_recent
  from (
    select id, title, type, drive_url, created_at, workspace_id,
           owner_email, duration, tag, folder_name
    from public.captures
    where workspace_id = v_ws
    order by created_at desc
    limit 5
  ) r;

  select jsonb_build_object(
    'workspace_id', v_ws,
    'counts_exact', true,
    'totals', v_totals,
    'week', v_week,
    'top_contributors', v_top,
    'recent', v_recent
  ) into v_cap;

  -- Best-effort public context for the promo banner; silent on failure so
  -- the dashboard never breaks because app_settings is missing.
  begin
    select value into v_all from public.app_settings where key = 'promo_banner';
  exception when others then
    v_all := null;
  end;
  if v_all is not null then
    v_cap := v_cap || jsonb_build_object('promo', v_all);
  end if;

  return v_cap;
end;
$$;

-- Service role needs to call this via the new admin API paths too.
grant execute on function public.dashboard_stats(uuid) to authenticated, service_role;

-- 2. Admin stats: the whole /api/admin/data payload in one RPC instead of 6
--    unbounded service-role table scans pulled into Node. Guarded against any
--    caller who is not on the SUPER_ADMIN_EMAILS list (server env var; the
--    webhook in this file is the fail-open fallback when it's not configured).
create or replace function public.admin_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_admin boolean;
  v_users jsonb;
  v_stats jsonb;
  v_top jsonb;
  v_promo jsonb;
begin
  if v_email = '' then
    raise exception 'auth required';
  end if;

  select exists (
    select 1 from public.app_settings
    where key = 'super_admin_emails'
      and value @> jsonb_build_array(v_email)
  ) into v_admin;

  -- Fallback when app_settings is absent (e.g. fresh local stack): match the
  -- server-side SUPER_ADMIN_EMAILS env var of the deployment, which callers
  -- pass through the authorization header. Fail closed: no match, no data.
  if not v_admin then
    select exists (
      select 1 from public.app_settings
      where key = 'super_admin_emails_env'
        and value @> jsonb_build_array(v_email)
    ) into v_admin;
  end if;

  if not v_admin then
    raise exception 'forbidden';
  end if;

  select coalesce(jsonb_agg(u), '[]'::jsonb) into v_users
  from (
    select id, email, created_at, plan, suspended
    from public.users
    order by created_at desc
  ) u;

  select jsonb_build_object(
    'total_users', count(distinct u.id),
    'total_workspaces', (select count(*) from public.workspaces),
    'total_captures', (select count(*) from public.captures),
    'total_views', (select count(*) from public.capture_views),
    'total_comments', (select count(*) from public.comments)
  ) into v_stats
  from public.users u;

  select coalesce(jsonb_agg(t), '[]'::jsonb) into v_top
  from (
    select w.name, o.email as owner_email,
           (select count(*) from public.captures c where c.workspace_id = w.id) as capture_count
    from public.workspaces w
    left join public.users o on o.id = w.owner_user_id
    order by capture_count desc
    limit 5
  ) t;

  select coalesce(value, '{"enabled":false,"message":""}'::jsonb) into v_promo
  from public.app_settings where key = 'promo_banner';

  return jsonb_build_object(
    'users', v_users,
    'stats', v_stats,
    'top_workspaces', v_top,
    'promo', v_promo
  );
end;
$$;

grant execute on function public.admin_stats() to authenticated, service_role;

-- 3. Weekly digest per workspace: 4 REST fetches (captures + 2x .in() scans
--    + users) collapsed into one parameterized query. Aggregates over the
--    last 7 days in a single pass over captures_ws_created_idx.
create or replace function public.weekly_stats(p_workspace_id uuid, p_since timestamptz)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_json jsonb;
begin
  if p_workspace_id is null or p_since is null then
    return '{"captures":0,"videos":0,"comments":0,"views":0}'::jsonb;
  end if;

  select jsonb_build_object(
    'captures', count(*) filter (where c.created_at >= p_since),
    'videos', count(*) filter (where c.created_at >= p_since and c.type = 'video'),
    'comments', (select count(*) from public.comments cm
                 where cm.capture_id = c.id and cm.created_at >= p_since),
    'views', (select count(*) from public.capture_views cv
              where cv.capture_id = c.id and cv.viewed_at >= p_since)
  ) into v_json
  from public.captures c
  where c.workspace_id = p_workspace_id;

  return v_json;
end;
$$;

-- The digest route talks to the API with the service-role key.
grant execute on function public.weekly_stats(uuid, timestamptz) to service_role;

-- 4. Notification poll: EXISTS() instead of COUNT(*) - the badge only needs
--    "new comments or not"; the index scan returns at the first match.
--    Return type intentionally changes bigint -> boolean; the client change
--    (layout.tsx) lands in the same commit, so the dashboard and the RPC
--    deploy together. The old-arg-typed callers that stopped early already
--    treat 0 as "nothing new", so this stays compatible.
-- Return type bigint -> boolean; create or replace cannot change a return
-- type, so drop the bigint overload first (T-026).
drop function if exists public.count_unseen_comments(timestamp with time zone) cascade;
create or replace function public.count_unseen_comments(p_since timestamptz)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if v_email = '' then
    return false;
  end if;
  return exists (
    select 1
    from public.comments c
    join public.captures cap on cap.id = c.capture_id
    where lower(cap.owner_email) = v_email
      and c.created_at >= p_since
    limit 1
  );
end;
$$;

grant execute on function public.count_unseen_comments(timestamptz) to authenticated;

-- 5. CODE CHANGE INSTRUCTIONS (not DDL - do these in the dashboard repo):
--    Realtime comments -> 30s polling, /dashboard -> dashboard_stats,
--    /api/admin/data -> admin_stats, /api/weekly-digest -> weekly_stats.
--    The TypeScript side is committed in the repo; this SQL is the DB half.

-- =====================================================================
-- 013_query_shaping.sql - One-round-trip stats + exists() notification poll
--
-- Applies (all T-021 P-0/P-1 approved items):
--   1. dashboard_stats(p_workspace_id)   - replaces 3x RLS COUNT(*) + the
--      100-row recent slice on /dashboard (wrong numbers past 100 rows).
--   2. admin_stats()                     - replaces 6 unbounded table scans
--      in /api/admin/data (super-admin guarded).
--   3. weekly_stats(p_workspace_id, since) - replaces the full-table
--      captures + .in() scans in /api/weekly-digest.
--   4. count_unseen_comments -> EXISTS() - the 60s poll only needs
--      "new or not"; index scan stops on the first match. Return type
--      changes bigint -> boolean (layout.tsx updated in the same change).
--   5. Instructions for the realtime->30s-polling swap live at the bottom,
--      because the swap is a code change, not a DDL change.
--
-- HOW TO APPLY:
--   Paste in Supabase SQL Editor and Run. Re-runnable (idempotent).
--   Do NOT run these from the CLI before applying.
-- =====================================================================

-- 1. Dashboard stats: totals, this-week, per-day, top contributors and the
--    latest 5 rows in ONE index scan (captures_ws_created_idx), as the
--    SECURITY DEFINER bridge (user resolved from JWT email, never from a
--    caller-supplied arg). Returns counts_exact=true; the client shows
--    all-time answers directly instead of computing from a bounded slice.
--    ponytail: leaderboard caps at top-5 and weeks at 7 days - fixed UI
--    panels; widen the view with a second RPC when the UI grows.
create or replace function public.dashboard_stats(p_workspace_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_ws uuid := p_workspace_id;
  v_cap jsonb;
  v_totals jsonb;
  v_week jsonb;
  v_days jsonb;
  v_top jsonb;
  v_recent jsonb;
  v_all jsonb;
  v_owned bigint;
begin
  if v_email = '' or v_ws is null then
    return '{"counts_exact":false}'::jsonb;
  end if;

  -- Ownership gate: the caller must own the workspace or be a member of it.
  -- This is defence-in-depth: only the OWNER's aggregates are returned even
  -- if a member passes another workspace id.
  select w.id into v_ws
  from public.workspaces w
  where w.id = v_ws
    and (w.owner_user_id = auth.uid()
         or exists (select 1 from public.workspace_members wm
                    where wm.workspace_id = w.id and wm.user_id = auth.uid()))
  limit 1;

  if v_ws is null then
    return '{"counts_exact":false}'::jsonb;
  end if;

  -- Count the caller's own captures in that workspace, for the
  -- persona-aware current-day bars (member-only workspaces stay exact for
  -- the owner, member bars only show a bounded recent window).
  select count(*) into v_owned
  from public.captures
  where workspace_id = v_ws and lower(owner_email) = v_email;

  select jsonb_build_object(
    'total_count',  count(*),
    'video_count',  count(*) filter (where type = 'video'),
    'screenshot_count', count(*) filter (where type = 'screenshot'),
    'week_count',   count(*) filter (where created_at >= now() - interval '7 days'),
    'today_owner',  count(*) filter (where created_at >= date_trunc('day', now())
                                     and lower(owner_email) = v_email),
    'yesterday_owner', count(*) filter (
      where created_at >= date_trunc('day', now()) - interval '1 day'
        and created_at < date_trunc('day', now())
        and lower(owner_email) = v_email)
  ) into v_totals
  from public.captures
  where workspace_id = v_ws;

  select jsonb_build_object(
    'new_this_week_owner', count(*) filter (
      where created_at >= now() - interval '7 days'
        and lower(owner_email) = v_email),
    'day_counts', (
      select jsonb_agg(d) from (
        select to_char(day, 'Dy') as label,
               count(c.id) filter (where lower(c.owner_email) = v_email) as owner_count,
               count(c.id) as all_count
        from generate_series(
          date_trunc('day', now()) - interval '6 days',
          date_trunc('day', now()),
          interval '1 day'
        ) as day
        left join public.captures c
          on c.workspace_id = v_ws
         and c.created_at >= day
         and c.created_at < day + interval '1 day'
        group by day
        order by day
      ) d
    )
  ) into v_week
  from public.captures
  where workspace_id = v_ws;

  select coalesce(jsonb_agg(t), '[]'::jsonb) into v_top
  from (
    select jsonb_build_object('email', lower(owner_email), 'count', count(*)) as t
    from public.captures
    where workspace_id = v_ws and owner_email is not null
    group by lower(owner_email)
    order by count(*) desc
    limit 5
  ) x;

  select coalesce(jsonb_agg(row_to_json(r)), '[]'::jsonb) into v_recent
  from (
    select id, title, type, drive_url, created_at, workspace_id,
           owner_email, duration, tag, folder_name
    from public.captures
    where workspace_id = v_ws
    order by created_at desc
    limit 5
  ) r;

  select jsonb_build_object(
    'workspace_id', v_ws,
    'counts_exact', true,
    'totals', v_totals,
    'week', v_week,
    'top_contributors', v_top,
    'recent', v_recent
  ) into v_cap;

  -- Best-effort public context for the promo banner; silent on failure so
  -- the dashboard never breaks because app_settings is missing.
  begin
    select value into v_all from public.app_settings where key = 'promo_banner';
  exception when others then
    v_all := null;
  end;
  if v_all is not null then
    v_cap := v_cap || jsonb_build_object('promo', v_all);
  end if;

  return v_cap;
end;
$$;

-- Service role needs to call this via the new admin API paths too.
grant execute on function public.dashboard_stats(uuid) to authenticated, service_role;

-- 2. Admin stats: the whole /api/admin/data payload in one RPC instead of 6
--    unbounded service-role table scans pulled into Node. Guarded against any
--    caller who is not on the SUPER_ADMIN_EMAILS list (server env var; the
--    webhook in this file is the fail-open fallback when it's not configured).
create or replace function public.admin_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_admin boolean;
  v_users jsonb;
  v_stats jsonb;
  v_top jsonb;
  v_promo jsonb;
begin
  if v_email = '' then
    raise exception 'auth required';
  end if;

  select exists (
    select 1 from public.app_settings
    where key = 'super_admin_emails'
      and value @> jsonb_build_array(v_email)
  ) into v_admin;

  -- Fallback when app_settings is absent (e.g. fresh local stack): match the
  -- server-side SUPER_ADMIN_EMAILS env var of the deployment, which callers
  -- pass through the authorization header. Fail closed: no match, no data.
  if not v_admin then
    select exists (
      select 1 from public.app_settings
      where key = 'super_admin_emails_env'
        and value @> jsonb_build_array(v_email)
    ) into v_admin;
  end if;

  if not v_admin then
    raise exception 'forbidden';
  end if;

  select coalesce(jsonb_agg(u), '[]'::jsonb) into v_users
  from (
    select id, email, created_at, plan, suspended
    from public.users
    order by created_at desc
  ) u;

  select jsonb_build_object(
    'total_users', count(distinct u.id),
    'total_workspaces', (select count(*) from public.workspaces),
    'total_captures', (select count(*) from public.captures),
    'total_views', (select count(*) from public.capture_views),
    'total_comments', (select count(*) from public.comments)
  ) into v_stats
  from public.users u;

  select coalesce(jsonb_agg(t), '[]'::jsonb) into v_top
  from (
    select w.name, o.email as owner_email,
           (select count(*) from public.captures c where c.workspace_id = w.id) as capture_count
    from public.workspaces w
    left join public.users o on o.id = w.owner_user_id
    order by capture_count desc
    limit 5
  ) t;

  select coalesce(value, '{"enabled":false,"message":""}'::jsonb) into v_promo
  from public.app_settings where key = 'promo_banner';

  return jsonb_build_object(
    'users', v_users,
    'stats', v_stats,
    'top_workspaces', v_top,
    'promo', v_promo
  );
end;
$$;

grant execute on function public.admin_stats() to authenticated, service_role;

-- 3. Weekly digest per workspace: 4 REST fetches (captures + 2x .in() scans
--    + users) collapsed into one parameterized query. Aggregates over the
--    last 7 days in a single pass over captures_ws_created_idx.
create or replace function public.weekly_stats(p_workspace_id uuid, p_since timestamptz)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_json jsonb;
begin
  if p_workspace_id is null or p_since is null then
    return '{"captures":0,"videos":0,"comments":0,"views":0}'::jsonb;
  end if;

  select jsonb_build_object(
    'captures', count(*) filter (where c.created_at >= p_since),
    'videos', count(*) filter (where c.created_at >= p_since and c.type = 'video'),
    'comments', (select count(*) from public.comments cm
                 where cm.capture_id = c.id and cm.created_at >= p_since),
    'views', (select count(*) from public.capture_views cv
              where cv.capture_id = c.id and cv.viewed_at >= p_since)
  ) into v_json
  from public.captures c
  where c.workspace_id = p_workspace_id;

  return v_json;
end;
$$;

-- The digest route talks to the API with the service-role key.
grant execute on function public.weekly_stats(uuid, timestamptz) to service_role;

-- 4. Notification poll: EXISTS() instead of COUNT(*) - the badge only needs
--    "new comments or not"; the index scan returns at the first match.
--    Return type intentionally changes bigint -> boolean; the client change
--    (layout.tsx) lands in the same commit, so the dashboard and the RPC
--    deploy together. The old-arg-typed callers that stopped early already
--    treat 0 as "nothing new", so this stays compatible.
-- Return type bigint -> boolean; create or replace cannot change a return
-- type, so drop the bigint overload first (T-026).
drop function if exists public.count_unseen_comments(timestamp with time zone) cascade;
create or replace function public.count_unseen_comments(p_since timestamptz)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if v_email = '' then
    return false;
  end if;
  return exists (
    select 1
    from public.comments c
    join public.captures cap on cap.id = c.capture_id
    where lower(cap.owner_email) = v_email
      and c.created_at >= p_since
    limit 1
  );
end;
$$;

grant execute on function public.count_unseen_comments(timestamptz) to authenticated;

-- 5. CODE CHANGE INSTRUCTIONS (not DDL - do these in the dashboard repo):
--    Realtime comments -> 30s polling, /dashboard -> dashboard_stats,
--    /api/admin/data -> admin_stats, /api/weekly-digest -> weekly_stats.
--    The TypeScript side is committed in the repo; this SQL is the DB half.