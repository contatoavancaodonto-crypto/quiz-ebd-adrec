CREATE OR REPLACE VIEW public.ranking_trimester_consolidated AS
WITH participant_person AS (
    SELECT p.id AS participant_id,
        COALESCE(p.user_id::text, p.id::text) AS person_key,
        p.user_id, p.class_id, p.name, p.created_at
    FROM participants p
    WHERE upper(p.name) <> 'TESTE123'
), canonical_participant AS (
    SELECT DISTINCT ON (person_key) person_key, participant_id, user_id, class_id, name
    FROM participant_person ORDER BY person_key, created_at
), person_participants AS (
    SELECT person_key, participant_id, user_id FROM participant_person
), best_lesson_attempts AS (
    SELECT DISTINCT ON (pp.person_key, COALESCE(qa.lesson_id, qa.quiz_id))
        pp.person_key, qa.trimester, qa.score AS lesson_score,
        qa.total_time_ms, qa.finished_at
    FROM quiz_attempts qa
    JOIN person_participants pp ON pp.participant_id = qa.participant_id
    LEFT JOIN quizzes q ON q.id = qa.quiz_id
    WHERE qa.finished_at IS NOT NULL AND qa.trimester IS NOT NULL
      AND COALESCE(qa.source_type, '') <> 'trimestral_rpc'
      AND COALESCE(q.quiz_kind, 'weekly') <> 'trimester_exam'
      AND COALESCE(qa.lesson_id, qa.quiz_id) IS NOT NULL
    ORDER BY pp.person_key, COALESCE(qa.lesson_id, qa.quiz_id), qa.score DESC, qa.total_time_ms, qa.finished_at
), lesson_scores AS (
    SELECT person_key, trimester,
        LEAST(sum(LEAST(lesson_score, 5)), 65::bigint) AS lessons_score,
        sum(total_time_ms) AS total_time_ms,
        count(*) AS quizzes_completed,
        max(finished_at) AS last_finished_at
    FROM best_lesson_attempts GROUP BY person_key, trimester
), best_exam_attempts AS (
    SELECT DISTINCT ON (pp.person_key, qa.trimester)
        pp.person_key, qa.trimester, qa.score AS exam_score,
        qa.total_time_ms, qa.finished_at
    FROM quiz_attempts qa
    JOIN person_participants pp ON pp.participant_id = qa.participant_id
    LEFT JOIN quizzes q ON q.id = qa.quiz_id
    WHERE qa.finished_at IS NOT NULL AND qa.trimester IS NOT NULL
      AND (qa.source_type = 'trimestral_rpc' OR q.quiz_kind = 'trimester_exam')
    ORDER BY pp.person_key, qa.trimester, qa.score DESC, qa.total_time_ms, qa.finished_at
), exam_scores AS (
    SELECT person_key, trimester,
        LEAST(exam_score, 22)::bigint AS exam_score,
        total_time_ms AS exam_time_ms,
        finished_at AS exam_finished_at
    FROM best_exam_attempts
), reading_full_lessons AS (
    SELECT cp.person_key, NULLIF(l.trimester, '')::integer AS trimester, urp.lesson_id
    FROM user_reading_progress urp
    JOIN lessons l ON l.id = urp.lesson_id
    JOIN canonical_participant cp ON cp.user_id = urp.user_id
    WHERE urp.is_read = true AND l.trimester IS NOT NULL AND l.trimester ~ '^[0-9]+$'
    GROUP BY cp.person_key, l.trimester, urp.lesson_id
    HAVING count(DISTINCT lower(urp.day_key)) >= 6
), reading_scores AS (
    SELECT person_key, trimester, LEAST(count(DISTINCT lesson_id), 13::bigint) AS reading_score
    FROM reading_full_lessons GROUP BY person_key, trimester
), all_keys AS (
    SELECT person_key, trimester FROM lesson_scores
    UNION SELECT person_key, trimester FROM exam_scores
    UNION SELECT person_key, trimester FROM reading_scores
), combined AS (
    SELECT k.person_key, k.trimester,
        COALESCE(ls.lessons_score, 0::bigint) AS lessons_score,
        COALESCE(rs.reading_score, 0::bigint) AS reading_score,
        COALESCE(es.exam_score, 0::bigint) AS exam_score,
        COALESCE(ls.lessons_score, 0::bigint) + COALESCE(rs.reading_score, 0::bigint) + COALESCE(es.exam_score, 0::bigint) AS total_score,
        COALESCE(ls.total_time_ms, 0::numeric) + COALESCE(es.exam_time_ms, 0::bigint)::numeric AS total_time_ms,
        COALESCE(ls.quizzes_completed, 0::bigint) AS quizzes_completed,
        GREATEST(COALESCE(ls.last_finished_at, '1970-01-01'::timestamptz), COALESCE(es.exam_finished_at, '1970-01-01'::timestamptz)) AS last_finished_at
    FROM all_keys k
    LEFT JOIN lesson_scores ls ON ls.person_key = k.person_key AND ls.trimester = k.trimester
    LEFT JOIN reading_scores rs ON rs.person_key = k.person_key AND rs.trimester = k.trimester
    LEFT JOIN exam_scores es ON es.person_key = k.person_key AND es.trimester = k.trimester
), participant_scores AS (
    SELECT cp.name AS participant_name, cp.class_id, c.name AS class_name,
        prof.church_id, ch.name AS church_name,
        cb.trimester, cb.total_score, cb.lessons_score, cb.reading_score, cb.exam_score,
        cb.total_time_ms, cb.quizzes_completed, cb.last_finished_at, prof.avatar_url
    FROM combined cb
    JOIN canonical_participant cp ON cp.person_key = cb.person_key
    JOIN classes c ON c.id = cp.class_id
    LEFT JOIN profiles prof ON prof.id = cp.user_id
    LEFT JOIN churches ch ON ch.id = prof.church_id
)
SELECT row_number() OVER (PARTITION BY trimester ORDER BY total_score DESC, total_time_ms, last_finished_at) AS position,
    participant_name, class_id, class_name, church_id, church_name,
    trimester, total_score, lessons_score, reading_score, exam_score,
    total_time_ms, quizzes_completed, last_finished_at, avatar_url
