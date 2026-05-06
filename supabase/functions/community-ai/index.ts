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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { mode, text, imageUrl, type, id, userId } = await req.json();

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
          Analise o texto em busca de: palavrões, ofensas, spam, agressividade ou conteúdo inadequado.
          Classifique como: 'approved', 'pending' ou 'blocked'.
          'pending': se houver dúvida ou conteúdo levemente agressivo.
          'blocked': conteúdo claramente ofensivo, pornográfico ou violento.
          Responda em formato JSON: { "status": "approved" | "pending" | "blocked", "risk_level": "low" | "medium" | "high", "reason": "motivo curto em português" }`,
        },
        { role: "user", content: text },
      ];

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

      if (id && type) {
        const table = type === "post" ? "posts" : "post_comments";
        await supabaseClient
          .from(table)
          .update({ 
            status: result.status, 
            risk_level: result.risk_level, 
            moderation_reason: result.reason 
          })
          .eq("id", id);

        await supabaseClient.from("moderation_logs").insert({
          content_type: type,
          content_id: id,
          user_id: userId,
          status: result.status,
          risk_level: result.risk_level,
          reason: result.reason
        });

        if (result.status === "pending" || result.status === "blocked") {
          await supabaseClient.from("notifications").insert({
            title: "Conteúdo aguardando moderação",
            body: `Um ${type === "post" ? "post" : "comentário"} foi marcado como ${result.status === "pending" ? "suspeito" : "bloqueado"} pela IA.`,
            source: "system",
            scope: "admin",
            link: "/painel/comunidade"
          });
        }
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "parse_reading_plan") {
      const messages = [
        {
          role: "system",
          content: `Você é um assistente que extrai informações de planos de leitura bíblica.
          O usuário enviará um texto que contém uma leitura semanal (geralmente capítulos de um livro) e devocionais diários (de segunda a sábado).
          Extraia os campos: 
          - weekly_bible_reading: a leitura principal da semana.
          - devotional_mon, devotional_tue, devotional_wed, devotional_thu, devotional_fri, devotional_sat: referências ou textos dos devocionais.
          - lesson_title: título da lição (se houver).
          - lesson_number: número da lição (se houver).
          - lesson_key_verse_ref: referência do versículo chave (se houver).
          - lesson_key_verse_text: texto do versículo chave (se houver).
          
          Responda em formato JSON: { "weekly_bible_reading": "...", "devotional_mon": "...", "devotional_tue": "...", "devotional_wed": "...", "devotional_thu": "...", "devotional_fri": "...", "devotional_sat": "...", "lesson_title": "...", "lesson_number": ..., "lesson_key_verse_ref": "...", "lesson_key_verse_text": "..." }
          Se não encontrar algum campo, retorne null para ele.`,
        },
        { role: "user", content: text },
      ];

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

    if (mode === "parse_verses") {
      const messages = [
        {
          role: "system",
          content: `Você é um assistente que extrai versículos bíblicos de um texto.
          O usuário enviará um texto contendo um ou mais versículos.
          Para cada versículo encontrado, identifique: livro, capítulo, número do versículo, o texto do versículo e um tema curto (ex: Fé, Amor, Esperança).
          
          Responda em formato JSON com uma lista de objetos: { "verses": [ { "book": "...", "chapter": ..., "verse": ..., "text": "...", "theme": "..." }, ... ] }`,
        },
        { role: "user", content: text },
      ];

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

      if (!response.ok) {
        const errText = await response.text();
        console.error("OpenAI error:", response.status, errText);
        return new Response(JSON.stringify({ error: `IA falhou: ${response.status}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        return new Response(JSON.stringify({ error: "Resposta vazia da IA" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const result = JSON.parse(content);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "parse_weekly_lesson") {
      const messages = [
        {
          role: "system",
          content: `Você é um assistente que extrai uma Lição Semanal completa para uma EBD.
          Extraia as informações do texto seguindo exatamente esta estrutura JSON:
          {
            "trimester": "1",
            "lesson_number": 1,
            "theme": "Título da Lição",
            "reading_theme": "Tema da Leitura (ex: Fé e Obras)",
            "description": "Breve descrição opcional",
            "scheduled_date": "YYYY-MM-DD",
            "verses": {
              "segunda": { "referencia": "...", "texto": "...", "observacao": "" },
              "terca": { "referencia": "...", "texto": "...", "observacao": "" },
              "quarta": { "referencia": "...", "texto": "...", "observacao": "" },
              "quinta": { "referencia": "...", "texto": "...", "observacao": "" },
              "sexta": { "referencia": "...", "texto": "...", "observacao": "" },
              "sabado": { "referencia": "...", "texto": "...", "observacao": "" },
              "domingo": { "referencia": "...", "texto": "...", "observacao": "" }
            },
            "questions": [
              {
                "pergunta": "Texto da pergunta",
                "tipo": "multipla_escolha",
                "alternativas": { "a": "...", "b": "...", "c": "...", "d": "..." },
                "respostaCorreta": "a",
                "comentario": "Explicação opcional"
              }
            ]
          }
          
          Regras:
          1. Extraia 7 versículos (um para cada dia da semana).
          2. EXTRAIA o tema da leitura (reading_theme) se presente.
          3. EXTRAIA a data de agendamento (scheduled_date) se houver alguma data clara para o início da lição.
          4. EXTRAIA perguntas APENAS se elas estiverem explicitamente presentes no texto enviado.
          5. NUNCA invente ou crie perguntas novas que não estejam no texto.
          6. Se não houver perguntas no texto, retorne "questions": [].
          7. "trimester" deve ser uma string (ex: "1", "2").
          8. "lesson_number" deve ser um número inteiro.`,
        },
        { role: "user", content: text },
      ];

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