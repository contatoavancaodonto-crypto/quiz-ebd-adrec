import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Megaphone, Send, Trash2, Loader2 } from "lucide-react";
import { useRoles } from "@/hooks/useRoles";
import { useAuth } from "@/hooks/useAuth";
import { AdminPage } from "@/components/admin/AdminPage";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NotifRow {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  source: string;
  scope: string;
  created_at: string;
}

export default function AdminNotifications() {
  const { isSuperadmin, loading: rolesLoading } = useRoles();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [sending, setSending] = useState(false);
  const [items, setItems] = useState<NotifRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const { data } = await (supabase as any)
      .from("notifications")
      .select("id, title, body, link, source, scope, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (!isSuperadmin) return;
    refresh();
  }, [isSuperadmin]);

  if (rolesLoading) return null;
  if (!isSuperadmin) return <Navigate to="/painel" replace />;

  const handleSend = async () => {
    if (!title.trim()) {
      toast.error("Informe um título");
      return;
    }
    setSending(true);
    const { error } = await (supabase as any).from("notifications").insert({
      title: title.trim(),
      body: body.trim() || null,
      link: link.trim() || null,
      source: "manual",
      scope: "global",
      created_by: user?.id ?? null,
    });
    setSending(false);
    if (error) {
      toast.error("Falha ao enviar: " + error.message);
      return;
    }
    toast.success("Notificação enviada para todos os membros");
    setTitle("");
    setBody("");
    setLink("");
    refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta notificação para todos?")) return;
    const { error } = await (supabase as any)
      .from("notifications")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Falha ao excluir");
      return;
    }
    toast.success("Notificação removida");
    refresh();
  };

  return (
    <AdminPage
      Icon={Megaphone}
      title="Notificações"
      description="Envie avisos para todos os membros do app. Aparecem no sino do header em tempo real."
    >
      <Card className="p-5 mb-6">
        <div className="grid gap-4">
          <div>
            <Label htmlFor="notif-title">Título *</Label>
            <Input
              id="notif-title"
              placeholder="Ex: Atualização da plataforma"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
            />
          </div>
          <div>
            <Label htmlFor="notif-body">Mensagem</Label>
            <Textarea
              id="notif-body"
              placeholder="Detalhes da notificação..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>
          <div>
            <Label htmlFor="notif-link">Link (opcional)</Label>
            <Input
              id="notif-link"
              placeholder="/membro/revista"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Caminho interno para abrir ao tocar (ex: /membro/biblia, /ranking).
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSend} disabled={sending}>
              {sending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Enviar para todos
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="font-bold text-sm">Histórico</h3>
          <p className="text-xs text-muted-foreground">
            Últimas 100 notificações enviadas (manuais + automáticas).
          </p>
        </div>
        {loading ? (
          <div className="p-10 text-center text-muted-foreground text-sm">
            Carregando...
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm">
            Nenhuma notificação enviada ainda.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quando</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((n) => (
                <TableRow key={n.id}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {formatDistanceToNow(new Date(n.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={n.source === "manual" ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {n.source === "manual"
                        ? "Manual"
                        : n.source === "new_material"
                        ? "Novo material"
                        : n.source}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-sm">{n.title}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[280px] truncate">
                    {n.body ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(n.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </AdminPage>
  );
}
