-- Function to set workspace folder color by verified email (for extension API endpoint)
CREATE OR REPLACE FUNCTION public.set_workspace_folder_color_by_email(
  p_email text,
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
  v_user_id uuid;
  v_clean_name text := btrim(p_folder_name);
  v_clean_color text;
  v_email_norm text := lower(btrim(p_email));
BEGIN
  IF v_email_norm IS NULL OR v_email_norm = '' THEN
    RAISE EXCEPTION 'p_email is required' USING errcode = '23502';
  END IF;

  IF v_clean_name IS NULL OR char_length(v_clean_name) = 0 THEN
    RAISE EXCEPTION 'Folder name cannot be empty' USING errcode = '22023';
  END IF;

  SELECT id INTO v_user_id FROM public.users WHERE lower(btrim(email)) = v_email_norm LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found' USING errcode = 'P0002';
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
          AND wm.role IN ('owner', 'admin', 'member', 'creator')
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

REVOKE ALL ON FUNCTION public.set_workspace_folder_color_by_email(text, uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_workspace_folder_color_by_email(text, uuid, text, text) TO authenticated, service_role;
