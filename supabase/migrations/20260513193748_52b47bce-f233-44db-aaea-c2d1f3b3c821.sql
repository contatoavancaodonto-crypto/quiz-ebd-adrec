-- Garante que a função de envio de e-mail existe
CREATE OR REPLACE FUNCTION public.handle_welcome_email_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Invoca a Edge Function de boas-vindas
  -- O Supabase enviará o payload (record) para a função
  PERFORM
    net.http_post(
      url := 'https://ndautjliwnpnbpxvfsik.supabase.co/functions/v1/handle-welcome-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('request.headers')::jsonb->>'apikey'
      ),
      body := jsonb_build_object(
        'type', 'INSERT',
        'record', row_to_json(NEW)
      )::text
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove o gatilho se já existir para evitar duplicidade ou erros
DROP TRIGGER IF EXISTS trigger_welcome_email ON public.profiles;

-- Cria o gatilho para novos perfis
CREATE TRIGGER trigger_welcome_email
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_welcome_email_trigger();
