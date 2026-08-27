-- =====================================================================
-- 20260827110000_finalize_rpc_signatures.sql
-- Finalized, clean signatures for insert_capture_by_email & workspace queries
-- =====================================================================

DROP FUNCTION IF EXISTS public.insert_capture_by_email(TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, UUID) CASCADE;

CREATE OR REPLACE FUNCTION public.insert_capture_by_email(
  p_owner_email  TEXT,
  p_title        TEXT    DEFAULT 'Untitled',
  p_type         TEXT    DEFAULT 'screenshot',
  p_drive_url    TEXT    DEFAULT '',
  p_dev_logs     JSONB   DEFAULT '[]'::jsonb,
  p_window_size  TEXT    DEFAULT NULL,
  p_description  TEXT    DEFAULT NULL,
  p_duration     INTEGER DEFAULT NULL,
  p_os           TEXT    DEFAULT NULL,
  p_browser      TEXT    DEFAULT NULL,
  p_site_url     TEXT    DEFAULT NULL,
  p_folder_name  TEXT    DEFAULT NULL,
  p_workspace_id UUID    DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id      UUID;
  v_workspace_id UUID;
  v_capture_id   UUID;
  v_email_norm   TEXT := LOWER(TRIM(p_owner_email));
  v_folder_clean TEXT := NULLIF(TRIM(p_folder_name), '');
BEGIN
  IF v_email_norm IS NULL OR v_email_norm = '' THEN
    RAISE EXCEPTION 'owner_email is required' USING ERRCODE = '23502';
  END IF;

  SELECT u.id INTO v_user_id
  FROM public.users u
  WHERE LOWER(TRIM(u.email)) = v_email_norm
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No BugSnap account found for %. Please sign in to the dashboard once with this Google account, then capture again.', v_email_norm USING ERRCODE = 'P0002';
  END IF;

  -- If workspace_id is provided, verify membership
  IF p_workspace_id IS NOT NULL THEN
    SELECT w.id INTO v_workspace_id
    FROM public.workspaces w
    JOIN public.workspace_members wm ON wm.workspace_id = w.id
    WHERE wm.user_id = v_user_id AND w.id = p_workspace_id
    LIMIT 1;
  END IF;

  -- Fallback to default user workspace if none or invalid
  IF v_workspace_id IS NULL THEN
    SELECT w.id INTO v_workspace_id
    FROM public.workspaces w
    JOIN public.workspace_members wm ON wm.workspace_id = w.id
    WHERE wm.user_id = v_user_id
    ORDER BY (wm.role = 'owner') DESC, w.created_at ASC
    LIMIT 1;
  END IF;

  IF v_workspace_id IS NULL THEN 
    RAISE EXCEPTION 'No workspace found for user %', v_email_norm USING ERRCODE = 'P0002'; 
  END IF;

  -- If folder_name is provided and not default, ensure folder exists
  IF v_folder_clean IS NOT NULL AND v_folder_clean <> 'No folder' THEN
    INSERT INTO public.workspace_folders (workspace_id, name, is_default)
    VALUES (v_workspace_id, v_folder_clean, FALSE)
    ON CONFLICT (workspace_id, name) DO NOTHING;
  END IF;

  INSERT INTO public.captures (
    workspace_id, user_id, owner_email, title, type, drive_url, dev_logs, window_size, description, duration, os, browser, site_url, folder_name
  ) VALUES (
    v_workspace_id, v_user_id, v_email_norm,
    COALESCE(NULLIF(TRIM(p_title), ''), 'Untitled'),
    p_type,
    p_drive_url,
    COALESCE(p_dev_logs, '[]'::jsonb),
    p_window_size,
    p_description,
    p_duration,
    p_os,
    p_browser,
    p_site_url,
    v_folder_clean
  )
  RETURNING id INTO v_capture_id;

  RETURN v_capture_id;
END;
$$;

REVOKE ALL ON FUNCTION public.insert_capture_by_email(TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.insert_capture_by_email(TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, UUID) TO anon, authenticated;

-- get_workspaces_by_email
DROP FUNCTION IF EXISTS public.get_workspaces_by_email(TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.get_workspaces_by_email(p_email TEXT)
RETURNS TABLE(id UUID, name TEXT, role TEXT, is_owner BOOLEAN)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    w.id,
    w.name,
    wm.role,
    (wm.role = 'owner') AS is_owner
  FROM public.workspaces w
  JOIN public.workspace_members wm ON wm.workspace_id = w.id
  JOIN public.users u ON u.id = wm.user_id
  WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(p_email))
  ORDER BY is_owner DESC, w.created_at ASC;
$$;

REVOKE ALL ON FUNCTION public.get_workspaces_by_email(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_workspaces_by_email(TEXT) TO anon, authenticated;

-- get_folders_by_workspace_and_email
DROP FUNCTION IF EXISTS public.get_folders_by_workspace_and_email(TEXT, UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.get_folders_by_workspace_and_email(p_email TEXT, p_workspace_id UUID)
RETURNS TABLE (id UUID, workspace_id UUID, name TEXT, drive_folder_id TEXT, is_default BOOLEAN)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT wf.id, wf.workspace_id, wf.name, wf.drive_folder_id, wf.is_default
  FROM public.workspace_folders wf
  JOIN public.workspace_members wm ON wm.workspace_id = wf.workspace_id
  JOIN public.users u ON u.id = wm.user_id
  WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(p_email))
    AND wf.workspace_id = p_workspace_id
  ORDER BY wf.is_default DESC, wf.name ASC;
$$;

REVOKE ALL ON FUNCTION public.get_folders_by_workspace_and_email(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_folders_by_workspace_and_email(TEXT, UUID) TO anon, authenticated;
