import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import churchLogo from "@/assets/church-logo.png";

interface QuizCountdownProps {
  onComplete: () => void;
}

const rules = [
  "📝 O quiz contém 13 perguntas aleatórias",
  "🏆 Haverá 2 rankings: da Turma e Geral",
  "⏱️ O critério de desempate é o menor tempo",
  "💡 Não basta acertar tudo — responda rápido!",
];

export function QuizCountdown({ onComplete }: QuizCountdownProps) {
  const [count, setCount] = useState(5);

  useEffect(() => {
    if (count <= 0) {
      onComplete();
      return;
    }
    const timer = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [count, onComplete]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10 text-center"
      >
        <img src={churchLogo} alt="Logo ADREC" className="w-16 h-16 object-contain mx-auto mb-4" />
        <h2 className="text-xl font-display font-bold text-foreground mb-6">
          Prepare-se! 🙏
        </h2>

        {/* Rules */}
        <div className="glass-card glow-border p-5 mb-8 text-left space-y-3">
          <h3 className="text-sm font-semibold text-primary uppercase tracking-wide mb-3">
            Regras do Quiz
          </h3>
          {rules.map((rule, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
              className="text-sm text-foreground/80"
            >
              {rule}
            </motion.p>
          ))}
        </div>

        {/* Countdown */}
        <div className="text-muted-foreground text-sm mb-3">Começando em</div>
        <AnimatePresence mode="wait">
          <motion.div
            key={count}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="text-7xl font-display font-bold gradient-text"
          >
            {count}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
