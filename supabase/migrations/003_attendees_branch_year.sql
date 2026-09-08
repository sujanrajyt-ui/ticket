-- ============================================================
-- Event Registration & QR Check-in System
-- Supabase Migration: 003_attendees_branch_year.sql
-- Adds branch & year columns collected by the registration form
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

ALTER TABLE public.attendees
  ADD COLUMN IF NOT EXISTS branch TEXT,
  ADD COLUMN IF NOT EXISTS year   TEXT;