import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Escuta mudanças em uma tabela do Postgres e invalida queries do React Query.
 * Use para manter listas/contadores sincronizados em tempo real entre admin e membros.
 */
export function useRealtimeInvalidate(
  table: string,
  queryKeys: unknown[][],
  channelSuffix?: string
) {
  const qc = useQueryClient();
  const keysSig = JSON.stringify(queryKeys);

  useEffect(() => {
    const channel = supabase
      .channel(`rt-${table}-${channelSuffix ?? "default"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          queryKeys.forEach((key) => qc.invalidateQueries({ queryKey: key }));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qc, table, keysSig, channelSuffix]);
}
