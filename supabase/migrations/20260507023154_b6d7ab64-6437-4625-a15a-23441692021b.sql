
-- Revoke EXECUTE from anon and PUBLIC on all SECURITY DEFINER functions in public
-- Trigger functions don't need any direct grants. has_role is needed by authenticated for RLS.

REVOKE EXECUTE ON FUNCTION public.award_badges_on_finish() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_admin_church_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fn_notify_new_post() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fn_notify_post_comment() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fn_notify_post_like() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fn_notify_post_report() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_support_ticket() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.notify_on_new_material() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.notify_on_ticket_resolved() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.notify_on_ticket_response() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.on_comment_moderation_update() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.on_post_moderation_update() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.on_post_report_created() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.on_season_closed() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_attempt_season() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_streak_on_finish() FROM PUBLIC, anon;

-- Ensure authenticated retains EXECUTE on has_role (used by RLS policies)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
