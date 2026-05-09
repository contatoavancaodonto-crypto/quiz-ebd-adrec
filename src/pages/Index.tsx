import { useEffect, useMemo, useCallback, useState } from "react";
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
  Bell,
  BookOpen,
  Music2,
  FileText,
  History,
  ArrowRight,
  AlertCircle,
  Timer,
  Users,
  Lock,
} from "lucide-react";
import churchLogo from "@/assets/church-logo.webp";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
// ... keep existing code
import { useQuizStore } from "@/stores/quizStore";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { WeeklyReadingCard } from "@/components/WeeklyReadingCard";
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
import { WeeklyVersesGrid } from "@/components/WeeklyVersesGrid";
import { WeeklyLessonCard } from "@/components/WeeklyLessonCard";
import { useWeeklyLessons } from "@/hooks/useWeeklyLessons";
import { useCurrentLesson, useNextLesson } from "@/hooks/useCurrentLesson";

import { toast } from "sonner";

const pad = (n: number) => String(n).padStart(2, "0");
const PROVAO_WINDOW_DAYS = 14;

const PROVAO_AVAILABLE_TRIMESTERS: number[] = [2];
const PROVAO_CLOSED_TRIMESTERS: number[] = [1];
const PROVAO_QUIZ_CLOSED = false;
const provaoClassIcons: Record<string, string> = {
  Adultos: "🤵🏻‍♂️🤵🏻‍♀️",
  Jovens: "🎺",
  Adolescentes: "🙆🏻‍♂️🙆🏻‍♀️",
};

const TOOL_TILES = [
  {
    label: "Bíblia",
    desc: "Leia online",
    icon: BookOpen,
    path: "/membro/biblia",
    bg: "from-indigo-500 to-blue-600",
  },
  {
    label: "Harpa",
    desc: "Hinos cristãos",
    icon: Music2,
    path: "/membro/harpa",
    bg: "from-rose-500 to-red-600",
  },
  {
    label: "Revista",
    desc: "Lições do tri.",
    icon: FileText,
    path: "/membro/revista",
    bg: "from-amber-500 to-orange-600",
  },
  {
    label: "Histórico",
    desc: "Suas tentativas",
    icon: History,
    path: "/membro/historico",
    bg: "from-emerald-500 to-green-600",
  },
];

const WeeklyLessonsList = () => {
  const { data: lessons, isLoading } = useWeeklyLessons();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-48 rounded-3xl" />
        ))}
      </div>
    );
  }

  if (!lessons || lessons.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground italic">
        Nenhuma lição encontrada.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {lessons.map((lesson, i) => (
        <WeeklyLessonCard key={lesson.id} lesson={lesson} index={i} />
      ))}
    </div>
  );
};

const WeeklyQuizCardSkeleton = () => (
  <section className="space-y-2">
    <SectionLabel color="primary" label="Quiz da lição" />
    <div className="rounded-3xl border border-primary/30 bg-card p-5 shadow-lg shadow-primary/5 space-y-4">
      <div className="flex items-start gap-3">
        <Skeleton className="shrink-0 w-12 h-12 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <Skeleton className="h-16 w-full rounded-2xl" />
      <div className="flex items-center gap-3">
        <Skeleton className="flex-1 h-12 rounded-xl" />
        <Skeleton className="w-28 h-12 rounded-xl" />
      </div>
    </div>
  </section>
);

