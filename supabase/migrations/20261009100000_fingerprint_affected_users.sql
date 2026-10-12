-- Add affected_users count to fingerprint occurrence queries.
--
-- Counting rows (COUNT(*)) conflates one person retrying 3 times with 3 different
-- people encountering the same issue. Adding COUNT(DISTINCT owner_email) gives
-- teams the reach signal alongside the raw frequency.
--
-- Purely additive: affected_users is appended as a trailing column to both
-- get_workspace_fingerprint_counts and get_workspace_top_errors.

BEGIN;

-- Drop previous definitions first: PostgreSQL forbids altering the column
-- shape of a RETURNS TABLE function with CREATE OR REPLACE FUNCTION alone.
DROP FUNCTION IF EXISTS public.get_workspace_fingerprint_counts(uuid);
DROP FUNCTION IF EXISTS public.get_workspace_top_errors(uuid, integer);

-- Count per distinct error in one workspace, plus distinct affected users.
CREATE OR REPLACE FUNCTION public.get_workspace_fingerprint_counts(p_workspace_id uuid)
RETURNS TABLE (
  error_fingerprint text,
  occurrences bigint,
  last_seen timestamptz,
  affected_users bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT c.error_fingerprint,
         COUNT(*)::bigint,
         MAX(c.created_at),
         COUNT(DISTINCT c.owner_email)::bigint
  FROM public.captures c
  WHERE c.workspace_id = p_workspace_id
    AND c.error_fingerprint IS NOT NULL
  GROUP BY c.error_fingerprint
  HAVING COUNT(*) > 1   -- a single report is not a recurring bug; no badge for it
$function$;

GRANT EXECUTE ON FUNCTION public.get_workspace_fingerprint_counts(uuid) TO authenticated;

-- One representative capture per distinct error, most frequent first,
-- including distinct affected users count.
CREATE OR REPLACE FUNCTION public.get_workspace_top_errors(
  p_workspace_id uuid,
  p_limit integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  title text,
  type text,
  drive_url text,
  created_at timestamptz,
  site_url text,
  error_fingerprint text,
  occurrences bigint,
  last_seen timestamptz,
  affected_users bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public', 'pg_temp'
AS $function$
  WITH grouped AS (
    SELECT c.error_fingerprint AS fp,
           COUNT(*)::bigint    AS n,
           MAX(c.created_at)   AS seen,
           COUNT(DISTINCT c.owner_email)::bigint AS users
    FROM public.captures c
    WHERE c.workspace_id = p_workspace_id
      AND c.error_fingerprint IS NOT NULL
    GROUP BY c.error_fingerprint
    HAVING COUNT(*) > 1
  ),
  -- The newest capture in each group is the representative: it reflects the
  -- current state of the bug, and its screenshot is the one worth opening.
  newest AS (
    SELECT DISTINCT ON (c.error_fingerprint)
           c.id, c.title, c.type, c.drive_url, c.created_at, c.site_url, c.error_fingerprint
    FROM public.captures c
    JOIN grouped g ON g.fp = c.error_fingerprint
    WHERE c.workspace_id = p_workspace_id
    -- id breaks the tie: captures written in one transaction share created_at
    -- exactly, and without a tiebreak the representative row could differ
    -- between two calls that should agree.
    ORDER BY c.error_fingerprint, c.created_at DESC, c.id DESC
  )
  SELECT n.id, n.title, n.type, n.drive_url, n.created_at, n.site_url,
         n.error_fingerprint, g.n, g.seen, g.users
  FROM newest n
  JOIN grouped g ON g.fp = n.error_fingerprint
  ORDER BY g.n DESC, g.seen DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 20), 1), 100)
$function$;

GRANT EXECUTE ON FUNCTION public.get_workspace_top_errors(uuid, integer) TO authenticated;

COMMIT;
