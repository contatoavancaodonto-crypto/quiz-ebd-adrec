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
      // Obtém a data local atual à meia-noite para garantir consistência
      const now = new Date();
      const day = now.getDay(); // 0 (Dom) a 6 (Sáb)
      
      const { data: quiz, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("class_id", classId!)
        .eq("quiz_kind", "weekly")
        .eq("active", true)
        // Filtra quizzes que estão dentro da janela de tempo se opens_at estiver definido
        .lte("opens_at", now.toISOString())
        .order("week_number", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !quiz) {
        // Fallback: tenta pegar o último quiz ativo sem filtro de data se não houver um agendado para agora
        const { data: fallbackQuiz } = await supabase
          .from("quizzes")
          .select("*")
          .eq("class_id", classId!)
          .eq("quiz_kind", "weekly")
          .eq("active", true)
          .order("week_number", { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (!fallbackQuiz) {
          return { type: "none", title: "", content: null, weeklyBibleReading: null, dayName: "" };
        }
        return processQuiz(fallbackQuiz, day);
      }

      return processQuiz(quiz, day);
    },
  });
};

const processQuiz = (quiz: any, day: number): WeeklyReading => {
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

  // No domingo (0), mostra o CTA do Quiz
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

  // Mapeamento automático dos campos devocionais de Segunda (1) a Sábado (6)
  const devotionalKeys = [
    "", // 0 (Sun)
    "devotional_mon",
    "devotional_tue",
    "devotional_wed",
    "devotional_thu",
    "devotional_fri",
    "devotional_sat", // 6 (Sat)
  ];
  
  const content = quiz[devotionalKeys[day]] as string | null;
  
  return {
    type: content ? "devotional" : "bible_reading",
    title: content ? "Devocional de Hoje" : "Leitura Bíblica",
    content,
    weeklyBibleReading,
    dayName,
    lessonTitle: quiz.lesson_title || undefined
  };
};