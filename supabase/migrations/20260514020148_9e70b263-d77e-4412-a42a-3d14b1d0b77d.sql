-- 1. Create a simpler, more robust trigger function that uses our queue
CREATE OR REPLACE FUNCTION public.handle_registration_and_updates()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger on INSERT or if email/phone changed and are valid
    IF (TG_OP = 'INSERT') OR 
       (COALESCE(NEW.email, '') <> COALESCE(OLD.email, '') AND NEW.email NOT LIKE '%@quiz-ebd.local') OR
       (COALESCE(NEW.phone, '') <> COALESCE(OLD.phone, '') AND NEW.phone <> '') 
    THEN
        INSERT INTO public.webhook_queue (payload, status)
        VALUES (
            jsonb_build_object(
                'type', CASE WHEN TG_OP = 'INSERT' THEN 'registration' ELSE 'update' END,
                'record', jsonb_build_object(
                    'id', NEW.id,
                    'first_name', NEW.first_name,
                    'last_name', NEW.last_name,
                    'display_name', NEW.display_name,
                    'email', NEW.email,
                    'phone', NEW.phone,
                    'church_id', NEW.church_id,
                    'class_id', NEW.class_id,
                    'created_at', NEW.created_at
                )
            ),
            'pending'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Cleanup old triggers to avoid duplicates and conflicts
DROP TRIGGER IF EXISTS trigger_enqueue_registration ON public.profiles;
DROP TRIGGER IF EXISTS trigger_welcome_email ON public.profiles;
DROP TRIGGER IF EXISTS on_profile_created_webhook ON public.profiles;

-- 3. Create the new unified trigger
CREATE TRIGGER unified_registration_welcome_trigger
AFTER INSERT OR UPDATE OF email, phone ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_registration_and_updates();
