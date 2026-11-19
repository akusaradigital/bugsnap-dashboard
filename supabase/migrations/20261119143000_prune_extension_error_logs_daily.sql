-- Set retention for extension_error_logs to 1 day (daily cleanup)
-- Update prune_admin_logs() so daily cron trims extension errors older than 24h.

create or replace function public.prune_admin_logs()
returns void language sql security definer set search_path = public, pg_temp as $$
  delete from public.security_audit_logs  where created_at < now() - interval '90 days';
  delete from public.extension_error_logs where created_at < now() - interval '1 day';
  delete from public.support_tickets      where status = 'resolved' and created_at < now() - interval '180 days';
  delete from public.ai_usage_logs        where created_at < now() - interval '90 days';
$$;

revoke all on function public.prune_admin_logs() from public, anon, authenticated;
grant execute on function public.prune_admin_logs() to service_role;

-- Immediately purge stale extension error logs older than 1 day
delete from public.extension_error_logs where created_at < now() - interval '1 day';
