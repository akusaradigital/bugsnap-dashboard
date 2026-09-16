-- =====================================================================
-- 20260917000000_zero_load_supabase.sql
-- Make Supabase a pure pointer catalog — no raw payloads in DB.
--
-- 1. Add view_count column to captures (increment-in-place)
-- 2. Backfill view_count from capture_views
-- 3. Rewrite record_view  → increment captures.view_count + insert row (dual-write)
-- 4. Rewrite get_view_count → read captures.view_count (O(1), no scan)
-- 5. Purge raw-array dev_logs (convert to count-only pointer)
-- 6. Retention cron helpers: prune capture_views > 90 days, audit_logs > 30 days
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- 1. view_count column
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.captures
  ADD COLUMN IF NOT EXISTS view_count bigint NOT NULL DEFAULT 0;

-- ─────────────────────────────────────────────────────────────────────
-- 2. Backfill from capture_views
-- ─────────────────────────────────────────────────────────────────────
UPDATE public.captures c
SET view_count = sub.cnt
FROM (
  SELECT capture_id, count(*) AS cnt
  FROM public.capture_views
  GROUP BY capture_id
) sub
WHERE c.id = sub.capture_id
  AND c.view_count = 0;

-- ─────────────────────────────────────────────────────────────────────
-- 3. record_view — increment counter + keep row for admin analytics
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.record_view(
  p_capture_id uuid,
  p_ref        text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_key text;
  v_inserted boolean;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.captures WHERE id = p_capture_id) THEN
    RETURN;
  END IF;

  IF (SELECT auth.uid()) IS NOT NULL THEN
    v_key := encode(extensions.digest((SELECT auth.uid())::text, 'sha256'), 'hex');
  ELSE
    v_key := encode(extensions.digest(public.client_ip() || ':anon', 'sha256'), 'hex');
  END IF;

  INSERT INTO public.capture_views(capture_id, viewer_ref, viewer_key)
  VALUES (p_capture_id, left(p_ref, 200), v_key)
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  -- Only increment when the row was actually new (dedup upheld).
  IF v_inserted THEN
    UPDATE public.captures SET view_count = view_count + 1 WHERE id = p_capture_id;
  END IF;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 4. get_view_count — O(1) column read instead of count(*) scan
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_view_count(p_capture_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(view_count, 0) FROM public.captures WHERE id = p_capture_id;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 5. Purge raw dev_logs arrays — replace with count-only pointer
--    (captures that have a Drive pointer are left as-is)
-- ─────────────────────────────────────────────────────────────────────
UPDATE public.captures
SET dev_logs = jsonb_build_object(
  'errors',    COALESCE((
    SELECT count(*)
    FROM jsonb_array_elements(dev_logs) AS el
    WHERE (el->>'level') = 'error'
       OR (el->>'status')::int >= 400
  ), 0),
  'warnings',  COALESCE((
    SELECT count(*)
    FROM jsonb_array_elements(dev_logs) AS el
    WHERE (el->>'level') = 'warn'
  ), 0),
  'totalLogs', jsonb_array_length(dev_logs),
  'migratedAt', to_char(now(), 'YYYY-MM-DD')
)
WHERE dev_logs IS NOT NULL
  AND jsonb_typeof(dev_logs) = 'array';

-- ─────────────────────────────────────────────────────────────────────
-- 6a. Prune capture_views rows older than 90 days
--     (view_count column is the durable tally — rows are only for admin charts)
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.prune_capture_views()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  DELETE FROM public.capture_views
  WHERE viewed_at < now() - interval '90 days';
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 6b. prune_admin_logs already exists — ensure 30-day cutoff is enforced.
--     Re-create to be explicit (idempotent).
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.prune_admin_logs()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  DELETE FROM public.audit_logs  WHERE created_at < now() - interval '30 days';
  DELETE FROM public.rate_limits WHERE created_at < now() - interval '7 days';
$$;

-- ─────────────────────────────────────────────────────────────────────
-- Grants (prune functions are server-side only — no public access)
-- ─────────────────────────────────────────────────────────────────────
REVOKE ALL ON FUNCTION public.prune_capture_views() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.prune_admin_logs()    FROM PUBLIC;
