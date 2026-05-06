import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

export interface WeeklyLesson {
  id: string;
  lesson_title: string;
  lesson_number: number;
  reading_theme?: string | null;
  scheduled_date?: string | null;
  weekly_bible_reading: string | null;
  verses: {
    segunda: { referencia: string | null; texto: string | null };
    terca: { referencia: string | null; texto: string | null };
    quarta: { referencia: string | null; texto: string | null };
    quinta: { referencia: string | null; texto: string | null };
    sexta: { referencia: string | null; texto: string | null };
    sabado: { referencia: string | null; texto: string | null };
  };
  has_quiz: boolean;
  active: boolean;
  opens_at: string | null;
}

export const useWeeklyLessons = () => {
  const { profile } = useProfile();
  const classId = profile?.class_id;

  return useQuery({
    queryKey: ["weekly-lessons", classId],
    enabled: !!classId,
    queryFn: async (): Promise<WeeklyLesson[]> => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("lessons")
        .select(`id, theme, lesson_number, reading_theme, scheduled_date, verses, questions, class_id`)
        .lte("scheduled_date", today)
        .or(`class_id.eq.${classId},class_id.is.null`)
        .order("scheduled_date", { ascending: false })
        .limit(4);

      if (error) throw error;

      return (data || []).map((l: any) => ({
        id: l.id,
        lesson_title: l.theme || "Sem título",
        lesson_number: l.lesson_number || 0,
        reading_theme: l.reading_theme,
        scheduled_date: l.scheduled_date,
        weekly_bible_reading: null,
        verses: {
          segunda: { referencia: l.verses?.segunda?.referencia ?? null, texto: l.verses?.segunda?.texto ?? null },
          terca: { referencia: l.verses?.terca?.referencia ?? null, texto: l.verses?.terca?.texto ?? null },
          quarta: { referencia: l.verses?.quarta?.referencia ?? null, texto: l.verses?.quarta?.texto ?? null },
          quinta: { referencia: l.verses?.quinta?.referencia ?? null, texto: l.verses?.quinta?.texto ?? null },
          sexta: { referencia: l.verses?.sexta?.referencia ?? null, texto: l.verses?.sexta?.texto ?? null },
          sabado: { referencia: l.verses?.sabado?.referencia ?? null, texto: l.verses?.sabado?.texto ?? null },
        },
        has_quiz: Array.isArray(l.questions) && l.questions.length > 0,
        active: true,
        opens_at: l.scheduled_date
      }));
    },
  });
};
