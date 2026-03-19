
-- Fix views to use security_invoker (Postgres 15+)
DROP VIEW IF EXISTS public.ranking_by_class;
DROP VIEW IF EXISTS public.ranking_general;

CREATE VIEW public.ranking_by_class WITH (security_invoker = on) AS
SELECT
  p.name AS participant_name,
  c.name AS class_name,
  c.id AS class_id,
  qa.score,
  qa.total_time_seconds,
  qa.accuracy_percentage,
  qa.id AS attempt_id,
  qa.finished_at,
  ROW_NUMBER() OVER (
    PARTITION BY c.id
    ORDER BY qa.score DESC, qa.total_time_seconds ASC
  ) AS position
FROM public.quiz_attempts qa
JOIN public.participants p ON qa.participant_id = p.id
JOIN public.classes c ON p.class_id = c.id
WHERE qa.finished_at IS NOT NULL;

CREATE VIEW public.ranking_general WITH (security_invoker = on) AS
SELECT
  p.name AS participant_name,
  c.name AS class_name,
  c.id AS class_id,
  qa.score,
  qa.total_time_seconds,
  qa.accuracy_percentage,
  qa.id AS attempt_id,
  qa.finished_at,
  ROW_NUMBER() OVER (
    ORDER BY qa.score DESC, qa.total_time_seconds ASC
  ) AS position
FROM public.quiz_attempts qa
JOIN public.participants p ON qa.participant_id = p.id
JOIN public.classes c ON p.class_id = c.id
WHERE qa.finished_at IS NOT NULL;
