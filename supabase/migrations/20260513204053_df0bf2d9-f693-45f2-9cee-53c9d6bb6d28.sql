-- Atualiza o cron para usar uma variável de ambiente do Supabase para a chave se disponível
-- No Supabase, a service_role_key pode ser passada via vault ou hardcoded se necessário, 
-- mas aqui vamos simplificar o comando para garantir a execução.

DO $$
BEGIN
    PERFORM cron.unschedule('process-webhook-queue');
EXCEPTION WHEN OTHERS THEN
END $$;

SELECT cron.schedule(
    'process-webhook-queue',
    '* * * * *',
    $$
    SELECT
      net.http_post(
        url := 'https://ndautjliwnpnbpxvfsik.supabase.co/functions/v1/registration-webhook',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := '{}'::jsonb
      )
    $$
);
