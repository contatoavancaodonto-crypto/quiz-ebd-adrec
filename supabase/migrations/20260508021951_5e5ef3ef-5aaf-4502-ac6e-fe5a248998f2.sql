-- 1. Create a private internal schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS internal;

-- 2. Move trigger functions to the internal schema
-- Postgres automatically updates trigger references when a function's schema is changed
ALTER FUNCTION public.award_badges_on_finish() SET SCHEMA internal;
ALTER FUNCTION public.fn_notify_new_post() SET SCHEMA internal;
ALTER FUNCTION public.fn_notify_post_comment() SET SCHEMA internal;
ALTER FUNCTION public.fn_notify_post_like() SET SCHEMA internal;
ALTER FUNCTION public.fn_notify_post_report() SET SCHEMA internal;
ALTER FUNCTION public.handle_new_support_ticket() SET SCHEMA internal;
ALTER FUNCTION public.handle_new_user() SET SCHEMA internal;
ALTER FUNCTION public.notify_on_new_material() SET SCHEMA internal;
ALTER FUNCTION public.notify_on_ticket_resolved() SET SCHEMA internal;
ALTER FUNCTION public.notify_on_ticket_response() SET SCHEMA internal;
ALTER FUNCTION public.on_comment_moderation_update() SET SCHEMA internal;
ALTER FUNCTION public.on_post_moderation_update() SET SCHEMA internal;
ALTER FUNCTION public.on_post_report_created() SET SCHEMA internal;
ALTER FUNCTION public.on_season_closed() SET SCHEMA internal;
ALTER FUNCTION public.set_attempt_season() SET SCHEMA internal;
ALTER FUNCTION public.update_streak_on_finish() SET SCHEMA internal;

-- 3. Revoke all permissions on the internal schema from public
REVOKE ALL ON SCHEMA internal FROM PUBLIC;
GRANT USAGE ON SCHEMA internal TO postgres, service_role, authenticated, anon;

-- Note: Triggers still need EXECUTE on the functions they call.
-- When a SECURITY DEFINER function is moved, its execution rights for roles remain.
-- We want to ensure authenticated users can still fire these via triggers but not call them via RPC.
-- Since the schema 'internal' is not in the search_path of PostgREST (usually only 'public'),
-- these functions are now effectively hidden from the API.
