import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const payload = await req.json();
    const { record } = payload;

    // Só enviamos se for um novo perfil
    if (payload.type === 'INSERT' && record.email) {
      console.log(`Enviando e-mail de boas-vindas para: ${record.email}`);

      const { error: invokeErr } = await supabase.functions.invoke(
        "send-transactional-email",
        {
          body: {
            templateName: "Boas-vindas",
            recipientEmail: record.email,
            templateData: {
              name: record.display_name || record.first_name || "Membro",
              provider: record.provider || "manual",
              link_do_app: "https://quizebd.com/painel"
            },
          },
        },
      );

      if (invokeErr) {
        console.error("Erro ao invocar send-transactional-email:", invokeErr);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Erro no webhook de boas-vindas:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
