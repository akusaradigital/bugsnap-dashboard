-- 025_add_theme_to_users.sql - Add theme settings column and RPC
alter table public.users
  add column if not exists theme text not null default 'system'
  constraint users_theme_check check (theme in ('light', 'dark', 'system'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, avatar_url, theme)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    'system'
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

create or replace function public.update_user_theme(p_theme text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_theme not in ('light', 'dark', 'system') then
    raise exception 'Invalid theme';
  end if;

  update public.users
  set theme = p_theme
  where id = auth.uid();
end;
$$;

grant execute on function public.update_user_theme(text) to authenticated;
