-- 20260828110000_add_workspace_avatar.sql
-- Add avatar_url to workspaces to allow custom workspace icons

ALTER TABLE public.workspaces 
  ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL;

-- Update get_workspaces_by_email RPC to include avatar_url
DROP FUNCTION IF EXISTS public.get_workspaces_by_email(TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.get_workspaces_by_email(p_email TEXT)
RETURNS TABLE(id UUID, name TEXT, role TEXT, is_owner BOOLEAN, avatar_url TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_email_norm TEXT := LOWER(TRIM(p_email));
  v_user_id UUID;
  v_workspace_id UUID;
BEGIN
  IF v_email_norm IS NULL OR v_email_norm = '' THEN
    RETURN;
  END IF;

  -- Auto-provision user & workspace if not present
  SELECT prov.user_id, prov.workspace_id INTO v_user_id, v_workspace_id
  FROM public.ensure_user_and_workspace_by_email(v_email_norm) prov;

  RETURN QUERY
  SELECT
    w.id,
    w.name,
    wm.role,
    (wm.role = 'owner') AS is_owner,
    w.avatar_url
  FROM public.workspaces w
  JOIN public.workspace_members wm ON wm.workspace_id = w.id
  WHERE wm.user_id = v_user_id
  ORDER BY is_owner DESC, w.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_workspaces_by_email(TEXT) TO anon, authenticated;

-- Update get_my_workspaces RPC to include avatar_url
DROP FUNCTION IF EXISTS public.get_my_workspaces() CASCADE;
CREATE OR REPLACE FUNCTION public.get_my_workspaces()
RETURNS TABLE(id UUID, name TEXT, role TEXT, is_owner BOOLEAN, avatar_url TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    w.id,
    w.name,
    wm.role,
    (wm.role = 'owner') AS is_owner,
    w.avatar_url
  FROM public.workspaces w
  JOIN public.workspace_members wm ON wm.workspace_id = w.id
  WHERE wm.user_id = auth.uid()
  ORDER BY is_owner DESC, w.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_workspaces() TO authenticated;
