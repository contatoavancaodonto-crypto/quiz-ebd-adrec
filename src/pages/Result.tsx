import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Clock, Target, BarChart3, ArrowRight, Church, Medal } from "lucide-react";
import churchLogo from "@/assets/church-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useQuizStore } from "@/stores/quizStore";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ThankYouScreen } from "@/components/ThankYouScreen";
import { BadgesShowcase } from "@/components/BadgesShowcase";
import { formatTimeMs } from "@/hooks/useTimer";

function getPerformanceMessage(pct: number) {
  if (pct >= 90) return { text: "Excelente! 🌟", color: "text-green-500" };
  if (pct >= 70) return { text: "Muito bom! 👏", color: "text-primary" };
  if (pct >= 50) return { text: "Bom! 👍", color: "text-yellow-500" };
  return { text: "Precisa melhorar 📖", color: "text-destructive" };
}

function formatTimeFallback(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

const TOTAL_QUESTIONS = 13;

interface MiniRankEntry {
  attempt_id: string;
  position: number;
  participant_name: string;
  score: number;
  total_time_seconds: number;
  total_time_ms?: number;
  church_name?: string | null;
  class_name?: string;
}

const ResultPage = () => {
  const navigate = useNavigate();
  const store = useQuizStore();
  const [classRank, setClassRank] = useState<number | null>(null);
  const [generalRank, setGeneralRank] = useState<number | null>(null);
  const [churchRank, setChurchRank] = useState<number | null>(null);
  const [churchTop, setChurchTop] = useState<MiniRankEntry[]>([]);
  const [generalTop, setGeneralTop] = useState<MiniRankEntry[]>([]);
  const [showThankYou, setShowThankYou] = useState(true);
  const [streakBonus, setStreakBonus] = useState<number>(0);
  const [streakAt, setStreakAt] = useState<number>(0);
  const [weekNumber, setWeekNumber] = useState<number | null>(null);

  const score = store.score;
  const pct = Math.round((score / TOTAL_QUESTIONS) * 100);
  const perf = getPerformanceMessage(pct);
  const timeStr = store.totalTimeMs > 0 ? formatTimeMs(store.totalTimeMs) : formatTimeFallback(store.totalTimeSeconds);
  const finalScore = score + streakBonus;

  useEffect(() => {
    if (!store.attemptId) {
      navigate("/");
      return;
    }

    const fetchAll = async () => {
      // Refetch attempt para pegar streak_bonus calculado pelo trigger
      const { data: attempt } = await supabase
        .from("quiz_attempts")
        .select("streak_bonus, streak_at_attempt, week_number")
        .eq("id", store.attemptId)
        .maybeSingle();
      if (attempt) {
        setStreakBonus(attempt.streak_bonus ?? 0);
        setStreakAt(attempt.streak_at_attempt ?? 0);
        setWeekNumber(attempt.week_number ?? null);
      }

      const [{ data: cr }, { data: gr }] = await Promise.all([
        supabase.from("ranking_by_class").select("position").eq("attempt_id", store.attemptId).maybeSingle(),
        supabase.from("ranking_general").select("position, church_id").eq("attempt_id", store.attemptId).maybeSingle(),
      ]);
      if (cr) setClassRank(Number(cr.position));
      if (gr) setGeneralRank(Number(gr.position));

      const churchId = store.churchId || (gr as any)?.church_id;

      // Top 5 geral
      const { data: top } = await supabase
        .from("ranking_general")
        .select("attempt_id, position, participant_name, score, total_time_seconds, total_time_ms, church_name, class_name")
        .eq("trimester", store.trimester)
        .order("position")
        .limit(5);
      setGeneralTop((top as MiniRankEntry[]) || []);

      // Ranking da Igreja
      if (churchId) {
        const { data: ch } = await supabase
          .from("ranking_general")
          .select("attempt_id, position, participant_name, score, total_time_seconds, total_time_ms, church_name")
          .eq("trimester", store.trimester)
          .eq("church_id", churchId)
          .order("position")
          .limit(10);
        const list = (ch as MiniRankEntry[]) || [];
        setChurchTop(list);
        const me = list.find((e) => e.attempt_id === store.attemptId);
        if (me) setChurchRank(me.position);
      }
    };
    // pequeno delay para garantir trigger ter rodado
    setTimeout(fetchAll, 600);
  }, [store.attemptId, store.churchId, store.trimester, navigate]);

  if (showThankYou) {
    return (
      <ThankYouScreen
        participantName={store.participantName}
        classId={store.classId}
        className={store.className}
        score={store.score}
        totalTimeSeconds={store.totalTimeSeconds}
        onContinue={() => setShowThankYou(false)}
      />
    );
  }

  const stats = [
    { icon: Target, label: "Pontuação", value: `${score}/${TOTAL_QUESTIONS}`, sub: `${pct}%` },
    { icon: Clock, label: "Tempo", value: timeStr, sub: "mm:ss:cc" },
    { icon: Trophy, label: "Ranking Turma", value: classRank ? `#${classRank}` : "—", sub: store.className },
    { icon: BarChart3, label: "Ranking Geral", value: generalRank ? `#${generalRank}` : "—", sub: "Todas igrejas" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start p-4 pt-8 relative">
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
            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-background mb-3"
          >
            <img src={churchLogo} alt="Logo ADREC" className="w-20 h-20 object-contain drop-shadow-[0_0_15px_rgba(76,201,224,0.3)]" />
          </motion.div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-1">{store.participantName}</h1>
          {store.churchName && <p className="text-xs text-muted-foreground/70 mb-1">{store.churchName}</p>}
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
              <div className="text-xl font-display font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              {s.sub && <div className="text-[10px] text-primary mt-0.5">{s.sub}</div>}
            </motion.div>
          ))}
        </div>

        {/* Streak / bônus semanal */}
        {weekNumber !== null && streakAt > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="glass-card glow-border p-4 mb-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔥</span>
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {streakAt} {streakAt === 1 ? "semana" : "semanas"} seguidas
                  </div>
                  <div className="text-[11px] text-muted-foreground">Semana {weekNumber}</div>
                </div>
              </div>
              {streakBonus > 0 && (
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Bônus</div>
                  <div className="text-lg font-bold text-primary">+{streakBonus}</div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between text-xs border-t border-border/50 pt-2 mt-2">
              <span className="text-muted-foreground">Acertos: <strong className="text-foreground">{score}</strong> + Bônus: <strong className="text-primary">{streakBonus}</strong></span>
              <span className="font-bold text-foreground">Total: {finalScore} pts</span>
            </div>
            {streakAt >= 3 && (
              <p className="text-[11px] text-primary mt-2 text-center">
                Continue assim! Sua consistência está fazendo a diferença. 🙌
              </p>
            )}
          </motion.div>
        )}

        {/* Badges conquistados */}
        <BadgesShowcase attemptId={store.attemptId} participantId={store.participantId} />

        {/* Ranking da Igreja */}
        {churchTop.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card glow-border p-4 mb-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Church className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Ranking da Igreja</h3>
              </div>
              {churchRank && <span className="text-xs text-primary font-bold">Você: #{churchRank}</span>}
            </div>
            <div className="space-y-1.5">
              {churchTop.slice(0, 5).map((e) => {
                const isMe = e.attempt_id === store.attemptId;
                const t = e.total_time_ms && e.total_time_ms > 0 ? formatTimeMs(e.total_time_ms) : formatTimeFallback(e.total_time_seconds);
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
                    <span className={`flex-1 truncate ${isMe ? "text-foreground font-semibold" : "text-foreground"}`}>
                      {e.participant_name} {isMe && "← você"}
                    </span>
                    <span className="font-mono text-muted-foreground">{e.score}</span>
                    <span className="font-mono text-muted-foreground text-[10px]">{t}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Ranking Geral - top 5 */}
        {generalTop.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="glass-card p-4 mb-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Medal className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Top 5 Geral</h3>
            </div>
            <div className="space-y-1.5">
              {generalTop.map((e) => {
                const isMe = e.attempt_id === store.attemptId;
                const t = e.total_time_ms && e.total_time_ms > 0 ? formatTimeMs(e.total_time_ms) : formatTimeFallback(e.total_time_seconds);
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
                        {e.participant_name}
                      </div>
                      {e.church_name && (
                        <div className="text-[10px] text-muted-foreground/70 truncate">{e.church_name}</div>
                      )}
                    </div>
                    <span className="font-mono text-muted-foreground">{e.score}</span>
                    <span className="font-mono text-muted-foreground text-[10px]">{t}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Low score retry */}
        {score < 5 && !store.hasRetried && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card glow-border p-4 mb-4 text-center"
          >
            <p className="text-sm text-muted-foreground mb-3">
              Você não atingiu a pontuação mínima de 5 acertos para aparecer no ranking. Você tem <strong>1 chance</strong> de tentar novamente!
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                store.retryQuiz();
                navigate("/quiz");
              }}
              className="w-full py-3.5 rounded-xl gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              🔄 Tentar Novamente
            </motion.button>
          </motion.div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/gabarito")}
            className="w-full py-3.5 rounded-xl border-2 border-primary/40 bg-primary/5 text-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors cursor-pointer"
          >
            📝 Meu Gabarito
          </motion.button>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() =>
              navigate("/ranking", {
                state: { classId: store.classId, className: store.className, churchId: store.churchId },
              })
            }
            className="w-full py-3.5 rounded-xl gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 shadow-lg cursor-pointer"
          >
            🏆 Ver Ranking Completo
            <ArrowRight className="w-4 h-4" />
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
            Voltar ao Início
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default ResultPage;
