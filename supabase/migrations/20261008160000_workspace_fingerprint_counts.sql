-- Badge on the capture grid, and ordering by how often a bug actually happens.
--
-- The grid pages with a keyset cursor on (created_at, id), so it cannot simply
-- ORDER BY an aggregate: occurrence count is not a column, and mixing it into
-- that cursor would break pagination. Two separate pieces instead:
--
--   get_workspace_fingerprint_counts() - one cheap call per workspace that the
--     grid joins client-side to render badges. Backed by the partial index, so
--     it is an index-only scan (verified: Index Only Scan using
--     idx_captures_workspace_fingerprint).
--
--   get_workspace_top_errors() - server-side ranking for "most frequent first",
--     returning whole capture rows already ordered, which keeps the aggregate
--     out of the keyset path entirely.
--
-- Both are SECURITY INVOKER: RLS on captures decides visibility, so neither can
-- report a count across a workspace the caller cannot read.

BEGIN;

-- Count per distinct error in one workspace. NULL fingerprints are excluded:
-- a capture with no error has nothing to group with, and lumping them would
-- invent a bogus "most common bug".
CREATE OR REPLACE FUNCTION public.get_workspace_fingerprint_counts(p_workspace_id uuid)
RETURNS TABLE (error_fingerprint text, occurrences bigint, last_seen timestamptz)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT c.error_fingerprint, COUNT(*)::bigint, MAX(c.created_at)
  FROM public.captures c
  WHERE c.workspace_id = p_workspace_id
    AND c.error_fingerprint IS NOT NULL
  GROUP BY c.error_fingerprint
  HAVING COUNT(*) > 1   -- a single report is not a recurring bug; no badge for it
$function$;

GRANT EXECUTE ON FUNCTION public.get_workspace_fingerprint_counts(uuid) TO authenticated;

-- One representative capture per distinct error, most frequent first.
-- Ranking happens here rather than in the grid because the grid only ever holds
-- one page: ordering a page by frequency would rank 12 rows, not the workspace.
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
  last_seen timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public', 'pg_temp'
AS $function$
  WITH grouped AS (
    SELECT c.error_fingerprint AS fp,
           COUNT(*)::bigint    AS n,
           MAX(c.created_at)   AS seen
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
         n.error_fingerprint, g.n, g.seen
  FROM newest n
  JOIN grouped g ON g.fp = n.error_fingerprint
  ORDER BY g.n DESC, g.seen DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 20), 1), 100)
$function$;

GRANT EXECUTE ON FUNCTION public.get_workspace_top_errors(uuid, integer) TO authenticated;

COMMIT;
