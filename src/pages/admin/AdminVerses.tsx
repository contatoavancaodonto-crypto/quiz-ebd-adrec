import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Sparkles, BookOpen, Trash2 } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminPage";

type Pergunta = {
  id: string
  pergunta: string
  tipo: 'multipla_escolha' | 'discursiva'
  alternativas?: { a: string; b: string; c: string; d: string }
  respostaCorreta?: string
  comentario?: string
}

type LicaoSemanal = {
  id: string
  trimester: string
  lesson_number: number
  theme: string
  description?: string
  verses: {
    segunda: { referencia: string; texto: string; observacao?: string }
    terca: { referencia: string; texto: string; observacao?: string }
    quarta: { referencia: string; texto: string; observacao?: string }
    quinta: { referencia: string; texto: string; observacao?: string }
    sexta: { referencia: string; texto: string; observacao?: string }
    sabado: { referencia: string; texto: string; observacao?: string }
    domingo: { referencia: string; texto: string; observacao?: string }
  }
  questions: Pergunta[]
  status: 'completo' | 'incompleto'
}

export default function AdminLessons() {
  const [lessons, setLessons] = useState<LicaoSemanal[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LicaoSemanal | null>(null);
  const [form, setForm] = useState<LicaoSemanal>({
    id: "", trimester: "1", lesson_number: 1, theme: "", verses: {
      segunda: { referencia: "", texto: "" }, terca: { referencia: "", texto: "" },
      quarta: { referencia: "", texto: "" }, quinta: { referencia: "", texto: "" },
      sexta: { referencia: "", texto: "" }, sabado: { referencia: "", texto: "" },
      domingo: { referencia: "", texto: "" }
    }, questions: [], status: 'incompleto'
  });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("lessons").select("*").order("lesson_number");
    if (error) toast.error(error.message);
    else setLessons((data as any) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    // Validate
    const hasVerses = Object.values(form.verses).every(v => v.referencia && v.texto);
    const hasQuestions = form.questions.length > 0;
    const status = (form.theme && hasVerses && hasQuestions) ? 'completo' : 'incompleto';

    const payload = { ...form, status };
    if (editing) {
      const { error } = await supabase.from("lessons").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("lessons").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("Lição salva!");
    setOpen(false);
    load();
  };

  const handleAiImport = async (text: string) => {
    setLoading(true);
    try {
        const { data, error } = await supabase.functions.invoke("community-ai", {
            body: { mode: "parse_weekly_lesson", text },
        });
        if (error) throw error;
        setForm(prev => ({ ...prev, ...data }));
        toast.success("Importado via IA");
    } catch (err: any) {
        toast.error("Erro na IA: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <AdminPage
      title="Gerenciador de Lições"
      description="Gerencie as lições semanais."
      Icon={BookOpen}
      actions={
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Nova Lição
        </Button>
      }
    >
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {lessons.map(l => (
            <Card key={l.id} className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-[0_0_10px_rgba(var(--primary),0.2)]" onClick={() => { setEditing(l); setForm(l); setOpen(true); }}>
              <CardHeader>
                <CardTitle className="text-lg">Lição {l.lesson_number} • {l.trimester}º TRI</CardTitle>
                <CardDescription>{l.theme}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{Object.keys(l.verses).length} versículos, {l.questions.length} perguntas.</p>
              </CardContent>
              <CardFooter>
                <Badge variant={l.status === 'completo' ? 'default' : 'outline'}>{l.status}</Badge>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader><DialogTitle>Editar Lição</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[60vh] p-4">
            <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                    <Input placeholder="Lição #" type="number" value={form.lesson_number} onChange={e => setForm({...form, lesson_number: parseInt(e.target.value)})} />
                    <Input placeholder="Trimestre" value={form.trimester} onChange={e => setForm({...form, trimester: e.target.value})} />
                    <Input placeholder="Tema" value={form.theme} onChange={e => setForm({...form, theme: e.target.value})} />
                </div>
                <Textarea placeholder="Descrição" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                
                <h3 className="font-semibold text-lg">Versículos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.keys(form.verses).map((day: any) => (
                        <Card key={day} className="p-3">
                            <Label className="capitalize">{day}</Label>
                            <Input placeholder="Referência (ex: João 3:16)" value={form.verses[day].referencia} onChange={e => setForm({...form, verses: {...form.verses, [day]: {...form.verses[day], referencia: e.target.value}}})} />
                            <Textarea placeholder="Texto" value={form.verses[day].texto} onChange={e => setForm({...form, verses: {...form.verses, [day]: {...form.verses[day], texto: e.target.value}}})} />
                        </Card>
                    ))}
                </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
