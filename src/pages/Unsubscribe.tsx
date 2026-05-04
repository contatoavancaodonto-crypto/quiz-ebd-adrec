import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, MailX } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type State = "loading" | "valid" | "already" | "invalid" | "success" | "error";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>("loading");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON } },
        );
        const data = await res.json();
        if (data.valid === true) setState("valid");
        else if (data.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      } catch {
        setState("error");
      }
    })();
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke(
      "handle-email-unsubscribe",
      { body: { token } },
    );
    setSubmitting(false);
    if (error) return setState("error");
    if ((data as any)?.success) setState("success");
    else if ((data as any)?.reason === "already_unsubscribed") setState("already");
    else setState("error");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md p-8 space-y-5 text-center">
        <div className="flex justify-center">
          {state === "loading" && <Loader2 className="w-10 h-10 animate-spin text-primary" />}
          {state === "valid" && <MailX className="w-10 h-10 text-primary" />}
          {state === "success" && <CheckCircle2 className="w-10 h-10 text-emerald-500" />}
          {state === "already" && <CheckCircle2 className="w-10 h-10 text-emerald-500" />}
          {(state === "invalid" || state === "error") && (
            <XCircle className="w-10 h-10 text-rose-500" />
          )}
        </div>

        {state === "loading" && <p className="text-muted-foreground">Validando link...</p>}

        {state === "valid" && (
          <>
            <h1 className="text-xl font-bold text-foreground">Cancelar inscrição</h1>
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja parar de receber e-mails do Quiz EBD ADREC?
            </p>
            <Button onClick={confirm} disabled={submitting} className="w-full">
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirmar cancelamento
            </Button>
          </>
        )}

        {state === "success" && (
          <>
            <h1 className="text-xl font-bold text-foreground">Inscrição cancelada</h1>
            <p className="text-sm text-muted-foreground">
              Você não receberá mais e-mails. Sentiremos sua falta! 💙
            </p>
          </>
        )}

        {state === "already" && (
          <>
            <h1 className="text-xl font-bold text-foreground">Já cancelado</h1>
            <p className="text-sm text-muted-foreground">
              Esse e-mail já havia sido descadastrado anteriormente.
            </p>
          </>
        )}

        {state === "invalid" && (
          <>
            <h1 className="text-xl font-bold text-foreground">Link inválido</h1>
            <p className="text-sm text-muted-foreground">
              Este link de cancelamento não é válido ou expirou.
            </p>
          </>
        )}

        {state === "error" && (
          <>
            <h1 className="text-xl font-bold text-foreground">Algo deu errado</h1>
            <p className="text-sm text-muted-foreground">
              Não conseguimos processar agora. Tente novamente mais tarde.
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
