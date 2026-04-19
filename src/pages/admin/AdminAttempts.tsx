import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Trash2, Search } from "lucide-react";

interface Attempt {
  id: string; score: number; total_questions: number; total_time_seconds: number;
  finished_at: string | null; participants: { name: string; class_id: string } | null;
}

export default function AdminAttempts() {
  const [rows, setRows] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("quiz_attempts")
      .select("id, score, total_questions, total_time_seconds, finished_at, participants(name, class_id)")
      .order("finished_at", { ascending: false, nullsFirst: false })
      .limit(500);
    setRows((data as any) ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!confirm("Excluir esta tentativa? Essa ação é permanente.")) return;
    const { error } = await supabase.from("quiz_attempts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removida"); load();
  };

  const filtered = rows.filter((r) => (r.participants?.name ?? "").toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Tentativas</h2>
        <p className="text-sm text-muted-foreground">Últimas 500 tentativas · exclusão permanente</p>
      </div>
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
    </div>
  );
}
