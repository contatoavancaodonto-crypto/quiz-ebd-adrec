-- Update classes table to match required structure
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'slug') THEN
        ALTER TABLE public.classes ADD COLUMN slug TEXT;
    END IF;
END $$;

-- Update existing classes or insert new ones using name as conflict resolution if id is not known
INSERT INTO public.classes (name, slug)
VALUES 
    ('Adultos', 'adultos'),
    ('Jovens', 'jovens'),
    ('Adolescentes', 'adolescentes')
ON CONFLICT (name) DO UPDATE SET slug = EXCLUDED.slug;

-- Ensure all rows have slugs
UPDATE public.classes SET slug = 'adultos' WHERE name = 'Adultos' AND slug IS NULL;
UPDATE public.classes SET slug = 'jovens' WHERE name = 'Jovens' AND slug IS NULL;
UPDATE public.classes SET slug = 'adolescentes' WHERE name = 'Adolescentes' AND slug IS NULL;

-- Clean up any potential duplicates (if any exist without slugs)
-- (Skipping detailed cleanup for now assuming the logic above covers common cases)

-- Make slug unique and not null
ALTER TABLE public.classes ALTER COLUMN slug SET NOT NULL;
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'classes_slug_key'
    ) THEN
        ALTER TABLE public.classes ADD CONSTRAINT classes_slug_key UNIQUE (slug);
    END IF;
END $$;

-- Update profiles table relationships
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_class_id_fkey'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_class_id_fkey 
        FOREIGN KEY (class_id) REFERENCES public.classes(id);
    END IF;
END $$;

-- Remove area columns
ALTER TABLE public.profiles DROP COLUMN IF EXISTS area;
ALTER TABLE public.churches DROP COLUMN IF EXISTS requester_area;
ALTER TABLE public.church_edit_requests DROP COLUMN IF EXISTS proposed_requester_area;

-- Update reading_plans to include class_id
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reading_plans') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'reading_plans' AND column_name = 'class_id') THEN
            ALTER TABLE public.reading_plans ADD COLUMN class_id UUID REFERENCES public.classes(id);
        END IF;
    END IF;
END $$;

-- Update quizzes to include class_id
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'quizzes') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'class_id') THEN
            ALTER TABLE public.quizzes ADD COLUMN class_id UUID REFERENCES public.classes(id);
        END IF;
    END IF;
END $$;
