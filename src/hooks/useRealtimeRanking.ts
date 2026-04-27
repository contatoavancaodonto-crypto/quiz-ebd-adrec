import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type RealtimeStatus = "connecting" | "connected" | "reconnecting" | "error";

/**
 * Escuta mudanças em quiz_attempts e invalida a query do ranking.
 * - Debounce para evitar refetch em rajada
 * - Reconexão automática com retry exponencial + jitter
 * - Expõe status para a UI mostrar loading quando desconectado
 */
export function useRealtimeRanking(queryKey: unknown[]): { status: RealtimeStatus } {
  const qc = useQueryClient();
  const debounceRef = useRef<number | null>(null);
  const retryRef = useRef<number | null>(null);
  const attemptRef = useRef(0);
  const cancelledRef = useRef(false);
  const [status, setStatus] = useState<RealtimeStatus>("connecting");

  useEffect(() => {
    cancelledRef.current = false;
    let currentChannel: ReturnType<typeof supabase.channel> | null = null;

    const computeBackoff = () => {
      // 1s, 2s, 4s, 8s, 16s, max 30s + jitter (0-500ms)
      const base = Math.min(30000, 1000 * Math.pow(2, attemptRef.current));
      const jitter = Math.floor(Math.random() * 500);
      return base + jitter;
    };

    const connect = () => {
      if (cancelledRef.current) return;
      const channelName = `ranking-realtime-${Math.random().toString(36).slice(2)}-${Date.now()}`;
      setStatus(attemptRef.current === 0 ? "connecting" : "reconnecting");

      const channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "quiz_attempts" },
          () => {
            if (debounceRef.current) window.clearTimeout(debounceRef.current);
            debounceRef.current = window.setTimeout(() => {
              qc.invalidateQueries({ queryKey });
            }, 600);
          }
        )
        .subscribe((sbStatus) => {
          if (cancelledRef.current) return;
          if (sbStatus === "SUBSCRIBED") {
            attemptRef.current = 0;
            setStatus("connected");
            // Refresca dados após reconectar (pode ter perdido eventos)
            qc.invalidateQueries({ queryKey });
          } else if (
            sbStatus === "CHANNEL_ERROR" ||
            sbStatus === "TIMED_OUT" ||
            sbStatus === "CLOSED"
          ) {
            setStatus("reconnecting");
            scheduleReconnect();
          }
        });

      currentChannel = channel;
    };

    const scheduleReconnect = () => {
      if (cancelledRef.current) return;
      if (retryRef.current) window.clearTimeout(retryRef.current);

      const delay = computeBackoff();
      attemptRef.current += 1;

      retryRef.current = window.setTimeout(() => {
        if (cancelledRef.current) return;
        if (currentChannel) {
          supabase.removeChannel(currentChannel);
          currentChannel = null;
        }
        connect();
      }, delay);
    };

    connect();

    return () => {
      cancelledRef.current = true;
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      if (retryRef.current) window.clearTimeout(retryRef.current);
      if (currentChannel) supabase.removeChannel(currentChannel);
    };
  }, [qc, JSON.stringify(queryKey)]);

  return { status };
}
