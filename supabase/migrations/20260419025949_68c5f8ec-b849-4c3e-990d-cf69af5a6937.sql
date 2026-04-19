DROP FUNCTION IF EXISTS public.get_or_create_daily_verse();

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
BEGIN
  SELECT dv.verse_id INTO v_verse_id
  FROM public.daily_verse dv
  WHERE dv.date = v_today;

  IF v_verse_id IS NULL THEN
    SELECT COUNT(*) INTO v_total_verses FROM public.verses;
    IF v_total_verses = 0 THEN
      RETURN;
    END IF;

    -- Pick a verse not used in the most recent N days (where N = total verses)
    SELECT v.id INTO v_verse_id
    FROM public.verses v
    WHERE NOT EXISTS (
      SELECT 1 FROM public.daily_verse dv
      WHERE dv.verse_id = v.id
        AND dv.date > (v_today - v_total_verses)
    )
    ORDER BY random()
    LIMIT 1;

    IF v_verse_id IS NULL THEN
      SELECT v.id INTO v_verse_id
      FROM public.verses v
      ORDER BY random()
      LIMIT 1;
    END IF;

    INSERT INTO public.daily_verse (date, verse_id)
    VALUES (v_today, v_verse_id)
    ON CONFLICT (date) DO NOTHING;

    SELECT dv.verse_id INTO v_verse_id
    FROM public.daily_verse dv
    WHERE dv.date = v_today;
  END IF;

  RETURN QUERY
  SELECT v.id, v.book, v.chapter, v.verse, v.text, v.theme
  FROM public.verses v
  WHERE v.id = v_verse_id;
END;
$$;