-- Migration: Extension Folder Management RPCs
-- Allows Chrome extension (using anon key + verified user email) to safely create, rename, and delete workspace folders.

-- 1. Insert Folder by Email
CREATE OR REPLACE FUNCTION public.insert_folder_by_email(
  p_email TEXT,
  p_folder_name TEXT,
  p_workspace_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  workspace_id UUID,
  name TEXT,
  drive_folder_id TEXT,
  is_default BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
#variable_conflict use_column
DECLARE
  v_user_id UUID;
  v_ws_id UUID;
  v_folder_clean TEXT := TRIM(p_folder_name);
  v_email_norm TEXT := LOWER(TRIM(p_email));
BEGIN
  IF v_email_norm IS NULL OR v_email_norm = '' THEN
    RAISE EXCEPTION 'p_email is required' USING ERRCODE = '23502';
  END IF;
  IF v_folder_clean IS NULL OR v_folder_clean = '' THEN
    RAISE EXCEPTION 'p_folder_name is required' USING ERRCODE = '23502';
  END IF;

  SELECT prov.out_user_id, prov.out_workspace_id INTO v_user_id, v_ws_id
  FROM public.ensure_user_and_workspace_by_email(v_email_norm) prov;

  IF p_workspace_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = p_workspace_id AND wm.user_id = v_user_id
    ) THEN
      v_ws_id := p_workspace_id;
    END IF;
  END IF;

  IF v_ws_id IS NULL THEN
    RAISE EXCEPTION 'Workspace not found for %', v_email_norm USING ERRCODE = 'P0002';
  END IF;

  RETURN QUERY
  INSERT INTO public.workspace_folders AS wf (workspace_id, name, is_default)
  VALUES (v_ws_id, v_folder_clean, FALSE)
  ON CONFLICT (workspace_id, name) DO UPDATE SET name = EXCLUDED.name
  RETURNING
    wf.id,
    wf.workspace_id,
    wf.name,
    wf.drive_folder_id,
    wf.is_default;
END;
$$;

-- 2. Rename Workspace Folder by Email
CREATE OR REPLACE FUNCTION public.rename_workspace_folder_by_email(
  p_email TEXT,
  p_workspace_id UUID,
  p_old_name TEXT,
  p_new_name TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_old TEXT := TRIM(p_old_name);
  v_new TEXT := TRIM(p_new_name);
  v_email_norm TEXT := LOWER(TRIM(p_email));
BEGIN
  IF v_email_norm IS NULL OR v_email_norm = '' THEN
    RAISE EXCEPTION 'p_email is required' USING ERRCODE = '23502';
  END IF;
  IF v_old IS NULL OR v_old = '' OR v_new IS NULL OR v_new = '' THEN
    RAISE EXCEPTION 'Folder names cannot be empty' USING ERRCODE = '23502';
  END IF;

  SELECT id INTO v_user_id FROM public.users WHERE LOWER(TRIM(email)) = v_email_norm LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found' USING ERRCODE = 'P0002';
  END IF;

  -- Ensure caller is a member with creator or owner role
  IF NOT EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = p_workspace_id AND wm.user_id = v_user_id
      AND wm.role IN ('owner', 'admin', 'creator')
  ) THEN
    RAISE EXCEPTION 'Permission denied' USING ERRCODE = '42501';
  END IF;

  -- Don't rename if default
  IF EXISTS (
    SELECT 1 FROM public.workspace_folders
    WHERE workspace_id = p_workspace_id AND name = v_old AND is_default
  ) THEN
    RAISE EXCEPTION 'Default folder cannot be renamed' USING ERRCODE = '42501';
  END IF;

  UPDATE public.workspace_folders
  SET name = v_new
  WHERE workspace_id = p_workspace_id AND name = v_old;

  UPDATE public.captures
  SET folder_name = v_new
  WHERE workspace_id = p_workspace_id AND folder_name = v_old;
END;
$$;

-- 3. Delete Workspace Folder by Email
CREATE OR REPLACE FUNCTION public.delete_workspace_folder_by_email(
  p_email TEXT,
  p_workspace_id UUID,
  p_folder_name TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_folder_clean TEXT := TRIM(p_folder_name);
  v_email_norm TEXT := LOWER(TRIM(p_email));
BEGIN
  IF v_email_norm IS NULL OR v_email_norm = '' THEN
    RAISE EXCEPTION 'p_email is required' USING ERRCODE = '23502';
  END IF;
  IF v_folder_clean IS NULL OR v_folder_clean = '' THEN
    RAISE EXCEPTION 'Folder name is required' USING ERRCODE = '23502';
  END IF;

  SELECT id INTO v_user_id FROM public.users WHERE LOWER(TRIM(email)) = v_email_norm LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found' USING ERRCODE = 'P0002';
  END IF;

  -- Ensure caller is a member with creator or owner role
  IF NOT EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = p_workspace_id AND wm.user_id = v_user_id
      AND wm.role IN ('owner', 'admin', 'creator')
  ) THEN
    RAISE EXCEPTION 'Permission denied' USING ERRCODE = '42501';
  END IF;

  -- Cannot delete default folder
  IF EXISTS (
    SELECT 1 FROM public.workspace_folders
    WHERE workspace_id = p_workspace_id AND name = v_folder_clean AND is_default
  ) THEN
    RAISE EXCEPTION 'Default folder cannot be deleted' USING ERRCODE = '42501';
  END IF;

  -- Queue drive cleanup
  INSERT INTO public.deleted_drive_folders (workspace_id, folder_name, drive_url)
  SELECT p_workspace_id, v_folder_clean, drive_url FROM public.captures
  WHERE workspace_id = p_workspace_id AND folder_name = v_folder_clean AND drive_url IS NOT NULL;

  -- Delete captures and folder
  DELETE FROM public.captures WHERE workspace_id = p_workspace_id AND folder_name = v_folder_clean;
  DELETE FROM public.workspace_folders WHERE workspace_id = p_workspace_id AND name = v_folder_clean;
END;
$$;

-- Grant execute permissions to anon and authenticated roles
REVOKE ALL ON FUNCTION public.insert_folder_by_email(TEXT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.insert_folder_by_email(TEXT, TEXT, UUID) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.rename_workspace_folder_by_email(TEXT, UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rename_workspace_folder_by_email(TEXT, UUID, TEXT, TEXT) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.delete_workspace_folder_by_email(TEXT, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_workspace_folder_by_email(TEXT, UUID, TEXT) TO anon, authenticated;
