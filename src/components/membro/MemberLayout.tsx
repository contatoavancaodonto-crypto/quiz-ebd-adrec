import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { MemberSidebar } from "./MemberSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { AppHeader } from "./AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { ThemeToggle } from "@/components/ThemeToggle";

type MobileHeader =
  | { variant: "full" }
  | { variant: "back"; title: string; subtitle?: string; backTo?: string; onBack?: () => void }
  | { variant: "none" };

interface MemberLayoutProps {
  children: ReactNode;
  /** Título exibido no header desktop */
  title: string;
  /**
   * Header mobile:
   * - omitido / undefined => usa "back" com o `title` como padrão (drill-down)
   * - { variant: "full" } => header com logo + sino + avatar (home)
   * - { variant: "back", title } => header com voltar + título
   * - { variant: "none" } => sem header mobile (página com header próprio)
   */
  mobileHeader?: MobileHeader;
  /** Configuração do bottom nav. Passe `false` para esconder. */
  bottomNav?:
    | false
    | {
        showFab?: boolean;
        onFabClick?: () => void;
        fabLabel?: string;
      };
  /** Container interno com padding mobile padrão */
  contentPaddingMobile?: boolean;
}

export function MemberLayout({
  children,
  title,
  mobileHeader,
  bottomNav = { showFab: false },
  contentPaddingMobile = true,
}: MemberLayoutProps) {
  const { user, loading } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  // Default: usa "back" com o title da página
  const resolvedMobileHeader: MobileHeader =
    mobileHeader ?? { variant: "back", title };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Sidebar */}
        <MemberSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header DESKTOP (sempre que md+) */}
          <header className="hidden md:flex h-14 items-center justify-between border-b border-border px-4 sticky top-0 bg-background/80 backdrop-blur z-20">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            </div>
            <ThemeToggle />
          </header>

          {/* Header MOBILE — controlado pela prop */}
          {resolvedMobileHeader.variant === "full" && (
            <AppHeader
              variant="full"
              firstName={profile?.first_name ?? ""}
            />
          )}
          {resolvedMobileHeader.variant === "back" && (
            <AppHeader
              variant="back"
              title={resolvedMobileHeader.title}
              subtitle={resolvedMobileHeader.subtitle}
              backTo={resolvedMobileHeader.backTo}
              onBack={resolvedMobileHeader.onBack}
            />
          )}

          <main
            className={`flex-1 w-full max-w-5xl mx-auto md:p-8 ${
              contentPaddingMobile ? "px-4 py-4 md:px-8 md:py-8" : ""
            }`}
          >
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
