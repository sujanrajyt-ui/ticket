-- ============================================================
-- Event Registration & QR Check-in System
-- Supabase Migration: 004_email_required.sql
-- Email remains a REQUIRED field on registration.
-- Restores NOT NULL + UNIQUE previously dropped in 003 cleanup.
-- ============================================================

UPDATE public.attendees
SET email = 'reg-' || id || '@nitte.edu.in'
WHERE email IS NULL OR email = '';

ALTER TABLE public.attendees
  ALTER COLUMN email SET NOT NULL;

ALTER TABLE public.attendees
  ADD CONSTRAINT attendees_email_key UNIQUE (email);

CREATE INDEX IF NOT EXISTS attendees_email_idx ON public.attendees (email);