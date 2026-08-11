-- =====================================================================
-- 018_convergence.sql - T-026: reconcile the live (empty) DB to the
-- intended final shape before the remaining migrations can apply.
--
-- Context: the live project kkmvanwgywrqsudvspge was built by an OLD
-- extension schema variant (TEXT user columns, no public.users) plus a
-- few partial dashboard migrations. All tables are EMPTY (verified:
-- captures/comments/workspaces/members/views = 0 rows), so converting
-- column types is data-loss-free.
--
-- What this does:
--   1. users table + signup trigger + plan/suspended columns.
--   2. Convert TEXT FK/owner columns -> UUID on the tables that have
--      them (workspaces.owner_user_id, workspace_members.user_id,
--      captures.user_id, comments.user_id) so the SECURITY DEFINER RPCs
--      (which compare against auth.users.id = uuid) stop throwing
--      "operator does not exist: text = uuid".
--   3. Align comments to the app shape (body/author_name/author_email/
--      video_timestamp) — post_comment writes these; the old live table
--      had user_name/content.
--   4. Create missing child tables: workspace_settings,
--      workspace_folders, deleted_drive_folders, audit_logs,
--      comment_spam_guard.
--   5. Drop the stale divergent get_public_capture so 001/006/014 can
--      recreate the current signature.
--
-- HOW TO APPLY (MANUAL - do not run from the CLI):
--   Paste in Supabase SQL Editor and Run. Re-runnable (idempotent).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. users table (extends auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  plan        text not null default 'free',
  suspended   boolean not null default false
);
alter table public.users
  drop constraint if exists users_plan_check;
alter table public.users
  add constraint users_plan_check
  check (plan in ('free', 'pro', 'pro_plus', 'enterprise'));
create index if not exists users_plan_lookup_idx on public.users (lower(trim(email)));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        avatar_url = excluded.avatar_url;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill any existing auth.users into public.users (idempotent).
insert into public.users (id, email, full_name, avatar_url)
select id, email, raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'avatar_url'
from auth.users
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 2. Convert TEXT owner/user columns -> UUID (empty tables, safe)
-- ---------------------------------------------------------------------
DO $$
BEGIN
  -- workspaces.owner_user_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workspaces'
      AND column_name = 'owner_user_id'
      AND data_type = 'text'
  ) THEN
    ALTER TABLE public.workspaces ALTER COLUMN owner_user_id TYPE uuid USING owner_user_id::uuid;
  END IF;

  -- workspace_members.user_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workspace_members'
      AND column_name = 'user_id'
      AND data_type = 'text'
  ) THEN
    ALTER TABLE public.workspace_members ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
  END IF;

  -- captures.user_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'captures'
      AND column_name = 'user_id'
      AND data_type = 'text'
  ) THEN
    ALTER TABLE public.captures ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
  END IF;

  -- comments.user_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comments'
      AND column_name = 'user_id'
      AND data_type = 'text'
  ) THEN
    ALTER TABLE public.comments ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 3. Align comments to the app shape (post_comment writes these)
-- ---------------------------------------------------------------------
alter table public.comments
  add column if not exists author_name text,
  add column if not exists author_email text,
  add column if not exists body text,
  add column if not exists video_timestamp integer;

-- Migrate legacy content -> body where body is empty and content exists (only if column still exists).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='comments' AND column_name='content') THEN
    UPDATE public.comments SET body = content WHERE (body IS NULL OR btrim(body) = '') AND content IS NOT NULL;
    ALTER TABLE public.comments DROP COLUMN content;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='comments' AND column_name='user_name') THEN
    ALTER TABLE public.comments DROP COLUMN user_name;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='comments' AND column_name='user_email') THEN
    ALTER TABLE public.comments DROP COLUMN user_email;
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 4. Missing child tables (idempotent; RLS + policies follow the
--    existing dashboard migration patterns)
-- ---------------------------------------------------------------------

-- workspace_settings (dashboard settings + extension auto-delete T-016/17)
create table if not exists public.workspace_settings (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  webhook_url text not null default '',
  brand_name text not null default 'BugSnap',
  custom_logo_url text not null default '',
  hide_watermark boolean not null default false,
  custom_domain text not null default '',
  auto_delete_months integer not null default 3
    check (auto_delete_months in (0, 3, 6, 12)),
  updated_at timestamptz not null default now()
);
alter table public.workspace_settings enable row level security;
drop policy if exists "workspace settings members select" on public.workspace_settings;
drop policy if exists "workspace settings owners write" on public.workspace_settings;
create policy "workspace settings members select" on public.workspace_settings
  for select to authenticated using (
    exists (select 1 from public.workspace_members m
            where m.workspace_id = workspace_settings.workspace_id and m.user_id = auth.uid()));
create policy "workspace settings owners write" on public.workspace_settings
  for all to authenticated using (
    exists (select 1 from public.workspaces w
            where w.id = workspace_settings.workspace_id and w.owner_user_id = auth.uid()))
  with check (
    exists (select 1 from public.workspaces w
            where w.id = workspace_settings.workspace_id and w.owner_user_id = auth.uid()));

-- workspace_folders (dashboard folder store, T-013)
create table if not exists public.workspace_folders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 200),
  created_at timestamptz not null default now(),
  unique (workspace_id, name)
);
alter table public.workspace_folders enable row level security;
drop policy if exists "workspace folders members select" on public.workspace_folders;
drop policy if exists "workspace folders owners write" on public.workspace_folders;
create policy "workspace folders members select" on public.workspace_folders
  for select to authenticated using (
    exists (select 1 from public.workspace_members m
            where m.workspace_id = workspace_folders.workspace_id and m.user_id = auth.uid()));
create policy "workspace folders owners write" on public.workspace_folders
  for all to authenticated using (
    exists (select 1 from public.workspaces w
            where w.id = workspace_folders.workspace_id and w.owner_user_id = auth.uid()))
  with check (
    exists (select 1 from public.workspaces w
            where w.id = workspace_folders.workspace_id and w.owner_user_id = auth.uid()));

-- deleted_drive_folders (folder delete queue, T-013)
create table if not exists public.deleted_drive_folders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  folder_name text not null,
  drive_url text,
  created_at timestamptz not null default now()
);
alter table public.deleted_drive_folders enable row level security;

-- audit_logs (006 security upgrades)
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  capture_id uuid references public.captures(id) on delete set null,
  user_id uuid,
  action text not null,
  ip text,
  viewer_email text,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_capture_idx on public.audit_logs(capture_id);
alter table public.audit_logs enable row level security;

-- comment_spam_guard (006 security upgrades)
create table if not exists public.comment_spam_guard (
  ip text primary key,
  last_post_at timestamptz not null default now(),
  post_count integer not null default 1
);

-- ---------------------------------------------------------------------
-- 5. Drop the stale divergent get_public_capture so the current
--    signature (001/006/014) can be recreated cleanly.
-- ---------------------------------------------------------------------
drop function if exists public.get_public_capture cascade;
