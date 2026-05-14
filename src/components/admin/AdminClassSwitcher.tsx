import { useClassSwitcher } from "@/hooks/useClassSwitcher";
import { useRoles } from "@/hooks/useRoles";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { GraduationCap, ChevronDown } from "lucide-react";

export function AdminClassSwitcher() {
  const { isAdmin } = useRoles();
  const { classes, selectedClassId, setSelectedClassId } = useClassSwitcher();

  if (!isAdmin) return null;

  const currentClass = classes.find((c) => c.id === selectedClassId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 bg-background/50 border-border/60 hover:bg-accent transition-colors"
        >
          <GraduationCap className="w-4 h-4 text-primary" />
          <span className="hidden sm:inline max-w-[120px] truncate">
            {currentClass?.name || "Selecionar Classe"}
          </span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuRadioGroup
          value={selectedClassId || ""}
          onValueChange={setSelectedClassId}
        >
          {classes.map((cls) => (
            <DropdownMenuRadioItem key={cls.id} value={cls.id}>
              {cls.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
