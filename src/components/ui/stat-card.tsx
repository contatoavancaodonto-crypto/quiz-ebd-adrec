import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * StatCard — card de métrica padrão seguindo o estilo da Home:
 * rounded-3xl, border sutil, ícone gradiente colorido, hover/animação.
 */
export function StatCard({
  label,
  value,
  Icon,
  hint,
  tone = "primary",
  index = 0,
  onClick,
}: {
  label: string;
  value: number | string;
  Icon: LucideIcon;
  hint?: string;
  tone?:
    | "primary"
    | "secondary"
    | "amber"
    | "emerald"
    | "rose"
    | "indigo"
    | "muted";
  index?: number;
  onClick?: () => void;
}) {
  const iconBg =
    tone === "primary"
      ? "from-primary to-secondary text-primary-foreground shadow-primary/30"
      : tone === "secondary"
      ? "from-secondary to-primary text-secondary-foreground shadow-secondary/30"
      : tone === "amber"
      ? "from-amber-500 to-orange-600 text-white shadow-amber-500/30"
      : tone === "emerald"
      ? "from-emerald-500 to-green-600 text-white shadow-emerald-500/30"
      : tone === "rose"
      ? "from-rose-500 to-red-600 text-white shadow-rose-500/30"
      : tone === "indigo"
      ? "from-indigo-500 to-blue-600 text-white shadow-indigo-500/30"
      : "from-muted to-muted text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 * index }}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-sm",
        onClick && "cursor-pointer hover:border-primary/40 hover:shadow-lg transition-all"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg",
            iconBg
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
            {label}
          </div>
          <div className="text-2xl font-display font-extrabold text-foreground leading-tight">
            {value}
          </div>
          {hint && (
            <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {hint}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
