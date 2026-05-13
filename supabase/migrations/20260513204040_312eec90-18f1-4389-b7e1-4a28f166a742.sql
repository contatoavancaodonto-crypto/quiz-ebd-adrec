-- Ativar a extensão pg_cron e pg_net
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Agendar o novo cron de forma segura
DO $$
BEGIN
    -- Tenta remover o job se ele existir
    PERFORM cron.unschedule('process-webhook-queue');
EXCEPTION WHEN OTHERS THEN
    -- Ignora erro se o job não existir
END $$;

-- Agendamos o novo cron
SELECT cron.schedule(
    'process-webhook-queue',
    '* * * * *', -- a cada minuto
    $$
    SELECT
      net.http_post(
        url := 'https://ndautjliwnpnbpxvfsik.supabase.co/functions/v1/registration-webhook',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT value FROM secrets WHERE name = 'SERVICE_ROLE_KEY') -- Tentativa de pegar a chave de serviço
        ),
        body := '{}'
      )
    $$
);
