import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Trash2, Search, ListChecks } from "lucide-react";
import { useRoles } from "@/hooks/useRoles";
import { AdminPage } from "@/components/admin/AdminPage";

interface Attempt {
  id: string;
  score: number;
  total_questions: number;
  total_time_seconds: number;
  finished_at: string | null;
  participants: { name: string; class_id: string } | null;
}

const norm = (s: string | null | undefined) =>
  (s ?? "").toLowerCase().trim().replace(/\s+/g, " ");

export default function AdminAttempts() {
  const { isSuperadmin, churchId, loading: rolesLoading } = useRoles();
  const [rows, setRows] = useState<Attempt[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [allowedNames, setAllowedNames] = useState<Set<string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    
    // 1. Primeiro, carregar os nomes permitidos se for admin local
    let currentAllowedNames: Set<string> | null = null;
    if (!isSuperadmin && churchId) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("church_id", churchId);
      currentAllowedNames = new Set(
        (profs ?? []).map((p: any) =>
          norm(`${p.first_name ?? ""} ${p.last_name ?? ""}`)
        )
      );
      setAllowedNames(currentAllowedNames);
    } else {
      setAllowedNames(null);
    }

    // 2. Construir a query base
    let query = supabase
      .from("quiz_attempts")
      .select(
        "id, score, total_questions, total_time_seconds, finished_at, participants(name, class_id)",
        { count: "exact" }
      );

    // 3. Aplicar filtros
    if (q) {
      query = query.ilike("participants.name", `%${q}%`);
    }

    // 4. Paginação e Ordenação
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count } = await query
      .order("finished_at", { ascending: false, nullsFirst: false })
      .range(from, to);

    let attempts = (data as any) ?? [];

    // 5. Filtragem por igreja (admin local)
    if (currentAllowedNames) {
      attempts = attempts.filter((r: any) => currentAllowedNames?.has(norm(r.participants?.name)));
    }

    setRows(attempts);
    setTotalCount(count ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    if (rolesLoading) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolesLoading, isSuperadmin, churchId, page, q]);

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
