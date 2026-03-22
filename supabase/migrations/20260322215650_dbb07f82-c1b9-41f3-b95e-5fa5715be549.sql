CREATE TABLE public.suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  suggestion_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create suggestions"
  ON public.suggestions FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Suggestions are not publicly readable"
  ON public.suggestions FOR SELECT TO public
  USING (false);