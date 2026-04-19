import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { AdminGuard } from "./AdminGuard";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AdminLayout() {
  return (
    <AdminGuard>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AdminSidebar />
          <div className="flex-1 flex flex-col">
            <header className="h-14 flex items-center justify-between border-b border-border px-4 sticky top-0 bg-background/80 backdrop-blur z-10">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <h1 className="text-lg font-semibold text-foreground">
                  Painel Administrativo
                </h1>
              </div>
              <ThemeToggle />
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
