-- ============================================================
-- 1. Tabela church_edit_requests
-- ============================================================
CREATE TABLE public.church_edit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL,
  requested_by UUID NOT NULL,
  proposed_name TEXT,
  proposed_pastor_president TEXT,
  proposed_requester_phone TEXT,
  proposed_requester_area INTEGER,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_church_edit_requests_church ON public.church_edit_requests(church_id);
CREATE INDEX idx_church_edit_requests_status ON public.church_edit_requests(status);

ALTER TABLE public.church_edit_requests ENABLE ROW LEVEL SECURITY;

-- Trigger updated_at
CREATE TRIGGER trg_church_edit_requests_updated_at
  BEFORE UPDATE ON public.church_edit_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2. RLS para church_edit_requests
-- ============================================================
-- Superadmin: tudo
CREATE POLICY "Superadmin can view all edit requests"
ON public.church_edit_requests FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmin can update edit requests"
ON public.church_edit_requests FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'))
WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- Admin de igreja: vê e cria solicitações para a própria igreja
CREATE POLICY "Church admin can view own church edit requests"
ON public.church_edit_requests FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  AND church_id = public.current_admin_church_id()
);

CREATE POLICY "Church admin can create edit requests for own church"
ON public.church_edit_requests FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  AND church_id = public.current_admin_church_id()
  AND requested_by = auth.uid()
  AND status = 'pending'
);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.church_edit_requests;

-- ============================================================
-- 3. RLS para user_roles: admin de igreja gerencia admins locais
-- ============================================================
-- INSERT: admin de igreja pode promover MEMBROS DA SUA IGREJA a 'admin' com seu próprio church_id
CREATE POLICY "Church admin can promote members of own church"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  AND role = 'admin'
  AND church_id IS NOT NULL
  AND church_id = public.current_admin_church_id()
);

-- DELETE: admin de igreja pode remover admins da própria igreja (e não pode remover superadmin)
CREATE POLICY "Church admin can revoke admins of own church"
ON public.user_roles FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  AND role = 'admin'
  AND church_id = public.current_admin_church_id()
);

-- Admin de igreja precisa ler quem são os admins da sua igreja
CREATE POLICY "Church admin can view admins of own church"
ON public.user_roles FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  AND role = 'admin'
  AND church_id = public.current_admin_church_id()
);

-- ============================================================
-- 4. Função: aprovar solicitação (atomicamente aplica ao churches)
-- ============================================================
CREATE OR REPLACE FUNCTION public.approve_church_edit_request(p_request_id UUID, p_note TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req public.church_edit_requests%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'superadmin') THEN
    RAISE EXCEPTION 'Apenas superadmin pode aprovar solicitações';
  END IF;

  SELECT * INTO v_req FROM public.church_edit_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitação não encontrada';
  END IF;

  IF v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'Solicitação já processada';
  END IF;

  UPDATE public.churches
  SET
    name = COALESCE(NULLIF(v_req.proposed_name, ''), name),
    pastor_president = COALESCE(NULLIF(v_req.proposed_pastor_president, ''), pastor_president),
    requester_phone = COALESCE(NULLIF(v_req.proposed_requester_phone, ''), requester_phone),
    requester_area = COALESCE(v_req.proposed_requester_area, requester_area)
  WHERE id = v_req.church_id;

  UPDATE public.church_edit_requests
  SET status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      review_note = p_note
  WHERE id = p_request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_church_edit_request(p_request_id UUID, p_note TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'superadmin') THEN
    RAISE EXCEPTION 'Apenas superadmin pode rejeitar solicitações';
  END IF;

  UPDATE public.church_edit_requests
  SET status = 'rejected',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      review_note = p_note
  WHERE id = p_request_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitação não encontrada ou já processada';
  END IF;
END;
$$;