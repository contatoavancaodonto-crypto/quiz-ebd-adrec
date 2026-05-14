import { Home, Trophy, BookOpen, User, Sparkles, Award } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { usePrefetch } from "@/hooks/usePrefetch";
import { useAuth } from "@/hooks/useAuth";
import { useActiveSeason } from "@/hooks/useActiveSeason";

const items = [
  { label: "Início", icon: Home, path: "/" },
  { label: "Ranking", icon: Trophy, path: "/ranking", type: 'ranking' },
  { label: "Bíblia", icon: BookOpen, path: "/membro/biblia", type: 'biblia' },
  { label: "Conquistas", icon: Award, path: "/membro/conquistas" },
  { label: "Perfil", icon: User, path: "/membro/perfil", type: 'profile' },
];

interface Props {
  /** Mostra o FAB central (botão flutuante do quiz) */
  showFab?: boolean;
  onFabClick?: () => void;
  fabLabel?: string;
}

/**
 * Bottom navigation no estilo nativo (iOS/Android).
 * 4 itens + FAB central opcional.
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
          {items.slice(0, 2).map((item) => {
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
          <div className="flex justify-center">
            {showFab && (
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={onFabClick}
                className="relative -translate-y-5 w-14 h-14 rounded-2xl gradient-primary shadow-xl shadow-primary/40 flex flex-col items-center justify-center text-primary-foreground"
              >
                <Sparkles className="w-6 h-6" />
                <span className="text-[9px] font-bold mt-0.5">{fabLabel}</span>
                <span className="absolute -inset-0.5 rounded-2xl bg-primary/20 blur-md -z-10" />
              </motion.button>
            )}
          </div>

          {/* Direita */}
          {items.slice(2, 4).map((item) => {
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
