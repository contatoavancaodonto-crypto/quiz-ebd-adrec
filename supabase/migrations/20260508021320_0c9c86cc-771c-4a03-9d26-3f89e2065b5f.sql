CREATE OR REPLACE FUNCTION public.set_attempt_season()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_season_id uuid;
  v_week_number int;
BEGIN
  -- Tenta pegar os dados diretamente do quiz associado
  SELECT season_id, week_number INTO v_season_id, v_week_number
  FROM public.quizzes
  WHERE id = NEW.quiz_id;

  -- Se não encontrou no quiz, tenta pegar a temporada ativa (fallback)
  IF v_season_id IS NULL THEN
    SELECT id INTO v_season_id
    FROM public.seasons
    WHERE status = 'active'
    ORDER BY end_date DESC
    LIMIT 1;
  END IF;

  NEW.season_id := COALESCE(NEW.season_id, v_season_id);
  NEW.week_number := COALESCE(NEW.week_number, v_week_number);

  RETURN NEW;
END;
$function$;
