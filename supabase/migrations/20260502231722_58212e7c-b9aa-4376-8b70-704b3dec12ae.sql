-- Gatilho para comentários pendentes ou bloqueados pela IA
CREATE OR REPLACE FUNCTION public.on_comment_moderation_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o status mudou para pending ou blocked
    IF (NEW.status IN ('pending', 'blocked')) AND (OLD.status IS NULL OR OLD.status = 'approved' OR NEW.status != OLD.status) THEN
        PERFORM public.notify_superadmins(
            CASE 
                WHEN NEW.status = 'pending' THEN 'Novo Comentário Pendente (IA)'
                ELSE 'Comentário Bloqueado pela IA'
            END,
            'Um comentário suspeito foi identificado e aguarda revisão.',
            '/admin/comunidade',
            'comment_moderation'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar o gatilho na tabela post_comments
CREATE TRIGGER trigger_comment_moderation_notification
AFTER INSERT OR UPDATE OF status ON public.post_comments
FOR EACH ROW 
WHEN (NEW.status IN ('pending', 'blocked'))
EXECUTE FUNCTION public.on_comment_moderation_update();
