import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useFullProfile } from "@/hooks/useFullProfile";
import { CompleteProfileModal } from "@/components/CompleteProfileModal";

/**
 * Gate global: após login, valida se o perfil tem campos obrigatórios
 * (phone, area, church_id). Se faltar algo, força o modal de completar.
 *
 * Reutiliza o cache de `useFullProfile` — não dispara fetch adicional.
 */
export const ProfileGate = () => {
  const { user, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useFullProfile();
  const location = useLocation();

  if (!user || loading || profileLoading) return null;
  if (location.pathname === "/auth") return null;

  const incomplete = !profile || !profile.phone || !profile.class_id || !profile.church_id;
  if (!incomplete) return null;

  return (
    <CompleteProfileModal
      open
      userId={user.id}
      onCompleted={() => {
        // Cache será invalidado pelo próprio modal após salvar
      }}
    />
  );
};
