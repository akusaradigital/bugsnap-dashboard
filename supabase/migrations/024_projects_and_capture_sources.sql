-- Projects inside workspaces + capture source tagging.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 200),
  description text not null default '',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (workspace_id, name)
);

alter table public.projects enable row level security;
drop policy if exists "projects members select" on public.projects;
drop policy if exists "projects owners write" on public.projects;
create policy "projects members select" on public.projects
  for select to authenticated using (
    exists (
      select 1 from public.workspace_members m
      where m.workspace_id = projects.workspace_id and m.user_id = auth.uid()
    )
  );
create policy "projects owners write" on public.projects
  for all to authenticated using (
    exists (
      select 1 from public.workspaces w
      where w.id = projects.workspace_id and w.owner_user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.workspaces w
      where w.id = projects.workspace_id and w.owner_user_id = auth.uid()
    )
  );

create unique index if not exists uq_projects_default_per_workspace
  on public.projects (workspace_id) where is_default;
create index if not exists projects_workspace_idx on public.projects (workspace_id, created_at desc);

alter table public.captures
  add column if not exists project_id uuid references public.projects(id) on delete set null,
  add column if not exists source text not null default 'chrome_extension';

alter table public.captures
  drop constraint if exists captures_source_check;
alter table public.captures
  add constraint captures_source_check check (source in ('chrome_extension', 'web_upload'));

create index if not exists captures_workspace_project_idx
  on public.captures (workspace_id, project_id, created_at desc)
  where project_id is not null;

create or replace function public.ensure_workspace_default_project(p_workspace_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project_id uuid;
  v_name text;
begin
  select id into v_project_id from public.projects
  where workspace_id = p_workspace_id and is_default
  limit 1;
  if v_project_id is not null then
    return v_project_id;
  end if;

  select coalesce(nullif(trim(u.full_name), ''), split_part(u.email, '@', 1), 'General')
  into v_name
  from public.workspaces w
  join public.users u on u.id = w.owner_user_id
  where w.id = p_workspace_id;

  insert into public.projects(workspace_id, name, description, is_default)
  values (p_workspace_id, coalesce(v_name, 'General'), '', true)
  on conflict (workspace_id, name) do update set is_default = true
  returning id into v_project_id;

  return v_project_id;
end;
$$;

create or replace function public.handle_workspace_default_project()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.ensure_workspace_default_project(new.id);
  return new;
end;
$$;

drop trigger if exists on_workspace_created_default_project on public.workspaces;
create trigger on_workspace_created_default_project
  after insert on public.workspaces
  for each row execute function public.handle_workspace_default_project();

do $$ declare r record; begin
  for r in select id from public.workspaces loop
    perform public.ensure_workspace_default_project(r.id);
  end loop;
end $$;

create or replace function public.get_workspace_projects(p_workspace_id uuid)
returns table (id uuid, workspace_id uuid, name text, description text, is_default boolean, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select p.id, p.workspace_id, p.name, p.description, p.is_default, p.created_at
  from public.projects p
  where p.workspace_id = p_workspace_id
    and exists (
      select 1 from public.workspace_members m
      where m.workspace_id = p.workspace_id and m.user_id = auth.uid()
    )
  order by p.is_default desc, p.name asc;
$$;

create or replace function public.create_project(p_workspace_id uuid, p_name text, p_description text default '')
returns table (id uuid, workspace_id uuid, name text, description text, is_default boolean, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project public.projects%rowtype;
begin
  if not exists (
    select 1 from public.workspaces w
    where w.id = p_workspace_id and w.owner_user_id = auth.uid()
  ) then
    raise exception 'Permission denied' using errcode='42501';
  end if;

  insert into public.projects(workspace_id, name, description)
  values (p_workspace_id, btrim(p_name), btrim(coalesce(p_description, '')))
  returning * into v_project;

  return query
  select v_project.id, v_project.workspace_id, v_project.name, v_project.description, v_project.is_default, v_project.created_at;
end;
$$;

create or replace function public.rename_project(p_project_id uuid, p_name text, p_description text default null)
returns table (id uuid, workspace_id uuid, name text, description text, is_default boolean, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project public.projects%rowtype;
begin
  update public.projects p
  set name = btrim(p_name),
      description = case when p_description is null then p.description else btrim(p_description) end
  where p.id = p_project_id
    and exists (
      select 1 from public.workspaces w
      where w.id = p.workspace_id and w.owner_user_id = auth.uid()
    )
  returning * into v_project;

  if v_project.id is null then
    raise exception 'Project not found or permission denied' using errcode='P0002';
  end if;

  return query
  select v_project.id, v_project.workspace_id, v_project.name, v_project.description, v_project.is_default, v_project.created_at;
end;
$$;

create or replace function public.delete_project(p_project_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace_id uuid;
  v_is_default boolean;
begin
  select workspace_id, is_default into v_workspace_id, v_is_default
  from public.projects
  where id = p_project_id;

  if v_workspace_id is null then
    raise exception 'Project not found' using errcode='P0002';
  end if;
  if v_is_default then
    raise exception 'Default project cannot be deleted';
  end if;
  if not exists (
    select 1 from public.workspaces w
    where w.id = v_workspace_id and w.owner_user_id = auth.uid()
  ) then
    raise exception 'Permission denied' using errcode='42501';
  end if;

  update public.captures set project_id = null where project_id = p_project_id;
  delete from public.projects where id = p_project_id;
end;
$$;

grant execute on function public.get_workspace_projects(uuid) to authenticated;
grant execute on function public.create_project(uuid, text, text) to authenticated;
grant execute on function public.rename_project(uuid, text, text) to authenticated;
grant execute on function public.delete_project(uuid) to authenticated;
