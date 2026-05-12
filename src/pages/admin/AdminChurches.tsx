import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPage } from "@/components/admin/AdminPage";
import { Church, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Check, X, Power, Inbox } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { smartDelete } from "@/lib/admin-delete";

interface Church {
  id: string;
  name: string;
  approved: boolean;
  requested: boolean;
  active: boolean;
  pastor_president: string | null;
  requester_pastor_name: string | null;
  requester_phone: string | null;
}

interface EditRequest {
  id: string;
  church_id: string;
  proposed_name: string | null;
  proposed_pastor_president: string | null;
  proposed_requester_phone: string | null;
  status: "pending" | "approved" | "rejected";
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  requested_by: string;
}

interface RequesterProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

export default function AdminChurches() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") === "solicitacoes" ? "solicitacoes" : "igrejas";
  const [tab, setTab] = useState<string>(tabParam);

  useEffect(() => {
    setTab(tabParam);
  }, [tabParam]);

  const [rows, setRows] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Church | null>(null);
  const [name, setName] = useState("");
  const [pastorPresident, setPastorPresident] = useState("");

  const [requests, setRequests] = useState<EditRequest[]>([]);
  const [requesters, setRequesters] = useState<Record<string, RequesterProfile>>({});
  const [reviewing, setReviewing] = useState<EditRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">("approve");
  const [reviewNote, setReviewNote] = useState("");

  const churchById = useMemo(() => {
    const m = new Map<string, Church>();
    rows.forEach((c) => m.set(c.id, c));
    return m;
  }, [rows]);

  const load = async () => {
    setLoading(true);
    const [chRes, reqRes] = await Promise.all([
      supabase.from("churches").select("*").order("created_at", { ascending: false }),
      supabase
        .from("church_edit_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);
    setRows((chRes.data as any) ?? []);
    const reqs = (reqRes.data as EditRequest[]) ?? [];
    setRequests(reqs as EditRequest[]);

    const ids = Array.from(new Set(reqs.map((r) => r.requested_by)));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", ids);
      const map: Record<string, RequesterProfile> = {};
      (profs ?? []).forEach((p: any) => (map[p.id] = p));
      setRequesters(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("admin-churches-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "churches" }, () => load())
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "church_edit_requests" },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const save = async () => {
    if (!name.trim()) return toast.error("Nome obrigatório");
    const payload = {
      name: name.trim(),
      pastor_president: pastorPresident.trim() || null,
    };
    if (editing) {
      const { error } = await supabase.from("churches").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Igreja atualizada");
    } else {
      const { error } = await supabase
        .from("churches")
        .insert({ ...payload, approved: true, requested: false });
      if (error) return toast.error(error.message);
      toast.success("Igreja criada");
    }
    setOpen(false);
    setEditing(null);
    setName("");
    setPastorPresident("");
    load();
  };

  const approve = async (c: Church) => {
    const { error } = await supabase.from("churches").update({ approved: true }).eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Igreja aprovada");
    load();
  };

  const toggleActive = async (c: Church) => {
    const { error } = await supabase.from("churches").update({ active: !c.active }).eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success(c.active ? "Desativada" : "Ativada");
    load();
  };

  const openReview = (r: EditRequest, action: "approve" | "reject") => {
    setReviewing(r);
    setReviewAction(action);
    setReviewNote("");
  };

  const confirmReview = async () => {
    if (!reviewing) return;
    const fn = reviewAction === "approve"
      ? "approve_church_edit_request"
      : "reject_church_edit_request";
    const { error } = await supabase.rpc(fn as any, {
      p_request_id: reviewing.id,
      p_note: reviewNote || null,
    });
    if (error) return toast.error("Falha: " + error.message);
    toast.success(reviewAction === "approve" ? "Solicitação aprovada" : "Solicitação rejeitada");
    setReviewing(null);
    load();
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length + rows.filter(c => !c.approved && c.requested).length;

  return (
    <AdminPage
      title="Igrejas"
      description="Aprovar solicitações e gerenciar igrejas."
      Icon={Church}
      variant="secondary"
    >
      <div className="flex items-end justify-end">
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) {
              setEditing(null);
              setName("");
              setPastorPresident("");
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-1" /> Nova Igreja
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar" : "Nova"} Igreja</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Nome da igreja"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                placeholder="Pastor Presidente"
                value={pastorPresident}
                onChange={(e) => setPastorPresident(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={save}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v);
          const next = new URLSearchParams(searchParams);
          if (v === "solicitacoes") next.set("tab", "solicitacoes");
          else next.delete("tab");
          setSearchParams(next, { replace: true });
        }}
      >
        <TabsList>
          <TabsTrigger value="igrejas">Igrejas</TabsTrigger>
          <TabsTrigger value="solicitacoes" className="gap-2">
            <Inbox className="w-4 h-4" />
            Solicitações pendentes
            {pendingCount > 0 && (
              <Badge className="bg-destructive text-destructive-foreground h-5 px-1.5">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="igrejas" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Pastor Presidente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Carregando…
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.pastor_president ?? "—"}
                      </TableCell>
                      <TableCell className="space-x-1">
                        {c.approved ? (
                          <Badge>Aprovada</Badge>
                        ) : (
                          <Badge variant="destructive">Pendente</Badge>
                        )}
                        {!c.active && <Badge variant="outline">Inativa</Badge>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.requester_pastor_name || c.pastor_president || "—"}{" "}
                        {c.requester_phone && `· ${c.requester_phone}`}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {!c.approved && (
                          <Button size="sm" variant="outline" onClick={() => approve(c)}>
                            <Check className="w-4 h-4 mr-1" /> Aprovar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditing(c);
                            setName(c.name);
                            setPastorPresident(c.pastor_president ?? "");
                            setOpen(true);
                          }}
                        >
                          Editar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => toggleActive(c)}>
                          <Power className="w-4 h-4 mr-1" /> {c.active ? "Desativar" : "Ativar"}
                        </Button>
                        <DeleteButton
                          itemLabel={`a igreja "${c.name}"`}
                          consequences={[
                            "Membros vinculados a esta igreja perderão a referência",
                            "Admins locais desta igreja perderão o acesso administrativo",
                            "Solicitações de edição pendentes serão removidas",
                          ]}
                          onConfirm={async () => {
                            const r = await smartDelete({ table: "churches", id: c.id });
                            if (!r.ok) return r.error || "Falha ao apagar";
                            load();
                            return true;
                          }}
                          successMessage="Igreja removida"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="solicitacoes" className="mt-4 space-y-4">
          {loading ? (
            <Card className="p-6 text-center text-muted-foreground">Carregando…</Card>
          ) : requests.length === 0 && rows.filter(c => !c.approved && c.requested).length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              Nenhuma solicitação pendente.
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Seção de Novas Igrejas */}
              {rows.filter(c => !c.approved && c.requested).length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-primary flex items-center gap-2 px-1 uppercase tracking-wider">
                    <Plus className="w-4 h-4" />
                    Novas solicitações de adesão
                  </h3>
                  {rows.filter(c => !c.approved && c.requested).map((c) => (
                    <Card key={c.id} className="p-4 border-primary/20 bg-primary/5 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="font-bold text-lg text-foreground">{c.name}</div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span>Solicitado por: <strong className="text-foreground">{c.requester_pastor_name || c.pastor_president || "—"}</strong></span>
                            <span>Contato: <strong className="text-foreground">{c.requester_phone || "—"}</strong></span>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                          onClick={() => approve(c)}
                        >
                          <Check className="w-4 h-4 mr-1" /> Aprovar Adesão
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Seção de Edições */}
              {requests.filter(r => r.status === 'pending').length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-amber-600 flex items-center gap-2 px-1 uppercase tracking-wider">
                    <Pencil className="w-4 h-4" />
                    Solicitações de alteração de dados
                  </h3>
                  {requests.filter(r => r.status === 'pending').map((r) => {
                    const ch = churchById.get(r.church_id);
                    const requester = requesters[r.requested_by];
                    const requesterName = requester
                      ? `${requester.first_name ?? ""} ${requester.last_name ?? ""}`.trim()
                      : "—";
                    return (
                      <Card key={r.id} className="p-4 space-y-3 border-amber-500/20 bg-amber-500/5 shadow-sm">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <div className="font-bold text-foreground">
                              {ch?.name ?? "Igreja removida"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Por {requesterName} ·{" "}
                              {new Date(r.created_at).toLocaleString("pt-BR")}
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">Pendente</Badge>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-2 text-sm">
                          {r.proposed_name && ch && (
                            <DiffRow label="Nome" before={ch.name} after={r.proposed_name} />
                          )}
                          {r.proposed_pastor_president && ch && (
                            <DiffRow
                              label="Pastor Presidente"
                              before={ch.pastor_president ?? "—"}
                              after={r.proposed_pastor_president}
                            />
                          )}
                          {r.proposed_requester_phone && ch && (
                            <DiffRow
                              label="Telefone"
                              before={ch.requester_phone ?? "—"}
                              after={r.proposed_requester_phone}
                            />
                          )}
                        </div>

                        {r.review_note && (
                          <div className="text-xs italic text-muted-foreground border-t pt-2 border-amber-500/10">
                            Observação: {r.review_note}
                          </div>
                        )}

                        <div className="flex justify-end gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-amber-200 text-amber-800 hover:bg-amber-100"
                            onClick={() => openReview(r, "reject")}
                          >
                            <X className="w-4 h-4 mr-1" /> Rejeitar
                          </Button>
                          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold" onClick={() => openReview(r, "approve")}>
                            <Check className="w-4 h-4 mr-1" /> Aprovar
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Histórico (Aprovadas/Rejeitadas) */}
              {requests.filter(r => r.status !== 'pending').length > 0 && (
                <div className="space-y-3 pt-4 opacity-70">
                  <h3 className="text-xs font-semibold text-muted-foreground px-1 uppercase tracking-wider">Histórico recente</h3>
                  {requests.filter(r => r.status !== 'pending').slice(0, 5).map((r) => (
                    <Card key={r.id} className="p-3 bg-muted/50 text-xs">
                       <div className="flex justify-between items-center">
                          <span>{churchById.get(r.church_id)?.name || "Igreja"}</span>
                          <Badge variant={r.status === 'approved' ? 'default' : 'destructive'} className="scale-75">
                            {r.status === 'approved' ? 'Aprovada' : 'Rejeitada'}
                          </Badge>
                       </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!reviewing} onOpenChange={(o) => !o && setReviewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" ? "Aprovar solicitação" : "Rejeitar solicitação"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {reviewAction === "approve"
                ? "Os campos serão aplicados imediatamente à igreja."
                : "A solicitação será marcada como rejeitada."}
            </p>
            <Textarea
              placeholder="Observação (opcional)…"
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewing(null)}>
              Cancelar
            </Button>
            <Button
              onClick={confirmReview}
              variant={reviewAction === "approve" ? "default" : "destructive"}
            >
              {reviewAction === "approve" ? "Aprovar" : "Rejeitar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}

function DiffRow({ label, before, after }: { label: string; before: string; after: string }) {
  return (
    <div className="rounded-md border p-2 bg-background/50 space-y-1">
      <div className="text-[10px] text-muted-foreground font-bold uppercase">{label}</div>
      <div className="text-xs">
        <span className="line-through text-muted-foreground/60 mr-2">{before}</span>
        <ArrowRight className="inline w-3 h-3 mx-1 text-primary" />
        <span className="font-bold text-foreground ml-1">{after}</span>
      </div>
    </div>
  );
}

import { ArrowRight } from "lucide-react";
