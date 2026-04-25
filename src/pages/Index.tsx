import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  Sparkles,
  ChevronRight,
  Trophy,
  Lock,
  Calendar,
  Flame,
  CalendarClock,
  Hourglass,
  CheckCircle2,
} from "lucide-react";
import churchLogo from "@/assets/church-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useQuizStore } from "@/stores/quizStore";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { DailyVerseCard } from "@/components/DailyVerseCard";
import { useActiveSeason } from "@/hooks/useActiveSeason";
import { useCountdown } from "@/hooks/useCountdown";
import { MemberLayout } from "@/components/membro/MemberLayout";
import { useRealtimeInvalidate } from "@/hooks/useRealtimeInvalidate";
import {
  useWeeklyQuiz,
  useNextScheduledQuiz,
  useParticipantStreak,
} from "@/hooks/useWeeklyQuiz";
import { toast } from "sonner";

const classIcons: Record<string, string> = {
  Adultos: "🤵🏻‍♂️🤵🏻‍♀️",
  Jovens: "🎺",
  Adolescentes: "🙆🏻‍♂️🙆🏻‍♀️",
};

const QUIZ_CLOSED = false;
const AVAILABLE_TRIMESTERS: number[] = [2];
const CLOSED_TRIMESTERS: number[] = [1];

const pad = (n: number) => String(n).padStart(2, "0");

