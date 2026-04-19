-- Expand allowed badge types
ALTER TABLE public.badges DROP CONSTRAINT IF EXISTS badges_type_check;
ALTER TABLE public.badges ADD CONSTRAINT badges_type_check
  CHECK (type = ANY (ARRAY[
    'church'::text, 'general'::text, 'perfect_score'::text, 'max_speed'::text,
    'permanent'::text, 'season_permanent'::text
  ]));

-- Insert new permanent season badges
INSERT INTO public.badges (code, name, description, emoji, type) VALUES
  ('season_champion', 'Campeão da Temporada', 'Melhor pontuação geral ao encerramento da temporada', '🏆', 'season_permanent'),
  ('season_top3', 'Top 3 da Temporada', '2º ou 3º lugar geral ao encerramento da temporada', '🥈', 'season_permanent'),
  ('season_church_champion', 'Melhor da Igreja na Temporada', 'Melhor da sua igreja ao encerramento da temporada', '⛪', 'season_permanent')
ON CONFLICT (code) DO NOTHING;

-- Award function
CREATE OR REPLACE FUNCTION public.award_season_end_badges(p_season_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_champion_id UUID;
  v_top3_id UUID;
  v_church_champ_id UUID;
  r RECORD;
  v_position INT;
BEGIN
  SELECT id INTO v_champion_id FROM public.badges WHERE code = 'season_champion';
  SELECT id INTO v_top3_id FROM public.badges WHERE code = 'season_top3';
  SELECT id INTO v_church_champ_id FROM public.badges WHERE code = 'season_church_champion';

  v_position := 0;
  FOR r IN
    SELECT qa.id AS attempt_id, qa.participant_id
    FROM public.quiz_attempts qa
    WHERE qa.season_id = p_season_id
      AND qa.finished_at IS NOT NULL
    ORDER BY qa.score DESC, qa.total_time_ms ASC, qa.finished_at ASC
    LIMIT 3
  LOOP
    v_position := v_position + 1;
    IF v_position = 1 THEN
      INSERT INTO public.user_badges (participant_id, badge_id, attempt_id, season_id)
      VALUES (r.participant_id, v_champion_id, r.attempt_id, p_season_id)
      ON CONFLICT DO NOTHING;
    ELSE
      INSERT INTO public.user_badges (participant_id, badge_id, attempt_id, season_id)
      VALUES (r.participant_id, v_top3_id, r.attempt_id, p_season_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  FOR r IN
    WITH ranked AS (
      SELECT
        qa.id AS attempt_id,
        qa.participant_id,
        pr.church_id,
        ROW_NUMBER() OVER (
          PARTITION BY pr.church_id
          ORDER BY qa.score DESC, qa.total_time_ms ASC, qa.finished_at ASC
        ) AS rn
      FROM public.quiz_attempts qa
      JOIN public.participants part ON part.id = qa.participant_id
      LEFT JOIN public.profiles pr
        ON LOWER(TRIM(pr.first_name || ' ' || COALESCE(pr.last_name, ''))) = LOWER(TRIM(part.name))
      WHERE qa.season_id = p_season_id
        AND qa.finished_at IS NOT NULL
        AND pr.church_id IS NOT NULL
    )
    SELECT attempt_id, participant_id FROM ranked WHERE rn = 1
  LOOP
    INSERT INTO public.user_badges (participant_id, badge_id, attempt_id, season_id)
    VALUES (r.participant_id, v_church_champ_id, r.attempt_id, p_season_id)
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

-- Trigger on season close
CREATE OR REPLACE FUNCTION public.on_season_closed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'closed' AND (OLD.status IS DISTINCT FROM 'closed') THEN
    PERFORM public.award_season_end_badges(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_season_closed ON public.seasons;
CREATE TRIGGER trg_on_season_closed
AFTER UPDATE ON public.seasons
FOR EACH ROW
EXECUTE FUNCTION public.on_season_closed();

CREATE UNIQUE INDEX IF NOT EXISTS badges_code_unique ON public.badges(code);