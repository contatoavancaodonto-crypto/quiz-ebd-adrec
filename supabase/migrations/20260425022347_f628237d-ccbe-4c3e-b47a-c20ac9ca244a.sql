
-- ============================================================
-- FASE 1: Quizzes semanais + streak + rankings
-- ============================================================

-- 1) Novos campos em quizzes
ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS week_number INTEGER,
  ADD COLUMN IF NOT EXISTS opens_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS closes_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS season_id UUID;

CREATE INDEX IF NOT EXISTS idx_quizzes_week_window
  ON public.quizzes (season_id, class_id, week_number);

CREATE INDEX IF NOT EXISTS idx_quizzes_opens_closes
  ON public.quizzes (opens_at, closes_at);

-- 2) Novos campos em quiz_attempts
ALTER TABLE public.quiz_attempts
  ADD COLUMN IF NOT EXISTS week_number INTEGER,
  ADD COLUMN IF NOT EXISTS streak_at_attempt INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_bonus INTEGER NOT NULL DEFAULT 0;

-- final_score como coluna calculada
ALTER TABLE public.quiz_attempts
  DROP COLUMN IF EXISTS final_score;

ALTER TABLE public.quiz_attempts
  ADD COLUMN final_score INTEGER GENERATED ALWAYS AS (score + streak_bonus) STORED;

CREATE INDEX IF NOT EXISTS idx_attempts_season_week
  ON public.quiz_attempts (season_id, week_number);

CREATE INDEX IF NOT EXISTS idx_attempts_final_score
  ON public.quiz_attempts (final_score DESC, total_time_ms ASC);

-- 3) Tabela participant_streaks
CREATE TABLE IF NOT EXISTS public.participant_streaks (
  participant_name TEXT NOT NULL,
  season_id UUID NOT NULL,
  current_streak INTEGER NOT NULL DEFAULT 0,
  last_week_completed INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (participant_name, season_id)
);

ALTER TABLE public.participant_streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Streaks are publicly readable" ON public.participant_streaks;
CREATE POLICY "Streaks are publicly readable"
  ON public.participant_streaks FOR SELECT
  USING (true);

-- INSERT/UPDATE/DELETE só via trigger SECURITY DEFINER (sem policies = bloqueado)

-- 4) Trigger: enforce_quiz_window (bloqueia tentativa fora da janela)
CREATE OR REPLACE FUNCTION public.enforce_quiz_window()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_opens TIMESTAMPTZ;
  v_closes TIMESTAMPTZ;
  v_week INT;
BEGIN
  SELECT opens_at, closes_at, week_number
    INTO v_opens, v_closes, v_week
  FROM public.quizzes
  WHERE id = NEW.quiz_id;

  -- só aplica regra se quiz tem janela definida (retrocompat com quizzes antigos)
  IF v_opens IS NOT NULL AND now() < v_opens THEN
    RAISE EXCEPTION 'Este quiz ainda não está aberto. Abre em %', v_opens
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_closes IS NOT NULL AND now() > v_closes THEN
    RAISE EXCEPTION 'Este quiz já está encerrado. Fechou em %', v_closes
      USING ERRCODE = 'check_violation';
  END IF;

  -- copia week_number do quiz para a attempt
  IF v_week IS NOT NULL AND NEW.week_number IS NULL THEN
    NEW.week_number := v_week;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_quiz_window_trg ON public.quiz_attempts;
CREATE TRIGGER enforce_quiz_window_trg
  BEFORE INSERT ON public.quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_quiz_window();

-- 5) Trigger: update_streak_on_finish (calcula streak + bônus ao finalizar)
CREATE OR REPLACE FUNCTION public.update_streak_on_finish()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
  v_last_week INT;
  v_current_streak INT;
  v_new_streak INT;
  v_bonus INT;
