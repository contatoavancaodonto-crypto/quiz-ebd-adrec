-- 1) Recreate ranking_general so it sums streak_bonus into the score
DROP VIEW IF EXISTS public.ranking_general CASCADE;
CREATE VIEW public.ranking_general
WITH (security_invoker = on) AS
SELECT
  qa.id AS attempt_id,
  qa.score,
  qa.streak_bonus,
  COALESCE(qa.final_score, qa.score + qa.streak_bonus) AS final_score,
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
  row_number() OVER (
    PARTITION BY q.trimester
    ORDER BY
      COALESCE(qa.final_score, qa.score + qa.streak_bonus) DESC,
      COALESCE(NULLIF(qa.total_time_ms, 0), (qa.total_time_seconds * 1000)::bigint) ASC,
      qa.finished_at ASC
  ) AS position
FROM quiz_attempts qa
JOIN participants p ON p.id = qa.participant_id
JOIN classes c ON c.id = p.class_id
JOIN quizzes q ON q.id = qa.quiz_id
LEFT JOIN profiles pr ON pr.id::text = p.id::text
LEFT JOIN churches ch ON ch.id = pr.church_id
WHERE qa.finished_at IS NOT NULL
  AND qa.score >= 5
  AND upper(p.name) <> 'TESTE123';

-- 2) New view: ranking_monthly (current calendar month in America/Sao_Paulo)
DROP VIEW IF EXISTS public.ranking_monthly CASCADE;
CREATE VIEW public.ranking_monthly
WITH (security_invoker = on) AS
WITH agg AS (
  SELECT
    lower(trim(part.name)) AS name_key,
    min(part.name) AS participant_name,
    qa.season_id,
    sum(COALESCE(qa.final_score, qa.score + qa.streak_bonus)) AS total_score,
    sum(qa.total_time_ms) AS total_time_ms,
    count(DISTINCT qa.week_number) AS weeks_completed,
    max(qa.finished_at) AS last_finished_at
  FROM quiz_attempts qa
  JOIN participants part ON part.id = qa.participant_id
  WHERE qa.finished_at IS NOT NULL
    AND date_trunc('month', (qa.finished_at AT TIME ZONE 'America/Sao_Paulo'))
        = date_trunc('month', (now() AT TIME ZONE 'America/Sao_Paulo'))
  GROUP BY lower(trim(part.name)), qa.season_id
),
joined AS (
  SELECT
    a.name_key,
    a.participant_name,
    a.season_id,
    a.total_score,
    a.total_time_ms,
    a.weeks_completed,
    a.last_finished_at,
    pr.church_id,
    ch.name AS church_name,
    pr.class_id,
    c.name AS class_name,
    ps.current_streak
  FROM agg a
  LEFT JOIN profiles pr
    ON lower(trim((pr.first_name || ' ') || COALESCE(pr.last_name, ''))) = a.name_key
  LEFT JOIN churches ch ON ch.id = pr.church_id
  LEFT JOIN classes c ON c.id = pr.class_id
  LEFT JOIN participant_streaks ps
    ON ps.participant_name = a.name_key
   AND ps.season_id = a.season_id
)
SELECT
  row_number() OVER (
    ORDER BY total_score DESC, total_time_ms ASC, last_finished_at ASC
  ) AS position,
  participant_name,
  season_id,
  class_id,
  class_name,
  church_id,
  church_name,
  total_score,
  total_time_ms,
  weeks_completed,
  COALESCE(current_streak, 0) AS current_streak
FROM joined;