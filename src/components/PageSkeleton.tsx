import { motion } from "framer-motion";

/**
 * Skeleton de loading exibido enquanto rotas lazy-loaded são carregadas.
 * Reproduz a estética do PageShell (blobs + dark glass) para evitar flash visual.
 */
export function PageSkeleton() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Decorative blobs (mesmos do PageShell) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[28rem] w-[28rem] rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-[32rem] w-[32rem] rounded-full bg-secondary/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[24rem] w-[24rem] rounded-full bg-accent/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        {/* Hero skeleton */}
        <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-secondary/40 via-primary/30 to-secondary/40 p-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 animate-pulse rounded-2xl bg-white/20" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 animate-pulse rounded-full bg-white/20" />
              <div className="h-6 w-2/3 animate-pulse rounded-lg bg-white/30" />
              <div className="h-3 w-1/2 animate-pulse rounded-full bg-white/15" />
            </div>
          </div>
        </div>

        {/* Cards skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.08 }}
              className="h-32 rounded-3xl border border-border/40 bg-card/40 p-5 backdrop-blur-xl"
            >
              <div className="h-3 w-20 animate-pulse rounded-full bg-foreground/10" />
              <div className="mt-3 h-7 w-16 animate-pulse rounded-lg bg-foreground/15" />
              <div className="mt-3 h-2 w-full animate-pulse rounded-full bg-foreground/10" />
            </motion.div>
          ))}
        </div>

        {/* Spinner discreto */}
        <div className="mt-12 flex items-center justify-center gap-3">
          <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
          <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
          <div className="h-2 w-2 animate-bounce rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
}
