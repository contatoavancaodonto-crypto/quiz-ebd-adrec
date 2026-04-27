import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * PageShell — wrapper padrão de página seguindo o visual da Home (/):
 * - background blobs (primary + secondary)
 * - container z-index acima dos blobs
 * - espaçamento vertical consistente
 *
 * Use sempre dentro do <main> do layout (MemberLayout / AdminLayout / página pública).
 */
export function PageShell({
  children,
  className,
  contentClassName,
}: {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      {/* Background blobs (mesma estética da Home) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-40 -right-20 w-72 h-72 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <div
        className={cn(
          "relative z-10 px-4 pt-4 pb-6 md:px-0 md:pt-0 md:pb-0 space-y-5",
          contentClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * SectionLabel — label de seção (barrinha vertical + texto uppercase) idêntico à Home.
 */
export function SectionLabel({
  label,
  color = "primary",
  inline = false,
  right,
}: {
  label: string;
  color?: "primary" | "secondary" | "warning" | "success" | "muted" | "destructive";
  inline?: boolean;
  right?: ReactNode;
}) {
  const barColor =
    color === "primary"
      ? "bg-primary"
      : color === "secondary"
      ? "bg-secondary"
      : color === "warning"
      ? "bg-amber-500"
      : color === "success"
      ? "bg-emerald-500"
      : color === "destructive"
      ? "bg-destructive"
      : "bg-muted-foreground";

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        !inline && "px-1",
        right && "justify-between"
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn("block w-1 h-3.5 rounded-full", barColor)} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      {right}
    </div>
  );
}
