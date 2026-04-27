-- 1. Adiciona campos de lição e tipo de quiz
ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS lesson_number INT,
  ADD COLUMN IF NOT EXISTS lesson_title TEXT,
  ADD COLUMN IF NOT EXISTS lesson_key_verse_ref TEXT,
  ADD COLUMN IF NOT EXISTS lesson_key_verse_text TEXT,
  ADD COLUMN IF NOT EXISTS quiz_kind TEXT NOT NULL DEFAULT 'weekly';

-- Constraint para quiz_kind (drop+recria por idempotência)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quizzes_quiz_kind_check'
  ) THEN
    ALTER TABLE public.quizzes
      ADD CONSTRAINT quizzes_quiz_kind_check
      CHECK (quiz_kind IN ('weekly','trimestral'));
  END IF;
END $$;

-- 2. Atualiza cron para promover apenas quizzes weekly
CREATE OR REPLACE FUNCTION public.tick_weekly_quiz_schedule()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_season_id UUID;
  v_week_start TIMESTAMPTZ;
  v_week_end TIMESTAMPTZ;
  v_class RECORD;
  v_open_quiz_id UUID;
  v_next_quiz_id UUID;
  v_next_week INT;
  v_last_week INT;
BEGIN
  SELECT week_start, week_end INTO v_week_start, v_week_end
  FROM public.current_week_window();

  SELECT id INTO v_season_id
  FROM public.seasons
  WHERE status = 'active'
  ORDER BY end_date DESC
  LIMIT 1;

  IF v_season_id IS NULL THEN
    RETURN;
  END IF;

  -- Fecha quizzes weekly cuja janela já passou (segurança extra)
  UPDATE public.quizzes
  SET active = false
  WHERE season_id = v_season_id
    AND quiz_kind = 'weekly'
    AND closes_at IS NOT NULL
    AND closes_at < now()
    AND active = true
    AND NOT EXISTS (SELECT 1 WHERE closes_at >= v_week_start);

  -- Para cada turma ativa, garantir UM quiz weekly da semana corrente
  FOR v_class IN
    SELECT id FROM public.classes WHERE active = true
  LOOP
    SELECT id INTO v_open_quiz_id
    FROM public.quizzes
    WHERE class_id = v_class.id
      AND season_id = v_season_id
      AND quiz_kind = 'weekly'
      AND active = true
      AND opens_at IS NOT NULL
      AND closes_at IS NOT NULL
      AND opens_at <= now()
      AND closes_at >= now()
    LIMIT 1;

    IF v_open_quiz_id IS NOT NULL THEN
      CONTINUE;
    END IF;

    SELECT COALESCE(MAX(week_number), 0) INTO v_last_week
    FROM public.quizzes
    WHERE class_id = v_class.id
      AND season_id = v_season_id
      AND quiz_kind = 'weekly';

    v_next_week := v_last_week + 1;

    -- Próximo da fila: weekly, sem janela
    SELECT id INTO v_next_quiz_id
    FROM public.quizzes
    WHERE class_id = v_class.id
      AND season_id = v_season_id
      AND quiz_kind = 'weekly'
      AND active = true
      AND opens_at IS NULL
      AND closes_at IS NULL
    ORDER BY COALESCE(lesson_number, 999), created_at ASC
    LIMIT 1;

    IF v_next_quiz_id IS NOT NULL THEN
      UPDATE public.quizzes
      SET opens_at = v_week_start,
          closes_at = v_week_end,
          week_number = COALESCE(week_number, v_next_week)
      WHERE id = v_next_quiz_id;
    END IF;
  END LOOP;
END;
$function$;