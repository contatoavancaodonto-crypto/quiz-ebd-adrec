/**
 * Fallback minimalista para rotas lazy-loaded.
 * Sem animações de pulse/bounce para deixar a navegação mais fluida.
 */
export function PageSkeleton() {
  return <div className="min-h-screen bg-background" />;
}
