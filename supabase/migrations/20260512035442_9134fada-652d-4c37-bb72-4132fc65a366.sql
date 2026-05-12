-- Tabela para templates de e-mail
CREATE TABLE public.email_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    content_html TEXT NOT NULL,
    preview_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ativar RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (Somente Superadm pode gerenciar)
CREATE POLICY "Templates são visíveis por superadmins" 
ON public.email_templates 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "Templates são editáveis por superadmins" 
ON public.email_templates 
FOR UPDATE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "Templates são inseríveis por superadmins" 
ON public.email_templates 
FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'superadmin'));

-- Trigger para updated_at
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados iniciais (Seed)
-- Nota: O HTML aqui é o esqueleto básico, o sistema usará o React Email como base
-- mas permitirá que o superadm altere partes específicas ou o HTML completo se desejar.
INSERT INTO public.email_templates (name, display_name, subject, content_html) VALUES 
('welcome', 'Boas-vindas', 'Bem-vindo ao Quiz EBD!', '<p>Olá {{name}}, seja bem-vindo ao Quiz EBD!</p>'),
('new-class-material', 'Nova Revista', '📖 Nova revista disponível: {{title}}', '<p>Olá {{name}}, uma nova revista foi publicada na turma {{className}}.</p>'),
('quiz-result', 'Resultado de Quiz', '📊 Seu desempenho no quiz: {{quizTitle}}', '<p>Parabéns {{name}}! Você completou o quiz com {{percentage}}% de acerto.</p>'),
('new-quiz-available', 'Novo Quiz Disponível', '💡 Novo quiz liberado: {{quizTitle}}', '<p>Um novo quiz está disponível para você responder.</p>'),
('notification', 'Notificação Geral', '{{title}}', '<p>{{message}}</p>'),
('support-ticket-created', 'Suporte', '🎫 Chamado recebido: #{{ticketId}}', '<p>Recebemos seu pedido de suporte e responderemos em breve.</p>');
