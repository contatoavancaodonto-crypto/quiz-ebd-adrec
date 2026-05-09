-- Remover views existentes
DROP VIEW IF EXISTS public.ranking_weekly;
DROP VIEW IF EXISTS public.ranking_monthly;
DROP VIEW IF EXISTS public.ranking_trimester_consolidated;

-- 1. Recriar ranking_weekly
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
    lesson_number as week_number,
    lesson_theme,
    score,
    streak_bonus,
    final_score,
    total_questions,
    total_time_seconds,
    total_time_ms,
    accuracy_percentage,
    season_id,
    lesson_id,
    finished_at
FROM public.ranking_lesson;

-- 2. Recriar ranking_monthly
CREATE OR REPLACE VIEW public.ranking_monthly AS
WITH best_attempts AS (
    SELECT DISTINCT ON (qa.participant_id, COALESCE(qa.lesson_id, qa.quiz_id))
        qa.participant_id,
        qa.season_id,
        qa.total_time_ms,
        qa.finished_at,
        COALESCE(qa.final_score, (qa.score + COALESCE(qa.streak_bonus, 0))) as final_score,
        COALESCE(qa.lesson_id::text, qa.quiz_id::text) as lesson_key
    FROM quiz_attempts qa
    WHERE qa.finished_at IS NOT NULL
      AND (date_trunc('month', (qa.finished_at AT TIME ZONE 'America/Sao_Paulo')) = date_trunc('month', (now() AT TIME ZONE 'America/Sao_Paulo')))
    ORDER BY qa.participant_id, COALESCE(qa.lesson_id, qa.quiz_id), 
             COALESCE(qa.final_score, (qa.score + COALESCE(qa.streak_bonus, 0))) DESC, 
             qa.total_time_ms ASC, 
             qa.finished_at ASC
),
agg AS (
    SELECT 
        lower(trim(part.name)) as name_key,
        min(part.name) as participant_name,
        ba.season_id,
        sum(ba.final_score) as total_score,
        sum(ba.total_time_ms) as total_time_ms,
        count(ba.lesson_key) as lessons_completed,
        max(ba.finished_at) as last_finished_at
    FROM best_attempts ba
    JOIN participants part ON part.id = ba.participant_id
    GROUP BY lower(trim(part.name)), ba.season_id
),
joined AS (
    SELECT 
        a.name_key,
        a.participant_name,
        a.season_id,
        a.total_score,
        a.total_time_ms,
        a.lessons_completed,
        a.last_finished_at,
        pr.church_id,
        ch.name as church_name,
        pr.class_id,
        c.name as class_name,
        COALESCE(ps.current_streak, 0) as current_streak
    FROM agg a
    LEFT JOIN profiles pr ON lower(trim(pr.first_name || ' ' || COALESCE(pr.last_name, ''))) = a.name_key
    LEFT JOIN churches ch ON ch.id = pr.church_id
    LEFT JOIN classes c ON c.id = pr.class_id
    LEFT JOIN participant_streaks ps ON ps.participant_name = a.name_key AND ps.season_id = a.season_id
)
SELECT 
    row_number() OVER (ORDER BY total_score DESC, total_time_ms ASC, last_finished_at ASC) as position,
    participant_name,
    season_id,
    class_id,
    class_name,
    church_id,
    church_name,
    total_score,
    total_time_ms,
    lessons_completed as weeks_completed,
    current_streak
FROM joined;

-- 3. Recriar ranking_trimester_consolidated
CREATE OR REPLACE VIEW public.ranking_trimester_consolidated AS
WITH best_attempts AS (
    SELECT DISTINCT ON (qa.participant_id, COALESCE(qa.lesson_id, qa.quiz_id))
        qa.participant_id,
        qa.trimester,
        qa.total_time_ms,
        qa.finished_at,
        COALESCE(qa.final_score, (qa.score + COALESCE(qa.streak_bonus, 0))) as final_score
    FROM quiz_attempts qa
    WHERE qa.finished_at IS NOT NULL AND qa.trimester IS NOT NULL
    ORDER BY qa.participant_id, COALESCE(qa.lesson_id, qa.quiz_id), 
             COALESCE(qa.final_score, (qa.score + COALESCE(qa.streak_bonus, 0))) DESC, 
             qa.total_time_ms ASC, 
             qa.finished_at ASC
),
participant_scores AS (
    SELECT 
        p.name as participant_name,
        p.class_id,
        c.name as class_name,
        prof.church_id,
        ch.name as church_name,
        ba.trimester,
        sum(ba.final_score) as total_score,
        sum(ba.total_time_ms) as total_time_ms,
        count(*) as quizzes_completed,
        max(ba.finished_at) as last_finished_at,
        prof.avatar_url
    FROM best_attempts ba
    JOIN participants p ON p.id = ba.participant_id
    JOIN classes c ON c.id = p.class_id
    LEFT JOIN profiles prof ON prof.id = p.user_id
    LEFT JOIN churches ch ON ch.id = prof.church_id
    GROUP BY p.name, p.class_id, c.name, prof.church_id, ch.name, ba.trimester, prof.avatar_url
)
SELECT 
    row_number() OVER (PARTITION BY trimester ORDER BY total_score DESC, total_time_ms ASC, last_finished_at ASC) as position,
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
