import { QueryClient } from "@tanstack/react-query";
import { prefetchBiblia } from "./useBibliaData";
import { prefetchHarpa } from "./useHarpaData";

/**
 * Utilitário central de prefetch para rotas e dados.
 * Reduz a latência percebida ao navegar para páginas comuns.
 */
export function usePrefetch(queryClient: QueryClient) {
  const prefetchRanking = () => {
    // Ranking utiliza realtime e queries complexas, bom pré-carregar
    queryClient.prefetchQuery({
      queryKey: ["ranking-weekly-lesson"],
      staleTime: 60000,
    });
  };

  const prefetchHistory = (userId: string | undefined, seasonId: string | undefined) => {
    if (!userId || !seasonId) return;
    queryClient.prefetchQuery({
      queryKey: ["academic-history", userId, seasonId],
      staleTime: 60000,
    });
  };

  const prefetchProfile = (userId: string | undefined) => {
    if (!userId) return;
    queryClient.prefetchQuery({
      queryKey: ["full-profile", userId],
      staleTime: 300000,
    });
  };

  return {
    prefetchRanking,
    prefetchHistory,
    prefetchProfile,
    prefetchBiblia,
    prefetchHarpa,
  };
}
