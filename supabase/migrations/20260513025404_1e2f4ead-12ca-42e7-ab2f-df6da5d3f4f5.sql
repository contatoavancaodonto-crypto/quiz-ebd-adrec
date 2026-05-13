-- Create table for reading progress
CREATE TABLE IF NOT EXISTS public.user_reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL, -- Reference to the quiz/lesson ID
  day_key TEXT NOT NULL, -- e.g., 'segunda', 'terca', etc.
  is_read BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, lesson_id, day_key)
);

-- Enable RLS
ALTER TABLE public.user_reading_progress ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own reading progress"
  ON public.user_reading_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reading progress"
  ON public.user_reading_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading progress"
  ON public.user_reading_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reading progress"
  ON public.user_reading_progress FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_reading_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reading_progress_updated_at
  BEFORE UPDATE ON public.user_reading_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_reading_progress_updated_at();
