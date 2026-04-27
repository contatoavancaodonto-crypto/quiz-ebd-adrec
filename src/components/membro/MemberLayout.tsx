import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { MemberSidebar } from "./MemberSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";

interface MemberLayoutProps {
  children: ReactNode;
  title: string;
  /** Esconde o header padrão no mobile (use quando a página tiver header próprio app-like) */
  hideMobileHeader?: boolean;
  /** Configuração do bottom nav. Passe `false` para esconder. */
  bottomNav?:
    | false
    | {
        showFab?: boolean;
        onFabClick?: () => void;
        fabLabel?: string;
      };
}

export function MemberLayout({
  children,
  title,
  hideMobileHeader = false,
  bottomNav = { showFab: false },
}: MemberLayoutProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Sidebar fica disponível no md+ */}
        <div className="hidden md:flex">
          <MemberSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header desktop (sempre) + mobile (se não escondido) */}
          <header
            className={`h-14 items-center justify-between border-b border-border px-4 sticky top-0 bg-background/80 backdrop-blur z-20 ${
              hideMobileHeader ? "hidden md:flex" : "flex"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="hidden md:block">
                <SidebarTrigger />
              </div>
              <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            </div>
            <ThemeToggle />
          </header>

          <main className="flex-1 w-full max-w-5xl mx-auto md:p-8">
            {children}
          </main>

          {/* Bottom nav só no mobile */}
          {bottomNav !== false && (
            <MobileBottomNav
              showFab={bottomNav.showFab}
              onFabClick={bottomNav.onFabClick}
              fabLabel={bottomNav.fabLabel}
            />
          )}
        </div>
      </div>
    </SidebarProvider>
  );
}
