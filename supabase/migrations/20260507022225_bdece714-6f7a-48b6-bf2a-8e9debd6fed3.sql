
-- 1. Force security_invoker=on for the remaining views (scanner flagged SECURITY DEFINER views)
ALTER VIEW public.ranking_by_class SET (security_invoker = on);
ALTER VIEW public.ranking_general SET (security_invoker = on);
ALTER VIEW public.ranking_weekly SET (security_invoker = on);

-- 2. Remove sensitive tables from the supabase_realtime publication so authenticated
--    subscribers can't passively receive other users' PII / private messages.
ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles;
ALTER PUBLICATION supabase_realtime DROP TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime DROP TABLE public.support_ticket_messages;
ALTER PUBLICATION supabase_realtime DROP TABLE public.user_roles;
ALTER PUBLICATION supabase_realtime DROP TABLE public.church_edit_requests;

-- 3. Pin search_path on functions still missing it (prevents search_path hijacking)
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.calculate_quiz_streak_bonus() SET search_path = public;
ALTER FUNCTION public.fn_notify_new_post() SET search_path = public;
ALTER FUNCTION public.fn_notify_post_like() SET search_path = public;
ALTER FUNCTION public.fn_notify_post_comment() SET search_path = public;
ALTER FUNCTION public.fn_notify_post_report() SET search_path = public;
ALTER FUNCTION public.notify_superadmins(text, text, text, text) SET search_path = public;
ALTER FUNCTION public.on_post_report_created() SET search_path = public;
ALTER FUNCTION public.on_post_moderation_update() SET search_path = public;
ALTER FUNCTION public.on_comment_moderation_update() SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.enforce_quiz_window() SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.get_or_create_daily_verse(uuid) SET search_path = public;
