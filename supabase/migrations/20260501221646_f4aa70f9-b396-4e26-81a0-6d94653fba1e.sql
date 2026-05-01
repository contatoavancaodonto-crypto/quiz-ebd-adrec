-- Tabela de auditoria de edições de perfis
CREATE TABLE public.profile_edit_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  edited_by UUID,
  editor_name TEXT,
  editor_role TEXT,
  changes JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profile_edit_audit_profile ON public.profile_edit_audit(profile_id);
CREATE INDEX idx_profile_edit_audit_created ON public.profile_edit_audit(created_at DESC);

ALTER TABLE public.profile_edit_audit ENABLE ROW LEVEL SECURITY;

-- Apenas superadmin lê auditoria
CREATE POLICY "Superadmin can read profile audit"
ON public.profile_edit_audit
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'::app_role));

-- Admin e superadmin podem inserir auditoria (registram suas próprias ações)
CREATE POLICY "Admins can insert profile audit"
ON public.profile_edit_audit
FOR INSERT
TO authenticated
WITH CHECK (
  edited_by = auth.uid()
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'superadmin'::app_role))
);
