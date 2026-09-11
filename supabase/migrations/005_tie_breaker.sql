-- ============================================================
-- Tie Breaker Voting System
-- Supabase Migration: 005_tie_breaker.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tie_breaker_polls (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL DEFAULT 'Tie Breaker Voting Poll',
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  candidates  JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tie_breaker_votes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id      uuid REFERENCES public.tie_breaker_polls(id) ON DELETE CASCADE,
  candidate_id TEXT NOT NULL,
  attendee_id  TEXT NOT NULL,
  qr_token     TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tie_breaker_votes_unique_attendee UNIQUE(poll_id, attendee_id)
);

ALTER TABLE public.tie_breaker_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tie_breaker_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tie_breaker_polls_select" ON public.tie_breaker_polls
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "tie_breaker_votes_select" ON public.tie_breaker_votes
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "tie_breaker_votes_insert" ON public.tie_breaker_votes
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "tie_breaker_polls_all_service" ON public.tie_breaker_polls
  FOR ALL TO service_role USING (true);

CREATE POLICY "tie_breaker_votes_all_service" ON public.tie_breaker_votes
  FOR ALL TO service_role USING (true);
