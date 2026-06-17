
-- 1) Drop overly-permissive SELECT policies on profiles
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', p.policyname);
  END LOOP;
END $$;

-- 2) Recreate SELECT policies (row-level allows authenticated; column grants restrict PII)
CREATE POLICY "Authenticated can read profiles (safe cols)"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

-- 3) Restrict column access via GRANTs
REVOKE SELECT ON public.profiles FROM anon, authenticated;

GRANT SELECT (
  id, first_name, last_name, display_name, avatar_url,
  show_avatar_in_ranking, church_id, class_id, created_at, updated_at
) ON public.profiles TO authenticated;

GRANT ALL ON public.profiles TO service_role;

-- 4) RPC: own full profile (includes PII)
CREATE OR REPLACE FUNCTION public.get_my_profile_full()
RETURNS public.profiles
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r public.profiles;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  SELECT * INTO r FROM public.profiles WHERE id = auth.uid();
  RETURN r;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_profile_full() TO authenticated;

-- 5) RPC: admin can list full profiles (PII) with optional filters
CREATE OR REPLACE FUNCTION public.admin_get_profiles_full(
  p_ids uuid[] DEFAULT NULL,
  p_church_id uuid DEFAULT NULL
)
RETURNS SETOF public.profiles
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin')) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  RETURN QUERY
    SELECT *
    FROM public.profiles p
    WHERE (p_ids IS NULL OR p.id = ANY(p_ids))
      AND (p_church_id IS NULL OR p.church_id = p_church_id)
    ORDER BY p.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_profiles_full(uuid[], uuid) TO authenticated;
