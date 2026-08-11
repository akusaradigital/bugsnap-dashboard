-- =====================================================================
-- 017_tier_gating.sql - Tier-gating DB foundation (T-018)
--
-- SATU KESATUAN dengan T-014: `users.plan` adalah single source of truth
-- (ditulis stripe-webhook, dibaca app-layer). Task ini TIDAK menambah
-- `workspaces.plan` — itu duplikat sumber tier tanpa alasan (keputusan
-- konsolidasi, lihat R-018). Sebaliknya, ini menutup gap nyata: T-014
-- membaca `users.plan` di kode tetapi TIDAK ada SQL yang mendefinisikan
-- kolom itu. (users.suspended sudah ada di 010_add_suspended_flag.)
--
--   1. public.users.plan text NOT NULL DEFAULT 'free'
--      CHECK (plan IN ('free','pro','pro_plus','enterprise')).
--      Superset dari roadmap IDEA.md (free|pro|business): 'business'
--      belum dipakai seed; guard rank di bawah siap menerima nilai
--      tambahan tanpa perubahan.
--   2. plan_rank(p_plan) - urutan perbandingan tier (mirror tiers.ts).
--   3. has_plan(p_workspace_id, p_min_plan) - GUARD RPC. SECURITY
--      DEFINER; caller diresolusi dari auth.jwt() ->> 'email', BUKAN dari
--      argumen client. Wajib owner/member workspace. Dipakai di dalam
--      RPC lain utk meng-gate fitur PRO/Business.
--   4. get_my_plan() - RPC ringan: plan caller (dari JWT) utk UI.
--   5. workspace_member_count(p_workspace_id) + has_member_capacity(...)
--      - cek count member ringan (Business B-1 multi-user gating),
--      owner-gated, indexed (unique(workspace_id,user_id)).
--
-- Semua query ringan free-tier; tidak ada scan besar.
--
-- HOW TO APPLY (MANUAL - do not run from the CLI):
--   Paste in Supabase SQL Editor and Run. Re-runnable (idempotent).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. users.plan column (gap dari T-014)
-- ---------------------------------------------------------------------
alter table public.users
  add column if not exists plan text not null default 'free';

alter table public.users
  drop constraint if exists users_plan_check;
alter table public.users
  add constraint users_plan_check
  check (plan in ('free', 'pro', 'pro_plus', 'enterprise'));

-- Index untuk lookup email yang dipakai guard/getAuthenticatedUser
-- (lower(trim(email))); ringan, hanya untuk kolom plan reads yang
-- sering. Jika index dengan ekspresi sama sudah ada dari 012, no-op.
create index if not exists users_plan_lookup_idx
  on public.users (lower(trim(email)));

-- ---------------------------------------------------------------------
-- 2. plan_rank - urutan tier (harus sinkron dgn src/lib/tiers.ts RANK)
-- ---------------------------------------------------------------------
create or replace function public.plan_rank(p_plan text)
returns int
language sql
immutable
set search_path = public, pg_temp
as $$
  select case coalesce(lower(trim(p_plan)), 'free')
    when 'pro_plus' then 2
    when 'enterprise' then 3
    when 'pro' then 1
    else 0 -- 'free' dan nilai tak dikenal
  end
$$;

-- ---------------------------------------------------------------------
-- 3. has_plan - GUARD untuk gate fitur di dalam RPC lain
-- ---------------------------------------------------------------------
create or replace function public.has_plan(p_workspace_id uuid, p_min_plan text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_plan int;
  v_min int;
begin
  if v_email = '' or p_workspace_id is null or p_min_plan is null then
    return false;
  end if;

  -- Caller harus owner ATAU member workspace (gate akses).
  if not exists (
    select 1 from public.workspaces w
    where w.id = p_workspace_id
      and (w.owner_user_id = auth.uid()
           or exists (select 1 from public.workspace_members m
                      where m.workspace_id = w.id and m.user_id = auth.uid()))
  ) then
    return false;
  end if;

  -- Plan caller dari users.plan (di-resolusi via email JWT).
  select plan_rank(u.plan) into v_plan
  from public.users u
  where lower(trim(u.email)) = v_email
  limit 1;

  v_min := public.plan_rank(p_min_plan);

  return coalesce(v_plan, 0) >= v_min;
end;
$$;

grant execute on function public.has_plan(uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- 4. get_my_plan - UI / app layer baca plan caller (ringan)
-- ---------------------------------------------------------------------
create or replace function public.get_my_plan()
returns text
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select coalesce(u.plan, 'free')
  from public.users u
  where lower(trim(u.email)) = lower(coalesce(auth.jwt() ->> 'email', ''))
  limit 1
$$;

grant execute on function public.get_my_plan() to authenticated;

-- ---------------------------------------------------------------------
-- 5. Member-count helpers (Business B-1: multi-user gating)
--    Owner-gated: hanya owner (atau member) workspace yang bisa baca.
-- ---------------------------------------------------------------------
create or replace function public.workspace_member_count(p_workspace_id uuid)
returns int
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
begin
  -- Owner/member-gated: hanya anggota workspace yang boleh tahu member count.
  if not exists (
    select 1 from public.workspaces w
    where w.id = p_workspace_id
      and (w.owner_user_id = auth.uid()
           or exists (select 1 from public.workspace_members m
                      where m.workspace_id = w.id and m.user_id = auth.uid()))
  ) then
    raise exception 'Permission denied' using errcode = '42501';
  end if;
  return (select count(*)::int from public.workspace_members
          where workspace_id = p_workspace_id);
end;
$$;

create or replace function public.has_member_capacity(p_workspace_id uuid, p_max int)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
begin
  if p_max is null or p_max < 0 then
    return false;
  end if;
  -- Owner/member-gated (sama seperti workspace_member_count).
  if not exists (
    select 1 from public.workspaces w
    where w.id = p_workspace_id
      and (w.owner_user_id = auth.uid()
           or exists (select 1 from public.workspace_members m
                      where m.workspace_id = w.id and m.user_id = auth.uid()))
  ) then
    raise exception 'Permission denied' using errcode = '42501';
  end if;
  return (select count(*) from public.workspace_members
          where workspace_id = p_workspace_id) < p_max;
end;
$$;

grant execute on function public.workspace_member_count(uuid), public.has_member_capacity(uuid, int) to authenticated;