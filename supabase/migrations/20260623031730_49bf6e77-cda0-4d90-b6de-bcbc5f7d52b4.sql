-- Função que bloqueia uma segunda tentativa do Provão para o mesmo aluno/trimestre
CREATE OR REPLACE FUNCTION public.enforce_single_trimestral_attempt()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_exists boolean;
  v_trimester int;
BEGIN
  IF NEW.source_type <> 'trimestral_rpc' THEN
    RETURN NEW;
  END IF;

  -- Inferir trimestre se ausente
  v_trimester := NEW.trimester;
  IF v_trimester IS NULL THEN
    SELECT COALESCE(q.trimester, l.trimester) INTO v_trimester
    FROM (SELECT 1) x
    LEFT JOIN public.quizzes q ON q.id = NEW.quiz_id
    LEFT JOIN public.lessons l ON l.id = NEW.lesson_id;
  END IF;

  -- Já existe uma tentativa finalizada deste aluno no mesmo trimestre?
  SELECT EXISTS (
    SELECT 1 FROM public.quiz_attempts qa
    WHERE qa.participant_id = NEW.participant_id
      AND qa.source_type = 'trimestral_rpc'
      AND qa.finished_at IS NOT NULL
      AND (v_trimester IS NULL OR qa.trimester = v_trimester)
      AND qa.id <> NEW.id
  ) INTO v_exists;

  IF v_exists THEN
    RAISE EXCEPTION 'Você já realizou o Provão deste trimestre. Só é permitida uma tentativa.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_single_trimestral_attempt ON public.quiz_attempts;
CREATE TRIGGER trg_enforce_single_trimestral_attempt
BEFORE INSERT OR UPDATE OF finished_at ON public.quiz_attempts
FOR EACH ROW
EXECUTE FUNCTION public.enforce_single_trimestral_attempt();