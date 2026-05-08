ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS scheduled_end_date TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.lessons.scheduled_end_date IS 'Deadline for the lesson to appear on the student home page';