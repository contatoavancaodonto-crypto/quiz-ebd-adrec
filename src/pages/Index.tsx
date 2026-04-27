import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  ChevronRight,
  Trophy,
  Calendar,
  Flame,
  CalendarClock,
  Hourglass,
  CheckCircle2,
  BookMarked,
  Archive,
  GraduationCap,
} from "lucide-react";
import churchLogo from "@/assets/church-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useQuizStore } from "@/stores/quizStore";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { DailyVerseCard } from "@/components/DailyVerseCard";
import { ClassWeeklyStatusCard } from "@/components/ClassWeeklyStatusCard";
import { useActiveSeason } from "@/hooks/useActiveSeason";
import { useCountdown } from "@/hooks/useCountdown";
import { MemberLayout } from "@/components/membro/MemberLayout";
import { useRealtimeInvalidate } from "@/hooks/useRealtimeInvalidate";
import {
  useWeeklyQuiz,
  useNextScheduledQuiz,
  useParticipantStreak,
  useTrimestralProvao,
} from "@/hooks/useWeeklyQuiz";
import { toast } from "sonner";

const pad = (n: number) => String(n).padStart(2, "0");
const PROVAO_WINDOW_DAYS = 14;

const Index = () => {
  const navigate = useNavigate();
  const { setParticipant, setChurch } = useQuizStore();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { data: season } = useActiveSeason();
  const seasonCountdown = useCountdown(season?.end_date);
  const seasonExpired = !!season && seasonCountdown.expired;

  const userClassId = profile?.class_id ?? null;
  const { data: weeklyQuiz } = useWeeklyQuiz(userClassId);
  const { data: nextQuiz } = useNextScheduledQuiz(userClassId);
  const { data: provao } = useTrimestralProvao(userClassId, season?.id);

  const fullName = profile
    ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
    : "";
  const { data: streak = 0 } = useParticipantStreak(fullName, season?.id);
  const weekClose = useCountdown(weeklyQuiz?.closes_at);
  const nextOpen = useCountdown(nextQuiz?.opens_at);

  // Provão aparece só se faltam <= 14 dias para o fim da temporada
  const showProvao = useMemo(() => {
    if (!provao || !season?.end_date) return false;
    const ms = new Date(season.end_date).getTime() - Date.now();
    return ms > 0 && ms <= PROVAO_WINDOW_DAYS * 86_400_000;
  }, [provao, season?.end_date]);

  const { data: userClass } = useQuery({
    queryKey: ["my-class", userClassId],
    enabled: !!userClassId,
    queryFn: async () => {
      const { data } = await supabase
        .from("classes")
        .select("id, name")
        .eq("id", userClassId!)
        .maybeSingle();
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

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [user, authLoading, navigate]);

  useRealtimeInvalidate("quizzes", [["weekly-quiz"], ["next-quiz"], ["trimestral-provao"]], "index-quizzes");

  const startQuiz = (quizClassId: string, quizClassName: string, trimester: number) => {
    if (!profile?.first_name) return toast.error("Perfil incompleto.");
    const fullNameLocal = `${profile.first_name} ${profile.last_name ?? ""}`.trim();
    setParticipant(fullNameLocal, quizClassId, quizClassName, trimester);
    if (profile.church_id && profile.church_name) {
      setChurch(profile.church_id, profile.church_name);
    }
    navigate("/quiz");
  };

  const handleStartWeekly = () => {
    if (!weeklyQuiz) return toast.error("Quiz da semana não está disponível.");
    if (!userClass) return toast.error("Sua turma não foi encontrada no perfil.");
    startQuiz(userClass.id, userClass.name, 2);
  };

  const handleStartProvao = () => {
    if (!provao) return;
    if (!userClass) return toast.error("Sua turma não foi encontrada no perfil.");
    startQuiz(userClass.id, userClass.name, 2);
  };

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

  const lessonLabel =
    weeklyQuiz?.lesson_number != null
      ? `Lição ${weeklyQuiz.lesson_number}`
      : weeklyQuiz?.week_number
      ? `Semana #${weeklyQuiz.week_number}`
      : "Quiz da Semana";

  const heroTitle = weeklyQuiz?.lesson_title ?? weeklyQuiz?.title ?? "";

  return (
    <MemberLayout title="Início">
      <div className="flex flex-col items-center p-4 relative overflow-hidden">
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
          {/* Header */}
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
              EBD Online
            </h1>
            <p className="text-muted-foreground text-xs font-semibold tracking-wide">
              CIMADSETA · 1º TRI. 2026 · ADREC
            </p>
            {profile && (
              <p className="text-xs text-muted-foreground mt-2">
                Olá,{" "}
                <span className="text-foreground font-semibold">
                  {profile.first_name}
                </span>
                {userClass?.name && (
                  <span className="text-[10px] text-muted-foreground/70 block mt-0.5">
                    Turma {userClass.name}
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
              <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-secondary/15 blur-3xl pointer-events-none" />

              <div className="relative space-y-4">
                {/* Top: badge lição + streak */}
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30">
                    <BookMarked className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      {lessonLabel} · Quiz semanal
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

                {/* Título da lição */}
                <div>
                  <h2 className="text-xl font-bold text-foreground leading-tight mb-1">
                    {heroTitle}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {weeklyQuiz.total_questions ?? 5} perguntas · responda até{" "}
                    <strong>domingo às 23h59</strong>. Cada semana consecutiva
                    soma <strong>+1 pt</strong> de bônus (até +5).
                  </p>
                </div>

                {/* Versículo-chave da lição */}
                {weeklyQuiz.lesson_key_verse_ref && (
                  <div className="rounded-2xl bg-background/60 backdrop-blur border border-border/60 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-1 flex items-center gap-1">
                      <BookMarked className="w-3 h-3" /> Versículo-chave
                    </div>
                    {weeklyQuiz.lesson_key_verse_text && (
                      <blockquote className="text-sm italic text-foreground leading-snug mb-1">
                        "{weeklyQuiz.lesson_key_verse_text}"
                      </blockquote>
                    )}
                    <div className="text-xs font-semibold text-primary">
                      {weeklyQuiz.lesson_key_verse_ref}
                    </div>
                  </div>
                )}

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
                Próxima lição
                {nextQuiz.lesson_number != null
                  ? ` · #${nextQuiz.lesson_number}`
                  : nextQuiz.week_number
                  ? ` · semana #${nextQuiz.week_number}`
                  : ""}
              </div>
              <h2 className="text-lg font-bold text-foreground mb-3">
                {nextQuiz.lesson_title ?? nextQuiz.title}
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
                Toda <strong>segunda às 00h00</strong> abrimos a próxima lição.
                Confira o ranking enquanto isso!
              </p>
            </motion.div>
          ) : null}

          {/* ============ PROVÃO TRIMESTRAL (condicional) ============ */}
          {showProvao && provao && !seasonExpired && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-background to-background p-5"
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-0.5">
                    Provão trimestral · {provao.total_questions ?? 13} perguntas
                  </div>
                  <h3 className="text-base font-bold text-foreground leading-tight mb-2">
                    {provao.title}
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleStartProvao}
                    className="w-full py-2.5 rounded-xl bg-amber-500 text-white font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    Acessar provão
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ============ VERSÍCULO DO DIA ============ */}
          <DailyVerseCard />

          {/* ============ STATUS DA MINHA TURMA ============ */}
          {userClass && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Minha turma
                </h3>
                <span className="text-[10px] text-muted-foreground">
                  Encerra dom · 23h59
                </span>
              </div>
              <ClassWeeklyStatusCard classId={userClass.id} className={userClass.name} />
            </motion.section>
          )}

          {/* ============ ATALHO RANKING ============ */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/ranking")}
            className="w-full py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 cursor-pointer transition-all bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 text-foreground hover:border-yellow-500/50"
          >
            <Trophy className="w-5 h-5 text-yellow-500" />
            Ver Ranking
            <ChevronRight className="w-4 h-4" />
          </motion.button>

          {/* ============ LINK ARQUIVO ============ */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate("/arquivo")}
            className="w-full py-3 rounded-xl text-xs text-muted-foreground hover:text-foreground border border-dashed border-border/60 flex items-center justify-center gap-2 transition-colors"
          >
            <Archive className="w-3.5 h-3.5" />
            Arquivo trimestral (provões anteriores)
            <ChevronRight className="w-3.5 h-3.5" />
          </motion.button>
        </motion.div>
      </div>
    </MemberLayout>
  );
};

export default Index;
