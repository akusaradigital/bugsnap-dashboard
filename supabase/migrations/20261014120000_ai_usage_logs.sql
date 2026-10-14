-- =====================================================================
-- Real per-call AI usage tracking (tokens + hit counts).
--
-- /admin/ai-analytics previously estimated tokens as a flat 1200 x
-- count(captures.ai_summary IS NOT NULL) - a guess that was also blind to
-- the extension's "AI Polish" button entirely (it never touched that
-- column). One row per real LLM call here, with the provider's own
-- `usage` field, across every call site:
--   - extension_polish  : bugsnap-extension editor "AI Polish" button
--   - ai_clue           : dashboard capture page "AI Clue" root-cause button
--   - admin_ping        : /admin/ai-analytics "Test Connection"
--   - admin_test_polish : /admin/ai-analytics playground test
-- =====================================================================

create table if not exists public.ai_usage_logs (
  id                 text primary key,
  source             text        not null,
  workspace_id       uuid        references public.workspaces(id) on delete set null,
  user_email         text,
  model              text        not null default '',
  endpoint_host      text,
  prompt_tokens      integer     not null default 0,
  completion_tokens  integer     not null default 0,
  total_tokens       integer     not null default 0,
  latency_ms         integer,
  success            boolean     not null default true,
  error_message      text,
  created_at         timestamptz not null default now()
);

-- Service role only: every reader is an admin API route using the service
-- key, and no client ever touches this. RLS on with zero policies denies
-- the anon and authenticated keys outright.
alter table public.ai_usage_logs enable row level security;

create index if not exists ai_usage_logs_created_idx   on public.ai_usage_logs (created_at desc);
create index if not exists ai_usage_logs_email_idx     on public.ai_usage_logs (user_email);
create index if not exists ai_usage_logs_workspace_idx on public.ai_usage_logs (workspace_id);

-- Extend the existing admin-log retention sweep (20260908150000_admin_log_tables.sql)
-- to cover this table too: 90 days, same horizon as security_audit_logs.
create or replace function public.prune_admin_logs()
returns void language sql security definer set search_path = public, pg_temp as $$
  delete from public.security_audit_logs  where created_at < now() - interval '90 days';
  delete from public.extension_error_logs where created_at < now() - interval '30 days';
  delete from public.support_tickets      where status = 'resolved' and created_at < now() - interval '180 days';
  delete from public.ai_usage_logs        where created_at < now() - interval '90 days';
$$;

revoke all on function public.prune_admin_logs() from public, anon, authenticated;
