-- content.js auto-compiles Google Drive links into BugSnap cards by calling
-- rpc/get_capture_by_drive_id with the bare Drive file ID (regex-extracted
-- from the URL), but captures.drive_url stores the full Drive webViewLink —
-- ponytail: substring match (not exact equality, which is what the old
-- unapplied legacy schema file used and would never match) so lookup
-- actually finds the row.
CREATE OR REPLACE FUNCTION public.get_capture_by_drive_id(p_drive_id TEXT)
RETURNS SETOF public.captures
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.captures
  WHERE drive_url IS NOT NULL
    AND p_drive_id IS NOT NULL
    AND position(LOWER(TRIM(p_drive_id)) IN LOWER(drive_url)) > 0
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_capture_by_drive_id(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_capture_by_drive_id(TEXT) TO anon, authenticated;
