-- Tabela de versículos curados
CREATE TABLE public.verses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  text TEXT NOT NULL,
  theme TEXT NOT NULL DEFAULT 'fé',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.verses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Verses are publicly readable"
ON public.verses FOR SELECT
USING (true);

-- Tabela do versículo do dia (cache global)
CREATE TABLE public.daily_verse (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  verse_id UUID NOT NULL REFERENCES public.verses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_verse ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Daily verse is publicly readable"
ON public.daily_verse FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert daily verse"
ON public.daily_verse FOR INSERT
WITH CHECK (true);

-- Tabela de versículos salvos por usuário
CREATE TABLE public.saved_verses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verse_id UUID NOT NULL REFERENCES public.verses(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, verse_id)
);

ALTER TABLE public.saved_verses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved verses"
ON public.saved_verses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can save their own verses"
ON public.saved_verses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved verses"
ON public.saved_verses FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_saved_verses_user ON public.saved_verses(user_id);
CREATE INDEX idx_daily_verse_date ON public.daily_verse(date);

-- Função: pega ou cria versículo do dia (rotação sem repetição)
CREATE OR REPLACE FUNCTION public.get_or_create_daily_verse()
RETURNS TABLE (
  verse_id UUID,
  book TEXT,
  chapter INTEGER,
  verse INTEGER,
  text TEXT,
  theme TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_verse_id UUID;
  v_total_verses INTEGER;
  v_used_in_cycle INTEGER;
  v_cycle_start DATE;
BEGIN
  -- Já existe versículo do dia?
  SELECT dv.verse_id INTO v_verse_id
  FROM public.daily_verse dv
  WHERE dv.date = v_today;

  IF v_verse_id IS NULL THEN
    SELECT COUNT(*) INTO v_total_verses FROM public.verses;

    IF v_total_verses = 0 THEN
      RETURN;
    END IF;

    -- Determina início do ciclo atual: pega o último ciclo onde usados < total
    SELECT MIN(dv.date) INTO v_cycle_start
    FROM public.daily_verse dv
    WHERE dv.date >= (
      SELECT COALESCE(MAX(d2.date) + 1, '1900-01-01'::date)
      FROM public.daily_verse d2
      WHERE d2.date <= v_today
        AND (
          SELECT COUNT(DISTINCT verse_id)
          FROM public.daily_verse d3
          WHERE d3.date <= d2.date
        ) >= v_total_verses
    );

    -- Escolhe um versículo ainda não usado no ciclo atual
    SELECT v.id INTO v_verse_id
    FROM public.verses v
    WHERE NOT EXISTS (
      SELECT 1 FROM public.daily_verse dv
      WHERE dv.verse_id = v.id
        AND (v_cycle_start IS NULL OR dv.date >= v_cycle_start)
    )
    ORDER BY random()
    LIMIT 1;

    -- Se todos foram usados (segurança), pega qualquer um aleatório
    IF v_verse_id IS NULL THEN
      SELECT v.id INTO v_verse_id
      FROM public.verses v
      ORDER BY random()
      LIMIT 1;
    END IF;

    INSERT INTO public.daily_verse (date, verse_id)
    VALUES (v_today, v_verse_id)
    ON CONFLICT (date) DO NOTHING
    RETURNING daily_verse.verse_id INTO v_verse_id;

    -- Se houve conflito (race condition), busca o existente
    IF v_verse_id IS NULL THEN
      SELECT dv.verse_id INTO v_verse_id
      FROM public.daily_verse dv
      WHERE dv.date = v_today;
    END IF;
  END IF;

  RETURN QUERY
  SELECT v.id, v.book, v.chapter, v.verse, v.text, v.theme
  FROM public.verses v
  WHERE v.id = v_verse_id;
END;
$$;