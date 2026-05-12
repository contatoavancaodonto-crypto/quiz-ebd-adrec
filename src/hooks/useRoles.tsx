import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface RolesValue {
  isSuperadmin: boolean;
  isChurchAdmin: boolean;
  isAdmin: boolean;
  churchId: string | null;
  setChurchId: (id: string | null) => void;
  loading: boolean;
}

const RolesContext = createContext<RolesValue>({
  isSuperadmin: false,
  isChurchAdmin: false,
  isAdmin: false,
  churchId: null,
  setChurchId: () => {},
  loading: true,
});

export function RolesProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [isChurchAdmin, setIsChurchAdmin] = useState(false);
  const [churchId, setChurchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    if (!user) {
      setIsSuperadmin(false);
      setIsChurchAdmin(false);
      setChurchId(null);
      setLoading(false);
      return;
    }

    const load = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role, church_id")
        .eq("user_id", user.id);

      if (cancelled) return;

      const rows = data ?? [];
      const superadmin = rows.some((r) => r.role === "superadmin");
      setIsSuperadmin(superadmin);
      const adminRow = rows.find((r) => r.role === "admin");
      setIsChurchAdmin(!!adminRow);
      
      // Para superadmin, tentamos pegar a igreja do perfil como padrão se não houver role admin
      if (superadmin) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("church_id")
          .eq("id", user.id)
          .maybeSingle();
        
        if (!cancelled) {
          setChurchId(adminRow?.church_id || profile?.church_id || null);
        }
      } else {
        setChurchId(adminRow?.church_id ?? null);
      }
      
      setLoading(false);
    };

    setLoading(true);
    load();

    const channel = supabase
      .channel(`user-roles-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_roles", filter: `user_id=eq.${user.id}` },
        () => {
          void load();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user?.id, authLoading]);

  return (
    <RolesContext.Provider
      value={{
        isSuperadmin,
        isChurchAdmin,
        isAdmin: isSuperadmin || isChurchAdmin,
        churchId,
        setChurchId,
        loading,
      }}
    >
      {children}
    </RolesContext.Provider>
  );
}

/**
 * Retorna os papéis do usuário logado em tempo real.
 * Requer <RolesProvider> acima na árvore (montado em App.tsx).
 */
export function useRoles() {
  return useContext(RolesContext);
}
