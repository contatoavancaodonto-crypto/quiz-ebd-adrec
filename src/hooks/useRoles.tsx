import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface RolesValue {
  isSuperadmin: boolean;
  isChurchAdmin: boolean;
  isAdmin: boolean;
  churchId: string | null;
  loading: boolean;
}

const RolesContext = createContext<RolesValue>({
  isSuperadmin: false,
  isChurchAdmin: false,
  isAdmin: false,
  churchId: null,
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
      setIsSuperadmin(rows.some((r) => r.role === "superadmin"));
      const adminRow = rows.find((r) => r.role === "admin");
      setIsChurchAdmin(!!adminRow);
      
      // Se for superadmin, prioriza o church_id do perfil para ele ver os membros da própria igreja
      // caso contrário usa o church_id da role admin
      if (rows.some(r => r.role === "superadmin")) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("church_id")
          .eq("id", user.id)
          .maybeSingle();
        setChurchId(profile?.church_id ?? null);
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
