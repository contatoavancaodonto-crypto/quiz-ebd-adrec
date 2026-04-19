import { useEffect, useState } from "react";
import { User, BarChart3, History, BookOpen, Music2, FileText, Settings, Home, LogOut, Shield } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const items = [
  { title: "Meu Perfil", url: "/membro/perfil", icon: User },
  { title: "Meu Desempenho", url: "/membro/desempenho", icon: BarChart3 },
  { title: "Histórico", url: "/membro/historico", icon: History },
  { title: "Revista da Classe", url: "/membro/revista", icon: FileText },
  { title: "Bíblia Online", url: "/membro/biblia", icon: BookOpen },
  { title: "Harpa Cristã", url: "/membro/harpa", icon: Music2 },
  { title: "Configurações", url: "/membro/configuracoes", icon: Settings },
];

export function MemberSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    supabase
      .rpc("has_role", { _user_id: user.id, _role: "admin" })
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    toast.success("Você saiu com sucesso");
    navigate("/auth");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Área de Membros</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/"
                    end
                    className="hover:bg-muted/50"
                    activeClassName="bg-muted text-primary font-medium"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Início</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-muted/50"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/painel-ebd-2025"
                      end
                      className="hover:bg-muted/50"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Painel Admin</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
