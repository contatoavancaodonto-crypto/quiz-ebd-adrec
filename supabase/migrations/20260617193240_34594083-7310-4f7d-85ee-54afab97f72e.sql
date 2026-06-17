
-- 1) Recriar view ranking_trimester_consolidated com cap 22 no exam_score
DROP VIEW IF EXISTS public.ranking_churches_classic CASCADE;
DROP VIEW IF EXISTS public.ranking_trimester_consolidated CASCADE;

CREATE VIEW public.ranking_trimester_consolidated AS
WITH
participant_person AS (
  SELECT
    p.id AS participant_id,
    COALESCE(p.user_id::text, p.id::text) AS person_key,
    p.user_id,
    p.class_id,
    p.name,
    p.created_at
  FROM participants p
  WHERE UPPER(p.name) <> 'TESTE123'
),
canonical_participant AS (
  SELECT DISTINCT ON (person_key)
    person_key, participant_id, user_id, class_id, name
  FROM participant_person
  ORDER BY person_key, created_at ASC
),
person_participants AS (
  SELECT person_key, participant_id, user_id
  FROM participant_person
),
best_lesson_attempts AS (
  SELECT DISTINCT ON (pp.person_key, COALESCE(qa.lesson_id, qa.quiz_id))
    pp.person_key,
    qa.trimester,
    qa.score AS lesson_score,
    qa.total_time_ms,
    qa.finished_at
  FROM quiz_attempts qa
  JOIN person_participants pp ON pp.participant_id = qa.participant_id
  LEFT JOIN quizzes q ON q.id = qa.quiz_id
  WHERE qa.finished_at IS NOT NULL
    AND qa.trimester IS NOT NULL
    AND COALESCE(q.quiz_kind, 'weekly') <> 'trimester_exam'
  ORDER BY pp.person_key,
           COALESCE(qa.lesson_id, qa.quiz_id),
           qa.score DESC,
           qa.total_time_ms,
           qa.finished_at
),
lesson_scores AS (
  SELECT
    person_key,
    trimester,
    LEAST(SUM(LEAST(lesson_score, 5)), 65::bigint) AS lessons_score,
    SUM(total_time_ms) AS total_time_ms,
    COUNT(*) AS quizzes_completed,
    MAX(finished_at) AS last_finished_at
  FROM best_lesson_attempts
  GROUP BY person_key, trimester
),
best_exam_attempts AS (
  SELECT DISTINCT ON (pp.person_key, qa.trimester)
    pp.person_key,
    qa.trimester,
    qa.score AS exam_score,
    qa.total_time_ms,
    qa.finished_at
  FROM quiz_attempts qa
  JOIN person_participants pp ON pp.participant_id = qa.participant_id
  JOIN quizzes q ON q.id = qa.quiz_id
  WHERE qa.finished_at IS NOT NULL
    AND qa.trimester IS NOT NULL
    AND q.quiz_kind = 'trimester_exam'
  ORDER BY pp.person_key, qa.trimester, qa.score DESC, qa.total_time_ms, qa.finished_at
),
exam_scores AS (
  SELECT
    person_key,
    trimester,
    LEAST(exam_score, 22)::bigint AS exam_score,
    total_time_ms AS exam_time_ms,
    finished_at AS exam_finished_at
  FROM best_exam_attempts
),
reading_full_lessons AS (
  SELECT
    cp.person_key,
    NULLIF(l.trimester, '')::integer AS trimester,
    urp.lesson_id
  FROM user_reading_progress urp
  JOIN lessons l ON l.id = urp.lesson_id
  JOIN canonical_participant cp ON cp.user_id = urp.user_id
  WHERE urp.is_read = true
    AND l.trimester IS NOT NULL
    AND l.trimester ~ '^[0-9]+$'
  GROUP BY cp.person_key, l.trimester, urp.lesson_id
  HAVING COUNT(DISTINCT LOWER(urp.day_key)) >= 6
),
reading_scores AS (
  SELECT
    person_key,
    trimester,
    LEAST(COUNT(DISTINCT lesson_id), 13::bigint) AS reading_score
  FROM reading_full_lessons
  GROUP BY person_key, trimester
),
all_keys AS (
  SELECT person_key, trimester FROM lesson_scores
  UNION
  SELECT person_key, trimester FROM exam_scores
  UNION
  SELECT person_key, trimester FROM reading_scores
),
combined AS (
  SELECT
    k.person_key,
    k.trimester,
    COALESCE(ls.lessons_score, 0::bigint) AS lessons_score,
    COALESCE(rs.reading_score, 0::bigint) AS reading_score,
    COALESCE(es.exam_score, 0::bigint) AS exam_score,
    (COALESCE(ls.lessons_score, 0::bigint) + COALESCE(rs.reading_score, 0::bigint) + COALESCE(es.exam_score, 0::bigint)) AS total_score,
    (COALESCE(ls.total_time_ms, 0::numeric) + COALESCE(es.exam_time_ms, 0::bigint)::numeric) AS total_time_ms,
    COALESCE(ls.quizzes_completed, 0::bigint) AS quizzes_completed,
    GREATEST(
      COALESCE(ls.last_finished_at, '1970-01-01 00:00:00+00'::timestamptz),
      COALESCE(es.exam_finished_at, '1970-01-01 00:00:00+00'::timestamptz)
    ) AS last_finished_at
  FROM all_keys k
  LEFT JOIN lesson_scores ls ON ls.person_key = k.person_key AND ls.trimester = k.trimester
  LEFT JOIN reading_scores rs ON rs.person_key = k.person_key AND rs.trimester = k.trimester
  LEFT JOIN exam_scores es ON es.person_key = k.person_key AND es.trimester = k.trimester
),
participant_scores AS (
  SELECT
    cp.name AS participant_name,
    cp.class_id,
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
  JOIN canonical_participant cp ON cp.person_key = cb.person_key
  JOIN classes c ON c.id = cp.class_id
  LEFT JOIN profiles prof ON prof.id = cp.user_id
  LEFT JOIN churches ch ON ch.id = prof.church_id
)
SELECT
  ROW_NUMBER() OVER (PARTITION BY trimester ORDER BY total_score DESC, total_time_ms, last_finished_at) AS position,
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

