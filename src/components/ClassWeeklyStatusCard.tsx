import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CheckCircle2, Hourglass, Lock, CalendarClock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCountdown } from "@/hooks/useCountdown";

const classIcons: Record<string, string> = {
  Adultos: "🤵🏻‍♂️🤵🏻‍♀️",
  Jovens: "🎺",
  Adolescentes: "🙆🏻‍♂️🙆🏻‍♀️",
};

const pad = (n: number) => String(n).padStart(2, "0");

interface Props {
  classId: string;
  className: string;
}

export function ClassWeeklyStatusCard({ classId, className }: Props) {
  // Quiz aberto agora para esta turma
  const { data: openQuiz } = useQuery({
    queryKey: ["class-weekly-open", classId],
    refetchInterval: 60_000,
    queryFn: async () => {
      const nowIso = new Date().toISOString();
      const { data } = await supabase
        .from("quizzes")
        .select("id, title, week_number, opens_at, closes_at")
        .eq("class_id", classId)
        .eq("active", true)
        .lte("opens_at", nowIso)
        .gte("closes_at", nowIso)
        .order("week_number", { ascending: false })
        .limit(1);
      return data?.[0] ?? null;
    },
  });

  // Próximo quiz agendado para esta turma (se nenhum aberto)
  const { data: nextQuiz } = useQuery({
    queryKey: ["class-weekly-next", classId],
    enabled: !openQuiz,
    refetchInterval: 60_000,
    queryFn: async () => {
      const nowIso = new Date().toISOString();
      const { data } = await supabase
        .from("quizzes")
        .select("id, title, week_number, opens_at, closes_at")
        .eq("class_id", classId)
        .eq("active", true)
        .gt("opens_at", nowIso)
        .order("opens_at", { ascending: true })
        .limit(1);
      return data?.[0] ?? null;
    },
  });

  const closeCountdown = useCountdown(openQuiz?.closes_at);
  const openCountdown = useCountdown(nextQuiz?.opens_at);

  const closeLabel = useMemo(() => {
    if (!openQuiz) return null;
    if (closeCountdown.expired) return "Encerrado";
    if (closeCountdown.days > 0) {
      return `${closeCountdown.days}d ${pad(closeCountdown.hours)}h ${pad(closeCountdown.minutes)}m`;
    }
    return `${pad(closeCountdown.hours)}:${pad(closeCountdown.minutes)}:${pad(closeCountdown.seconds)}`;
  }, [closeCountdown, openQuiz]);

  const openLabel = useMemo(() => {
    if (!nextQuiz) return null;
    if (openCountdown.days > 0) {
      return `${openCountdown.days}d ${pad(openCountdown.hours)}h`;
    }
    return `${pad(openCountdown.hours)}:${pad(openCountdown.minutes)}`;
  }, [openCountdown, nextQuiz]);

  const isOpen = !!openQuiz && !closeCountdown.expired;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl border p-4 ${
        isOpen
          ? "border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-background to-background"
          : "border-border bg-muted/20"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl shrink-0">{classIcons[className] ?? "📖"}</span>
          <div className="min-w-0">
            <div className="text-sm font-bold text-foreground truncate">{className}</div>
            <div className="text-[10px] text-muted-foreground truncate">
              {openQuiz?.title ?? nextQuiz?.title ?? "Sem quiz agendado"}
            </div>
          </div>
        </div>
        <span
          className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            isOpen
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
              : "bg-muted text-muted-foreground border border-border"
          }`}
        >
          {isOpen ? (
            <>
              <CheckCircle2 className="w-3 h-3" /> Aberto
            </>
          ) : (
            <>
              <Lock className="w-3 h-3" /> Fechado
            </>
          )}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs">
        {isOpen ? (
          <>
            <Hourglass className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="text-muted-foreground">Encerra em</span>
            <span className="font-mono font-bold tabular-nums text-foreground">
              {closeLabel}
            </span>
          </>
        ) : nextQuiz ? (
          <>
            <CalendarClock className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-muted-foreground">Abre em</span>
            <span className="font-mono font-bold tabular-nums text-foreground">
              {openLabel}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground italic">
            Aguardando agendamento
          </span>
        )}
      </div>
    </motion.div>
  );
}
