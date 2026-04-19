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
import { Plus, Power, Search } from "lucide-react";

interface Verse { id: string; book: string; chapter: number; verse: number; text: string; theme: string; active: boolean; }

export default function AdminVerses() {
  const [rows, setRows] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Verse | null>(null);
  const [form, setForm] = useState({ book: "", chapter: 1, verse: 1, text: "", theme: "fé" });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("verses").select("*").order("book").limit(500);
    setRows((data as any) ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.book || !form.text) return toast.error("Livro e texto obrigatórios");
    if (editing) {
      const { error } = await supabase.from("verses").update(form).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("verses").insert(form);
      if (error) return toast.error(error.message);
    }
    toast.success("Salvo");
    setOpen(false); setEditing(null); setForm({ book: "", chapter: 1, verse: 1, text: "", theme: "fé" }); load();
  };

  const toggleActive = async (v: Verse) => {
    const { error } = await supabase.from("verses").update({ active: !v.active }).eq("id", v.id);
    if (error) return toast.error(error.message);
    toast.success(v.active ? "Desativado" : "Ativado"); load();
  };

  const filtered = rows.filter((r) => `${r.book} ${r.text} ${r.theme}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Versículos</h2>
          <p className="text-sm text-muted-foreground">Pool do versículo do dia (até 500 mostrados)</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm({ book: "", chapter: 1, verse: 1, text: "", theme: "fé" }); setOpen(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Novo Versículo
        </Button>
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Referência</TableHead><TableHead>Tema</TableHead><TableHead>Texto</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Carregando…</TableCell></TableRow>
            ) : filtered.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-medium whitespace-nowrap">{v.book} {v.chapter}:{v.verse}</TableCell>
                <TableCell><Badge variant="outline">{v.theme}</Badge></TableCell>
                <TableCell className="max-w-md truncate">{v.text}</TableCell>
                <TableCell>{v.active ? <Badge>Ativo</Badge> : <Badge variant="outline">Inativo</Badge>}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="sm" variant="outline" onClick={() => {
                    setEditing(v); setForm({ book: v.book, chapter: v.chapter, verse: v.verse, text: v.text, theme: v.theme }); setOpen(true);
                  }}>Editar</Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleActive(v)}>
                    <Power className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo"} Versículo</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div><Label>Livro</Label><Input value={form.book} onChange={(e) => setForm({ ...form, book: e.target.value })} /></div>
              <div><Label>Cap.</Label><Input type="number" value={form.chapter} onChange={(e) => setForm({ ...form, chapter: Number(e.target.value) })} /></div>
              <div><Label>Vers.</Label><Input type="number" value={form.verse} onChange={(e) => setForm({ ...form, verse: Number(e.target.value) })} /></div>
            </div>
            <div><Label>Tema</Label><Input value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })} /></div>
            <div><Label>Texto</Label><Textarea rows={4} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
