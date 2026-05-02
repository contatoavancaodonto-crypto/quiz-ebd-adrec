import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { AdminPage } from "@/components/admin/AdminPage";
import {
  useSupportTickets,
  CATEGORY_LABELS,
  STATUS_LABELS,
  PRIORITY_LABELS,
  SupportTicket,
} from "@/hooks/useSupportTickets";
import { TicketThread } from "@/components/suporte/TicketThread";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LifeBuoy, Search, CheckCircle2, ExternalLink, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AdminSupport() {
  const { isSuperadmin, loading: rolesLoading } = useRoles();
  const { user } = useAuth();
  const { tickets, loading } = useSupportTickets();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [selected, setSelected] = useState<SupportTicket | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter((t) => {
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (filterCategory !== "all" && t.category !== filterCategory) return false;
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;
      if (q) {
        const blob = `${t.subject} ${t.message} ${t.user_name ?? ""} ${t.user_email ?? ""}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      // Excluir TESTE123
      if ((t.user_name ?? "").toUpperCase().includes("TESTE123")) return false;
      return true;
    });
  }, [tickets, filterStatus, filterCategory, filterPriority, search]);

  const stats = useMemo(() => {
    const open = tickets.filter((t) => t.status === "open").length;
    const inProgress = tickets.filter((t) => t.status === "in_progress").length;
    const today = new Date().toDateString();
    const resolvedToday = tickets.filter(
      (t) => t.status === "resolved" && t.resolved_at && new Date(t.resolved_at).toDateString() === today,
    ).length;
    return { open, inProgress, resolvedToday, total: tickets.length };
  }, [tickets]);

  if (rolesLoading) return null;
  if (!isSuperadmin) return <Navigate to="/painel" replace />;

  const updateStatus = async (id: string, status: SupportTicket["status"]) => {
    const patch: any = { status };
    if (status === "resolved") {
      patch.resolved_by = user?.id;
      patch.resolved_at = new Date().toISOString();
    }
    const { error } = await (supabase as any).from("support_tickets").update(patch).eq("id", id);
    if (error) {
      toast.error("Falha ao atualizar status");
      return;
    }
    toast.success("Status atualizado");
    if (selected?.id === id) setSelected({ ...selected, ...patch });
  };

  const updatePriority = async (id: string, priority: SupportTicket["priority"]) => {
    const { error } = await (supabase as any)
      .from("support_tickets")
      .update({ priority })
      .eq("id", id);
    if (error) {
      toast.error("Falha ao atualizar prioridade");
      return;
    }
    toast.success("Prioridade atualizada");
    if (selected?.id === id) setSelected({ ...selected, priority });
  };

  const deleteTicket = async (id: string) => {
    if (!confirm("Excluir este chamado e todas as mensagens?")) return;
    const { error } = await (supabase as any).from("support_tickets").delete().eq("id", id);
    if (error) {
      toast.error("Falha ao excluir");
      return;
    }
    toast.success("Chamado excluído");
    setSelected(null);
  };

  return (
    <AdminPage
      Icon={LifeBuoy}
      title="Suporte"
      description="Chamados, sugestões e bugs reportados pelos membros."
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Abertos" value={stats.open} tone="text-blue-400" />
        <Stat label="Em andamento" value={stats.inProgress} tone="text-amber-400" />
        <Stat label="Resolvidos hoje" value={stats.resolvedToday} tone="text-emerald-400" />
        <Stat label="Total" value={stats.total} tone="text-foreground" />
      </div>

      {/* Filtros */}
      <Card className="p-3 flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por assunto, mensagem ou usuário..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="open">Aberto</SelectItem>
            <SelectItem value="in_progress">Em andamento</SelectItem>
            <SelectItem value="resolved">Resolvido</SelectItem>
            <SelectItem value="closed">Fechado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full md:w-[160px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v.emoji} {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-full md:w-[140px]">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      {/* Tabela */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Nenhum chamado encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Quando</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => {
                  const cat = CATEGORY_LABELS[t.category];
                  const st = STATUS_LABELS[t.status];
                  const pr = PRIORITY_LABELS[t.priority];
                  return (
                    <TableRow
                      key={t.id}
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => setSelected(t)}
                    >
                      <TableCell className="font-medium max-w-[300px] truncate">
                        {t.subject}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-medium">{t.user_name ?? "—"}</div>
                        <div className="text-muted-foreground">{t.user_email ?? ""}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {cat?.emoji} {cat?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("text-[10px]", pr?.tone)} variant="outline">
                          {pr?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("text-[10px] border", st?.tone)} variant="outline">
                          {st?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {formatDistanceToNow(new Date(t.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Detalhes */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span>{CATEGORY_LABELS[selected.category]?.emoji}</span>
                  {selected.subject}
                </DialogTitle>
                <DialogDescription>
                  De <strong>{selected.user_name ?? "—"}</strong> ({selected.user_email ?? "—"})
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Controles do admin */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Status</label>
                    <Select
                      value={selected.status}
                      onValueChange={(v) => updateStatus(selected.id, v as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Aberto</SelectItem>
                        <SelectItem value="in_progress">Em andamento</SelectItem>
                        <SelectItem value="resolved">Resolvido</SelectItem>
                        <SelectItem value="closed">Fechado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Prioridade</label>
                    <Select
                      value={selected.priority}
                      onValueChange={(v) => updatePriority(selected.id, v as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Metadados de bug */}
                {(selected.page_url || selected.user_agent) && (
                  <div className="rounded-md border border-border bg-muted/30 p-3 text-xs space-y-1">
                    {selected.page_url && (
                      <div className="flex items-start gap-1.5">
                        <span className="font-semibold">Página:</span>
                        <a
                          href={selected.page_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline break-all flex items-center gap-1"
                        >
                          {selected.page_url}
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    )}
                    {selected.user_agent && (
                      <div className="break-all">
                        <span className="font-semibold">User-Agent:</span> {selected.user_agent}
                      </div>
                    )}
                  </div>
                )}

                {selected.screenshot_url && (
                  <a
                    href={selected.screenshot_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={selected.screenshot_url}
                      alt="Anexo"
                      className="rounded-lg border border-border max-h-60 object-contain w-full bg-muted/30"
                    />
                  </a>
                )}

                <TicketThread ticket={selected} isAdmin={true} />

                <div className="flex flex-wrap gap-2 justify-between border-t border-border pt-3">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteTicket(selected.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </Button>
                  {selected.status !== "resolved" && (
                    <Button size="sm" onClick={() => updateStatus(selected.id, "resolved")}>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Marcar como resolvido
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("text-2xl font-bold mt-1", tone)}>{value}</div>
    </Card>
  );
}
