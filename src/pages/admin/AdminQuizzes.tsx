import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, ListChecks, Trash2, FileUp, Eraser, Sparkles, BookOpen, Search, CheckSquare, Square } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminPage";
import { useRoles } from "@/hooks/useRoles";
import { BulkQuestionImportDialog } from "@/components/admin/BulkQuestionImportDialog";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { smartDelete } from "@/lib/admin-delete";

interface Quiz {
  id: string; title: string; class_id: string; trimester: number; active: boolean; total_questions: number;
  week_number: number | null; opens_at: string | null; closes_at: string | null; season_id: string | null;
  quiz_kind?: string | null;
  lesson_number?: number | null; lesson_title?: string | null;
  lesson_key_verse_ref?: string | null; lesson_key_verse_text?: string | null;
  weekly_bible_reading?: string | null;
  devotional_mon?: string | null;
  devotional_tue?: string | null;
  devotional_wed?: string | null;
  devotional_thu?: string | null;
  devotional_fri?: string | null;
  devotional_sat?: string | null;
}
interface Cls { id: string; name: string; }
interface Season { id: string; name: string; status: string; }
interface Question {
  id: string; quiz_id: string; question_text: string; option_a: string; option_b: string;
  option_c: string; option_d: string; correct_option: string; order_index: number; explanation: string | null;
}

