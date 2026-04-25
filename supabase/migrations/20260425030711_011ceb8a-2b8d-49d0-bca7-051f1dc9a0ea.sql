-- =========================================================
-- WEEKLY QUIZ AUTO SCHEDULER
-- Promove o próximo quiz da fila (por turma) toda segunda 00:00
-- e fecha o atual no domingo 23:59. Tudo em America/Sao_Paulo.
-- =========================================================

-- Garantir extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Função que calcula a janela da semana corrente (seg 00:00 → dom 23:59:59)
-- em America/Sao_Paulo e devolve em UTC (timestamptz).
CREATE OR REPLACE FUNCTION public.current_week_window()
RETURNS TABLE(week_start TIMESTAMPTZ, week_end TIMESTAMPTZ)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_local_now TIMESTAMP;
  v_monday DATE;
BEGIN
  v_local_now := (now() AT TIME ZONE 'America/Sao_Paulo');
  -- date_trunc('week', ...) → segunda 00:00 (ISO week)
  v_monday := (date_trunc('week', v_local_now))::DATE;
  week_start := (v_monday::TIMESTAMP AT TIME ZONE 'America/Sao_Paulo');
  week_end := ((v_monday + INTERVAL '6 days 23 hours 59 minutes 59 seconds')::TIMESTAMP AT TIME ZONE 'America/Sao_Paulo');
  RETURN NEXT;
END;
$$;

-- Função principal: para cada turma da temporada ativa, garante
-- que existe UM quiz aberto na semana corrente. Se não existir,
-- promove o próximo quiz da fila (sem janela definida) ou ajusta
-- janelas de quizzes já agendados.
CREATE OR REPLACE FUNCTION public.tick_weekly_quiz_schedule()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  -- Janela da semana atual
  SELECT week_start, week_end INTO v_week_start, v_week_end
  FROM public.current_week_window();

  -- Temporada ativa
  SELECT id INTO v_season_id
  FROM public.seasons
  WHERE status = 'active'
  ORDER BY end_date DESC
  LIMIT 1;

  IF v_season_id IS NULL THEN
    RETURN;
  END IF;

  -- 1. Fecha quizzes que ainda estão marcados como abertos
  --    mas cuja janela já passou (segurança extra além do trigger).
  UPDATE public.quizzes
  SET active = false
  WHERE season_id = v_season_id
    AND closes_at IS NOT NULL
    AND closes_at < now()
    AND active = true
    AND NOT EXISTS (
      -- não desativa se ainda está dentro da semana corrente
      SELECT 1 WHERE closes_at >= v_week_start
    );

  -- 2. Para cada turma ativa, garantir UM quiz da semana corrente
  FOR v_class IN
    SELECT id FROM public.classes WHERE active = true
  LOOP
    -- já existe quiz aberto nesta janela?
    SELECT id INTO v_open_quiz_id
    FROM public.quizzes
    WHERE class_id = v_class.id
      AND season_id = v_season_id
      AND active = true
      AND opens_at IS NOT NULL
      AND closes_at IS NOT NULL
      AND opens_at <= now()
      AND closes_at >= now()
    LIMIT 1;

    IF v_open_quiz_id IS NOT NULL THEN
      CONTINUE; -- já tem quiz aberto para esta turma
    END IF;

    -- pega último week_number já usado nesta turma/temporada
    SELECT COALESCE(MAX(week_number), 0) INTO v_last_week
    FROM public.quizzes
    WHERE class_id = v_class.id AND season_id = v_season_id;

    v_next_week := v_last_week + 1;

    -- procura próximo quiz da fila: ativo, mesma turma/temporada,
    -- sem janela definida (quiz "rascunho/agendado" pelo admin)
    SELECT id INTO v_next_quiz_id
    FROM public.quizzes
    WHERE class_id = v_class.id
      AND season_id = v_season_id
      AND active = true
      AND opens_at IS NULL
      AND closes_at IS NULL
    ORDER BY created_at ASC
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
$$;

GRANT EXECUTE ON FUNCTION public.tick_weekly_quiz_schedule() TO postgres, service_role;

-- Remove agendamentos antigos com mesmo nome (idempotente)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT jobid FROM cron.job WHERE jobname IN ('weekly-quiz-open-monday', 'weekly-quiz-close-sunday', 'weekly-quiz-tick')
  LOOP
    PERFORM cron.unschedule(r.jobid);
  END LOOP;
END $$;

-- Roda a cada 5 min: cobre seg 00:00 (abertura) e dom 23:59 (fechamento).
-- Cron do pg_cron usa UTC. Como queremos seg 00:00 em America/Sao_Paulo (UTC-3),
-- o tick a cada 5 min é a forma mais segura de cobrir DST e evitar drift.
SELECT cron.schedule(
  'weekly-quiz-tick',
  '*/5 * * * *',
  $$ SELECT public.tick_weekly_quiz_schedule(); $$
);