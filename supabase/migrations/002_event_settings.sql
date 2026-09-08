-- ============================================================
-- Event Info Editor
-- Supabase Migration: 002_event_settings.sql
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- Single-row event settings table
CREATE TABLE IF NOT EXISTS public.event_config (
  id         BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),
  settings   JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.event_config ENABLE ROW LEVEL SECURITY;

-- Public read only (event info is shown on public pages)
CREATE POLICY "event_config_select_public" ON public.event_config
  FOR SELECT TO anon, authenticated USING (true);

-- Writes are handled by the service role only
CREATE POLICY "event_config_insert_service" ON public.event_config
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "event_config_update_service" ON public.event_config
  FOR UPDATE TO service_role USING (true);

-- Seed the single row
INSERT INTO public.event_config (id, settings)
VALUES (true, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;