const Index = () => {
  const [selectedClass, setSelectedClass] = useState<{ id: string; name: string } | null>(null);
  const [selectedTrimester, setSelectedTrimester] = useState<number>(2);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setParticipant, setChurch } = useQuizStore();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { data: season } = useActiveSeason();
  const seasonCountdown = useCountdown(season?.end_date);
  const seasonExpired = !!season && seasonCountdown.expired;

  // Quiz da semana baseado na turma do perfil ou na seleção
  const userClassId = (profile as any)?.class_id ?? selectedClass?.id ?? null;
  const { data: weeklyQuiz } = useWeeklyQuiz(userClassId);
  const { data: nextQuiz } = useNextScheduledQuiz(userClassId);
  const fullName = profile
    ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
    : "";
  const { data: streak = 0 } = useParticipantStreak(fullName, season?.id);
  const weekClose = useCountdown(weeklyQuiz?.closes_at);
  const nextOpen = useCountdown(nextQuiz?.opens_at);

  // Redireciona não-logados para /auth
  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [user, authLoading, navigate]);

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Já respondeu o quiz da semana?
  const { data: alreadyAnsweredWeekly } = useQuery({
    queryKey: ["weekly-attempt", weeklyQuiz?.id, fullName],
    enabled: !!weeklyQuiz?.id && !!fullName,
    queryFn: async () => {
      const { data: parts } = await supabase
        .from("participants")
        .select("id, name")
        .ilike("name", fullName);
      const ids = (parts ?? []).map((p) => p.id);
      if (ids.length === 0) return false;
      const { data } = await supabase
        .from("quiz_attempts")
        .select("id")
        .eq("quiz_id", weeklyQuiz!.id)
        .in("participant_id", ids)
        .not("finished_at", "is", null)
        .limit(1);
      return (data?.length ?? 0) > 0;
    },
  });

  useRealtimeInvalidate("classes", [["classes"]], "index");

  const handleTrimesterClick = (trimester: number) => {
    if (
      !AVAILABLE_TRIMESTERS.includes(trimester) &&
      !CLOSED_TRIMESTERS.includes(trimester)
    ) {
      toast.info(`📅 ${trimester}º Trimestre - Disponível em breve!`);
      return;
    }
    setSelectedTrimester(trimester);
  };

  const isQuizDisabled =
    CLOSED_TRIMESTERS.includes(selectedTrimester) ||
    !AVAILABLE_TRIMESTERS.includes(selectedTrimester);

  const handleStart = async () => {
    if (seasonExpired) {
      toast.error("Este quiz foi encerrado. Aguarde a próxima temporada.");
      return;
    }
    if (QUIZ_CLOSED) {
      toast.error("⏰ Tempo esgotado! O quiz não aceita mais respostas.");
      return;
    }
    if (!profile?.first_name) {
      toast.error("Perfil incompleto. Atualize seu cadastro.");
      return;
    }
    if (!selectedClass) {
      toast.error("Por favor, selecione uma turma.");
      return;
    }
    if (CLOSED_TRIMESTERS.includes(selectedTrimester)) {
      toast.info(`🔒 ${selectedTrimester}º Trimestre encerrado. Confira o ranking final!`);
      return;
    }
    if (!AVAILABLE_TRIMESTERS.includes(selectedTrimester)) {
      toast.info(`📅 ${selectedTrimester}º Trimestre - Disponível em breve!`);
      return;
    }
    if (selectedClass.name === "Adolescentes") {
      toast.info("🚧 Classe em construção, disponível no próximo trimestre!");
      return;
    }
    setLoading(true);
    try {
      const fullNameLocal = `${profile.first_name} ${profile.last_name ?? ""}`.trim();
      setParticipant(fullNameLocal, selectedClass.id, selectedClass.name, selectedTrimester);
      if (profile.church_id && profile.church_name) {
        setChurch(profile.church_id, profile.church_name);
      }
      navigate("/quiz");
    } catch {
      toast.error("Erro ao iniciar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartWeekly = async () => {
    if (!profile?.first_name) {
      toast.error("Perfil incompleto.");
      return;
    }
    if (!weeklyQuiz) {
      toast.error("Quiz da semana não está disponível.");
      return;
    }
    const cls = classes?.find((c) => c.id === weeklyQuiz.class_id);
    if (!cls) {
      toast.error("Turma não encontrada.");
      return;
    }
    const fullNameLocal = `${profile.first_name} ${profile.last_name ?? ""}`.trim();
    setParticipant(fullNameLocal, cls.id, cls.name, selectedTrimester);
    if (profile.church_id && profile.church_name) {
      setChurch(profile.church_id, profile.church_name);
    }
    navigate("/quiz");
  };

  // Formata countdown do fim da semana
  const weekCloseLabel = useMemo(() => {
    if (!weeklyQuiz) return null;
    if (weekClose.expired) return "Encerrado";
    if (weekClose.days > 0) {
      return `${weekClose.days}d ${pad(weekClose.hours)}h ${pad(weekClose.minutes)}m`;
    }
    return `${pad(weekClose.hours)}:${pad(weekClose.minutes)}:${pad(weekClose.seconds)}`;
  }, [weekClose, weeklyQuiz]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <MemberLayout title="Início">
      <div className="flex flex-col items-center p-4 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-secondary/5 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md relative z-10 space-y-5"
        >
          {/* Header compacto */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.05, duration: 0.4 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-background mb-2">
              <img
                src={churchLogo}
                alt="Logo ADREC"
                className="w-14 h-14 object-contain drop-shadow-[0_0_15px_rgba(76,201,224,0.3)]"
              />
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold gradient-text glow-text leading-tight">
              Quiz EBD online
            </h1>
            <p className="text-muted-foreground text-xs font-semibold tracking-wide">
              CIMADSETA
            </p>
            {profile && (
              <p className="text-xs text-muted-foreground mt-2">
                Olá,{" "}
                <span className="text-foreground font-semibold">
                  {profile.first_name}
                </span>
                {profile.church_name && (
                  <span className="text-[10px] text-muted-foreground/70 block mt-0.5">
                    {profile.church_name}
                  </span>
                )}
              </p>
            )}
          </motion.div>

          {/* ============ HERO: QUIZ DA SEMANA ============ */}
          {weeklyQuiz && !seasonExpired ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-background to-secondary/10 p-6 shadow-2xl shadow-primary/10"
            >
              {/* glow */}
              <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-secondary/15 blur-3xl pointer-events-none" />

              <div className="relative space-y-4">
                {/* Top row: badge semana + streak */}
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30">
                    <CalendarClock className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      Quiz da Semana
                      {weeklyQuiz.week_number ? ` · #${weeklyQuiz.week_number}` : ""}
                    </span>
                  </div>
                  {streak > 0 && (
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/15 border border-orange-500/30">
                      <Flame className="w-3.5 h-3.5 text-orange-500" />
                      <span className="text-xs font-bold text-orange-500">
                        {streak} {streak === 1 ? "semana" : "semanas"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Título */}
                <div>
                  <h2 className="text-xl font-bold text-foreground leading-tight mb-1">
                    {weeklyQuiz.title}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Responda até <strong>domingo às 23h59</strong>. Cada semana
                    consecutiva soma <strong>+1 pt</strong> de bônus (até +5).
                  </p>
                </div>

                {/* Countdown */}
                <div className="rounded-2xl bg-background/60 backdrop-blur border border-border/60 p-3 flex items-center gap-3">
                  <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Hourglass className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      {weekClose.expired ? "Janela encerrada" : "Encerra em"}
                    </div>
                    <div className="font-mono text-lg font-bold text-foreground tabular-nums">
                      {weekCloseLabel}
                    </div>
                  </div>
                </div>

                {/* CTA */}
                {alreadyAnsweredWeekly ? (
                  <div className="w-full py-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-semibold text-sm">
                      Você já respondeu esta semana
                    </span>
                  </div>
                ) : (
                  <motion.button
                    whileHover={{ scale: weekClose.expired ? 1 : 1.02 }}
                    whileTap={{ scale: weekClose.expired ? 1 : 0.98 }}
                    onClick={handleStartWeekly}
                    disabled={weekClose.expired}
                    className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-5 h-5" />
                    Responder Quiz da Semana
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                )}
              </div>
            </motion.div>
          ) : nextQuiz && !seasonExpired ? (
            // ============ HERO: PRÓXIMO QUIZ AGENDADO ============
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-muted/40 via-background to-background p-6 text-center"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-3">
                <CalendarClock className="w-7 h-7 text-primary" />
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Próximo quiz
                {nextQuiz.week_number ? ` · semana #${nextQuiz.week_number}` : ""}
              </div>
              <h2 className="text-lg font-bold text-foreground mb-3">
                {nextQuiz.title}
              </h2>
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 font-mono text-sm text-primary">
                <Hourglass className="w-4 h-4" />
                Abre em{" "}
                {nextOpen.days > 0
                  ? `${nextOpen.days}d ${nextOpen.hours}h`
                  : `${pad(nextOpen.hours)}:${pad(nextOpen.minutes)}`}
              </div>
              {streak > 0 && (
                <p className="text-xs text-muted-foreground mt-3">
                  Sua sequência atual:{" "}
                  <span className="inline-flex items-center gap-1 text-orange-500 font-bold">
                    <Flame className="w-3.5 h-3.5" /> {streak}
                  </span>
                </p>
              )}
            </motion.div>
          ) : !seasonExpired ? (
            // ============ HERO: SEM QUIZ AGENDADO ============
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="relative overflow-hidden rounded-3xl border border-border bg-muted/20 p-6 text-center"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-muted mb-3">
                <Calendar className="w-7 h-7 text-muted-foreground" />
              </div>
              <h2 className="text-base font-bold text-foreground mb-1">
                Aguarde o próximo quiz
              </h2>
              <p className="text-xs text-muted-foreground">
                Toda <strong>segunda às 00h00</strong> abrimos um novo quiz
                semanal. Confira o ranking enquanto isso!
              </p>
            </motion.div>
          ) : null}

          {/* ============ VERSÍCULO DO DIA ============ */}
          <DailyVerseCard />

          {/* ============ ATALHO RANKING ============ */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/ranking?trimester=${selectedTrimester}`)}
            className="w-full py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 cursor-pointer transition-all bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 text-foreground hover:border-yellow-500/50"
          >
            <Trophy className="w-5 h-5 text-yellow-500" />
            Ver Ranking
            <ChevronRight className="w-4 h-4" />
          </motion.button>

          {/* ============ ARQUIVO TRIMESTRAL (secundário) ============ */}
          <motion.details
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl overflow-hidden group"
          >
            <summary className="cursor-pointer p-4 flex items-center justify-between gap-2 list-none">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">
                  Arquivo trimestral
                </span>
                <span className="text-[10px] text-muted-foreground">(legado)</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-90" />
            </summary>

            <div className="p-4 pt-0 space-y-4">
              <p className="text-xs text-muted-foreground">
                Acesse os quizzes trimestrais anteriores ou os ainda em
                andamento.
              </p>

              {QUIZ_CLOSED || seasonExpired ? (
                <div className="text-center space-y-2 py-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10">
                    <Lock className="w-6 h-6 text-destructive" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {seasonExpired
                      ? "Temporada encerrada."
                      : "Período de respostas encerrado."}
                  </p>
                </div>
              ) : (
                <>
                  {/* Trimester selection */}
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-2">
                      <Calendar className="w-3.5 h-3.5 inline mr-1" />
                      Trimestre
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4].map((t) => {
                        const closed = CLOSED_TRIMESTERS.includes(t);
                        const available = AVAILABLE_TRIMESTERS.includes(t);
                        const selectable = available || closed;
                        const active =
                          selectedTrimester === t && selectable;
                        return (
                          <motion.button
                            key={t}
                            whileHover={{ scale: selectable ? 1.05 : 1 }}
                            whileTap={{ scale: selectable ? 0.95 : 1 }}
                            onClick={() => handleTrimesterClick(t)}
                            className={`py-2.5 rounded-xl border-2 transition-all text-center cursor-pointer ${
                              active
                                ? "border-primary bg-primary/10 shadow-md"
                                : selectable
                                ? "border-border bg-muted/50 hover:border-primary/40"
                                : "border-border bg-muted/30 opacity-60"
                            }`}
                          >
                            <div className="text-sm font-bold text-foreground">
                              {t}º
                            </div>
                            <div className="text-[9px] text-muted-foreground">
                              {closed ? "Encerrado" : available ? "Tri." : "Em breve"}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Class selection */}
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-2">
                      <Users className="w-3.5 h-3.5 inline mr-1" />
                      Turma
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {classes?.map((cls) => (
                        <motion.button
                          key={cls.id}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() =>
                            setSelectedClass({ id: cls.id, name: cls.name })
                          }
                          className={`p-2 rounded-xl border-2 transition-all text-center cursor-pointer flex flex-col items-center justify-center min-h-[80px] ${
                            selectedClass?.id === cls.id
                              ? "border-primary bg-primary/10 shadow-md"
                              : "border-border bg-muted/50 hover:border-primary/40"
                          }`}
                        >
                          <div className="text-base mb-1 whitespace-nowrap leading-none h-5 flex items-center justify-center">
                            {classIcons[cls.name] || "📚"}
                          </div>
                          <div className="text-[11px] font-semibold text-foreground leading-tight">
                            {cls.name}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Start button */}
                  <motion.button
                    whileHover={{ scale: isQuizDisabled ? 1 : 1.02 }}
                    whileTap={{ scale: isQuizDisabled ? 1 : 0.98 }}
                    onClick={handleStart}
                    disabled={loading || isQuizDisabled}
                    className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-shadow disabled:opacity-60 disabled:cursor-not-allowed ${
                      isQuizDisabled
                        ? "bg-muted text-muted-foreground"
                        : "gradient-primary text-primary-foreground hover:shadow-lg cursor-pointer"
                    }`}
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : isQuizDisabled ? (
                      <>
                        <Lock className="w-4 h-4" />
                        {selectedTrimester}º Tri. Encerrado
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Iniciar {selectedTrimester}º Tri.
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </>
              )}
            </div>
          </motion.details>
        </motion.div>
      </div>
    </MemberLayout>
  );
};

export default Index;
