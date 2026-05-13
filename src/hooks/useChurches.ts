import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Lista de igrejas aprovadas e ativas, atualizada em tempo real.
 * Usada nos selects de cadastro e completar perfil.
 */
export function useChurches() {
  const [churches, setChurches] = useState<string[]>([]);
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("churches")
      .select("name, approved, active, requested")
      // Removida a restrição de aprovada para permitir que igrejas recém criadas apareçam no cadastro
      .order("name");
    const dataArr = data ?? [];
    setRawData(dataArr);
    const names = dataArr
      .map((c: any) => c.name as string)
      .filter((n) => !!n && !n.startsWith("SOLICITAÇÃO -"));
    setChurches(Array.from(new Set(names)));
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("churches-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "churches" },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { churches, rawData, loading };
}
