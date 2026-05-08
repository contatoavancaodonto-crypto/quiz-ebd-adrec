import { Loader2 } from "lucide-react";

/**
 * Fallback minimalista para rotas lazy-loaded.
 * Adicionado status de carregamento para evitar tela preta em páginas pesadas.
 */
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse font-medium">Carregando...</p>
      </div>
    </div>
  );
}
