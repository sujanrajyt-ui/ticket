-- ============================================================
-- Event Registration & QR Check-in System
-- Supabase Migration: 001_initial_schema.sql
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- Enable pgcrypto for gen_random_uuid (already enabled in Supabase by default)
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- --------------------------------------------------------
-- 1. Attendees table
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendees (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id TEXT UNIQUE NOT NULL,
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  phone           TEXT UNIQUE NOT NULL,
  usn             TEXT UNIQUE NOT NULL,
  qr_token        TEXT UNIQUE NOT NULL,
  checked_in      BOOLEAN NOT NULL DEFAULT false,
  checked_in_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast search
CREATE INDEX IF NOT EXISTS attendees_email_idx ON public.attendees (email);
CREATE INDEX IF NOT EXISTS attendees_phone_idx ON public.attendees (phone);
CREATE INDEX IF NOT EXISTS attendees_usn_idx   ON public.attendees (usn);
CREATE INDEX IF NOT EXISTS attendees_qr_token_idx ON public.attendees (qr_token);
CREATE INDEX IF NOT EXISTS attendees_checked_in_idx ON public.attendees (checked_in);

-- --------------------------------------------------------
-- 2. Profiles table — tied to auth.users for role assignment
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id    uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role  TEXT NOT NULL CHECK (role IN ('admin', 'volunteer'))
);

-- --------------------------------------------------------
-- 3. Atomic check-in function (prevents race conditions)
--    Uses FOR UPDATE row-level lock so only one concurrent
--    call can succeed for the same attendee.
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_in_attendee(p_token TEXT)
RETURNS TABLE (
  success       BOOLEAN,
  message       TEXT,
  attendee_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attendee public.attendees;
BEGIN
  -- Lock the row to prevent concurrent check-ins
  SELECT * INTO v_attendee
  FROM   public.attendees
  WHERE  qr_token = p_token
  FOR    UPDATE;

  -- QR token not found
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'INVALID_QR'::TEXT, NULL::JSONB;
    RETURN;
  END IF;

  -- Already checked in
  IF v_attendee.checked_in THEN
    RETURN QUERY SELECT
      false,
      'ALREADY_CHECKED_IN'::TEXT,
      jsonb_build_object(
        'name',            v_attendee.first_name || ' ' || v_attendee.last_name,
        'usn',             v_attendee.usn,
        'registration_id', v_attendee.registration_id,
        'checked_in_at',   v_attendee.checked_in_at
      );
    RETURN;
  END IF;

  -- Perform check-in
  UPDATE public.attendees
  SET    checked_in = true, checked_in_at = now()
  WHERE  id = v_attendee.id;

  RETURN QUERY SELECT
    true,
    'SUCCESS'::TEXT,
    jsonb_build_object(
      'name',            v_attendee.first_name || ' ' || v_attendee.last_name,
      'usn',             v_attendee.usn,
      'registration_id', v_attendee.registration_id
    );
END;
$$;

-- --------------------------------------------------------
-- 4. Row Level Security (RLS)
-- --------------------------------------------------------
ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles  ENABLE ROW LEVEL SECURITY;

-- Public can INSERT (register)
CREATE POLICY "attendees_insert_public" ON public.attendees
  FOR INSERT TO anon WITH CHECK (true);

-- Authenticated users (admin/volunteer) can SELECT
CREATE POLICY "attendees_select_authenticated" ON public.attendees
  FOR SELECT TO authenticated USING (true);

-- Only admins can UPDATE directly (for undo check-in etc.)
CREATE POLICY "attendees_update_admin" ON public.attendees
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Only admins can DELETE
CREATE POLICY "attendees_delete_admin" ON public.attendees
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Profiles: users can read their own row
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

-- Profiles: only service role can insert/update (done via Supabase dashboard or admin API)
CREATE POLICY "profiles_insert_service" ON public.profiles
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "profiles_update_service" ON public.profiles
  FOR UPDATE TO service_role USING (true);

-- --------------------------------------------------------
-- 5. Helper function: get dashboard stats
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_attendee_stats()
RETURNS TABLE (
  total       BIGINT,
  checked_in  BIGINT,
  remaining   BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*)                                    AS total,
    COUNT(*) FILTER (WHERE checked_in = true)   AS checked_in,
    COUNT(*) FILTER (WHERE checked_in = false)  AS remaining
  FROM public.attendees;
$$;
