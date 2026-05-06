-- Drop existing views
DROP VIEW IF EXISTS public.ranking_general;
DROP VIEW IF EXISTS public.ranking_weekly;
DROP VIEW IF EXISTS public.ranking_by_class;

-- Recreate ranking_general
CREATE VIEW public.ranking_general AS
 SELECT qa.id AS attempt_id,
    qa.score,
    qa.streak_bonus,
    COALESCE(qa.final_score, (qa.score + qa.streak_bonus)) AS final_score,
    qa.total_questions,
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
    row_number() OVER (PARTITION BY q.trimester ORDER BY COALESCE(qa.final_score, (qa.score + qa.streak_bonus)) DESC, COALESCE(NULLIF(qa.total_time_ms, 0), ((qa.total_time_seconds * 1000))::bigint), qa.finished_at) AS "position"
   FROM (((((public.quiz_attempts qa
     JOIN public.participants p ON ((p.id = qa.participant_id)))
     JOIN public.classes c ON ((c.id = p.class_id)))
     JOIN public.quizzes q ON ((q.id = qa.quiz_id)))
     LEFT JOIN public.profiles pr ON (((pr.id)::text = (p.id)::text)))
     LEFT JOIN public.churches ch ON ((ch.id = pr.church_id)))
  WHERE ((qa.finished_at IS NOT NULL) AND (qa.score >= 5) AND (upper(p.name) <> 'TESTE123'::text));

-- Recreate ranking_weekly
CREATE VIEW public.ranking_weekly AS
 SELECT qa.id AS attempt_id,
    row_number() OVER (PARTITION BY q.id ORDER BY qa.final_score DESC, qa.total_time_ms, qa.finished_at) AS "position",
    part.name AS participant_name,
    c.id AS class_id,
    c.name AS class_name,
    pr.church_id,
    ch.name AS church_name,
    q.id AS quiz_id,
    q.week_number,
    qa.score,
    qa.streak_bonus,
    qa.final_score,
    qa.total_questions,
    qa.total_time_seconds,
    qa.total_time_ms,
    qa.accuracy_percentage,
    qa.season_id
   FROM (((((public.quiz_attempts qa
     JOIN public.quizzes q ON ((q.id = qa.quiz_id)))
     JOIN public.participants part ON ((part.id = qa.participant_id)))
     JOIN public.classes c ON ((c.id = q.class_id)))
     LEFT JOIN public.profiles pr ON ((lower(TRIM(BOTH FROM ((pr.first_name || ' '::text) || COALESCE(pr.last_name, ''::text)))) = lower(TRIM(BOTH FROM part.name)))))
     LEFT JOIN public.churches ch ON ((ch.id = pr.church_id)))
  WHERE ((qa.finished_at IS NOT NULL) AND (q.opens_at IS NOT NULL) AND (q.closes_at IS NOT NULL) AND ((now() >= q.opens_at) AND (now() <= q.closes_at)));

-- Recreate ranking_by_class
CREATE VIEW public.ranking_by_class AS
 SELECT qa.id AS attempt_id,
    qa.score,
    qa.streak_bonus,
    COALESCE(qa.final_score, (qa.score + qa.streak_bonus)) AS final_score,
    qa.total_questions,
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
    row_number() OVER (PARTITION BY c.id, q.trimester ORDER BY COALESCE(qa.final_score, (qa.score + qa.streak_bonus)) DESC, COALESCE(NULLIF(qa.total_time_ms, 0), ((qa.total_time_seconds * 1000))::bigint), qa.finished_at) AS "position"
   FROM (((((public.quiz_attempts qa
     JOIN public.participants p ON ((p.id = qa.participant_id)))
     JOIN public.classes c ON ((c.id = p.class_id)))
     JOIN public.quizzes q ON ((q.id = qa.quiz_id)))
     LEFT JOIN public.profiles pr ON (((pr.id)::text = (p.id)::text)))
     LEFT JOIN public.churches ch ON ((ch.id = pr.church_id)))
  WHERE ((qa.finished_at IS NOT NULL) AND (qa.score >= 5) AND (upper(p.name) <> 'TESTE123'::text));
