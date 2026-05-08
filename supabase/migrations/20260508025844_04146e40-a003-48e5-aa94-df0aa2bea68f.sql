-- Corrigir a função handle_new_user para suportar class_id e outros metadados
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_church_id UUID;
  v_church_name TEXT;
  v_class_id_raw TEXT;
  v_class_id UUID;
  v_first TEXT;
  v_last TEXT;
BEGIN
  -- Captura metadados
  v_church_name := NEW.raw_user_meta_data ->> 'church';
  v_class_id_raw := NEW.raw_user_meta_data ->> 'class_id';
  v_first := NEW.raw_user_meta_data ->> 'first_name';
  v_last := NEW.raw_user_meta_data ->> 'last_name';

  -- Tenta converter class_id se for um UUID válido
  IF v_class_id_raw IS NOT NULL AND v_class_id_raw ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    v_class_id := v_class_id_raw::UUID;
  END IF;

  -- Busca ID da igreja se o nome foi fornecido
  IF v_church_name IS NOT NULL AND v_church_name NOT IN ('', 'OUTRO', 'INDIVIDUAL', 'ADICIONAR IGREJA') THEN
    SELECT id INTO v_church_id FROM public.churches WHERE name = v_church_name LIMIT 1;
  END IF;

  -- Insere o perfil
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name, 
    display_name,
    phone, 
    email, 
    church_id, 
    class_id
  )
  VALUES (
    NEW.id,
    v_first,
    v_last,
    TRIM(COALESCE(v_first, '') || ' ' || COALESCE(v_last, '')),
    NEW.raw_user_meta_data ->> 'phone',
    NEW.email,
    v_church_id,
    v_class_id
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Em caso de erro, ainda permite que o usuário seja criado no auth,
  -- mas logamos o erro (isso aparecerá nos logs do banco)
  RAISE WARNING 'Erro ao criar perfil para o usuário %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;