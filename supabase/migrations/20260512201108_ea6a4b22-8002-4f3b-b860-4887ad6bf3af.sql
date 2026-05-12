-- Add provider column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS provider TEXT;

-- Update handle_new_user to capture provider
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_church_id UUID;
  v_church_name TEXT;
  v_class_id_raw TEXT;
  v_class_id UUID;
  v_first TEXT;
  v_last TEXT;
  v_provider TEXT;
BEGIN
  -- Captura metadados
  v_church_name := NEW.raw_user_meta_data ->> 'church';
  v_class_id_raw := NEW.raw_user_meta_data ->> 'class_id';
  v_first := NEW.raw_user_meta_data ->> 'first_name';
  v_last := NEW.raw_user_meta_data ->> 'last_name';
  v_provider := NEW.raw_app_meta_data ->> 'provider';

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
    class_id,
    provider
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
    COALESCE(v_provider, 'manual')
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erro ao criar perfil para o usuário %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$;

-- Update on_profile_created_send_welcome to pass more data
CREATE OR REPLACE FUNCTION public.on_profile_created_send_welcome()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Chama a edge function de forma assíncrona
  PERFORM net.http_post(
    url := 'https://ndautjliwnpnbpxvfsik.supabase.co/functions/v1/handle-welcome-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('request.headers', true)::jsonb->>'apikey'
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
$function$;

-- Rename template and update variables
UPDATE public.email_templates 
SET name = 'Boas-vindas',
    content_html = REPLACE(content_html, '{{nome}}', '{{name}}')
WHERE name = 'welcome';
