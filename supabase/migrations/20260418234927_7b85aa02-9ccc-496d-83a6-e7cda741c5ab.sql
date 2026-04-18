-- 1. Add season_id to quiz_attempts
ALTER TABLE public.quiz_attempts
ADD COLUMN season_id UUID REFERENCES public.seasons(id);

CREATE INDEX idx_quiz_attempts_season ON public.quiz_attempts(season_id);

-- Backfill existing attempts with the active season
UPDATE public.quiz_attempts
SET season_id = (SELECT id FROM public.seasons WHERE status = 'active' ORDER BY end_date DESC LIMIT 1)
WHERE season_id IS NULL;

-- Auto-set season_id on insert
CREATE OR REPLACE FUNCTION public.set_attempt_season()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.season_id IS NULL THEN
    SELECT id INTO NEW.season_id
    FROM public.seasons
    WHERE status = 'active'
    ORDER BY end_date DESC
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_attempt_season
BEFORE INSERT ON public.quiz_attempts
FOR EACH ROW
EXECUTE FUNCTION public.set_attempt_season();

-- 2. Badges definitions table
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  emoji TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('church', 'general', 'perfect_score', 'max_speed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges are publicly readable"
ON public.badges FOR SELECT USING (true);

-- Seed badges
INSERT INTO public.badges (code, name, description, emoji, type) VALUES
  ('perfect_score', 'Pontuação Perfeita', 'Acertou todas as perguntas!', '🎯', 'perfect_score'),
  ('max_speed', 'Velocidade Máxima', 'Melhor tempo da temporada com pontuação máxima.', '⚡', 'max_speed'),
  ('top_church', 'Top 1 da Igreja', 'Melhor da sua igreja na temporada.', '🥇', 'church'),
  ('top_general', 'Top 1 Geral', 'Melhor de todos na temporada.', '🏆', 'general');

-- 3. User badges (conquistas por tentativa)
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  season_id UUID REFERENCES public.seasons(id),
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique per (participant, badge, season) — prevents duplicate awards in same season
CREATE UNIQUE INDEX idx_user_badges_unique_season
ON public.user_badges(participant_id, badge_id, COALESCE(season_id, '00000000-0000-0000-0000-000000000000'::uuid));

CREATE INDEX idx_user_badges_attempt ON public.user_badges(attempt_id);
CREATE INDEX idx_user_badges_season ON public.user_badges(season_id);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User badges are publicly readable"
ON public.user_badges FOR SELECT USING (true);

-- 4. Award badges trigger function
CREATE OR REPLACE FUNCTION public.award_badges_on_finish()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_church_id UUID;
  v_season_id UUID;
  v_perfect_id UUID;
  v_max_speed_id UUID;
  v_top_church_id UUID;
  v_top_general_id UUID;
  v_is_perfect BOOLEAN;
  v_existing_top_church UUID;
  v_existing_top_general UUID;
  v_existing_max_speed UUID;
  v_best_speed_attempt UUID;
BEGIN
  -- Only run when finished_at transitions from NULL to NOT NULL
  IF NEW.finished_at IS NULL OR (OLD.finished_at IS NOT NULL) THEN
    RETURN NEW;
  END IF;

  v_season_id := NEW.season_id;
  IF v_season_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find participant's church via profile (participant.name matches profile.first_name + last_name).
  -- Since participants don't have direct user link, we look up via the most recent matching profile by name.
  SELECT p.church_id INTO v_church_id
  FROM public.participants part
  LEFT JOIN public.profiles p
    ON LOWER(TRIM(p.first_name || ' ' || COALESCE(p.last_name, ''))) = LOWER(TRIM(part.name))
  WHERE part.id = NEW.participant_id
  LIMIT 1;

  -- Get badge IDs
  SELECT id INTO v_perfect_id FROM public.badges WHERE code = 'perfect_score';
  SELECT id INTO v_max_speed_id FROM public.badges WHERE code = 'max_speed';
  SELECT id INTO v_top_church_id FROM public.badges WHERE code = 'top_church';
  SELECT id INTO v_top_general_id FROM public.badges WHERE code = 'top_general';

  v_is_perfect := (NEW.score = NEW.total_questions);

  -- ============ PONTUAÇÃO PERFEITA ============
  IF v_is_perfect THEN
    INSERT INTO public.user_badges (participant_id, badge_id, attempt_id, season_id)
    VALUES (NEW.participant_id, v_perfect_id, NEW.id, v_season_id)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ============ VELOCIDADE MÁXIMA (melhor tempo entre os perfeitos da temporada) ============
  IF v_is_perfect THEN
    SELECT qa.id INTO v_best_speed_attempt
    FROM public.quiz_attempts qa
    WHERE qa.season_id = v_season_id
      AND qa.finished_at IS NOT NULL
      AND qa.score = qa.total_questions
    ORDER BY qa.total_time_ms ASC, qa.finished_at ASC
    LIMIT 1;

    IF v_best_speed_attempt = NEW.id THEN
      -- Remove previous max_speed badge from this season (transferable)
      DELETE FROM public.user_badges
      WHERE badge_id = v_max_speed_id AND season_id = v_season_id;

      INSERT INTO public.user_badges (participant_id, badge_id, attempt_id, season_id)
      VALUES (NEW.participant_id, v_max_speed_id, NEW.id, v_season_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- ============ TOP 1 DA IGREJA ============
  IF v_church_id IS NOT NULL THEN
    -- Check if anyone in same church/season has better score or same+faster time
    IF NOT EXISTS (
      SELECT 1
      FROM public.quiz_attempts qa
      JOIN public.participants part ON part.id = qa.participant_id
      LEFT JOIN public.profiles pr
        ON LOWER(TRIM(pr.first_name || ' ' || COALESCE(pr.last_name, ''))) = LOWER(TRIM(part.name))
      WHERE qa.season_id = v_season_id
        AND qa.finished_at IS NOT NULL
        AND pr.church_id = v_church_id
        AND qa.id <> NEW.id
        AND (
          qa.score > NEW.score
          OR (qa.score = NEW.score AND qa.total_time_ms < NEW.total_time_ms)
        )
    ) THEN
      -- Transfer badge: remove from other participants in this church/season
      DELETE FROM public.user_badges ub
      USING public.participants part
      LEFT JOIN public.profiles pr
        ON LOWER(TRIM(pr.first_name || ' ' || COALESCE(pr.last_name, ''))) = LOWER(TRIM(part.name))
      WHERE ub.participant_id = part.id
        AND ub.badge_id = v_top_church_id
        AND ub.season_id = v_season_id
        AND pr.church_id = v_church_id
        AND ub.participant_id <> NEW.participant_id;

      INSERT INTO public.user_badges (participant_id, badge_id, attempt_id, season_id)
      VALUES (NEW.participant_id, v_top_church_id, NEW.id, v_season_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- ============ TOP 1 GERAL ============
  IF NOT EXISTS (
    SELECT 1
    FROM public.quiz_attempts qa
    WHERE qa.season_id = v_season_id
      AND qa.finished_at IS NOT NULL
      AND qa.id <> NEW.id
      AND (
        qa.score > NEW.score
        OR (qa.score = NEW.score AND qa.total_time_ms < NEW.total_time_ms)
      )
  ) THEN
    DELETE FROM public.user_badges
    WHERE badge_id = v_top_general_id AND season_id = v_season_id;

    INSERT INTO public.user_badges (participant_id, badge_id, attempt_id, season_id)
    VALUES (NEW.participant_id, v_top_general_id, NEW.id, v_season_id)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_award_badges_on_finish
AFTER UPDATE ON public.quiz_attempts
FOR EACH ROW
EXECUTE FUNCTION public.award_badges_on_finish();