import { ReactNode } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type HeroVariant = "primary" | "secondary" | "amber" | "emerald" | "rose";

/**
 * PageHero — bloco de cabeçalho gradiente seguindo o padrão da Home (/).
 *
 * - Gradiente diagonal (secondary → primary por padrão)
 * - Blob de luz no canto superior direito
 * - Ícone fantasma decorativo no fundo
 * - Eyebrow uppercase + título display + descrição
 * - Slot para children (badges, métricas, CTA)
 */
export function PageHero({
  eyebrow,
  title,
  description,
  Icon,
  variant = "secondary",
  children,
  className,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  Icon?: LucideIcon;
  variant?: HeroVariant;
  children?: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  const gradient =
    variant === "primary"
      ? "from-primary via-primary/90 to-secondary"
      : variant === "amber"
      ? "from-amber-500 via-orange-500 to-amber-600"
      : variant === "emerald"
      ? "from-emerald-500 via-emerald-500/90 to-teal-600"
      : variant === "rose"
      ? "from-rose-500 via-rose-500/90 to-red-600"
      : "from-secondary via-secondary/90 to-primary";

  const shadow =
    variant === "primary"
      ? "shadow-primary/20"
      : variant === "amber"
      ? "shadow-amber-500/20"
      : variant === "emerald"
      ? "shadow-emerald-500/20"
      : variant === "rose"
      ? "shadow-rose-500/20"
      : "shadow-secondary/20";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className={cn(
        "relative overflow-hidden rounded-3xl bg-gradient-to-br p-6 shadow-xl",
        gradient,
        shadow,
        className
      )}
    >
      {/* Blob de luz */}
      <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />

      {/* Ícone fantasma */}
      {Icon && (
        <div className="absolute top-4 right-4 opacity-20 pointer-events-none">
          <Icon className="w-24 h-24 text-white" strokeWidth={1.2} />
        </div>
      )}

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {eyebrow && (
              <div className="text-[10px] uppercase tracking-widest text-white/70 font-bold mb-1">
                {eyebrow}
              </div>
            )}
            <h1 className="text-2xl md:text-3xl font-display font-extrabold text-white leading-tight">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-white/85 mt-2 max-w-[90%]">{description}</p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>

        {children && <div className="mt-4">{children}</div>}
      </div>
    </motion.div>
  );
}

/**
 * HeroChip — pílula glass para usar dentro do PageHero (ex.: streak, status).
 */
export function HeroChip({
  Icon,
  children,
}: {
  Icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur border border-white/20">
      {Icon && <Icon className="w-4 h-4 text-white" />}
      <span className="text-xs font-bold text-white">{children}</span>
    </div>
  );
}
