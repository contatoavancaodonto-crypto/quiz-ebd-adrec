
-- ============ SUPPORT TICKETS SYSTEM ============

CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_name TEXT,
  user_email TEXT,
  church_id UUID,
  category TEXT NOT NULL DEFAULT 'question',
  priority TEXT NOT NULL DEFAULT 'normal',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  screenshot_url TEXT,
  page_url TEXT,
  user_agent TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  admin_response TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_tickets_user ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_created ON public.support_tickets(created_at DESC);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Validação via trigger (não CHECK, para evitar imutabilidade)
CREATE OR REPLACE FUNCTION public.validate_support_ticket()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.category NOT IN ('bug','suggestion','question','other') THEN
    RAISE EXCEPTION 'Categoria inválida';
  END IF;
  IF NEW.priority NOT IN ('low','normal','high') THEN
    RAISE EXCEPTION 'Prioridade inválida';
  END IF;
  IF NEW.status NOT IN ('open','in_progress','resolved','closed') THEN
    RAISE EXCEPTION 'Status inválido';
  END IF;
  IF length(NEW.subject) = 0 OR length(NEW.subject) > 120 THEN
    RAISE EXCEPTION 'Assunto deve ter entre 1 e 120 caracteres';
  END IF;
  IF length(NEW.message) = 0 OR length(NEW.message) > 2000 THEN
    RAISE EXCEPTION 'Mensagem deve ter entre 1 e 2000 caracteres';
  END IF;
  -- Bug = prioridade alta automaticamente
  IF NEW.category = 'bug' AND TG_OP = 'INSERT' THEN
    NEW.priority := 'high';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_support_ticket
BEFORE INSERT OR UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.validate_support_ticket();

CREATE TRIGGER trg_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
CREATE POLICY "Users view own tickets or superadmin views all"
  ON public.support_tickets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Authenticated users create own tickets"
  ON public.support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Superadmin updates tickets"
  ON public.support_tickets FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'superadmin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Superadmin deletes tickets"
  ON public.support_tickets FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'superadmin'::app_role));

-- ============ MENSAGENS DA THREAD ============

CREATE TABLE public.support_ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  author_role TEXT NOT NULL DEFAULT 'user',
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_msgs_ticket ON public.support_ticket_messages(ticket_id, created_at);

ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View messages of own ticket or superadmin"
  ON public.support_ticket_messages FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'superadmin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Insert messages on own ticket or superadmin"
  ON public.support_ticket_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND (
      has_role(auth.uid(), 'superadmin'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.support_tickets t
        WHERE t.id = ticket_id AND t.user_id = auth.uid() AND t.status <> 'closed'
      )
    )
  );

-- ============ STORAGE BUCKET PARA SCREENSHOTS ============

INSERT INTO storage.buckets (id, name, public)
VALUES ('support', 'support', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Support files publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'support');

CREATE POLICY "Authenticated users upload support files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'support');

CREATE POLICY "Users delete own support files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'support' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============ NOTIFICAÇÃO AUTOMÁTICA AO RESPONDER ============

CREATE OR REPLACE FUNCTION public.notify_on_ticket_response()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Mensagem do admin → notifica dono do ticket
  IF NEW.author_role = 'admin' THEN
    SELECT user_id INTO v_user_id FROM public.support_tickets WHERE id = NEW.ticket_id;
    IF v_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (title, body, link, source, scope, scope_id, created_by)
      VALUES (
        '💬 Nova resposta do suporte',
        LEFT(NEW.body, 140),
        '/membro/suporte',
        'support_reply',
        'user',
        v_user_id,
        NEW.author_id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_ticket_response
AFTER INSERT ON public.support_ticket_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_on_ticket_response();

-- Notifica também quando ticket é resolvido
CREATE OR REPLACE FUNCTION public.notify_on_ticket_resolved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'resolved' AND (OLD.status IS DISTINCT FROM 'resolved') THEN
    INSERT INTO public.notifications (title, body, link, source, scope, scope_id, created_by)
    VALUES (
      '✅ Seu chamado foi resolvido',
      NEW.subject,
      '/membro/suporte',
      'support_resolved',
      'user',
      NEW.user_id,
      NEW.resolved_by
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_ticket_resolved
AFTER UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.notify_on_ticket_resolved();

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_ticket_messages;
