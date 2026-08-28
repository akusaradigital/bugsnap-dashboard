-- Persisted drag-to-reorder for sidebar folders.
ALTER TABLE public.workspace_folders
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

-- Backfill existing rows: default folder first, then alphabetical.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT DISTINCT workspace_id FROM public.workspace_folders LOOP
    UPDATE public.workspace_folders wf
    SET sort_order = sub.rn
    FROM (
      SELECT id, ROW_NUMBER() OVER (ORDER BY is_default DESC, name ASC) - 1 AS rn
      FROM public.workspace_folders WHERE workspace_id = r.workspace_id
    ) sub
    WHERE wf.id = sub.id;
  END LOOP;
END $$;

-- Upserts sort_order for each folder name in the given order (owner-only).
-- Folders that only exist via captures.folder_name (no workspace_folders row
-- yet) are inserted here so their order persists too.
CREATE OR REPLACE FUNCTION public.reorder_workspace_folders(p_workspace_id UUID, p_folder_names TEXT[])
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_name TEXT;
  v_idx INT := 0;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.workspaces WHERE id = p_workspace_id AND owner_user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Permission denied' USING errcode = '42501';
  END IF;
  FOREACH v_name IN ARRAY p_folder_names LOOP
    INSERT INTO public.workspace_folders (workspace_id, name, sort_order)
    VALUES (p_workspace_id, v_name, v_idx)
    ON CONFLICT (workspace_id, name) DO UPDATE SET sort_order = v_idx;
    v_idx := v_idx + 1;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.reorder_workspace_folders(UUID, TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reorder_workspace_folders(UUID, TEXT[]) TO authenticated;
