-- Tabela para armazenar webhooks que precisam de processamento ou reenvio
CREATE TABLE IF NOT EXISTS public.webhook_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    attempts INTEGER DEFAULT 0,
    last_error TEXT,
    next_retry_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS (apenas para segurança interna, sem acesso direto via API anon se não necessário)
ALTER TABLE public.webhook_queue ENABLE ROW LEVEL SECURITY;

-- Índice para performance no processamento da fila
CREATE INDEX IF NOT EXISTS idx_webhook_queue_retry ON public.webhook_queue (status, next_retry_at) WHERE status IN ('pending', 'failed');

-- Função para registrar automaticamente novos cadastros na fila de webhook
CREATE OR REPLACE FUNCTION public.enqueue_registration_webhook()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.webhook_queue (payload)
    VALUES (jsonb_build_object(
        'type', 'registration',
        'record', row_to_json(NEW)
    ));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger na tabela profiles
DROP TRIGGER IF EXISTS trigger_enqueue_registration ON public.profiles;
CREATE TRIGGER trigger_enqueue_registration
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_registration_webhook();

-- Trigger para atualizar o updated_at
CREATE TRIGGER update_webhook_queue_updated_at
BEFORE UPDATE ON public.webhook_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