FROM participant_scores;

CREATE OR REPLACE VIEW public.provao_consistency_check AS
WITH attempts AS (
  SELECT qa.participant_id, p.name AS participant_name, p.class_id, c.name AS class_name,
    qa.trimester, COUNT(*) AS attempts_count, LEAST(MAX(qa.score), 22) AS best_score_capped
  FROM public.quiz_attempts qa
  JOIN public.participants p ON p.id = qa.participant_id
  LEFT JOIN public.classes c ON c.id = p.class_id
  WHERE qa.source_type = 'trimestral_rpc' AND qa.finished_at IS NOT NULL
    AND UPPER(p.name) <> 'TESTE123'
  GROUP BY qa.participant_id, p.name, p.class_id, c.name, qa.trimester
), ranking AS (
  SELECT participant_name, class_id, trimester, exam_score FROM public.ranking_trimester_consolidated
)
SELECT a.participant_id, a.participant_name, a.class_id, a.class_name, a.trimester,
  a.attempts_count, a.best_score_capped AS attempt_score,
  COALESCE(r.exam_score, 0) AS ranking_exam_score,
  CASE WHEN a.attempts_count > 1 THEN 'DUPLICATE_ATTEMPT'
       WHEN COALESCE(r.exam_score, 0) <> a.best_score_capped THEN 'SCORE_MISMATCH'
       ELSE 'OK' END AS status
FROM attempts a
LEFT JOIN ranking r ON r.participant_name = a.participant_name AND r.class_id = a.class_id AND r.trimester = a.trimester
WHERE a.attempts_count > 1 OR COALESCE(r.exam_score, 0) <> a.best_score_capped;

GRANT SELECT ON public.provao_consistency_check TO authenticated, service_role;