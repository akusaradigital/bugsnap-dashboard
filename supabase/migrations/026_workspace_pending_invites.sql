create table if not exists public.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role text not null default 'member',
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create unique index if not exists workspace_invites_workspace_email_idx
  on public.workspace_invites (workspace_id, lower(email));

alter table public.workspace_invites enable row level security;

drop policy if exists "workspace invites owner select" on public.workspace_invites;
drop policy if exists "workspace invites owner delete" on public.workspace_invites;
create policy "workspace invites owner select" on public.workspace_invites
  for select using (
    exists (
      select 1 from public.workspaces w
      where w.id = workspace_id and w.owner_user_id = auth.uid()
    )
  );
create policy "workspace invites owner delete" on public.workspace_invites
  for delete using (
    exists (
      select 1 from public.workspaces w
      where w.id = workspace_id and w.owner_user_id = auth.uid()
    )
  );

drop function if exists public.invite_member_by_email(uuid, text) cascade;
create or replace function public.invite_member_by_email(p_workspace_id uuid, p_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_email text := lower(btrim(p_email));
begin
  if v_email = '' then
    raise exception 'Email is required';
  end if;

  if not exists (
    select 1 from public.workspaces w
    where w.id = p_workspace_id and w.owner_user_id = auth.uid()
  ) then
    raise exception 'You are not the owner of this workspace';
  end if;

  select id into v_user_id from auth.users where lower(email) = v_email;

  if v_user_id is null then
    insert into public.workspace_invites (workspace_id, email, role, invited_by, created_at)
    values (p_workspace_id, v_email, 'member', auth.uid(), now())
    on conflict (workspace_id, lower(email)) do update
      set invited_by = excluded.invited_by,
          created_at = now(),
          accepted_at = null;
    return 'pending';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role, joined_at)
  values (p_workspace_id, v_user_id, 'member', now())
  on conflict (workspace_id, user_id) do nothing;

  update public.workspace_invites
  set accepted_at = now()
  where workspace_id = p_workspace_id and lower(email) = v_email and accepted_at is null;

  return 'added';
end;
$$;

grant execute on function public.invite_member_by_email(uuid, text) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        avatar_url = excluded.avatar_url;

  insert into public.workspace_members (workspace_id, user_id, role, joined_at)
  select i.workspace_id, new.id, coalesce(i.role, 'member'), now()
  from public.workspace_invites i
  where lower(i.email) = lower(new.email)
    and i.accepted_at is null
  on conflict (workspace_id, user_id) do nothing;

  update public.workspace_invites
  set accepted_at = now()
  where lower(email) = lower(new.email)
    and accepted_at is null;

  return new;
end;
$$;
