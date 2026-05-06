DROP VIEW IF EXISTS public.ranking_by_class;

CREATE VIEW public.ranking_by_class AS
 SELECT qa.id AS attempt_id,
    qa.score,
    qa.streak_bonus,
    COALESCE(qa.final_score, (qa.score + qa.streak_bonus)) AS final_score,
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
