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
  lesson_number: number | null;
  lesson_title: string | null;
  lesson_key_verse_ref: string | null;
  lesson_key_verse_text: string | null;
  quiz_kind: string;
  total_questions: number;
}

const QUIZ_FIELDS =
  "id, title, class_id, week_number, opens_at, closes_at, season_id, lesson_number, lesson_title, lesson_key_verse_ref, lesson_key_verse_text, quiz_kind, total_questions";

/**
 * Quiz semanal aberto agora para a turma do usuário.
 * Filtra apenas quiz_kind = 'weekly'.
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
        .select(QUIZ_FIELDS)
        .eq("class_id", classId!)
        .eq("active", true)
        .eq("quiz_kind", "weekly")
        .lte("opens_at", nowIso)
        .gte("closes_at", nowIso)
        .order("week_number", { ascending: false })
        .limit(1);
      return (data?.[0] as WeeklyQuiz) ?? null;
    },
  });
}

/** Próximo quiz semanal agendado (ainda fechado) para a turma */
export function useNextScheduledQuiz(classId: string | null | undefined) {
  return useQuery({
    queryKey: ["next-quiz", classId],
    enabled: !!classId,
    refetchInterval: 60_000,
    queryFn: async (): Promise<WeeklyQuiz | null> => {
      const nowIso = new Date().toISOString();
      const { data } = await supabase
        .from("quizzes")
        .select(QUIZ_FIELDS)
        .eq("class_id", classId!)
        .eq("active", true)
        .eq("quiz_kind", "weekly")
        .gt("opens_at", nowIso)
        .order("opens_at", { ascending: true })
        .limit(1);
      return (data?.[0] as WeeklyQuiz) ?? null;
    },
  });
}

/**
 * Provão trimestral da turma na temporada atual.
 * Retorna o quiz com quiz_kind = 'trimestral' (independente de janela).
 */
export function useTrimestralProvao(
  classId: string | null | undefined,
  seasonId: string | null | undefined,
) {
  return useQuery({
    queryKey: ["trimestral-provao", classId, seasonId],
    enabled: !!classId && !!seasonId,
    queryFn: async (): Promise<WeeklyQuiz | null> => {
      const { data } = await supabase
        .from("quizzes")
        .select(QUIZ_FIELDS)
        .eq("class_id", classId!)
        .eq("season_id", seasonId!)
        .eq("active", true)
        .eq("quiz_kind", "trimestral")
        .order("created_at", { ascending: false })
        .limit(1);
      return (data?.[0] as WeeklyQuiz) ?? null;
    },
  });
}

/** Streak atual do participante na temporada */
export function useParticipantStreak(
  participantName: string | null | undefined,
  seasonId: string | null | undefined,
) {
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
