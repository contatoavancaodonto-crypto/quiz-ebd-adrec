import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";

/**
 * AdminPage — wrapper padrão para páginas administrativas.
 * Aplica o mesmo hero/cabeçalho gradiente da Home e organiza o conteúdo
 * em uma section consistente.
 */
export function AdminPage({
  title,
  description,
  Icon,
  variant = "secondary",
  eyebrow = "Painel administrativo",
  actions,
  children,
}: {
  title: string;
  description?: string;
  Icon?: LucideIcon;
  variant?: "primary" | "secondary" | "amber" | "emerald" | "rose";
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-5">
      <PageHero
        eyebrow={eyebrow}
        title={title}
        description={description}
        Icon={Icon}
        variant={variant}
        actions={actions}
      />

      <section className="space-y-4">{children}</section>
    </div>
  );
}
