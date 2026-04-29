import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

export type ReadingType = "devotional" | "bible_reading" | "quiz_cta" | "none";

export interface WeeklyReading {
  type: ReadingType;
  title: string;
  content: string | null;
  weeklyBibleReading: string | null;
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
        return { type: "none", title: "", content: null, weeklyBibleReading: null, dayName: "" };
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
      const weeklyBibleReading = quiz.weekly_bible_reading || null;

      if (day === 0) {
        return {
          type: "quiz_cta",
          title: "Dia de Quiz!",
          content: quiz.title || "Responda o quiz da semana",
          weeklyBibleReading,
          dayName,
          lessonTitle: quiz.lesson_title || undefined
        };
      }

      // Monday to Saturday
      const devotionalKeys = [
        "", // 0 (Sun)
        "devotional_mon",
        "devotional_tue",
        "devotional_wed",
        "devotional_thu",
        "devotional_fri",
        "devotional_sat", // 6 (Sat)
      ];
      
      const content = day > 0 && day <= 6 ? (quiz[devotionalKeys[day] as keyof typeof quiz] as string | null) : null;
      
      return {
        type: day === 0 ? "quiz_cta" : (content ? "devotional" : "bible_reading"),
        title: day === 0 ? "Dia de Quiz!" : (content ? "Devocional Diário" : "Leitura Bíblica"),
        content,
        weeklyBibleReading,
        dayName,
        lessonTitle: quiz.lesson_title || undefined
      };
    },
  });
};