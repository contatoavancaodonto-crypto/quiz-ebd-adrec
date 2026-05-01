import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  scope_id: string | null;
  created_at: string;
}

interface ClassRow {
  id: string;
  name: string;
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
  const [classes, setClasses] = useState<ClassRow[]>([]);

  // Envio
  const [sendScope, setSendScope] = useState<"global" | "class">("global");
  const [sendClassId, setSendClassId] = useState<string>("");

  // Filtros do histórico
  const [filterScope, setFilterScope] = useState<string>("all");
  const [filterClassId, setFilterClassId] = useState<string>("all");

  const refresh = async () => {
    const { data } = await (supabase as any)
      .from("notifications")
      .select("id, title, body, link, source, scope, scope_id, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    setItems(data ?? []);
    setLoading(false);
  };

  const loadClasses = async () => {
    const { data } = await supabase
      .from("classes")
      .select("id, name")
      .eq("active", true)
      .order("name");
    setClasses((data as ClassRow[]) ?? []);
  };

  useEffect(() => {
    if (!isSuperadmin) return;
    refresh();
    loadClasses();
  }, [isSuperadmin]);

  const classNameById = useMemo(() => {
    const m = new Map<string, string>();
    classes.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [classes]);

  const filteredItems = useMemo(() => {
    return items.filter((n) => {
      if (filterScope !== "all" && n.scope !== filterScope) return false;
      if (filterClassId !== "all") {
        if (n.scope !== "class" || n.scope_id !== filterClassId) return false;
      }
      return true;
    });
  }, [items, filterScope, filterClassId]);

  if (rolesLoading) return null;
  if (!isSuperadmin) return <Navigate to="/painel" replace />;

  const handleSend = async () => {
    if (!title.trim()) {
      toast.error("Informe um título");
      return;
    }
    if (sendScope === "class" && !sendClassId) {
      toast.error("Selecione a turma de destino");
      return;
    }
    setSending(true);
    const { error } = await (supabase as any).from("notifications").insert({
      title: title.trim(),
      body: body.trim() || null,
      link: link.trim() || null,
      source: "manual",
      scope: sendScope,
      scope_id: sendScope === "class" ? sendClassId : null,
      created_by: user?.id ?? null,
    });
    setSending(false);
    if (error) {
      toast.error("Falha ao enviar: " + error.message);
      return;
    }
    toast.success(
      sendScope === "global"
        ? "Notificação enviada para todos os membros"
        : `Notificação enviada para a turma ${classNameById.get(sendClassId) ?? ""}`,
    );
    setTitle("");
    setBody("");
    setLink("");
    refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta notificação?")) return;
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

  const scopeLabel = (scope: string, scopeId: string | null) => {
    if (scope === "global") return "Todos";
    if (scope === "class")
      return `Turma: ${scopeId ? classNameById.get(scopeId) ?? "—" : "—"}`;
    if (scope === "church") return "Igreja";
    return scope;
  };

  return (
    <AdminPage
      Icon={Megaphone}
      title="Notificações"
      description="Envie avisos para todos os membros do app. Aparecem no sino do header em tempo real."
    >
      <Card className="p-5 mb-6">
        <div className="grid gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Destinatários</Label>
              <Select
                value={sendScope}
                onValueChange={(v) => setSendScope(v as "global" | "class")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Todos os membros</SelectItem>
                  <SelectItem value="class">Turma específica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {sendScope === "class" && (
              <div>
                <Label>Turma *</Label>
                <Select value={sendClassId} onValueChange={setSendClassId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

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
              {sendScope === "global" ? "Enviar para todos" : "Enviar para turma"}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-bold text-sm">Histórico</h3>
            <p className="text-xs text-muted-foreground">
              {filteredItems.length} de {items.length} notificações
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={filterScope} onValueChange={setFilterScope}>
              <SelectTrigger className="w-full sm:w-[170px] h-9">
                <SelectValue placeholder="Escopo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os escopos</SelectItem>
                <SelectItem value="global">Global</SelectItem>
                <SelectItem value="class">Turma</SelectItem>
                <SelectItem value="church">Igreja</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterClassId} onValueChange={setFilterClassId}>
              <SelectTrigger className="w-full sm:w-[200px] h-9">
                <SelectValue placeholder="Turma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as turmas</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {loading ? (
          <div className="p-10 text-center text-muted-foreground text-sm">
            Carregando...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm">
            Nenhuma notificação encontrada com esses filtros.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quando</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Escopo</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((n) => (
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
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {scopeLabel(n.scope, n.scope_id)}
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
