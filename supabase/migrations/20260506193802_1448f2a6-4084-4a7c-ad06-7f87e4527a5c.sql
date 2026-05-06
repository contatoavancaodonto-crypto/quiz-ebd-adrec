-- Add new columns to lessons table
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS scheduled_date DATE,
ADD COLUMN IF NOT EXISTS reading_theme TEXT;

-- Update RLS policies (optional, usually they cover all columns by default if using SELECT *)
-- No changes needed to policies if they are already standard.
