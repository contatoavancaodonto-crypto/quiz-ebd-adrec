
-- 1) Convert SECURITY DEFINER-by-owner views to security_invoker
ALTER VIEW public.view_audit_duplicate_attempts SET (security_invoker = on);
ALTER VIEW public.ranking_general SET (security_invoker = on);
ALTER VIEW public.ranking_lesson SET (security_invoker = on);
ALTER VIEW public.ranking_by_class SET (security_invoker = on);
ALTER VIEW public.ranking_season_accumulated SET (security_invoker = on);
ALTER VIEW public.ranking_churches_weekly SET (security_invoker = on);
ALTER VIEW public.ranking_churches_classic SET (security_invoker = on);
ALTER VIEW public.ranking_monthly SET (security_invoker = on);
ALTER VIEW public.ranking_trimester_consolidated SET (security_invoker = on);
ALTER VIEW public.ranking_weekly SET (security_invoker = on);
ALTER VIEW public.ranking_churches_monthly SET (security_invoker = on);

-- 2) Set search_path on remaining functions
ALTER FUNCTION public.handle_reading_progress_updated_at() SET search_path = public;
ALTER FUNCTION public.enqueue_registration_webhook() SET search_path = public;
ALTER FUNCTION public.handle_registration_webhook() SET search_path = public;
ALTER FUNCTION public.handle_new_post_comment() SET search_path = public;
ALTER FUNCTION public.enforce_quiz_window() SET search_path = public;
ALTER FUNCTION public.get_trimestral_provao_questions(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.handle_welcome_email_trigger() SET search_path = public;
ALTER FUNCTION public.handle_registration_and_updates() SET search_path = public;
ALTER FUNCTION public.posix_regexp_placeholder(text, text) SET search_path = public;
ALTER FUNCTION public.urlencode(text) SET search_path = public;

-- 3) webhook_queue: restrict to admins/superadmins (currently RLS on, no policy)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhook_queue TO authenticated;
GRANT ALL ON public.webhook_queue TO service_role;
DROP POLICY IF EXISTS "Admins manage webhook queue" ON public.webhook_queue;
CREATE POLICY "Admins manage webhook queue"
ON public.webhook_queue
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

-- 4) Revoke EXECUTE on privileged SECURITY DEFINER functions from anon (and from authenticated where not needed)
-- Backend-only functions (cron / triggers / edge functions via service_role)
REVOKE EXECUTE ON FUNCTION public.tick_weekly_quiz_schedule() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.award_season_end_badges(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_superadmins(text, text, text, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated, public;

-- User-callable functions: revoke only anon
REVOKE EXECUTE ON FUNCTION public.submit_answer(uuid, text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.finalize_attempt(uuid, bigint) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.finalize_attempt(uuid, bigint, integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_attempt_gabarito(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.current_admin_church_id() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_get_questions_with_answer(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.approve_church_edit_request(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.reject_church_edit_request(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_or_create_daily_verse(uuid) FROM anon, public;
