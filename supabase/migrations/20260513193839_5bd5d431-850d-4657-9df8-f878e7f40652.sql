CREATE OR REPLACE FUNCTION public.handle_welcome_email_trigger()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://ndautjliwnpnbpxvfsik.supabase.co/functions/v1/handle-welcome-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT COALESCE(
          (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_service_role_key'),
          'your-fallback-key-here' -- A Lovable vai lidar com a implantação correta
        ))
      ),
      body := jsonb_build_object(
        'type', 'INSERT',
        'record', row_to_json(NEW)
      )::text
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
