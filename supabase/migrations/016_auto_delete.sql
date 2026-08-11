-- =====================================================================
-- 016_auto_delete.sql - Auto-delete history (workspace retention) — T-016
--
-- SATU KESATUAN dengan extension (T-017): kolom SAMA di workspace_settings
-- (`auto_delete_months`). Extension sudah referensi migration "016"
-- (schema-auto-delete.sql baris 7/24), jadi nomor ini WAJIB.
--
--   1. workspace_settings.auto_delete_months integer NOT NULL DEFAULT 3
--      CHECK (auto_delete_months IN (0, 3, 6, 12));  0 = Never.
--      NULL/invalid -> default 3 (produk). Column def idempoten & identik
--      dengan schema-auto-delete.sql -> no-op jika file itu sudah jalan.
--   2. delete_expired_captures(p_workspace_id, p_batch_limit)
--      - SECURITY DEFINER, owner-gated (trust boundary sama dgn policy
--        "workspace settings owners write").
--      - Hapus captures dgn created_at < now() - interval '<N> months',
--        N = auto_delete_months workspace; N = 0 -> tidak hapus apa pun.
--      - LIGHT / free-tier: bounded batches (LIMIT p_batch_limit, default
--        100), tidak pernah hapus massal satu-shot. Caller loop sampai
--        return 0 utk mengosongkan workspace. Idempoten.
--      - comments + capture_views cascade via FK (002_comments,
--        005_views: on delete cascade).
--
-- HOW TO APPLY:
--   Paste in Supabase SQL Editor and Run. Re-runnable (idempotent).
--   Do NOT run these from the CLI before applying.
-- =====================================================================

-- 1. Retention column on workspace_settings (identik dengan extension).
alter table public.workspace_settings
  add column if not exists auto_delete_months integer not null default 3
  check (auto_delete_months in (0, 3, 6, 12));

-- 2. Light bounded-batch delete. Owner-gated so a workspace can only be
--    cleaned by its owner; runs as definer to bypass RLS on captures.
create or replace function public.delete_expired_captures(p_workspace_id uuid, p_batch_limit int default 100)
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_months int;
  v_cutoff timestamptz;
  v_batch int := greatest(1, least(coalesce(p_batch_limit, 100), 1000));
  v_deleted int;
begin
  -- Ownership gate (mirrors the workspace_settings owner write policy).
  if not exists (
    select 1 from public.workspaces
    where id = p_workspace_id and owner_user_id = auth.uid()
  ) then
    raise exception 'Permission denied' using errcode = '42501';
  end if;

  -- Retention from the workspace; 0 = Never (skip), NULL -> default 3.
  select coalesce(auto_delete_months, 3) into v_months
  from public.workspace_settings
  where workspace_id = p_workspace_id;

  if coalesce(v_months, 3) = 0 then
    return 0;
  end if;

  v_cutoff := now() - (coalesce(v_months, 3) || ' months')::interval;

  -- Bounded batch: oldest first, LIMIT v_batch. Loop from the caller until
  -- 0 is returned to fully drain a workspace.
  delete from public.captures
  where id in (
    select id from public.captures
    where workspace_id = p_workspace_id
      and created_at < v_cutoff
    order by created_at asc
    limit v_batch
    for update skip locked
  );

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

-- Dashboard (authenticated owner) and extension anon path may both call it.
grant execute on function public.delete_expired_captures(uuid, int) to authenticated;
grant execute on function public.delete_expired_captures(uuid, int) to anon;
