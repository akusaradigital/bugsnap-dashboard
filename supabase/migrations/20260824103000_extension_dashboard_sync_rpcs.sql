-- Restore extension-facing compatibility RPCs required by the latest
-- extension build, while keeping the dashboard's workspace/project schema as
-- the source of truth.

create or replace function public.get_deleted_folders_by_email(p_email text)
returns setof public.deleted_drive_folders
language sql
stable
security definer
set search_path = public
as $$
  select ddf.*
  from public.deleted_drive_folders ddf
  where ddf.workspace_id in (
    select w.id
    from public.workspaces w
    join public.users u on u.id = w.owner_user_id
    where lower(trim(u.email)) = lower(trim(p_email))
       or exists (
         select 1
         from public.workspace_members m
         join public.users mu on mu.id = m.user_id
         where m.workspace_id = w.id
           and lower(trim(mu.email)) = lower(trim(p_email))
       )
  )
  order by ddf.created_at asc;
$$;

grant execute on function public.get_deleted_folders_by_email(text) to anon, authenticated;

create or replace function public.delete_deleted_drive_folder_by_email(p_email text, p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.deleted_drive_folders ddf
  where ddf.id = p_id
    and ddf.workspace_id in (
      select w.id
      from public.workspaces w
      join public.users u on u.id = w.owner_user_id
      where lower(trim(u.email)) = lower(trim(p_email))
    );
$$;

grant execute on function public.delete_deleted_drive_folder_by_email(text, uuid) to anon, authenticated;

create or replace function public.get_projects_by_workspace_and_email(p_email text, p_workspace_id uuid)
returns table (
  id uuid,
  workspace_id uuid,
  name text,
  description text,
  is_default boolean,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.workspace_id, p.name, p.description, p.is_default, p.created_at
  from public.projects p
  where p.workspace_id = p_workspace_id
    and exists (
      select 1
      from public.workspace_members m
      join public.users u on u.id = m.user_id
      where m.workspace_id = p.workspace_id
        and lower(trim(u.email)) = lower(trim(p_email))
    )
  order by p.is_default desc, p.name asc;
$$;

grant execute on function public.get_projects_by_workspace_and_email(text, uuid) to anon, authenticated;
