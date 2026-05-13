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

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: "CADASTRO",
        timestamp: new Date().toISOString(),
        data: userData
      }),
    })

    const result = await response.text()
    console.log("n8n response:", result)

    return new Response(JSON.stringify({ success: true, n8n_response: result }), {
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
