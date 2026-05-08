import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import churchLogo from "@/assets/church-logo.webp";
import { useQuizStore } from "@/stores/quizStore";
import { useTimer } from "@/hooks/useTimer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { QuizCountdown } from "@/components/QuizCountdown";
import { EvaluationBreak } from "@/components/EvaluationBreak";
import { SeasonCountdown } from "@/components/SeasonCountdown";
import { SeasonClosedScreen } from "@/components/SeasonClosedScreen";
import { useActiveSeason } from "@/hooks/useActiveSeason";
import { useCountdown } from "@/hooks/useCountdown";
import { useSound } from "@/hooks/useSound";
import { toast } from "sonner";

interface Question {
  id: string | number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  order_index: number;
}

const optionLabels = ["A", "B", "C", "D"] as const;
const optionKeys = ["option_a", "option_b", "option_c", "option_d"] as const;
const DEFAULT_QUESTIONS_PER_QUIZ = 13;

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const QuizPage = () => {
  const navigate = useNavigate();
  const store = useQuizStore();
  const { playSound } = useSound();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [revealedCorrect, setRevealedCorrect] = useState<Record<string, string>>({});
  const [correctnessByQ, setCorrectnessByQ] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showCountdown, setShowCountdown] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showEvalBreak, setShowEvalBreak] = useState(false);
  const [evalBreakShown, setEvalBreakShown] = useState(false);
  const [evalBreakQuestion] = useState(() => Math.floor(Math.random() * 6) + 5);
  const { seconds, ms, formatted } = useTimer(!isLoading && !showCountdown && !showEvalBreak);
  const { data: season } = useActiveSeason();
  const seasonCountdown = useCountdown(season?.end_date);
  const seasonExpired = !!season && seasonCountdown.expired;

  // 🔒 trava de finalização
  const finishingRef = useRef(false);

  useEffect(() => {
    console.log("QuizPage mounted. store.classId:", store.classId);
    if (!store.classId) {
      console.warn("Redirecionando para home pois classId está vazio.");
      navigate("/");
      return;
    }

    const loadQuiz = async () => {
      try {
        console.log("Iniciando loadQuiz. Store state:", {
          classId: store.classId,
          participantName: store.participantName,
          quizId: store.quizId
        });
        let participantId = store.participantId;
        let quizId = store.quizId;

        if (!store.isRetrying) {
          const { data: { user } } = await supabase.auth.getUser();
          
          // Verifica se já existe um participante com esse nome nesta turma para evitar duplicatas infinitas
          const { data: existingParticipant } = await supabase
            .from("participants")
            .select("id")
            .eq("name", store.participantName)
            .eq("class_id", store.classId)
            .eq("user_id", user?.id ?? null)
            .limit(1)
            .maybeSingle();

          if (existingParticipant) {
            participantId = existingParticipant.id;
            store.setParticipantId(participantId);
          } else {
            const { data: participant, error: pErr } = await supabase
              .from("participants")
              .insert({ name: store.participantName, class_id: store.classId, user_id: user?.id ?? null })
              .select("id")
              .single();
            if (pErr) throw pErr;
            store.setParticipantId(participant.id);
            participantId = participant.id;
          }

          // Se o quizId não veio do store (veio da Home), tentamos descobrir o quiz aberto
          if (!quizId) {
            const nowIso = new Date().toISOString();
            console.log("QuizId não encontrado no store, buscando quiz ativo...");
            
            // Prioridade 1: Tabela de lições
            const { data: lessonQuiz } = await supabase
              .from("lessons")
              .select("id")
              .eq("class_id", store.classId)
              .lte("scheduled_date", nowIso)
              .gte("scheduled_end_date", nowIso)
              .eq("status", "AGENDADO")
              .limit(1)
              .maybeSingle();

            if (lessonQuiz) {
              quizId = lessonQuiz.id;
              store.setQuizId(quizId);
              console.log("Lição detectada via busca automática:", quizId);
            } else {
              // Prioridade 2: Tabela de quizzes tradicional
              const { data: openQuizzes } = await supabase
                .from("quizzes")
                .select("id")
                .eq("class_id", store.classId)
                .eq("active", true)
                .lte("opens_at", nowIso)
                .gte("closes_at", nowIso)
                .order("week_number", { ascending: false })
                .limit(1);

              let quiz = openQuizzes?.[0];

              if (!quiz) {
                const { data: legacyQuiz } = await supabase
                  .from("quizzes")
                  .select("id")
                  .eq("class_id", store.classId)
                  .eq("active", true)
                  .limit(1)
                  .maybeSingle();
                quiz = legacyQuiz;
              }

              if (!quiz) {
                toast.info("Nenhum quiz disponível para esta turma no momento.");
                navigate("/");
                return;
              }
              quizId = quiz.id;
              store.setQuizId(quizId);
            }
          }
        }

        // Tenta carregar as perguntas primeiro da tabela 'questions' unificada (novo sistema de arquivo definitivo)
        let dbQuestions = null;
        let dbQuestionsErr = null;

        const { data: quizMeta } = await supabase
          .from("quizzes")
          .select("quiz_kind, total_questions")
          .eq("id", quizId)
          .maybeSingle();

        const isTrimestral = quizMeta?.quiz_kind === 'trimestral' || store.trimester !== undefined && !quizId;

        if (isTrimestral) {
          console.log("Detectado Provão Trimestral. Buscando perguntas via RPC...");
          const { data: provaoQs, error: provaoErr } = await supabase.rpc('get_trimestral_provao_questions', {
            p_class_id: store.classId,
            p_season_id: store.seasonId || null
          });
          
          if (!provaoErr && provaoQs) {
            dbQuestions = provaoQs.map(q => ({
              id: q.id,
              question_text: q.question_text,
              option_a: q.option_a,
              option_b: q.option_b,
              option_c: q.option_c,
              option_d: q.option_d,
              correct_option: q.correct_option,
              order_index: 0
            }));
          } else {
            console.error("Erro ao buscar perguntas do provão:", provaoErr);
          }
        }

        if (!dbQuestions) {
          const { data: normalQs, error: normalErr } = await supabase
            .from("questions")
            .select("id, question_text, option_a, option_b, option_c, option_d, order_index")
            .or(`quiz_id.eq.${quizId},lesson_id.eq.${quizId}`)
            .eq("active", true);
          dbQuestions = normalQs;
          dbQuestionsErr = normalErr;
        }

        let allQs: Question[] = [];
        let questionsPerQuiz = DEFAULT_QUESTIONS_PER_QUIZ;
        let isLesson = false;

        // Se encontrou perguntas na tabela unificada, prioriza elas
        if (dbQuestions && dbQuestions.length > 0) {
          console.log("Processando perguntas da tabela questions. Total:", dbQuestions.length);
          allQs = dbQuestions as Question[];
          
          // Verifica se é uma lição para decidir os metadados
          const { data: isLessonCheck } = await supabase.from("lessons").select("id").eq("id", quizId).maybeSingle();
          isLesson = !!isLessonCheck;
          
          questionsPerQuiz = allQs.length;
          store.setQuizMetadata(isLesson ? "weekly" : "weekly", questionsPerQuiz);
        } else {
          // Fallback para ler do JSON da lição (legado/redundância)
          const { data: lessonData } = await supabase
            .from("lessons")
            .select("questions")
            .eq("id", quizId)
            .maybeSingle();

          if (lessonData && Array.isArray(lessonData.questions) && lessonData.questions.length > 0) {
            isLesson = true;
            console.log("Processando perguntas do JSON da lição (fallback). Total:", lessonData.questions.length);
            allQs = lessonData.questions.map((q: any, index: number) => {
              const questionText = q.question_text || q.pergunta || q.text || q.title || "";
              const options = q.alternativas || {};
              return {
                id: q.id || `q-${index}`,
                question_text: questionText,
                option_a: q.option_a || options.a || options.option_a || "",
                option_b: q.option_b || options.b || options.option_b || "",
                option_c: q.option_c || options.c || options.option_c || "",
                option_d: q.option_d || options.d || options.option_d || "",
                order_index: q.order_index || index
              };
            });
            questionsPerQuiz = allQs.length;
            store.setQuizMetadata("weekly", questionsPerQuiz);
          } else {
            // Fallback para a tabela 'quizzes' e 'questions' tradicional
            const { data: quizMeta, error: qmErr } = await supabase
              .from("quizzes")
              .select("total_questions, quiz_kind")
              .eq("id", quizId)
              .maybeSingle();
            
            if (qmErr) {
              console.error("Erro ao buscar metadados do quiz:", qmErr);
              throw qmErr;
            }
            
            const quizKind = quizMeta?.quiz_kind ?? "weekly";
            const defaultTotal = quizKind === "trimestral" ? 26 : DEFAULT_QUESTIONS_PER_QUIZ;
            questionsPerQuiz = quizMeta?.total_questions || defaultTotal;
            store.setQuizMetadata(quizKind, questionsPerQuiz);

            const { data: dbQs, error: dbQsErr } = await supabase
              .from("questions")
              .select("id, question_text, option_a, option_b, option_c, option_d, order_index")
              .eq("quiz_id", quizId)
              .eq("active", true);
            
            if (dbQsErr) {
              console.error("Erro ao buscar perguntas:", dbQsErr);
              throw dbQsErr;
            }
            
            allQs = (dbQs || []) as Question[];
          }
        }

        if (allQs.length === 0) {
          toast.error("Este quiz não possui perguntas cadastradas.");
          navigate("/");
          return;
        }

        const selected = shuffleArray(allQs).slice(0, questionsPerQuiz);
        setQuestions(selected);

        const { data: attempt, error: aErr } = await supabase
          .from("quiz_attempts")
          .insert({
            participant_id: participantId,
            quiz_id: isLesson ? null : quizId,
            lesson_id: isLesson ? quizId : null,
            total_questions: selected.length,
            source_type: isLesson ? 'lesson_table' : 'quiz_table'
          })
          .select("id")
          .single();

        if (aErr) {
          console.error("Erro ao criar tentativa:", aErr);
          // Mensagem clara se trigger de janela rejeitar ou erro de banco
          if (aErr.message?.includes("já está encerrado") || aErr.message?.includes("ainda não está aberto")) {
            toast.error(aErr.message);
          } else {
            toast.error("Erro ao registrar início do quiz. Verifique sua conexão.");
          }
          navigate("/");
          return;
        }

        store.setAttemptId(attempt.id);
        setIsLoading(false);
      } catch (err) {
        console.error("Erro fatal ao carregar quiz:", err);
        toast.error("Erro ao carregar quiz.");
        navigate("/");
      }
    };

    loadQuiz();
  }, []);

  const handleCountdownComplete = useCallback(() => {
    setShowCountdown(false);
    store.startTimer();
  }, [store]);

  const currentQ = questions[store.currentQuestionIndex];
  const isLast = store.currentQuestionIndex === questions.length - 1;
  const progress = questions.length > 0 ? ((store.currentQuestionIndex + 1) / questions.length) * 100 : 0;

  const handleNext = useCallback(() => {
    if (!confirmed || !currentQ) return;
    playSound('tick');

    // 🔥 FINALIZAÇÃO (com trava)
    if (isLast) {
      if (finishingRef.current) return;
      finishingRef.current = true;

      const allAnswers = {
        ...store.answers,
        [currentQ.id]: store.answers[currentQ.id],
      };

      let score = 0;
      questions.forEach((q) => {
        if (correctnessByQ[q.id]) score++;
      });

      const totalMs = Math.round(ms);

      supabase
        .rpc("finalize_attempt", {
          p_attempt_id: store.attemptId,
          p_total_time_ms: totalMs,
          p_trimester: store.trimester
        })
        .then(() => {
          store.finishQuiz(score, totalMs);
          navigate("/result");
        });

      return;
    }

    // fluxo normal
    const nextIndex = store.currentQuestionIndex + 1;

    if (!evalBreakShown && nextIndex === evalBreakQuestion) {
      setShowEvalBreak(true);
      setEvalBreakShown(true);
      setSelectedOption(null);
      setConfirmed(false);
      store.nextQuestion();
      return;
    }

    store.nextQuestion();
    setSelectedOption(null);
    setConfirmed(false);
  }, [confirmed, currentQ, isLast, store, questions, seconds, navigate, evalBreakShown, evalBreakQuestion]);

  const handleEvalContinue = useCallback(() => {
    playSound('tick');
    setShowEvalBreak(false);
  }, [playSound]);

  // ✅ auto-avança também na última pergunta (finaliza automaticamente)
  useEffect(() => {
    if (!confirmed) return;

    const timer = setTimeout(() => {
      handleNext();
    }, 500);

    return () => clearTimeout(timer);
  }, [confirmed, handleNext]);

  if (seasonExpired) {
    return <SeasonClosedScreen />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (showEvalBreak) {
    return <EvaluationBreak classId={store.classId} elapsedFormatted={formatted} onContinue={handleEvalContinue} />;
  }

  if (showCountdown) {
    return <QuizCountdown onComplete={handleCountdownComplete} totalQuestions={questions.length} />;
  }

  if (!currentQ) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background blobs (padrão Home) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-40 -right-20 w-72 h-72 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      {/* Header app-like minimal */}
      <header
        className="sticky top-0 z-30 bg-background/85 backdrop-blur-xl border-b border-border/50"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="max-w-xl mx-auto w-full px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src={churchLogo} className="w-8 h-8" alt="ADREC" />
            <div className="leading-tight">
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
                Quiz · {store.className}
              </div>
              <div className="text-xs font-bold text-foreground">
                Pergunta {store.currentQuestionIndex + 1} de {questions.length}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SeasonCountdown variant="compact" />
            <ThemeToggle />
          </div>
        </div>
        {/* Barra de progresso */}
        <div className="w-full h-1 bg-muted">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="h-full gradient-primary"
          />
        </div>
      </header>

      <div className="relative z-10 flex-1 flex items-start sm:items-center justify-center px-4 pt-6 pb-8">
        <div className="max-w-xl w-full">
          <h2 className="text-xl font-bold mb-6 text-foreground leading-tight">
            {currentQ.question_text}
          </h2>

          <div className="space-y-3 mb-8">
            {optionLabels.map((label, i) => {
              const isSelected = selectedOption === label;
              const revealed = revealedCorrect[currentQ.id];
              const isCorrect = revealed ? label === revealed : false;
              
              return (
                <motion.button
                  key={label}
                  whileHover={!confirmed ? { scale: 1.01 } : {}}
                  whileTap={!confirmed ? { scale: 0.99 } : {}}
                  onClick={async () => {
                    if (confirmed) return;
                    playSound('ding');
                    setSelectedOption(label);
                    setConfirmed(true);
                    store.setAnswer(currentQ.id.toString(), label);

                    const { data, error } = await supabase.rpc("submit_answer", {
                      p_attempt_id: store.attemptId,
                      p_question_id: currentQ.id.toString(),
                      p_selected_option: label,
                    });
                    if (!error && data && data[0]) {
                      setRevealedCorrect((s) => ({ ...s, [currentQ.id]: data[0].correct_option }));
                      setCorrectnessByQ((s) => ({ ...s, [currentQ.id]: data[0].is_correct }));
                    }
                  }}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between gap-3 ${
                    confirmed
                      ? isCorrect
                        ? "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400"
                        : isSelected
                        ? "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400"
                        : "border-border opacity-50"
                      : isSelected
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                      confirmed
                        ? isCorrect
                          ? "bg-green-500 text-white"
                          : isSelected
                          ? "bg-red-500 text-white"
                          : "bg-muted text-muted-foreground"
                        : isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {label}
                    </span>
                    <span className="text-base font-medium">{currentQ[optionKeys[i]]}</span>
                  </div>
                  
                  {confirmed && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />}
                  {confirmed && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence>
            {confirmed && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                onClick={handleNext}
                className="w-full py-4 rounded-xl gradient-primary text-primary-foreground font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                {isLast ? "Finalizar Quiz" : "Próxima Pergunta"}
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-center gap-2 text-muted-foreground font-mono text-sm bg-muted/30 py-2 rounded-full w-fit mx-auto px-4">
            <Clock className="w-4 h-4" />
            {formatted}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
