
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
BEGIN
  v_church_name := NEW.raw_user_meta_data ->> 'church';
  v_area_text := NEW.raw_user_meta_data ->> 'area';

  IF v_church_name IS NOT NULL AND v_church_name <> '' AND v_church_name <> 'OUTRO' THEN
    SELECT id INTO v_church_id FROM public.churches WHERE name = v_church_name LIMIT 1;
  END IF;

  IF v_area_text IS NOT NULL AND v_area_text ~ '^[0-9]+$' THEN
    v_area := v_area_text::INTEGER;
    IF v_area < 1 OR v_area > 12 THEN v_area := NULL; END IF;
  END IF;

  INSERT INTO public.profiles (id, first_name, last_name, phone, email, church_id, area)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.raw_user_meta_data ->> 'phone',
    NEW.email,
    v_church_id,
    v_area
  );
  RETURN NEW;
END;
$function$;

-- Garantir que o trigger existe (caso não tenha sido criado)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
