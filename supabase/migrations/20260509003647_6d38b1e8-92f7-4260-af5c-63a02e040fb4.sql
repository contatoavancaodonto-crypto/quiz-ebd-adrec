-- 1. Criar a nova view principal de ranking por lição
CREATE OR REPLACE VIEW public.ranking_lesson AS
SELECT 
    qa.id AS attempt_id,
    row_number() OVER (
        PARTITION BY COALESCE(qa.lesson_id, q.id) 
        ORDER BY COALESCE(qa.final_score, (qa.score + COALESCE(qa.streak_bonus, 0))) DESC, 
        qa.total_time_ms ASC, 
        qa.finished_at ASC
    ) AS "position",
    part.name AS participant_name,
    c.id AS class_id,
    c.name AS class_name,
    pr.church_id,
    ch.name AS church_name,
    q.id AS quiz_id,
    COALESCE(l.lesson_number, q.week_number) AS lesson_number,
    l.theme AS lesson_theme,
    qa.score,
    qa.streak_bonus,
    COALESCE(qa.final_score, (qa.score + COALESCE(qa.streak_bonus, 0))) AS final_score,
    qa.total_questions,
    qa.total_time_seconds,
    qa.total_time_ms,
    qa.accuracy_percentage,
    qa.season_id,
    qa.lesson_id,
    qa.finished_at
FROM quiz_attempts qa
JOIN quizzes q ON q.id = qa.quiz_id
JOIN participants part ON part.id = qa.participant_id
JOIN classes c ON c.id = q.class_id
LEFT JOIN lessons l ON l.id = qa.lesson_id
LEFT JOIN profiles pr ON (
    pr.id = part.user_id OR 
    (part.user_id IS NULL AND lower(trim(pr.first_name || ' ' || coalesce(pr.last_name, ''))) = lower(trim(part.name)))
)
LEFT JOIN churches ch ON ch.id = pr.church_id
WHERE qa.finished_at IS NOT NULL;

-- 2. Recriar ranking_weekly como alias para ranking_lesson (compatibilidade)
CREATE OR REPLACE VIEW public.ranking_weekly AS
SELECT 
    attempt_id,
    position,
    participant_name,
    class_id,
    class_name,
    church_id,
    church_name,
    quiz_id,
    lesson_number AS week_number,
    score,
    streak_bonus,
    final_score,
    total_questions,
    total_time_seconds,
    total_time_ms,
    accuracy_percentage,
    season_id
FROM public.ranking_lesson;

-- 3. Atualizar ranking_monthly
CREATE OR REPLACE VIEW public.ranking_monthly AS
WITH agg AS (
    SELECT 
        lower(TRIM(BOTH FROM part.name)) AS name_key,
        min(part.name) AS participant_name,
        qa.season_id,
        sum(COALESCE(qa.final_score, (qa.score + COALESCE(qa.streak_bonus, 0)))) AS total_score,
        sum(qa.total_time_ms) AS total_time_ms,
        count(DISTINCT COALESCE(qa.lesson_id::text, qa.quiz_id::text)) AS lessons_completed,
        max(qa.finished_at) AS last_finished_at
    FROM quiz_attempts qa
    JOIN participants part ON part.id = qa.participant_id
    WHERE qa.finished_at IS NOT NULL 
    AND date_trunc('month', qa.finished_at AT TIME ZONE 'America/Sao_Paulo') = date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo')
    GROUP BY lower(TRIM(BOTH FROM part.name)), qa.season_id
), joined AS (
    SELECT 
        a.name_key,
        a.participant_name,
        a.season_id,
        a.total_score,
        a.total_time_ms,
        a.lessons_completed,
        a.last_finished_at,
        pr.church_id,
        ch.name AS church_name,
        pr.class_id,
        c.name AS class_name,
        COALESCE(ps.current_streak, 0) AS current_streak
    FROM agg a
    LEFT JOIN profiles pr ON lower(trim(pr.first_name || ' ' || coalesce(pr.last_name, ''))) = a.name_key
    LEFT JOIN churches ch ON ch.id = pr.church_id
    LEFT JOIN classes c ON c.id = pr.class_id
    LEFT JOIN participant_streaks ps ON ps.participant_name = a.name_key AND ps.season_id = a.season_id
)
SELECT 
    row_number() OVER (ORDER BY total_score DESC, total_time_ms ASC, last_finished_at ASC) AS "position",
    participant_name,
    season_id,
    class_id,
    class_name,
    church_id,
    church_name,
    total_score,
    total_time_ms,
    lessons_completed AS weeks_completed,
    current_streak
FROM joined;

-- 4. Atualizar ranking_trimester_consolidated
CREATE OR REPLACE VIEW public.ranking_trimester_consolidated AS
WITH participant_scores AS (
    SELECT 
        p.name AS participant_name,
        p.class_id,
        c.name AS class_name,
        prof.church_id,
        ch.name AS church_name,
        qa.trimester,
        sum(COALESCE(qa.final_score, (qa.score + COALESCE(qa.streak_bonus, 0)))) AS total_score,
        sum(qa.total_time_ms) AS total_time_ms,
        count(qa.id) AS quizzes_completed,
        max(qa.finished_at) AS last_finished_at,
        prof.avatar_url
    FROM quiz_attempts qa
    JOIN participants p ON p.id = qa.participant_id
    JOIN classes c ON c.id = p.class_id
    LEFT JOIN profiles prof ON prof.id = p.user_id
    LEFT JOIN churches ch ON ch.id = prof.church_id
    WHERE qa.finished_at IS NOT NULL AND qa.trimester IS NOT NULL
    GROUP BY p.name, p.class_id, c.name, prof.church_id, ch.name, qa.trimester, prof.avatar_url
)
SELECT 
    row_number() OVER (PARTITION BY trimester ORDER BY total_score DESC, total_time_ms ASC, last_finished_at ASC) AS "position",
    participant_name,
    class_id,
    class_name,
    church_id,
    church_name,
    trimester,
    total_score,
    total_time_ms,
    quizzes_completed,
    last_finished_at,
    avatar_url
FROM participant_scores;
