-- =====================================================================
-- Shared rate-limit counter.
--
-- Replaces three in-memory Maps (admin/login, extension/error-log,
-- ai-bug-summary). On Vercel each instance had its own Map, so the real
-- limit was multiplied by however many instances were warm.
--
-- One SECURITY DEFINER function does check-and-increment atomically, so
-- concurrent requests cannot both slip under the cap.
-- =====================================================================

create table if not exists public.rate_limits (
  key        text primary key,
  count      integer     not null default 0,
  reset_at   timestamptz not null
);

alter table public.rate_limits enable row level security;
-- No policies: service role only. Clients must never read or write this.

create index if not exists rate_limits_reset_at_idx on public.rate_limits (reset_at);

-- Returns true when the caller is OVER the limit and should be rejected.
create or replace function public.check_rate_limit(
  p_key      text,
  p_limit    integer,
  p_window_s integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into public.rate_limits (key, count, reset_at)
  values (p_key, 1, now() + make_interval(secs => p_window_s))
  on conflict (key) do update
    set count    = case when public.rate_limits.reset_at < now() then 1
                        else public.rate_limits.count + 1 end,
        reset_at = case when public.rate_limits.reset_at < now()
                        then now() + make_interval(secs => p_window_s)
                        else public.rate_limits.reset_at end
  returning count into v_count;

  return v_count > p_limit;
end;
$$;

revoke all on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;

-- Opportunistic cleanup; the table stays small without a cron.
create or replace function public.prune_rate_limits() returns void
language sql security definer set search_path = public as $$
  delete from public.rate_limits where reset_at < now() - interval '1 hour';
$$;

revoke all on function public.prune_rate_limits() from public, anon, authenticated;
