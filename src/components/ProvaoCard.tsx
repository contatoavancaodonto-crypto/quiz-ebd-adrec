import { motion } from "framer-motion";
import { Sparkles, Hourglass, ChevronRight, Trophy, GraduationCap, Calendar } from "lucide-react";
import { useCountdown } from "@/hooks/useCountdown";
import { WeeklyQuiz } from "@/hooks/useWeeklyQuiz";
import { cn } from "@/lib/utils";

interface ProvaoCardProps {
  provao: WeeklyQuiz | null;
  seasonEndDate: string | null | undefined;
  onStart: () => void;
  isAnswered?: boolean;
  className?: string;
}

export const ProvaoCard = ({
  provao,
  seasonEndDate,
  onStart,
  isAnswered,
  className,
}: ProvaoCardProps) => {
  const seasonCountdown = useCountdown(seasonEndDate);
  
  // Cálculo de uma semana antes do final do trimestre
  const getAvailabilityDate = () => {
    if (!seasonEndDate) return null;
    const date = new Date(seasonEndDate);
    date.setDate(date.getDate() - 7);
    return date;
  };

  const availabilityDate = getAvailabilityDate();
  const isAvailable = availabilityDate ? Date.now() >= availabilityDate.getTime() : false;
  
  const pad = (n: number) => String(n).padStart(2, "0");
  
  const formatCountdown = () => {
    if (seasonCountdown.expired) return "Encerrado";
    if (seasonCountdown.days > 0) {
      return `${seasonCountdown.days}d ${pad(seasonCountdown.hours)}h ${pad(seasonCountdown.minutes)}m`;
    }
    return `${pad(seasonCountdown.hours)}:${pad(seasonCountdown.minutes)}:${pad(seasonCountdown.seconds)}`;
  };

  const availabilityLabel = availabilityDate 
    ? availabilityDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/5 via-card to-secondary/5 p-5 shadow-xl shadow-primary/5",
        className
      )}
    >
      {/* Background patterns */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
      
      <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
        <div className="flex items-center gap-4 flex-1">
          <div className="shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
            <Trophy className="w-8 h-8 text-primary-foreground" />
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">
                Trimestral
              </span>
              <div className="h-1 w-1 rounded-full bg-primary/30" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
                13 Perguntas
              </span>
            </div>
            <h3 className="text-xl font-display font-black text-foreground leading-tight">
              {provao?.title || "Provão Geral do Trimestre"}
            </h3>
            <p className="text-xs text-muted-foreground">
              O teste final para consolidar todo o seu aprendizado.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Cronômetro para encerrar o trimestre */}
          <div className="flex-1 md:flex-none md:min-w-[140px] rounded-2xl bg-muted/50 border border-border/50 px-4 py-3">
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5 mb-1">
              <Hourglass className="w-3 h-3" />
              Trimestre encerra em
            </div>
            <div className="font-mono text-lg font-black text-foreground tabular-nums">
              {formatCountdown()}
            </div>
          </div>

          {!isAvailable ? (
            <div className="flex-1 md:flex-none flex flex-col items-center justify-center px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600">
              <Calendar className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold uppercase text-center leading-tight">
                Provão disponível em <br/> {availabilityLabel}
              </span>
            </div>
          ) : isAnswered ? (
            <div className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-bold text-sm">
              <GraduationCap className="w-5 h-5" />
              Concluído
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              onClick={onStart}
              className="flex-1 md:flex-none gradient-primary text-primary-foreground font-black px-8 py-4 rounded-2xl shadow-lg shadow-primary/25 flex items-center justify-center gap-2 text-base transition-all"
            >
              Iniciar Provão
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
