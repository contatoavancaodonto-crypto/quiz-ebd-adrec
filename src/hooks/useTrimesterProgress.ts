import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TrimesterProgress {
  completedLesson13: boolean;
  completedExam: boolean;
}

/**
 * Deriva o progresso do participante no trimestre a partir de quiz_attempts.
 * - completedLesson13: existe attempt finalizado de uma lição/quiz com lesson_number = 13
 * - completedExam: existe attempt finalizado com quiz_kind = 'trimestral'
 *
 * Considera attempts vinculados via quiz_id (quizzes.lesson_number) OU
 * via lesson_id (lessons.lesson_number), para cobrir todos os fluxos.
 * Não filtra por season_id para garantir que qualquer usuário que já fez
 * a Lição 13 tenha acesso ao Provão.
 */
export function useTrimesterProgress(
  fullName: string | null | undefined,
  seasonId: string | null | undefined,
  classId: string | null | undefined,
) {
  return useQuery({
    queryKey: ["trimester-progress", fullName?.toLowerCase().trim(), classId],
    enabled: !!fullName,
    staleTime: 30_000,
    queryFn: async (): Promise<TrimesterProgress> => {
      const result: TrimesterProgress = { completedLesson13: false, completedExam: false };

      const { data: parts } = await supabase
        .from("participants")
        .select("id")
        .ilike("name", fullName!);
      const ids = (parts ?? []).map((p) => p.id);
      if (ids.length === 0) return result;

      const { data: attempts } = await supabase
        .from("quiz_attempts")
        .select("id, quiz_id, lesson_id, source_type, trimester")
        .in("participant_id", ids)
        .not("finished_at", "is", null);

      // Provão via RPC (source_type='trimestral_rpc') também conta como completedExam
      for (const a of attempts ?? []) {
        if ((a as any).source_type === "trimestral_rpc") {
          result.completedExam = true;
        }
      }

      const quizIds = Array.from(
        new Set((attempts ?? []).map((a) => a.quiz_id).filter(Boolean)),
      ) as string[];
      const lessonIds = Array.from(
        new Set((attempts ?? []).map((a) => a.lesson_id).filter(Boolean)),
      ) as string[];

      if (quizIds.length === 0 && lessonIds.length === 0) return result;

      const [{ data: quizzes }, { data: lessons }] = await Promise.all([
        quizIds.length
          ? supabase
              .from("quizzes")
              .select("id, quiz_kind, lesson_number, class_id")
              .in("id", quizIds)
          : Promise.resolve({ data: [] as any[] }),
        lessonIds.length
          ? supabase
              .from("lessons")
              .select("id, lesson_number, class_id")
              .in("id", lessonIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      for (const q of quizzes ?? []) {
        if (classId && q.class_id && q.class_id !== classId) continue;
        if (q.quiz_kind === "trimestral") result.completedExam = true;
        if (q.lesson_number === 13) result.completedLesson13 = true;
      }
      for (const l of lessons ?? []) {
        if (classId && l.class_id && l.class_id !== classId) continue;
        if (l.lesson_number === 13) result.completedLesson13 = true;
      }
      return result;
    },
  });
}
