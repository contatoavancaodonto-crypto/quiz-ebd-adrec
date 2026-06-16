
DROP VIEW IF EXISTS public.ranking_churches_classic CASCADE;
DROP VIEW IF EXISTS public.ranking_trimester_consolidated CASCADE;

CREATE VIEW public.ranking_trimester_consolidated
WITH (security_invoker = on)
AS
WITH
best_lesson_attempts AS (
  SELECT DISTINCT ON (qa.participant_id, COALESCE(qa.lesson_id, qa.quiz_id))
    qa.participant_id,
    qa.trimester,
    qa.score AS lesson_score,
    qa.total_time_ms,
    qa.finished_at
  FROM public.quiz_attempts qa
  LEFT JOIN public.quizzes q ON q.id = qa.quiz_id
  WHERE qa.finished_at IS NOT NULL
    AND qa.trimester IS NOT NULL
    AND COALESCE(q.quiz_kind, 'weekly') <> 'trimester_exam'
  ORDER BY qa.participant_id,
           COALESCE(qa.lesson_id, qa.quiz_id),
           qa.score DESC,
           qa.total_time_ms ASC,
           qa.finished_at ASC
),
lesson_scores AS (
  SELECT
    participant_id,
    trimester,
    LEAST(SUM(LEAST(lesson_score, 5)), 65)::bigint AS lessons_score,
    SUM(total_time_ms) AS total_time_ms,
    COUNT(*) AS quizzes_completed,
    MAX(finished_at) AS last_finished_at
  FROM best_lesson_attempts
  GROUP BY participant_id, trimester
),
best_exam_attempts AS (
  SELECT DISTINCT ON (qa.participant_id, qa.trimester)
    qa.participant_id,
    qa.trimester,
    qa.score AS exam_score,
    qa.total_time_ms,
    qa.finished_at
  FROM public.quiz_attempts qa
  JOIN public.quizzes q ON q.id = qa.quiz_id
  WHERE qa.finished_at IS NOT NULL
    AND qa.trimester IS NOT NULL
    AND q.quiz_kind = 'trimester_exam'
  ORDER BY qa.participant_id, qa.trimester, qa.score DESC, qa.total_time_ms ASC, qa.finished_at ASC
),
exam_scores AS (
  SELECT
    participant_id,
    trimester,
    LEAST(exam_score, 26)::bigint AS exam_score,
    total_time_ms AS exam_time_ms,
    finished_at AS exam_finished_at
  FROM best_exam_attempts
),
reading_full_lessons AS (
  SELECT
    p.id AS participant_id,
    NULLIF(l.trimester, '')::integer AS trimester,
    urp.lesson_id
  FROM public.user_reading_progress urp
  JOIN public.lessons l ON l.id = urp.lesson_id
  JOIN public.participants p ON p.user_id = urp.user_id
  WHERE urp.is_read = true
    AND l.trimester IS NOT NULL
    AND l.trimester ~ '^[0-9]+$'
  GROUP BY p.id, l.trimester, urp.lesson_id
  HAVING COUNT(DISTINCT LOWER(urp.day_key)) >= 6
),
reading_scores AS (
  SELECT
    participant_id,
    trimester,
    LEAST(COUNT(DISTINCT lesson_id), 13)::bigint AS reading_score
  FROM reading_full_lessons
  GROUP BY participant_id, trimester
),
all_keys AS (
  SELECT participant_id, trimester FROM lesson_scores
  UNION
  SELECT participant_id, trimester FROM exam_scores
  UNION
  SELECT participant_id, trimester FROM reading_scores
),
combined AS (
  SELECT
    k.participant_id,
    k.trimester,
    COALESCE(ls.lessons_score, 0)::bigint AS lessons_score,
    COALESCE(rs.reading_score, 0)::bigint AS reading_score,
    COALESCE(es.exam_score, 0)::bigint AS exam_score,
    (COALESCE(ls.lessons_score, 0) + COALESCE(rs.reading_score, 0) + COALESCE(es.exam_score, 0))::bigint AS total_score,
    COALESCE(ls.total_time_ms, 0) + COALESCE(es.exam_time_ms, 0) AS total_time_ms,
    COALESCE(ls.quizzes_completed, 0) AS quizzes_completed,
    GREATEST(COALESCE(ls.last_finished_at, 'epoch'::timestamptz), COALESCE(es.exam_finished_at, 'epoch'::timestamptz)) AS last_finished_at
  FROM all_keys k
  LEFT JOIN lesson_scores ls ON ls.participant_id = k.participant_id AND ls.trimester = k.trimester
  LEFT JOIN reading_scores rs ON rs.participant_id = k.participant_id AND rs.trimester = k.trimester
  LEFT JOIN exam_scores es ON es.participant_id = k.participant_id AND es.trimester = k.trimester
),
participant_scores AS (
  SELECT
    p.name AS participant_name,
    p.class_id,
    c.name AS class_name,
    prof.church_id,
    ch.name AS church_name,
    cb.trimester,
    cb.total_score,
    cb.lessons_score,
    cb.reading_score,
    cb.exam_score,
    cb.total_time_ms,
    cb.quizzes_completed,
    cb.last_finished_at,
    prof.avatar_url
  FROM combined cb
  JOIN public.participants p ON p.id = cb.participant_id
  JOIN public.classes c ON c.id = p.class_id
  LEFT JOIN public.profiles prof ON prof.id = p.user_id
  LEFT JOIN public.churches ch ON ch.id = prof.church_id
  WHERE UPPER(p.name) <> 'TESTE123'
)
SELECT
  ROW_NUMBER() OVER (PARTITION BY trimester ORDER BY total_score DESC, total_time_ms ASC, last_finished_at ASC) AS position,
  participant_name,
  class_id,
  class_name,
  church_id,
  church_name,
  trimester,
  total_score,
  lessons_score,
  reading_score,
  exam_score,
  total_time_ms,
  quizzes_completed,
  last_finished_at,
  avatar_url
FROM participant_scores;

GRANT SELECT ON public.ranking_trimester_consolidated TO anon, authenticated, service_role;

CREATE VIEW public.ranking_churches_classic
WITH (security_invoker = on)
AS
WITH agg AS (
  SELECT
    church_id,
    church_name,
    trimester,
    AVG(total_score)::numeric(10,2) AS avg_score,
    COUNT(*) AS participants_count,
    SUM(total_time_ms) AS total_time_ms
  FROM public.ranking_trimester_consolidated
  WHERE church_id IS NOT NULL
  GROUP BY church_id, church_name, trimester
)
SELECT
  ROW_NUMBER() OVER (PARTITION BY trimester ORDER BY avg_score DESC, total_time_ms ASC) AS position,
  church_id,
  church_name,
  (SELECT pastor_president FROM public.churches WHERE id = agg.church_id) AS pastor_president,
  avg_score,
  participants_count,
  trimester
FROM agg;

GRANT SELECT ON public.ranking_churches_classic TO anon, authenticated, service_role;
