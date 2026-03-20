import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Clock, Target, BarChart3, ArrowRight } from "lucide-react";
import churchLogo from "@/assets/church-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useQuizStore } from "@/stores/quizStore";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ThankYouScreen } from "@/components/ThankYouScreen";

function getPerformanceMessage(pct: number) {
  if (pct >= 90) return { text: "Excelente! 🌟", color: "text-green-500" };
  if (pct >= 70) return { text: "Muito bom! 👏", color: "text-primary" };
  if (pct >= 50) return { text: "Bom! 👍", color: "text-yellow-500" };
  return { text: "Precisa melhorar 📖", color: "text-destructive" };
}

function formatTime(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

const TOTAL_QUESTIONS = 13;

const ResultPage = () => {
  const navigate = useNavigate();
  const store = useQuizStore();
  const [classRank, setClassRank] = useState<number | null>(null);
  const [generalRank, setGeneralRank] = useState<number | null>(null);
  const [showThankYou, setShowThankYou] = useState(true);

  const score = store.score;
  const pct = Math.round((score / TOTAL_QUESTIONS) * 100);
  const perf = getPerformanceMessage(pct);

  useEffect(() => {
    if (!store.attemptId) {
      navigate("/");
      return;
    }

    const fetchRanks = async () => {
      const { data: cr } = await supabase
        .from("ranking_by_class")
        .select("position")
        .eq("attempt_id", store.attemptId)
        .maybeSingle();
      if (cr) setClassRank(Number(cr.position));

      const { data: gr } = await supabase
        .from("ranking_general")
        .select("position")
        .eq("attempt_id", store.attemptId)
        .maybeSingle();
      if (gr) setGeneralRank(Number(gr.position));
    };
    fetchRanks();
  }, [store.attemptId, navigate]);

  if (showThankYou) {
    return (
      <ThankYouScreen
        participantName={store.participantName}
        onContinue={() => setShowThankYou(false)}
      />
    );
  }

  const stats = [
    { icon: Target, label: "Pontuação", value: `${score}/${TOTAL_QUESTIONS}`, sub: `${pct}%` },
    { icon: Clock, label: "Tempo", value: formatTime(store.totalTimeSeconds), sub: "" },
    { icon: Trophy, label: "Ranking Turma", value: classRank ? `#${classRank}` : "...", sub: store.className },
    { icon: BarChart3, label: "Ranking Geral", value: generalRank ? `#${generalRank}` : "...", sub: "Todas turmas" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">
      <ThemeToggle />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-background mb-4"
          >
            <img src={churchLogo} alt="Logo ADREC" className="w-16 h-16 object-contain" />
          </motion.div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-1">
            {store.participantName}
          </h1>
          <p className={`text-lg font-semibold ${perf.color}`}>{perf.text}</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="glass-card glow-border p-4 text-center"
            >
              <s.icon className="w-5 h-5 text-primary mx-auto mb-2" />
              <div className="text-2xl font-display font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              {s.sub && <div className="text-xs text-primary mt-0.5">{s.sub}</div>}
            </motion.div>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/ranking", { state: { classId: store.classId, className: store.className } })}
            className="w-full py-3.5 rounded-xl gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 shadow-lg cursor-pointer"
          >
            🏆 Ver Ranking da Turma
            <ArrowRight className="w-4 h-4" />
          </motion.button>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/ranking")}
            className="w-full py-3.5 rounded-xl border-2 border-border bg-card text-foreground font-semibold flex items-center justify-center gap-2 hover:border-primary/40 transition-colors cursor-pointer"
          >
            📊 Ranking Geral
          </motion.button>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            onClick={() => {
              store.reset();
              navigate("/");
            }}
            className="w-full py-3 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          >
            Jogar Novamente
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default ResultPage;
