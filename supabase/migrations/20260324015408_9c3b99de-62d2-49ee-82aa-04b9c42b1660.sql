DROP VIEW IF EXISTS ranking_general;

CREATE VIEW ranking_general AS
WITH first_attempts AS (
  SELECT DISTINCT ON (p.id)
    p.id AS participant_id,
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
  ORDER BY p.id, qa.started_at ASC
),
attempt_counts AS (
  SELECT qa.participant_id, COUNT(*) AS total_attempts
  FROM quiz_attempts qa
  WHERE qa.finished_at IS NOT NULL
  GROUP BY qa.participant_id
)
SELECT
  fa.participant_name,
  fa.class_name,
  fa.class_id,
  fa.score,
  fa.total_time_seconds,
  fa.accuracy_percentage,
  fa.attempt_id,
  fa.finished_at,
  (COALESCE(ac.total_attempts, 1) > 1) AS is_retry,
  row_number() OVER (
    ORDER BY
      (CASE WHEN COALESCE(ac.total_attempts, 1) > 1 THEN 1 ELSE 0 END) ASC,
      fa.score DESC,
      fa.total_time_seconds ASC
  ) AS position
FROM first_attempts fa
LEFT JOIN attempt_counts ac ON ac.participant_id = fa.participant_id;