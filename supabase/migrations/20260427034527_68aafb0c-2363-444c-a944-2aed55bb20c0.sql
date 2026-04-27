
-- =============================================================
-- 1) APAGAR PARTICIPANTES DUPLICADOS
-- =============================================================

-- IDs das duplicatas (todos exceto o mais antigo de cada nome+turma)
WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(TRIM(name)), class_id 
      ORDER BY created_at ASC
    ) AS rn
  FROM participants
  WHERE active = true
),
duplicates AS (
  SELECT id FROM ranked WHERE rn > 1
)
-- Apaga answers das tentativas das duplicatas
DELETE FROM public.answers
WHERE attempt_id IN (
  SELECT qa.id FROM quiz_attempts qa WHERE qa.participant_id IN (SELECT id FROM duplicates)
);

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY LOWER(TRIM(name)), class_id ORDER BY created_at ASC) AS rn
  FROM participants WHERE active = true
), duplicates AS (SELECT id FROM ranked WHERE rn > 1)
DELETE FROM public.user_badges WHERE participant_id IN (SELECT id FROM duplicates);

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY LOWER(TRIM(name)), class_id ORDER BY created_at ASC) AS rn
  FROM participants WHERE active = true
), duplicates AS (SELECT id FROM ranked WHERE rn > 1)
DELETE FROM public.quiz_attempts WHERE participant_id IN (SELECT id FROM duplicates);

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY LOWER(TRIM(name)), class_id ORDER BY created_at ASC) AS rn
  FROM participants WHERE active = true
), duplicates AS (SELECT id FROM ranked WHERE rn > 1)
DELETE FROM public.participants WHERE id IN (SELECT id FROM duplicates);

-- =============================================================
-- 2) ADICIONAR display_name EM PROFILES
-- =============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Preenche default para perfis existentes
UPDATE public.profiles
SET display_name = TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
WHERE display_name IS NULL OR display_name = '';

-- Atualiza handle_new_user para já gravar display_name padrão
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_church_id UUID;
  v_church_name TEXT;
  v_area_text TEXT;
  v_area INTEGER;
  v_first TEXT;
  v_last TEXT;
BEGIN
  v_church_name := NEW.raw_user_meta_data ->> 'church';
  v_area_text := NEW.raw_user_meta_data ->> 'area';
  v_first := NEW.raw_user_meta_data ->> 'first_name';
  v_last := NEW.raw_user_meta_data ->> 'last_name';

  IF v_church_name IS NOT NULL AND v_church_name <> '' AND v_church_name <> 'OUTRO' THEN
    SELECT id INTO v_church_id FROM public.churches WHERE name = v_church_name LIMIT 1;
  END IF;

  IF v_area_text IS NOT NULL AND v_area_text ~ '^[0-9]+$' THEN
    v_area := v_area_text::INTEGER;
    IF v_area < 1 OR v_area > 12 THEN v_area := NULL; END IF;
  END IF;

  INSERT INTO public.profiles (id, first_name, last_name, phone, email, church_id, area, display_name)
  VALUES (
    NEW.id,
    v_first,
    v_last,
    NEW.raw_user_meta_data ->> 'phone',
    NEW.email,
    v_church_id,
    v_area,
    TRIM(COALESCE(v_first, '') || ' ' || COALESCE(v_last, ''))
  );
  RETURN NEW;
END;
$function$;
