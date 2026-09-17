-- =====================================================================
-- 20260917100000_fix_create_workspace_slug.sql
-- Fix: create_workspace was missing slug generation and SECURITY DEFINER,
-- causing 400 errors on INSERT (slug column has no DEFAULT).
-- =====================================================================

CREATE OR REPLACE FUNCTION public.create_workspace(p_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ws_id uuid;
  v_slug  text;
BEGIN
  IF char_length(btrim(p_name)) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION 'Workspace name must be between 1 and 200 characters'
      USING errcode = '23502';
  END IF;

  v_slug := lower(regexp_replace(btrim(p_name), '[^a-zA-Z0-9]+', '-', 'g'))
            || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 8);

  INSERT INTO public.workspaces (name, slug, owner_user_id)
  VALUES (btrim(p_name), v_slug, auth.uid())
  RETURNING id INTO v_ws_id;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (v_ws_id, auth.uid(), 'owner')
  ON CONFLICT (workspace_id, user_id) DO NOTHING;

  RETURN v_ws_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_workspace(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_workspace(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_workspace(text) TO authenticated;
