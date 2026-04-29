import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

export type ReadingType = "devotional" | "bible_reading" | "quiz_cta" | "none";

export interface WeeklyReading {
  type: ReadingType;
  title: string;
  content: string | null;
  dayName: string;
  lessonTitle?: string;
}

export const useWeeklyReading = () => {
  const { profile } = useProfile();
  const classId = profile?.class_id;

  return useQuery({
    queryKey: ["weekly-reading", classId],
    enabled: !!classId,
    queryFn: async (): Promise<WeeklyReading> => {
      const now = new Date();
      const day = now.getDay(); // 0 (Sun) to 6 (Sat)
      
      // Fetch the most recent active quiz for this class
      // We look for quizzes that are open or the most recent weekly one
      const { data: quiz, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("class_id", classId!)
        .eq("quiz_kind", "weekly")
        .eq("active", true)
        .order("week_number", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !quiz) {
        return { type: "none", title: "", content: null, dayName: "" };
      }

      const days = [
        "Domingo",
        "Segunda-feira",
        "Terça-feira",
        "Quarta-feira",
        "Quinta-feira",
        "Sexta-feira",
        "Sábado",
      ];

      const dayName = days[day];

      if (day === 0) {
        return {
          type: "quiz_cta",
          title: "Dia de Quiz!",
          content: quiz.title || "Responda o quiz da semana",
          dayName,
          lessonTitle: quiz.lesson_title || undefined
        };
      }

      if (day === 6) {
        return {
          type: "bible_reading",
          title: "Leitura Bíblica",
          content: quiz.weekly_bible_reading,
          dayName,
          lessonTitle: quiz.lesson_title || undefined
        };
      }

      // Monday to Friday
      const devotionalKeys = [
        "", // 0 (Sun) - handled above
        "devotional_mon",
        "devotional_tue",
        "devotional_wed",
        "devotional_thu",
        "devotional_fri",
        "", // 6 (Sat) - handled above
      ];

      const content = quiz[devotionalKeys[day] as keyof typeof quiz] as string | null;

      return {
        type: content ? "devotional" : "none",
        title: "Devocional Diário",
        content,
        dayName,
        lessonTitle: quiz.lesson_title || undefined
      };
    },
  });
};