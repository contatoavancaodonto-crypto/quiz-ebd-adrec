-- 1. Update the function for streak bonus to handle lesson-only attempts
CREATE OR REPLACE FUNCTION public.calculate_quiz_streak_bonus()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    v_quiz_kind TEXT;
    v_opens_at TIMESTAMPTZ;
    v_closes_at TIMESTAMPTZ;
BEGIN
    -- Only run when finished_at is being set (quiz completed)
    IF NEW.finished_at IS NOT NULL AND OLD.finished_at IS NULL THEN
        -- Case 1: Traditional Quiz
        IF NEW.quiz_id IS NOT NULL THEN
            SELECT quiz_kind, opens_at, closes_at
            INTO v_quiz_kind, v_opens_at, v_closes_at
            FROM public.quizzes
            WHERE id = NEW.quiz_id;
            
            IF v_quiz_kind = 'weekly' THEN
                IF v_opens_at IS NOT NULL AND v_closes_at IS NOT NULL AND 
                   NEW.finished_at >= v_opens_at AND NEW.finished_at <= v_closes_at THEN
                    NEW.streak_bonus := 1;
                ELSE
                    NEW.streak_bonus := 0;
                END IF;
            ELSE
                NEW.streak_bonus := 0;
            END IF;
        -- Case 2: Lesson-only attempt (Check-in / Reading)
        ELSIF NEW.lesson_id IS NOT NULL THEN
            SELECT scheduled_date, scheduled_end_date
            INTO v_opens_at, v_closes_at
            FROM public.lessons
            WHERE id = NEW.lesson_id;
            
            -- If finished within the scheduled window, grant +1 bonus
            IF v_opens_at IS NOT NULL AND v_closes_at IS NOT NULL AND 
               NEW.finished_at >= v_opens_at AND NEW.finished_at <= v_closes_at THEN
                NEW.streak_bonus := 1;
            ELSE
                -- Also check if it's within the same week if dates are missing or just broad
                IF v_opens_at IS NOT NULL AND extract(week from NEW.finished_at) = extract(week from v_opens_at) THEN
                    NEW.streak_bonus := 1;
                ELSE
                    NEW.streak_bonus := 0;
                END IF;
            END IF;
        ELSE
            NEW.streak_bonus := 0;
        END IF;
        
        -- Update final_score
        NEW.final_score := COALESCE(NEW.score, 0) + COALESCE(NEW.streak_bonus, 0);
    END IF;

    RETURN NEW;
END;
$function$;

-- 2. Redefine ranking_lesson to be more inclusive (LEFT JOIN quizzes) and deduplicate
CREATE OR REPLACE VIEW public.ranking_lesson AS
WITH best_attempts AS (
    SELECT DISTINCT ON (qa.participant_id, COALESCE(qa.lesson_id, qa.quiz_id)) 
        qa.id as attempt_id,
        qa.participant_id,
        qa.lesson_id,
        qa.quiz_id,
        qa.score,
        qa.streak_bonus,
        COALESCE(qa.final_score, (qa.score + COALESCE(qa.streak_bonus, 0))) AS final_score,
        qa.total_questions,
        qa.total_time_seconds,
        qa.total_time_ms,
        qa.accuracy_percentage,
        qa.season_id,
        qa.finished_at,
        qa.week_number
    FROM quiz_attempts qa
    WHERE qa.finished_at IS NOT NULL
    ORDER BY qa.participant_id, COALESCE(qa.lesson_id, qa.quiz_id), COALESCE(qa.final_score, (qa.score + COALESCE(qa.streak_bonus, 0))) DESC, qa.total_time_ms, qa.finished_at
)
SELECT 
    ba.attempt_id,
    row_number() OVER (PARTITION BY COALESCE(ba.lesson_id, ba.quiz_id) ORDER BY ba.final_score DESC, ba.total_time_ms, ba.finished_at) AS "position",
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
    ba.finished_at
FROM best_attempts ba
JOIN participants part ON part.id = ba.participant_id
JOIN classes c ON c.id = part.class_id
LEFT JOIN quizzes q ON q.id = ba.quiz_id
LEFT JOIN lessons l ON l.id = ba.lesson_id
LEFT JOIN profiles pr ON pr.id = part.user_id
LEFT JOIN churches ch ON ch.id = pr.church_id;

-- 3. Update ranking_season_accumulated to deduplicate and use best attempts only
CREATE OR REPLACE VIEW public.ranking_season_accumulated AS
WITH best_attempts AS (
    SELECT DISTINCT ON (qa.participant_id, COALESCE(qa.lesson_id, qa.quiz_id)) 
        qa.participant_id,
        qa.season_id,
        qa.total_time_ms,
        qa.finished_at,
        COALESCE(qa.final_score, (qa.score + COALESCE(qa.streak_bonus, 0))) AS final_score,
        qa.week_number
    FROM quiz_attempts qa
    WHERE qa.finished_at IS NOT NULL AND qa.season_id IS NOT NULL
    ORDER BY qa.participant_id, COALESCE(qa.lesson_id, qa.quiz_id), COALESCE(qa.final_score, (qa.score + COALESCE(qa.streak_bonus, 0))) DESC, qa.total_time_ms, qa.finished_at
),
agg AS (
    SELECT 
        ba.participant_id,
        min(part.name) AS participant_name,
        ba.season_id,
        sum(ba.final_score) AS total_score,
        sum(ba.total_time_ms) AS total_time_ms,
        count(DISTINCT ba.week_number) AS weeks_completed,
        max(ba.finished_at) AS last_finished_at,
        part.user_id
    FROM best_attempts ba
    JOIN participants part ON part.id = ba.participant_id
    GROUP BY ba.participant_id, ba.season_id, part.user_id
), 
joined AS (
    SELECT 
        a.participant_id,
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
        COALESCE(ps.current_streak, 0) AS current_streak
    FROM agg a
    LEFT JOIN profiles pr ON pr.id = a.user_id
    LEFT JOIN churches ch ON ch.id = pr.church_id
    LEFT JOIN classes c ON c.id = pr.class_id
    LEFT JOIN participant_streaks ps ON ps.participant_name = lower(TRIM(BOTH FROM a.participant_name)) AND ps.season_id = a.season_id
)
SELECT 
    row_number() OVER (PARTITION BY season_id ORDER BY total_score DESC, total_time_ms, last_finished_at) AS "position",
    participant_name,
    season_id,
    class_id,
    class_name,
    church_id,
    church_name,
    total_score,
    total_time_ms,
    weeks_completed,
    current_streak
FROM joined;