import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const WEBHOOK_URL = "https://webhook.avancaautomacao.com.br/webhook/2cbc5497-4f4e-4917-86e3-325df4f9ff2b"
const MAX_ATTEMPTS = 5

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // 1. Buscar itens pendentes ou que falharam mas ainda têm tentativas
    const { data: queueItems, error: fetchError } = await supabaseClient
      .from('webhook_queue')
      .select('*')
      .or('status.eq.pending,status.eq.failed')
      .lt('attempts', MAX_ATTEMPTS)
      .lte('next_retry_at', new Date().toISOString())
      .limit(10)

    if (fetchError) throw fetchError
    if (!queueItems || queueItems.length === 0) {
      return new Response(JSON.stringify({ message: "No items to process" }), { status: 200 })
    }

    const results = []

    for (const item of queueItems) {
      // Marcar como processando para evitar duplicidade
      await supabaseClient.from('webhook_queue').update({ status: 'processing' }).eq('id', item.id)

      try {
        const userData = item.payload.record || item.payload
        
        // Limpeza e formatação dos dados para o webhook
        const cleanEmail = userData.email && userData.email.endsWith('@quiz-ebd.local') 
          ? "" 
          : (userData.email || "");

        // Mapeamento explícito para garantir o formato solicitado
        const webhookData: Record<string, string> = {
          event: "CADASTRO",
          timestamp: new Date().toISOString(),
          id: String(userData.id || ""),
          first_name: String(userData.first_name || ""),
          last_name: String(userData.last_name || ""),
          display_name: String(userData.display_name || ""),
          email: cleanEmail,
          phone: String(userData.phone || ""),
          church_id: String(userData.church_id || ""),
          class_id: String(userData.class_id || ""),
          created_at: String(userData.created_at || ""),
          queue_id: item.id,
          attempt: (item.attempts + 1).toString()
        };

        const queryParams = new URLSearchParams(webhookData);

        const finalUrl = `${WEBHOOK_URL}?${queryParams.toString()}`
        
        const response = await fetch(finalUrl, { method: 'GET', timeout: 10000 })
        
        if (!response.ok) throw new Error(`HTTP Error ${response.status}`)

        // Sucesso
        await supabaseClient.from('webhook_queue').update({
          status: 'completed',
          attempts: item.attempts + 1,
          last_error: null,
          updated_at: new Date().toISOString()
        }).eq('id', item.id)

        results.push({ id: item.id, status: 'success' })
      } catch (error) {
        // Falha: Incrementar tentativa e agendar retry (exponecial backoff simples)
        const nextAttempt = item.attempts + 1
        const retryDelayMinutes = Math.pow(2, nextAttempt) // 2, 4, 8, 16... minutos
        const nextRetry = new Date()
        nextRetry.setMinutes(nextRetry.getMinutes() + retryDelayMinutes)

        await supabaseClient.from('webhook_queue').update({
          status: 'failed',
          attempts: nextAttempt,
          last_error: error.message,
          next_retry_at: nextRetry.toISOString(),
          updated_at: new Date().toISOString()
        }).eq('id', item.id)

        results.push({ id: item.id, status: 'failed', error: error.message })
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
