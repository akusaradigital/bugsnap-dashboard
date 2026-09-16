create or replace function public.move_capture_to_workspace_folder(
  p_capture_id uuid,
  p_target_workspace_id uuid,
  p_target_folder_name text default null
)
returns public.captures
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_capture public.captures%rowtype;
  v_target_folder text := nullif(btrim(coalesce(p_target_folder_name, '')), '');
begin
  select * into v_capture
  from public.captures
  where id = p_capture_id;

  if v_capture.id is null then
    raise exception 'Capture not found' using errcode = 'P0002';
  end if;

  -- Verify caller has non-viewer access to source workspace
  if not exists (
    select 1 from public.workspaces w
    where w.id = v_capture.workspace_id and w.owner_user_id = auth.uid()
  ) and not exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = v_capture.workspace_id
      and wm.user_id = auth.uid()
      and coalesce(wm.role, '') <> 'viewer'
  ) then
    raise exception 'Permission denied for source workspace' using errcode = '42501';
  end if;

  -- Verify caller has non-viewer access to target workspace
  if not exists (
    select 1 from public.workspaces w
    where w.id = p_target_workspace_id and w.owner_user_id = auth.uid()
  ) and not exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = p_target_workspace_id
      and wm.user_id = auth.uid()
      and coalesce(wm.role, '') <> 'viewer'
  ) then
    raise exception 'Permission denied for target workspace' using errcode = '42501';
  end if;

  -- Ensure target folder exists in workspace_folders if specified
  if v_target_folder is not null then
    insert into public.workspace_folders (workspace_id, name, is_default)
    values (p_target_workspace_id, v_target_folder, false)
    on conflict (workspace_id, name) do nothing;
  end if;

  update public.captures
  set workspace_id = p_target_workspace_id,
      folder_name = v_target_folder,
      project_id = null
  where id = p_capture_id
  returning * into v_capture;

  return v_capture;
end;
$$;

grant execute on function public.move_capture_to_workspace_folder(uuid, uuid, text) to authenticated;
