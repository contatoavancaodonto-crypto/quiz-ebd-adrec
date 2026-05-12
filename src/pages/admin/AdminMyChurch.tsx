import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRoles } from "@/hooks/useRoles";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Send, Clock, CheckCircle2, XCircle, Info, Church } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminPage";
import { Navigate } from "react-router-dom";

interface ChurchData {
  id: string;
  name: string;
  pastor_president: string | null;
  requester_phone: string | null;
}

interface EditRequest {
  id: string;
  proposed_name: string | null;
  proposed_pastor_president: string | null;
  proposed_requester_phone: string | null;
  status: "pending" | "approved" | "rejected";
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export default function AdminMyChurch() {
  const { isSuperadmin, isChurchAdmin, churchId, loading: rolesLoading } = useRoles();
  const { user } = useAuth();
  const [church, setChurch] = useState<ChurchData | null>(null);
  const [name, setName] = useState("");
  const [pastor, setPastor] = useState("");
  const [phone, setPhone] = useState("");
  const [requests, setRequests] = useState<EditRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (rolesLoading || !churchId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const [{ data: ch }, { data: reqs }] = await Promise.all([
        supabase
          .from("churches")
          .select("id, name, pastor_president, requester_phone")
          .eq("id", churchId)
          .maybeSingle(),
        supabase
          .from("church_edit_requests")
          .select(
            "id, proposed_name, proposed_pastor_president, proposed_requester_phone, status, review_note, reviewed_at, created_at"
          )
          .eq("church_id", churchId)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      if (cancelled) return;
      if (ch) {
        setChurch(ch as unknown as ChurchData);
        setName(ch.name ?? "");
        setPastor(ch.pastor_president ?? "");
        setPhone(ch.requester_phone ?? "");
      }
      setRequests((reqs as unknown as EditRequest[]) ?? []);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel(`my-church-rt-${churchId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "church_edit_requests", filter: `church_id=eq.${churchId}` },
        () => load()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "churches", filter: `id=eq.${churchId}` },
        () => load()
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [rolesLoading, churchId]);

  if (rolesLoading) return null;
  if (!isChurchAdmin && !isSuperadmin) return <Navigate to="/painel" replace />;

  const hasPending = requests.some((r) => r.status === "pending");

  const handleSubmit = async () => {
    if (!church || !user) return;
    if (!name.trim()) {
      toast.error("Nome da igreja é obrigatório");
      return;
    }
    if (hasPending) {
      toast.error("Você já tem uma solicitação pendente. Aguarde a revisão.");
      return;
    }

    // Detecta o que mudou
    const proposed_name = name.trim() !== (church.name ?? "") ? name.trim() : null;
    const proposed_pastor_president =
      pastor.trim() !== (church.pastor_president ?? "") ? pastor.trim() : null;
    const proposed_requester_phone =
      phone.trim() !== (church.requester_phone ?? "") ? phone.trim() : null;
    if (
      !proposed_name &&
      !proposed_pastor_president &&
      !proposed_requester_phone
    ) {
      toast.info("Nenhuma alteração detectada");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("church_edit_requests").insert({
      church_id: church.id,
      requested_by: user.id,
      proposed_name,
      proposed_pastor_president,
      proposed_requester_phone,
      status: "pending",
    } as any);
    setSubmitting(false);

    if (error) {
      toast.error("Falha ao enviar: " + error.message);
      return;
    }
    toast.success("Solicitação enviada ao superadmin");
  };

  return (
    <AdminPage
      title="Minha Igreja"
      description="Edite os dados da sua igreja. Toda alteração precisa ser aprovada pelo superadmin."
      Icon={Church}
      variant="secondary"
    >

      {loading || !church ? (
        <Card className="p-6 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
        </Card>
      ) : (
        <>
          <Card className="p-5 space-y-4">
            <div className="flex items-start gap-2 rounded-md bg-amber-500/10 border border-amber-500/30 p-3 text-sm text-amber-700 dark:text-amber-300">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                As alterações <strong>não entram em vigor imediatamente</strong>. Após salvar,
                o superadmin recebe a notificação e pode aprovar ou rejeitar.
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome da igreja</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pastor">Pastor Presidente</Label>
                <Input
                  id="pastor"
                  value={pastor}
                  onChange={(e) => setPastor(e.target.value)}
                  placeholder="Nome do pastor presidente"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Telefone de contato</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSubmit} disabled={submitting || hasPending}>
                {submitting ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-1" />
                )}
                {hasPending ? "Solicitação pendente…" : "Solicitar alteração"}
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-foreground mb-3">Histórico de solicitações</h3>
            {requests.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma solicitação ainda.</p>
            ) : (
              <ul className="space-y-3">
                {requests.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-md border bg-muted/20 p-3 text-sm space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString("pt-BR")}
                      </div>
                      {r.status === "pending" && (
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="w-3 h-3" /> Pendente
                        </Badge>
                      )}
                      {r.status === "approved" && (
                        <Badge className="bg-green-600 hover:bg-green-600 gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Aprovada
                        </Badge>
                      )}
                      {r.status === "rejected" && (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="w-3 h-3" /> Rejeitada
                        </Badge>
                      )}
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {r.proposed_name && (
                        <li>
                          <span className="font-medium">Nome:</span> {r.proposed_name}
                        </li>
                      )}
                      {r.proposed_pastor_president && (
                        <li>
                          <span className="font-medium">Pastor:</span>{" "}
                          {r.proposed_pastor_president}
                        </li>
                      )}
                      {r.proposed_requester_phone && (
                        <li>
                          <span className="font-medium">Telefone:</span>{" "}
                          {r.proposed_requester_phone}
                        </li>
                      )}
                    </ul>
                    {r.review_note && (
                      <div className="text-xs italic text-muted-foreground border-t pt-1.5">
                        Observação do superadmin: {r.review_note}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </AdminPage>
  );
}
