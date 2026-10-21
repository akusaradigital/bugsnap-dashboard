-- Add color column to workspace_folders and support folder color customization like Google Drive
ALTER TABLE public.workspace_folders
  ADD COLUMN IF NOT EXISTS color text DEFAULT null;

-- Set folder color RPC (Security Definer with workspace member authorization)
CREATE OR REPLACE FUNCTION public.set_workspace_folder_color(
  p_workspace_id uuid,
  p_folder_name text,
  p_color text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_clean_name text := btrim(p_folder_name);
  v_clean_color text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING errcode = '42501';
  END IF;

  IF v_clean_name IS NULL OR char_length(v_clean_name) = 0 THEN
    RAISE EXCEPTION 'Folder name cannot be empty' USING errcode = '22023';
  END IF;

  -- Validate hex color or null (e.g. #ef4444 or null to reset)
  IF p_color IS NOT NULL AND btrim(p_color) <> '' THEN
    v_clean_color := lower(btrim(p_color));
    IF v_clean_color !~ '^#[0-9a-f]{6}$' THEN
      RAISE EXCEPTION 'Invalid color format, must be 6-character hex like #ef4444' USING errcode = '22023';
    END IF;
  ELSE
    v_clean_color := NULL;
  END IF;

  -- Check workspace membership with editor/admin/owner permissions
  IF NOT EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = p_workspace_id AND (
      w.owner_user_id = v_user_id
      OR EXISTS (
        SELECT 1 FROM public.workspace_members wm
        WHERE wm.workspace_id = p_workspace_id
          AND wm.user_id = v_user_id
          AND wm.role IN ('owner', 'admin', 'member')
      )
    )
  ) THEN
    RAISE EXCEPTION 'Permission denied' USING errcode = '42501';
  END IF;

  -- Upsert into workspace_folders
  INSERT INTO public.workspace_folders (workspace_id, name, color)
  VALUES (p_workspace_id, v_clean_name, v_clean_color)
  ON CONFLICT (workspace_id, name)
  DO UPDATE SET color = EXCLUDED.color;
END;
$$;

REVOKE ALL ON FUNCTION public.set_workspace_folder_color(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_workspace_folder_color(uuid, text, text) TO authenticated, service_role;

-- Update get_folders_by_workspace_and_email to include color
DROP FUNCTION IF EXISTS public.get_folders_by_workspace_and_email(text, uuid);
CREATE OR REPLACE FUNCTION public.get_folders_by_workspace_and_email(p_email text, p_workspace_id uuid)
RETURNS TABLE(id uuid, workspace_id uuid, name text, drive_folder_id text, is_default boolean, color text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT wf.id, wf.workspace_id, wf.name, wf.drive_folder_id, wf.is_default, wf.color
  FROM public.workspace_folders wf
  JOIN public.workspace_members wm ON wm.workspace_id = wf.workspace_id
  JOIN public.users u ON u.id = wm.user_id
  WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(p_email))
    AND wf.workspace_id = p_workspace_id
  ORDER BY wf.is_default DESC, wf.name ASC;
$$;

REVOKE ALL ON FUNCTION public.get_folders_by_workspace_and_email(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_folders_by_workspace_and_email(text, uuid) TO anon, authenticated, service_role;

-- Update get_folders_by_email to include color
DROP FUNCTION IF EXISTS public.get_folders_by_email(text);
CREATE OR REPLACE FUNCTION public.get_folders_by_email(p_email text)
RETURNS TABLE(id uuid, workspace_id uuid, name text, drive_folder_id text, is_default boolean, color text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
#variable_conflict use_column
DECLARE
  v_workspace_ids UUID[];
BEGIN
  SELECT array_agg(DISTINCT wm.workspace_id) INTO v_workspace_ids
  FROM public.workspace_members wm
  JOIN public.users u ON u.id = wm.user_id
  WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(p_email));

  IF v_workspace_ids IS NULL OR array_length(v_workspace_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.workspace_folders (workspace_id, name)
  SELECT DISTINCT c.workspace_id, c.folder_name
  FROM public.captures c
  WHERE c.workspace_id = ANY(v_workspace_ids)
    AND c.folder_name IS NOT NULL
    AND c.folder_name <> ''
  ON CONFLICT (workspace_id, name) DO NOTHING;

  RETURN QUERY
  SELECT wf.id, wf.workspace_id, wf.name, wf.drive_folder_id, wf.is_default, wf.color
  FROM public.workspace_folders wf
  WHERE wf.workspace_id = ANY(v_workspace_ids)
  ORDER BY wf.is_default DESC, wf.name ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_folders_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_folders_by_email(text) TO anon, authenticated, service_role;
