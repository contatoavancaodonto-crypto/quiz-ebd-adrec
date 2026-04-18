import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Season {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: "active" | "closed";
}

export function useActiveSeason() {
  return useQuery({
    queryKey: ["active-season"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seasons")
        .select("*")
        .eq("status", "active")
        .order("end_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Season | null;
    },
    staleTime: 60_000,
  });
}
