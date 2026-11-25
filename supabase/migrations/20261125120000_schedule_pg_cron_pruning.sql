-- Schedule pure-SQL retention pruning inside Postgres via pg_cron so routine
-- log, rate-limit, and ephemeral table cleanup runs inside Supabase without
-- burning Vercel serverless function CPU or invocation quota.

create extension if not exists pg_cron;

do $$
declare
  job_record record;
begin
  for job_record in
    select jobname from cron.job where jobname in (
      'bugsnap-prune-admin-logs',
      'bugsnap-prune-rate-limits',
      'bugsnap-prune-capture-views',
      'bugsnap-prune-ephemeral-data'
    )
  loop
    perform cron.unschedule(job_record.jobname);
  end loop;
end $$;

select cron.schedule(
  'bugsnap-prune-admin-logs',
  '55 1 * * *',
  $$select public.prune_admin_logs();$$
);

select cron.schedule(
  'bugsnap-prune-rate-limits',
  '15 * * * *',
  $$select public.prune_rate_limits();$$
);

select cron.schedule(
  'bugsnap-prune-capture-views',
  '50 1 * * *',
  $$select public.prune_capture_views();$$
);

select cron.schedule(
  'bugsnap-prune-ephemeral-data',
  '45 1 * * *',
  $$select public.prune_ephemeral_data();$$
);
