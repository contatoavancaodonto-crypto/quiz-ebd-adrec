-- Função para processar novos comentários e gerar notificações
CREATE OR REPLACE FUNCTION public.handle_new_post_comment()
RETURNS TRIGGER AS $$
DECLARE
    post_author_id UUID;
    post_content TEXT;
    commenter_name TEXT;
BEGIN
    -- Obter o autor da postagem e um resumo do conteúdo
    SELECT user_id, content INTO post_author_id, post_content 
    FROM public.posts 
    WHERE id = NEW.post_id;

    -- Obter o nome de quem comentou
    SELECT COALESCE(display_name, first_name, 'Alguém') INTO commenter_name 
    FROM public.profiles 
    WHERE id = NEW.user_id;

    -- 1. Notificar o autor da postagem (se não for ele mesmo quem comentou)
    IF post_author_id != NEW.user_id THEN
        INSERT INTO public.notifications (
            title,
            body,
            link,
            source,
            scope,
            scope_id
        ) VALUES (
            'Novo comentário na sua publicação',
            commenter_name || ' comentou na sua publicação: "' || LEFT(post_content, 50) || '..."',
            '/comunidade',
            'community',
            'user',
            post_author_id
        );
    END IF;

    -- 2. Notificar outros que comentaram anteriormente na mesma postagem
    -- Notifica todos os usuários que comentaram no post, exceto o autor do novo comentário e o autor do post (já notificado acima)
    INSERT INTO public.notifications (
        title,
        body,
        link,
        source,
        scope,
        scope_id
    )
    SELECT DISTINCT
        'Novo comentário em uma discussão',
        commenter_name || ' também comentou na publicação que você participou.',
        '/comunidade',
        'community',
        'user',
        pc.user_id
    FROM public.post_comments pc
    WHERE pc.post_id = NEW.post_id
      AND pc.user_id != NEW.user_id        -- Não notificar o autor do comentário atual
      AND pc.user_id != post_author_id    -- Não notificar o autor do post (já tratado)
      AND pc.deleted = false;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para disparar após a inserção de um novo comentário
DROP TRIGGER IF EXISTS on_post_comment_created ON public.post_comments;
CREATE TRIGGER on_post_comment_created
    AFTER INSERT ON public.post_comments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_post_comment();
