import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, Trophy, BarChart3 } from "lucide-react";
import churchLogo from "@/assets/church-logo.png";
import { useSound } from "@/hooks/useSound";

const WEBHOOK_URL = "https://webhook.falaminhasmanas.shop/webhook/3b7c7b18-7b0b-4538-9139-6d26e7c47a43";

interface ThankYouScreenProps {
  participantName: string;
  classId: string;
  className: string;
  score: number;
  totalTimeSeconds: number;
  onContinue: () => void;
}

const STEPS = [
  { label: "Apurando sua pontuação...", icon: Loader2 },
  { label: "Carregando respostas no ranking...", icon: BarChart3 },
  { label: "Calculando sua posição...", icon: Trophy },
  { label: "Pronto!", icon: CheckCircle2 },
];

export function ThankYouScreen({
  participantName,
  classId,
  className,
  score,
  totalTimeSeconds,
  onContinue,
}: ThankYouScreenProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const { playSound } = useSound();

  const sendWebhook = async (event: string) => {
    try {
      await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event,
          participantName,
          classId,
          className,
          score,
          totalTimeSeconds,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.error("Webhook error:", err);
    }
  };

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    // Step transitions: ~900ms each → ~3.6s total
    timers.push(setTimeout(() => setStepIndex(1), 900));
    timers.push(setTimeout(() => setStepIndex(2), 1800));
    timers.push(setTimeout(() => setStepIndex(3), 2700));
    timers.push(
      setTimeout(() => {
        sendWebhook("view_result");
        onContinue();
      }, 3600)
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-80 h-80 rounded-full bg-primary/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 rounded-full bg-secondary/10 blur-3xl animate-pulse" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10 text-center"
      >
        <motion.img
          src={churchLogo}
          alt="Logo ADREC"
          className="w-24 h-24 object-contain mx-auto mb-6 drop-shadow-[0_0_15px_rgba(76,201,224,0.4)]"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        />

        <h1 className="text-2xl font-display font-bold text-foreground mb-2">
          Quase lá, {participantName.split(" ")[0]}!
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          Estamos preparando seu resultado...
        </p>

        <div className="glass-card glow-border p-6 mb-6">
          <div className="space-y-4 mb-5 min-h-[140px]">
            <AnimatePresence mode="wait">
              {STEPS.map((step, idx) => {
                if (idx !== stepIndex) return null;
                const Icon = step.icon;
                const isDone = idx === STEPS.length - 1;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center ${
                        isDone ? "bg-green-500/15" : "bg-primary/15"
                      }`}
                    >
                      <Icon
                        className={`w-8 h-8 ${
                          isDone ? "text-green-500" : "text-primary"
                        } ${!isDone ? "animate-spin" : ""}`}
                      />
                    </div>
                    <p className="text-base font-semibold text-foreground">
                      {step.label}
                    </p>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full gradient-primary rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {Math.round(progress)}%
          </p>
        </div>

        <p className="text-xs text-muted-foreground/70 italic">
          Boa sorte no ranking! 🏆
        </p>
      </motion.div>
    </div>
  );
}
