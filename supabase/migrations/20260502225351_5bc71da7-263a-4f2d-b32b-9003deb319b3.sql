-- Atualizar função de notificação de nova postagem
CREATE OR REPLACE FUNCTION public.fn_notify_new_post()
RETURNS TRIGGER AS $$
DECLARE
  v_user_name TEXT;
  v_church_id UUID;
BEGIN
  SELECT COALESCE(display_name, first_name || ' ' || last_name, 'Alguém'), church_id 
  INTO v_user_name, v_church_id 
  FROM public.profiles 
  WHERE id = NEW.user_id;
  
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.notifications (title, body, scope, scope_id, source, link)
    VALUES (
      'Nova postagem na comunidade',
      v_user_name || ' fez uma nova postagem. Vamos conferir!',
      'church',
      v_church_id,
      'community',
      '/membro/comunidade'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar função de notificação de curtida
CREATE OR REPLACE FUNCTION public.fn_notify_post_like()
RETURNS TRIGGER AS $$
DECLARE
  v_post_author_id UUID;
BEGIN
  SELECT user_id INTO v_post_author_id FROM public.posts WHERE id = NEW.post_id;
  
  IF (v_post_author_id != NEW.user_id) THEN
    INSERT INTO public.notifications (title, body, scope, scope_id, source, link)
    VALUES (
      'Alguém curtiu sua postagem',
      'Um membro interagiu com seu conteúdo na comunidade.',
      'user',
      v_post_author_id,
      'community',
      '/membro/comunidade'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar função de notificação de comentário
CREATE OR REPLACE FUNCTION public.fn_notify_post_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_post_author_id UUID;
BEGIN
  SELECT user_id INTO v_post_author_id FROM public.posts WHERE id = NEW.post_id;
  
  IF (v_post_author_id != NEW.user_id) THEN
    INSERT INTO public.notifications (title, body, scope, scope_id, source, link)
    VALUES (
      'Novo comentário na sua postagem',
      'Alguém comentou na sua postagem. Veja o que disseram!',
      'user',
      v_post_author_id,
      'community',
      '/membro/comunidade'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar função de notificação de denúncia
CREATE OR REPLACE FUNCTION public.fn_notify_post_report()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (title, body, scope, scope_id, source, link)
  VALUES (
    'Nova denúncia recebida',
    'Uma postagem foi denunciada e requer análise de moderação.',
    'global',
    NULL,
    'community_admin',
    '/painel/comunidade'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
