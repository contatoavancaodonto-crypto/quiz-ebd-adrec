import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { MemberSidebar } from "./MemberSidebar";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";

interface MemberLayoutProps {
  children: ReactNode;
  title: string;
}

export function MemberLayout({ children, title }: MemberLayoutProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <MemberSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b border-border px-4 sticky top-0 bg-background/80 backdrop-blur z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 p-4 md:p-8 max-w-5xl w-full mx-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
