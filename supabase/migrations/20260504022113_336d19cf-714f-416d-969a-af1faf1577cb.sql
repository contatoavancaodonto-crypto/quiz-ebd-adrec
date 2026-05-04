-- Criar uma tabela de fila de emails simples se não existir (para ser processada por uma Edge Function)
CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS na fila de emails
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver a fila
CREATE POLICY "Admins can view email queue" ON public.email_queue
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND email = 'mateusnbatista@gmail.com'
  )
);

-- Função para processar a criação de um ticket e adicionar à fila
CREATE OR REPLACE FUNCTION public.handle_new_support_ticket()
RETURNS TRIGGER AS $$
DECLARE
  superadmin_email TEXT := 'mateusnbatista@gmail.com';
  user_name TEXT;
BEGIN
  user_name := COALESCE(NEW.user_name, 'Usuário');

  -- Email para o Usuário
  INSERT INTO public.email_queue (to_email, subject, body)
  VALUES (
    NEW.user_email,
    'Recebemos seu chamado: ' || NEW.subject,
    'Olá ' || user_name || ',<br><br>' ||
    'Recebemos seu chamado de suporte e nossa equipe analisará em breve.<br><br>' ||
    '<b>Assunto:</b> ' || NEW.subject || '<br>' ||
    '<b>Mensagem:</b> ' || NEW.message || '<br><br>' ||
    'Atenciosamente,<br>Equipe EBD Quiz'
  );

  -- Email para o Superadmin
  INSERT INTO public.email_queue (to_email, subject, body)
  VALUES (
    superadmin_email,
    'Novo Chamado de Suporte: ' || NEW.subject,
    'Um novo chamado foi criado por ' || user_name || ' (' || NEW.user_email || ').<br><br>' ||
    '<b>Categoria:</b> ' || NEW.category || '<br>' ||
    '<b>Assunto:</b> ' || NEW.subject || '<br>' ||
    '<b>Mensagem:</b> ' || NEW.message || '<br><br>' ||
    '<a href="https://quizebd.com/admin/support">Ver chamado no painel</a>'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gatilho para disparar a função
DROP TRIGGER IF EXISTS on_support_ticket_created ON public.support_tickets;
CREATE TRIGGER on_support_ticket_created
  AFTER INSERT ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_support_ticket();