import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

export type ReadingType = "verse" | "bible_reading" | "quiz_cta" | "none";

export interface WeeklyReading {
  type: ReadingType;
  title: string;
  content: string | null;
  verseText?: string | null;
  reference?: string | null;
  weeklyBibleReading: string | null;
  dayName: string;
  lessonTitle?: string;
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
      
      // 1. Tenta buscar versículo agendado para hoje na tabela verses
      const { data: scheduledVerse } = await supabase
        .from("verses")
        .select("*")
        .eq("scheduled_date", now.toISOString().split('T')[0])
        .eq("active", true)
        .or(`class_id.eq.${classId},class_id.is.null`)
        .order("class_id", { ascending: false, nullsFirst: false }) // Prioriza o da classe
        .limit(1)
        .maybeSingle();

      if (scheduledVerse) {
        return {
          type: "verse",
          title: "Versículo do Dia",
          content: scheduledVerse.theme || scheduledVerse.text,
          verseText: scheduledVerse.text,
          reference: `${scheduledVerse.book} ${scheduledVerse.chapter}:${scheduledVerse.verse}`,
          weeklyBibleReading: null,
          dayName: days[day],
          lessonTitle: scheduledVerse.theme
        };
      }

      const { data: quiz, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("class_id", classId!)
        .eq("quiz_kind", "weekly")
        .eq("active", true)
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

  const readingKeys = [
    "", // 0 (Sun)
    "devotional_mon",
    "devotional_tue",
    "devotional_wed",
    "devotional_thu",
    "devotional_fri",
    "devotional_sat", // 6 (Sat)
  ];
  
  const content = quiz[readingKeys[day]] as string | null;
  
  return {
    type: content ? "verse" : "bible_reading",
    title: content ? "Versículo do Dia" : "Leitura Bíblica",
    content: content || null,
    reference: content || null,
    weeklyBibleReading,
    dayName,
    lessonTitle: quiz.lesson_title || undefined
  };
};
