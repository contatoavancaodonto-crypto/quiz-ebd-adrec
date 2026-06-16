
DROP VIEW IF EXISTS public.ranking_lesson CASCADE;

CREATE VIEW public.ranking_lesson AS
WITH best_attempts AS (
  SELECT DISTINCT ON (qa.participant_id, COALESCE(qa.lesson_id, qa.quiz_id))
    qa.id AS attempt_id,
    qa.participant_id,
    qa.lesson_id,
    qa.quiz_id,
    LEAST(qa.score, COALESCE(qa.total_questions, qa.score)) AS score,
    qa.streak_bonus,
    LEAST(qa.score, COALESCE(qa.total_questions, qa.score)) AS final_score,
    qa.total_questions,
    qa.total_time_seconds,
    qa.total_time_ms,
    qa.accuracy_percentage,
    qa.season_id,
    qa.finished_at,
    qa.week_number
  FROM quiz_attempts qa
  JOIN participants p ON p.id = qa.participant_id
  WHERE qa.finished_at IS NOT NULL
    AND UPPER(p.name) <> 'TESTE123'
  ORDER BY qa.participant_id,
           COALESCE(qa.lesson_id, qa.quiz_id),
           qa.score DESC,
           qa.total_time_ms,
           qa.finished_at
)
SELECT
  ba.attempt_id,
  ROW_NUMBER() OVER (
    PARTITION BY COALESCE(ba.lesson_id, ba.quiz_id)
    ORDER BY ba.final_score DESC, ba.total_time_ms, ba.finished_at
  ) AS position,
  part.name AS participant_name,
  part.class_id,
  c.name AS class_name,
  pr.church_id,
  ch.name AS church_name,
  ba.quiz_id,
  COALESCE(l.lesson_number, q.lesson_number, ba.week_number) AS lesson_number,
  COALESCE(l.theme, q.title) AS lesson_theme,
  ba.score,
  ba.streak_bonus,
  ba.final_score,
  ba.total_questions,
  ba.total_time_seconds,
  ba.total_time_ms,
  ba.accuracy_percentage,
  ba.season_id,
  ba.lesson_id,
  ba.finished_at,
  pr.avatar_url
FROM best_attempts ba
JOIN participants part ON part.id = ba.participant_id
JOIN classes c ON c.id = part.class_id
LEFT JOIN quizzes q ON q.id = ba.quiz_id
LEFT JOIN lessons l ON l.id = ba.lesson_id
LEFT JOIN profiles pr ON pr.id = part.user_id
LEFT JOIN churches ch ON ch.id = part.user_id;

GRANT SELECT ON public.ranking_lesson TO anon, authenticated;
GRANT ALL ON public.ranking_lesson TO service_role;