GRANT SELECT ON public.ranking_trimester_consolidated TO anon, authenticated;
GRANT ALL ON public.ranking_trimester_consolidated TO service_role;

CREATE VIEW public.ranking_churches_classic AS
WITH agg AS (
  SELECT
    church_id,
    church_name,
    trimester,
    AVG(total_score)::numeric(10,2) AS avg_score,
    COUNT(*) AS participants_count,
    SUM(total_time_ms) AS total_time_ms
  FROM ranking_trimester_consolidated
  WHERE church_id IS NOT NULL
  GROUP BY church_id, church_name, trimester
)
SELECT
  ROW_NUMBER() OVER (PARTITION BY trimester ORDER BY avg_score DESC, total_time_ms) AS position,
  church_id,
  church_name,
  (SELECT pastor_president FROM churches WHERE id = agg.church_id) AS pastor_president,
  avg_score,
  participants_count,
  trimester
FROM agg;

GRANT SELECT ON public.ranking_churches_classic TO anon, authenticated;
GRANT ALL ON public.ranking_churches_classic TO service_role;

-- 2) Atualizar RPC do Provão para retornar 22 perguntas (13 obrigatórias + 9 extras)
CREATE OR REPLACE FUNCTION public.get_trimestral_provao_questions(p_class_id uuid, p_season_id uuid)
RETURNS TABLE(id text, question_text text, option_a text, option_b text, option_c text, option_d text, correct_option text, lesson_number integer)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
    v_trimester INTEGER;
BEGIN
    SELECT trimester INTO v_trimester FROM lessons WHERE class_id = p_class_id AND trimester IS NOT NULL LIMIT 1;

    RETURN QUERY
    WITH lesson_questions AS (
        SELECT
            (q->>'id')::TEXT as q_id,
            (q->>'pergunta')::TEXT as q_text,
            (q->'alternativas'->>'a')::TEXT as opt_a,
            (q->'alternativas'->>'b')::TEXT as opt_b,
            (q->'alternativas'->>'c')::TEXT as opt_c,
            (q->'alternativas'->>'d')::TEXT as opt_d,
            (q->>'respostaCorreta')::TEXT as resp,
            l.lesson_number
        FROM lessons l,
        LATERAL jsonb_array_elements(l.questions) q
        WHERE l.class_id = p_class_id
          AND l.trimester = v_trimester
          AND l.lesson_number BETWEEN 1 AND 13
    ),
    guaranteed_questions AS (
        SELECT DISTINCT ON (lesson_number)
            q_id, q_text, opt_a, opt_b, opt_c, opt_d, resp, lesson_number
        FROM lesson_questions
        ORDER BY lesson_number, random()
    ),
    remaining_pool AS (
        SELECT * FROM lesson_questions
        WHERE q_id NOT IN (SELECT q_id FROM guaranteed_questions)
    ),
    extra_questions AS (
        SELECT * FROM remaining_pool
        ORDER BY random()
        LIMIT 9
    ),
    final_selection AS (
        SELECT * FROM guaranteed_questions
        UNION ALL
        SELECT * FROM extra_questions
    )
    SELECT
      fs.q_id, fs.q_text, fs.opt_a, fs.opt_b, fs.opt_c, fs.opt_d, fs.resp, fs.lesson_number
    FROM final_selection fs
    ORDER BY random();
END;
$function$;
