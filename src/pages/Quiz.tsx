import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import churchLogo from "@/assets/church-logo.png";
import { useQuizStore } from "@/stores/quizStore";
import { useTimer } from "@/hooks/useTimer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { QuizCountdown } from "@/components/QuizCountdown";
import { EvaluationBreak } from "@/components/EvaluationBreak";
import { toast } from "sonner";

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  order_index: number;
}

const optionLabels = ["A", "B", "C", "D"] as const;
const optionKeys = ["option_a", "option_b", "option_c", "option_d"] as const;
const QUESTIONS_PER_QUIZ = 13;

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
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCountdown, setShowCountdown] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showEvalBreak, setShowEvalBreak] = useState(false);
  const [evalBreakShown, setEvalBreakShown] = useState(false);
  const [evalBreakQuestion] = useState(() => Math.floor(Math.random() * 6) + 5);
  const { seconds, ms, formatted } = useTimer(!isLoading && !showCountdown && !showEvalBreak);

  // 🔒 trava de finalização
  const finishingRef = useRef(false);

  useEffect(() => {
    if (!store.classId) {
      navigate("/");
      return;
    }

    const loadQuiz = async () => {
      try {
        let participantId = store.participantId;
        let quizId = store.quizId;

        if (!store.isRetrying) {
          const { data: participant, error: pErr } = await supabase
            .from("participants")
            .insert({ name: store.participantName, class_id: store.classId })
            .select("id")
            .single();
          if (pErr) throw pErr;
          store.setParticipantId(participant.id);
          participantId = participant.id;

          const { data: quiz, error: qErr } = await supabase
            .from("quizzes")
            .select("id")
            .eq("class_id", store.classId)
            .eq("active", true)
            .eq("trimester", store.trimester)
            .limit(1)
            .maybeSingle();
          if (qErr) throw qErr;
          if (!quiz) {
            toast.info(`📅 Quiz do ${store.trimester}º trimestre ainda não está disponível para esta classe.`);
            navigate("/");
            return;
          }
          store.setQuizId(quiz.id);
          quizId = quiz.id;
        }

        const { data: allQs, error: qsErr } = await supabase.from("questions").select("*").eq("quiz_id", quizId);
        if (qsErr) throw qsErr;

        const selected = shuffleArray(allQs).slice(0, QUESTIONS_PER_QUIZ);
        setQuestions(selected);

        const { data: attempt, error: aErr } = await supabase
          .from("quiz_attempts")
          .insert({
            participant_id: participantId,
            quiz_id: quizId,
            total_questions: QUESTIONS_PER_QUIZ,
          })
          .select("id")
          .single();
        if (aErr) throw aErr;

        store.setAttemptId(attempt.id);
        setIsLoading(false);
      } catch {
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
        if (allAnswers[q.id] === q.correct_option) score++;
      });

      const totalTime = seconds;
      const totalMs = Math.round(ms);
      const accuracy = (score / questions.length) * 100;
      const finishedAt = new Date().toISOString();

      supabase
        .from("quiz_attempts")
        .update({
          score,
          accuracy_percentage: accuracy,
          total_time_seconds: totalTime,
          total_time_ms: totalMs,
          finished_at: finishedAt,
        })
        .eq("id", store.attemptId)
        .then(async () => {
          try {
            const { data: classRank } = await supabase
              .from("ranking_by_class")
              .select("position")
              .eq("attempt_id", store.attemptId)
              .maybeSingle();

            const { data: generalRank } = await supabase
              .from("ranking_general")
              .select("position")
              .eq("attempt_id", store.attemptId)
              .maybeSingle();

            await fetch("https://webhook.falaminhasmanas.shop/webhook/3b7c7b18-7b0b-4538-9139-6d26e7c47a43", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                event: "quiz_completed",
                participantName: store.participantName,
                classId: store.classId,
                className: store.className,
                score,
                totalQuestions: questions.length,
                accuracyPercentage: accuracy,
                totalTimeSeconds: totalTime,
                rankingClass: classRank?.position ?? null,
                rankingGeneral: generalRank?.position ?? null,
                timestamp: finishedAt,
              }),
            });
          } catch (err) {
            console.error("Webhook error:", err);
          }

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
    setShowEvalBreak(false);
  }, []);

  // ✅ auto-avance DESABILITADO na última pergunta
  useEffect(() => {
    if (!confirmed || isLast) return;

    const timer = setTimeout(() => {
      handleNext();
    }, 500);

    return () => clearTimeout(timer);
  }, [confirmed, handleNext, isLast]);

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
    return <QuizCountdown onComplete={handleCountdownComplete} />;
  }

  if (!currentQ) return null;

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col relative">
      <ThemeToggle />

      <div className="max-w-xl mx-auto w-full pt-2">
        <div className="flex items-center justify-between mb-3">
          <img src={churchLogo} className="w-10 h-10" />
          <span className="text-sm">
            Pergunta {store.currentQuestionIndex + 1} de {questions.length}
          </span>
        </div>

        <div className="w-full h-2 bg-muted rounded-full mb-6">
          <motion.div style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-xl w-full">
          <h2>{currentQ.question_text}</h2>

          {optionLabels.map((label, i) => (
            <button
              key={label}
              onClick={() => {
                if (confirmed) return;
                setSelectedOption(label);
                setConfirmed(true);

                const isCorrect = label === currentQ.correct_option;
                store.setAnswer(currentQ.id, label);

                supabase.from("answers").insert({
                  attempt_id: store.attemptId,
                  question_id: currentQ.id,
                  selected_option: label,
                  is_correct: isCorrect,
                });
              }}
            >
              {label} - {currentQ[optionKeys[i]]}
            </button>
          ))}

          {confirmed && <button onClick={handleNext}>{isLast ? "Finalizar Quiz" : "Próxima"}</button>}

          <div>{formatted}</div>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
