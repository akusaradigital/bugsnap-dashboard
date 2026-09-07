-- =====================================================================
-- 20260907140000_default_auto_delete_never.sql
-- Set default auto_delete_months to 0 (Never) for workspace_settings
-- =====================================================================

-- 1. Change default value of auto_delete_months to 0 (Never)
ALTER TABLE public.workspace_settings
  ALTER COLUMN auto_delete_months SET DEFAULT 0;

-- 2. Update delete_expired_captures to default to 0 (Never) when null
CREATE OR REPLACE FUNCTION public.delete_expired_captures(p_workspace_id uuid, p_batch_limit int default 100)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_months int;
  v_cutoff timestamptz;
  v_batch int := greatest(1, least(coalesce(p_batch_limit, 100), 1000));
  v_deleted int;
BEGIN
  -- Ownership gate
  IF NOT EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = p_workspace_id AND w.owner_user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Permission denied' USING errcode = '42501';
  END IF;

  -- Retention from workspace; default to 0 (Never)
  SELECT coalesce(auto_delete_months, 0) INTO v_months
  FROM public.workspace_settings
  WHERE workspace_id = p_workspace_id;

  IF coalesce(v_months, 0) = 0 THEN
    RETURN 0;
  END IF;

  v_cutoff := now() - (v_months || ' months')::interval;

  DELETE FROM public.captures
  WHERE id IN (
    SELECT id FROM public.captures
    WHERE workspace_id = p_workspace_id
      AND created_at < v_cutoff
    ORDER BY created_at ASC
    LIMIT v_batch
    FOR UPDATE SKIP LOCKED
  );

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_expired_captures(uuid, int) TO authenticated;
