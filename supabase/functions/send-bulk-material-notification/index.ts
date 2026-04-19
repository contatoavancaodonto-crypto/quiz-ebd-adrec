// Edge function para disparar notificação em massa sobre nova revista
// IMPORTANTE: Esta função só funcionará após:
// 1. Configurar domínio de email em Cloud → Emails
// 2. A Lovable provisionar automaticamente `send-transactional-email` + fila
// Enquanto isso, retorna 503 com instrução clara.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BulkPayload {
  materialId: string;
  className: string;
  trimester: number;
  year: number;
  title: string;
  fileUrl: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const payload = (await req.json()) as BulkPayload;
    if (!payload?.materialId || !payload?.title) {
      return new Response(
        JSON.stringify({ error: "Payload inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Busca todos os usuários com email
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, email, first_name")
      .not("email", "is", null);

    if (error) throw error;

    const recipients = (profiles ?? []).filter((p) => p.email);

    let sent = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const p of recipients) {
      try {
        const { error: invokeErr } = await supabase.functions.invoke(
          "send-transactional-email",
          {
            body: {
              templateName: "new-class-material",
              recipientEmail: p.email,
              idempotencyKey: `material-${payload.materialId}-${p.id}`,
              templateData: {
                name: p.first_name ?? "Irmão(ã)",
                className: payload.className,
                trimester: payload.trimester,
                year: payload.year,
                title: payload.title,
                fileUrl: payload.fileUrl,
              },
            },
          },
        );
        if (invokeErr) {
          // Se a função ainda não existe (domínio não configurado), aborta cedo
          if (
            invokeErr.message?.includes("Function not found") ||
            invokeErr.message?.includes("404")
          ) {
            return new Response(
              JSON.stringify({
                error: "email_not_configured",
                message:
                  "O sistema de email ainda não foi ativado. Configure o domínio em Cloud → Emails.",
              }),
              {
                status: 503,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              },
            );
          }
          skipped++;
          errors.push(`${p.email}: ${invokeErr.message}`);
        } else {
          sent++;
        }
      } catch (e: any) {
        skipped++;
        errors.push(`${p.email}: ${e?.message ?? "erro"}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: recipients.length,
        sent,
        skipped,
        errors: errors.slice(0, 10),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e?.message ?? "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
