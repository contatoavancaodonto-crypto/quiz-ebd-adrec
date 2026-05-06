import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Sparkles, BookOpen, Trash2, CalendarDays, HelpCircle, CheckCircle2, AlertCircle, Pencil, ChevronRight } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminPage";
import { cn } from "@/lib/utils";

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
  class_id?: string
}

const DEFAULT_VERSES = {
  segunda: { referencia: "", texto: "" },
  terca: { referencia: "", texto: "" },
  quarta: { referencia: "", texto: "" },
  quinta: { referencia: "", texto: "" },
  sexta: { referencia: "", texto: "" },
  sabado: { referencia: "", texto: "" },
  domingo: { referencia: "", texto: "" }
};

export default function AdminVerses() {
  const [lessons, setLessons] = useState<LicaoSemanal[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiImportOpen, setAiImportOpen] = useState(false);

  const [form, setForm] = useState<Omit<LicaoSemanal, 'id'>>({
    trimester: "1",
    lesson_number: 1,
    theme: "",
    description: "",
    verses: { ...DEFAULT_VERSES },
    questions: [],
    status: 'incompleto'
  });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("lessons").select("*").order("lesson_number");
    if (error) toast.error(error.message);
    else setLessons((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditingId(null);
    setForm({
      trimester: "1",
      lesson_number: (lessons[lessons.length - 1]?.lesson_number || 0) + 1,
      theme: "",
      description: "",
      verses: { ...DEFAULT_VERSES },
      questions: [],
      status: 'incompleto'
    });
    setOpen(true);
  };

  const openEdit = (l: LicaoSemanal) => {
    setEditingId(l.id);
    setForm({
      trimester: l.trimester,
      lesson_number: l.lesson_number,
      theme: l.theme,
      description: l.description || "",
      verses: { ...DEFAULT_VERSES, ...l.verses },
      questions: l.questions || [],
      status: l.status
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.theme || !form.lesson_number || !form.trimester) {
      return toast.error("Preencha número, trimestre e tema.");
    }

    setSaving(true);
    
    // Status validation
    const has7Verses = Object.values(form.verses).every(v => v.referencia.trim() !== "" && v.texto.trim() !== "");
    const hasQuestions = form.questions.length > 0;
    const status = (form.theme && has7Verses && hasQuestions) ? 'completo' : 'incompleto';

    const payload = { ...form, status };

    try {
      if (editingId) {
        const { error } = await supabase.from("lessons").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("lessons").insert(payload);
        if (error) throw error;
      }
      toast.success("Lição salva com sucesso!");
      setOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteLesson = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja apagar esta lição?")) return;
    const { error } = await supabase.from("lessons").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Lição removida");
      load();
    }
  };

  const handleAiImport = async () => {
    if (!aiText.trim()) return toast.error("Insira o texto para processar.");
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("community-ai", {
        body: { mode: "parse_weekly_lesson", text: aiText },
      });
      if (error) throw error;
      
      setForm(prev => ({
        ...prev,
        ...data,
        verses: { ...prev.verses, ...data.verses }
      }));
      setAiImportOpen(false);
      setAiText("");
      toast.success("Informações extraídas com sucesso!");
    } catch (err: any) {
      toast.error("Erro na IA: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const addQuestion = () => {
    const newQ: Pergunta = {
      id: Math.random().toString(36).substr(2, 9),
      pergunta: "",
      tipo: 'multipla_escolha',
      alternativas: { a: "", b: "", c: "", d: "" },
      respostaCorreta: "a"
    };
    setForm(prev => ({ ...prev, questions: [...prev.questions, newQ] }));
  };

  const updateQuestion = (id: string, updates: Partial<Pergunta>) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.map(q => q.id === id ? { ...q, ...updates } : q)
    }));
  };

  const removeQuestion = (id: string) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id)
    }));
  };

  return (
    <AdminPage
      title="Lições Semanais"
      description="Gerenciador visual de conteúdo para a EBD."
      Icon={BookOpen}
      variant="secondary"
      actions={
        <div className="flex gap-2">
          <Button onClick={() => setAiImportOpen(true)} variant="outline" className="bg-white/5 border-primary/20 text-primary hover:bg-white/10">
            <Sparkles className="w-4 h-4 mr-2" /> Importar com IA
          </Button>
          <Button onClick={openNew} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" /> Nova Lição
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-64 rounded-2xl bg-white/5" />)}
        </div>
      ) : lessons.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
          <div className="p-4 bg-primary/10 rounded-full mb-4">
            <BookOpen className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Nenhuma lição encontrada</h3>
          <p className="text-muted-foreground mb-6">Comece criando sua primeira lição semanal.</p>
          <Button onClick={openNew}>Criar Lição</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map(lesson => (
            <Card 
              key={lesson.id} 
              className="group relative cursor-pointer overflow-hidden border-white/10 bg-black/40 backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_30px_rgba(var(--primary),0.1)] hover:-translate-y-1 rounded-2xl"
              onClick={() => openEdit(lesson)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="bg-white/5 border-white/10 text-primary-foreground/70">
                    Lição {lesson.lesson_number} • {lesson.trimester}º TRI
                  </Badge>
                  {lesson.status === 'completo' ? (
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Completo
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1">
                      <AlertCircle className="w-3 h-3" /> Incompleto
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl leading-tight group-hover:text-primary transition-colors">{lesson.theme}</CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4 pb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <CalendarDays className="w-3 h-3" /> Versículos
                    </div>
                    <p className="text-lg font-bold">{Object.values(lesson.verses || {}).filter(v => v.texto).length}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <HelpCircle className="w-3 h-3" /> Perguntas
                    </div>
                    <p className="text-lg font-bold">{lesson.questions?.length || 0}</p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-0 flex justify-between">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white" onClick={(e) => deleteLesson(lesson.id, e)}>
                  <Trash2 className="w-4 h-4 mr-2" /> Apagar
                </Button>
                <div className="flex items-center text-sm font-medium text-primary">
                  Editar <ChevronRight className="w-4 h-4" />
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* MODAL DE EDIÇÃO */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl h-[90vh] p-0 overflow-hidden bg-slate-950 border-white/10 flex flex-col">
          <DialogHeader className="p-6 pb-2 border-b border-white/10">
            <div className="flex justify-between items-center">
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Pencil className="w-5 h-5 text-primary" /> {editingId ? "Editar Lição" : "Nova Lição"}
              </DialogTitle>
              <Button onClick={() => setAiImportOpen(true)} variant="outline" size="sm" className="border-primary/20 text-primary">
                <Sparkles className="w-4 h-4 mr-2" /> Alimentar com IA
              </Button>
            </div>
          </DialogHeader>
          
          <ScrollArea className="flex-1 px-6 py-4">
            <div className="space-y-8 pb-10">
              {/* Seção 1: Informações Gerais */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-primary/20 text-xs">1</span>
                  Informações Gerais
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <Label>Lição Nº</Label>
                    <Input type="number" value={form.lesson_number} onChange={e => setForm({...form, lesson_number: parseInt(e.target.value)})} className="bg-white/5" />
                  </div>
                  <div className="md:col-span-3 space-y-1.5">
                    <Label>Trimestre</Label>
                    <Select value={form.trimester} onValueChange={v => setForm({...form, trimester: v})}>
                      <SelectTrigger className="bg-white/5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4].map(t => <SelectItem key={t} value={t.toString()}>{t}º Trimestre</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-7 space-y-1.5">
                    <Label>Tema da Lição</Label>
                    <Input value={form.theme} onChange={e => setForm({...form, theme: e.target.value})} className="bg-white/5" placeholder="Ex: A Armadura de Deus" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Descrição (Opcional)</Label>
                  <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="bg-white/5 min-h-[80px]" placeholder="Breve resumo da semana..." />
                </div>
              </section>

              {/* Seção 2: Versículos */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-primary/20 text-xs">2</span>
                  Versículos da Semana
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.keys(form.verses).map((day) => (
                    <Card key={day} className="bg-white/5 border-white/5 p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <Label className="capitalize font-bold text-primary">{day}</Label>
                      </div>
                      <Input 
                        placeholder="Referência (Ex: João 3:16)" 
                        value={form.verses[day as keyof typeof DEFAULT_VERSES].referencia} 
                        onChange={e => setForm({
                          ...form, 
                          verses: {
                            ...form.verses, 
                            [day]: {...form.verses[day as keyof typeof DEFAULT_VERSES], referencia: e.target.value}
                          }
                        })} 
                        className="bg-black/20"
                      />
                      <Textarea 
                        placeholder="Texto do versículo..." 
                        value={form.verses[day as keyof typeof DEFAULT_VERSES].texto} 
                        onChange={e => setForm({
                          ...form, 
                          verses: {
                            ...form.verses, 
                            [day]: {...form.verses[day as keyof typeof DEFAULT_VERSES], texto: e.target.value}
                          }
                        })} 
                        className="bg-black/20 text-sm"
                      />
                      <Input 
                        placeholder="Observação (opcional)" 
                        value={form.verses[day as keyof typeof DEFAULT_VERSES].observacao || ""} 
                        onChange={e => setForm({
                          ...form, 
                          verses: {
                            ...form.verses, 
                            [day]: {...form.verses[day as keyof typeof DEFAULT_VERSES], observacao: e.target.value}
                          }
                        })} 
                        className="bg-black/20 text-xs border-transparent h-8"
                      />
                    </Card>
                  ))}
                </div>
              </section>

              {/* Seção 3: Perguntas */}
              <section className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-primary/20 text-xs">3</span>
                    Perguntas da Lição
                  </div>
                  <Button onClick={addQuestion} size="sm" variant="outline" className="h-8 border-primary/20 text-primary">
                    <Plus className="w-3 h-3 mr-1" /> Adicionar Pergunta
                  </Button>
                </div>

                <div className="space-y-4">
                  {form.questions.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-10 bg-white/5 rounded-2xl border border-dashed border-white/10">
                      Nenhuma pergunta adicionada ainda.
                    </p>
                  )}
                  {form.questions.map((q, idx) => (
                    <Card key={q.id} className="bg-white/5 border-white/5 p-4 relative">
                      <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-rose-500 hover:bg-rose-500/10 h-8 w-8" onClick={() => removeQuestion(q.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      
                      <div className="space-y-4">
                        <div className="flex gap-4">
                          <div className="flex-1 space-y-1.5">
                            <Label>Pergunta {idx + 1}</Label>
                            <Input value={q.pergunta} onChange={e => updateQuestion(q.id, { pergunta: e.target.value })} className="bg-black/20" />
                          </div>
                          <div className="w-48 space-y-1.5">
                            <Label>Tipo</Label>
                            <Select value={q.tipo} onValueChange={v => updateQuestion(q.id, { tipo: v as any })}>
                              <SelectTrigger className="bg-black/20"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="multipla_escolha">Múltipla Escolha</SelectItem>
                                <SelectItem value="discursiva">Discursiva</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {q.tipo === 'multipla_escolha' ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                            {['a', 'b', 'c', 'd'].map(opt => (
                              <div key={opt} className="flex items-center gap-2">
                                <Button 
                                  variant={q.respostaCorreta === opt ? "default" : "outline"} 
                                  size="icon" 
                                  className={cn("h-8 w-8 rounded-full flex-shrink-0 uppercase font-bold", q.respostaCorreta === opt && "bg-emerald-500 hover:bg-emerald-600")}
                                  onClick={() => updateQuestion(q.id, { respostaCorreta: opt })}
                                >
                                  {opt}
                                </Button>
                                <Input 
                                  placeholder={`Alternativa ${opt.toUpperCase()}`} 
                                  value={(q.alternativas as any)?.[opt] || ""} 
                                  onChange={e => updateQuestion(q.id, { 
                                    alternativas: { ...q.alternativas, [opt]: e.target.value } as any 
                                  })} 
                                  className="bg-black/20 h-9"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <Label>Resposta esperada (opcional)</Label>
                            <Textarea 
                              value={q.respostaCorreta} 
                              onChange={e => updateQuestion(q.id, { respostaCorreta: e.target.value })} 
                              className="bg-black/20 min-h-[60px] text-sm" 
                              placeholder="Dica ou resposta esperada para correção..."
                            />
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <Label>Comentário/Explicação (opcional)</Label>
                          <Input value={q.comentario} onChange={e => updateQuestion(q.id, { comentario: e.target.value })} className="bg-black/20 h-9 text-xs" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            </div>
          </ScrollArea>
          
          <DialogFooter className="p-6 border-t border-white/10 bg-black/40">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={save} disabled={saving} className="bg-primary hover:bg-primary/90 min-w-[120px]">
              {saving ? "Salvando..." : "Salvar Lição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL IA */}
      <Dialog open={aiImportOpen} onOpenChange={setAiImportOpen}>
        <DialogContent className="max-w-xl bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> Alimentar com IA
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Cole abaixo o texto da lição semanal, versículos ou temas. A IA irá processar e preencher automaticamente os campos.
            </p>
            <Textarea 
              placeholder="Ex: Lição 7 - O Fruto do Espírito. Segunda: Gl 5:22... Terça: ..." 
              value={aiText} 
              onChange={e => setAiText(e.target.value)} 
              className="min-h-[200px] bg-white/5 border-white/10"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAiImportOpen(false)}>Cancelar</Button>
            <Button onClick={handleAiImport} disabled={aiLoading} className="bg-primary hover:bg-primary/90">
              {aiLoading ? "Processando..." : "Gerar Lição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
