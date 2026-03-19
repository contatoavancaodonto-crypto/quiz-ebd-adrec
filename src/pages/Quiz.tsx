import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle2, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuizStore } from "@/stores/quizStore";
import { useTimer } from "@/hooks/useTimer";
import { ThemeToggle } from "@/components/ThemeToggle";
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

const QuizPage = () => {
  const navigate = useNavigate();
  const store = useQuizStore();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { seconds, formatted } = useTimer(!isLoading);

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

        // Get questions
        const { data: qs, error: qsErr } = await supabase
          .from("questions")
          .select("*")
          .eq("quiz_id", quiz.id)
          .order("order_index");
        if (qsErr) throw qsErr;
        setQuestions(qs);

        // Create attempt
        const { data: attempt, error: aErr } = await supabase
          .from("quiz_attempts")
          .insert({
            participant_id: participant.id,
            quiz_id: quiz.id,
            total_questions: qs.length,
          })
          .select("id")
          .single();
        if (aErr) throw aErr;
        store.setAttemptId(attempt.id);
        store.startTimer();
        setIsLoading(false);
      } catch {
        toast.error("Erro ao carregar quiz.");
        navigate("/");
      }
    };

    loadQuiz();
  }, []);

  const currentQ = questions[store.currentQuestionIndex];
  const isLast = store.currentQuestionIndex === questions.length - 1;
  const progress = questions.length > 0 ? ((store.currentQuestionIndex + 1) / questions.length) * 100 : 0;

  const handleNext = useCallback(async () => {
    if (!selectedOption || !currentQ) return;
    setIsSubmitting(true);

    const isCorrect = selectedOption === currentQ.correct_option;
    store.setAnswer(currentQ.id, selectedOption);

    // Save answer
    await supabase.from("answers").insert({
      attempt_id: store.attemptId,
      question_id: currentQ.id,
      selected_option: selectedOption,
      is_correct: isCorrect,
    });

    if (isLast) {
      // Calculate score
      const allAnswers = { ...store.answers, [currentQ.id]: selectedOption };
      let score = 0;
      questions.forEach((q) => {
        if (allAnswers[q.id] === q.correct_option) score++;
      });

      const totalTime = seconds;
      const accuracy = (score / questions.length) * 100;

      // Update attempt
      await supabase
        .from("quiz_attempts")
        .update({
          score,
          accuracy_percentage: accuracy,
          total_time_seconds: totalTime,
          finished_at: new Date().toISOString(),
        })
        .eq("id", store.attemptId);

      store.finishQuiz(score);
      navigate("/result");
    } else {
      store.nextQuestion();
      setSelectedOption(null);
    }
    setIsSubmitting(false);
  }, [selectedOption, currentQ, isLast, store, questions, seconds, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
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
          <div className="flex items-center gap-1.5 text-sm font-mono text-primary">
            <Clock className="w-4 h-4" />
            {formatted}
          </div>
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

                  return (
                    <motion.button
                      key={label}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedOption(label)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-md"
                          : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                          isSelected
                            ? "gradient-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {label}
                      </span>
                      <span className="text-foreground font-medium text-sm md:text-base">
                        {optionText}
                      </span>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-primary ml-auto shrink-0" />}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Next button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: selectedOption ? 1 : 0.4 }}
            whileHover={selectedOption ? { scale: 1.02 } : {}}
            whileTap={selectedOption ? { scale: 0.98 } : {}}
            onClick={handleNext}
            disabled={!selectedOption || isSubmitting}
            className="w-full mt-6 py-4 rounded-xl gradient-primary text-primary-foreground font-semibold text-lg flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 cursor-pointer"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : isLast ? (
              "Finalizar Quiz"
            ) : (
              <>
                Próxima
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
