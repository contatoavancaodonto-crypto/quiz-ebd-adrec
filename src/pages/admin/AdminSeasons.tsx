import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Lock, Calendar } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminPage";

interface Season { id: string; name: string; start_date: string; end_date: string; status: string; }

export default function AdminSeasons() {
  const [rows, setRows] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", start_date: "", end_date: "" });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("seasons").select("*").order("end_date", { ascending: false });
    setRows((data as any) ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name || !form.end_date) return toast.error("Preencha nome e data de término");
    const { error } = await supabase.from("seasons").insert({
      name: form.name,
      start_date: form.start_date || new Date().toISOString(),
      end_date: form.end_date,
      status: "active",
    });
    if (error) return toast.error(error.message);
    toast.success("Temporada criada");
    setOpen(false); setForm({ name: "", start_date: "", end_date: "" }); load();
  };

  const close = async (s: Season) => {
    if (!confirm(`Encerrar temporada "${s.name}"? Os badges finais serão atribuídos.`)) return;
    const { error } = await supabase.from("seasons").update({ status: "closed" }).eq("id", s.id);
    if (error) return toast.error(error.message);
    toast.success("Encerrada"); load();
  };

  return (
    <AdminPage
      title="Temporadas"
      description="Gerenciar ciclos competitivos."
      Icon={Calendar}
      variant="emerald"
      actions={
        <Button onClick={() => setOpen(true)} className="bg-white text-foreground hover:bg-white/90 shadow">
          <Plus className="w-4 h-4 mr-1" /> Nova Temporada
        </Button>
      }
    >
      <Card>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Nome</TableHead><TableHead>Início</TableHead><TableHead>Término</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Carregando…</TableCell></TableRow>
            ) : rows.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>{new Date(s.start_date).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell>{new Date(s.end_date).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell>{s.status === "active" ? <Badge>Ativa</Badge> : <Badge variant="outline">Encerrada</Badge>}</TableCell>
                <TableCell className="text-right">
                  {s.status === "active" && (
                    <Button size="sm" variant="outline" onClick={() => close(s)}>
                      <Lock className="w-4 h-4 mr-1" /> Encerrar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Temporada</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: 1º Tri 2026" /></div>
            <div><Label>Início (opcional)</Label><Input type="datetime-local" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
            <div><Label>Término</Label><Input type="datetime-local" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={create}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
