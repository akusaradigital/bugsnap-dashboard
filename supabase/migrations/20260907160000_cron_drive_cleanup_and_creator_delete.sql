-- =====================================================================
-- 20260907160000_cron_drive_cleanup_and_creator_delete.sql
-- 1. Support creator or workspace owner deletion in delete_capture_with_audit
-- 2. Provide get_expired_captures_batch for automated Google Drive cleanup cron
-- =====================================================================

-- 1. Enhanced delete_capture_with_audit allowing both workspace owner and capture creator
CREATE OR REPLACE FUNCTION public.delete_capture_with_audit(
  p_operation_id uuid,
  p_capture_id uuid,
  p_user_id uuid,
  p_mode text,
  p_drive_file_id text default null
)
RETURNS TABLE(capture_id uuid, outcome text, error text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  existing public.capture_delete_audit%rowtype;
  target public.captures%rowtype;
BEGIN
  IF p_mode NOT IN ('drive_trash', 'app_only', 'mazway_only') THEN
    RAISE EXCEPTION 'Invalid deletion mode';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text || ':' || p_capture_id::text, 0));

  SELECT * INTO existing
  FROM public.capture_delete_audit audit
  WHERE audit.operation_id = p_operation_id AND audit.capture_id = p_capture_id;
  IF FOUND THEN
    RETURN QUERY SELECT existing.capture_id, existing.outcome, existing.error;
    RETURN;
  END IF;

  -- Allow deletion if user is the workspace owner OR the capture creator
  SELECT captures.* INTO target
  FROM public.captures captures
  LEFT JOIN public.workspaces workspaces ON workspaces.id = captures.workspace_id
  WHERE captures.id = p_capture_id
    AND (workspaces.owner_user_id = p_user_id OR captures.user_id = p_user_id)
  FOR UPDATE OF captures;

  IF NOT FOUND THEN
    INSERT INTO public.capture_delete_audit(operation_id, capture_id, user_id, mode, outcome, drive_file_id, error)
    VALUES (p_operation_id, p_capture_id, p_user_id, p_mode, 'failed', p_drive_file_id, 'Not found or not owned')
    RETURNING capture_delete_audit.capture_id, capture_delete_audit.outcome, capture_delete_audit.error
    INTO capture_id, outcome, error;
    RETURN NEXT;
    RETURN;
  END IF;

  DELETE FROM public.captures WHERE id = target.id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Capture deletion affected no rows';
  END IF;

  INSERT INTO public.capture_delete_audit(operation_id, capture_id, workspace_id, user_id, mode, outcome, drive_file_id)
  VALUES (p_operation_id, p_capture_id, target.workspace_id, p_user_id, p_mode, 'deleted', p_drive_file_id)
  RETURNING capture_delete_audit.capture_id, capture_delete_audit.outcome, capture_delete_audit.error
  INTO capture_id, outcome, error;
  RETURN NEXT;
END;
$$;

ALTER FUNCTION public.delete_capture_with_audit(uuid, uuid, uuid, text, text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.delete_capture_with_audit(uuid, uuid, uuid, text, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_capture_with_audit(uuid, uuid, uuid, text, text) TO service_role;

-- 2. Procedure for background cron to fetch candidate expired captures for Drive trashing + pruning
CREATE OR REPLACE FUNCTION public.get_expired_captures_batch(p_batch_limit int default 100)
RETURNS TABLE (
  capture_id uuid,
  workspace_id uuid,
  owner_user_id uuid,
  user_id uuid,
  drive_file_id text,
  drive_url text,
  dev_logs jsonb,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS capture_id,
    c.workspace_id,
    w.owner_user_id,
    c.user_id,
    c.drive_file_id,
    c.drive_url,
    c.dev_logs,
    c.created_at
  FROM public.workspace_settings ws
  JOIN public.workspaces w ON w.id = ws.workspace_id
  JOIN public.captures c ON c.workspace_id = ws.workspace_id
  WHERE ws.auto_delete_months IN (3, 6, 12)
    AND c.created_at < now() - (ws.auto_delete_months || ' months')::interval
  ORDER BY c.created_at ASC
  LIMIT GREATEST(1, LEAST(COALESCE(p_batch_limit, 100), 500));
END;
$$;

REVOKE ALL ON FUNCTION public.get_expired_captures_batch(int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_expired_captures_batch(int) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_expired_captures_batch(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_expired_captures_batch(int) TO service_role;
