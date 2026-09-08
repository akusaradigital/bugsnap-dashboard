-- =====================================================================
-- Cache the generated AI bug summary on the capture itself.
--
-- The same capture gets summarised repeatedly (every time someone opens
-- it), and each miss costs paid upstream tokens plus up to 3 provider
-- round-trips. Storing the result makes every repeat free.
--
-- Nullable with no default: null simply means "not generated yet", so
-- existing rows need no backfill and the route falls through to the
-- normal generate path.
-- =====================================================================

alter table public.captures
  add column if not exists ai_summary      text,
  add column if not exists ai_summary_at   timestamptz;