BEGIN
  -- só roda quando finished_at vai de NULL para NOT NULL e existe week_number
  IF NEW.finished_at IS NULL OR OLD.finished_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.week_number IS NULL OR NEW.season_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- nome normalizado a partir do participant
  SELECT LOWER(TRIM(name)) INTO v_name
  FROM public.participants
  WHERE id = NEW.participant_id;

  IF v_name IS NULL THEN
    RETURN NEW;
  END IF;

  -- pega streak atual
  SELECT current_streak, last_week_completed
    INTO v_current_streak, v_last_week
  FROM public.participant_streaks
  WHERE participant_name = v_name AND season_id = NEW.season_id;

  IF v_current_streak IS NULL THEN
    v_current_streak := 0;
    v_last_week := NULL;
  END IF;

  -- calcula novo streak
  IF v_last_week IS NULL OR NEW.week_number = v_last_week + 1 THEN
    v_new_streak := v_current_streak + 1;
  ELSIF NEW.week_number = v_last_week THEN
    -- mesma semana (re-finalização): não muda
    v_new_streak := v_current_streak;
  ELSE
    -- pulou semana → reseta para 1
    v_new_streak := 1;
  END IF;

  -- bônus capped em 5
  v_bonus := LEAST(v_new_streak, 5);

  -- atualiza tabela de streaks (upsert)
  INSERT INTO public.participant_streaks (participant_name, season_id, current_streak, last_week_completed, updated_at)
  VALUES (v_name, NEW.season_id, v_new_streak, NEW.week_number, now())
  ON CONFLICT (participant_name, season_id)
  DO UPDATE SET
    current_streak = EXCLUDED.current_streak,
    last_week_completed = EXCLUDED.last_week_completed,
    updated_at = now();

  -- aplica bônus na própria attempt
  UPDATE public.quiz_attempts
  SET streak_at_attempt = v_new_streak,
      streak_bonus = v_bonus
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_streak_on_finish_trg ON public.quiz_attempts;
CREATE TRIGGER update_streak_on_finish_trg
  AFTER UPDATE ON public.quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_streak_on_finish();

-- 6) View: ranking_weekly (semana corrente)
DROP VIEW IF EXISTS public.ranking_weekly CASCADE;
CREATE VIEW public.ranking_weekly AS
SELECT
  qa.id AS attempt_id,
  ROW_NUMBER() OVER (
    PARTITION BY q.id
    ORDER BY qa.final_score DESC, qa.total_time_ms ASC, qa.finished_at ASC
  ) AS position,
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
  qa.total_time_seconds,
  qa.total_time_ms,
  qa.accuracy_percentage,
  qa.season_id
FROM public.quiz_attempts qa
JOIN public.quizzes q ON q.id = qa.quiz_id
JOIN public.participants part ON part.id = qa.participant_id
JOIN public.classes c ON c.id = q.class_id
LEFT JOIN public.profiles pr ON LOWER(TRIM(pr.first_name || ' ' || COALESCE(pr.last_name, ''))) = LOWER(TRIM(part.name))
LEFT JOIN public.churches ch ON ch.id = pr.church_id
WHERE qa.finished_at IS NOT NULL
  AND q.opens_at IS NOT NULL
  AND q.closes_at IS NOT NULL
  AND now() BETWEEN q.opens_at AND q.closes_at;

-- 7) View: ranking_season_accumulated (acumulado da temporada)
DROP VIEW IF EXISTS public.ranking_season_accumulated CASCADE;
CREATE VIEW public.ranking_season_accumulated AS
WITH agg AS (
  SELECT
    LOWER(TRIM(part.name)) AS name_key,
    MIN(part.name) AS participant_name,
    qa.season_id,
    SUM(qa.final_score) AS total_score,
    SUM(qa.total_time_ms) AS total_time_ms,
    COUNT(DISTINCT qa.week_number) AS weeks_completed,
    MAX(qa.finished_at) AS last_finished_at
  FROM public.quiz_attempts qa
  JOIN public.participants part ON part.id = qa.participant_id
  WHERE qa.finished_at IS NOT NULL
    AND qa.season_id IS NOT NULL
  GROUP BY LOWER(TRIM(part.name)), qa.season_id
),
joined AS (
  SELECT
    a.*,
    pr.church_id,
    ch.name AS church_name,
    pr.class_id,
    c.name AS class_name,
    ps.current_streak
  FROM agg a
  LEFT JOIN public.profiles pr ON LOWER(TRIM(pr.first_name || ' ' || COALESCE(pr.last_name, ''))) = a.name_key
  LEFT JOIN public.churches ch ON ch.id = pr.church_id
  LEFT JOIN public.classes c ON c.id = pr.class_id
  LEFT JOIN public.participant_streaks ps ON ps.participant_name = a.name_key AND ps.season_id = a.season_id
)
SELECT
  ROW_NUMBER() OVER (
    PARTITION BY season_id
    ORDER BY total_score DESC, total_time_ms ASC, last_finished_at ASC
  ) AS position,
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
