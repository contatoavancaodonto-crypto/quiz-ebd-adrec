import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Check, X, Power } from "lucide-react";

interface Church {
  id: string;
  name: string;
  approved: boolean;
  requested: boolean;
  active: boolean;
  pastor_president: string | null;
  requester_pastor_name: string | null;
  requester_phone: string | null;
  requester_area: number | null;
}

export default function AdminChurches() {
  const [rows, setRows] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Church | null>(null);
  const [name, setName] = useState("");
  const [pastorPresident, setPastorPresident] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("churches")
      .select("*")
      .order("created_at", { ascending: false });
    setRows((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
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

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Igrejas</h2>
          <p className="text-sm text-muted-foreground">Aprovar solicitações e gerenciar igrejas</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setName(""); setPastorPresident(""); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-1" /> Nova Igreja</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Editar" : "Nova"} Igreja</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Nome da igreja" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Pastor Presidente" value={pastorPresident} onChange={(e) => setPastorPresident(e.target.value)} />
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
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Carregando…</TableCell></TableRow>
            ) : rows.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {c.pastor_president ?? "—"}
                </TableCell>
                <TableCell className="space-x-1">
                  {c.approved ? <Badge>Aprovada</Badge> : <Badge variant="destructive">Pendente</Badge>}
                  {!c.active && <Badge variant="outline">Inativa</Badge>}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {c.requester_pastor_name ?? "—"} {c.requester_phone && `· ${c.requester_phone}`}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {!c.approved && (
                    <Button size="sm" variant="outline" onClick={() => approve(c)}>
                      <Check className="w-4 h-4 mr-1" /> Aprovar
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => { setEditing(c); setName(c.name); setPastorPresident(c.pastor_president ?? ""); setOpen(true); }}>
                    Editar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleActive(c)}>
                    <Power className="w-4 h-4 mr-1" /> {c.active ? "Desativar" : "Ativar"}
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
