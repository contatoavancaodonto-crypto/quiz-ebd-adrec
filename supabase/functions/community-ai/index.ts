import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { mode, text, imageUrl } = await req.json();

    if (mode === "spellcheck") {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "Você é um assistente de correção ortográfica para uma comunidade cristã. Corrija erros ortográficos e melhore levemente a clareza do texto em português, mas MANTENHA o significado original e o tom do usuário. Não reescreva completamente. Responda APENAS com o texto corrigido.",
            },
            { role: "user", content: text },
          ],
          temperature: 0.3,
        }),
      });

      const data = await response.json();
      const correctedText = data.choices[0].message.content.trim();
      return new Response(JSON.stringify({ correctedText }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "moderate") {
      const messages = [
        {
          role: "system",
          content: `Você é um moderador de conteúdo para uma comunidade cristã (EBD). 
          Analise o texto (e imagem se houver) em busca de: palavrões, ofensas, spam, agressividade ou conteúdo inadequado.
          Classifique como: 'approved', 'pending' ou 'blocked'.
          'pending': se houver dúvida ou conteúdo levemente agressivo.
          'blocked': conteúdo claramente ofensivo, pornográfico ou violento.
          Responda em formato JSON: { "status": "approved" | "pending" | "blocked", "risk_level": "low" | "medium" | "high", "reason": "motivo curto em português" }`,
        },
        { role: "user", content: text },
      ];

      if (imageUrl) {
        // Handle image analysis if using a vision model
        // For now, let's just use gpt-4o-mini for text
      }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          response_format: { type: "json_object" },
          temperature: 0,
        }),
      });

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid mode" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
