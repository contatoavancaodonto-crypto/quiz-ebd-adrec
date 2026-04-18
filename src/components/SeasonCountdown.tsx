import { motion } from "framer-motion";
import { Clock, AlertTriangle } from "lucide-react";
import { useActiveSeason } from "@/hooks/useActiveSeason";
import { useCountdown } from "@/hooks/useCountdown";

interface SeasonCountdownProps {
  variant?: "full" | "compact";
}

export function SeasonCountdown({ variant = "full" }: SeasonCountdownProps) {
  const { data: season } = useActiveSeason();
  const countdown = useCountdown(season?.end_date);

  if (!season) return null;

  const isUrgent = countdown.totalMs > 0 && countdown.totalMs < 24 * 60 * 60 * 1000;
  const pad = (n: number) => String(n).padStart(2, "0");

  if (countdown.expired) {
    return (
      <div className="glass-card border border-destructive/40 bg-destructive/10 px-4 py-2 rounded-xl flex items-center gap-2 text-sm">
        <AlertTriangle className="w-4 h-4 text-destructive" />
        <span className="font-medium text-destructive">Temporada encerrada</span>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`glass-card px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-mono ${isUrgent ? "border border-destructive/50 text-destructive" : "text-foreground/80"}`}>
        <Clock className="w-3.5 h-3.5" />
        <span>
          {countdown.days}d {pad(countdown.hours)}:{pad(countdown.minutes)}:{pad(countdown.seconds)}
        </span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card glow-border p-4 rounded-2xl ${isUrgent ? "border-destructive/50" : ""}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Clock className={`w-4 h-4 ${isUrgent ? "text-destructive" : "text-primary"}`} />
        <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">
          {season.name} encerra em
        </p>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { label: "dias", value: countdown.days },
          { label: "horas", value: countdown.hours },
          { label: "min", value: countdown.minutes },
          { label: "seg", value: countdown.seconds },
        ].map((item) => (
          <div key={item.label} className="bg-background/40 rounded-lg py-2">
            <div className={`font-mono text-2xl font-bold ${isUrgent ? "text-destructive" : "text-primary"}`}>
              {pad(item.value)}
            </div>
            <div className="text-[10px] uppercase text-muted-foreground tracking-wider">
              {item.label}
            </div>
          </div>
        ))}
      </div>
      {isUrgent && (
        <p className="text-xs text-destructive text-center mt-2 font-medium">
          ⚠️ Últimas 24 horas!
        </p>
      )}
    </motion.div>
  );
}
