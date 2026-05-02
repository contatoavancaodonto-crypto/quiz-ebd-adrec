-- 1. Tabelas Principais

CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted BOOLEAN NOT NULL DEFAULT false,
  church_id UUID REFERENCES public.churches(id) ON DELETE SET NULL
);

CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE public.post_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, reporter_id)
);

-- 2. Storage
INSERT INTO storage.buckets (id, name, public) VALUES ('community', 'community', true)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;

-- Posts: Ver apenas não deletados (membros) ou todos (admins)
CREATE POLICY "Posts viewable by everyone" ON public.posts
  FOR SELECT USING (
    (deleted = false) OR 
    (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'superadmin'))
  );

CREATE POLICY "Users can insert their own posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts within 1 hour" ON public.posts
  FOR UPDATE USING (
    auth.uid() = user_id AND 
    created_at > (now() - interval '1 hour')
  );

-- Curtidas
CREATE POLICY "Likes viewable by everyone" ON public.post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own likes" ON public.post_likes
  FOR ALL USING (auth.uid() = user_id);

-- Comentários
CREATE POLICY "Comments viewable by everyone" ON public.post_comments
  FOR SELECT USING (
    (deleted = false) OR 
    (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'superadmin'))
  );

CREATE POLICY "Users can insert their own comments" ON public.post_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.post_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- Denúncias: Apenas admins podem ver, qualquer um pode criar
CREATE POLICY "Reports viewable by admins" ON public.post_reports
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "Anyone can create a report" ON public.post_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Storage Policies
CREATE POLICY "Community images are public" ON storage.objects
  FOR SELECT USING (bucket_id = 'community');

CREATE POLICY "Users can upload community images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'community' AND auth.role() = 'authenticated');

-- 4. Notificações e Gatilhos

-- Função para notificar nova postagem na igreja
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
  
  -- Se for uma postagem nova
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.notifications (title, body, scope, scope_id, source)
    VALUES (
      'Nova postagem na comunidade',
      v_user_name || ' fez uma nova postagem. Vamos conferir!',
      'church',
      v_church_id,
      'community'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_new_post
AFTER INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.fn_notify_new_post();

-- Função para notificar curtida
CREATE OR REPLACE FUNCTION public.fn_notify_post_like()
RETURNS TRIGGER AS $$
DECLARE
  v_post_author_id UUID;
BEGIN
  SELECT user_id INTO v_post_author_id FROM public.posts WHERE id = NEW.post_id;
  
  -- Não notificar se o próprio autor curtir
  IF (v_post_author_id != NEW.user_id) THEN
    INSERT INTO public.notifications (title, body, scope, scope_id, source)
    VALUES (
      'Alguém curtiu sua postagem',
      'Um membro interagiu com seu conteúdo na comunidade.',
      'user',
      v_post_author_id,
      'community'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_post_like
AFTER INSERT ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION public.fn_notify_post_like();

-- Função para notificar comentário
CREATE OR REPLACE FUNCTION public.fn_notify_post_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_post_author_id UUID;
BEGIN
  SELECT user_id INTO v_post_author_id FROM public.posts WHERE id = NEW.post_id;
  
  IF (v_post_author_id != NEW.user_id) THEN
    INSERT INTO public.notifications (title, body, scope, scope_id, source)
    VALUES (
      'Novo comentário na sua postagem',
      'Alguém comentou na sua postagem. Veja o que disseram!',
      'user',
      v_post_author_id,
      'community'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_post_comment
AFTER INSERT ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.fn_notify_post_comment();

-- Função para notificar denúncia para admins
CREATE OR REPLACE FUNCTION public.fn_notify_post_report()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (title, body, scope, scope_id, source)
  VALUES (
    'Nova denúncia recebida',
    'Uma postagem foi denunciada e requer análise de moderação.',
    'global',
    NULL,
    'community_admin'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_post_report
AFTER INSERT ON public.post_reports
FOR EACH ROW EXECUTE FUNCTION public.fn_notify_post_report();
