-- Update finalize_attempt to notify real-time listeners
CREATE OR REPLACE FUNCTION public.finalize_attempt(p_attempt_id uuid, p_total_time_ms bigint)
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
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT qa.finished_at, qa.total_questions, p.user_id
    INTO v_finished, v_total, v_owner
  FROM public.quiz_attempts qa
  JOIN public.participants p ON p.id = qa.participant_id
  WHERE qa.id = p_attempt_id;

  IF v_owner IS NULL OR v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF v_finished IS NOT NULL THEN
    RAISE EXCEPTION 'Attempt already finalized';
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
         finished_at = now()
   WHERE id = p_attempt_id;

  -- Notify that rankings might have changed
  PERFORM pg_notify('rankings_update', json_build_object('attempt_id', p_attempt_id)::text);

  RETURN QUERY SELECT v_score, v_total, COALESCE(p_total_time_ms, 0)::bigint, v_accuracy;
END;
$function$;