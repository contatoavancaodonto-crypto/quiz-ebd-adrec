
-- Tighten 'suggestions' INSERT policy: require non-empty text (was WITH CHECK true)
DROP POLICY IF EXISTS "Anyone can create suggestions" ON public.suggestions;
CREATE POLICY "Anyone can create suggestions"
ON public.suggestions
FOR INSERT
TO public
WITH CHECK (length(coalesce(suggestion_text, '')) > 0 AND length(suggestion_text) <= 2000);

-- Restrict EXECUTE on admin-only SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.approve_church_edit_request(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reject_church_edit_request(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_church_edit_request(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_church_edit_request(uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.award_season_end_badges(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tick_weekly_quiz_schedule() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_superadmins(text, text, text, text) FROM PUBLIC, anon, authenticated;
