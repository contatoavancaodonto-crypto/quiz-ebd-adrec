import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

export interface WeeklyVerse {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  theme: string;
  scheduled_date: string;
}

export const useWeeklyVerses = () => {
  const { profile } = useProfile();
  const classId = profile?.class_id;

  return useQuery({
    queryKey: ["weekly-verses", classId],
    queryFn: async () => {
      const now = new Date();
      // Get the start of the current week (Monday)
      const monday = new Date(now);
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      monday.setDate(diff);
      monday.setHours(0, 0, 0, 0);

      // Get the end of the current week (Sunday)
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from("verses")
        .select("*")
        .eq("active", true)
        .or(`class_id.eq.${classId},class_id.is.null`)
        .gte("scheduled_date", monday.toISOString().split('T')[0])
        .lte("scheduled_date", sunday.toISOString().split('T')[0])
        .order("scheduled_date", { ascending: true });

      if (error) throw error;
      return data as WeeklyVerse[];
    },
    enabled: !!classId,
  });
};
