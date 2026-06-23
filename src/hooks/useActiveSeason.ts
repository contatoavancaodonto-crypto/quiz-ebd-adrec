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
      const nowIso = new Date().toISOString();
      // Pick the active season currently in progress (ends soonest from now).
      // Avoids returning a future season (e.g. next trimester) that would
      // delay provão availability windows tied to end_date.
      const { data, error } = await supabase
        .from("seasons")
        .select("*")
        .eq("status", "active")
        .gte("end_date", nowIso)
        .order("end_date", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Season | null;
    },
    staleTime: 60_000,
  });
}
