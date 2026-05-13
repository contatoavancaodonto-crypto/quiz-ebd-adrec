import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { User, BarChart3, GraduationCap, Settings } from "lucide-react";
import { motion } from "framer-motion";

const tabs = [
  { id: "perfil", label: "Perfil", path: "/membro/perfil", icon: User },
  { id: "desempenho", label: "Desempenho", path: "/membro/desempenho", icon: BarChart3 },
  { id: "boletim", label: "Boletim", path: "/membro/historico", icon: GraduationCap },
  { id: "config", label: "Ajustes", path: "/membro/configuracoes", icon: Settings },
];

export function AccountTabs() {
  return (
    <div className="w-full overflow-x-auto pb-2 mb-6 scrollbar-none snap-x snap-mandatory">
      <div className="flex items-center gap-2 min-w-max px-1">
        {tabs.map((tab) => (
          <NavLink
            key={tab.id}
            to={tab.path}
            className={({ isActive }) =>
              cn(
                "relative flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all snap-start",
                isActive
                  ? "text-primary bg-primary/10 shadow-sm shadow-primary/5"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )
            }
          >
            {({ isActive }) => (
              <>
                <tab.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                <span>{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="account-tab-active"
                    className="absolute inset-0 rounded-full border border-primary/20"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
