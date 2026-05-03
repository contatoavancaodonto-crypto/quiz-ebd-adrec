import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Power, GraduationCap, Image as ImageIcon } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminPage";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { smartDelete } from "@/lib/admin-delete";

interface Cls {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  cover_url?: string;
  created_at: string;
}

export default function AdminClasses() {
  const [rows, setRows] = useState<Cls[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cls | null>(null);
  const [name, setName] = useState("");
  const [coverUrl, setCoverUrl] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("classes").select("*").order("name");
    setRows((data as Cls[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!name.trim()) return toast.error("Nome obrigatório");
    if (editing) {
      const { error } = await supabase.from("classes").update({ name, slug: name.toLowerCase(), cover_url: coverUrl || null }).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("classes").insert({ name, slug: name.toLowerCase(), cover_url: coverUrl || null });
      if (error) return toast.error(error.message);
    }
    toast.success("Salvo");
    setOpen(false); setEditing(null); setName(""); setCoverUrl(""); load();
  };

  const toggleActive = async (c: Cls) => {
    const { error } = await supabase.from("classes").update({ active: !c.active }).eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success(c.active ? "Desativada" : "Ativada"); load();
  };

  return (
    <AdminPage
      title="Turmas"
      description="Gerenciar turmas da EBD."
      Icon={GraduationCap}
      variant="emerald"
    >
      <div className="flex items-end justify-end">
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setName(""); setCoverUrl(""); } }}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" /> Nova Turma</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Editar" : "Nova"} Turma</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome</label>
                <Input placeholder="Nome (ex: Jovens, Adultos)" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">URL da Capa (opcional)</label>
                <div className="flex gap-2">
                  <Input placeholder="https://..." value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={save}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Nome</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Carregando…</TableCell></TableRow>
            ) : rows.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.active ? <Badge>Ativa</Badge> : <Badge variant="outline">Inativa</Badge>}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="sm" variant="outline" onClick={() => { setEditing(c); setName(c.name); setCoverUrl(c.cover_url || ""); setOpen(true); }}>Editar</Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleActive(c)}>
                    <Power className="w-4 h-4 mr-1" /> {c.active ? "Desativar" : "Ativar"}
                  </Button>
                  <DeleteButton
                    itemLabel={`a turma "${c.name}"`}
                    consequences={[
                      "Quizzes vinculados a esta turma podem ser bloqueados",
                      "Membros vinculados perderão a referência de turma",
                      "Materiais e perguntas continuam preservados",
                    ]}
                    onConfirm={async () => {
                      const r = await smartDelete({ table: "classes", id: c.id });
                      if (!r.ok) return r.error || "Falha ao apagar";
                      load();
                      return true;
                    }}
                    successMessage="Turma removida"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </AdminPage>
  );
}
