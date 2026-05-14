import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ClassSwitcherContextType {
  selectedClassId: string | null;
  setSelectedClassId: (id: string | null) => void;
  classes: any[];
  isLoading: boolean;
}

const ClassSwitcherContext = createContext<ClassSwitcherContextType>({
  selectedClassId: null,
  setSelectedClassId: () => {},
  classes: [],
  isLoading: true,
});

export function ClassSwitcherProvider({ children }: { children: ReactNode }) {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadClasses() {
      const { data } = await supabase
        .from("classes")
        .select("*")
        .eq("active", true)
        .order("name");
      
      if (data) {
        setClasses(data);
        // Persistir seleção anterior ou pegar a primeira
        const saved = localStorage.getItem("admin_selected_class_id");
        if (saved && data.find(c => c.id === saved)) {
          setSelectedClassId(saved);
        } else if (data.length > 0) {
          setSelectedClassId(data[0].id);
        }
      }
      setIsLoading(false);
    }
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      localStorage.setItem("admin_selected_class_id", selectedClassId);
    }
  }, [selectedClassId]);

  return (
    <ClassSwitcherContext.Provider
      value={{
        selectedClassId,
        setSelectedClassId,
        classes,
        isLoading,
      }}
    >
      {children}
    </ClassSwitcherContext.Provider>
  );
}

export function useClassSwitcher() {
  return useContext(ClassSwitcherContext);
}
