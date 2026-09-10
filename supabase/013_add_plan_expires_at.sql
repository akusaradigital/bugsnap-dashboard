-- =====================================================================
-- 013_add_plan_expires_at.sql - add plan_expires_at to public.users
--
-- HOW TO APPLY:
--   Paste in Supabase SQL Editor and Run. Idempotent.
--
-- Purpose: allows assigning temporary Pro / Team / Enterprise plans
-- (e.g., 7-day trial, 1-month gift, 3-month partnership) from the Admin panel.
-- NULL means permanent / recurring subscription.
-- =====================================================================

alter table public.users
  add column if not exists plan_expires_at timestamptz default null;

-- Index for cron / background expiration sweeper
create index if not exists idx_users_plan_expires_at
  on public.users (plan_expires_at)
  where plan_expires_at is not null;
