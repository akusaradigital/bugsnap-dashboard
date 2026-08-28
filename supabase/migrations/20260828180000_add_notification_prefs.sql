alter table public.users
  add column if not exists notification_prefs jsonb not null default '{"comment":true,"mention":true,"digest":true}'::jsonb;

create or replace function public.update_user_notification_prefs(p_prefs jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
  set notification_prefs = coalesce(public.users.notification_prefs, '{}'::jsonb) || p_prefs
  where id = auth.uid();
end;
$$;

grant execute on function public.update_user_notification_prefs(jsonb) to authenticated;
