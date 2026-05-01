-- Tabela de notificações
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  source TEXT NOT NULL DEFAULT 'manual', -- 'manual' | 'new_material' | 'system'
  scope TEXT NOT NULL DEFAULT 'global',  -- 'global' | 'church' | 'class'
  scope_id UUID,                         -- church_id ou class_id quando aplicável
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_created_at ON public.notifications (created_at DESC);
CREATE INDEX idx_notifications_scope ON public.notifications (scope, scope_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Leitura: qualquer um autenticado pode ler (segmentação é feita no app/hook)
CREATE POLICY "Notifications are readable by authenticated"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (true);

-- Inserção manual: apenas superadmin
CREATE POLICY "Superadmin can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- Atualização e exclusão: apenas superadmin
CREATE POLICY "Superadmin can update notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmin can delete notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'));

-- Tabela de leituras
CREATE TABLE public.notification_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (notification_id, user_id)
);

CREATE INDEX idx_notification_reads_user ON public.notification_reads (user_id);

ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own reads"
  ON public.notification_reads FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own reads"
  ON public.notification_reads FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own reads"
  ON public.notification_reads FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Trigger: ao publicar material, cria notificação automática
CREATE OR REPLACE FUNCTION public.notify_on_new_material()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_class_name TEXT;
BEGIN
  SELECT name INTO v_class_name FROM public.classes WHERE id = NEW.class_id;

  INSERT INTO public.notifications (title, body, link, source, scope, scope_id, created_by)
  VALUES (
    '📚 Novo material disponível',
    COALESCE(NEW.title, 'Novo material') ||
      CASE WHEN v_class_name IS NOT NULL THEN ' — ' || v_class_name ELSE '' END,
    '/membro/revista',
    'new_material',
    'class',
    NEW.class_id,
    NULL
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_new_material
  AFTER INSERT ON public.class_materials
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_new_material();

-- Habilita realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_reads;