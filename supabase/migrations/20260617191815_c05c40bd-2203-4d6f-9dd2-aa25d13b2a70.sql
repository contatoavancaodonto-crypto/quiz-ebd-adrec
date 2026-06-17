
-- 1) Revoke EXECUTE on SECURITY DEFINER functions from anon/public
REVOKE ALL ON FUNCTION public.admin_get_profiles_full(uuid[], uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_my_profile_full() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_profiles_full(uuid[], uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_profile_full() TO authenticated;

-- 2) Community bucket: add DELETE policies (owner + superadmin)
CREATE POLICY "Users delete own community images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'community' AND owner = auth.uid());

CREATE POLICY "Admins delete community images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'community' AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'superadmin'::app_role)));

-- 3) participant_streaks: restrict SELECT to authenticated only (remove PII from anon)
DROP POLICY IF EXISTS "Streaks are publicly readable" ON public.participant_streaks;
CREATE POLICY "Streaks readable by authenticated"
  ON public.participant_streaks FOR SELECT TO authenticated
  USING (true);
REVOKE SELECT ON public.participant_streaks FROM anon;

-- 4) quiz_attempts: limit cross-user reads to ranking-relevant columns via column GRANTs
--    The existing "Authenticated read finalized attempts" policy stays for ranking joins,
--    but we revoke wide column access and grant only ranking-safe columns.
REVOKE SELECT ON public.quiz_attempts FROM authenticated;
GRANT SELECT (
  id, participant_id, quiz_id, lesson_id, season_id, trimester,
  score, total_questions, accuracy_percentage, total_time_ms, total_time_seconds,
  finished_at, started_at, final_score, streak_bonus
) ON public.quiz_attempts TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.quiz_attempts TO authenticated;

-- 5) user_roles: remove church-admin self-promotion. Only superadmin can INSERT roles.
DROP POLICY IF EXISTS "Church admin can promote members of own church" ON public.user_roles;
DROP POLICY IF EXISTS "Church admin can revoke admins of own church" ON public.user_roles;

-- 6) Re-assert that 'correct_option' and 'explanation' on questions are not readable by authenticated
REVOKE SELECT (correct_option, explanation) ON public.questions FROM authenticated, anon;
