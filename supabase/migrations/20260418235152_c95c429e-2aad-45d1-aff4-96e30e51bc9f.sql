-- Enable full row data on changes (so realtime payload contains all fields)
ALTER TABLE public.quiz_attempts REPLICA IDENTITY FULL;

-- Add quiz_attempts to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_attempts;