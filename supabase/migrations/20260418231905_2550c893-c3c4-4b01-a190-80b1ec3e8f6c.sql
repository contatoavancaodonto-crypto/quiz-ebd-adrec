
-- 1. Churches table
CREATE TABLE public.churches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  approved BOOLEAN NOT NULL DEFAULT true,
  requested BOOLEAN NOT NULL DEFAULT false,
  requester_pastor_name TEXT,
  requester_phone TEXT,
  requester_area INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved churches are publicly readable"
  ON public.churches FOR SELECT
  USING (approved = true);

CREATE POLICY "Anyone can request a new church"
  ON public.churches FOR INSERT
  WITH CHECK (requested = true AND approved = false);

-- Seed initial churches
INSERT INTO public.churches (name, approved, requested) VALUES
  ('ADREC', true, false),
  ('ADVEJA', true, false),
  ('ADESC', true, false),
  ('ADEVIS', true, false),
  ('ADCIM- MORRINHOS', true, false),
  ('CIMADSETA SLMB', true, false),
  ('AD. AMEE', true, false),
  ('ADVEJA EXPANSUL', true, false),
  ('ADCANPS', true, false);

-- 2. Profiles: add church_id + area
ALTER TABLE public.profiles
  ADD COLUMN church_id UUID REFERENCES public.churches(id),
  ADD COLUMN area INTEGER CHECK (area BETWEEN 1 AND 12);

-- 3. Quiz attempts: add ms precision
ALTER TABLE public.quiz_attempts
  ADD COLUMN total_time_ms BIGINT NOT NULL DEFAULT 0;

-- 4. Recreate ranking views including church and ordering by ms
DROP VIEW IF EXISTS public.ranking_by_class;
DROP VIEW IF EXISTS public.ranking_general;

CREATE VIEW public.ranking_general AS
SELECT
  qa.id AS attempt_id,
  qa.score,
  qa.total_time_seconds,
  qa.total_time_ms,
  qa.accuracy_percentage,
  qa.finished_at,
  p.name AS participant_name,
  c.id AS class_id,
  c.name AS class_name,
  ch.id AS church_id,
  ch.name AS church_name,
  q.trimester,
  false AS is_retry,
  ROW_NUMBER() OVER (
    PARTITION BY q.trimester
    ORDER BY qa.score DESC,
             COALESCE(NULLIF(qa.total_time_ms, 0), qa.total_time_seconds * 1000) ASC,
             qa.finished_at ASC
  ) AS position
FROM public.quiz_attempts qa
JOIN public.participants p ON p.id = qa.participant_id
JOIN public.classes c ON c.id = p.class_id
JOIN public.quizzes q ON q.id = qa.quiz_id
LEFT JOIN public.profiles pr ON pr.id::text = p.id::text
LEFT JOIN public.churches ch ON ch.id = pr.church_id
WHERE qa.finished_at IS NOT NULL
  AND qa.score >= 5
  AND UPPER(p.name) <> 'TESTE123';

CREATE VIEW public.ranking_by_class AS
SELECT
  qa.id AS attempt_id,
  qa.score,
  qa.total_time_seconds,
  qa.total_time_ms,
  qa.accuracy_percentage,
  qa.finished_at,
  p.name AS participant_name,
  c.id AS class_id,
  c.name AS class_name,
  ch.id AS church_id,
  ch.name AS church_name,
  q.trimester,
  false AS is_retry,
  ROW_NUMBER() OVER (
    PARTITION BY c.id, q.trimester
    ORDER BY qa.score DESC,
             COALESCE(NULLIF(qa.total_time_ms, 0), qa.total_time_seconds * 1000) ASC,
             qa.finished_at ASC
  ) AS position
FROM public.quiz_attempts qa
JOIN public.participants p ON p.id = qa.participant_id
JOIN public.classes c ON c.id = p.class_id
JOIN public.quizzes q ON q.id = qa.quiz_id
LEFT JOIN public.profiles pr ON pr.id::text = p.id::text
LEFT JOIN public.churches ch ON ch.id = pr.church_id
WHERE qa.finished_at IS NOT NULL
  AND qa.score >= 5
  AND UPPER(p.name) <> 'TESTE123';
