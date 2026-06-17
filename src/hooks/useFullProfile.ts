import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface FullProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  provider: string | null;
  class_name: string | null;
  church_id: string | null;
  church_name: string | null;
  class_id: string | null;
  avatar_url: string | null;
  show_avatar_in_ranking: boolean;
  has_seen_tour: boolean;
  tour_views_count: number;
}


/**
 * Hook único e canônico para o perfil do usuário logado.
 * Cache compartilhado via React Query (chave estável `["full-profile", userId]`).
 * Todos os outros consumidores (`useProfile`, `ProfileGate`) reusam essa mesma query.
 */
export function useFullProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["full-profile", user?.id],
    enabled: !!user,
    staleTime: 10 * 1000, // 10 segundos para ser mais reativo após mudanças
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<FullProfile | null> => {
      const { data: rpcData } = await (supabase as any).rpc("get_my_profile_full");
      const data: any = Array.isArray(rpcData) ? rpcData[0] : rpcData;
      if (!data) return null;

      const [churchRes, classRes] = await Promise.all([
        data.church_id
          ? supabase.from("churches").select("name").eq("id", data.church_id).maybeSingle()
          : Promise.resolve({ data: null as any }),
        data.class_id
          ? supabase.from("classes").select("name").eq("id", data.class_id).maybeSingle()
          : Promise.resolve({ data: null as any }),
      ]);

      return {
        id: data.id,
        first_name: data.first_name,
        last_name: data.last_name,
        display_name: data.display_name || null,
        email: data.email,
        phone: data.phone,
        provider: data.provider ?? null,
        class_name: (classRes.data as any)?.name ?? null,
        church_id: data.church_id,
        class_id: data.class_id ?? null,
        avatar_url: data.avatar_url ?? null,
        show_avatar_in_ranking: data.show_avatar_in_ranking ?? true,
        has_seen_tour: data.has_seen_tour ?? false,
        tour_views_count: data.tour_views_count ?? 0,
        church_name: (churchRes.data as any)?.name ?? null,
      };
    },
  });
}
