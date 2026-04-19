import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveSeason } from "@/hooks/useActiveSeason";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CONFIRM_PHRASE = "ENCERRAR";

export function CloseSeasonButton() {
  const { data: season, refetch } = useActiveSeason();
  const { toast } = useToast();
  const [step, setStep] = useState<"first" | "second" | null>(null);
  const [phrase, setPhrase] = useState("");
  const [loading, setLoading] = useState(false);

  if (!season) return null;

  const handleClose = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("seasons")
      .update({ status: "closed" })
      .eq("id", season.id);
    setLoading(false);

    if (error) {
      toast({
        title: "Erro ao encerrar temporada",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Temporada encerrada ✅",
      description: `"${season.name}" foi encerrada e os badges permanentes foram atribuídos.`,
    });
    setStep(null);
    setPhrase("");
    refetch();
  };

  return (
    <>
      {/* Step 1: first confirmation */}
      <AlertDialog open={step === "first"} onOpenChange={(o) => !o && setStep(null)}>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setStep("first")}
            className="gap-2"
          >
            <Lock className="w-4 h-4" />
            Encerrar temporada
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar "{season.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação <strong>congela o ranking final</strong>, atribui badges permanentes
              (Campeão, Top 3, Melhor da Igreja) e bloqueia novos quizzes.
              <br />
              <br />
              Esta operação <strong>não pode ser desfeita</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                setStep("second");
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Step 2: type-to-confirm */}
      <AlertDialog open={step === "second"} onOpenChange={(o) => !o && setStep(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmação final</AlertDialogTitle>
            <AlertDialogDescription>
              Para confirmar, digite <strong>{CONFIRM_PHRASE}</strong> abaixo:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="confirm-phrase">Confirmação</Label>
            <Input
              id="confirm-phrase"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder={CONFIRM_PHRASE}
              autoComplete="off"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setPhrase("");
                setStep(null);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={phrase !== CONFIRM_PHRASE || loading}
              onClick={(e) => {
                e.preventDefault();
                handleClose();
              }}
              className="bg-destructive hover:bg-destructive/90 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Encerrando...
                </>
              ) : (
                "Encerrar definitivamente"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
