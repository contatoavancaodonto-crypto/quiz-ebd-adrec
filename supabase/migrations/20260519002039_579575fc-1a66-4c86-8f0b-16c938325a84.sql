ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tour_views_count integer NOT NULL DEFAULT 0;
UPDATE public.profiles SET tour_views_count = 2 WHERE has_seen_tour = true AND tour_views_count = 0;