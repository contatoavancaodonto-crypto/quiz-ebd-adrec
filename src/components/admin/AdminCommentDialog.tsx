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
import { Loader2, MessageSquare, Calendar as CalendarIcon, Clock, Trash2 } from "lucide-react";
import { useRoles } from "@/hooks/useRoles";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
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

interface AdminCommentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientId?: string;
  recipientName?: string;
  commentToEdit?: {
    id: string;
    content: string;
    type: "individual" | "church_collective" | "global_collective";
    scheduled_for?: string;
  };
  onSuccess?: () => void;
}

export function AdminCommentDialog({
  open,
  onOpenChange,
  recipientId,
  recipientName,
  commentToEdit,
  onSuccess,
}: AdminCommentDialogProps) {
  const { isSuperadmin, churchId } = useRoles();
  const [content, setContent] = useState("");
  const [type, setType] = useState<"individual" | "church_collective" | "global_collective">("individual");
  const [loading, setLoading] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (commentToEdit) {
      setContent(commentToEdit.content);
      setType(commentToEdit.type);
      if (commentToEdit.scheduled_for) {
        const date = new Date(commentToEdit.scheduled_for);
        setScheduledDate(format(date, "yyyy-MM-dd"));
        setScheduledTime(format(date, "HH:mm"));
      }
    } else {
      setContent("");
      setScheduledDate("");
      setScheduledTime("");
      if (recipientId) {
        setType("individual");
      } else if (isSuperadmin) {
        setType("global_collective");
      } else {
        setType("church_collective");
      }
    }
  }, [recipientId, isSuperadmin, open, commentToEdit]);

  const handleDelete = async () => {
    if (!commentToEdit) return;
    
    setLoading(true);
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("academic_comments")
        .delete()
        .eq("id", commentToEdit.id);

      if (error) throw error;

      toast.success("Comentário excluído com sucesso!");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error("Erro ao excluir comentário: " + error.message);
    } finally {
      setLoading(false);
      setIsDeleting(false);
    }
  };

  const handleSend = async () => {
    if (!content.trim()) {
      toast.error("O conteúdo do comentário não pode estar vazio.");
      return;
    }

    let scheduled_for = null;
    if (scheduledDate && scheduledTime) {
      scheduled_for = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      if (commentToEdit) {
        const { error } = await supabase
          .from("academic_comments")
          .update({
            content: content.trim(),
            scheduled_for,
            type,
          })
          .eq("id", commentToEdit.id);
        
        if (error) throw error;
        toast.success("Comentário atualizado com sucesso!");
      } else {
        const { error } = await supabase.from("academic_comments").insert({
          sender_id: user.id,
          recipient_id: type === "individual" ? recipientId : null,
          church_id: type === "church_collective" ? churchId : null,
          content: content.trim(),
          type,
          scheduled_for,
        });

        if (error) throw error;
        toast.success(scheduled_for ? "Comunicado agendado com sucesso!" : "Comentário enviado com sucesso!");
      }

      setContent("");
      setScheduledDate("");
      setScheduledTime("");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error("Erro ao processar comentário: " + error.message);
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
            {commentToEdit ? "Editar Comentário Acadêmico" : "Enviar Comentário Acadêmico"}
          </DialogTitle>
          <DialogDescription>
            {commentToEdit 
              ? "Atualize o feedback profissional ou altere o agendamento."
              : "Envie um feedback profissional sobre o desempenho acadêmico."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {!commentToEdit && (
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
                      <span className="font-bold block text-sm">Individual</span>
                      <span className="text-[10px] text-muted-foreground">Para: {recipientName}</span>
                    </Label>
                  </div>
                )}
                
                {churchId && (
                  <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent/50 transition-colors cursor-pointer">
                    <RadioGroupItem value="church_collective" id="church_collective" />
                    <Label htmlFor="church_collective" className="flex-1 cursor-pointer">
                      <span className="font-bold block text-sm">Coletivo (Igreja)</span>
                      <span className="text-[10px] text-muted-foreground">Para todos os membros da sua igreja</span>
                    </Label>
                  </div>
                )}

                {isSuperadmin && (
                  <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent/50 transition-colors cursor-pointer">
                    <RadioGroupItem value="global_collective" id="global_collective" />
                    <Label htmlFor="global_collective" className="flex-1 cursor-pointer">
                      <span className="font-bold block text-sm">Global (Todos)</span>
                      <span className="text-[10px] text-muted-foreground">Para todos os membros da plataforma</span>
                    </Label>
                  </div>
                )}
              </RadioGroup>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="content">Mensagem</Label>
            <Textarea
              id="content"
              placeholder="Digite aqui o comentário ou feedback..."
              className="min-h-[100px] resize-none"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className="space-y-2 border-t pt-4">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
              Agendar Envio (Opcional)
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Data</span>
                <Input 
                  type="date" 
                  value={scheduledDate} 
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Horário</span>
                <Input 
                  type="time" 
                  value={scheduledTime} 
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>
            {(scheduledDate || scheduledTime) && (
              <p className="text-[10px] text-amber-600 font-medium">
                O comentário será enviado automaticamente na data e hora selecionadas.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {commentToEdit && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10 mr-auto" disabled={loading}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir comentário?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. O comentário será removido permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar Exclusão"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="flex-1 sm:flex-none">
              Cancelar
            </Button>
            <Button onClick={handleSend} disabled={loading} className="flex-1 sm:flex-none">
              {loading && !isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (commentToEdit ? "Salvar Alterações" : "Enviar Comentário")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
