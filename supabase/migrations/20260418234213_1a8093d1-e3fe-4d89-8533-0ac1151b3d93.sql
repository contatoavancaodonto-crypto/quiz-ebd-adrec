-- Create seasons table
CREATE TABLE public.seasons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

-- Public can read seasons (needed for countdown display)
CREATE POLICY "Seasons are publicly readable"
ON public.seasons
FOR SELECT
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_seasons_updated_at
BEFORE UPDATE ON public.seasons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for active season lookup
CREATE INDEX idx_seasons_status ON public.seasons(status);

-- Insert current season: 2º TRI 2026, ending 26/06/2026 23:59 (Brazil time = UTC-3)
INSERT INTO public.seasons (name, start_date, end_date, status)
VALUES (
  '2º TRI 2026',
  now(),
  '2026-06-27 02:59:00+00'::timestamptz,
  'active'
);