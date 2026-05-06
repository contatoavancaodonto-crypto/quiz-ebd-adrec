import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CurrentLesson {
  lesson_number: number;
  theme: string | null;
  scheduled_date: string | null;
}

/** Lição vigente — mais recente cuja scheduled_date <= hoje */
export function useCurrentLesson() {
  return useQuery({
    queryKey: ["current-lesson"],
    refetchInterval: 60_000,
    queryFn: async (): Promise<CurrentLesson | null> => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("lessons")
        .select("lesson_number, theme, scheduled_date")
        .lte("scheduled_date", today)
        .order("scheduled_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data as CurrentLesson) ?? null;
    },
  });
}

/** Próxima lição agendada — scheduled_date > hoje */
export function useNextLesson() {
  return useQuery({
    queryKey: ["next-lesson"],
    refetchInterval: 60_000,
    queryFn: async (): Promise<CurrentLesson | null> => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("lessons")
        .select("lesson_number, theme, scheduled_date")
        .gt("scheduled_date", today)
        .order("scheduled_date", { ascending: true })
        .limit(1)
        .maybeSingle();
      return (data as CurrentLesson) ?? null;
    },
  });
}
