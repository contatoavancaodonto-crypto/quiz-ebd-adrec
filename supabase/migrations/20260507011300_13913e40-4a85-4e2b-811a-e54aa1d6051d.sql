-- Tabela para comentários acadêmicos
CREATE TABLE public.academic_comments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    recipient_id UUID REFERENCES auth.users(id), -- NULL para comentários coletivos
    church_id UUID REFERENCES public.churches(id), -- NULL se for global (superadmin)
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('individual', 'church_collective', 'global_collective')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.academic_comments ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso

-- 1. Qualquer pessoa autenticada pode ver comentários direcionados a ela ou coletivos de sua igreja/globais
CREATE POLICY "Users can view their own or relevant collective comments"
ON public.academic_comments
FOR SELECT
USING (
    auth.uid() = recipient_id OR 
    (type = 'church_collective' AND church_id = (SELECT church_id FROM public.profiles WHERE id = auth.uid())) OR
    (type = 'global_collective')
);

-- 2. Admins podem ver o que enviaram
CREATE POLICY "Senders can view their own sent comments"
ON public.academic_comments
FOR SELECT
USING (auth.uid() = sender_id);

-- 3. Superadmins podem ver tudo
CREATE POLICY "Superadmins can view all academic comments"
ON public.academic_comments
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'superadmin'
    )
);

-- 4. Inserção de comentários
CREATE POLICY "Admins can insert academic comments"
ON public.academic_comments
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND (role = 'superadmin' OR role = 'admin')
    )
);

-- Gatilho para updated_at
CREATE TRIGGER update_academic_comments_updated_at
BEFORE UPDATE ON public.academic_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
