-- =====================================================================
-- 20260922100000_supporting_query_indexes.sql
--
-- Performance optimization:
-- 1. Add supporting index on captures (created_at DESC, id DESC) for
--    keyset pagination and cross-workspace ordering.
-- 2. Add composite index on captures (workspace_id, type) for fast type
--    counts and filtered queries in capture galleries.
-- =====================================================================

CREATE INDEX IF NOT EXISTS captures_created_at_id_idx
  ON public.captures (created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS captures_ws_type_idx
  ON public.captures (workspace_id, type);
