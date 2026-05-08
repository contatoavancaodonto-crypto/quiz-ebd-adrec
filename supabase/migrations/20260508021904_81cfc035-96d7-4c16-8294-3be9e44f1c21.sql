-- 1. Update all views to use security_invoker = true
ALTER VIEW public.ranking_monthly SET (security_invoker = true);
ALTER VIEW public.ranking_by_class SET (security_invoker = true);
ALTER VIEW public.ranking_general SET (security_invoker = true);
ALTER VIEW public.ranking_churches_weekly SET (security_invoker = true);
ALTER VIEW public.ranking_weekly SET (security_invoker = true);
ALTER VIEW public.ranking_season_accumulated SET (security_invoker = true);
ALTER VIEW public.ranking_churches_classic SET (security_invoker = true);
ALTER VIEW public.ranking_churches_monthly SET (security_invoker = true);

-- 2. Revoke default execute from PUBLIC for all SECURITY DEFINER functions in public schema
-- This prevents them from being exposed as RPCs unless explicitly granted
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.prosecdef = true
    LOOP
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC', 
            func_record.nspname, func_record.proname, func_record.args);
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM authenticated', 
            func_record.nspname, func_record.proname, func_record.args);
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM anon', 
            func_record.nspname, func_record.proname, func_record.args);
    END LOOP;
END $$;

-- 3. Grant EXECUTE back to necessary roles for RPC functions
-- Student/User RPCs
GRANT EXECUTE ON FUNCTION public.submit_answer(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_attempt(uuid, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_attempt_gabarito(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_support_ticket() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_on_ticket_response() TO authenticated;

-- Admin RPCs
GRANT EXECUTE ON FUNCTION public.admin_get_questions_with_answer(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_church_edit_request(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_church_edit_request(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_admin_church_id() TO authenticated;

-- Ensure service_role can execute everything
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- 4. Double check all SECURITY DEFINER functions have search_path set
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.prosecdef = true
    LOOP
        EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public', 
            func_record.nspname, func_record.proname, func_record.args);
    END LOOP;
END $$;
