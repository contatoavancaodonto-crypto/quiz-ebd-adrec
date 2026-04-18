import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Escuta mudanças em quiz_attempts e invalida a query do ranking.
 * Usa debounce para evitar refetch em rajada.
 */
export function useRealtimeRanking(queryKey: unknown[]) {
  const qc = useQueryClient();
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel("ranking-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quiz_attempts" },
        () => {
          if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
          timeoutRef.current = window.setTimeout(() => {
            qc.invalidateQueries({ queryKey });
          }, 600);
        }
      )
      .subscribe();

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      supabase.removeChannel(channel);
    };
  }, [qc, JSON.stringify(queryKey)]);
}
