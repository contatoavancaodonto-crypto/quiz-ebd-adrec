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

const allItems = [
  { title: "Visão Geral", url: "/painel-ebd-2025", icon: LayoutDashboard, end: true },
  { title: "Usuários & Roles", url: "/painel-ebd-2025/usuarios", icon: Users, superadminOnly: true },
  { title: "Igrejas", url: "/painel-ebd-2025/igrejas", icon: Church, superadminOnly: true },
  { title: "Turmas", url: "/painel-ebd-2025/turmas", icon: GraduationCap, superadminOnly: true },
  { title: "Quizzes & Perguntas", url: "/painel-ebd-2025/quizzes", icon: HelpCircle, superadminOnly: true },
  { title: "Temporadas", url: "/painel-ebd-2025/temporadas", icon: CalendarRange, superadminOnly: true },
  { title: "Tentativas", url: "/painel-ebd-2025/tentativas", icon: ListChecks },
  { title: "Respostas Membros", url: "/painel-ebd-2025/respostas-membros", icon: ClipboardCheck },
  { title: "Badges", url: "/painel-ebd-2025/badges", icon: Award, superadminOnly: true },
  { title: "Versículos", url: "/painel-ebd-2025/versiculos", icon: BookText, superadminOnly: true },
  { title: "Materiais", url: "/painel-ebd-2025/materiais", icon: FolderOpen },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut } = useAuth();
  const { isSuperadmin } = useRoles();
  const navigate = useNavigate();

  const items = allItems.filter((i) => isSuperadmin || !i.superadminOnly);

  const handleLogout = async () => {
    await signOut();
    toast.success("Você saiu com sucesso");
    navigate("/auth");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
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
                      className="hover:bg-muted/50"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
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
              <NavLink to="/" className="hover:bg-muted/50">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {!collapsed && <span>Voltar ao app</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
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
