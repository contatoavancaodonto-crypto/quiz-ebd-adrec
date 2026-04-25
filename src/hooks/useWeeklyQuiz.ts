import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WeeklyQuiz {
  id: string;
  title: string;
  class_id: string;
  week_number: number | null;
  opens_at: string | null;
  closes_at: string | null;
  season_id: string | null;
}

/**
 * Quiz com janela aberta agora para a turma do usuário (se houver).
 * Retorna null se nenhuma turma for passada ou nenhum quiz aberto.
 */
export function useWeeklyQuiz(classId: string | null | undefined) {
  return useQuery({
    queryKey: ["weekly-quiz", classId],
    enabled: !!classId,
    refetchInterval: 60_000,
    queryFn: async (): Promise<WeeklyQuiz | null> => {
      const nowIso = new Date().toISOString();
      const { data } = await supabase
        .from("quizzes")
        .select("id, title, class_id, week_number, opens_at, closes_at, season_id")
        .eq("class_id", classId!)
        .eq("active", true)
        .lte("opens_at", nowIso)
        .gte("closes_at", nowIso)
        .order("week_number", { ascending: false })
        .limit(1);
      return (data?.[0] as WeeklyQuiz) ?? null;
    },
  });
}

/** Próximo quiz agendado (ainda fechado) para a turma */
export function useNextScheduledQuiz(classId: string | null | undefined) {
  return useQuery({
    queryKey: ["next-quiz", classId],
    enabled: !!classId,
    refetchInterval: 60_000,
    queryFn: async (): Promise<WeeklyQuiz | null> => {
      const nowIso = new Date().toISOString();
      const { data } = await supabase
        .from("quizzes")
        .select("id, title, class_id, week_number, opens_at, closes_at, season_id")
        .eq("class_id", classId!)
        .eq("active", true)
        .gt("opens_at", nowIso)
        .order("opens_at", { ascending: true })
        .limit(1);
      return (data?.[0] as WeeklyQuiz) ?? null;
    },
  });
}

/** Streak atual do participante na temporada */
export function useParticipantStreak(participantName: string | null | undefined, seasonId: string | null | undefined) {
  return useQuery({
    queryKey: ["streak", participantName?.toLowerCase().trim(), seasonId],
    enabled: !!participantName && !!seasonId,
    queryFn: async (): Promise<number> => {
      const key = participantName!.toLowerCase().trim();
      const { data } = await supabase
        .from("participant_streaks")
        .select("current_streak")
        .eq("participant_name", key)
        .eq("season_id", seasonId!)
        .maybeSingle();
      return data?.current_streak ?? 0;
    },
  });
}