export default function AdminQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [classes, setClasses] = useState<Cls[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const { isSuperadmin } = useRoles();
  const navigate = useNavigate();

  // Filtros
  const [classFilter, setClassFilter] = useState<string>("all");
  const [trimesterFilter, setTrimesterFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Seleção em lote
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [quizDialog, setQuizDialog] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [qForm, setQForm] = useState({
    title: "", class_id: "", trimester: 1,
    week_number: "" as string | number, opens_at: "", closes_at: "", season_id: "",
    quiz_kind: "weekly",
    total_questions: "" as string | number,
    lesson_number: "" as string | number,
    lesson_title: "",
    lesson_key_verse_ref: "",
    lesson_key_verse_text: "",
    weekly_bible_reading: "",
    devotional_mon: "",
    devotional_tue: "",
    devotional_wed: "",
    devotional_thu: "",
    devotional_fri: "",
    devotional_sat: "",
  });

  const [aiImportOpen, setAiImportOpen] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiClassId, setAiClassId] = useState("");
  const [aiTrimester, setAiTrimester] = useState(1);
  const [aiDate, setAiDate] = useState("");

  const [questionsOf, setQuestionsOf] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionDialog, setQuestionDialog] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [wipeOpen, setWipeOpen] = useState(false);
  const [editingQ, setEditingQ] = useState<Question | null>(null);
  const [qnForm, setQnForm] = useState({
    question_text: "", option_a: "", option_b: "", option_c: "", option_d: "",
    correct_option: "A", order_index: 1, explanation: "",
  });

  const emptyForm = {
    title: "", class_id: "", trimester: 1, week_number: "" as string | number,
    opens_at: "", closes_at: "", season_id: "",
    quiz_kind: "weekly",
    total_questions: "" as string | number,
    lesson_number: "" as string | number,
    lesson_title: "",
    lesson_key_verse_ref: "",
    lesson_key_verse_text: "",
    weekly_bible_reading: "",
    devotional_mon: "",
    devotional_tue: "",
    devotional_wed: "",
    devotional_thu: "",
    devotional_fri: "",
    devotional_sat: "",
  };

  const load = async () => {
    setLoading(true);
    const [qz, cl, ss] = await Promise.all([
      supabase.from("quizzes").select("*").order("week_number", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }),
      supabase.from("classes").select("id, name").order("name"),
      supabase.from("seasons").select("id, name, status").order("created_at", { ascending: false }),
    ]);
    setQuizzes((qz.data as Quiz[]) ?? []);
    setClasses((cl.data as Cls[]) ?? []);
    setSeasons((ss.data as Season[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const loadQuestions = async (quiz: Quiz) => {
    setQuestionsOf(quiz);
    const { data } = await supabase
      .from("questions")
      .select("*")
      .eq("quiz_id", quiz.id)
      .eq("active", true)
      .order("order_index");
    setQuestions((data as any) ?? []);
  };

  // Realtime: quando perguntas mudam, recarrega para o admin atual
  useEffect(() => {
    if (!questionsOf) return;
    const channel = supabase
      .channel(`admin-questions-${questionsOf.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "questions", filter: `quiz_id=eq.${questionsOf.id}` },
        () => { loadQuestions(questionsOf); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionsOf?.id]);

  const saveQuiz = async () => {
    if (!qForm.title || !qForm.class_id) return toast.error("Preencha título e turma");

    if (qForm.quiz_kind === "weekly") {
      const { devotional_mon, devotional_tue, devotional_wed, devotional_thu, devotional_fri, devotional_sat, weekly_bible_reading } = qForm;
      const devotionals = [devotional_mon, devotional_tue, devotional_wed, devotional_thu, devotional_fri, devotional_sat];
      const hasAllVerses = devotionals.every(v => v && v.trim().length > 0);
      const hasReading = weekly_bible_reading && weekly_bible_reading.trim().length > 0;
      
      if (!hasAllVerses || !hasReading) {
        return toast.error("O plano de leitura semanal deve ter 1 leitura bíblica e os 6 devocionais (Seg-Sáb) preenchidos.");
      }
    }

    const payload: any = {
      title: qForm.title,
      class_id: qForm.class_id,
      trimester: qForm.trimester,
      week_number: qForm.week_number === "" ? null : Number(qForm.week_number),
      opens_at: qForm.opens_at ? new Date(qForm.opens_at).toISOString() : null,
      closes_at: qForm.closes_at ? new Date(qForm.closes_at).toISOString() : null,
      season_id: qForm.season_id || null,
      quiz_kind: qForm.quiz_kind || "weekly",
      total_questions: qForm.total_questions === "" ? null : Number(qForm.total_questions),
      lesson_number: qForm.lesson_number === "" ? null : Number(qForm.lesson_number),
      lesson_title: qForm.lesson_title || null,
      lesson_key_verse_ref: qForm.lesson_key_verse_ref || null,
      lesson_key_verse_text: qForm.lesson_key_verse_text || null,
      weekly_bible_reading: qForm.weekly_bible_reading || null,
      devotional_mon: qForm.devotional_mon || null,
      devotional_tue: qForm.devotional_tue || null,
      devotional_wed: qForm.devotional_wed || null,
      devotional_thu: qForm.devotional_thu || null,
      devotional_fri: qForm.devotional_fri || null,
      devotional_sat: qForm.devotional_sat || null,
    };
    if (payload.opens_at && payload.closes_at && new Date(payload.opens_at) >= new Date(payload.closes_at)) {
      return toast.error("Data de abertura deve ser anterior à de fechamento");
    }
    if (editingQuiz) {
      const { error } = await supabase.from("quizzes").update(payload).eq("id", editingQuiz.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("quizzes").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("Salvo");
    setQuizDialog(false); setEditingQuiz(null); setQForm(emptyForm); load();
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Tem certeza que deseja apagar os ${selectedIds.size} itens selecionados?`)) return;

    setLoading(true);
    for (const id of Array.from(selectedIds)) {
      await smartDelete({ table: "quizzes", id });
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
    if (selectedIds.size === ids.length) {
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
        body: { mode: "parse_weekly_lesson", text: aiText },
      });

      if (error) throw error;
      
      let opens_at = null;
      let closes_at = null;
      if (aiDate) {
        const monday = new Date(aiDate + "T00:00:00");
        opens_at = monday.toISOString();
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        closes_at = sunday.toISOString();
      }

      const payload: any = {
        title: data.lesson_title ? `Lição ${data.lesson_number || ""}: ${data.lesson_title}` : "Nova Lição",
        class_id: aiClassId || null,
        trimester: aiTrimester || 1,
        opens_at,
        closes_at,
        lesson_title: data.lesson_title || null,
        lesson_number: data.lesson_number || null,
        weekly_bible_reading: data.weekly_bible_reading || null,
        devotional_mon: data.verses?.find((v: any) => v.day.toLowerCase().includes("segunda"))?.text || null,
        devotional_tue: data.verses?.find((v: any) => v.day.toLowerCase().includes("terca"))?.text || null,
        devotional_wed: data.verses?.find((v: any) => v.day.toLowerCase().includes("quarta"))?.text || null,
        devotional_thu: data.verses?.find((v: any) => v.day.toLowerCase().includes("quinta"))?.text || null,
        devotional_fri: data.verses?.find((v: any) => v.day.toLowerCase().includes("sexta"))?.text || null,
        devotional_sat: data.verses?.find((v: any) => v.day.toLowerCase().includes("sabado"))?.text || null,
        quiz_kind: "weekly",
        active: true,
        total_questions: data.questions?.length || 0
      };

      // Inserir o quiz
      const { data: insertedQuiz, error: insertError } = await supabase
        .from("quizzes")
        .insert(payload)
        .select()
        .single();

      if (insertError) throw insertError;

      // Inserir as questões se a IA as identificou no texto
      if (data.questions && data.questions.length > 0) {
        const questionsToInsert = data.questions.map((q: any, i: number) => ({
          quiz_id: insertedQuiz.id,
          question_text: q.pergunta || q.question_text,
          option_a: q.alternativas?.a || q.option_a,
          option_b: q.alternativas?.b || q.option_b,
          option_c: q.alternativas?.c || q.option_c,
          option_d: q.alternativas?.d || q.option_d,
          correct_option: (q.respostaCorreta || q.correct_option || "A").toUpperCase(),
          order_index: i + 1,
          active: true
        }));

        const { error: qError } = await supabase.from("questions").insert(questionsToInsert);
        if (qError) toast.error("Erro ao inserir questões identificadas.");
      }

      toast.success("Lição importada com sucesso!");
      setAiImportOpen(false);
      setAiText("");
      load();
    } catch (err: any) {
      toast.error("Falha ao processar com IA: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const toggleActive = async (q: Quiz) => {
    const { error } = await supabase.from("quizzes").update({ active: !q.active }).eq("id", q.id);
    if (error) return toast.error(error.message);
    toast.success(q.active ? "Desativado" : "Ativado"); load();
  };

  const saveQuestion = async () => {
    if (!questionsOf) return;
    if (!qnForm.question_text) return toast.error("Texto obrigatório");
    if (editingQ) {
      const { error } = await supabase.from("questions").update(qnForm).eq("id", editingQ.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("questions").insert({ ...qnForm, quiz_id: questionsOf.id });
      if (error) return toast.error(error.message);
    }
    toast.success("Salvo");
    setQuestionDialog(false); setEditingQ(null);
    setQnForm({ question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_option: "A", order_index: questions.length + 1, explanation: "" });
    loadQuestions(questionsOf);
  };

  // Soft-delete: preserva no banco para histórico/gabarito, mas oculta do painel e do quiz
  const deleteQuestion = async (id: string) => {
    if (!confirm("Ocultar esta pergunta? Ela some do painel e do quiz, mas continua salva para preservar histórico e gabarito.")) return;
    const { error } = await supabase.from("questions").update({ active: false }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Pergunta ocultada"); if (questionsOf) loadQuestions(questionsOf);
  };

  const wipeAll = async () => {
    if (!questionsOf) return;
    const { error } = await supabase
      .from("questions")
      .update({ active: false })
      .eq("quiz_id", questionsOf.id)
      .eq("active", true);
    if (error) return toast.error(error.message);
    toast.success("Todas as perguntas foram ocultadas");
    setWipeOpen(false);
    loadQuestions(questionsOf);
  };

  if (questionsOf) {
    return (
      <div className="space-y-4">
        <div className="flex items-end justify-between flex-wrap gap-2">
          <div>
            <Button variant="ghost" size="sm" onClick={() => setQuestionsOf(null)}>← Voltar</Button>
            <h2 className="text-2xl font-bold text-foreground mt-2">{questionsOf.title}</h2>
            <p className="text-sm text-muted-foreground">{questions.length} perguntas ativas</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setBulkOpen(true)}>
              <FileUp className="w-4 h-4 mr-1" /> Importar TXT
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setWipeOpen(true)}
              disabled={!questions.length}
            >
              <Eraser className="w-4 h-4 mr-1" /> Apagar tudo
            </Button>
            <Button onClick={() => {
              setEditingQ(null);
              setQnForm({ question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_option: "A", order_index: questions.length + 1, explanation: "" });
              setQuestionDialog(true);
            }}><Plus className="w-4 h-4 mr-1" /> Nova Pergunta</Button>
          </div>
        </div>
        <Card>
          <Table>
            <TableHeader>
              <TableRow><TableHead>#</TableHead><TableHead>Pergunta</TableHead><TableHead>Resp.</TableHead><TableHead className="text-right">Ações</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {questions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Nenhuma pergunta ativa. Adicione manualmente ou importe via TXT.
                  </TableCell>
                </TableRow>
              ) : questions.map((q) => (
                <TableRow key={q.id}>
                  <TableCell>{q.order_index}</TableCell>
                  <TableCell className="max-w-md truncate">{q.question_text}</TableCell>
                  <TableCell><Badge variant="outline">{q.correct_option}</Badge></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="outline" onClick={() => {
                      setEditingQ(q);
                      setQnForm({
                        question_text: q.question_text, option_a: q.option_a, option_b: q.option_b,
                        option_c: q.option_c, option_d: q.option_d, correct_option: q.correct_option,
                        order_index: q.order_index, explanation: q.explanation ?? "",
                      });
                      setQuestionDialog(true);
                    }}>Editar</Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteQuestion(q.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Dialog open={questionDialog} onOpenChange={setQuestionDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editingQ ? "Editar" : "Nova"} Pergunta</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Pergunta</Label>
                <Textarea value={qnForm.question_text} onChange={(e) => setQnForm({ ...qnForm, question_text: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(["A", "B", "C", "D"] as const).map((opt) => (
                  <div key={opt}>
                    <Label>Opção {opt}</Label>
                    <Input
                      value={(qnForm as any)[`option_${opt.toLowerCase()}`]}
                      onChange={(e) => setQnForm({ ...qnForm, [`option_${opt.toLowerCase()}`]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Resposta correta</Label>
                  <Select value={qnForm.correct_option} onValueChange={(v) => setQnForm({ ...qnForm, correct_option: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["A", "B", "C", "D"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Ordem</Label>
                  <Input type="number" value={qnForm.order_index} onChange={(e) => setQnForm({ ...qnForm, order_index: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <Label>Explicação (opcional)</Label>
                <Textarea value={qnForm.explanation} onChange={(e) => setQnForm({ ...qnForm, explanation: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setQuestionDialog(false)}>Cancelar</Button>
              <Button onClick={saveQuestion}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <BulkQuestionImportDialog
          open={bulkOpen}
          onOpenChange={setBulkOpen}
          quizId={questionsOf.id}
          startOrder={questions.length + 1}
          onImported={() => loadQuestions(questionsOf)}
        />

        <AlertDialog open={wipeOpen} onOpenChange={setWipeOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Apagar todas as perguntas?</AlertDialogTitle>
              <AlertDialogDescription>
                As {questions.length} perguntas ativas deste quiz serão ocultadas. Elas continuam salvas no banco para preservar
                o histórico e o gabarito dos alunos que já responderam, mas não aparecerão mais no painel nem em novos quizzes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={wipeAll}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Apagar tudo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  const fmtLocal = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const fmtDisplay = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  const isOpen = (q: Quiz) => {
    if (!q.opens_at || !q.closes_at) return null;
    const now = new Date();
    const o = new Date(q.opens_at);
    const c = new Date(q.closes_at);
    if (now < o) return "agendado";
    if (now > c) return "encerrado";
    return "aberto";
  };

  const filteredQuizzes = quizzes.filter((q) => {
    const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = classFilter === "all" || q.class_id === classFilter;
    const matchesTrimester = trimesterFilter === "all" || String(q.trimester) === trimesterFilter;
    return matchesSearch && matchesClass && matchesTrimester;
  });

  return (
    <AdminPage
      title="Quizzes e Planos"
      description="Gerencie lições, planos de leitura e quizzes."
      Icon={Sparkles}
      variant="primary"
      actions={
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              onClick={deleteSelected}
              className="shadow-sm"
            >
              <Trash2 className="w-4 h-4 mr-1" /> Apagar ({selectedIds.size})
            </Button>
          )}
          <Button
            onClick={() => {
              setAiClassId(classFilter === "all" ? "" : classFilter);
              setAiTrimester(trimesterFilter === "all" ? 1 : Number(trimesterFilter));
              setAiImportOpen(true);
            }}
            variant="outline"
            className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
          >
            <Sparkles className="w-4 h-4 mr-1" /> Importar com IA
          </Button>
          <Button
            onClick={() => { setEditingQuiz(null); setQForm(emptyForm); setQuizDialog(true); }}
            className="bg-white text-foreground hover:bg-white/90 shadow"
          >
            <Plus className="w-4 h-4 mr-1" /> Novo Quiz
          </Button>
        </div>
      }
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            className="pl-9" 
            placeholder="Buscar por título…" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
          />
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todas as turmas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as turmas</SelectItem>
            {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={trimesterFilter} onValueChange={setTrimesterFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Trimestre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos trim.</SelectItem>
            <SelectItem value="1">1º Trimestre</SelectItem>
            <SelectItem value="2">2º Trimestre</SelectItem>
            <SelectItem value="3">3º Trimestre</SelectItem>
            <SelectItem value="4">4º Trimestre</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <button 
                  onClick={() => toggleSelectAll(filteredQuizzes.map(q => q.id))}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {selectedIds.size > 0 && selectedIds.size === filteredQuizzes.length ? (
                    <CheckSquare className="w-4 h-4 text-primary" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Turma</TableHead>
              <TableHead>Tri.</TableHead>
              <TableHead>Sem.</TableHead>
              <TableHead>Janela</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">Carregando…</TableCell></TableRow>
            ) : filteredQuizzes.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-10">Nenhum quiz encontrado.</TableCell></TableRow>
            ) : filteredQuizzes.map((q) => {
              const status = isOpen(q);
              const isSelected = selectedIds.has(q.id);
              return (
                <TableRow key={q.id} className={isSelected ? "bg-primary/5" : ""}>
                  <TableCell>
                    <button 
                      onClick={() => toggleSelect(q.id)}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="font-medium">{q.title}</TableCell>
                  <TableCell>{classes.find((c) => c.id === q.class_id)?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">{q.trimester}º</Badge>
                  </TableCell>
                  <TableCell>{q.week_number ?? "—"}</TableCell>
                  <TableCell className="text-xs">
                    {q.opens_at || q.closes_at ? (
                      <div className="leading-tight">
                        <div>↑ {fmtDisplay(q.opens_at)}</div>
                        <div>↓ {fmtDisplay(q.closes_at)}</div>
                      </div>
                    ) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    {status === "aberto" && <Badge className="bg-green-500/15 text-green-600 border-green-500/30">Aberto</Badge>}
                    {status === "agendado" && <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30">Agendado</Badge>}
                    {status === "encerrado" && <Badge variant="outline" className="text-muted-foreground">Encerrado</Badge>}
                    {status === null && <Badge variant="outline">Sem janela</Badge>}
                  </TableCell>
                  <TableCell><Switch checked={q.active} onCheckedChange={() => toggleActive(q)} /></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="outline" onClick={() => loadQuestions(q)}>
                      <ListChecks className="w-4 h-4 mr-1" /> Perguntas
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => {
                      setEditingQuiz(q);
                      setQForm({
                        title: q.title, class_id: q.class_id, trimester: q.trimester,
                        week_number: q.week_number ?? "",
                        opens_at: fmtLocal(q.opens_at),
                        closes_at: fmtLocal(q.closes_at),
                        season_id: q.season_id ?? "",
                        quiz_kind: q.quiz_kind ?? "weekly",
                        total_questions: q.total_questions ?? "",
                        lesson_number: q.lesson_number ?? "",
                        lesson_title: q.lesson_title ?? "",
                        lesson_key_verse_ref: q.lesson_key_verse_ref ?? "",
                        lesson_key_verse_text: q.lesson_key_verse_text ?? "",
                        weekly_bible_reading: q.weekly_bible_reading ?? "",
                        devotional_mon: q.devotional_mon ?? "",
                        devotional_tue: q.devotional_tue ?? "",
                        devotional_wed: q.devotional_wed ?? "",
                        devotional_thu: q.devotional_thu ?? "",
                        devotional_fri: q.devotional_fri ?? "",
                        devotional_sat: q.devotional_sat ?? "",
                      });
                      setQuizDialog(true);
                    }}>Editar</Button>
                    <DeleteButton
                      iconOnly
                      itemLabel={`o quiz "${q.title}"`}
                      consequences={[
                        "Todas as perguntas deste quiz serão removidas",
                        "Tentativas e respostas dos alunos serão preservadas (quiz será apenas desativado se vinculado)",
                        "O ranking semanal pode ser recalculado",
                      ]}
                      onConfirm={async () => {
                        const r = await smartDelete({ table: "quizzes", id: q.id });
                        if (!r.ok) return r.error || "Falha ao apagar";
                        load();
                        return true;
                      }}
                      successMessage="Quiz removido"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={quizDialog} onOpenChange={setQuizDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingQuiz ? "Editar" : "Novo"} Quiz</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {/* Hierarquia: Trimestre > Turma > Semana */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-muted/30 rounded-lg border border-border">
              <div>
                <Label className="text-xs uppercase font-bold text-muted-foreground">Trimestre</Label>
                <Input 
                  type="number" min={1} max={4} 
                  value={qForm.trimester} 
                  onChange={(e) => setQForm({ ...qForm, trimester: Number(e.target.value) })} 
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs uppercase font-bold text-muted-foreground">Turma</Label>
                <Select value={qForm.class_id} onValueChange={(v) => setQForm({ ...qForm, class_id: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Turma" /></SelectTrigger>
                  <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs uppercase font-bold text-muted-foreground">Semana</Label>
                <Input 
                  type="number" min={1} 
                  value={qForm.week_number} 
                  onChange={(e) => setQForm({ ...qForm, week_number: e.target.value })} 
                  placeholder="Semana X"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div><Label>Título do Quiz</Label><Input value={qForm.title} onChange={(e) => setQForm({ ...qForm, title: e.target.value })} placeholder="Ex: Lição 3 — A fé de Abraão" /></div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo de Quiz</Label>
                  <Select value={qForm.quiz_kind} onValueChange={(v) => setQForm({ ...qForm, quiz_kind: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="trimestral">Trimestral (Provão)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Total de Perguntas</Label>
                  <Input 
                    type="number" 
                    value={qForm.total_questions} 
                    onChange={(e) => setQForm({ ...qForm, total_questions: e.target.value })} 
                    placeholder={qForm.quiz_kind === "trimestral" ? "26" : "13"}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Temporada</Label>
                <Select value={qForm.season_id} onValueChange={(v) => setQForm({ ...qForm, season_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione a temporada" /></SelectTrigger>
                  <SelectContent>
                    {seasons.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} {s.status === "active" ? "(ativa)" : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {qForm.quiz_kind === "weekly" && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> Plano de Leitura
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-[10px] uppercase font-bold bg-primary/10 hover:bg-primary/20 text-primary"
                    onClick={() => {
                      if (editingQuiz) setQuestionsOf(editingQuiz);
                      else toast.error("Salve o quiz primeiro para adicionar perguntas.");
                    }}
                  >
                    Subir Perguntas da Semana
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-semibold">1 Leitura Bíblica</Label>
                    <Input
                      value={qForm.weekly_bible_reading}
                      onChange={(e) => setQForm({ ...qForm, weekly_bible_reading: e.target.value })}
                      placeholder="Ex: João 1-3"
                      className="bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">6 Versículos (Leitura Diária)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground ml-1">Segunda</Label>
                        <Input
                          value={qForm.devotional_mon}
                          onChange={(e) => setQForm({ ...qForm, devotional_mon: e.target.value })}
                          placeholder="Ref. ou texto"
                          className="text-xs bg-background"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground ml-1">Terça</Label>
                        <Input
                          value={qForm.devotional_tue}
                          onChange={(e) => setQForm({ ...qForm, devotional_tue: e.target.value })}
                          placeholder="Ref. ou texto"
                          className="text-xs bg-background"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground ml-1">Quarta</Label>
                        <Input
                          value={qForm.devotional_wed}
                          onChange={(e) => setQForm({ ...qForm, devotional_wed: e.target.value })}
                          placeholder="Ref. ou texto"
                          className="text-xs bg-background"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground ml-1">Quinta</Label>
                        <Input
                          value={qForm.devotional_thu}
                          onChange={(e) => setQForm({ ...qForm, devotional_thu: e.target.value })}
                          placeholder="Ref. ou texto"
                          className="text-xs bg-background"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground ml-1">Sexta</Label>
                        <Input
                          value={qForm.devotional_fri}
                          onChange={(e) => setQForm({ ...qForm, devotional_fri: e.target.value })}
                          placeholder="Ref. ou texto"
                          className="text-xs bg-background"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground ml-1">Sábado</Label>
                        <Input
                          value={qForm.devotional_sat}
                          onChange={(e) => setQForm({ ...qForm, devotional_sat: e.target.value })}
                          placeholder="Ref. ou texto"
                          className="text-xs bg-background"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-primary/10 space-y-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Informações da Lição</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Nº da Lição</Label>
                      <Input
                        type="number" min={1} max={13}
                        value={qForm.lesson_number}
                        onChange={(e) => setQForm({ ...qForm, lesson_number: e.target.value })}
                        placeholder="1..13"
                        className="bg-background"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Ref. Versículo-chave</Label>
                      <Input
                        value={qForm.lesson_key_verse_ref}
                        onChange={(e) => setQForm({ ...qForm, lesson_key_verse_ref: e.target.value })}
                        placeholder="Ex: João 3:16"
                        className="bg-background"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Título da Lição</Label>
                    <Input
                      value={qForm.lesson_title}
                      onChange={(e) => setQForm({ ...qForm, lesson_title: e.target.value })}
                      placeholder="Ex: A fé que move montanhas"
                      className="bg-background"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
              <div>
                <Label>Janela Abre</Label>
                <Input type="datetime-local" value={qForm.opens_at} onChange={(e) => setQForm({ ...qForm, opens_at: e.target.value })} />
              </div>
              <div>
                <Label>Janela Fecha</Label>
                <Input type="datetime-local" value={qForm.closes_at} onChange={(e) => setQForm({ ...qForm, closes_at: e.target.value })} />
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground mt-2">
              Quizzes sem janela funcionam como antes (sem bloqueio). Defina <strong>nº semana</strong> + <strong>temporada</strong> + <strong>janela</strong> para ativar streak e ranking semanal.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setQuizDialog(false)}>Cancelar</Button>
            <Button onClick={saveQuiz}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={aiImportOpen} onOpenChange={setAiImportOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Importar Plano de Leitura com IA
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Classe destino</Label>
                <Select value={aiClassId} onValueChange={setAiClassId}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Trimestre</Label>
                <Select value={aiTrimester.toString()} onValueChange={(v) => setAiTrimester(Number(v))}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map(t => (
                      <SelectItem key={t} value={t.toString()}>{t}º Trimestre</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Segunda-feira Ref.</Label>
                <Input 
                  type="date" 
                  value={aiDate} 
                  onChange={(e) => setAiDate(e.target.value)} 
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Texto do plano / lição</Label>
              <Textarea 
                placeholder="Cole aqui... Ex: Lição 05 - O Fruto do Espírito. Leitura Semanal: Gl 5.22-26. Seg: Jo 15.1-8; Ter: Ef 4.1-3..." 
                className="min-h-[150px]"
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">
                Dica: A IA identificará automaticamente leitura bíblica, versículos diários, versículo-chave e título.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiImportOpen(false)}>Cancelar</Button>
            <Button onClick={handleAiImport} disabled={aiLoading || !aiText.trim()}>
              {aiLoading ? (
                <>Processando...</>
              ) : (
                <>Identificar e Configurar</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
