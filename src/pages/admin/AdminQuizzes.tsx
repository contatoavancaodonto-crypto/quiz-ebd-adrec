import { useEffect, useState } from "react";
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
import { Plus, ListChecks, Trash2, FileUp, Eraser } from "lucide-react";
import { BulkQuestionImportDialog } from "@/components/admin/BulkQuestionImportDialog";

interface Quiz {
  id: string; title: string; class_id: string; trimester: number; active: boolean; total_questions: number;
  week_number: number | null; opens_at: string | null; closes_at: string | null; season_id: string | null;
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
  const [loading, setLoading] = useState(true);

  const [quizDialog, setQuizDialog] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [qForm, setQForm] = useState({ title: "", class_id: "", trimester: 1 });

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

  const load = async () => {
    setLoading(true);
    const [qz, cl] = await Promise.all([
      supabase.from("quizzes").select("*").order("created_at", { ascending: false }),
      supabase.from("classes").select("id, name").order("name"),
    ]);
    setQuizzes((qz.data as any) ?? []);
    setClasses((cl.data as any) ?? []);
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
    if (editingQuiz) {
      const { error } = await supabase.from("quizzes").update(qForm).eq("id", editingQuiz.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("quizzes").insert(qForm);
      if (error) return toast.error(error.message);
    }
    toast.success("Salvo");
    setQuizDialog(false); setEditingQuiz(null); setQForm({ title: "", class_id: "", trimester: 1 }); load();
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

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Quizzes</h2>
          <p className="text-sm text-muted-foreground">Criar quizzes e gerenciar perguntas</p>
        </div>
        <Button onClick={() => { setEditingQuiz(null); setQForm({ title: "", class_id: "", trimester: 1 }); setQuizDialog(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Novo Quiz
        </Button>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead><TableHead>Turma</TableHead><TableHead>Trimestre</TableHead>
              <TableHead>Ativo</TableHead><TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Carregando…</TableCell></TableRow>
            ) : quizzes.map((q) => (
              <TableRow key={q.id}>
                <TableCell className="font-medium">{q.title}</TableCell>
                <TableCell>{classes.find((c) => c.id === q.class_id)?.name ?? "—"}</TableCell>
                <TableCell>{q.trimester}º</TableCell>
                <TableCell><Switch checked={q.active} onCheckedChange={() => toggleActive(q)} /></TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="sm" variant="outline" onClick={() => loadQuestions(q)}>
                    <ListChecks className="w-4 h-4 mr-1" /> Perguntas
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    setEditingQuiz(q);
                    setQForm({ title: q.title, class_id: q.class_id, trimester: q.trimester });
                    setQuizDialog(true);
                  }}>Editar</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={quizDialog} onOpenChange={setQuizDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingQuiz ? "Editar" : "Novo"} Quiz</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título</Label><Input value={qForm.title} onChange={(e) => setQForm({ ...qForm, title: e.target.value })} /></div>
            <div>
              <Label>Turma</Label>
              <Select value={qForm.class_id} onValueChange={(v) => setQForm({ ...qForm, class_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Trimestre</Label>
              <Input type="number" min={1} max={4} value={qForm.trimester} onChange={(e) => setQForm({ ...qForm, trimester: Number(e.target.value) })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuizDialog(false)}>Cancelar</Button>
            <Button onClick={saveQuiz}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
