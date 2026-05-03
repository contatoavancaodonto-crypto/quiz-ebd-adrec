-- Drop old function
DROP FUNCTION IF EXISTS public.get_or_create_daily_verse(uuid);

-- Create updated function with scheduled_date priority
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
  -- 1. Try to find if a verse is already assigned for today in daily_verse
  SELECT dv.verse_id INTO v_verse_id
  FROM public.daily_verse dv
  WHERE dv.date = v_today
    AND (dv.class_id = v_target_class_id OR (dv.class_id IS NULL AND v_target_class_id IS NULL));

  IF v_verse_id IS NULL THEN
    -- 2. Try to find a verse specifically SCHEDULED for today in verses table
    SELECT v.id INTO v_verse_id
    FROM public.verses v
    WHERE v.active = true
      AND v.scheduled_date = v_today
      AND (v.class_id = v_target_class_id OR (v.class_id IS NULL AND v_target_class_id IS NULL))
    LIMIT 1;

    -- 3. If no scheduled verse for today, proceed with random selection logic
    IF v_verse_id IS NULL THEN
      -- Count available verses for this class (fallback to general if none)
      SELECT COUNT(*) INTO v_total_verses 
      FROM public.verses v
      WHERE v.active = true AND (v.class_id = v_target_class_id OR (v.class_id IS NULL AND v_target_class_id IS NULL));

      -- Fallback to general if no verses for specific class
      IF v_total_verses = 0 AND v_target_class_id IS NOT NULL THEN
        v_target_class_id := NULL;
        SELECT COUNT(*) INTO v_total_verses 
        FROM public.verses v
        WHERE v.active = true AND v.class_id IS NULL;
      END IF;

      IF v_total_verses > 0 THEN
        -- Pick a verse not used recently
        SELECT v.id INTO v_verse_id
        FROM public.verses v
        WHERE v.active = true
          AND (v.class_id = v_target_class_id OR (v.class_id IS NULL AND v_target_class_id IS NULL))
          AND NOT EXISTS (
            SELECT 1 FROM public.daily_verse dv
            WHERE dv.verse_id = v.id
              AND dv.date > (v_today - LEAST(v_total_verses, 30))
          )
        ORDER BY random()
        LIMIT 1;

        -- Final random fallback
        IF v_verse_id IS NULL THEN
          SELECT v.id INTO v_verse_id
          FROM public.verses v
          WHERE v.active = true
            AND (v.class_id = v_target_class_id OR (v.class_id IS NULL AND v_target_class_id IS NULL))
          ORDER BY random()
          LIMIT 1;
        END IF;
      END IF;
    END IF;

    -- Save the selection to daily_verse
    IF v_verse_id IS NOT NULL THEN
      INSERT INTO public.daily_verse (date, verse_id, class_id)
      VALUES (v_today, v_verse_id, p_class_id)
      ON CONFLICT (date, (COALESCE(class_id, '00000000-0000-0000-0000-000000000000'::uuid))) DO UPDATE 
      SET verse_id = EXCLUDED.verse_id; -- Update if we found a scheduled one today and there was already a random one
    END IF;

    -- Re-fetch to return
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
