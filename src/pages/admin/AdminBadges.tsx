import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Power, Award } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminPage";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { smartDelete } from "@/lib/admin-delete";

interface Bd { id: string; code: string; name: string; description: string; emoji: string; type: string; active: boolean; }

export default function AdminBadges() {
  const [rows, setRows] = useState<Bd[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Bd | null>(null);
  const [form, setForm] = useState({ code: "", name: "", description: "", emoji: "", type: "achievement" });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("badges").select("*").order("created_at");
    setRows((data as any) ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.code || !form.name) return toast.error("Code e nome obrigatórios");
    if (editing) {
      const { error } = await supabase.from("badges").update(form).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("badges").insert(form);
      if (error) return toast.error(error.message);
    }
    toast.success("Salvo");
    setOpen(false); setEditing(null);
    setForm({ code: "", name: "", description: "", emoji: "", type: "achievement" }); load();
  };

  const toggleActive = async (b: Bd) => {
    const { error } = await supabase.from("badges").update({ active: !b.active }).eq("id", b.id);
    if (error) return toast.error(error.message);
    toast.success(b.active ? "Desativada" : "Ativada"); load();
  };

  return (
    <AdminPage
      title="Badges"
      description="Conquistas atribuíveis aos participantes."
      Icon={Award}
      variant="rose"
      actions={
        <Button
          onClick={() => {
            setEditing(null);
            setForm({ code: "", name: "", description: "", emoji: "", type: "achievement" });
            setOpen(true);
          }}
          className="bg-white text-foreground hover:bg-white/90 shadow"
        >
          <Plus className="w-4 h-4 mr-1" /> Nova Badge
        </Button>
      }
    >
      <Card>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Emoji</TableHead><TableHead>Código</TableHead><TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Carregando…</TableCell></TableRow>
            ) : rows.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="text-2xl">{b.emoji}</TableCell>
                <TableCell className="font-mono text-xs">{b.code}</TableCell>
                <TableCell className="font-medium">{b.name}</TableCell>
                <TableCell><Badge variant="outline">{b.type}</Badge></TableCell>
                <TableCell>{b.active ? <Badge>Ativa</Badge> : <Badge variant="outline">Inativa</Badge>}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="sm" variant="outline" onClick={() => {
                    setEditing(b);
                    setForm({ code: b.code, name: b.name, description: b.description, emoji: b.emoji, type: b.type });
                    setOpen(true);
                  }}>Editar</Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleActive(b)}>
                    <Power className="w-4 h-4" />
                  </Button>
                  <DeleteButton
                    iconOnly
                    itemLabel={`a badge "${b.name}"`}
                    onConfirm={async () => {
                      const r = await smartDelete({ table: "badges", id: b.id });
                      if (!r.ok) return r.error || "Falha ao apagar";
                      load();
                      return true;
                    }}
                    successMessage="Badge removida"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar" : "Nova"} Badge</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Emoji</Label><Input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} /></div>
              <div><Label>Código</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
            </div>
            <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Tipo</Label><Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="achievement, season, milestone…" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
