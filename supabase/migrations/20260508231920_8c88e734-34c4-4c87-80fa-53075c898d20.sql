-- Adicionar coluna trimester se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_attempts' AND column_name = 'trimester') THEN
        ALTER TABLE public.quiz_attempts ADD COLUMN trimester INTEGER;
    END IF;
END $$;

-- Atualizar a função finalize_attempt para aceitar trimester
CREATE OR REPLACE FUNCTION public.finalize_attempt(p_attempt_id uuid, p_total_time_ms bigint, p_trimester integer DEFAULT NULL)
 RETURNS TABLE(score integer, total_questions integer, total_time_ms bigint, accuracy_percentage numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_owner uuid;
  v_finished timestamptz;
  v_total int;
  v_score int;
  v_accuracy numeric;
  v_secs int;
  v_inferred_trimester int;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT qa.finished_at, qa.total_questions, p.user_id, qa.trimester
    INTO v_finished, v_total, v_owner, v_inferred_trimester
  FROM public.quiz_attempts qa
  JOIN public.participants p ON p.id = qa.participant_id
  WHERE qa.id = p_attempt_id;

  IF v_owner IS NULL OR v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF v_finished IS NOT NULL THEN
    RAISE EXCEPTION 'Attempt already finalized';
  END IF;

  -- Se o trimestre não foi passado nem está na tentativa, tenta inferir do quiz ou lição
  IF p_trimester IS NULL AND v_inferred_trimester IS NULL THEN
      SELECT COALESCE(q.trimester, l.trimester) INTO v_inferred_trimester
      FROM public.quiz_attempts qa
      LEFT JOIN public.quizzes q ON q.id = qa.quiz_id
      LEFT JOIN public.lessons l ON l.id = qa.lesson_id
      WHERE qa.id = p_attempt_id;
  ELSEIF p_trimester IS NOT NULL THEN
      v_inferred_trimester := p_trimester;
  END IF;

  SELECT COUNT(*) FILTER (WHERE is_correct) INTO v_score
  FROM public.answers WHERE attempt_id = p_attempt_id;

  IF v_total IS NULL OR v_total = 0 THEN
    v_accuracy := 0;
  ELSE
    v_accuracy := (v_score::numeric / v_total::numeric) * 100;
  END IF;

  v_secs := GREATEST(0, (COALESCE(p_total_time_ms, 0) / 1000)::int);

  UPDATE public.quiz_attempts
     SET score = v_score,
         accuracy_percentage = v_accuracy,
         total_time_seconds = v_secs,
         total_time_ms = COALESCE(p_total_time_ms, 0),
         finished_at = now(),
         trimester = v_inferred_trimester
   WHERE id = p_attempt_id;

  -- Notificar atualizações de ranking
  PERFORM pg_notify('rankings_update', json_build_object(
    'attempt_id', p_attempt_id,
    'participant_id', (SELECT participant_id FROM public.quiz_attempts WHERE id = p_attempt_id),
    'trimester', v_inferred_trimester
  )::text);

  RETURN QUERY SELECT v_score, v_total, COALESCE(p_total_time_ms, 0)::bigint, v_accuracy;
END;
$function$;

-- Criar view consolidada por trimestre (Ranking Geral Acumulado)
CREATE OR REPLACE VIEW public.ranking_trimester_consolidated AS
WITH participant_scores AS (
    SELECT 
        p.name AS participant_name,
        p.class_id,
        c.name AS class_name,
        prof.church_id,
        ch.name AS church_name,
        qa.trimester,
        SUM(COALESCE(qa.final_score, qa.score + COALESCE(qa.streak_bonus, 0))) AS total_score,
        SUM(qa.total_time_ms) AS total_time_ms,
        COUNT(qa.id) AS quizzes_completed,
        MAX(qa.finished_at) AS last_finished_at,
        prof.avatar_url
    FROM public.quiz_attempts qa
    JOIN public.participants p ON p.id = qa.participant_id
    JOIN public.classes c ON c.id = p.class_id
    LEFT JOIN public.profiles prof ON prof.id = p.user_id
    LEFT JOIN public.churches ch ON ch.id = prof.church_id
    WHERE qa.finished_at IS NOT NULL
      AND qa.trimester IS NOT NULL
    GROUP BY p.name, p.class_id, c.name, prof.church_id, ch.name, qa.trimester, prof.avatar_url
)
SELECT 
    row_number() OVER (PARTITION BY trimester ORDER BY total_score DESC, total_time_ms ASC, last_finished_at ASC) AS position,
    *
FROM participant_scores;

-- Garantir acesso às novas views
GRANT SELECT ON public.ranking_trimester_consolidated TO anon, authenticated;
