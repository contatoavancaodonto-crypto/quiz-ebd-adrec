import { Home, Trophy, BookOpen, User, Sparkles, Award } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { usePrefetch } from "@/hooks/usePrefetch";
import { useAuth } from "@/hooks/useAuth";
import { useActiveSeason } from "@/hooks/useActiveSeason";

const allItems = [
  { label: "Início", icon: Home, path: "/" },
  { label: "Ranking", icon: Trophy, path: "/ranking", type: 'ranking' as const },
  { label: "Bíblia", icon: BookOpen, path: "/membro/biblia", type: 'biblia' as const },
  { label: "Conquistas", icon: Award, path: "/membro/conquistas" },
  { label: "Perfil", icon: User, path: "/membro/perfil", type: 'profile' as const },
];

interface Props {
  /** Mostra o FAB central (botão flutuante do quiz) */
  showFab?: boolean;
  onFabClick?: () => void;
  fabLabel?: string;
}

/**
 * Bottom navigation no estilo nativo (iOS/Android).
 * 4 itens + FAB central opcional (5 colunas).
 * Quando o FAB está ativo: Início, Ranking, [FAB], Bíblia, Conquistas.
 * Quando o FAB está inativo: Início, Ranking, Bíblia, Conquistas, Perfil.
 */
export function MobileBottomNav({ showFab = true, onFabClick, fabLabel = "Quiz" }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: season } = useActiveSeason();
  const { prefetchRanking, prefetchBiblia, prefetchProfile } = usePrefetch(queryClient);

  const handlePrefetch = (type: string | undefined) => {
    if (type === 'ranking') prefetchRanking();
    if (type === 'biblia') prefetchBiblia();
    if (type === 'profile') prefetchProfile(user?.id);
  };

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  // Se FAB ativo, esconde "Perfil"; se inativo, mostra todos os 5 itens
  const visibleItems = showFab ? allItems.slice(0, 4) : allItems;
  const leftCount = showFab ? 2 : 2;
  const leftItems = visibleItems.slice(0, leftCount);
  const rightItems = visibleItems.slice(leftCount);

  return (
    <>
      {/* Spacer pra conteúdo não ficar embaixo da barra */}
      <div className="h-20 md:hidden" aria-hidden />

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-border bg-background/85 backdrop-blur-xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="relative grid grid-cols-5 items-center h-16 max-w-md mx-auto px-2">
          {/* Esquerda */}
          {leftItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                data-tour={item.type ? `nav-${item.type}` : undefined}
                onClick={() => navigate(item.path)}
                onMouseEnter={() => handlePrefetch((item as any).type)}
                onTouchStart={() => handlePrefetch((item as any).type)}
                className="flex flex-col items-center justify-center gap-1 h-full transition-colors"
              >
                <Icon
                  className={`w-5 h-5 transition-all ${
                    active ? "text-primary scale-110" : "text-muted-foreground"
                  }`}
                />
                <span
                  className={`text-[10px] font-medium ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* FAB central */}
          {showFab ? (
            <div className="flex justify-center">
              <motion.button
                whileTap={{ scale: 0.92 }}
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                onClick={onFabClick}
                className="relative -translate-y-5 w-14 h-14 rounded-2xl gradient-primary shadow-xl shadow-primary/40 flex flex-col items-center justify-center text-primary-foreground ring-4 ring-background"
              >
                <Sparkles className="w-6 h-6" />
                <span className="text-[9px] font-bold mt-0.5">{fabLabel}</span>
                <span className="absolute -inset-0.5 rounded-2xl bg-primary/20 blur-md -z-10" />
              </motion.button>
            </div>
          ) : (
            // Quando não há FAB, preenche a coluna do meio com um item extra
            // Isso mantém o alinhamento com grid-cols-5
            <div />
          )}

          {/* Direita */}
          {rightItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                data-tour={item.type ? `nav-${item.type}` : undefined}
                onClick={() => navigate(item.path)}
                onMouseEnter={() => handlePrefetch((item as any).type)}
                onTouchStart={() => handlePrefetch((item as any).type)}
                className="flex flex-col items-center justify-center gap-1 h-full transition-colors"
              >
                <Icon
                  className={`w-5 h-5 transition-all ${
                    active ? "text-primary scale-110" : "text-muted-foreground"
                  }`}
                />
                <span
                  className={`text-[10px] font-medium ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

