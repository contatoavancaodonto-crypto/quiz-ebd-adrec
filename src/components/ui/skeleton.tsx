import { cn } from "@/lib/utils";

// Animação de carregamento removida globalmente para deixar o app mais rápido.
// O componente continua reservando espaço (evita layout shift), mas sem pulse.
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-md bg-muted/40", className)} {...props} />;
}

export { Skeleton };
