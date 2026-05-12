-- 1. Consolidar a função handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_church_id UUID;
  v_church_name TEXT;
  v_class_id_raw TEXT;
  v_class_id UUID;
  v_first TEXT;
  v_last TEXT;
  v_provider TEXT;
  v_area_text TEXT;
  v_area INTEGER;
BEGIN
  -- Captura metadados
  v_church_name := NEW.raw_user_meta_data ->> 'church';
  v_class_id_raw := NEW.raw_user_meta_data ->> 'class_id';
  v_first := NEW.raw_user_meta_data ->> 'first_name';
  v_last := NEW.raw_user_meta_data ->> 'last_name';
  v_provider := NEW.raw_app_meta_data ->> 'provider';
  v_area_text := NEW.raw_user_meta_data ->> 'area';

  -- Tenta converter class_id se for um UUID válido
  IF v_class_id_raw IS NOT NULL AND v_class_id_raw ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    v_class_id := v_class_id_raw::UUID;
  END IF;

  -- Busca ID da igreja se o nome foi fornecido
  IF v_church_name IS NOT NULL AND v_church_name NOT IN ('', 'OUTRO', 'INDIVIDUAL', 'ADICIONAR IGREJA', 'CADASTRAR IGREJA') THEN
    SELECT id INTO v_church_id FROM public.churches WHERE name = v_church_name LIMIT 1;
  END IF;

  -- Converte area se válida
  IF v_area_text IS NOT NULL AND v_area_text ~ '^[0-9]+$' THEN
    v_area := v_area_text::INTEGER;
    IF v_area < 1 OR v_area > 50 THEN v_area := NULL; END IF; -- Ajustado range se necessário
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
    class_id,
    provider,
    area
  )
  VALUES (
    NEW.id,
    v_first,
    v_last,
    TRIM(COALESCE(v_first, '') || ' ' || COALESCE(v_last, '')),
    NEW.raw_user_meta_data ->> 'phone',
    NEW.email,
    v_church_id,
    v_class_id,
    COALESCE(v_provider, 'manual'),
    v_area
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log de erro básico mas não bloqueia o auth
  RAISE WARNING 'Erro ao criar perfil para o usuário %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Corrigir on_profile_created_send_welcome para ser mais robusto
CREATE OR REPLACE FUNCTION public.on_profile_created_send_welcome()
RETURNS trigger AS $$
DECLARE
  v_apikey TEXT;
BEGIN
  -- Tenta pegar a apikey, mas se falhar (ex: fora de contexto HTTP), usa uma string vazia ou trata
  BEGIN
    v_apikey := current_setting('request.headers', true)::jsonb->>'apikey';
  EXCEPTION WHEN OTHERS THEN
    v_apikey := NULL;
  END;

  -- Só envia se tiver apikey ou se estivermos dispostos a permitir sem ela (Edge Function pode falhar 401 se vazia)
  -- Mas o ideal é que ela seja disparada via net.http_post
  PERFORM net.http_post(
    url := 'https://ndautjliwnpnbpxvfsik.supabase.co/functions/v1/handle-welcome-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(v_apikey, '')
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'record', jsonb_build_object(
        'email', NEW.email,
        'first_name', NEW.first_name,
        'display_name', NEW.display_name,
        'provider', COALESCE(NEW.provider, 'manual'),
        'id', NEW.id
      )
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
