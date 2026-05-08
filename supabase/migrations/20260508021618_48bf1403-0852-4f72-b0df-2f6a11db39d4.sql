-- Function to ensure all metrics are present on finish
CREATE OR REPLACE FUNCTION public.validate_and_fill_quiz_metrics()
RETURNS TRIGGER AS $$
DECLARE
  v_score INT;
  v_total INT;
BEGIN
  -- Only act when the quiz is being marked as finished
  IF NEW.finished_at IS NOT NULL AND (
    NEW.score IS NULL OR 
    NEW.accuracy_percentage IS NULL OR 
    NEW.total_time_ms IS NULL OR
    NEW.total_time_seconds IS NULL
  ) THEN
    
    -- Calculate score from answers if not provided
    IF NEW.score IS NULL THEN
      SELECT COUNT(*) FILTER (WHERE is_correct) INTO v_score
      FROM public.answers WHERE attempt_id = NEW.id;
      NEW.score := v_score;
    END IF;

    -- Ensure total_questions is set
    IF NEW.total_questions IS NULL OR NEW.total_questions = 0 THEN
      SELECT COUNT(*) INTO v_total
      FROM public.questions WHERE quiz_id = NEW.quiz_id AND active = true;
      NEW.total_questions := COALESCE(v_total, 0);
    END IF;

    -- Calculate accuracy
    IF NEW.accuracy_percentage IS NULL THEN
      IF NEW.total_questions > 0 THEN
        NEW.accuracy_percentage := (NEW.score::numeric / NEW.total_questions::numeric) * 100;
      ELSE
        NEW.accuracy_percentage := 0;
      END IF;
    END IF;

    -- Ensure time metrics
    IF NEW.total_time_ms IS NULL THEN
      NEW.total_time_ms := COALESCE(NEW.total_time_seconds * 1000, 0);
    END IF;
    
    IF NEW.total_time_seconds IS NULL THEN
      NEW.total_time_seconds := (NEW.total_time_ms / 1000)::INT;
    END IF;

  END IF;

  -- Ensure streak_bonus is never null if finished
  IF NEW.finished_at IS NOT NULL AND NEW.streak_bonus IS NULL THEN
    NEW.streak_bonus := 0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_validate_and_fill_quiz_metrics ON public.quiz_attempts;
CREATE TRIGGER trg_validate_and_fill_quiz_metrics
BEFORE INSERT OR UPDATE ON public.quiz_attempts
FOR EACH ROW
EXECUTE FUNCTION public.validate_and_fill_quiz_metrics();

-- Add a check constraint for final safety
-- We use a check constraint to ensure that no record can exist in a "finished" state without these core metrics.
ALTER TABLE public.quiz_attempts DROP CONSTRAINT IF EXISTS finished_attempts_have_metrics;
ALTER TABLE public.quiz_attempts ADD CONSTRAINT finished_attempts_have_metrics 
CHECK (
  (finished_at IS NULL) OR 
  (score IS NOT NULL AND accuracy_percentage IS NOT NULL AND total_time_ms IS NOT NULL AND total_questions IS NOT NULL)
);

-- Optimization: Ensure all existing finished records have these fields (though we checked and they seem okay)
UPDATE public.quiz_attempts 
SET 
  total_time_seconds = COALESCE(total_time_seconds, (total_time_ms / 1000)::INT, 0),
  total_time_ms = COALESCE(total_time_ms, total_time_seconds * 1000, 0),
  accuracy_percentage = COALESCE(accuracy_percentage, CASE WHEN total_questions > 0 THEN (score::numeric / total_questions::numeric) * 100 ELSE 0 END, 0),
  streak_bonus = COALESCE(streak_bonus, 0)
WHERE finished_at IS NOT NULL 
AND (score IS NULL OR accuracy_percentage IS NULL OR total_time_ms IS NULL OR total_questions IS NULL OR streak_bonus IS NULL);
