-- 20260828100000_notifications_with_capture_link.sql
-- Replace boolean-returning count_unseen_comments with a table-returning RPC
-- that returns one row per notification with capture_id for direct linking.
-- The layout reads capture_id so clicking navigates to /v/<id> not /captures.
-- Notifications older than 7 days are automatically excluded at the DB level.

DROP FUNCTION IF EXISTS public.count_unseen_comments(timestamptz) CASCADE;

CREATE OR REPLACE FUNCTION public.get_unseen_notifications(p_since timestamptz)
RETURNS TABLE (
  comment_id   UUID,
  capture_id   UUID,
  capture_title TEXT,
  author_email  TEXT,
  body          TEXT,
  created_at    TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_email TEXT := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_cutoff TIMESTAMPTZ := NOW() - INTERVAL '7 days';
BEGIN
  IF v_email = '' THEN
    RETURN;
  END IF;
  RETURN QUERY
    SELECT
      c.id           AS comment_id,
      cap.id         AS capture_id,
      cap.title      AS capture_title,
      c.author_email,
      left(c.body, 200) AS body,
      c.created_at
    FROM public.comments c
    JOIN public.captures cap ON cap.id = c.capture_id
    WHERE lower(cap.owner_email) = v_email
      AND c.created_at >= GREATEST(p_since, v_cutoff)
      AND lower(c.author_email) != v_email  -- exclude own comments
    ORDER BY c.created_at DESC
    LIMIT 50;
END;
$$;

REVOKE ALL ON FUNCTION public.get_unseen_notifications(timestamptz) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_unseen_notifications(timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_unseen_notifications(timestamptz) TO authenticated;
