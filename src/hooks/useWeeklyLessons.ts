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
    seg: string | null;
    ter: string | null;
    qua: string | null;
    qui: string | null;
    sex: string | null;
    sab: string | null;
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
        .eq("status", "completo")
        .lte("scheduled_date", now)
        .order("scheduled_date", { ascending: false })
        .limit(4);

      if (error) throw error;

      return (data || []).map((q: any) => ({
        id: q.id,
        lesson_title: q.lesson_title || "Sem título",
        lesson_number: q.lesson_number || 0,
        weekly_bible_reading: q.weekly_bible_reading,
        verses: {
          seg: q.devotional_mon,
          ter: q.devotional_tue,
          qua: q.devotional_wed,
          qui: q.devotional_thu,
          sex: q.devotional_fri,
          sab: q.devotional_sat,
        },
        has_quiz: (q.questions?.length || 0) > 0,
        active: q.active,
        opens_at: q.opens_at
      }));
    },
  });
};
