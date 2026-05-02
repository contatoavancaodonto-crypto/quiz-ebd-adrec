import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useCommunity } from "@/hooks/useCommunity";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  onSuccess: () => void;
}

export function ReportModal({ isOpen, onClose, postId, onSuccess }: ReportModalProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { reportPost } = useCommunity();

  const handleReport = async () => {
    setLoading(true);
    await reportPost(postId, reason);
    setLoading(false);
    onClose();
    onSuccess();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Denunciar postagem</DialogTitle>
          <DialogDescription>
            Deseja denunciar esta postagem para análise? Nossa equipe verificará o conteúdo.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <label className="text-sm font-medium mb-2 block">Motivo (opcional)</label>
          <Select onValueChange={setReason} value={reason}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um motivo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Conteúdo inadequado">Conteúdo inadequado</SelectItem>
              <SelectItem value="Linguagem ofensiva">Linguagem ofensiva</SelectItem>
              <SelectItem value="Spam">Spam</SelectItem>
              <SelectItem value="Outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleReport} disabled={loading}>
            {loading ? "Enviando..." : "Enviar denúncia"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
