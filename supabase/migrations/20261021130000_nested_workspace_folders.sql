-- Add parent_id column to workspace_folders to support nested subfolders (parent-child tree)
ALTER TABLE public.workspace_folders
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.workspace_folders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_workspace_folders_parent_id
  ON public.workspace_folders (parent_id);

-- Update get_folders_by_email to include parent_id
DROP FUNCTION IF EXISTS public.get_folders_by_email(text);
CREATE OR REPLACE FUNCTION public.get_folders_by_email(p_email text)
 RETURNS TABLE(id uuid, workspace_id uuid, name text, drive_folder_id text, is_default boolean, color text, parent_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
  SELECT wf.id, wf.workspace_id, wf.name, wf.drive_folder_id, wf.is_default, wf.color, wf.parent_id
  FROM public.workspace_folders wf
  WHERE wf.workspace_id = ANY(v_workspace_ids)
  ORDER BY wf.is_default DESC, wf.name ASC;
END;
$function$;

-- Update get_folders_by_workspace_and_email to include parent_id
DROP FUNCTION IF EXISTS public.get_folders_by_workspace_and_email(text, uuid);
CREATE OR REPLACE FUNCTION public.get_folders_by_workspace_and_email(p_email text, p_workspace_id uuid)
 RETURNS TABLE(id uuid, workspace_id uuid, name text, drive_folder_id text, is_default boolean, color text, parent_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT wf.id, wf.workspace_id, wf.name, wf.drive_folder_id, wf.is_default, wf.color, wf.parent_id
  FROM public.workspace_folders wf
  JOIN public.workspace_members wm ON wm.workspace_id = wf.workspace_id
  JOIN public.users u ON u.id = wm.user_id
  WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(p_email))
    AND wf.workspace_id = p_workspace_id
  ORDER BY wf.is_default DESC, wf.name ASC;
$function$;

-- Set folder parent RPC (Security Definer with cycle prevention and membership validation)
CREATE OR REPLACE FUNCTION public.set_workspace_folder_parent(
  p_workspace_id uuid,
  p_folder_id uuid,
  p_parent_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_curr_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING errcode = '42501';
  END IF;

  -- Cannot be parent of itself
  IF p_parent_id IS NOT NULL AND p_folder_id = p_parent_id THEN
    RAISE EXCEPTION 'A folder cannot be its own parent' USING errcode = '22023';
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

  -- Prevent circular dependency
  IF p_parent_id IS NOT NULL THEN
    v_curr_id := p_parent_id;
    WHILE v_curr_id IS NOT NULL LOOP
      IF v_curr_id = p_folder_id THEN
        RAISE EXCEPTION 'Circular folder nesting is not allowed' USING errcode = '22023';
      END IF;
      SELECT parent_id INTO v_curr_id FROM public.workspace_folders WHERE id = v_curr_id AND workspace_id = p_workspace_id;
    END LOOP;
  END IF;

  UPDATE public.workspace_folders
  SET parent_id = p_parent_id
  WHERE id = p_folder_id AND workspace_id = p_workspace_id;
END;
$$;
