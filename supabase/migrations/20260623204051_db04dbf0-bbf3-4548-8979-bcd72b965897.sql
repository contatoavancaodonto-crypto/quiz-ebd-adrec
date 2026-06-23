
-- 1) Fix SECURITY DEFINER views: switch to security_invoker
ALTER VIEW public.ranking_trimester_consolidated SET (security_invoker = on);
ALTER VIEW public.provao_consistency_check SET (security_invoker = on);

-- 2) Revoke EXECUTE from anon/PUBLIC on SECURITY DEFINER admin RPCs
REVOKE EXECUTE ON FUNCTION public.admin_get_my_church() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_get_my_church_edit_requests() FROM PUBLIC, anon;

-- 3) Lock down email_queue: only service_role may read/write
REVOKE ALL ON public.email_queue FROM anon, authenticated, PUBLIC;
GRANT ALL ON public.email_queue TO service_role;
