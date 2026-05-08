-- Atualizando a view ranking_weekly
CREATE OR REPLACE VIEW public.ranking_weekly AS
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
   FROM quiz_attempts qa
     JOIN quizzes q ON q.id = qa.quiz_id
     JOIN participants part ON part.id = qa.participant_id
     JOIN classes c ON c.id = q.class_id
     -- Join robusto: primeiro por user_id, depois por nome como fallback
     LEFT JOIN profiles pr ON (pr.id = part.user_id) OR (part.user_id IS NULL AND lower(trim(both from (pr.first_name || ' ' || COALESCE(pr.last_name, '')))) = lower(trim(both from part.name)))
     LEFT JOIN churches ch ON ch.id = pr.church_id
  WHERE qa.finished_at IS NOT NULL AND q.opens_at IS NOT NULL AND q.closes_at IS NOT NULL;

-- Atualizando a view ranking_by_class
CREATE OR REPLACE VIEW public.ranking_by_class AS
 SELECT qa.id AS attempt_id,
    qa.score,
    qa.streak_bonus,
    qa.final_score,
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
    row_number() OVER (PARTITION BY c.id, q.trimester ORDER BY qa.final_score DESC, (COALESCE(NULLIF(qa.total_time_ms, 0), (qa.total_time_seconds * 1000)::bigint)), qa.finished_at) AS "position"
   FROM quiz_attempts qa
     JOIN participants p ON p.id = qa.participant_id
     JOIN classes c ON c.id = p.class_id
     JOIN quizzes q ON q.id = qa.quiz_id
     LEFT JOIN profiles pr ON (pr.id = p.user_id) OR (p.user_id IS NULL AND lower(trim(both from (pr.first_name || ' ' || COALESCE(pr.last_name, '')))) = lower(trim(both from p.name)))
     LEFT JOIN churches ch ON ch.id = pr.church_id
  WHERE qa.finished_at IS NOT NULL AND qa.score >= 5 AND upper(p.name) <> 'TESTE123';

-- Atualizando a view ranking_general
CREATE OR REPLACE VIEW public.ranking_general AS
 SELECT qa.id AS attempt_id,
    qa.score,
    qa.streak_bonus,
    qa.final_score,
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
    row_number() OVER (PARTITION BY q.trimester ORDER BY qa.final_score DESC, (COALESCE(NULLIF(qa.total_time_ms, 0), (qa.total_time_seconds * 1000)::bigint)), qa.finished_at) AS "position"
   FROM quiz_attempts qa
     JOIN participants p ON p.id = qa.participant_id
     JOIN classes c ON c.id = p.class_id
     JOIN quizzes q ON q.id = qa.quiz_id
     LEFT JOIN profiles pr ON (pr.id = p.user_id) OR (p.user_id IS NULL AND lower(trim(both from (pr.first_name || ' ' || COALESCE(pr.last_name, '')))) = lower(trim(both from p.name)))
     LEFT JOIN churches ch ON ch.id = pr.church_id
  WHERE qa.finished_at IS NOT NULL AND qa.score >= 5 AND upper(p.name) <> 'TESTE123';

-- Atualizando a view ranking_season_accumulated
CREATE OR REPLACE VIEW public.ranking_season_accumulated AS
 WITH agg AS (
         SELECT 
            COALESCE(part.user_id::text, lower(TRIM(BOTH FROM part.name))) AS participant_key,
            min(part.name) AS participant_name,
            qa.season_id,
            sum(qa.final_score) AS total_score,
            sum(qa.total_time_ms) AS total_time_ms,
            count(DISTINCT qa.week_number) AS weeks_completed,
            max(qa.finished_at) AS last_finished_at,
            part.user_id
           FROM quiz_attempts qa
             JOIN participants part ON part.id = qa.participant_id
          WHERE qa.finished_at IS NOT NULL AND qa.season_id IS NOT NULL
          GROUP BY COALESCE(part.user_id::text, lower(TRIM(BOTH FROM part.name))), qa.season_id, part.user_id
        ), joined AS (
         SELECT a.participant_key,
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
             LEFT JOIN profiles pr ON (pr.id = a.user_id) OR (a.user_id IS NULL AND lower(TRIM(BOTH FROM (pr.first_name || ' '::text) || COALESCE(pr.last_name, ''::text))) = a.participant_key)
             LEFT JOIN churches ch ON ch.id = pr.church_id
             LEFT JOIN classes c ON c.id = pr.class_id
             LEFT JOIN participant_streaks ps ON ps.participant_name = a.participant_name AND ps.season_id = a.season_id
        )
 SELECT row_number() OVER (PARTITION BY season_id ORDER BY total_score DESC, total_time_ms, last_finished_at) AS "position",
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
