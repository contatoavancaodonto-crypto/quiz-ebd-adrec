UPDATE public.profiles 
SET has_seen_tour = true, tour_views_count = COALESCE(tour_views_count, 1)
WHERE has_seen_tour = false;