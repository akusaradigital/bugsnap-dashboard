-- Internal stability audits + warn-only rollback flags.

insert into public.app_settings (key, value)
values (
  'system_flags',
  jsonb_build_object(
    'maintenance_mode', false,
    'disabled_features', jsonb_build_array(),
    'rollback_warning', false,
    'updated_at', now()
  )
)
on conflict (key) do nothing;

create or replace function public.run_schema_drift_check()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  missing_projects_table boolean;
  missing_sources boolean;
  missing_project_id boolean;
  missing_integrity_rpc boolean;
begin
  select not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'projects'
  ) into missing_projects_table;

  select not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'captures' and column_name = 'source'
  ) into missing_sources;

  select not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'captures' and column_name = 'project_id'
  ) into missing_project_id;

  select not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'run_integrity_audit'
  ) into missing_integrity_rpc;

  return jsonb_build_object(
    'missing_projects_table', missing_projects_table,
    'missing_capture_source_column', missing_sources,
    'missing_capture_project_id_column', missing_project_id,
    'missing_integrity_rpc', missing_integrity_rpc,
    'ok', not (missing_projects_table or missing_sources or missing_project_id or missing_integrity_rpc)
  );
end;
$$;

grant execute on function public.run_schema_drift_check() to authenticated;

create or replace function public.run_integrity_audit()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  orphan_captures integer;
  orphan_comments integer;
  orphan_projects integer;
  missing_sources integer;
  broken_drive_links integer;
  missing_default_projects integer;
begin
  select count(*) into orphan_captures
  from public.captures c
  left join public.workspaces w on w.id = c.workspace_id
  where c.workspace_id is not null and w.id is null;

  select count(*) into orphan_comments
  from public.comments cm
  left join public.captures c on c.id = cm.capture_id
  where cm.capture_id is not null and c.id is null;

  select count(*) into orphan_projects
  from public.projects p
  left join public.workspaces w on w.id = p.workspace_id
  where w.id is null;

  select count(*) into missing_sources
  from public.captures c
  where c.source is null or btrim(c.source) = '';

  select count(*) into broken_drive_links
  from public.captures c
  where c.drive_url is null or btrim(c.drive_url) = '';

  select count(*) into missing_default_projects
  from public.workspaces w
  where not exists (
    select 1 from public.projects p
    where p.workspace_id = w.id and p.is_default
  );

  return jsonb_build_object(
    'orphan_captures_count', orphan_captures,
    'orphan_comments_count', orphan_comments,
    'orphan_projects_count', orphan_projects,
    'missing_sources_count', missing_sources,
    'broken_drive_links_count', broken_drive_links,
    'missing_default_projects_count', missing_default_projects,
    'ok', orphan_captures = 0 and orphan_comments = 0 and orphan_projects = 0 and missing_sources = 0 and broken_drive_links = 0 and missing_default_projects = 0
  );
end;
$$;

grant execute on function public.run_integrity_audit() to authenticated;
