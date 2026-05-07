import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRoles } from "@/hooks/useRoles";
import { AdminPage } from "@/components/admin/AdminPage";
import { UsersRound, MessageSquare, Clock, Eye, Trash2, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Shield, ShieldOff, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { EditMemberDialog, type EditableMember } from "@/components/admin/EditMemberDialog";
import { AdminCommentDialog } from "@/components/admin/AdminCommentDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Member {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  area: number | null;
  is_admin: boolean;
}

interface AcademicComment {
  id: string;
  content: string;
  type: "individual" | "church_collective" | "global_collective";
  created_at: string;
  scheduled_for: string | null;
  is_read: boolean;
  read_at: string | null;
  recipient_id: string | null;
  recipient_name?: string;
}

export default function AdminChurchMembers() {
  const { isSuperadmin, isChurchAdmin, churchId, loading: rolesLoading } = useRoles();
  const [rows, setRows] = useState<Member[]>([]);
  const [comments, setComments] = useState<AcademicComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);
  const [q, setQ] = useState("");
  const [editTarget, setEditTarget] = useState<EditableMember | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [commentTarget, setCommentTarget] = useState<{ id: string; name: string } | null>(null);
  const [commentToEdit, setCommentToEdit] = useState<any>(null);
  const [commentOpen, setCommentOpen] = useState(false);

  const load = async () => {
    if (!churchId) return;
    setLoading(true);
    const [{ data: profs }, { data: roles }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, first_name, last_name, email, phone, area")
        .eq("church_id", churchId)
        .order("first_name", { ascending: true }),
      supabase
        .from("user_roles")
        .select("user_id, role, church_id")
        .eq("church_id", churchId)
        .eq("role", "admin"),
    ]);

    const adminSet = new Set((roles ?? []).map((r: any) => r.user_id));
    setRows(
      (profs ?? []).map((p: any) => ({
        id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        email: p.email,
        phone: p.phone,
        area: p.area,
        is_admin: adminSet.has(p.id),
      }))
    );
    setLoading(false);
  };

  const loadComments = async () => {
    if (!churchId) return;
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from("academic_comments")
        .select(`
          *,
          recipient:profiles!academic_comments_recipient_id_fkey(first_name, last_name)
        `)
        .eq("church_id", churchId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setComments((data ?? []).map((c: any) => ({
        ...c,
        recipient_name: c.recipient ? `${c.recipient.first_name} ${c.recipient.last_name}` : "Coletivo"
      })));
    } catch (error: any) {
      toast.error("Erro ao carregar comentários: " + error.message);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    if (rolesLoading || !churchId) return;
    load();
    loadComments();
    
    const channel = supabase
      .channel(`church-members-${churchId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles", filter: `church_id=eq.${churchId}` },
        () => load()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_roles", filter: `church_id=eq.${churchId}` },
        () => load()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "academic_comments", filter: `church_id=eq.${churchId}` },
        () => loadComments()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [rolesLoading, churchId]);

  if (rolesLoading) return null;
  if (!isChurchAdmin || isSuperadmin) return <Navigate to="/painel" replace />;

  const promote = async (m: Member) => {
    if (!churchId) return;
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: m.id, role: "admin", church_id: churchId });
    if (error) return toast.error("Falha ao promover: " + error.message);
    toast.success("Membro promovido a admin local");
    load();
  };

  const revoke = async (m: Member) => {
    if (!churchId) return;
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", m.id)
      .eq("role", "admin")
      .eq("church_id", churchId);
    if (error) return toast.error("Falha ao remover: " + error.message);
    toast.success("Privilégio de admin removido");
    load();
  };

  const filtered = useMemo(() => {
    if (!q) return rows;
    const ql = q.toLowerCase();
    return rows.filter((r) =>
      `${r.first_name ?? ""} ${r.last_name ?? ""} ${r.email ?? ""}`
        .toLowerCase()
        .includes(ql)
    );
  }, [rows, q]);

  return (
    <AdminPage
      title="Membros da Igreja"
      description={`${rows.length} ${rows.length === 1 ? "membro cadastrado" : "membros cadastrados"} · gerencie membros e comunicados.`}
      Icon={UsersRound}
      variant="primary"
    >
      <Tabs defaultValue="members" className="w-full">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between mb-6">
          <TabsList className="bg-muted/50 p-1 rounded-xl h-auto">
            <TabsTrigger value="members" className="rounded-lg px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <UsersRound className="w-4 h-4 mr-2" />
              Lista de Membros
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Clock className="w-4 h-4 mr-2" />
              Histórico de Feedbacks
            </TabsTrigger>
          </TabsList>

          {/* Botão de Comunicado Coletivo - Visível apenas na aba de membros para facilitar o fluxo */}
          <Button 
            variant="outline" 
            className="gap-2 border-primary/20 text-primary hover:bg-primary/5 rounded-xl shadow-sm"
            onClick={() => {
              setCommentTarget(null);
              setCommentToEdit(null);
              setCommentOpen(true);
            }}
          >
            <MessageSquare className="w-4 h-4" />
            Novo Comunicado Coletivo
          </Button>
        </div>

        <TabsContent value="members" className="space-y-6 mt-0">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9 h-11 rounded-xl border-border/50 bg-card/50"
                placeholder="Buscar por nome ou email…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>

          <Card className="overflow-hidden border-border/50">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Carregando membros…
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      Nenhum membro encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((m) => (
                    <TableRow key={m.id} className="hover:bg-muted/10 transition-colors">
                      <TableCell className="font-medium py-4">
                        {m.first_name} {m.last_name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {m.email ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {m.phone ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <Badge variant="outline" className="font-normal">{m.area ?? "—"}</Badge>
                      </TableCell>
                      <TableCell>
                        {m.is_admin ? (
                          <Badge className="gap-1 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20">
                            <Shield className="w-3 h-3" /> Admin
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-muted/50">Membro</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 text-primary hover:bg-primary/10"
                          onClick={() => {
                            setCommentTarget({ id: m.id, name: `${m.first_name} ${m.last_name}` });
                            setCommentToEdit(null);
                            setCommentOpen(true);
                          }}
                          title="Enviar comentário individual"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9"
                          onClick={() => {
                            setEditTarget({
                              id: m.id,
                              first_name: m.first_name,
                              last_name: m.last_name,
                              email: m.email,
                              phone: m.phone,
                              area: m.area,
                            });
                            setEditOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {m.is_admin ? (
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-9 w-9 text-destructive hover:bg-destructive/10"
                            onClick={() => revoke(m)}
                            title="Remover admin"
                          >
                            <ShieldOff className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-9 w-9 text-emerald-600 hover:bg-emerald-500/10"
                            onClick={() => promote(m)}
                            title="Promover a admin"
                          >
                            <Shield className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6 mt-0">
          <Card className="overflow-hidden border-border/50">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead>Data</TableHead>
                  <TableHead>Destinatário</TableHead>
                  <TableHead className="w-[40%]">Mensagem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingComments ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Carregando histórico…
                    </TableCell>
                  </TableRow>
                ) : comments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      Nenhum feedback enviado ainda.
                    </TableCell>
                  </TableRow>
                ) : (
                  comments.map((c) => {
                    const isFuture = c.scheduled_for && new Date(c.scheduled_for) > new Date();
                    
                    return (
                      <TableRow key={c.id} className="hover:bg-muted/10 transition-colors">
                        <TableCell className="text-xs font-medium whitespace-nowrap">
                          {format(new Date(c.created_at), "dd/MM/yyyy HH:mm")}
                        </TableCell>
                        <TableCell className="text-sm">
                          {c.type === 'individual' ? (
                            <span className="font-semibold">{c.recipient_name}</span>
                          ) : (
                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                              Coletivo ({c.type === 'church_collective' ? 'Igreja' : 'Global'})
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground italic">
                          "{c.content.length > 80 ? c.content.substring(0, 80) + "..." : c.content}"
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {isFuture ? (
                              <Badge className="w-fit bg-amber-500/10 text-amber-500 border-amber-500/20 flex gap-1 items-center px-1.5 py-0">
                                <Clock className="w-3 h-3" /> Agendado
                              </Badge>
                            ) : (
                              <Badge className="w-fit bg-emerald-500/10 text-emerald-500 border-emerald-500/20 flex gap-1 items-center px-1.5 py-0">
                                <CheckCircle2 className="w-3 h-3" /> Enviado
                              </Badge>
                            )}
                            
                            {c.is_read ? (
                              <div className="flex items-center gap-1 text-[10px] text-primary font-medium">
                                <Eye className="w-3 h-3" /> Visualizado
                              </div>
                            ) : (
                              !isFuture && <div className="text-[10px] text-muted-foreground">Não visualizado</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => {
                              setCommentToEdit(c);
                              setCommentOpen(true);
                            }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <EditMemberDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        member={editTarget}
        allowChurchEdit={false}
        onSaved={load}
      />

      <AdminCommentDialog
        open={commentOpen}
        onOpenChange={setCommentOpen}
        recipientId={commentTarget?.id}
        recipientName={commentTarget?.name}
        commentToEdit={commentToEdit}
        onSuccess={loadComments}
      />
    </AdminPage>
  );
}
