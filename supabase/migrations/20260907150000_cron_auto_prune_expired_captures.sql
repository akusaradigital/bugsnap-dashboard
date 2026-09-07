-- =====================================================================
-- 20260907150000_cron_auto_prune_expired_captures.sql
-- Automated background pruning of captures older than workspace retention window
-- =====================================================================

CREATE OR REPLACE FUNCTION public.auto_prune_all_expired_captures(p_batch_limit int default 500)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_total_deleted int := 0;
  v_ws record;
  v_deleted int;
  v_cutoff timestamptz;
  v_limit int := greatest(1, least(coalesce(p_batch_limit, 500), 2000));
BEGIN
  -- Scan all workspaces that have active retention (3, 6, 12 months)
  -- 0 = Never (skipped)
  FOR v_ws IN
    SELECT workspace_id, auto_delete_months
    FROM public.workspace_settings
    WHERE auto_delete_months IN (3, 6, 12)
  LOOP
    v_cutoff := now() - (v_ws.auto_delete_months || ' months')::interval;

    DELETE FROM public.captures
    WHERE id IN (
      SELECT id FROM public.captures
      WHERE workspace_id = v_ws.workspace_id
        AND created_at < v_cutoff
      ORDER BY created_at ASC
      LIMIT v_limit
      FOR UPDATE SKIP LOCKED
    );

    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    v_total_deleted := v_total_deleted + v_deleted;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'total_deleted', v_total_deleted,
    'timestamp', now()
  );
END;
$$;

-- Alias for weekly-digest route or callers
CREATE OR REPLACE FUNCTION public.prune_expired_captures()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.auto_prune_all_expired_captures(500);
$$;

-- Permissions
REVOKE ALL ON FUNCTION public.auto_prune_all_expired_captures(int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.auto_prune_all_expired_captures(int) FROM anon;
GRANT EXECUTE ON FUNCTION public.auto_prune_all_expired_captures(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_prune_all_expired_captures(int) TO service_role;

REVOKE ALL ON FUNCTION public.prune_expired_captures() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.prune_expired_captures() FROM anon;
GRANT EXECUTE ON FUNCTION public.prune_expired_captures() TO authenticated;
GRANT EXECUTE ON FUNCTION public.prune_expired_captures() TO service_role;
