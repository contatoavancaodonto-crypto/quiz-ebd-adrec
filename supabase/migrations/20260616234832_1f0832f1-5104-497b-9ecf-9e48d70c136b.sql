CREATE OR REPLACE FUNCTION public.calculate_quiz_streak_bonus()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
    IF NEW.finished_at IS NOT NULL AND OLD.finished_at IS NULL THEN
        NEW.streak_bonus := 0;
    END IF;
    RETURN NEW;
END;
$function$;

UPDATE public.quiz_attempts
SET streak_bonus = 0
WHERE finished_at IS NOT NULL AND streak_bonus IS DISTINCT FROM 0;