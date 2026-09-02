-- 20260828210000_add_workspace_integrations.sql
-- Add integrations JSONB column to workspace_settings for Aksora, SnapTest, and other tools

ALTER TABLE public.workspace_settings
  ADD COLUMN IF NOT EXISTS integrations JSONB NOT NULL DEFAULT '{}'::jsonb;
