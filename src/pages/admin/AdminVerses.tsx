import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Sparkles, BookOpen, Trash2, CalendarDays, HelpCircle, CheckCircle2, AlertCircle, Pencil, ChevronRight, Users, Filter, Clock, Archive, FileQuestion, XCircle } from "lucide-react";
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
  reading_theme?: string
  scheduled_date?: string
  scheduled_end_date?: string
  description?: string
  verses: {
    segunda: { referencia: string; texto: string; observacao?: string }
    terca: { referencia: string; texto: string; observacao?: string }
    quarta: { referencia: string; texto: string; observacao?: string }
    quinta: { referencia: string; texto: string; observacao?: string }
    sexta: { referencia: string; texto: string; observacao?: string }
    sabado: { referencia: string; texto: string; observacao?: string }
  }
  questions: Pergunta[]
  status: 'completo' | 'incompleto' | 'AGENDADO' | 'ARQUIVADO' | 'COMPLETO SEM AGENDAMENTO' | 'INCOMPLETO'
  class_id?: string
}

const DEFAULT_VERSES = {
  segunda: { referencia: "", texto: "" },
  terca: { referencia: "", texto: "" },
  quarta: { referencia: "", texto: "" },
  quinta: { referencia: "", texto: "" },
  sexta: { referencia: "", texto: "" },
  sabado: { referencia: "", texto: "" }
};

