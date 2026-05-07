
-- 1. Add user_id to participants
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON public.participants(user_id);

-- 2. Backfill via profile name match (best-effort)
UPDATE public.participants p
SET user_id = pr.id
FROM public.profiles pr
WHERE p.user_id IS NULL
  AND LOWER(TRIM(p.name)) = LOWER(TRIM(COALESCE(pr.first_name,'') || ' ' || COALESCE(pr.last_name,'')));

-- 3. Tighten participants INSERT: must own
DROP POLICY IF EXISTS "Authenticated can create participants" ON public.participants;
CREATE POLICY "Authenticated create own participants"
ON public.participants FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL));

-- 4. Tighten quiz_attempts policies
DROP POLICY IF EXISTS "Authenticated can create attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Authenticated can finalize own attempt" ON public.quiz_attempts;

CREATE POLICY "Users create own attempts"
ON public.quiz_attempts FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.participants p
    WHERE p.id = participant_id
      AND (p.user_id = auth.uid() OR p.user_id IS NULL)
  )
);

CREATE POLICY "Users finalize own attempts"
ON public.quiz_attempts FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'superadmin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.participants p
    WHERE p.id = participant_id AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'superadmin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.participants p
    WHERE p.id = participant_id AND p.user_id = auth.uid()
  )
);

-- 5. Tighten answers INSERT
DROP POLICY IF EXISTS "Authenticated can create answers" ON public.answers;
CREATE POLICY "Users insert answers on own attempt"
ON public.answers FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.quiz_attempts qa
    JOIN public.participants p ON p.id = qa.participant_id
    WHERE qa.id = attempt_id AND p.user_id = auth.uid()
  )
);

-- 6. Harden submit_answer with ownership check
CREATE OR REPLACE FUNCTION public.submit_answer(p_attempt_id uuid, p_question_id uuid, p_selected_option text)
 RETURNS TABLE(is_correct boolean, correct_option text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_correct text;
  v_is_correct boolean;
  v_finished timestamptz;
  v_owner uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF UPPER(p_selected_option) NOT IN ('A','B','C','D') THEN
    RAISE EXCEPTION 'Invalid option';
  END IF;

  SELECT qa.finished_at, p.user_id INTO v_finished, v_owner
  FROM public.quiz_attempts qa
  JOIN public.participants p ON p.id = qa.participant_id
  WHERE qa.id = p_attempt_id;

  IF v_owner IS NULL OR v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF v_finished IS NOT NULL THEN
    RAISE EXCEPTION 'Attempt already finalized';
  END IF;

  SELECT q.correct_option INTO v_correct
  FROM public.questions q
  WHERE q.id = p_question_id;

  IF v_correct IS NULL THEN
    RAISE EXCEPTION 'Question not found';
  END IF;

  v_is_correct := (UPPER(p_selected_option) = UPPER(v_correct));

  INSERT INTO public.answers (attempt_id, question_id, selected_option, is_correct)
  VALUES (p_attempt_id, p_question_id, UPPER(p_selected_option), v_is_correct);

  RETURN QUERY SELECT v_is_correct, v_correct;
END;
$function$;

-- 7. Harden get_attempt_gabarito with ownership check (admins also allowed)
CREATE OR REPLACE FUNCTION public.get_attempt_gabarito(p_attempt_id uuid)
 RETURNS TABLE(question_id uuid, order_index integer, question_text text, option_a text, option_b text, option_c text, option_d text, correct_option text, selected_option text, is_correct boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_finished timestamptz;
  v_owner uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT qa.finished_at, p.user_id INTO v_finished, v_owner
  FROM public.quiz_attempts qa
  JOIN public.participants p ON p.id = qa.participant_id
  WHERE qa.id = p_attempt_id;

  IF NOT (v_owner = auth.uid()
          OR has_role(auth.uid(), 'admin'::app_role)
          OR has_role(auth.uid(), 'superadmin'::app_role)) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF v_finished IS NULL THEN
    RAISE EXCEPTION 'Attempt not finalized yet';
  END IF;

  RETURN QUERY
  SELECT q.id, q.order_index, q.question_text,
         q.option_a, q.option_b, q.option_c, q.option_d,
         q.correct_option, a.selected_option, a.is_correct
  FROM public.answers a
  JOIN public.questions q ON q.id = a.question_id
  WHERE a.attempt_id = p_attempt_id
  ORDER BY q.order_index ASC;
END;
$function$;

-- 8. New finalize_attempt RPC: server computes score
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

  RETURN QUERY SELECT v_score, v_total, COALESCE(p_total_time_ms, 0)::bigint, v_accuracy;
END;
$function$;

REVOKE ALL ON FUNCTION public.finalize_attempt(uuid, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finalize_attempt(uuid, bigint) TO authenticated;
