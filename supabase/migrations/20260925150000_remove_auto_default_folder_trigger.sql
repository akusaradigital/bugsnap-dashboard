-- Migration: 20260925150000_remove_auto_default_folder_trigger.sql
-- Remove automatic default folder creation on workspace creation.
-- Workspaces start clean with only the root "Captures" (All Captures) view.
-- Folders are only created when the user explicitly clicks "+ Create".

-- 1. Drop the auto-default-folder trigger on workspaces
DROP TRIGGER IF EXISTS on_workspace_created_default_folder ON public.workspaces;

-- 2. Allow owners to delete folders even if marked is_default (remove 'Default folder cannot be deleted' restriction)
CREATE OR REPLACE FUNCTION public.delete_workspace_folder(p_workspace_id UUID, p_folder_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.workspaces WHERE id = p_workspace_id AND owner_user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Permission denied' USING errcode = '42501';
  END IF;

  INSERT INTO public.deleted_drive_folders(workspace_id, folder_name, drive_url)
  SELECT p_workspace_id, p_folder_name, drive_url FROM public.captures
  WHERE workspace_id = p_workspace_id AND folder_name = p_folder_name AND drive_url IS NOT NULL;

  DELETE FROM public.captures WHERE workspace_id = p_workspace_id AND folder_name = p_folder_name;
  DELETE FROM public.workspace_folders WHERE workspace_id = p_workspace_id AND name = p_folder_name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_workspace_folder(UUID, TEXT) TO authenticated, service_role;

-- 3. Clean up the auto-generated empty folder from QA Team workspace
DELETE FROM public.workspace_folders
WHERE workspace_id = '58400de4-be1b-429d-9884-cffea454a486' AND name = 'Wahyu Priyono';