export default function AdminVerses() {
  const [lessons, setLessons] = useState<LicaoSemanal[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiImportOpen, setAiImportOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<string | null>(null);
  const [aiPreviewOpen, setAiPreviewOpen] = useState(false);
  const [aiPreviewData, setAiPreviewData] = useState<any>(null);

  // Filtros
  const [filterClass, setFilterClass] = useState<string>("all");
  const [filterTrimester, setFilterTrimester] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [form, setForm] = useState<Omit<LicaoSemanal, 'id'>>({
    trimester: "1",
    lesson_number: 1,
    theme: "",
    reading_theme: "",
    scheduled_date: "",
    scheduled_end_date: "",
    description: "",
    verses: { ...DEFAULT_VERSES },
    questions: [],
    status: 'INCOMPLETO',
    class_id: undefined,
  });

  const load = async () => {
    setLoading(true);
    const [lessonsRes, classesRes] = await Promise.all([
      supabase.from("lessons").select("*").order("lesson_number"),
      supabase.from("classes").select("id, name").eq("active", true).order("name"),
    ]);
    if (lessonsRes.error) toast.error(lessonsRes.error.message);
    else setLessons((lessonsRes.data as any) ?? []);
    if (classesRes.data) setClasses(classesRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditingId(null);
    setForm({
      trimester: "1",
      lesson_number: (lessons[lessons.length - 1]?.lesson_number || 0) + 1,
      theme: "",
      reading_theme: "",
      scheduled_date: "",
      scheduled_end_date: "",
      description: "",
      verses: { ...DEFAULT_VERSES },
      questions: [],
      status: 'INCOMPLETO',
      class_id: undefined,
    });
    setOpen(true);
  };

  const openEdit = (l: LicaoSemanal) => {
    setEditingId(l.id);
    setForm({
      trimester: l.trimester,
      lesson_number: l.lesson_number,
      theme: l.theme,
      reading_theme: l.reading_theme || "",
      scheduled_date: l.scheduled_date || "",
      scheduled_end_date: l.scheduled_end_date || "",
      description: l.description || "",
      verses: { ...DEFAULT_VERSES, ...l.verses },
      questions: l.questions || [],
      status: l.status,
      class_id: l.class_id,
    });
    setOpen(true);
  };

  const calculateStatus = (formData: Omit<LicaoSemanal, 'id'>): LicaoSemanal['status'] => {
    const allDays = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
    const hasDailyVerses = allDays.every(day => {
      const v = formData.verses[day as keyof typeof DEFAULT_VERSES];
      return v && v.referencia?.trim() && v.texto?.trim();
    });
    const hasQuestions = formData.questions && formData.questions.length > 0;
    const isThemeValid = !!formData.theme?.trim();
    const isComplete = isThemeValid && hasDailyVerses && hasQuestions;

    if (!isComplete) return 'INCOMPLETO';
    
    if (!formData.scheduled_date) return 'COMPLETO SEM AGENDAMENTO';

    // Se tiver data, verificar se está arquivado
    if (formData.scheduled_end_date) {
      const endDate = new Date(formData.scheduled_end_date);
      if (endDate < new Date()) return 'ARQUIVADO';
    }

    return 'AGENDADO';
  };

  const save = async () => {
    if (!form.theme || !form.lesson_number || !form.trimester) {
      return toast.error("Preencha número, trimestre e tema.");
    }

    setSaving(true);
    
    const status = calculateStatus(form);

    // Reinforce rule: starts at 00:00 and ends at 23:59
    let finalStartDate = form.scheduled_date;
    if (finalStartDate && finalStartDate.length === 10) {
      finalStartDate = `${finalStartDate}T00:00:00.000Z`;
    }

    let finalEndDate = form.scheduled_end_date;
    if (finalStartDate) {
      if (!finalEndDate) {
        const date = new Date(finalStartDate);
        const day = date.getDay();
        const diff = (7 - day) % 7;
        const nextSunday = new Date(date);
        nextSunday.setDate(date.getDate() + diff);
        nextSunday.setHours(23, 59, 59, 999);
        finalEndDate = nextSunday.toISOString();
      } else if (finalEndDate.length === 10) {
        finalEndDate = `${finalEndDate}T23:59:59.999Z`;
      }
    }

    const payload = { 
      trimester: form.trimester,
      lesson_number: form.lesson_number,
      theme: form.theme,
      reading_theme: form.reading_theme,
      scheduled_date: form.scheduled_date || null,
      scheduled_end_date: finalEndDate || null,
      description: form.description,
      verses: form.verses,
      questions: form.questions,
      status,
      class_id: form.class_id || null
    };
    console.log("Saving lesson payload:", payload);

    try {
      if (editingId) {
        const { error, data } = await supabase
          .from("lessons")
          .update(payload as any)
          .eq("id", editingId)
          .select();
        
        if (error) {
          console.error("Supabase update error:", error);
          throw new Error(`Erro ao atualizar: ${error.message} (${error.code})`);
        }
        
        if (data && data[0]) {
          setLessons(prev => prev.map(l => l.id === editingId ? (data[0] as unknown as LicaoSemanal) : l));
        }
      } else {
        const { error, data } = await supabase
          .from("lessons")
          .insert([payload as any])
          .select();
          
        if (error) {
          console.error("Supabase insert error:", error);
          throw new Error(`Erro ao inserir: ${error.message} (${error.code})`);
        }
        
        if (data && data[0]) {
          setLessons(prev => [data[0] as unknown as LicaoSemanal, ...prev]);
        }
      }
      toast.success("Lição salva com sucesso!");
      setOpen(false);
      setEditingId(null);
    } catch (err: any) {
      console.error("Error saving lesson:", err);
      toast.error(err.message || "Erro inesperado ao salvar lição");
    } finally {
      setSaving(false);
    }
  };

  const deleteLesson = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLessonToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!lessonToDelete) return;
    
    try {
      const { error } = await supabase.from("lessons").delete().eq("id", lessonToDelete);
      if (error) throw error;
      toast.success("Lição removida com sucesso");
      await load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleteConfirmOpen(false);
      setLessonToDelete(null);
    }
  };

  const handleAiImport = async () => {
    if (!aiText.trim()) return toast.error("Insira o texto para processar.");
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("community-ai", {
        body: { 
          mode: "parse_weekly_lesson", 
          text: aiText,
          available_classes: classes.map(c => ({ id: c.id, name: c.name }))
        },
      });
      if (error) throw error;
      setAiPreviewData(data);
      setAiImportOpen(false);
      setAiPreviewOpen(true);
    } catch (err: any) {
      toast.error("Erro na IA: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const buildFormFromAi = (data: any): Omit<LicaoSemanal, 'id'> => {
    const sanitizedQuestions = (data.questions || []).map((q: any) => ({
      id: q.id || Math.random().toString(36).substr(2, 9),
      pergunta: q.pergunta || "",
      tipo: q.tipo === 'discursiva' ? 'discursiva' : 'multipla_escolha',
      alternativas: q.alternativas || { a: "", b: "", c: "", d: "" },
      respostaCorreta: q.respostaCorreta || "a",
      comentario: q.comentario || ""
    }));

    const sanitizedVerses = {
      segunda: { referencia: data.verses?.segunda?.referencia || "", texto: data.verses?.segunda?.texto || "", observacao: data.verses?.segunda?.observacao || "" },
      terca: { referencia: data.verses?.terca?.referencia || "", texto: data.verses?.terca?.texto || "", observacao: data.verses?.terca?.observacao || "" },
      quarta: { referencia: data.verses?.quarta?.referencia || "", texto: data.verses?.quarta?.texto || "", observacao: data.verses?.quarta?.observacao || "" },
      quinta: { referencia: data.verses?.quinta?.referencia || "", texto: data.verses?.quinta?.texto || "", observacao: data.verses?.quinta?.observacao || "" },
      sexta: { referencia: data.verses?.sexta?.referencia || "", texto: data.verses?.sexta?.texto || "", observacao: data.verses?.sexta?.observacao || "" },
      sabado: { referencia: data.verses?.sabado?.referencia || "", texto: data.verses?.sabado?.texto || "", observacao: data.verses?.sabado?.observacao || "" }
    };

    return {
      trimester: data.trimester ? String(data.trimester) : "1",
      lesson_number: Number(data.lesson_number) || 1,
      theme: data.theme || "",
      reading_theme: data.reading_theme || "",
      scheduled_date: data.scheduled_date || "",
      scheduled_end_date: data.scheduled_end_date || "",
      description: data.description || "",
      verses: sanitizedVerses,
      questions: sanitizedQuestions,
      status: 'incompleto',
      class_id: data.class_id || form.class_id,
    };
  };

  const applyAiPreview = () => {
    const data = aiPreviewData;
    if (!data) return;

    const newForm = buildFormFromAi(data);
    setEditingId(null);
    setForm(newForm);

    setAiPreviewOpen(false);
    setAiPreviewData(null);
    setAiText("");
    if (!open) setOpen(true);
    toast.success("Dados aplicados ao editor. Revise e clique em Salvar Lição.");
  };

  const applyAndSaveAi = async () => {
    const data = aiPreviewData;
    if (!data) return;
    const newForm = buildFormFromAi(data);
    if (!newForm.theme || !newForm.lesson_number || !newForm.trimester) {
      return toast.error("A IA não preencheu número, trimestre ou tema. Use 'Aplicar e revisar'.");
    }

    setSaving(true);
    try {
      const status = calculateStatus(newForm);

      // Ensure end date is Sunday 23:59 if not provided or if it's just a date
      let finalEndDate = newForm.scheduled_end_date;
      if (newForm.scheduled_date) {
        if (!finalEndDate) {
          const date = new Date(newForm.scheduled_date + "T12:00:00");
          const day = date.getDay();
          const diff = (7 - day) % 7;
          const nextSunday = new Date(date);
          nextSunday.setDate(date.getDate() + diff);
          nextSunday.setHours(23, 59, 59, 999);
          finalEndDate = nextSunday.toISOString();
        } else if (finalEndDate.length <= 10) {
          // If it's just YYYY-MM-DD, add the time
          finalEndDate = `${finalEndDate}T23:59:59.999Z`;
        }
      }

      const payload = {
        trimester: newForm.trimester,
        lesson_number: newForm.lesson_number,
        theme: newForm.theme,
        reading_theme: newForm.reading_theme,
        scheduled_date: newForm.scheduled_date || null,
        scheduled_end_date: finalEndDate || null,
        description: newForm.description,
        verses: newForm.verses,
        questions: newForm.questions,
        status,
        class_id: newForm.class_id || null,
      };
      console.log("[IA] Saving lesson payload:", payload);

      const { error, data: inserted } = await supabase
        .from("lessons")
        .insert([payload as any])
        .select();

      if (error) {
        console.error("[IA] Supabase insert error:", error);
        throw new Error(`Erro ao salvar (${error.code}): ${error.message}${error.details ? ' — ' + error.details : ''}`);
      }

      if (inserted && inserted[0]) {
        const saved = inserted[0] as unknown as LicaoSemanal;
        setLessons(prev => [saved, ...prev]);
        // Fechar tudo após salvamento bem-sucedido
        setEditingId(null);
      }

      setAiPreviewOpen(false);
      setAiPreviewData(null);
      setAiText("");
      setOpen(false);
      setEditingId(null);
      toast.success("Lição salva com sucesso!");
    } catch (err: any) {
      console.error("[IA] Error saving lesson:", err);
      toast.error(err.message || "Erro inesperado ao salvar lição");
    } finally {
      setSaving(false);
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

  const filteredLessons = lessons.filter(lesson => {
    const matchClass = filterClass === "all" || lesson.class_id === filterClass || (filterClass === "global" && !lesson.class_id);
    const matchTrimester = filterTrimester === "all" || lesson.trimester === filterTrimester;
    const matchStatus = filterStatus === "all" || lesson.status === filterStatus;
    return matchClass && matchTrimester && matchStatus;
  });

  const getStatusBadge = (status: LicaoSemanal['status']) => {
    switch (status) {
      case 'AGENDADO':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1"><Clock className="w-3 h-3" /> Agendado</Badge>;
      case 'ARQUIVADO':
        return <Badge variant="secondary" className="bg-slate-500/10 text-slate-500 border-slate-500/20 gap-1"><Archive className="w-3 h-3" /> Arquivado</Badge>;
      case 'COMPLETO SEM AGENDAMENTO':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 gap-1"><FileQuestion className="w-3 h-3" /> Completo s/ Agend.</Badge>;
      case 'INCOMPLETO':
      default:
        return <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1"><XCircle className="w-3 h-3" /> Incompleto</Badge>;
    }
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
      <div className="mb-8 p-4 bg-black/20 rounded-2xl border border-white/5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
          <Filter className="w-4 h-4" /> Filtros de Visualização
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Turma</Label>
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Turmas</SelectItem>
                <SelectItem value="global">Global (Sem turma)</SelectItem>
                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Trimestre</Label>
            <Select value={filterTrimester} onValueChange={setFilterTrimester}>
              <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Trimestres</SelectItem>
                {[1, 2, 3, 4].map(t => <SelectItem key={t} value={t.toString()}>{t}º Trimestre</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="AGENDADO">Agendado</SelectItem>
                <SelectItem value="ARQUIVADO">Arquivado</SelectItem>
                <SelectItem value="COMPLETO SEM AGENDAMENTO">Completo s/ Agend.</SelectItem>
                <SelectItem value="INCOMPLETO">Incompleto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-64 rounded-2xl bg-white/5" />)}
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
          <div className="p-4 bg-primary/10 rounded-full mb-4">
            <BookOpen className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Nenhuma lição encontrada</h3>
          <p className="text-muted-foreground mb-6">Tente ajustar seus filtros ou crie uma nova lição.</p>
          <Button onClick={openNew}>Criar Lição</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.map(lesson => (
            <Card 
              key={lesson.id} 
              className="group relative cursor-pointer overflow-hidden border-white/10 bg-black/40 backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_30px_rgba(var(--primary),0.1)] hover:-translate-y-1 rounded-2xl"
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('[data-card-action="true"]')) return;
                openEdit(lesson);
              }}
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              
              <CardHeader className="relative z-10 pb-3">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-white/5 border-white/10 text-white">
                      Lição {lesson.lesson_number} • {lesson.trimester}º TRI
                    </Badge>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {lesson.class_id 
                        ? (classes.find(c => c.id === lesson.class_id)?.name || "Turma") 
                        : "Todas as Turmas"}
                    </Badge>
                  </div>
                  {getStatusBadge(lesson.status)}
                </div>
                <CardTitle className="text-xl leading-tight group-hover:text-primary transition-colors">{lesson.theme}</CardTitle>
              </CardHeader>
              
              <CardContent className="relative z-10 space-y-4 pb-4">
                {lesson.reading_theme && (
                  <div className="flex items-center gap-2 text-xs text-primary font-medium bg-primary/10 w-fit px-2 py-1 rounded-md mb-2">
                    <BookOpen className="w-3 h-3" /> {lesson.reading_theme}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <CalendarDays className="w-3 h-3" /> Agendamento
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-muted-foreground">
                        Início: <span className="text-white font-bold">{lesson.scheduled_date ? new Date(lesson.scheduled_date + "T00:00:00").toLocaleDateString('pt-BR') : 'N/D'}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Fim: <span className="text-white font-bold">{lesson.scheduled_end_date ? new Date(lesson.scheduled_end_date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Dom 23:59'}</span>
                      </p>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <HelpCircle className="w-3 h-3" /> Perguntas
                    </div>
                    <p className="text-sm font-bold">{lesson.questions?.length || 0}</p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="relative z-10 pt-0 flex justify-between" data-card-action="true" onClick={(e) => e.stopPropagation()}>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-white"
                  data-card-action="true"
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    deleteLesson(lesson.id, e);
                  }}
                >
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
                    <Input type="number" value={form.lesson_number} onChange={e => setForm({...form, lesson_number: parseInt(e.target.value) || 0})} className="bg-white/5" />
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>Tema da Leitura</Label>
                    <Input value={form.reading_theme} onChange={e => setForm({...form, reading_theme: e.target.value})} className="bg-white/5" placeholder="Ex: Fé e Obras" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Data de Início</Label>
                    <Input type="date" value={form.scheduled_date} onChange={e => setForm({...form, scheduled_date: e.target.value})} className="bg-white/5" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Data Final (Opcional)</Label>
                    <Input 
                      type="datetime-local" 
                      value={form.scheduled_end_date ? new Date(new Date(form.scheduled_end_date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""} 
                      onChange={e => setForm({...form, scheduled_end_date: e.target.value ? new Date(e.target.value).toISOString() : ""})} 
                      className="bg-white/5" 
                    />
                    <p className="text-[10px] text-muted-foreground italic">Padrão: Domingo às 23:59</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Turma (Classe)</Label>
                  <Select
                    value={form.class_id ?? "all"}
                    onValueChange={(v) => setForm({ ...form, class_id: v === "all" ? undefined : v })}
                  >
                    <SelectTrigger className="bg-white/5"><SelectValue placeholder="Selecione a turma" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as turmas</SelectItem>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  {Object.keys(form.verses).filter((day) => day !== "domingo").map((day) => (
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
                          <Input value={q.comentario || ""} onChange={e => updateQuestion(q.id, { comentario: e.target.value })} className="bg-black/20 h-9 text-xs" />
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
              Cole abaixo o texto da lição semanal e os versículos. A IA irá preencher o tema, versículos e perguntas (se houver no texto) automaticamente.
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

      {/* MODAL DE PRÉVIA DA IA */}
      <Dialog open={aiPreviewOpen} onOpenChange={setAiPreviewOpen}>
        <DialogContent className="max-w-3xl h-[85vh] p-0 overflow-hidden bg-slate-950 border-white/10 flex flex-col">
          <DialogHeader className="p-6 pb-3 border-b border-white/10">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="w-5 h-5 text-primary" /> Prévia da Extração da IA
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Confira o que a IA extraiu antes de preencher o formulário. Você pode aplicar ou descartar.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6 py-4">
            {aiPreviewData && (
              <div className="space-y-6 pb-6">
                {/* Informações Gerais */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-primary/20 text-xs">1</span>
                    Informações Gerais
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Trimestre</Label>
                      <Input
                        value={aiPreviewData.trimester || ""}
                        onChange={e => setAiPreviewData({ ...aiPreviewData, trimester: e.target.value })}
                        className="h-9 bg-white/5"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Lição Nº</Label>
                      <Input
                        type="number"
                        value={aiPreviewData.lesson_number || ""}
                        onChange={e => setAiPreviewData({ ...aiPreviewData, lesson_number: parseInt(e.target.value) || 0 })}
                        className="h-9 bg-white/5"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Data Início</Label>
                      <Input
                        type="date"
                        value={aiPreviewData.scheduled_date || ""}
                        onChange={e => setAiPreviewData({ ...aiPreviewData, scheduled_date: e.target.value })}
                        className="h-9 bg-white/5"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Data Fim</Label>
                      <Input
                        type="date"
                        value={aiPreviewData.scheduled_end_date?.split('T')[0] || ""}
                        onChange={e => setAiPreviewData({ ...aiPreviewData, scheduled_end_date: e.target.value })}
                        className="h-9 bg-white/5"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-3 mt-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Turma Identificada</Label>
                      <Select 
                        value={aiPreviewData.class_id || "global"} 
                        onValueChange={(val) => setAiPreviewData({ ...aiPreviewData, class_id: val === "global" ? null : val })}
                      >
                        <SelectTrigger className="h-9 bg-white/5">
                          <SelectValue placeholder="Selecione a turma ou deixe Global" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10 text-white">
                          <SelectItem value="global">Global (Todas as turmas)</SelectItem>
                          {classes.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Tema da Lição</Label>
                    <Input
                      value={aiPreviewData.theme || ""}
                      onChange={e => setAiPreviewData({ ...aiPreviewData, theme: e.target.value })}
                      className="h-9 bg-white/5"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Tema da Leitura</Label>
                      <Input
                        value={aiPreviewData.reading_theme || ""}
                        onChange={e => setAiPreviewData({ ...aiPreviewData, reading_theme: e.target.value })}
                        className="h-9 bg-white/5"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Descrição Curta</Label>
                      <Input
                        value={aiPreviewData.description || ""}
                        onChange={e => setAiPreviewData({ ...aiPreviewData, description: e.target.value })}
                        className="h-9 bg-white/5"
                      />
                    </div>
                  </div>
                </section>

                {/* Versículos */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-primary/20 text-xs">2</span>
                    Versículos da Semana
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(["segunda", "terca", "quarta", "quinta", "sexta", "sabado"] as const).map(day => {
                      const v = aiPreviewData.verses?.[day] || { referencia: "", texto: "" };
                      const labels: Record<string, string> = { segunda: "Segunda", terca: "Terça", quarta: "Quarta", quinta: "Quinta", sexta: "Sexta", sabado: "Sábado" };
                      return (
                        <div key={day} className="p-3 rounded-xl border bg-white/5 border-white/10 space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="bg-white/5 border-white/10 text-[10px]">{labels[day]}</Badge>
                            <Input
                              placeholder="Referência"
                              value={v.referencia}
                              onChange={e => {
                                const newVerses = { ...aiPreviewData.verses, [day]: { ...v, referencia: e.target.value } };
                                setAiPreviewData({ ...aiPreviewData, verses: newVerses });
                              }}
                              className="h-7 w-32 bg-transparent border-none text-right text-xs font-bold text-primary focus-visible:ring-0 px-0"
                            />
                          </div>
                          <Textarea
                            placeholder="Texto do versículo..."
                            value={v.texto}
                            onChange={e => {
                              const newVerses = { ...aiPreviewData.verses, [day]: { ...v, texto: e.target.value } };
                              setAiPreviewData({ ...aiPreviewData, verses: newVerses });
                            }}
                            className="min-h-[60px] bg-white/5 border-white/5 text-xs leading-snug resize-none"
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Perguntas */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-2 text-primary font-semibold text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-primary/20 text-xs">3</span>
                      Perguntas Extraídas
                      <Badge variant="outline" className="bg-white/5 border-white/10 text-xs ml-1">
                        {aiPreviewData.questions?.length || 0}
                      </Badge>
                    </div>
                  </div>
                  
                  {(!aiPreviewData.questions || aiPreviewData.questions.length === 0) ? (
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-dashed border-white/10 text-sm text-muted-foreground italic text-center">
                      Nenhuma pergunta foi encontrada.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {aiPreviewData.questions.map((q: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                          <div className="flex gap-2">
                            <Badge className="bg-primary/20 text-primary border-primary/20 h-6 shrink-0">{idx + 1}</Badge>
                            <Textarea
                              value={q.pergunta}
                              onChange={e => {
                                const newQuestions = [...aiPreviewData.questions];
                                newQuestions[idx] = { ...q, pergunta: e.target.value };
                                setAiPreviewData({ ...aiPreviewData, questions: newQuestions });
                              }}
                              className="min-h-[40px] bg-transparent border-none p-0 text-sm font-medium focus-visible:ring-0 resize-none"
                            />
                          </div>
                          
                          {q.alternativas && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2">
                              {(["a", "b", "c", "d"] as const).map(letter => (
                                <div
                                  key={letter}
                                  className={cn(
                                    "relative p-2 rounded-lg border group",
                                    q.respostaCorreta === letter
                                      ? "bg-emerald-500/10 border-emerald-500/30"
                                      : "bg-white/5 border-white/10"
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newQuestions = [...aiPreviewData.questions];
                                        newQuestions[idx] = { ...q, respostaCorreta: letter };
                                        setAiPreviewData({ ...aiPreviewData, questions: newQuestions });
                                      }}
                                      className={cn(
                                        "w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold uppercase transition-colors",
                                        q.respostaCorreta === letter
                                          ? "bg-emerald-500 border-emerald-500 text-white"
                                          : "border-white/20 text-white/40 hover:border-white/40"
                                      )}
                                    >
                                      {letter}
                                    </button>
                                    <Input
                                      value={q.alternativas[letter] || ""}
                                      onChange={e => {
                                        const newQuestions = [...aiPreviewData.questions];
                                        newQuestions[idx] = {
                                          ...q,
                                          alternativas: { ...q.alternativas, [letter]: e.target.value }
                                        };
                                        setAiPreviewData({ ...aiPreviewData, questions: newQuestions });
                                      }}
                                      className="h-7 bg-transparent border-none p-0 text-xs focus-visible:ring-0"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="pl-2 flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground italic shrink-0">Comentário:</span>
                            <Input
                              value={q.comentario || ""}
                              onChange={e => {
                                const newQuestions = [...aiPreviewData.questions];
                                newQuestions[idx] = { ...q, comentario: e.target.value };
                                setAiPreviewData({ ...aiPreviewData, questions: newQuestions });
                              }}
                              className="h-6 bg-transparent border-none p-0 text-[10px] text-muted-foreground focus-visible:ring-0 italic"
                              placeholder="Opcional..."
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </ScrollArea>

          <DialogFooter className="p-6 border-t border-white/10 bg-black/40">
            <Button
              variant="ghost"
              onClick={() => {
                setAiPreviewOpen(false);
                setAiPreviewData(null);
                setAiImportOpen(true);
              }}
            >
              Voltar e editar texto
            </Button>
            <Button onClick={applyAiPreview} variant="outline" className="border-primary/30 text-primary min-w-[180px]">
              <Pencil className="w-4 h-4 mr-2" /> Aplicar e revisar
            </Button>
            <Button onClick={applyAndSaveAi} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[180px]">
              <CheckCircle2 className="w-4 h-4 mr-2" /> {saving ? "Salvando..." : "Salvar lição agora"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-slate-950 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-display font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" /> Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Tem certeza que deseja apagar esta lição? Esta ação é irreversível e removerá permanentemente o conteúdo, versículos e perguntas associadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white border-none shadow-lg shadow-rose-900/20"
            >
              Apagar permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPage>
  );
}
