-- Add scheduled_date column to verses table
ALTER TABLE public.verses 
ADD COLUMN scheduled_date DATE;

-- Add index for scheduled_date
CREATE INDEX idx_verses_scheduled_date ON public.verses(scheduled_date);
