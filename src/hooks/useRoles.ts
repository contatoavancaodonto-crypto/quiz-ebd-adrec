import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

/**
 * Retorna os papéis do usuário logado em tempo real.
 * - isSuperadmin: pode gerenciar todos os admins e tudo do app.
 * - isAdmin: admin de igreja (escopo restrito a churchId) OU superadmin.
 * - churchId: igreja vinculada (somente para admin de igreja). Null para superadmin.
 */
export function useRoles() {
  const { user, loading: authLoading } = useAuth();
  const instanceIdRef = useRef(`roles-${Math.random().toString(36).slice(2, 10)}`);
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
      setChurchId(adminRow?.church_id ?? null);
      setLoading(false);
    };

    setLoading(true);
    load();

    const channel = supabase
      .channel(`user-roles-${user.id}-${instanceIdRef.current}`)
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

  return {
    isSuperadmin,
    isChurchAdmin,
    isAdmin: isSuperadmin || isChurchAdmin,
    churchId,
    loading,
  };
}