const Index = () => {

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setParticipant, setChurch } = useQuizStore();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { data: season } = useActiveSeason();
  const seasonCountdown = useCountdown(season?.end_date);
  const seasonExpired = !!season && seasonCountdown.expired;

  const userClassId = profile?.class_id ?? null;

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["weekly-quiz"] });
    queryClient.invalidateQueries({ queryKey: ["next-quiz"] });
    queryClient.invalidateQueries({ queryKey: ["current-lesson"] });
    queryClient.invalidateQueries({ queryKey: ["next-lesson"] });
    queryClient.invalidateQueries({ queryKey: ["weekly-lessons"] });
    queryClient.invalidateQueries({ queryKey: ["weekly-attempt"] });
  }, [queryClient]);

  const { data: weeklyQuiz, isLoading: isLoadingWeeklyQuiz } = useWeeklyQuiz(userClassId);
  const { data: nextQuiz, isLoading: isLoadingNextQuiz } = useNextScheduledQuiz(userClassId);
  const { data: provao } = useTrimestralProvao(userClassId, season?.id);

  const fullName = profile
    ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
    : "";
  const { data: streak = 0 } = useParticipantStreak(fullName, season?.id);
  const weekClose = useCountdown(weeklyQuiz?.closes_at, handleRefresh);
  const nextOpen = useCountdown(nextQuiz?.opens_at, handleRefresh);
  const { data: currentLesson, isLoading: isLoadingCurrentLesson } = useCurrentLesson();
  const { data: nextLesson, isLoading: isLoadingNextLesson } = useNextLesson();

  useEffect(() => {
    // Sincronização adicional para troca de dia (meia-noite)
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const msToMidnight = tomorrow.getTime() - now.getTime();

    const timeout = setTimeout(() => {
      handleRefresh();
    }, msToMidnight + 1000);

    return () => clearTimeout(timeout);
  }, [handleRefresh]);

  const isQuizLoading =
    isLoadingWeeklyQuiz ||
    isLoadingNextQuiz ||
    isLoadingCurrentLesson ||
    isLoadingNextLesson;

  const PROVAO_START_WINDOW_DAYS = 7;

  const provaoStatus = useMemo(() => {
    if (!season?.end_date) return { available: false, daysToOpen: 0 };
    
    const endDate = new Date(season.end_date);
    const now = new Date();
    
    // Início da janela: 7 dias antes do fim do trimestre
    const openDate = new Date(endDate.getTime() - PROVAO_START_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    
    const diffTime = openDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const isAvailable = now >= openDate && now <= endDate;
    
    return {
      available: isAvailable,
      daysToOpen: diffDays > 0 ? diffDays : 0,
      openDate,
      endDate
    };
  }, [season?.end_date]);

  const showProvao = provaoStatus.available;

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

  // ===== Provão Trimestral (card no final da home) =====
  const [provaoSelectedTri, setProvaoSelectedTri] = useState<number>(2);
  const [provaoSelectedClass, setProvaoSelectedClass] = useState<{ id: string; name: string } | null>(null);
  const [provaoLoading, setProvaoLoading] = useState(false);

  const { data: allClasses } = useQuery({
    queryKey: ["classes-active"],
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

  const provaoIsDisabled =
    PROVAO_CLOSED_TRIMESTERS.includes(provaoSelectedTri) ||
    !PROVAO_AVAILABLE_TRIMESTERS.includes(provaoSelectedTri);

  const handleProvaoTriClick = (t: number) => {
    const isClosed = PROVAO_CLOSED_TRIMESTERS.includes(t);
    const isAvailable = PROVAO_AVAILABLE_TRIMESTERS.includes(t) && provaoStatus.available;

    if (isClosed) {
      setProvaoSelectedTri(t);
      return;
    }

    if (!isAvailable) {
      if (t === 2 && !provaoStatus.available) {
        toast.info(`📅 Provão disponível em ${provaoStatus.daysToOpen} dias!`);
      } else {
        toast.info(`📅 ${t}º Trimestre - Em breve!`);
      }
      return;
    }

    setProvaoSelectedTri(t);
  };

  const handleStartProvaoCard = async () => {
    if (seasonExpired) return toast.error("Este quiz foi encerrado.");
    if (PROVAO_QUIZ_CLOSED) return toast.error("⏰ Tempo esgotado!");
    if (!profile?.first_name) return toast.error("Perfil incompleto.");
    if (!provaoSelectedClass) return toast.error("Selecione uma turma.");
    if (PROVAO_CLOSED_TRIMESTERS.includes(provaoSelectedTri))
      return toast.info(`🔒 ${provaoSelectedTri}º Tri. encerrado.`);
    if (!provaoStatus.available)
      return toast.info(`📅 Disponível em ${provaoStatus.daysToOpen} dias!`);
    if (provaoSelectedClass.name === "Adolescentes")
      return toast.info("🚧 Em construção!");

    setProvaoLoading(true);
    try {
      const fullNameLocal = `${profile.first_name} ${profile.last_name ?? ""}`.trim();
      setParticipant(fullNameLocal, provaoSelectedClass.id, provaoSelectedClass.name, provaoSelectedTri, season?.id);
      if (profile.church_id && profile.church_name) {
        setChurch(profile.church_id, profile.church_name);
      }
      navigate("/quiz");
    } catch {
      toast.error("Erro ao iniciar.");
    } finally {
      setProvaoLoading(false);
    }
  };
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

  useRealtimeInvalidate(
    "quizzes",
    [["weekly-quiz"], ["next-quiz"], ["trimestral-provao"]],
    "index-quizzes"
  );

  useRealtimeInvalidate(
    "lessons",
    [["weekly-lessons"], ["current-lesson"], ["next-lesson"]],
    "index-lessons"
  );

  const startQuiz = (
    quizClassId: string,
    quizClassName: string,
    trimester: number,
    quizId?: string
  ) => {
    if (!profile?.first_name) return toast.error("Perfil incompleto.");
    const fullNameLocal = `${profile.first_name} ${profile.last_name ?? ""}`.trim();
    
    // Configura o store com os dados necessários
    setParticipant(fullNameLocal, quizClassId, quizClassName, trimester, season?.id);
    if (quizId) {
      // Se tivermos um ID de quiz específico, já deixamos no store
      useQuizStore.getState().setQuizId(quizId);
      console.log("Quiz ID definido no store:", quizId);
    }

    if (profile.church_id && profile.church_name) {
      setChurch(profile.church_id, profile.church_name);
    }
    navigate("/quiz");
  };

  const handleStartWeekly = () => {
    if (!weeklyQuiz) return toast.error("Quiz da lição não está disponível.");
    if (!userClass) return toast.error("Sua turma não foi encontrada no perfil.");
    if (alreadyAnsweredWeekly) {
      return toast.info("Você já respondeu o quiz desta lição 🎉");
    }
    if (weekClose.expired) return toast.error("Janela do quiz encerrada.");
    startQuiz(userClass.id, userClass.name, 2, weeklyQuiz.id);
  };

  const handleStartProvao = () => {
    if (!provao) return;
    if (!userClass) return toast.error("Sua turma não foi encontrada no perfil.");
    startQuiz(userClass.id, userClass.name, 2, provao.id);
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

  const effectiveLessonNumber =
    currentLesson?.lesson_number ??
    weeklyQuiz?.lesson_number ??
    weeklyQuiz?.week_number ??
    null;

  const lessonLabel =
    effectiveLessonNumber != null
      ? `Lição ${effectiveLessonNumber}`
      : "Quiz da lição";

  const heroTitle =
    effectiveLessonNumber != null && userClass?.name
      ? `Quiz da lição #${effectiveLessonNumber} - ${userClass.name}`
      : weeklyQuiz?.lesson_title ?? weeklyQuiz?.title ?? "";

  const heroSubtitle = currentLesson?.theme ?? weeklyQuiz?.lesson_title ?? null;
  const firstName = profile?.first_name ?? "amigo";

  // Saudação dinâmica
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <MemberLayout
      title="Início"
      mobileHeader={{ variant: "full" }}
      contentPaddingMobile={false}
      bottomNav={{
        showFab: !!weeklyQuiz && !alreadyAnsweredWeekly && !weekClose.expired,
        onFabClick: handleStartWeekly,
        fabLabel: "Quiz",
      }}
    >
      <div className="relative">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute top-40 -right-20 w-72 h-72 rounded-full bg-secondary/10 blur-3xl" />
        </div>

        <div className="px-4 pt-4 pb-6 space-y-5 relative z-10">
          {/* ===== HERO SAUDAÇÃO ===== */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-secondary via-secondary/90 to-primary p-6 shadow-xl shadow-secondary/20"
          >
            <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="absolute top-4 right-4 opacity-20">
              <BookMarked className="w-24 h-24 text-white" strokeWidth={1.2} />
            </div>

            <div className="relative">
              <div className="text-[10px] uppercase tracking-widest text-white/70 font-bold mb-1">
                {greeting}
              </div>
              <h1 className="text-3xl font-display font-extrabold text-white leading-tight">
                A paz do Senhor, {firstName} <span className="inline-block">🙏</span>
              </h1>
              <p className="text-sm text-white/85 mt-2 max-w-[80%]">
                {alreadyAnsweredWeekly
                  ? "Você já respondeu o quiz desta lição. Continue firme!"
                  : weeklyQuiz
                  ? "O quiz da lição está aberto. Bora estudar?"
                  : "Continue sua jornada de fé com a EBD."}
              </p>

              {streak > 0 && (
                <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur border border-white/20">
                  <Flame className="w-4 h-4 text-orange-300" />
                  <span className="text-xs font-bold text-white">
                    {streak} {streak === 1 ? "semana" : "semanas"} seguidas
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* ===== PLANO DE LEITURA POR LIÇÃO ===== */}
          <section className="space-y-4">
            <SectionLabel color="primary" label="Lições do Trimestre" />
            <WeeklyLessonsList />
          </section>

          {/* ===== QUIZ DA SEMANA — bloco principal ===== */}
          {isQuizLoading ? (
            <WeeklyQuizCardSkeleton />
          ) : weeklyQuiz && !seasonExpired ? (
            <section id="quiz-semanal-section" className="space-y-2">
    <SectionLabel color="primary" label="Quiz da lição" />

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="rounded-3xl border border-primary/30 bg-card p-5 shadow-lg shadow-primary/5 relative overflow-hidden"
              >
                {/* Alerta de Expiração Próxima (Menos de 6h para dom 23:59) */}
                {!weekClose.expired && weekClose.days === 0 && weekClose.hours < 6 && (
                  <div className="absolute top-0 left-0 right-0 py-1.5 px-3 bg-amber-500 text-white text-[10px] font-bold text-center flex items-center justify-center gap-1.5 animate-pulse z-20">
                    <AlertCircle className="w-3 h-3" />
                    ATENÇÃO: O quiz encerra hoje às 23:59!
                  </div>
                )}

                <div className="flex items-start gap-3 mb-3 mt-2">
                  <div className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30">
                    <Sparkles className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-primary font-bold">
                      {lessonLabel}
                    </div>
                    <h3 className="text-base font-bold text-foreground leading-tight">
                      {heroTitle || "Quiz semanal"}
                    </h3>
                    {heroSubtitle && (
                      <p className="text-[11px] text-primary/80 mt-0.5 line-clamp-1">
                        {heroSubtitle}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {weeklyQuiz.total_questions ?? 5} perguntas · até{" "}
                      <strong>dom 23h59</strong>
                    </p>
                  </div>
                </div>

                {weeklyQuiz.lesson_key_verse_ref && (
                  <div className="rounded-2xl bg-muted/50 border border-border/50 p-3 mb-3">
                    <div className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-1 flex items-center gap-1">
                      <BookMarked className="w-3 h-3" /> Versículo-chave
                    </div>
                    {weeklyQuiz.lesson_key_verse_text && (
                      <blockquote className="text-xs italic text-foreground leading-snug mb-1">
                        "{weeklyQuiz.lesson_key_verse_text}"
                      </blockquote>
                    )}
                    <div className="text-[11px] font-semibold text-primary">
                      {weeklyQuiz.lesson_key_verse_ref}
                    </div>
                  </div>
                )}

                {/* Linha countdown + CTA */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 rounded-xl bg-muted/40 border border-border/40 px-3 py-2">
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                      <Hourglass className="w-3 h-3" />
                      {weekClose.expired ? "Encerrado" : "Encerra em"}
                    </div>
                    <div className="font-mono text-sm font-bold text-foreground tabular-nums">
                      {weekCloseLabel}
                    </div>
                  </div>

                  {alreadyAnsweredWeekly ? (
                    <motion.button
                      disabled
                      className="shrink-0 px-4 py-2.5 rounded-xl bg-muted text-muted-foreground font-bold text-[11px] flex items-center gap-1.5 opacity-60 cursor-not-allowed border border-border"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Você já respondeu a lição dessa semana
                    </motion.button>
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={handleStartWeekly}
                      disabled={weekClose.expired}
                      className="shrink-0 px-4 py-2.5 rounded-xl gradient-primary text-primary-foreground font-bold text-sm flex items-center gap-1.5 shadow-lg shadow-primary/30 disabled:opacity-50"
                    >
                      Responder
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              </motion.div>
            </section>
          ) : nextQuiz && !seasonExpired ? (
            <section className="space-y-2">
              <SectionLabel color="primary" label="Próxima lição" />
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 text-center"
              >
                {/* Alerta de Lançamento Próximo (Menos de 6h para 00:00) */}
                {!nextOpen.expired && nextOpen.days === 0 && nextOpen.hours < 6 && (
                  <div className="absolute top-0 left-0 right-0 py-1 px-3 bg-indigo-600 text-white text-[9px] font-bold text-center flex items-center justify-center gap-1.5 animate-pulse z-20">
                    <Timer className="w-3 h-3" />
                    PREPARE-SE: Nova lição libera hoje à meia-noite!
                  </div>
                )}
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-2">
                  <CalendarClock className="w-6 h-6 text-primary" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Próxima lição
                  {(nextLesson?.lesson_number ?? nextQuiz.lesson_number ?? nextQuiz.week_number) != null
                    ? ` · #${nextLesson?.lesson_number ?? nextQuiz.lesson_number ?? nextQuiz.week_number}`
                    : ""}
                </div>
                <h2 className="text-base font-bold text-foreground mb-3">
                  {(nextLesson?.lesson_number != null && userClass?.name)
                    ? `Quiz semanal #${nextLesson.lesson_number} - ${userClass.name}`
                    : nextQuiz.lesson_title ?? nextQuiz.title}
                </h2>
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 font-mono text-sm text-primary">
                  <Hourglass className="w-4 h-4" />
                  Abre em{" "}
                  {nextOpen.days > 0
                    ? `${nextOpen.days}d ${nextOpen.hours}h`
                    : `${pad(nextOpen.hours)}:${pad(nextOpen.minutes)}`}
                </div>
              </motion.div>
            </section>
          ) : !seasonExpired ? (
            <section className="space-y-2">
              <SectionLabel color="muted" label="Quiz da lição" />
              <div className="rounded-3xl border border-border bg-muted/20 p-5 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-muted mb-2">
                  <Calendar className="w-6 h-6 text-muted-foreground" />
                </div>
                <h2 className="text-sm font-bold text-foreground mb-1">
                  Aguarde o próximo quiz
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Toda <strong>segunda às 00h00</strong> abrimos a próxima lição.
                </p>
              </div>
            </section>
          ) : null}

          {/* ===== FERRAMENTAS PRINCIPAIS — grid 2x2 ===== */}
          <section className="space-y-2">
            <SectionLabel color="warning" label="Ferramentas principais" />
            <div className="grid grid-cols-2 gap-3">
              {TOOL_TILES.map((t, i) => {
                const Icon = t.icon;
                return (
                  <motion.button
                    key={t.path}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(t.path)}
                    className={`relative overflow-hidden rounded-2xl p-4 text-left bg-gradient-to-br ${t.bg} text-white shadow-lg min-h-[120px] flex flex-col justify-between`}
                  >
                    <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/10 blur-xl" />
                    <Icon className="w-7 h-7 text-white drop-shadow" strokeWidth={1.8} />
                    <div className="relative">
                      <div className="text-base font-bold leading-tight">{t.label}</div>
                      <div className="text-[11px] text-white/80">{t.desc}</div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </section>

          {/* ===== PROVÃO TRIMESTRAL ===== */}
          <section className="space-y-2">
            <SectionLabel color="success" label="Provão trimestral" />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-5 space-y-4"
            >
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Provões trimestrais
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Acesse o provão de 20 perguntas de cada trimestre e garanta uma melhor posição.
                </p>
              </div>

              {PROVAO_QUIZ_CLOSED || seasonExpired ? (
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
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-2">
                      <Calendar className="w-3.5 h-3.5 inline mr-1" />
                      Trimestre
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4].map((t) => {
                        const closed = PROVAO_CLOSED_TRIMESTERS.includes(t);
                        const available = PROVAO_AVAILABLE_TRIMESTERS.includes(t);
                        const selectable = available || closed;
                        const active = provaoSelectedTri === t && selectable;
                        return (
                          <motion.button
                            key={t}
                            whileHover={{ scale: selectable ? 1.05 : 1 }}
                            whileTap={{ scale: selectable ? 0.95 : 1 }}
                            onClick={() => handleProvaoTriClick(t)}
                            className={`py-2.5 rounded-xl border-2 transition-all text-center cursor-pointer ${
                              active
                                ? "border-primary bg-primary/10 shadow-md"
                                : selectable
                                ? "border-border bg-muted/50 hover:border-primary/40"
                                : "border-border bg-muted/30 opacity-60"
                            } ${!available && t === 2 ? "relative" : ""}`}
                          >
                            <div className="text-sm font-bold text-foreground">
                              {t}º
                            </div>
                            <div className="text-[9px] text-muted-foreground">
                              {closed ? "Encerrado" : available ? "Tri." : (t === 2 ? `em ${provaoStatus.daysToOpen} dias` : "Em breve")}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-2">
                      <Users className="w-3.5 h-3.5 inline mr-1" />
                      Turma
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {allClasses?.map((cls) => (
                        <motion.button
                          key={cls.id}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setProvaoSelectedClass({ id: cls.id, name: cls.name })}
                          className={`p-2 rounded-xl border-2 transition-all text-center cursor-pointer flex flex-col items-center justify-center min-h-[80px] ${
                            provaoSelectedClass?.id === cls.id
                              ? "border-primary bg-primary/10 shadow-md"
                              : "border-border bg-muted/50 hover:border-primary/40"
                          }`}
                        >
                          <div className="text-base mb-1 leading-none h-5 flex items-center justify-center">
                            {provaoClassIcons[cls.name] || "📚"}
                          </div>
                          <div className="text-[11px] font-semibold text-foreground leading-tight">
                            {cls.name}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {PROVAO_CLOSED_TRIMESTERS.includes(provaoSelectedTri) ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(`/ranking?trimester=${provaoSelectedTri}`)}
                      className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-md bg-secondary text-secondary-foreground hover:shadow-lg cursor-pointer"
                    >
                      <Trophy className="w-4 h-4" />
                      Ver Ranking do {provaoSelectedTri}º Tri.
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: provaoIsDisabled ? 1 : 1.02 }}
                      whileTap={{ scale: provaoIsDisabled ? 1 : 0.98 }}
                      onClick={handleStartProvaoCard}
                      disabled={provaoLoading || provaoIsDisabled}
                      className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-shadow disabled:opacity-60 disabled:cursor-not-allowed ${
                        provaoIsDisabled
                          ? "bg-muted text-muted-foreground"
                          : "gradient-primary text-primary-foreground hover:shadow-lg cursor-pointer"
                      }`}
                    >
                      {provaoLoading ? (
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      ) : provaoIsDisabled ? (
                        <>
                          <Lock className="w-4 h-4" />
                          {provaoSelectedTri === 2 && !provaoStatus.available 
                            ? `Disponível em ${provaoStatus.daysToOpen} dias` 
                            : `${provaoSelectedTri}º Tri. indisponível`}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Iniciar {provaoSelectedTri}º Tri.
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </motion.button>
                  )}
                </>
              )}
            </motion.div>
          </section>

          {/* ===== ATALHO RANKING ===== */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/ranking")}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-yellow-500/15 to-amber-500/15 border border-yellow-500/30 flex items-center gap-3 hover:border-yellow-500/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-bold text-foreground">Ver Ranking</div>
              <div className="text-[11px] text-muted-foreground">
                Sua posição na turma e geral
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </motion.button>

          {/* ===== ARQUIVO TRIMESTRAL ===== */}
          <button
            onClick={() => navigate("/arquivo")}
            className="w-full py-3 rounded-xl text-xs text-muted-foreground hover:text-foreground border border-dashed border-border/60 flex items-center justify-center gap-2 transition-colors"
          >
            <Archive className="w-3.5 h-3.5" />
            Arquivo trimestral (provões anteriores)
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </MemberLayout>
  );
};

/* ---------- Section label helper ---------- */
function SectionLabel({
  label,
  color = "primary",
  inline = false,
}: {
  label: string;
  color?: "primary" | "secondary" | "warning" | "success" | "muted";
  inline?: boolean;
}) {
  const barColor =
    color === "primary"
      ? "bg-primary"
      : color === "secondary"
      ? "bg-secondary"
      : color === "warning"
      ? "bg-amber-500"
      : color === "success"
      ? "bg-emerald-500"
      : "bg-muted-foreground";

  return (
    <div className={`flex items-center gap-2 ${inline ? "" : "px-1"}`}>
      <span className={`block w-1 h-3.5 rounded-full ${barColor}`} />
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

export default Index;
