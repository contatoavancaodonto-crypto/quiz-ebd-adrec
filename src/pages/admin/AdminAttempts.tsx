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
  const [allowedNames, setAllowedNames] = useState<Set<string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("quiz_attempts")
      .select(
        "id, score, total_questions, total_time_seconds, finished_at, participants(name, class_id)"
      )
      .order("finished_at", { ascending: false, nullsFirst: false })
      .limit(500);
    setRows((data as any) ?? []);

    if (!isSuperadmin && churchId) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("church_id", churchId);
      const set = new Set(
        (profs ?? []).map((p: any) =>
          norm(`${p.first_name ?? ""} ${p.last_name ?? ""}`)
        )
      );
      setAllowedNames(set);
    } else {
      setAllowedNames(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (rolesLoading) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolesLoading, isSuperadmin, churchId]);

  const remove = async (id: string) => {
    if (!confirm("Excluir esta tentativa? Essa ação é permanente.")) return;
    const { error } = await supabase.from("quiz_attempts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removida");
    load();
  };

  const filtered = useMemo(() => {
    let list = rows;
    if (allowedNames) {
      list = list.filter((r) => allowedNames.has(norm(r.participants?.name)));
    }
    if (q) list = list.filter((r) => (r.participants?.name ?? "").toLowerCase().includes(q.toLowerCase()));
    return list;
  }, [rows, allowedNames, q]);

  return (
    <AdminPage
      title="Tentativas"
      description={
        isSuperadmin
          ? "Últimas 500 tentativas · exclusão permanente."
          : "Tentativas dos membros da sua igreja · exclusão permanente."
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
    </AdminPage>
  );
}
