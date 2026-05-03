import { useFullProfile } from "@/hooks/useFullProfile";
import { useAuth } from "@/hooks/useAuth";

export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  church_id: string | null;
  church_name: string | null;
  class_name: string | null;
  class_id: string | null;
}

/**
 * Wrapper retrocompatível: deriva os campos do mesmo cache de `useFullProfile`.
 * Não dispara fetch adicional — todos os consumidores de perfil compartilham a mesma query.
 */
export function useProfile() {
  const { loading: authLoading } = useAuth();
  const { data, isLoading } = useFullProfile();

  const profile: UserProfile | null = data
    ? {
        id: data.id,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        church_id: data.church_id,
        church_name: data.church_name,
        class_name: data.class_name,
        class_id: data.class_id,
      }
    : null;

  return { profile, loading: authLoading || isLoading };
}
