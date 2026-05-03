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
  class_name: string | null;
  church_id: string | null;
  church_name: string | null;
  class_id: string | null;
  avatar_url: string | null;
  show_avatar_in_ranking: boolean;
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
    staleTime: 5 * 60 * 1000, // 5 min — perfil muda raramente
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<FullProfile | null> => {
      const { data } = await supabase
        .from("profiles")
        .select(
          "id, first_name, last_name, display_name, email, phone, church_id, class_id, avatar_url, show_avatar_in_ranking, churches(name), classes(name)"
        )
        .eq("id", user!.id)
        .maybeSingle();
      if (!data) return null;
      return {
        id: data.id,
        first_name: data.first_name,
        last_name: data.last_name,
        display_name: (data as any).display_name ?? null,
        email: data.email,
        phone: data.phone,
        class_name: (data as any).classes?.name ?? null,
        church_id: data.church_id,
        class_id: (data as any).class_id ?? null,
        avatar_url: (data as any).avatar_url ?? null,
        show_avatar_in_ranking: (data as any).show_avatar_in_ranking ?? true,
        church_name: (data as any).churches?.name ?? null,
      };
    },
  });
}
