-- =====================================================================
-- Zero-overhead sales conversion, paywall intent & viral attribution tracking
-- Modifies users table in-place to avoid high-volume log row bloat on free tiers.
-- =====================================================================

alter table public.users
  add column if not exists paywall_hits integer not null default 0,
  add column if not exists last_paywall_feature text,
  add column if not exists last_paywall_at timestamptz,
  add column if not exists referred_by_capture_id text,
  add column if not exists checkout_status text,
  add column if not exists last_checkout_plan text,
  add column if not exists checkout_initiated_at timestamptz,
  add column if not exists extension_last_seen timestamptz,
  add column if not exists extension_version text;

-- Indexes for instant high-intent lead lookups
create index if not exists idx_users_paywall_hits on public.users (paywall_hits desc);
create index if not exists idx_users_checkout_status on public.users (checkout_status);
create index if not exists idx_users_referred_by_capture on public.users (referred_by_capture_id);
create index if not exists idx_users_extension_last_seen on public.users (extension_last_seen desc);

-- Lightweight atomic RPC to increment paywall hit without race conditions
create or replace function public.track_paywall_hit(p_feature text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is not null then
    update public.users
    set paywall_hits = coalesce(paywall_hits, 0) + 1,
        last_paywall_feature = p_feature,
        last_paywall_at = now()
    where id = v_user_id;
  end if;
end;
$$;

grant execute on function public.track_paywall_hit(text) to authenticated;
