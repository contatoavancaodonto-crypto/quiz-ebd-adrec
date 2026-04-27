import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Globe, Loader2, WifiOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatTimeMs } from "@/hooks/useTimer";
import { useRealtimeRanking } from "@/hooks/useRealtimeRanking";

interface Props {
  quizId: string;
  attemptId: string;
  classId: string;
  className?: string;
}

interface RankRow {
  attempt_id: string;
  participant_id: string;
  participant_name: string;
  class_id: string;
  class_name?: string;
  score: number;
  final_score: number;
  total_time_ms: number;
  total_time_seconds: number;
  position: number;
}

function formatTimeFallback(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function WeeklyRankings({ quizId, attemptId, classId, className }: Props) {
  const [lessonNumber, setLessonNumber] = useState<number | null>(null);
  const [classRank, setClassRank] = useState<RankRow[]>([]);
  const [generalRank, setGeneralRank] = useState<RankRow[]>([]);
  const [myClassPos, setMyClassPos] = useState<number | null>(null);
  const [myGeneralPos, setMyGeneralPos] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!quizId) return;
    const run = async () => {
      // 1) Pega lesson_number e season do quiz atual
      const { data: quiz } = await supabase
        .from("quizzes")
        .select("lesson_number, season_id, quiz_kind")
        .eq("id", quizId)
        .maybeSingle();

      if (!quiz?.lesson_number) {
        setLoading(false);
        return;
      }
      setLessonNumber(quiz.lesson_number);

      // 2) Pega todos quizzes weekly da mesma lesson_number (todas turmas)
      const { data: lessonQuizzes } = await supabase
        .from("quizzes")
        .select("id, class_id")
        .eq("lesson_number", quiz.lesson_number)
        .eq("quiz_kind", "weekly")
        .eq("season_id", quiz.season_id);

      const quizIds = (lessonQuizzes || []).map((q) => q.id);
      const quizClassMap = new Map<string, string>(
        (lessonQuizzes || []).map((q) => [q.id, q.class_id])
      );
      if (quizIds.length === 0) {
        setLoading(false);
        return;
      }

      // 3) Busca attempts finalizadas desses quizzes
      const { data: attempts } = await supabase
        .from("quiz_attempts")
        .select("id, participant_id, quiz_id, score, final_score, total_time_ms, total_time_seconds, finished_at")
        .in("quiz_id", quizIds)
        .not("finished_at", "is", null);

      if (!attempts || attempts.length === 0) {
        setLoading(false);
        return;
      }

      // 4) Busca participantes para nomes
      const participantIds = [...new Set(attempts.map((a) => a.participant_id))];
      const { data: participants } = await supabase
        .from("participants")
        .select("id, name, class_id")
        .in("id", participantIds);

      const partMap = new Map(
        (participants || []).map((p) => [p.id, { name: p.name, class_id: p.class_id }])
      );

      // 5) Busca classes para nomes
      const classIds = [...new Set((participants || []).map((p) => p.class_id).filter(Boolean))];
      const { data: classes } = await supabase
        .from("classes")
        .select("id, name")
        .in("id", classIds);
      const classMap = new Map((classes || []).map((c) => [c.id, c.name]));

      // 6) Mantém só a melhor tentativa por participante (maior final_score, menor tempo)
      const bestByParticipant = new Map<string, any>();
      for (const a of attempts) {
        const cur = bestByParticipant.get(a.participant_id);
        const aFinal = a.final_score ?? a.score;
        const cFinal = cur ? (cur.final_score ?? cur.score) : -1;
        if (
          !cur ||
          aFinal > cFinal ||
          (aFinal === cFinal && (a.total_time_ms ?? Number.MAX_SAFE_INTEGER) < (cur.total_time_ms ?? Number.MAX_SAFE_INTEGER))
        ) {
          bestByParticipant.set(a.participant_id, a);
        }
      }

      const rows: RankRow[] = Array.from(bestByParticipant.values())
        .map((a) => {
          const p = partMap.get(a.participant_id);
          const cId = quizClassMap.get(a.quiz_id) || p?.class_id || "";
          return {
            attempt_id: a.id,
            participant_id: a.participant_id,
            participant_name: p?.name || "—",
            class_id: cId,
            class_name: classMap.get(cId),
            score: a.score,
            final_score: a.final_score ?? a.score,
            total_time_ms: a.total_time_ms ?? 0,
            total_time_seconds: a.total_time_seconds ?? 0,
            position: 0,
          };
        });

      // 7) Ranking GERAL: todos
      const general = [...rows].sort((x, y) => {
        if (y.final_score !== x.final_score) return y.final_score - x.final_score;
        return (x.total_time_ms || Number.MAX_SAFE_INTEGER) - (y.total_time_ms || Number.MAX_SAFE_INTEGER);
      }).map((r, i) => ({ ...r, position: i + 1 }));

      // 8) Ranking TURMA: filtra por classId
      const turma = general
        .filter((r) => r.class_id === classId)
        .map((r, i) => ({ ...r, position: i + 1 }));

      setGeneralRank(general);
      setClassRank(turma);

      const meG = general.find((r) => r.attempt_id === attemptId);
      const meC = turma.find((r) => r.attempt_id === attemptId);
      setMyGeneralPos(meG?.position ?? null);
      setMyClassPos(meC?.position ?? null);
      setLoading(false);
    };
    run();
  }, [quizId, attemptId, classId]);

  if (loading || (classRank.length === 0 && generalRank.length === 0)) {
    return null;
  }

  const renderRow = (e: RankRow) => {
    const isMe = e.attempt_id === attemptId;
    const t = e.total_time_ms > 0 ? formatTimeMs(e.total_time_ms) : formatTimeFallback(e.total_time_seconds);
    return (
      <div
        key={e.attempt_id}
        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${
          isMe ? "bg-primary/15 border border-primary/30" : "bg-muted/40"
        }`}
      >
        <span className={`w-5 text-center font-bold ${isMe ? "text-primary" : "text-muted-foreground"}`}>
          {e.position}
        </span>
        <div className="flex-1 min-w-0">
          <div className={`truncate ${isMe ? "text-foreground font-semibold" : "text-foreground"}`}>
            {e.participant_name} {isMe && "← você"}
          </div>
          {e.class_name && (
            <div className="text-[10px] text-muted-foreground/70 truncate">{e.class_name}</div>
          )}
        </div>
        <span className="font-mono text-foreground">{e.final_score}</span>
        <span className="font-mono text-muted-foreground text-[10px]">{t}</span>
      </div>
    );
  };

  return (
    <>
      {classRank.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="glass-card glow-border p-4 mb-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Ranking da Turma {className && `· ${className}`}
              </h3>
            </div>
            {myClassPos && <span className="text-xs text-primary font-bold">Você: #{myClassPos}</span>}
          </div>
          <p className="text-[10px] text-muted-foreground mb-2">
            Quiz da semana {lessonNumber ? `· Lição ${lessonNumber}` : ""} · desempate por tempo
          </p>
          <div className="space-y-1.5">
            {classRank.slice(0, 5).map(renderRow)}
          </div>
        </motion.div>
      )}

      {generalRank.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="glass-card p-4 mb-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Ranking Geral da Semana</h3>
            </div>
            {myGeneralPos && <span className="text-xs text-primary font-bold">Você: #{myGeneralPos}</span>}
          </div>
          <p className="text-[10px] text-muted-foreground mb-2">
            Todas as turmas {lessonNumber ? `· Lição ${lessonNumber}` : ""} · desempate por tempo
          </p>
          <div className="space-y-1.5">
            {generalRank.slice(0, 5).map(renderRow)}
          </div>
        </motion.div>
      )}
    </>
  );
}
