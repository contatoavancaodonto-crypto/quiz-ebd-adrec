import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const WEBHOOK_URL = "https://n8n.avancaautomacao.com.br/webhook-test/2cbc5497-4f4e-4917-86e3-325df4f9ff2b"

serve(async (req) => {
  // Manejo de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  try {
    const payload = await req.json()
    console.log("Receiving registration webhook:", payload)

    // O payload do Supabase Database Webhook vem formatado com 'record', 'old_record', 'type', etc.
    const userData = payload.record || payload

    // Convertendo para query params caso o n8n espere GET ou para garantir entrega
    const queryParams = new URLSearchParams({
      event: "CADASTRO",
      timestamp: new Date().toISOString(),
      ...Object.fromEntries(
        Object.entries(userData).map(([k, v]) => [k, String(v)])
      )
    })

    const finalUrl = `${WEBHOOK_URL}?${queryParams.toString()}`
    
    // Tenta primeiro POST, se falhar ou se quiser garantir, manda via GET conforme erro 404 sugeriu
    const response = await fetch(finalUrl, {
      method: 'GET', // Mudando para GET conforme a sugestão do erro do n8n
    })

    const result = await response.text()
    console.log("n8n response:", result)

    return new Response(JSON.stringify({ success: true, n8n_response: result, url_called: finalUrl }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

