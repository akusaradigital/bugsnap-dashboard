-- =====================================================================
-- 20260916230000_supabase_free_tier_optimization.sql
-- Supabase Free Tier Storage & Bloat Optimization:
--   1. Drop redundant duplicate indexes on captures table
--      - idx_captures_site_url (duplicate of captures_site_url_idx)
--      - idx_captures_ws_created (duplicate of captures_ws_created_idx)
--      - idx_captures_owner_email (duplicate of captures_owner_email_created_idx)
--   2. Optimize autovacuum thresholds for fast-churn tables (rate_limits, audit_logs)
-- =====================================================================

-- Drop redundant duplicate indexes on captures
DROP INDEX IF EXISTS public.idx_captures_site_url;
DROP INDEX IF EXISTS public.idx_captures_ws_created;
DROP INDEX IF EXISTS public.idx_captures_owner_email;

-- Tune autovacuum on rate_limits and audit_logs to clean dead tuples faster
-- (prevents table bloat on Supabase 500 MB free quota)
ALTER TABLE public.rate_limits SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_vacuum_threshold = 20
);

ALTER TABLE public.audit_logs SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_vacuum_threshold = 50
);
