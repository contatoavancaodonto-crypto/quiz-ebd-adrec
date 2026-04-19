import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Loader2, FileSearch } from "lucide-react";
import { MemberLayout } from "@/components/membro/MemberLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFullProfile } from "@/hooks/useFullProfile";
import { supabase } from "@/integrations/supabase/client";

export default function Historico() {
  const { data: profile } = useFullProfile();
  const navigate = useNavigate();
  const fullName = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim().toLowerCase();

  const { data: history, isLoading } = useQuery({
    queryKey: ["my-history", fullName, profile?.church_id],
    enabled: !!fullName,
    queryFn: async () => {
      const { data: attempts } = await supabase
        .from("quiz_attempts")
        .select("id, score, total_time_ms, finished_at, season_id, participant:participants(name), seasons(name, status)")
        .not("finished_at", "is", null)
        .order("finished_at", { ascending: false });

      const mine = (attempts ?? []).filter(
        (a: any) => (a.participant?.name ?? "").toLowerCase() === fullName
      );

      // Get general position for each attempt
      const enriched = await Promise.all(
        mine.map(async (a: any) => {
          const { data: g } = await supabase
            .from("ranking_general")
            .select("position")
            .eq("attempt_id", a.id)
            .maybeSingle();

          let churchPos: number | null = null;
          if (profile?.church_id) {
            const { data: rows } = await supabase
              .from("ranking_general")
              .select("position, attempt_id, church_id")
              .eq("church_id", profile.church_id)
              .order("position", { ascending: true });
            const idx = (rows ?? []).findIndex((r: any) => r.attempt_id === a.id);
            if (idx >= 0) churchPos = idx + 1;
          }

          return {
            ...a,
            generalPosition: g?.position ?? null,
            churchPosition: churchPos,
          };
        })
      );

      return enriched;
    },
  });

  if (isLoading) return <MemberLayout title="Histórico"><div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div></MemberLayout>;

  return (
    <MemberLayout title="Histórico de Trimestres">
      {!history || history.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Você ainda não tem tentativas concluídas.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {history.map((h: any) => (
            <Card key={h.id}>
              <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-semibold">{h.seasons?.name ?? "Temporada"}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(h.finished_at).toLocaleDateString("pt-BR")}
                  </p>
                  <div className="flex flex-wrap gap-3 text-sm pt-1">
                    <span><strong>{h.score}</strong> pts</span>
                    <span className="text-muted-foreground">
                      {h.generalPosition ? `Geral #${h.generalPosition}` : "—"}
                    </span>
                    <span className="text-muted-foreground">
                      {h.churchPosition ? `Igreja #${h.churchPosition}` : "—"}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/gabarito?attempt=${h.id}`)}
                >
                  <FileSearch /> Ver gabarito
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </MemberLayout>
  );
}
