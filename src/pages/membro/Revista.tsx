import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, Loader2 } from "lucide-react";
import { MemberLayout } from "@/components/membro/MemberLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useFullProfile } from "@/hooks/useFullProfile";

export default function Revista() {
  const { data: profile } = useFullProfile();
  const fullName = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim().toLowerCase();
  const [classId, setClassId] = useState<string | null>(null);

  // Try to detect the user's class from the most recent participant entry
  useEffect(() => {
    if (!fullName) return;
    (async () => {
      const { data } = await supabase
        .from("participants")
        .select("class_id, created_at")
        .ilike("name", fullName)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.class_id) setClassId(data.class_id);
    })();
  }, [fullName]);

  const { data: materials, isLoading } = useQuery({
    queryKey: ["my-class-material", classId],
    queryFn: async () => {
      let query = supabase
        .from("class_materials")
        .select("*, classes(name)")
        .order("year", { ascending: false })
        .order("trimester", { ascending: false });
      if (classId) query = query.eq("class_id", classId);
      const { data } = await query;
      return data ?? [];
    },
  });

  return (
    <MemberLayout title="Revista da Classe">
      {isLoading ? (
        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
      ) : !materials || materials.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>Nenhuma revista disponível ainda.</p>
            <p className="text-xs mt-1">O administrador publicará as revistas em breve.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {materials.map((m: any) => (
            <Card key={m.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-5 w-5 text-primary" />
                  {m.title}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {m.classes?.name} · {m.trimester}º Trimestre · {m.year}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {m.description && (
                  <p className="text-sm text-muted-foreground">{m.description}</p>
                )}
                <Button asChild className="w-full sm:w-auto">
                  <a href={m.file_url} target="_blank" rel="noopener noreferrer" download>
                    <Download /> Baixar PDF
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </MemberLayout>
  );
}
