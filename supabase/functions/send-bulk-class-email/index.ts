import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BulkRequest {
  classId: string;
  templateName: string;
  templateData: Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const callerId = claimsData.claims.sub as string;
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId);
    const isAdmin = (roles ?? []).some(
      (r: { role: string }) => r.role === "admin" || r.role === "superadmin"
    );
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { classId, templateName, templateData } = (await req.json()) as BulkRequest;

    if (!classId || !templateName) {
      return new Response(
        JSON.stringify({ error: "classId e templateName são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Busca participantes da turma
    const { data: participants, error: pError } = await supabase
      .from("participants")
      .select("user_id, name")
      .eq("class_id", classId)
      .not("user_id", "is", null);

    if (pError) throw pError;

    if (!participants || participants.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "Nenhum participante vinculado a um usuário encontrado.", total: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userIds = participants.map(p => p.user_id);

    // Busca os perfis (emails) dos usuários
    const { data: profiles, error: profError } = await supabase
      .from("profiles")
      .select("id, email, first_name")
      .in("id", userIds)
      .not("email", "is", null);

    if (profError) throw profError;

    const recipients = profiles.map(profile => {
      const participant = participants.find(p => p.user_id === profile.id);
      return {
        email: profile.email,
        name: profile.first_name || participant?.name || "Membro",
        userId: profile.id
      };
    });

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "Nenhum participante com e-mail encontrado para esta turma.", total: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let sentCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Processa os envios chamando a função transactional para cada um (enfileiramento)
    // Usamos Promise.all com limite se necessário, mas para enfileiramento é rápido
    const results = await Promise.all(
      recipients.map(async (r) => {
        try {
          // Merge template data with recipient info
          const finalTemplateData = {
            ...templateData,
            name: r.name,
            userName: r.name
          };

          const { error: invokeErr } = await supabase.functions.invoke(
            "send-transactional-email",
            {
              body: {
                templateName,
                recipientEmail: r.email,
                idempotencyKey: `bulk-${classId}-${templateName}-${r.userId}-${Date.now()}`,
                templateData: finalTemplateData,
              },
            },
          );

          if (invokeErr) {
            errorCount++;
            errors.push(`${r.email}: ${invokeErr.message}`);
            return { success: false, email: r.email };
          }

          sentCount++;
          return { success: true, email: r.email };
        } catch (e: any) {
          errorCount++;
          errors.push(`${r.email}: ${e.message}`);
          return { success: false, email: r.email };
        }
      })
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processamento concluído. ${sentCount} e-mails enfileirados.`,
        total: recipients.length,
        sent: sentCount,
        errors: errorCount > 0 ? errors.slice(0, 10) : undefined
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (error: any) {
    console.error("Erro em send-bulk-class-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
