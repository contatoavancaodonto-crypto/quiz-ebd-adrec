-- Função para inserir notificações para todos os superadmins
CREATE OR REPLACE FUNCTION public.notify_superadmins(
    title TEXT,
    body TEXT,
    link TEXT,
    source TEXT
) RETURNS VOID AS $$
DECLARE
    superadmin_id UUID;
BEGIN
    FOR superadmin_id IN (SELECT user_id FROM public.user_roles WHERE role = 'superadmin') LOOP
        INSERT INTO public.notifications (
            title,
            body,
            link,
            source,
            scope,
            scope_id
        ) VALUES (
            title,
            body,
            link,
            source,
            'user', -- Usamos o escopo 'user' para direcionar a cada superadmin individualmente
            superadmin_id
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gatilho para novas denúncias
CREATE OR REPLACE FUNCTION public.on_post_report_created()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.notify_superadmins(
        'Nova Denúncia na Comunidade',
        'Uma nova denúncia foi registrada e aguarda revisão.',
        '/admin/comunidade',
        'community_report'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_post_report_notification
AFTER INSERT ON public.post_reports
FOR EACH ROW EXECUTE FUNCTION public.on_post_report_created();

-- Gatilho para conteúdo pendente ou bloqueado pela IA
CREATE OR REPLACE FUNCTION public.on_post_moderation_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o status mudou para pending ou blocked
    IF (NEW.status IN ('pending', 'blocked')) AND (OLD.status IS NULL OR OLD.status = 'approved' OR NEW.status != OLD.status) THEN
        PERFORM public.notify_superadmins(
            CASE 
                WHEN NEW.status = 'pending' THEN 'Novo Conteúdo Pendente (IA)'
                ELSE 'Conteúdo Bloqueado pela IA'
            END,
            'A IA identificou um conteúdo que requer atenção na fila de moderação.',
            '/admin/comunidade',
            'community_moderation'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar o gatilho na tabela posts (também serve para novos posts que já nascem pending)
CREATE TRIGGER trigger_post_moderation_notification
AFTER INSERT OR UPDATE OF status ON public.posts
FOR EACH ROW 
WHEN (NEW.status IN ('pending', 'blocked'))
EXECUTE FUNCTION public.on_post_moderation_update();
