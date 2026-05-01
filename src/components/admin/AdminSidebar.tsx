import {
  LayoutDashboard,
  Users,
  Church,
  GraduationCap,
  HelpCircle,
  CalendarRange,
  ListChecks,
  ClipboardCheck,
  Award,
  BookText,
  FolderOpen,
  ArrowLeft,
  LogOut,
  Building2,
  UsersRound,
  ShieldCheck,
  History,
} from "lucide-react";
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
import { cn } from "@/lib/utils";

type Item = {
  title: string;
  url: string;
  icon: any;
  end?: boolean;
  superadminOnly?: boolean;
  churchAdminOnly?: boolean;
};

const allItems: Item[] = [
  { title: "Visão Geral", url: "/painel", icon: LayoutDashboard, end: true },
  // Admin de igreja (oculto para superadmin)
  { title: "Minha Igreja", url: "/painel/minha-igreja", icon: Building2, churchAdminOnly: true },
  { title: "Membros da Igreja", url: "/painel/membros", icon: UsersRound, churchAdminOnly: true },
  { title: "Admins Locais", url: "/painel/admins-locais", icon: ShieldCheck, churchAdminOnly: true },
  // Superadmin
  { title: "Usuários & Roles", url: "/painel/usuarios", icon: Users, superadminOnly: true },
  { title: "Igrejas", url: "/painel/igrejas", icon: Church, superadminOnly: true },
  { title: "Turmas", url: "/painel/turmas", icon: GraduationCap, superadminOnly: true },
  { title: "Quizzes & Perguntas", url: "/painel/quizzes", icon: HelpCircle, superadminOnly: true },
  { title: "Temporadas", url: "/painel/temporadas", icon: CalendarRange, superadminOnly: true },
  // Compartilhados
  { title: "Tentativas", url: "/painel/tentativas", icon: ListChecks },
  { title: "Respostas Membros", url: "/painel/respostas-membros", icon: ClipboardCheck },
  { title: "Badges", url: "/painel/badges", icon: Award, superadminOnly: true },
  { title: "Plano de Leitura", url: "/painel/versiculos", icon: BookText, superadminOnly: true },
  { title: "Materiais", url: "/painel/materiais", icon: FolderOpen, superadminOnly: true },
  { title: "Histórico de Alterações", url: "/painel/auditoria", icon: History, superadminOnly: true },
];

export function AdminSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut } = useAuth();
  const { isSuperadmin, isChurchAdmin } = useRoles();
  const navigate = useNavigate();

  const items = allItems.filter((i) => {
    if (i.superadminOnly && !isSuperadmin) return false;
    // Superadmin vê tudo, Church Admin vê apenas o que lhe é permitido
    if (i.churchAdminOnly && !isChurchAdmin && !isSuperadmin) return false;
    return true;
  });

  // Fecha o drawer no mobile ao navegar
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
      <SidebarContent className="overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupLabel>Painel Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.end}
                      onClick={closeOnMobile}
                      className={cn(
                        "hover:bg-muted/50 transition-colors",
                        isMobile ? "py-4 px-4 h-auto text-base" : ""
                      )}
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {(!collapsed || isMobile) && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink 
                to="/" 
                onClick={closeOnMobile} 
                className={cn(
                  "hover:bg-muted/50 transition-colors",
                  isMobile ? "py-3 px-4 h-auto" : ""
                )}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {(!collapsed || isMobile) && <span>Voltar ao app</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className={cn(
                "text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors",
                isMobile ? "py-3 px-4 h-auto" : ""
              )}
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
