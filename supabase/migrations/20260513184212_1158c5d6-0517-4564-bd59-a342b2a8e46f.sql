-- Ensure the pg_net extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Update the function to be more robust and send directly to n8n if possible, 
-- or keep it calling the edge function which we know works.
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payload jsonb;
  query_params text;
BEGIN
  -- Prepare the payload
  payload := jsonb_build_object(
    'id', NEW.id,
    'first_name', NEW.first_name,
    'last_name', NEW.last_name,
    'email', NEW.email,
    'display_name', NEW.display_name,
    'phone', NEW.phone,
    'created_at', NEW.created_at,
    'event', 'CADASTRO'
  );

  -- Convert payload to query params for GET request
  -- This is more reliable for n8n in some configurations
  SELECT string_agg(key || '=' || encode(value::bytea, 'escape'), '&')
  INTO query_params
  FROM jsonb_each_text(payload);

  -- Send directly to n8n using pg_net
  PERFORM net.http_get(
    url := 'https://webhook.avancaautomacao.com.br/webhook/2cbc5497-4f4e-4917-86e3-325df4f9ff2b?' || query_params
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block the user signup if the webhook fails
  RETURN NEW;
END;
$$;

-- Re-create the trigger properly
DROP TRIGGER IF EXISTS on_profile_created_webhook ON public.profiles;

CREATE TRIGGER on_profile_created_webhook
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_registration();
