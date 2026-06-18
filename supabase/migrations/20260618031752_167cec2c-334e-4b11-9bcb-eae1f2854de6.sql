
-- 1) CHURCHES: hide PII columns from anonymous role
REVOKE SELECT ON public.churches FROM anon;
GRANT SELECT (id, name, pastor_president, active, approved, requested, created_at) ON public.churches TO anon;

-- 2) PROFILES: hide email/phone from anon and authenticated (admins keep RPC access)
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (
  id, first_name, last_name, display_name, avatar_url, church_id, class_id,
  area, provider, show_avatar_in_ranking, hidden_at, has_seen_tour,
  tour_views_count, welcome_sent, created_at, updated_at
) ON public.profiles TO authenticated;

-- 3) PARTICIPANT_STREAKS: restrict to owner or admin
DROP POLICY IF EXISTS "Streaks readable by authenticated" ON public.participant_streaks;
CREATE POLICY "Users read own streak"
  ON public.participant_streaks FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'superadmin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND LOWER(TRIM(COALESCE(pr.first_name,'') || ' ' || COALESCE(pr.last_name,'')))
          = LOWER(TRIM(participant_streaks.participant_name))
    )
  );

-- 4) POST_LIKES: restrict reads to authenticated
DROP POLICY IF EXISTS "Likes viewable by everyone" ON public.post_likes;
CREATE POLICY "Likes viewable by authenticated"
  ON public.post_likes FOR SELECT TO authenticated USING (true);

-- 5) Ranking views: enforce security_invoker
ALTER VIEW public.ranking_trimester_consolidated SET (security_invoker = on);
ALTER VIEW public.ranking_churches_classic SET (security_invoker = on);

-- 6) Remove quiz_attempts from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.quiz_attempts;
