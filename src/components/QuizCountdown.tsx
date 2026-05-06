import { motion } from "framer-motion";
import { ChevronRight, Check, Timer } from "lucide-react";
import churchLogo from "@/assets/church-logo.webp";

interface QuizCountdownProps {
  onComplete: () => void;
  totalQuestions?: number;
}

const getRules = (total: number) => [
  `📝 O quiz contém ${total} perguntas aleatórias`,
  "🏆 Haverá 2 rankings: da sua Classe e Geral",
  "💡 Não basta acertar tudo — responda rápido!",
];

export function QuizCountdown({ onComplete, totalQuestions = 13 }: QuizCountdownProps) {
  const rules = getRules(totalQuestions);
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
        <img
          src={churchLogo}
          alt="Logo ADREC"
          className="w-36 h-36 object-contain mx-auto mb-5 drop-shadow-[0_0_15px_rgba(76,201,224,0.3)]"
        />
        <h2 className="text-xl font-display font-bold text-foreground mb-6">
          Prepare-se! 🙏
        </h2>

        {/* Rules */}
        <div className="glass-card glow-border p-5 mb-5 text-left space-y-3">
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

        {/* Tiebreaker highlight */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="glass-card border-2 border-primary/40 bg-primary/10 p-4 mb-8 flex items-center gap-3 rounded-xl"
        >
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shrink-0">
            <Timer className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-foreground">
              ⏱️ Critério de desempate
            </p>
            <p className="text-xs text-muted-foreground">
              Em caso de empate, vence quem terminar em <span className="font-bold text-primary">menor tempo</span>!
            </p>
          </div>
        </motion.div>

        {/* Start button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onComplete}
          className="w-full py-4 rounded-xl gradient-primary text-primary-foreground font-semibold text-lg flex items-center justify-center gap-2 shadow-lg cursor-pointer"
        >
          <Check className="w-5 h-5" />
          Estou Pronto!
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      </motion.div>
    </div>
  );
}
