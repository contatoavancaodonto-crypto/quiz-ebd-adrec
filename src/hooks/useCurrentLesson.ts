import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

export interface CurrentLesson {
  id: string;
  lesson_number: number;
  theme: string | null;
  scheduled_date: string | null;
  scheduled_end_date?: string | null;
}

/** Lição vigente — mais recente cuja scheduled_date <= hoje e scheduled_end_date >= agora */
export function useCurrentLesson() {
  const { profile } = useProfile();
  const classId = profile?.class_id;

  return useQuery({
    queryKey: ["current-lesson", classId],
    refetchInterval: 60_000,
    queryFn: async (): Promise<CurrentLesson | null> => {
      const today = new Date().toISOString().split("T")[0];
      const now = new Date().toISOString();
      
      let query = supabase
        .from("lessons")
        .select("lesson_number, theme, scheduled_date, scheduled_end_date")
        .lte("scheduled_date", today)
        .or(`scheduled_end_date.gte.${now},scheduled_end_date.is.null`)
        .order("scheduled_date", { ascending: false });

      if (classId) {
        query = query.or(`class_id.eq.${classId},class_id.is.null`);
      } else {
        query = query.is("class_id", null);
      }

      const { data } = await query.limit(1).maybeSingle();
      return (data as CurrentLesson) ?? null;
    },
  });
}

/** Próxima lição agendada — scheduled_date > hoje */
export function useNextLesson() {
  const { profile } = useProfile();
  const classId = profile?.class_id;

  return useQuery({
    queryKey: ["next-lesson", classId],
    refetchInterval: 60_000,
    queryFn: async (): Promise<CurrentLesson | null> => {
      const today = new Date().toISOString().split("T")[0];
      
      let query = supabase
        .from("lessons")
        .select("lesson_number, theme, scheduled_date, scheduled_end_date")
        .gt("scheduled_date", today)
        .order("scheduled_date", { ascending: true });

      if (classId) {
        query = query.or(`class_id.eq.${classId},class_id.is.null`);
      } else {
        query = query.is("class_id", null);
      }

      const { data } = await query.limit(1).maybeSingle();
      return (data as CurrentLesson) ?? null;
    },
  });
}
