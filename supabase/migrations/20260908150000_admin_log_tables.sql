-- =====================================================================
-- Move three append-only logs out of app_settings JSON blobs.
--
-- Each was one row rewritten in full on every append (read -> splice ->
-- upsert). Two concurrent writes lose one of them, and the hard caps
-- (50/150/100) silently discarded older entries. Real tables get atomic
-- inserts, indexes, and retention that is a delete instead of a truncation.
--
-- Existing blob contents are backfilled below, so nothing is lost. The
-- app_settings rows are left in place — dropping them is a separate step
-- once the new tables have been serving for a while.
-- =====================================================================

create table if not exists public.security_audit_logs (
  id          text primary key,
  type        text        not null,
  title       text        not null default '',
  detail      text        not null default '',
  ip          text,
  created_at  timestamptz not null default now()
);

create table if not exists public.extension_error_logs (
  id          text primary key,
  title       text        not null default '',
  message     text        not null default '',
  details     text,
  email       text,
  version     text,
  created_at  timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id          text primary key,
  category    text        not null default 'other',
  subject     text        not null default '',
  message     text        not null default '',
  user_email  text        not null default '',
  user_plan   text,
  page_url    text,
  user_agent  text,
  status      text        not null default 'open',
  email_sent  boolean     not null default false,
  replies     jsonb       not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);

-- Service role only: every reader is an admin API route using the service
-- key, and no client ever touches these. RLS on with zero policies denies
-- the anon and authenticated keys outright.
alter table public.security_audit_logs  enable row level security;
alter table public.extension_error_logs enable row level security;
alter table public.support_tickets      enable row level security;

-- Every query is "newest first", optionally filtered by status/type.
create index if not exists security_audit_logs_created_idx  on public.security_audit_logs  (created_at desc);
create index if not exists extension_error_logs_created_idx on public.extension_error_logs (created_at desc);
create index if not exists support_tickets_status_idx       on public.support_tickets      (status, created_at desc);

-- ---------------------------------------------------------------------
-- Backfill from the existing JSON blobs. on conflict do nothing makes
-- this safe to re-run.
-- ---------------------------------------------------------------------
insert into public.security_audit_logs (id, type, title, detail, ip, created_at)
select
  coalesce(e->>'id', 'sec_' || ordinality::text),
  coalesce(e->>'type', 'unknown'),
  coalesce(e->>'title', ''),
  coalesce(e->>'detail', ''),
  e->>'ip',
  coalesce((e->>'created_at')::timestamptz, now())
from public.app_settings s,
     jsonb_array_elements(s.value) with ordinality as t(e, ordinality)
where s.key = 'security_audit_logs' and jsonb_typeof(s.value) = 'array'
on conflict (id) do nothing;

insert into public.extension_error_logs (id, title, message, details, email, version, created_at)
select
  coalesce(e->>'id', 'err_' || ordinality::text),
  coalesce(e->>'title', ''),
  coalesce(e->>'message', ''),
  e->>'details',
  e->>'email',
  e->>'version',
  coalesce((e->>'created_at')::timestamptz, now())
from public.app_settings s,
     jsonb_array_elements(s.value) with ordinality as t(e, ordinality)
where s.key = 'extension_recent_errors' and jsonb_typeof(s.value) = 'array'
on conflict (id) do nothing;

-- The blob used camelCase keys; the table is snake_case.
insert into public.support_tickets
  (id, category, subject, message, user_email, user_plan, page_url, user_agent, status, email_sent, replies, created_at)
select
  coalesce(e->>'id', 'tkt_' || ordinality::text),
  coalesce(e->>'category', 'other'),
  coalesce(e->>'subject', ''),
  coalesce(e->>'message', ''),
  coalesce(e->>'userEmail', ''),
  e->>'userPlan',
  e->>'pageUrl',
  e->>'userAgent',
  coalesce(e->>'status', 'open'),
  coalesce((e->>'emailSent')::boolean, false),
  coalesce(e->'replies', '[]'::jsonb),
  coalesce((e->>'created_at')::timestamptz, now())
from public.app_settings s,
     jsonb_array_elements(s.value) with ordinality as t(e, ordinality)
where s.key = 'support_tickets' and jsonb_typeof(s.value) = 'array'
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Retention. The blobs capped by count; these cap by age, so a quiet week
-- no longer erases a month of history. Called from the existing cleanup
-- cron alongside prune_rate_limits().
-- ---------------------------------------------------------------------
create or replace function public.prune_admin_logs()
returns void language sql security definer set search_path = public as $$
  delete from public.security_audit_logs  where created_at < now() - interval '90 days';
  delete from public.extension_error_logs where created_at < now() - interval '30 days';
  delete from public.support_tickets      where status = 'resolved' and created_at < now() - interval '180 days';
$$;

revoke all on function public.prune_admin_logs() from public, anon, authenticated;
