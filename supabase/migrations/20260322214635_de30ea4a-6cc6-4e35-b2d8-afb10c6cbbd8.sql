
-- Use DISTINCT ON to keep only the latest finished attempt per participant
CREATE OR REPLACE VIEW public.ranking_general AS
SELECT participant_name, class_name, class_id, score, total_time_seconds, accuracy_percentage, attempt_id, finished_at,
  row_number() OVER (ORDER BY score DESC, total_time_seconds) AS "position"
FROM (
  SELECT DISTINCT ON (p.id)
    p.name AS participant_name,
    c.name AS class_name,
    c.id AS class_id,
    qa.score,
    qa.total_time_seconds,
    qa.accuracy_percentage,
    qa.id AS attempt_id,
    qa.finished_at
  FROM quiz_attempts qa
  JOIN participants p ON qa.participant_id = p.id
  JOIN classes c ON p.class_id = c.id
  WHERE qa.finished_at IS NOT NULL
    AND upper(trim(p.name)) <> 'TESTE123'
    AND qa.score >= 5
  ORDER BY p.id, qa.finished_at DESC
) sub;

CREATE OR REPLACE VIEW public.ranking_by_class AS
SELECT participant_name, class_name, class_id, score, total_time_seconds, accuracy_percentage, attempt_id, finished_at,
  row_number() OVER (PARTITION BY class_id ORDER BY score DESC, total_time_seconds) AS "position"
FROM (
  SELECT DISTINCT ON (p.id)
    p.name AS participant_name,
    c.name AS class_name,
    c.id AS class_id,
    qa.score,
    qa.total_time_seconds,
    qa.accuracy_percentage,
    qa.id AS attempt_id,
    qa.finished_at
  FROM quiz_attempts qa
  JOIN participants p ON qa.participant_id = p.id
  JOIN classes c ON p.class_id = c.id
  WHERE qa.finished_at IS NOT NULL
    AND upper(trim(p.name)) <> 'TESTE123'
    AND qa.score >= 5
  ORDER BY p.id, qa.finished_at DESC
) sub;

ALTER VIEW public.ranking_general SET (security_invoker = true);
ALTER VIEW public.ranking_by_class SET (security_invoker = true);
