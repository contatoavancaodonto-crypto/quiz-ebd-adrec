-- Atualizar a função para incluir search_path para segurança
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;