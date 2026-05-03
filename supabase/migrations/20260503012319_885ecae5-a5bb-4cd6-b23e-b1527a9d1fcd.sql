-- Add class_id to daily_verse table
ALTER TABLE public.daily_verse ADD COLUMN class_id UUID REFERENCES public.classes(id);

-- Update unique constraint: one verse per day per class
-- (We allow class_id to be NULL for a "general" daily verse)
ALTER TABLE public.daily_verse DROP CONSTRAINT IF EXISTS daily_verse_date_key;
CREATE UNIQUE INDEX idx_daily_verse_date_class ON public.daily_verse (date, (COALESCE(class_id, '00000000-0000-0000-0000-000000000000'::uuid)));

-- Drop old function
DROP FUNCTION IF EXISTS public.get_or_create_daily_verse();

-- Create updated function with class support
CREATE OR REPLACE FUNCTION public.get_or_create_daily_verse(p_class_id UUID DEFAULT NULL)
RETURNS TABLE (
  verse_id UUID,
  book TEXT,
  chapter INTEGER,
  verse INTEGER,
  text TEXT,
  theme TEXT
) AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_verse_id UUID;
  v_total_verses INTEGER;
  v_target_class_id UUID := p_class_id;
BEGIN
  -- Try to find if a verse is already assigned for today and this class
  SELECT dv.verse_id INTO v_verse_id
  FROM public.daily_verse dv
  WHERE dv.date = v_today
    AND (dv.class_id = v_target_class_id OR (dv.class_id IS NULL AND v_target_class_id IS NULL));

  IF v_verse_id IS NULL THEN
    -- Count available verses for this class (fallback to general if none)
    SELECT COUNT(*) INTO v_total_verses 
    FROM public.verses v
    WHERE (v.class_id = v_target_class_id OR (v.class_id IS NULL AND v_target_class_id IS NULL));

    -- Fallback to general if no verses for specific class
    IF v_total_verses = 0 AND v_target_class_id IS NOT NULL THEN
      v_target_class_id := NULL;
      SELECT COUNT(*) INTO v_total_verses 
      FROM public.verses v
      WHERE v.class_id IS NULL;
    END IF;

    IF v_total_verses = 0 THEN
      -- Absolute fallback: pick any active verse
      SELECT COUNT(*) INTO v_total_verses FROM public.verses v WHERE v.active = true;
      IF v_total_verses = 0 THEN RETURN; END IF;
    END IF;

    -- Pick a verse not used recently for this context
    SELECT v.id INTO v_verse_id
    FROM public.verses v
    WHERE v.active = true
      AND (v.class_id = v_target_class_id OR (v.class_id IS NULL AND v_target_class_id IS NULL))
      AND NOT EXISTS (
        SELECT 1 FROM public.daily_verse dv
        WHERE dv.verse_id = v.id
          AND dv.date > (v_today - LEAST(v_total_verses, 30)) -- Don't repeat in last 30 or total pool
      )
    ORDER BY random()
    LIMIT 1;

    -- If still null, just pick any
    IF v_verse_id IS NULL THEN
      SELECT v.id INTO v_verse_id
      FROM public.verses v
      WHERE v.active = true
        AND (v.class_id = v_target_class_id OR (v.class_id IS NULL AND v_target_class_id IS NULL))
      ORDER BY random()
      LIMIT 1;
    END IF;

    -- Final fallback if still null
    IF v_verse_id IS NULL THEN
       SELECT v.id INTO v_verse_id
       FROM public.verses v
       WHERE v.active = true
       ORDER BY random()
       LIMIT 1;
    END IF;

    -- Save the selection
    IF v_verse_id IS NOT NULL THEN
      INSERT INTO public.daily_verse (date, verse_id, class_id)
      VALUES (v_today, v_verse_id, p_class_id)
      ON CONFLICT DO NOTHING;
    END IF;

    -- Re-fetch to be sure
    SELECT dv.verse_id INTO v_verse_id
    FROM public.daily_verse dv
    WHERE dv.date = v_today
      AND (dv.class_id = p_class_id OR (dv.class_id IS NULL AND p_class_id IS NULL));
  END IF;

  RETURN QUERY
  SELECT v.id, v.book, v.chapter, v.verse, v.text, v.theme
  FROM public.verses v
  WHERE v.id = v_verse_id;
END;
$$ LANGUAGE plpgsql;
