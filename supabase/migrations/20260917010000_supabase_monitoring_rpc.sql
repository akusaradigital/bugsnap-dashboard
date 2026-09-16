-- Migration: 20260917010000_supabase_monitoring_rpc.sql
-- Description: System monitoring RPC returning complete Supabase database storage, table breakdown, connections, and performance statistics.

CREATE OR REPLACE FUNCTION public.get_database_system_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_db_size bigint;
  v_db_size_pretty text;
  v_max_conn int;
  v_conn_total int;
  v_conn_active int;
  v_conn_idle int;
  v_cache_hit numeric;
  v_index_hit numeric;
  v_table_stats jsonb;
  v_capture_stats jsonb;
  v_version text;
  v_uptime interval;
BEGIN
  -- 1. Database storage footprint
  SELECT pg_database_size(current_database()), pg_size_pretty(pg_database_size(current_database()))
  INTO v_db_size, v_db_size_pretty;

  -- 2. PostgreSQL Connection pool status
  SELECT current_setting('max_connections')::int INTO v_max_conn;
  SELECT count(*),
         count(*) FILTER (WHERE state = 'active'),
         count(*) FILTER (WHERE state = 'idle')
  INTO v_conn_total, v_conn_active, v_conn_idle
  FROM pg_stat_activity;

  -- 3. Cache & Index hit performance
  SELECT round((sum(blks_hit) * 100.0 / nullif(sum(blks_hit + blks_read), 0)), 2)
  INTO v_cache_hit
  FROM pg_stat_database
  WHERE datname = current_database();

  SELECT round((sum(idx_scan) * 100.0 / nullif(sum(idx_scan + seq_scan), 0)), 2)
  INTO v_index_hit
  FROM pg_stat_user_tables;

  -- 4. Granular table storage & tuple statistics
  SELECT jsonb_agg(t) INTO v_table_stats
  FROM (
    SELECT
      schemaname AS schema_name,
      relname AS table_name,
      n_live_tup AS live_rows,
      n_dead_tup AS dead_rows,
      pg_total_relation_size(relid) AS total_bytes,
      pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
      pg_size_pretty(pg_relation_size(relid)) AS data_size,
      pg_size_pretty(pg_indexes_size(relid)) AS index_size,
      last_vacuum,
      last_autovacuum,
      last_analyze,
      last_autoanalyze
    FROM pg_stat_user_tables
    ORDER BY pg_total_relation_size(relid) DESC
  ) t;

  -- 5. Zero-load capture pointers
  SELECT jsonb_build_object(
    'total_captures', count(*),
    'drive_backed', count(*) FILTER (WHERE drive_file_id IS NOT NULL OR drive_url IS NOT NULL),
    'total_views_counter', COALESCE(sum(view_count), 0),
    'storage_bytes', pg_total_relation_size('public.captures'::regclass)
  )
  INTO v_capture_stats
  FROM public.captures;

  -- 6. PostgreSQL Engine & Uptime
  SELECT version() INTO v_version;
  SELECT now() - pg_postmaster_start_time() INTO v_uptime;

  RETURN jsonb_build_object(
    'database_name', current_database(),
    'version', v_version,
    'uptime', v_uptime::text,
    'total_bytes', v_db_size,
    'total_size_pretty', v_db_size_pretty,
    'quota_bytes', 524288000, -- 500 MB Free Tier quota
    'quota_pretty', '500 MB',
    'used_percent', round((v_db_size * 100.0 / 524288000), 2),
    'free_bytes', greatest(0, 524288000 - v_db_size),
    'free_size_pretty', pg_size_pretty(greatest(0, 524288000 - v_db_size)),
    'connections', jsonb_build_object(
      'max', v_max_conn,
      'total', v_conn_total,
      'active', v_conn_active,
      'idle', v_conn_idle,
      'used_percent', round((v_conn_total * 100.0 / nullif(v_max_conn, 0)), 1)
    ),
    'performance', jsonb_build_object(
      'cache_hit_ratio', COALESCE(v_cache_hit, 100.0),
      'index_hit_ratio', COALESCE(v_index_hit, 100.0)
    ),
    'captures', v_capture_stats,
    'tables', COALESCE(v_table_stats, '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_database_system_stats() TO service_role;
