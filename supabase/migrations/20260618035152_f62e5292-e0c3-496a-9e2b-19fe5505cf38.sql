
-- 1) churches: column-level restriction so PII not exposed via Data API
REVOKE SELECT ON public.churches FROM anon, authenticated;
GRANT SELECT (id, name, pastor_president, active, approved, requested, created_at)
  ON public.churches TO anon, authenticated;
GRANT ALL ON public.churches TO service_role;

-- 2) profiles: column-level restriction so email/phone not exposed via Data API
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (
  id, first_name, last_name, display_name, avatar_url, church_id, class_id,
  area, provider, show_avatar_in_ranking, hidden_at, has_seen_tour,
  tour_views_count, welcome_sent, created_at, updated_at
) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 3) church_edit_requests: hide proposed_requester_phone from Data API
REVOKE SELECT ON public.church_edit_requests FROM anon, authenticated;
GRANT SELECT (
  id, church_id, requested_by, proposed_name, proposed_pastor_president,
  status, reviewed_by, reviewed_at, review_note, created_at, updated_at
) ON public.church_edit_requests TO authenticated;
GRANT ALL ON public.church_edit_requests TO service_role;

-- 4) Realtime: stop broadcasting churches (PII columns leak through change events)
ALTER PUBLICATION supabase_realtime DROP TABLE public.churches;

-- 5) RPCs so church admins keep functional access to their own church + edit requests (PII included)
CREATE OR REPLACE FUNCTION public.admin_get_my_church()
RETURNS public.churches
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_church_id uuid;
  r public.churches;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin')) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  v_church_id := public.current_admin_church_id();
  IF v_church_id IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT * INTO r FROM public.churches WHERE id = v_church_id;
  RETURN r;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_my_church_edit_requests()
RETURNS SETOF public.church_edit_requests
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_church_id uuid;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin')) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  v_church_id := public.current_admin_church_id();
  IF v_church_id IS NULL THEN
    RETURN;
  END IF;
  RETURN QUERY
    SELECT * FROM public.church_edit_requests
    WHERE church_id = v_church_id
    ORDER BY created_at DESC
    LIMIT 50;
END;
$$;
