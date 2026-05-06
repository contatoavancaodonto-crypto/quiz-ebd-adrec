-- Function to calculate streak_bonus
CREATE OR REPLACE FUNCTION public.calculate_quiz_streak_bonus()
RETURNS TRIGGER AS $$
DECLARE
    v_quiz_kind TEXT;
    v_opens_at TIMESTAMPTZ;
    v_closes_at TIMESTAMPTZ;
BEGIN
    -- Only run when finished_at is being set (quiz completed)
    IF NEW.finished_at IS NOT NULL AND OLD.finished_at IS NULL THEN
        -- Get quiz metadata
        SELECT quiz_kind, opens_at, closes_at
        INTO v_quiz_kind, v_opens_at, v_closes_at
        FROM public.quizzes
        WHERE id = NEW.quiz_id;

        -- Logic for Weekly Quiz: +1 point bonus if on time
        IF v_quiz_kind = 'weekly' THEN
            -- Check if completed within window
            IF v_opens_at IS NOT NULL AND v_closes_at IS NOT NULL AND 
               NEW.finished_at >= v_opens_at AND NEW.finished_at <= v_closes_at THEN
                NEW.streak_bonus := 1;
            ELSE
                -- Keep current or set to 0 if outside window
                NEW.streak_bonus := COALESCE(NEW.streak_bonus, 0);
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run the calculation
DROP TRIGGER IF EXISTS tr_calculate_quiz_streak_bonus ON public.quiz_attempts;
CREATE TRIGGER tr_calculate_quiz_streak_bonus
BEFORE UPDATE ON public.quiz_attempts
FOR EACH ROW
EXECUTE FUNCTION public.calculate_quiz_streak_bonus();
