import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Trash2, Search, ListChecks } from "lucide-react";
import { useRoles } from "@/hooks/useRoles";
import { useClassSwitcher } from "@/hooks/useClassSwitcher";
import { AdminPage } from "@/components/admin/AdminPage";

interface Attempt {
  id: string;
  score: number;
  total_questions: number;
  total_time_seconds: number;
  finished_at: string | null;
  participants: { name: string; class_id: string } | null;
}


export default function AdminAttempts() {
  const { isSuperadmin, churchId, loading: rolesLoading } = useRoles();
  const { selectedClassId } = useClassSwitcher();
  const [rows, setRows] = useState<Attempt[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 50;
  
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    
    // 1. Construir a query base
    let query = supabase
      .from("quiz_attempts")
      .select(
        `
        id, 
        score, 
        total_questions, 
        total_time_seconds, 
        finished_at, 
        participants!inner(
          name, 
          class_id,
          profiles!inner(
            church_id
          )
        )
        `,
        { count: "exact" }
      );

    // 2. Aplicar filtros de permissão e igreja
    if (!isSuperadmin && churchId) {
      query = query.eq("participants.profiles.church_id", churchId);
    }

    if (selectedClassId) {
      query = query.eq("participants.class_id", selectedClassId);
    }
    
    if (q) {
      query = query.ilike("participants.name", `%${q}%`);
    }

    // 3. Paginação e Ordenação
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await query
      .order("finished_at", { ascending: false, nullsFirst: false })
      .range(from, to);

    if (error) {
      console.error("Erro ao carregar tentativas:", error);
      toast.error("Erro ao carregar tentativas");
      setLoading(false);
      return;
    }

    // 4. Tratamento dos dados para garantir compatibilidade com o formato esperado
    const attempts = ((data as any) ?? []).map((item: any) => {
      // Garantir que participants seja um objeto e não um array
      const participantData = Array.isArray(item.participants) 
        ? item.participants[0] 
        : item.participants;
        
      return {
        ...item,
        participants: participantData
      };
    });

    setRows(attempts);
    setTotalCount(count ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    if (rolesLoading) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolesLoading, isSuperadmin, churchId, page, q, selectedClassId]);

  const remove = async (id: string) => {
    if (!confirm("Excluir esta tentativa? Essa ação é permanente.")) return;
    const { error } = await supabase.from("quiz_attempts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removida");
    load();
  };

  const filtered = rows;

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <AdminPage
      title="Tentativas"
      description={
        isSuperadmin
          ? `Total de ${totalCount} tentativas encontradas · exclusão permanente.`
          : `Tentativas dos membros da sua igreja (${totalCount}) · exclusão permanente.`
      }
      Icon={ListChecks}
      variant="amber"
    >
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar por nome…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Participante</TableHead><TableHead>Acertos</TableHead><TableHead>Tempo</TableHead>
              <TableHead>Concluído em</TableHead><TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Carregando…</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhuma tentativa.</TableCell></TableRow>
            ) : filtered.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.participants?.name ?? "—"}</TableCell>
                <TableCell>{a.score}/{a.total_questions}</TableCell>
                <TableCell>{a.total_time_seconds}s</TableCell>
                <TableCell>{a.finished_at ? new Date(a.finished_at).toLocaleString("pt-BR") : "Em andamento"}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => remove(a.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </AdminPage>
  );
}
