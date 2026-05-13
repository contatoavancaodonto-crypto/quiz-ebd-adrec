-- Reconfigura o gatilho de e-mail para ser disparado pelo Supabase de forma confiável
CREATE OR REPLACE FUNCTION public.handle_welcome_email_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Registra a intenção de envio na tabela de logs para rastreamento
  -- (A tabela email_send_log já existe no projeto)
  INSERT INTO public.email_send_log (recipient_email, template_name, status)
  VALUES (NEW.email, 'Boas-vindas', 'pending');

  -- Dispara a Edge Function de boas-vindas
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
EXCEPTION WHEN OTHERS THEN
  -- Em caso de erro (ex: falta de header), garantimos que o cadastro continue
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
