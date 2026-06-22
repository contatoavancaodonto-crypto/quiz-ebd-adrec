import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TrimesterProgress {
  completedLesson13: boolean;
  completedExam: boolean;
}

/**
 * Deriva o progresso do participante no trimestre a partir de quiz_attempts.
 * - completedLesson13: existe attempt finalizado de um quiz weekly com lesson_number = 13
 * - completedExam: existe attempt finalizado com quiz_kind = 'trimestral'
 */
export function useTrimesterProgress(
  fullName: string | null | undefined,
  seasonId: string | null | undefined,
  classId: string | null | undefined,
) {
  return useQuery({
    queryKey: ["trimester-progress", fullName?.toLowerCase().trim(), seasonId, classId],
    enabled: !!fullName && !!seasonId,
    staleTime: 30_000,
    queryFn: async (): Promise<TrimesterProgress> => {
      const result: TrimesterProgress = { completedLesson13: false, completedExam: false };

      const { data: parts } = await supabase
        .from("participants")
        .select("id")
        .ilike("name", fullName!);
      const ids = (parts ?? []).map((p) => p.id);
      if (ids.length === 0) return result;

      // Tentativas finalizadas do participante na temporada
      const { data: attempts } = await supabase
        .from("quiz_attempts")
        .select("id, quiz_id")
        .in("participant_id", ids)
        .eq("season_id", seasonId!)
        .not("finished_at", "is", null);

      const quizIds = Array.from(new Set((attempts ?? []).map((a) => a.quiz_id).filter(Boolean))) as string[];
      if (quizIds.length === 0) return result;

      const { data: quizzes } = await supabase
        .from("quizzes")
        .select("id, quiz_kind, lesson_number, class_id")
        .in("id", quizIds);

      for (const q of quizzes ?? []) {
        if (classId && q.class_id && q.class_id !== classId) continue;
        if (q.quiz_kind === "trimestral") result.completedExam = true;
        if (q.quiz_kind === "weekly" && q.lesson_number === 13) result.completedLesson13 = true;
      }
      return result;
    },
  });
}
