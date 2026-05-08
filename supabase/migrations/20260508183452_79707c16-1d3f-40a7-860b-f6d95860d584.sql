-- Remover as views existentes para evitar erro de mudança de estrutura
DROP VIEW IF EXISTS public.ranking_by_class;
DROP VIEW IF EXISTS public.ranking_general;

-- Recriar ranking por classe com filtro de score > 0
CREATE OR REPLACE VIEW public.ranking_by_class AS
 SELECT qa.id AS attempt_id,
    qa.quiz_id,
    qa.lesson_id,
    p.name AS participant_name,
    p.class_id,
    c.name AS class_name,
    qa.score,
    qa.total_time_ms,
    qa.total_time_seconds,
    qa.week_number,
    q.trimester,
    row_number() OVER (PARTITION BY p.class_id, qa.week_number, q.trimester ORDER BY qa.score DESC, qa.total_time_ms ASC, qa.created_at ASC) AS position
   FROM (((quiz_attempts qa
     JOIN participants p ON ((p.id = qa.participant_id)))
     JOIN classes c ON ((c.id = p.class_id)))
     LEFT JOIN quizzes q ON ((q.id = qa.quiz_id)))
  WHERE (qa.finished_at IS NOT NULL AND qa.score > 0);

-- Recriar ranking geral com filtro de score > 0
CREATE OR REPLACE VIEW public.ranking_general AS
 SELECT qa.id AS attempt_id,
    qa.quiz_id,
    qa.lesson_id,
    p.name AS participant_name,
    p.class_id,
    c.name AS class_name,
    prof.church_id,
    ch.name AS church_name,
    qa.score,
    qa.total_time_ms,
    qa.total_time_seconds,
    qa.week_number,
    q.trimester,
    row_number() OVER (PARTITION BY qa.week_number, q.trimester ORDER BY qa.score DESC, qa.total_time_ms ASC, qa.created_at ASC) AS position
   FROM (((((quiz_attempts qa
     JOIN participants p ON ((p.id = qa.participant_id)))
     JOIN classes c ON ((c.id = p.class_id)))
     LEFT JOIN profiles prof ON ((prof.id = p.user_id)))
     LEFT JOIN churches ch ON ((ch.id = prof.church_id)))
     LEFT JOIN quizzes q ON ((q.id = qa.quiz_id)))
  WHERE (qa.finished_at IS NOT NULL AND qa.score > 0);
