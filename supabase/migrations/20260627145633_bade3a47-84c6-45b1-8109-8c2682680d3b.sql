DROP FUNCTION IF EXISTS public.finalize_attempt(uuid, bigint);

CREATE OR REPLACE FUNCTION public.finalize_attempt(p_attempt_id uuid, p_total_time_ms bigint, p_trimester integer DEFAULT NULL::integer)
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

  IF p_trimester IS NULL AND v_inferred_trimester IS NULL THEN
      SELECT COALESCE(q.trimester, l.trimester::integer) INTO v_inferred_trimester
      FROM public.quiz_attempts qa
      LEFT JOIN public.quizzes q ON q.id = qa.quiz_id
      LEFT JOIN public.lessons l ON l.id = qa.lesson_id
      WHERE qa.id = p_attempt_id;
  ELSIF p_trimester IS NOT NULL THEN
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

  PERFORM pg_notify('rankings_update', json_build_object(
    'attempt_id', p_attempt_id,
    'participant_id', (SELECT participant_id FROM public.quiz_attempts WHERE id = p_attempt_id),
    'trimester', v_inferred_trimester
  )::text);

  RETURN QUERY SELECT v_score, v_total, COALESCE(p_total_time_ms, 0)::bigint, v_accuracy;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.finalize_attempt(uuid, bigint, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_attempt(uuid, bigint, integer) TO service_role;