import { User, BarChart3, History, BookOpen, Music2, FileText, Settings, Home, LogOut, Shield, LifeBuoy, Users, GraduationCap, Heart, ShoppingBag, Award } from "lucide-react";
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
import { useRoles } from "@/hooks/useRoles";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { usePrefetch } from "@/hooks/usePrefetch";
import { useQueryClient } from "@tanstack/react-query";
import { useActiveSeason } from "@/hooks/useActiveSeason";
import { Badge } from "@/components/ui/badge";

const items: Array<{
  title: string;
  url: string;
  icon: typeof User;
  type?: 'profile' | 'ranking' | 'biblia' | 'harpa' | 'history';
  comingSoon?: boolean;
}> = [
  { title: "Meu Perfil", url: "/membro/perfil", icon: User, type: 'profile' },
  { title: "Meu Desempenho", url: "/membro/desempenho", icon: BarChart3 },
  { title: "Comunidade EBD", url: "/membro/comunidade", icon: Users },
  { title: "Conquistas", url: "/membro/conquistas", icon: Award },
  { title: "Boletim Acadêmico", url: "/membro/historico", icon: GraduationCap, type: 'history' },

  { title: "Subsídios da Classe", url: "/membro/revista", icon: FileText },
  { title: "Subsídio ao Professor", url: "/membro/revista", icon: GraduationCap },
  { title: "Bíblia Online", url: "/membro/biblia", icon: BookOpen, type: 'biblia' },
  { title: "Harpa Cristã", url: "/membro/harpa", icon: Music2, type: 'harpa' },
  { title: "Configurações", url: "/membro/configuracoes", icon: Settings },
  { title: "Loja", url: "/membro/loja", icon: ShoppingBag, comingSoon: true },
  { title: "Suporte", url: "/membro/suporte", icon: LifeBuoy },
  { title: "Apoiar Projeto", url: "/oferta", icon: Heart },
];

export function MemberSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { isAdmin } = useRoles();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: season } = useActiveSeason();
  const { prefetchRanking, prefetchBiblia, prefetchProfile, prefetchHarpa, prefetchHistory } = usePrefetch(queryClient);

  const handlePrefetch = (type: string | undefined) => {
    if (type === 'ranking') prefetchRanking();
    if (type === 'biblia') prefetchBiblia();
    if (type === 'harpa') prefetchHarpa();
    if (type === 'profile') prefetchProfile(user?.id);
    if (type === 'history') prefetchHistory(user?.id, season?.id);
  };

  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  const handleLogout = async () => {
    closeOnMobile();
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
                    onClick={closeOnMobile}
                    className="hover:bg-muted/50"
                    activeClassName="bg-muted text-primary font-medium"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    {(!collapsed || isMobile) && <span>Início</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      onClick={closeOnMobile}
                      onMouseEnter={() => handlePrefetch(item.type)}
                      onTouchStart={() => handlePrefetch(item.type)}
                      className="hover:bg-muted/50"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {(!collapsed || isMobile) && (
                        <div className="flex items-center justify-between flex-1">
                          <span>{item.title}</span>
                          {item.comingSoon && (
                            <Badge variant="secondary" className="text-[8px] h-4 px-1 ml-auto font-bold uppercase tracking-tighter">
                              Em breve
                            </Badge>
                          )}
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/painel"
                      end
                      onClick={closeOnMobile}
                      className="hover:bg-muted/50"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      {(!collapsed || isMobile) && <span>Painel Admin</span>}
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
              {(!collapsed || isMobile) && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
