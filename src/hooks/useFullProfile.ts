import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface FullProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  area: number | null;
  church_id: string | null;
  church_name: string | null;
  avatar_url: string | null;
  show_avatar_in_ranking: boolean;
}

export function useFullProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["full-profile", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<FullProfile | null> => {
      const { data } = await supabase
        .from("profiles")
        .select(
          "id, first_name, last_name, email, phone, area, church_id, avatar_url, show_avatar_in_ranking, churches(name)"
        )
        .eq("id", user!.id)
        .maybeSingle();
      if (!data) return null;
      return {
        id: data.id,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        area: data.area,
        church_id: data.church_id,
        avatar_url: (data as any).avatar_url ?? null,
        show_avatar_in_ranking: (data as any).show_avatar_in_ranking ?? true,
        church_name: (data as any).churches?.name ?? null,
      };
    },
  });
}
