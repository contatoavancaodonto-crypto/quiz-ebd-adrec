ALTER TABLE public.quizzes 
ADD COLUMN IF NOT EXISTS trimester INTEGER NOT NULL DEFAULT 1 
CHECK (trimester BETWEEN 1 AND 4);

UPDATE public.quizzes SET trimester = 1 WHERE trimester IS NULL OR trimester = 0;

DROP VIEW IF EXISTS public.ranking_general;
DROP VIEW IF EXISTS public.ranking_by_class;

CREATE VIEW public.ranking_general AS
WITH base AS (
  SELECT 
    qa.id AS attempt_id,
    p.name AS participant_name,
    c.id AS class_id,
    c.name AS class_name,
    q.trimester,
    qa.score,
    qa.accuracy_percentage,
    qa.total_time_seconds,
    qa.finished_at,
    (ROW_NUMBER() OVER (PARTITION BY p.name, p.class_id, q.trimester ORDER BY qa.finished_at ASC) > 1) AS is_retry
  FROM public.quiz_attempts qa
  JOIN public.participants p ON p.id = qa.participant_id
  JOIN public.classes c ON c.id = p.class_id
  JOIN public.quizzes q ON q.id = qa.quiz_id
  WHERE qa.finished_at IS NOT NULL
    AND UPPER(p.name) <> 'TESTE123'
)
SELECT 
  attempt_id, participant_name, class_id, class_name, trimester,
  score, accuracy_percentage, total_time_seconds, finished_at, is_retry,
  ROW_NUMBER() OVER (
    PARTITION BY trimester
    ORDER BY is_retry ASC, score DESC, total_time_seconds ASC
  )::integer AS position
FROM base;

CREATE VIEW public.ranking_by_class AS
WITH base AS (
  SELECT 
    qa.id AS attempt_id,
    p.name AS participant_name,
    c.id AS class_id,
    c.name AS class_name,
    q.trimester,
    qa.score,
    qa.accuracy_percentage,
    qa.total_time_seconds,
    qa.finished_at,
    (ROW_NUMBER() OVER (PARTITION BY p.name, p.class_id, q.trimester ORDER BY qa.finished_at ASC) > 1) AS is_retry
  FROM public.quiz_attempts qa
  JOIN public.participants p ON p.id = qa.participant_id
  JOIN public.classes c ON c.id = p.class_id
  JOIN public.quizzes q ON q.id = qa.quiz_id
  WHERE qa.finished_at IS NOT NULL
    AND UPPER(p.name) <> 'TESTE123'
)
SELECT 
  attempt_id, participant_name, class_id, class_name, trimester,
  score, accuracy_percentage, total_time_seconds, finished_at, is_retry,
  ROW_NUMBER() OVER (
    PARTITION BY class_id, trimester
    ORDER BY is_retry ASC, score DESC, total_time_seconds ASC
  )::integer AS position
FROM base;