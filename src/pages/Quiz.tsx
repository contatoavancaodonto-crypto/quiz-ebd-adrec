import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuizStore } from "@/stores/quizStore";
import { useTimer } from "@/hooks/useTimer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { QuizCountdown } from "@/components/QuizCountdown";
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
  const { seconds, formatted } = useTimer(!isLoading && !showCountdown);

  // Load quiz
  useEffect(() => {
    if (!store.classId) {
      navigate("/");
      return;
    }

    const loadQuiz = async () => {
      try {
        // Create participant
        const { data: participant, error: pErr } = await supabase
          .from("participants")
          .insert({ name: store.participantName, class_id: store.classId })
          .select("id")
          .single();
        if (pErr) throw pErr;
        store.setParticipantId(participant.id);

        // Get active quiz for class
        const { data: quiz, error: qErr } = await supabase
          .from("quizzes")
          .select("id")
          .eq("class_id", store.classId)
          .eq("active", true)
          .limit(1)
          .single();
        if (qErr) throw qErr;
        store.setQuizId(quiz.id);

        // Get ALL questions and randomly pick 13
        const { data: allQs, error: qsErr } = await supabase
          .from("questions")
          .select("*")
          .eq("quiz_id", quiz.id);
        if (qsErr) throw qsErr;

        const selected = shuffleArray(allQs).slice(0, QUESTIONS_PER_QUIZ);
        setQuestions(selected);

        // Create attempt
        const { data: attempt, error: aErr } = await supabase
          .from("quiz_attempts")
          .insert({
            participant_id: participant.id,
            quiz_id: quiz.id,
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

  const handleConfirm = useCallback(async () => {
    if (!selectedOption || !currentQ || confirmed) return;
    setIsSubmitting(true);
    setConfirmed(true);

    const isCorrect = selectedOption === currentQ.correct_option;
    store.setAnswer(currentQ.id, selectedOption);

    // Save answer
    await supabase.from("answers").insert({
      attempt_id: store.attemptId,
      question_id: currentQ.id,
      selected_option: selectedOption,
      is_correct: isCorrect,
    });

    setIsSubmitting(false);
  }, [selectedOption, currentQ, confirmed, store]);

  const handleNext = useCallback(() => {
    if (!confirmed || !currentQ) return;

    if (isLast) {
      const allAnswers = { ...store.answers, [currentQ.id]: store.answers[currentQ.id] };
      let score = 0;
      questions.forEach((q) => {
        if (allAnswers[q.id] === q.correct_option) score++;
      });

      const totalTime = seconds;
      const accuracy = (score / questions.length) * 100;

      supabase
        .from("quiz_attempts")
        .update({
          score,
          accuracy_percentage: accuracy,
          total_time_seconds: totalTime,
          finished_at: new Date().toISOString(),
        })
        .eq("id", store.attemptId)
        .then(() => {
          store.finishQuiz(score);
          navigate("/result");
        });
    } else {
      store.nextQuestion();
      setSelectedOption(null);
      setConfirmed(false);
    }
  }, [confirmed, currentQ, isLast, store, questions, seconds, navigate]);

  // Auto-advance after 1 second when confirmed
  useEffect(() => {
    if (!confirmed) return;
    const timer = setTimeout(() => {
      handleNext();
    }, 1000);
    return () => clearTimeout(timer);
  }, [confirmed, handleNext]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (showCountdown) {
    return <QuizCountdown onComplete={handleCountdownComplete} />;
  }

  if (!currentQ) return null;

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col relative">
      <ThemeToggle />

      {/* Header */}
      <div className="max-w-xl mx-auto w-full pt-2">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground font-medium">
            Pergunta {store.currentQuestionIndex + 1} de {questions.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-6">
          <motion.div
            className="h-full gradient-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-xl w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl md:text-2xl font-display font-bold text-foreground mb-6 leading-snug">
                {currentQ.question_text}
              </h2>

              <div className="space-y-3">
                {optionLabels.map((label, i) => {
                  const optionText = currentQ[optionKeys[i]];
                  const isSelected = selectedOption === label;
                  const isCorrectOption = label === currentQ.correct_option;

                  let optionClass = "border-border bg-card hover:border-primary/40";
                  let badgeClass = "bg-muted text-muted-foreground";

                  if (confirmed) {
                    if (isCorrectOption) {
                      optionClass = "border-green-500 bg-green-500/15 shadow-[0_0_20px_rgba(34,197,94,0.3)] animate-[pulse_1.5s_ease-in-out_infinite]";
                      badgeClass = "bg-green-500 text-white";
                    } else if (isSelected && !isCorrectOption) {
                      optionClass = "border-destructive bg-destructive/15 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-[pulse_1.5s_ease-in-out_infinite]";
                      badgeClass = "bg-destructive text-white";
                    } else {
                      optionClass = "border-border/50 bg-card/50 opacity-40";
                    }
                  } else if (isSelected) {
                    optionClass = "border-primary bg-primary/10 shadow-md";
                    badgeClass = "gradient-primary text-primary-foreground";
                  }

                  return (
                    <motion.button
                      key={label}
                      whileHover={!confirmed ? { scale: 1.01 } : {}}
                      whileTap={!confirmed ? { scale: 0.99 } : {}}
                      onClick={() => {
                        if (confirmed) return;
                        setSelectedOption(label);
                        // Auto-confirm immediately after selecting
                        if (!confirmed && currentQ) {
                          setIsSubmitting(true);
                          setConfirmed(true);
                          const isCorrect = label === currentQ.correct_option;
                          store.setAnswer(currentQ.id, label);
                          supabase.from("answers").insert({
                            attempt_id: store.attemptId,
                            question_id: currentQ.id,
                            selected_option: label,
                            is_correct: isCorrect,
                          }).then(() => setIsSubmitting(false));
                        }
                      }}
                      disabled={confirmed}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 cursor-pointer ${optionClass}`}
                    >
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${badgeClass}`}>
                        {label}
                      </span>
                      <span className="text-foreground font-medium text-sm md:text-base">
                        {optionText}
                      </span>
                      {confirmed && isCorrectOption && (
                        <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto shrink-0" />
                      )}
                      {confirmed && isSelected && !isCorrectOption && (
                        <XCircle className="w-5 h-5 text-destructive ml-auto shrink-0" />
                      )}
                      {!confirmed && isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-primary ml-auto shrink-0" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Action button - only show after confirmed for manual advance fallback */}
          {!confirmed ? null : (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              className="w-full mt-6 py-4 rounded-xl gradient-primary text-primary-foreground font-semibold text-lg flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              {isLast ? "Finalizar Quiz" : (
                <>
                  Próxima
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          )}

          {/* Timer below button */}
          <div className="flex items-center justify-center gap-2 mt-4 text-lg md:text-xl font-mono font-bold text-primary bg-primary/10 px-4 py-2 rounded-xl border border-primary/20 w-fit mx-auto">
            <Clock className="w-5 h-5" />
            {formatted}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
