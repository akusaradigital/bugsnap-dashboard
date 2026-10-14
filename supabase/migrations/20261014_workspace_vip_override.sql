-- Add VIP badge and AI token limit override to workspace_settings
-- Admin-only capability; stubs in tiers.ts / quota.ts remain unlimited (no paywalls).
alter table public.workspace_settings
  add column if not exists is_vip boolean not null default false,
  add column if not exists ai_token_limit_override integer null;
