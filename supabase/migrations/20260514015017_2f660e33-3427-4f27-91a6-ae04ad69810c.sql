-- Update the trigger function to handle Google metadata better
CREATE OR REPLACE FUNCTION public.on_auth_user_created()
RETURNS TRIGGER AS $$
DECLARE
    full_name_text TEXT;
    first_name_text TEXT;
    last_name_text TEXT;
BEGIN
    -- Try to extract names from metadata (standard for Google/OAuth)
    full_name_text := COALESCE(
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'name',
        (new.raw_user_meta_data->>'first_name' || ' ' || new.raw_user_meta_data->>'last_name'),
        ''
    );

    first_name_text := COALESCE(
        new.raw_user_meta_data->>'first_name',
        new.raw_user_meta_data->>'given_name',
        split_part(full_name_text, ' ', 1)
    );

    last_name_text := COALESCE(
        new.raw_user_meta_data->>'last_name',
        new.raw_user_meta_data->>'family_name',
        substring(full_name_text from posix_regexp_placeholder(full_name_text, ' ')+1)
    );

    -- Fallback for last_name if it was just one word
    IF last_name_text = first_name_text THEN
        last_name_text := '';
    END IF;

    -- Ensure we use the metadata values if provided during manual signup
    IF new.raw_user_meta_data->>'first_name' IS NOT NULL THEN
        first_name_text := new.raw_user_meta_data->>'first_name';
    END IF;
    IF new.raw_user_meta_data->>'last_name' IS NOT NULL THEN
        last_name_text := new.raw_user_meta_data->>'last_name';
    END IF;

    INSERT INTO public.profiles (
        id,
        email,
        display_name,
        first_name,
        last_name,
        phone,
        class_id,
        church_id,
        provider,
        avatar_url
    ) VALUES (
        new.id,
        new.email,
        COALESCE(NULLIF(full_name_text, ''), new.email),
        first_name_text,
        last_name_text,
        new.raw_user_meta_data->>'phone',
        (new.raw_user_meta_data->>'class_id')::uuid,
        (new.raw_user_meta_data->>'church_id')::uuid,
        new.raw_app_meta_data->>'provider',
        new.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        display_name = COALESCE(profiles.display_name, EXCLUDED.display_name),
        first_name = COALESCE(profiles.first_name, EXCLUDED.first_name),
        last_name = COALESCE(profiles.last_name, EXCLUDED.last_name),
        avatar_url = COALESCE(profiles.avatar_url, EXCLUDED.avatar_url),
        provider = COALESCE(profiles.provider, EXCLUDED.provider);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Helper function for substring extraction
CREATE OR REPLACE FUNCTION posix_regexp_placeholder(text, text) RETURNS integer AS $$
  SELECT COALESCE(NULLIF(position($2 in $1), 0), 0);
$$ LANGUAGE sql IMMUTABLE;
