import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Power, Search, BookText, Trash2, Sparkles, Square, CheckSquare } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminPage";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { smartDelete } from "@/lib/admin-delete";

interface Verse { 
  id: string; 
  book: string; 
  chapter: number; 
  verse: number; 
  text: string; 
  theme: string; 
  active: boolean; 
  class_id?: string | null;
  trimester?: number | null;
  scheduled_date?: string | null;
}

interface Cls { id: string; name: string; }

export default function AdminVerses() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Verse[]>([]);
  const [classes, setClasses] = useState<Cls[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [trimesterFilter, setTrimesterFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Verse | null>(null);
  const [form, setForm] = useState({ 
    book: "", 
    chapter: 1, 
    verse: 1, 
    text: "", 
    theme: "fé", 
    class_id: "" as string | null, 
    trimester: 1,
    scheduled_date: "" as string | null
  });

  const [aiImportOpen, setAiImportOpen] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDate, setAiDate] = useState("");

  const load = async () => {
    setLoading(true);
    const [vs, cl] = await Promise.all([
      supabase.from("verses").select("*").order("book").limit(1000),
      supabase.from("classes").select("id, name").order("name")
    ]);
    setRows((vs.data as any) ?? []);
    setClasses((cl.data as Cls[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.book || !form.text) return toast.error("Livro e texto obrigatórios");
    
    const payload = {
      ...form,
      class_id: form.class_id || null,
      trimester: form.trimester || null,
      scheduled_date: form.scheduled_date || null
    };

    if (editing) {
      const { error } = await supabase.from("verses").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("verses").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("Salvo");
    setOpen(false); 
    setEditing(null); 
    setForm({ book: "", chapter: 1, verse: 1, text: "", theme: "fé", class_id: "", trimester: 1, scheduled_date: "" }); 
    load();
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Tem certeza que deseja apagar os ${selectedIds.size} versículos selecionados?`)) return;

    setLoading(true);
    for (const id of Array.from(selectedIds)) {
      await smartDelete({ table: "verses", id });
    }
    toast.success(`${selectedIds.size} itens removidos`);
    setSelectedIds(new Set());
    load();
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = (ids: string[]) => {
    if (selectedIds.size === ids.length && ids.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(ids));
    }
  };

  const handleAiImport = async () => {
    if (!aiText.trim()) return toast.error("Cole o texto para processar");
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("community-ai", {
        body: { mode: "parse_verses", text: aiText },
      });

      if (error) throw error;
      
      if (data.verses && Array.from(data.verses).length > 0) {
        let currentBatchDate = aiDate ? new Date(aiDate + "T12:00:00") : null;
        
        const versesToInsert = data.verses.map((v: any, index: number) => {
          let scheduled_date = null;
          if (currentBatchDate) {
            const dateObj = new Date(currentBatchDate);
            dateObj.setDate(dateObj.getDate() + index);
            scheduled_date = dateObj.toISOString().split('T')[0];
          }

          return {
            ...v,
            class_id: classFilter !== "all" ? classFilter : null,
            trimester: trimesterFilter !== "all" ? Number(trimesterFilter) : 1,
            scheduled_date
          };
        });

        const { error: insertError } = await supabase.from("verses").insert(versesToInsert);
        if (insertError) throw insertError;

        toast.success(`${versesToInsert.length} versículos importados com sucesso!`);
        setAiImportOpen(false);
        setAiText("");
        setAiDate("");
        load();
      } else {
        toast.error("Nenhum versículo identificado no texto.");
      }
    } catch (err: any) {
      toast.error("Falha ao processar com IA: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const toggleActive = async (v: Verse) => {
    const { error } = await supabase.from("verses").update({ active: !v.active }).eq("id", v.id);
    if (error) return toast.error(error.message);
    toast.success(v.active ? "Desativado" : "Ativado"); load();
  };

  const filtered = rows.filter((r) => {
    const matchesSearch = `${r.book} ${r.text} ${r.theme}`.toLowerCase().includes(q.toLowerCase());
    const matchesClass = classFilter === "all" || r.class_id === classFilter;
    const matchesTrimester = trimesterFilter === "all" || r.trimester === Number(trimesterFilter);
    return matchesSearch && matchesClass && matchesTrimester;
  });

  const filteredIds = filtered.map(f => f.id);

  return (
    <AdminPage
      title="Plano de Leitura (Versículos)"
      description="Pool do versículo do dia (até 1000 mostrados)."
      Icon={BookText}
      variant="secondary"
      actions={
        <div className="flex gap-2">
          <Button
            onClick={() => navigate("/painel/quizzes")}
            variant="outline"
            className="shadow"
          >
            Configurar por Semana
          </Button>
          <Button
            onClick={() => setAiImportOpen(true)}
            variant="outline"
            className="bg-white text-primary hover:bg-white/90 shadow border-primary/20"
          >
            <Sparkles className="w-4 h-4 mr-1 text-primary" /> Importar com IA
          </Button>
          <Button
            onClick={() => { setEditing(null); setForm({ book: "", chapter: 1, verse: 1, text: "", theme: "fé", class_id: classFilter !== "all" ? classFilter : "", trimester: trimesterFilter !== "all" ? Number(trimesterFilter) : 1, scheduled_date: "" }); setOpen(true); }}
            className="text-foreground shadow bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-1" /> Novo Versículo
          </Button>
        </div>
      }
    >
      <div className="flex flex-col md:flex-row gap-4 items-end mb-4">
        <div className="flex-1 space-y-1 w-full">
          <Label>Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        
        <div className="w-full md:w-48 space-y-1">
          <Label>Classe</Label>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as classes</SelectItem>
              {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-32 space-y-1">
          <Label>Trimestre</Label>
          <Select value={trimesterFilter} onValueChange={setTrimesterFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {[1, 2, 3, 4].map(t => <SelectItem key={t} value={t.toString()}>{t}º Trim</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {selectedIds.size > 0 && (
          <Button variant="destructive" onClick={deleteSelected} className="gap-2">
            <Trash2 className="w-4 h-4" /> Apagar ({selectedIds.size})
          </Button>
        )}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => toggleSelectAll(filteredIds)}
                >
                  {selectedIds.size === filteredIds.length && filteredIds.length > 0 ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </Button>
              </TableHead>
              <TableHead>Referência</TableHead>
              <TableHead>Agendado</TableHead>
              <TableHead>Classe/Trim</TableHead>
              <TableHead>Texto</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">Carregando…</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">Nenhum versículo encontrado.</TableCell></TableRow>
            ) : filtered.map((v) => (
              <TableRow key={v.id} className={selectedIds.has(v.id) ? "bg-muted/50" : ""}>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleSelect(v.id)}
                  >
                    {selectedIds.has(v.id) ? (
                      <CheckSquare className="w-4 h-4 text-primary" />
                    ) : (
                      <Square className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </TableCell>
                <TableCell className="font-medium whitespace-nowrap">{v.book} {v.chapter}:{v.verse}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {v.class_id ? (
                      <Badge variant="secondary" className="text-[10px] py-0">
                        {classes.find(c => c.id === v.class_id)?.name || "Classe"}
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic">Geral</span>
                    )}
                    {v.trimester && (
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        {v.trimester}º Trimestre
                      </span>
                    )}
                  </div>
                </TableCell>
                 <TableCell className="max-w-md truncate">{v.text}</TableCell>
                <TableCell>{v.active ? <Badge>Ativo</Badge> : <Badge variant="outline">Inativo</Badge>}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="sm" variant="outline" onClick={() => {
                    setEditing(v); 
                    setForm({ 
                      book: v.book, 
                      chapter: v.chapter, 
                      verse: v.verse, 
                      text: v.text, 
                      theme: v.theme,
                      class_id: v.class_id || "",
                      trimester: v.trimester || 1,
                      scheduled_date: v.scheduled_date || ""
                    }); 
                    setOpen(true);
                  }}>Editar</Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleActive(v)}>
                    <Power className="w-4 h-4" />
                  </Button>
                  <DeleteButton
                    iconOnly
                    itemLabel={`o versículo ${v.book} ${v.chapter}:${v.verse}`}
                    consequences={[
                      "O versículo deixa de aparecer no pool do versículo do dia",
                      "Históricos de versículos do dia continuam preservados",
                    ]}
                    onConfirm={async () => {
                      const r = await smartDelete({ table: "verses", id: v.id });
                      if (!r.ok) return r.error;
                      load();
                      return true;
                    }}
                    successMessage="Versículo removido"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Dialog para Novo/Editar */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo"} Versículo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Classe (Opcional)</Label>
                <Select 
                  value={form.class_id || "none"} 
                  onValueChange={(v) => setForm({ ...form, class_id: v === "none" ? "" : v })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione a classe" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Geral (Todas as classes)</SelectItem>
                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Trimestre</Label>
                <Select 
                  value={form.trimester?.toString()} 
                  onValueChange={(v) => setForm({ ...form, trimester: Number(v) })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map(t => <SelectItem key={t} value={t.toString()}>{t}º Trimestre</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div><Label>Livro</Label><Input value={form.book} onChange={(e) => setForm({ ...form, book: e.target.value })} /></div>
              <div><Label>Cap.</Label><Input type="number" value={form.chapter} onChange={(e) => setForm({ ...form, chapter: Number(e.target.value) })} /></div>
              <div><Label>Vers.</Label><Input type="number" value={form.verse} onChange={(e) => setForm({ ...form, verse: Number(e.target.value) })} /></div>
            </div>
            <div><Label>Texto</Label><Textarea rows={4} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Importação com IA */}
      <Dialog open={aiImportOpen} onOpenChange={setAiImportOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Importar Versículos com IA
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Cole abaixo uma lista de versículos ou um texto corrido. A IA identificará automaticamente a referência (Livro, Cap, Vers), o texto completo e sugerirá um tema.
            </p>
            <Textarea
              placeholder="Ex: João 3:16 - Porque Deus amou o mundo...
Salmos 23:1 - O Senhor é meu pastor..."
              className="min-h-[300px] font-mono text-sm"
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
            />
            <div className="flex justify-between items-center text-xs text-muted-foreground bg-muted p-2 rounded">
              <span>Os versículos serão importados para a <strong>{classFilter === 'all' ? 'Geral' : classes.find(c => c.id === classFilter)?.name}</strong> e <strong>{trimesterFilter === 'all' ? '1º Trimestre' : `${trimesterFilter}º Trimestre`}</strong>.</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiImportOpen(false)} disabled={aiLoading}>
              Cancelar
            </Button>
            <Button onClick={handleAiImport} disabled={aiLoading || !aiText.trim()}>
              {aiLoading ? "Processando..." : "Processar e Importar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
