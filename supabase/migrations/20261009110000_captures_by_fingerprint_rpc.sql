-- Return individual captures that share an error fingerprint within a workspace.
--
-- Complements get_workspace_top_errors(): the top list returns one representative
-- capture per distinct error, and this fetches the full occurrence list on demand
-- when an engineer expands that error group.
--
-- SECURITY INVOKER: RLS on captures decides row visibility.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_captures_by_fingerprint(
  p_workspace_id uuid,
  p_fingerprint text,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  title text,
  type text,
  drive_url text,
  created_at timestamptz,
  site_url text,
  owner_email text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT c.id, c.title, c.type, c.drive_url, c.created_at, c.site_url, c.owner_email
  FROM public.captures c
  WHERE c.workspace_id = p_workspace_id
    AND c.error_fingerprint = p_fingerprint
  ORDER BY c.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 200)
$function$;

GRANT EXECUTE ON FUNCTION public.get_captures_by_fingerprint(uuid, text, integer) TO authenticated;

COMMIT;
