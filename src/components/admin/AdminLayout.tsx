import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { AdminGuard } from "./AdminGuard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Crown, Shield } from "lucide-react";
import { useRoles } from "@/hooks/useRoles";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

function RoleBadge() {
  const { isSuperadmin, isChurchAdmin, churchId, loading } = useRoles();
  const [churchName, setChurchName] = useState<string | null>(null);

  useEffect(() => {
    if (!isChurchAdmin || !churchId) {
      setChurchName(null);
      return;
    }
    let cancelled = false;
    supabase
      .from("churches")
      .select("name")
      .eq("id", churchId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setChurchName(data?.name ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [isChurchAdmin, churchId]);

  if (loading) return null;
  if (isSuperadmin) {
    return (
      <Badge className="bg-primary text-primary-foreground gap-1">
        <Crown className="w-3 h-3" />
        Superadmin
      </Badge>
    );
  }
  if (isChurchAdmin) {
    return (
      <Badge variant="secondary" className="gap-1 max-w-[240px]">
        <Shield className="w-3 h-3 shrink-0" />
        <span className="truncate">
          Admin{churchName ? ` · ${churchName}` : " de Igreja"}
        </span>
      </Badge>
    );
  }
  return null;
}

export function AdminLayout() {
  return (
    <AdminGuard>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AdminSidebar />
          <div className="flex-1 flex flex-col">
            <header className="h-14 flex items-center justify-between border-b border-border px-4 sticky top-0 bg-background/80 backdrop-blur z-10">
              <div className="flex items-center gap-3 min-w-0">
                <SidebarTrigger />
                <h1 className="text-lg font-semibold text-foreground truncate">
                  Painel Administrativo
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <RoleBadge />
                <ThemeToggle />
              </div>
            </header>
            <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </AdminGuard>
  );
}
