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
    segunda: string | null;
    terca: string | null;
    quarta: string | null;
    quinta: string | null;
    sexta: string | null;
    sabado: string | null;
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
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("lessons")
        .select(`
          id, 
          theme, 
          lesson_number, 
          reading_theme,
          scheduled_date,
          verses,
          questions(id)
        `)
        .in("status", ["completo", "incompleto"])
        .lte("scheduled_date", now)
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
          segunda: l.verses?.segunda?.referencia,
          terca: l.verses?.terca?.referencia,
          quarta: l.verses?.quarta?.referencia,
          quinta: l.verses?.quinta?.referencia,
          sexta: l.verses?.sexta?.referencia,
          sabado: l.verses?.sabado?.referencia,
        },
        has_quiz: (l.questions?.length || 0) > 0,
        active: true,
        opens_at: l.scheduled_date
      }));
    },
  });
};
