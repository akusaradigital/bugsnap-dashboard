-- Dashboard-owned folders shared by dashboard and extension.
ALTER TABLE public.workspace_folders
  ADD COLUMN IF NOT EXISTS drive_folder_id TEXT,
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_workspace_default_folder
  ON public.workspace_folders (workspace_id) WHERE is_default;

CREATE OR REPLACE FUNCTION public.ensure_workspace_default_folder(p_workspace_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_folder_id UUID;
  v_name TEXT;
BEGIN
  SELECT id INTO v_folder_id FROM public.workspace_folders
  WHERE workspace_id = p_workspace_id AND is_default LIMIT 1;
  IF v_folder_id IS NOT NULL THEN RETURN v_folder_id; END IF;

  SELECT COALESCE(NULLIF(TRIM(u.full_name), ''), split_part(u.email, '@', 1), 'Personal')
  INTO v_name
  FROM public.workspaces w JOIN public.users u ON u.id = w.owner_user_id
  WHERE w.id = p_workspace_id;

  INSERT INTO public.workspace_folders(workspace_id, name, is_default)
  VALUES (p_workspace_id, COALESCE(v_name, 'Personal'), TRUE)
  ON CONFLICT (workspace_id, name) DO UPDATE SET is_default = TRUE
  RETURNING id INTO v_folder_id;
  RETURN v_folder_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_workspace_default_folder()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.ensure_workspace_default_folder(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_workspace_created_default_folder ON public.workspaces;
CREATE TRIGGER on_workspace_created_default_folder
  AFTER INSERT ON public.workspaces FOR EACH ROW
  EXECUTE FUNCTION public.handle_workspace_default_folder();

DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT id FROM public.workspaces LOOP
    PERFORM public.ensure_workspace_default_folder(r.id);
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS public.get_folders_by_email(TEXT);
CREATE FUNCTION public.get_folders_by_email(p_email TEXT)
RETURNS TABLE (id UUID, workspace_id UUID, name TEXT, drive_folder_id TEXT, is_default BOOLEAN)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT wf.id, wf.workspace_id, wf.name, wf.drive_folder_id, wf.is_default
  FROM public.workspace_folders wf
  JOIN public.workspace_members wm ON wm.workspace_id = wf.workspace_id
  JOIN public.users u ON u.id = wm.user_id
  WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(p_email))
  ORDER BY wf.is_default DESC, wf.name ASC;
$$;

CREATE OR REPLACE FUNCTION public.link_folder_drive_id(p_email TEXT, p_folder_name TEXT, p_drive_folder_id TEXT)
RETURNS TABLE (name TEXT, drive_folder_id TEXT)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.workspace_folders wf
  SET drive_folder_id = p_drive_folder_id
  FROM public.workspace_members wm JOIN public.users u ON u.id = wm.user_id
  WHERE wf.workspace_id = wm.workspace_id
    AND LOWER(TRIM(u.email)) = LOWER(TRIM(p_email))
    AND wf.name = TRIM(p_folder_name)
  RETURNING wf.name, wf.drive_folder_id;
$$;

CREATE OR REPLACE FUNCTION public.delete_workspace_folder(p_workspace_id UUID, p_folder_name TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.workspace_folders WHERE workspace_id=p_workspace_id AND name=p_folder_name AND is_default) THEN
    RAISE EXCEPTION 'Default folder cannot be deleted';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.workspaces WHERE id=p_workspace_id AND owner_user_id=auth.uid()) THEN
    RAISE EXCEPTION 'Permission denied' USING errcode='42501';
  END IF;
  INSERT INTO public.deleted_drive_folders(workspace_id,folder_name,drive_url)
  SELECT p_workspace_id,p_folder_name,drive_url FROM public.captures
  WHERE workspace_id=p_workspace_id AND folder_name=p_folder_name AND drive_url IS NOT NULL;
  DELETE FROM public.captures WHERE workspace_id=p_workspace_id AND folder_name=p_folder_name;
  DELETE FROM public.workspace_folders WHERE workspace_id=p_workspace_id AND name=p_folder_name;
END;
$$;

REVOKE ALL ON FUNCTION public.get_folders_by_email(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_folders_by_email(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.link_folder_drive_id(TEXT,TEXT,TEXT) TO anon, authenticated;
