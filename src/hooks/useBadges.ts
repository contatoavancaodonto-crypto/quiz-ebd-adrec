import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserBadge {
  id: string;
  earned_at: string;
  badge: {
    id: string;
    code: string;
    name: string;
    description: string;
    emoji: string;
    type: string;
  };
}

/**
 * Badges conquistados em uma tentativa específica.
 * Inclui badges transferíveis (Top 1, Velocidade) que podem ter sido tirados depois,
 * por isso buscamos por participant_id + season_id também (estado atual).
 */
export function useBadgesForAttempt(attemptId: string | null | undefined, participantId: string | null | undefined) {
  return useQuery({
    queryKey: ["badges-attempt", attemptId, participantId],
    enabled: !!attemptId,
    queryFn: async () => {
      // Pega season_id da tentativa
      const { data: attempt } = await supabase
        .from("quiz_attempts")
        .select("season_id")
        .eq("id", attemptId!)
        .maybeSingle();

      const seasonId = (attempt as any)?.season_id;

      // 1. Badges conquistados nessa tentativa (perfect_score fica fixo aqui)
      const { data: byAttempt } = await supabase
        .from("user_badges")
        .select("id, earned_at, badge:badges(id, code, name, description, emoji, type)")
        .eq("attempt_id", attemptId!);

      // 2. Badges atualmente em posse do participante na temporada (top_church, top_general, max_speed)
      let current: any[] = [];
      if (participantId && seasonId) {
        const { data } = await supabase
          .from("user_badges")
          .select("id, earned_at, badge:badges(id, code, name, description, emoji, type)")
          .eq("participant_id", participantId)
          .eq("season_id", seasonId);
        current = data || [];
      }

      const merged = new Map<string, UserBadge>();
      [...(byAttempt || []), ...current].forEach((b: any) => {
        if (b.badge) merged.set(b.badge.id, b as UserBadge);
      });

      return Array.from(merged.values());
    },
  });
}

export function useAllBadges(participantId: string | null | undefined) {
  return useQuery({
    queryKey: ["all-badges", participantId],
    enabled: !!participantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_badges")
        .select("id, earned_at, badge:badges(id, code, name, description, emoji, type)")
        .eq("participant_id", participantId!);

      if (error) throw error;

      // Usar Map para garantir unicidade por badge.id caso haja duplicatas em temporadas diferentes
      const merged = new Map<string, UserBadge>();
      (data || []).forEach((b: any) => {
        if (b.badge) {
          // Se já existe, mantemos o mais recente ou o primeiro encontrado
          if (!merged.has(b.badge.id)) {
            merged.set(b.badge.id, b as UserBadge);
          }
        }
      });

      return Array.from(merged.values());
    },
  });
}
