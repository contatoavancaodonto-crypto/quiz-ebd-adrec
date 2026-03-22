
CREATE OR REPLACE VIEW public.ranking_general AS
SELECT p.name AS participant_name,
    c.name AS class_name,
    c.id AS class_id,
    qa.score,
    qa.total_time_seconds,
    qa.accuracy_percentage,
    qa.id AS attempt_id,
    qa.finished_at,
    row_number() OVER (ORDER BY qa.score DESC, qa.total_time_seconds) AS "position"
FROM quiz_attempts qa
JOIN participants p ON qa.participant_id = p.id
JOIN classes c ON p.class_id = c.id
WHERE qa.finished_at IS NOT NULL
  AND upper(trim(p.name)) <> 'TESTE123'
  AND qa.score >= 5;

CREATE OR REPLACE VIEW public.ranking_by_class AS
SELECT p.name AS participant_name,
    c.name AS class_name,
    c.id AS class_id,
    qa.score,
    qa.total_time_seconds,
    qa.accuracy_percentage,
    qa.id AS attempt_id,
    qa.finished_at,
    row_number() OVER (PARTITION BY c.id ORDER BY qa.score DESC, qa.total_time_seconds) AS "position"
FROM quiz_attempts qa
JOIN participants p ON qa.participant_id = p.id
JOIN classes c ON p.class_id = c.id
WHERE qa.finished_at IS NOT NULL
  AND upper(trim(p.name)) <> 'TESTE123'
  AND qa.score >= 5;
