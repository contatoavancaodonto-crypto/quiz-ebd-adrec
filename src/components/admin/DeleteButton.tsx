import { ReactNode, useState } from "react";
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
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface DeleteButtonProps {
  /** Função que executa a remoção. Retorne true se sucesso, ou string de erro. */
  onConfirm: () => Promise<true | string>;
  /** Nome do item para o diálogo (ex: "esta igreja", "o quiz X") */
  itemLabel?: string;
  title?: string;
  description?: ReactNode;
  successMessage?: string;
  size?: "sm" | "default";
  variant?: "ghost" | "outline" | "destructive";
  iconOnly?: boolean;
  disabled?: boolean;
}

export function DeleteButton({
  onConfirm,
  itemLabel = "este item",
  title = "Confirmar exclusão",
  description,
  successMessage = "Removido",
  size = "sm",
  variant = "ghost",
  iconOnly = false,
  disabled,
}: DeleteButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    const res = await onConfirm();
    setLoading(false);
    if (res === true) {
      toast.success(successMessage);
      setOpen(false);
    } else {
      toast.error(res);
    }
  };

  return (
    <>
      <Button
        size={size}
        variant={variant}
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={
          variant === "ghost"
            ? "text-destructive hover:text-destructive hover:bg-destructive/10"
            : undefined
        }
      >
        <Trash2 className="w-4 h-4" />
        {!iconOnly && <span className="ml-1">Apagar</span>}
      </Button>

      <AlertDialog open={open} onOpenChange={(o) => !loading && setOpen(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>
              {description ?? (
                <>
                  Tem certeza que deseja apagar <strong>{itemLabel}</strong>? Se houver
                  dados vinculados (tentativas, conquistas etc.), o item será desativado
                  para preservar o histórico.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={loading}
              onClick={(e) => {
                e.preventDefault();
                handle();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Apagando…" : "Apagar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
