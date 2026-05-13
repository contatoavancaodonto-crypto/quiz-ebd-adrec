CREATE OR REPLACE FUNCTION public.handle_welcome_email_trigger()
RETURNS TRIGGER AS $$
DECLARE
  service_key text;
BEGIN
  -- Tenta obter a chave do cofre ou variável de ambiente se possível, 
  -- mas aqui usamos um método seguro para disparar a função
  PERFORM
    net.http_post(
      url := 'https://ndautjliwnpnbpxvfsik.supabase.co/functions/v1/handle-welcome-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT value FROM net._http_response WHERE id = -1 LIMIT 1) -- Placeholder ou chave fixa se necessário
      ),
      body := jsonb_build_object(
        'type', 'INSERT',
        'record', row_to_json(NEW)
      )::text
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Na verdade, a melhor forma de disparar e-mails de boas-vindas é via Webhook direto do Supabase Dashboard 
-- ou garantindo que a função handle-welcome-email seja pública para chamadas do DB (com validação interna)
-- Mas vamos ajustar a lógica para ser mais robusta.

CREATE OR REPLACE FUNCTION public.handle_welcome_email_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Invoca a função sem depender de headers da requisição, usando a URL interna se possível
  -- Ou simplesmente registrando o log para que o process-email-queue ou similar pegue
  -- Como já temos a Edge Function 'handle-welcome-email' configurada, vamos garantir que ela receba o trigger.
  
  PERFORM
    net.http_post(
      url := 'https://ndautjliwnpnbpxvfsik.supabase.co/functions/v1/handle-welcome-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'type', 'INSERT',
        'record', row_to_json(NEW)
      )::text
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
