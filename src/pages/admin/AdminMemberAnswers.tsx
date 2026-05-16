import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Search, ChevronDown, ChevronRight, CheckCircle2, XCircle, Clock, Trophy, MessageSquare } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminPage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRoles } from "@/hooks/useRoles";
import { useClassSwitcher } from "@/hooks/useClassSwitcher";

type Period = "all" | "week" | "month" | "trimester" | "t1" | "t2" | "t3" | "t4";

interface AttemptRow {
  id: string;
  score: number;
  total_questions: number;
  total_time_seconds: number;
  finished_at: string | null;
  quiz_id: string;
  participant_id: string;
  participants: { name: string; class_id: string | null } | null;
  quizzes: { title: string; lesson_number: number | null; week_number: number | null } | null;
}

interface QuestionRow {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  order_index: number;
  explanation: string | null;
}

interface AnswerRow {
  question_id: string;
  selected_option: string;
  is_correct: boolean;
  answered_at: string;
}

const norm = (s: string | null | undefined) =>
  (s ?? "").toLowerCase().trim().replace(/\s+/g, " ");

const optionLetters: Array<"a" | "b" | "c" | "d"> = ["a", "b", "c", "d"];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export default function AdminMemberAnswers() {
  const { isSuperadmin, churchId, loading: rolesLoading } = useRoles();
  const { selectedClassId } = useClassSwitcher();
  const [rows, setRows] = useState<AttemptRow[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [quizFilter, setQuizFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<Period>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [details, setDetails] = useState<
    Record<string, { questions: QuestionRow[]; answers: AnswerRow[]; loading: boolean }>
  >({});

  const load = async () => {
    setLoading(true);
    
    let query = supabase
      .from("quiz_attempts")
      .select(
        `
        id, 
        score, 
        total_questions, 
        total_time_seconds, 
        finished_at, 
        quiz_id, 
        participant_id, 
        participants!inner(
          name, 
          class_id,
          profiles!inner(
            church_id
          )
        ), 
        quizzes(title, lesson_number, week_number)
        `
      )
      .not("finished_at", "is", null)
      .order("finished_at", { ascending: false })
      .limit(500);

    if (!isSuperadmin && churchId) {
      query = query.eq("participants.profiles.church_id", churchId);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error("Erro ao carregar respostas:", error);
      toast.error("Erro ao carregar respostas");
      setLoading(false);
      return;
    }

    const attempts = ((data as any) ?? []).map((item: any) => {
      const participantData = Array.isArray(item.participants) 
        ? item.participants[0] 
        : item.participants;
        
      return {
        ...item,
        participants: participantData
      };
    });

    setRows(attempts);
    setLoading(false);
  };

  useEffect(() => {
    if (rolesLoading) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolesLoading, isSuperadmin, churchId, selectedClassId]);

  const periodRange = useMemo<{ start: Date | null; end: Date | null }>(() => {
    if (periodFilter === "all") return { start: null, end: null };
    const now = new Date();
    if (periodFilter === "week") {
      // segunda-feira 00:00 → agora
      const day = now.getDay(); // 0=dom..6=sab
      const diff = day === 0 ? -6 : 1 - day;
      const start = new Date(now);
      start.setDate(now.getDate() + diff);
      start.setHours(0, 0, 0, 0);
      return { start, end: null };
    }
    if (periodFilter === "month") {
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
        end: null,
      };
    }
    if (periodFilter === "trimester") {
      // trimestre corrente (Jan-Mar, Abr-Jun, Jul-Set, Out-Dez)
      const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
      return {
        start: new Date(now.getFullYear(), qStartMonth, 1, 0, 0, 0, 0),
        end: null,
      };
    }
    // T1..T4 do ano corrente
    const tIdx = Number(periodFilter.slice(1)) - 1; // 0..3
    const startMonth = tIdx * 3;
    const start = new Date(now.getFullYear(), startMonth, 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), startMonth + 3, 1, 0, 0, 0, 0); // exclusivo
    return { start, end };
  }, [periodFilter]);

  const quizOptions = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => {
      if (r.quiz_id && !map.has(r.quiz_id)) {
        const label = r.quizzes?.title ?? "Quiz";
        const lesson = r.quizzes?.lesson_number ? ` · Lição ${r.quizzes.lesson_number}` : "";
        map.set(r.quiz_id, `${label}${lesson}`);
      }
    });
    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  }, [rows]);

  const filtered = useMemo(() => {
    let list = rows;
    if (selectedClassId) {
      list = list.filter((r) => r.participants?.class_id === selectedClassId);
    }
    if (quizFilter !== "all") {
      list = list.filter((r) => r.quiz_id === quizFilter);
    }
    if (periodRange.start) {
      const startMs = periodRange.start.getTime();
      const endMs = periodRange.end ? periodRange.end.getTime() : Infinity;
      list = list.filter((r) => {
        if (!r.finished_at) return false;
        const t = new Date(r.finished_at).getTime();
        return t >= startMs && t < endMs;
      });
    }
    if (q) {
      const ql = q.toLowerCase();
      list = list.filter(
        (r) =>
          (r.participants?.name ?? "").toLowerCase().includes(ql) ||
          (r.quizzes?.title ?? "").toLowerCase().includes(ql)
      );
    }
    return list;
  }, [rows, allowedNames, q, quizFilter, periodRange]);

  const toggleExpand = async (attempt: AttemptRow) => {
    if (expanded === attempt.id) {
      setExpanded(null);
      return;
    }
    setExpanded(attempt.id);

    if (!details[attempt.id]) {
      setDetails((d) => ({
        ...d,
        [attempt.id]: { questions: [], answers: [], loading: true },
      }));

      const [{ data: questions }, { data: answers }] = await Promise.all([
        supabase.rpc("admin_get_questions_with_answer", { p_quiz_id: attempt.quiz_id }),
        supabase
          .from("answers")
          .select("question_id, selected_option, is_correct, answered_at")
          .eq("attempt_id", attempt.id),
      ]);

      setDetails((d) => ({
        ...d,
        [attempt.id]: {
          questions: (questions as QuestionRow[]) ?? [],
          answers: (answers as AnswerRow[]) ?? [],
          loading: false,
        },
      }));
    }
  };

  return (
    <AdminPage
      title="Respostas dos Membros"
      description={
        isSuperadmin
          ? "Veja, por aluno, cada resposta dada e o gabarito para corrigir e medir o conhecimento individual."
          : "Veja as respostas dos membros da sua igreja, com gabarito, para acompanhamento individual."
      }
      Icon={MessageSquare}
      variant="primary"
    >

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por aluno ou quiz…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <Select value={quizFilter} onValueChange={setQuizFilter}>
          <SelectTrigger className="sm:w-64">
            <SelectValue placeholder="Filtrar por quiz" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">Todos os quizzes</SelectItem>
            {quizOptions.map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as Period)}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo o período</SelectItem>
            <SelectItem value="week">Esta semana</SelectItem>
            <SelectItem value="month">Este mês</SelectItem>
            <SelectItem value="trimester">Este trimestre</SelectItem>
            <SelectItem value="t1">1º Trimestre (Jan–Mar)</SelectItem>
            <SelectItem value="t2">2º Trimestre (Abr–Jun)</SelectItem>
            <SelectItem value="t3">3º Trimestre (Jul–Set)</SelectItem>
            <SelectItem value="t4">4º Trimestre (Out–Dez)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="text-xs text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "resultado" : "resultados"}
      </div>

      {loading ? (
        <Card className="p-6 text-center text-muted-foreground">Carregando…</Card>
      ) : filtered.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">Nenhuma resposta encontrada.</Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => {
            const isOpen = expanded === a.id;
            const det = details[a.id];
            const acc = a.total_questions > 0 ? Math.round((a.score / a.total_questions) * 100) : 0;
            return (
              <Card key={a.id} className="overflow-hidden">
                <Collapsible open={isOpen} onOpenChange={() => toggleExpand(a)}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors">
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground truncate">
                          {a.participants?.name ?? "—"}
                        </div>
                        <div className="text-xs text-muted-foreground truncate mt-0.5">
                          {a.quizzes?.title ?? "Quiz"}
                          {a.quizzes?.lesson_number ? ` · Lição ${a.quizzes.lesson_number}` : ""}
                          {a.finished_at
                            ? ` · ${new Date(a.finished_at).toLocaleString("pt-BR")}`
                            : ""}
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTime(a.total_time_seconds)}
                        </div>
                        <Badge variant={acc >= 70 ? "default" : "secondary"} className="gap-1">
                          <Trophy className="w-3 h-3" />
                          {a.score}/{a.total_questions} · {acc}%
                        </Badge>
                      </div>
                      <div className="sm:hidden">
                        <Badge variant={acc >= 70 ? "default" : "secondary"}>
                          {a.score}/{a.total_questions}
                        </Badge>
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t bg-muted/20 p-4 space-y-3">
                      {(() => {
                        if (!det || det.loading) {
                          return (
                            <div className="text-sm text-muted-foreground">
                              Carregando respostas…
                            </div>
                          );
                        }
                        // Apenas perguntas que o aluno realmente respondeu
                        const answeredQuestions = det.questions.filter((qst) =>
                          det.answers.some((x) => x.question_id === qst.id)
                        );
                        if (answeredQuestions.length === 0) {
                          // A tentativa tem score salvo (ex.: 13/13) mas as respostas
                          // individuais não foram persistidas em `answers`. Isso ocorre
                          // com tentativas antigas, anteriores ao salvamento detalhado.
                          return (
                            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
                              ⚠️ Esta tentativa registrou apenas a pontuação final
                              ({a.score}/{a.total_questions}). As respostas individuais
                              não estão disponíveis para detalhamento (provavelmente
                              feita antes da implementação do gabarito por aluno).
                            </div>
                          );
                        }
                        return answeredQuestions.map((qst, idx) => {
                          const ans = det.answers.find((x) => x.question_id === qst.id)!;
                          const correctLetter = (qst.correct_option ?? "").toLowerCase();
                          const selectedLetter = (ans.selected_option ?? "").toLowerCase();
                          const isCorrect = ans.is_correct;
                          return (
                            <div
                              key={qst.id}
                              className="rounded-md border bg-background p-3 space-y-2"
                            >
                              <div className="flex items-start gap-2">
                                <Badge variant="outline" className="shrink-0">
                                  {idx + 1}
                                </Badge>
                                <div className="flex-1 text-sm font-medium text-foreground">
                                  {qst.question_text}
                                </div>
                                {isCorrect ? (
                                  <Badge className="shrink-0 bg-green-600 hover:bg-green-600 gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Acertou
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive" className="shrink-0 gap-1">
                                    <XCircle className="w-3 h-3" /> Errou
                                  </Badge>
                                )}
                              </div>
                              <div className="grid sm:grid-cols-2 gap-1.5 text-sm">
                                {optionLetters.map((letter) => {
                                  const text = (qst as any)[`option_${letter}`] as string;
                                  const isCorrectOpt = letter === correctLetter;
                                  const isSelected = letter === selectedLetter;
                                  return (
                                    <div
                                      key={letter}
                                      className={`flex items-start gap-2 rounded px-2 py-1.5 border ${
                                        isCorrectOpt
                                          ? "border-green-600/50 bg-green-600/10"
                                          : isSelected && !isCorrectOpt
                                          ? "border-destructive/50 bg-destructive/10"
                                          : "border-transparent"
                                      }`}
                                    >
                                      <span className="font-bold uppercase text-xs mt-0.5 w-4">
                                        {letter}
                                      </span>
                                      <span className="flex-1">{text}</span>
                                      {isCorrectOpt && (
                                        <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                                      )}
                                      {isSelected && !isCorrectOpt && (
                                        <XCircle className="w-4 h-4 text-destructive shrink-0" />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              {qst.explanation && (
                                <div className="text-xs text-muted-foreground italic border-t pt-2 mt-1">
                                  💡 {qst.explanation}
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}
    </AdminPage>
  );
}
