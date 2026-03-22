import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import churchLogo from "@/assets/church-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useQuizStore } from "@/stores/quizStore";
import { ThemeToggle } from "@/components/ThemeToggle";

interface GabaritoItem {
  order_index: number;
  question_text: string;
  correct_option: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  selected_option: string;
  is_correct: boolean;
}

const optionLabel: Record<string, string> = { A: "A", B: "B", C: "C", D: "D" };

function getOptionText(item: GabaritoItem, key: string) {
  const map: Record<string, string> = {
    A: item.option_a,
    B: item.option_b,
    C: item.option_c,
    D: item.option_d,
  };
  return map[key] ?? key;
}

const GabaritoPage = () => {
  const navigate = useNavigate();
  const store = useQuizStore();
  const [items, setItems] = useState<GabaritoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!store.attemptId) {
      navigate("/");
      return;
    }

    const fetch = async () => {
      const { data: answers } = await supabase
        .from("answers")
        .select("question_id, selected_option, is_correct")
        .eq("attempt_id", store.attemptId);

      if (!answers || answers.length === 0) {
        setLoading(false);
        return;
      }

      const questionIds = answers.map((a) => a.question_id);
      const { data: questions } = await supabase
        .from("questions")
        .select("id, order_index, question_text, correct_option, option_a, option_b, option_c, option_d")
        .in("id", questionIds);

      if (!questions) {
        setLoading(false);
        return;
      }

      const merged: GabaritoItem[] = questions
        .map((q) => {
          const ans = answers.find((a) => a.question_id === q.id);
          return {
            order_index: q.order_index,
            question_text: q.question_text,
            correct_option: q.correct_option,
            option_a: q.option_a,
            option_b: q.option_b,
            option_c: q.option_c,
            option_d: q.option_d,
            selected_option: ans?.selected_option ?? "",
            is_correct: ans?.is_correct ?? false,
          };
        })
        .sort((a, b) => a.order_index - b.order_index);

      setItems(merged);
      setLoading(false);
    };
    fetch();
  }, [store.attemptId, navigate]);

  const correctCount = items.filter((i) => i.is_correct).length;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-4 relative">
      <ThemeToggle />

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 mt-2">
          <button
            onClick={() => navigate("/result")}
            className="p-2 rounded-lg bg-card border border-border hover:border-primary/40 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <img src={churchLogo} alt="Logo" className="w-10 h-10 object-contain drop-shadow-[0_0_10px_rgba(76,201,224,0.3)]" />
          <div>
            <h1 className="text-lg font-display font-bold text-foreground">Meu Gabarito</h1>
            <p className="text-xs text-muted-foreground">
              {correctCount}/{items.length} acertos
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-10">Carregando...</div>
        ) : items.length === 0 ? (
          <div className="text-center text-muted-foreground py-10">Nenhuma resposta encontrada.</div>
        ) : (
          <div className="space-y-3 pb-8">
            {items.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`rounded-xl border p-4 ${
                  item.is_correct
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-destructive/30 bg-destructive/5"
                }`}
              >
                <div className="flex items-start gap-2 mb-2">
                  {item.is_correct ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                  )}
                  <p className="text-sm font-medium text-foreground leading-snug">
                    {idx + 1}. {item.question_text}
                  </p>
                </div>

                <div className="ml-7 space-y-1 text-xs">
                  <div className="text-muted-foreground">
                    Sua resposta:{" "}
                    <span className={item.is_correct ? "text-green-500 font-semibold" : "text-destructive font-semibold"}>
                      {optionLabel[item.selected_option]} – {getOptionText(item, item.selected_option)}
                    </span>
                  </div>
                  {!item.is_correct && (
                    <div className="text-muted-foreground">
                      Correta:{" "}
                      <span className="text-green-500 font-semibold">
                        {optionLabel[item.correct_option]} – {getOptionText(item, item.correct_option)}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GabaritoPage;
