import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, XCircle, BookOpenCheck } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useQuizStore } from "@/stores/quizStore";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PageShell } from "@/components/ui/page-shell";
import { PageHero, HeroChip } from "@/components/ui/page-hero";

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
      const { data, error } = await supabase.rpc("get_attempt_gabarito", {
        p_attempt_id: store.attemptId,
      });

      if (error || !data) {
        setLoading(false);
        return;
      }

      const merged: GabaritoItem[] = (data as any[])
        .map((q) => ({
          order_index: q.order_index,
          question_text: q.question_text,
          correct_option: q.correct_option,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          selected_option: q.selected_option ?? "",
          is_correct: q.is_correct ?? false,
        }))
        .sort((a, b) => a.order_index - b.order_index);

      setItems(merged);
      setLoading(false);
    };
    fetch();
  }, [store.attemptId, navigate]);

  const correctCount = items.filter((i) => i.is_correct).length;
  const incorrectCount = items.length - correctCount;

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Header app-like */}
      <header
        className="sticky top-0 z-30 bg-background/85 backdrop-blur-xl border-b border-border/50"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="max-w-md mx-auto w-full px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Voltar"
            className="w-10 h-10 -ml-2 rounded-full hover:bg-muted flex items-center justify-center text-foreground active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-foreground leading-tight">Meu Gabarito</h1>
            <p className="text-[11px] text-muted-foreground">
              {correctCount}/{items.length} acertos
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <PageShell contentClassName="w-full max-w-md mx-auto px-4 pt-4 pb-8 space-y-5">
        <PageHero
          eyebrow="Revisão · 1º TRI. 2026 - ADREC"
          title="Meu Gabarito"
          description="Confira o que você acertou e errou nesta tentativa."
          Icon={BookOpenCheck}
          variant="primary"
        >
          <div className="flex flex-wrap gap-2">
            <HeroChip Icon={CheckCircle2}>{correctCount} acertos</HeroChip>
            <HeroChip Icon={XCircle}>{incorrectCount} erros</HeroChip>
          </div>
        </PageHero>

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
                className={`rounded-3xl border p-4 backdrop-blur ${
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
      </PageShell>
    </div>
  );
};

export default GabaritoPage;
