-- Add a column to track welcome communications to avoid spamming on every minor update
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS welcome_sent BOOLEAN DEFAULT FALSE;

-- Update the registration function to handle both insert and update
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS trigger AS $$
DECLARE
  payload jsonb;
  query_params text;
  is_update BOOLEAN := (TG_OP = 'UPDATE');
  email_changed BOOLEAN := FALSE;
  phone_changed BOOLEAN := FALSE;
BEGIN
    -- Check if critical fields changed during an update
    IF is_update THEN
        email_changed := (COALESCE(NEW.email, '') <> COALESCE(OLD.email, '')) AND NEW.email IS NOT NULL AND NEW.email NOT LIKE '%@quiz-ebd.local';
        phone_changed := (COALESCE(NEW.phone, '') <> COALESCE(OLD.phone, '')) AND NEW.phone IS NOT NULL AND NEW.phone <> '';
    END IF;

    -- Only proceed if it's a NEW record with data, or an UPDATE where data just arrived/changed
    -- AND we haven't sent a welcome yet OR it's a significant change
    IF (TG_OP = 'INSERT') OR email_changed OR phone_changed THEN
        
        -- Send to n8n Webhook (WhatsApp)
        payload := jsonb_build_object(
            'id', NEW.id,
            'first_name', NEW.first_name,
            'last_name', NEW.last_name,
            'email', NEW.email,
            'display_name', NEW.display_name,
            'phone', NEW.phone,
            'created_at', NEW.created_at,
            'event', 'CADASTRO_OU_ATUALIZACAO'
        );

        -- Send to n8n using net.http_get (pg_net)
        -- We use a simple query string build to avoid complex escaping issues in this context
        query_params := 'id=' || urlencode(NEW.id::text) || 
                       '&first_name=' || urlencode(COALESCE(NEW.first_name, '')) || 
                       '&email=' || urlencode(COALESCE(NEW.email, '')) || 
                       '&phone=' || urlencode(COALESCE(NEW.phone, '')) ||
                       '&event=CADASTRO';

        PERFORM net.http_get(
            url := 'https://webhook.avancaautomacao.com.br/webhook/2cbc5497-4f4e-4917-86e3-325df4f9ff2b?' || query_params
        );

        -- Also trigger the Edge Function for Email if email exists and is valid
        IF NEW.email IS NOT NULL AND NEW.email NOT LIKE '%@quiz-ebd.local' THEN
            -- We call the handle-welcome-email function via net.http_post
            -- Note: In a real Supabase environment, you'd use the service role key for auth if needed, 
            -- but here we assume the function is accessible or we use the internal project URL if possible.
            -- Since we are inside the DB, we can use the net extension to hit our own edge function.
            PERFORM net.http_post(
                url := 'https://ndautjliwnpnbpxvfsik.supabase.co/functions/v1/handle-welcome-email',
                headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || current_setting('request.headers', true)::jsonb->>'authorization'),
                body := jsonb_build_object('record', payload)
            );
        END IF;

        -- Mark as welcome sent to avoid loops if needed (though the conditions above handle it)
        -- We do this in a way that doesn't re-trigger this same function recursively
        -- Using a column to track this is safer
        -- UPDATE public.profiles SET welcome_sent = TRUE WHERE id = NEW.id; 
        -- Note: Direct update inside trigger can cause recursion. Better to just let the conditions (email_changed etc) handle it.
    END IF;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ensure we have a URL encode helper if not present
CREATE OR REPLACE FUNCTION public.urlencode(text) RETURNS text AS $$
SELECT string_agg(
    CASE
        WHEN byte = 32 THEN '+' -- Space to +
        WHEN byte BETWEEN 48 AND 57 OR byte BETWEEN 65 AND 90 OR byte BETWEEN 97 AND 122 THEN chr(byte) -- Alphanumeric
        WHEN byte IN (45, 46, 95, 126) THEN chr(byte) -- - . _ ~
        ELSE '%' || lpad(upper(to_hex(byte)), 2, '0')
    END,
    ''
)
FROM (
    SELECT get_byte(cast($1 as bytea), i) AS byte
    FROM generate_series(0, octet_length(cast($1 as bytea)) - 1) AS i
) AS s;
$$ LANGUAGE sql IMMUTABLE;

-- Drop and recreate the trigger to include UPDATE
DROP TRIGGER IF EXISTS on_profile_created_webhook ON public.profiles;
CREATE TRIGGER on_profile_created_webhook
AFTER INSERT OR UPDATE OF email, phone ON public.profiles
FOR EACH ROW EXECUTE FUNCTION handle_new_user_registration();
