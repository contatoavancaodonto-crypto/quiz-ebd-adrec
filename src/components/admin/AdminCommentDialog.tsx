import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, MessageSquare } from "lucide-react";
import { useRoles } from "@/hooks/useRoles";

interface AdminCommentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientId?: string;
  recipientName?: string;
  onSuccess?: () => void;
}

export function AdminCommentDialog({
  open,
  onOpenChange,
  recipientId,
  recipientName,
  onSuccess,
}: AdminCommentDialogProps) {
  const { isSuperadmin, churchId } = useRoles();
  const [content, setContent] = useState("");
  const [type, setType] = useState<"individual" | "church_collective" | "global_collective">("individual");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (recipientId) {
      setType("individual");
    } else if (isSuperadmin) {
      setType("global_collective");
    } else {
      setType("church_collective");
    }
  }, [recipientId, isSuperadmin, open]);

  const handleSend = async () => {
    if (!content.trim()) {
      toast.error("O conteúdo do comentário não pode estar vazio.");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from("academic_comments").insert({
        sender_id: user.id,
        recipient_id: type === "individual" ? recipientId : null,
        church_id: type === "church_collective" ? churchId : null,
        content: content.trim(),
        type,
      });

      if (error) throw error;

      toast.success("Comentário enviado com sucesso!");
      setContent("");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error("Erro ao enviar comentário: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Enviar Comentário Acadêmico
          </DialogTitle>
          <DialogDescription>
            Envie um feedback profissional sobre o desempenho acadêmico.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-3">
            <Label>Tipo de Envio</Label>
            <RadioGroup 
              value={type} 
              onValueChange={(v: any) => setType(v)}
              className="grid grid-cols-1 gap-2"
            >
              {recipientId && (
                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="individual" id="individual" />
                  <Label htmlFor="individual" className="flex-1 cursor-pointer">
                    <span className="font-bold block">Individual</span>
                    <span className="text-xs text-muted-foreground">Para: {recipientName}</span>
                  </Label>
                </div>
              )}
              
              {churchId && (
                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="church_collective" id="church_collective" />
                  <Label htmlFor="church_collective" className="flex-1 cursor-pointer">
                    <span className="font-bold block">Coletivo (Igreja)</span>
                    <span className="text-xs text-muted-foreground">Para todos os membros da sua igreja</span>
                  </Label>
                </div>
              )}

              {isSuperadmin && (
                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="global_collective" id="global_collective" />
                  <Label htmlFor="global_collective" className="flex-1 cursor-pointer">
                    <span className="font-bold block">Global (Todos)</span>
                    <span className="text-xs text-muted-foreground">Para todos os membros da plataforma</span>
                  </Label>
                </div>
              )}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Mensagem</Label>
            <Textarea
              id="content"
              placeholder="Digite aqui o comentário ou feedback..."
              className="min-h-[120px] resize-none"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Enviar Comentário"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
