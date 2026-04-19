import { useQuery } from "@tanstack/react-query";
import { Trophy, Target, Clock, Building2, Loader2 } from "lucide-react";
import { MemberLayout } from "@/components/membro/MemberLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFullProfile } from "@/hooks/useFullProfile";
import { supabase } from "@/integrations/supabase/client";
import { useActiveSeason } from "@/hooks/useActiveSeason";
import { useCountdown } from "@/hooks/useCountdown";
import { SeasonCountdown } from "@/components/SeasonCountdown";

export default function MeuDesempenho() {
  const { data: profile } = useFullProfile();
  const { data: season } = useActiveSeason();
  const seasonCountdown = useCountdown(season?.end_date);

  const fullName = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim().toLowerCase();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["my-performance", fullName, season?.id, profile?.church_id],
    enabled: !!fullName && !!season?.id,
    queryFn: async () => {
      const { data: general } = await supabase
        .from("ranking_general")
        .select("position, score, total_time_seconds, accuracy_percentage, participant_name, attempt_id")
        .ilike("participant_name", fullName)
        .order("position", { ascending: true })
        .limit(1)
        .maybeSingle();

      let churchPosition: number | null = null;
      if (profile?.church_id) {
        const { data: churchRows } = await supabase
          .from("ranking_general")
          .select("position, participant_name, church_id")
          .eq("church_id", profile.church_id)
          .order("position", { ascending: true });
        const idx = (churchRows ?? []).findIndex(
          (r: any) => (r.participant_name ?? "").toLowerCase() === fullName
        );
        if (idx >= 0) churchPosition = idx + 1;
      }

      const { data: badges } = await supabase
        .from("user_badges")
        .select("id, badge:badges(emoji, name, description)")
        .eq("season_id", season!.id);

      const myBadges = (badges ?? []).filter((b: any) => b.badge);

      return {
        general,
        churchPosition,
        badges: myBadges,
      };
    },
  });

  if (isLoading) return <MemberLayout title="Meu Desempenho"><div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div></MemberLayout>;

  const g = stats?.general;
  const cards = [
    { icon: Trophy, label: "Posição geral", value: g?.position ? `#${g.position}` : "—" },
    { icon: Building2, label: "Posição na igreja", value: stats?.churchPosition ? `#${stats.churchPosition}` : "—" },
    { icon: Target, label: "Pontuação", value: g?.score ?? "—" },
    { icon: Clock, label: "Tempo total", value: g?.total_time_seconds ? `${g.total_time_seconds}s` : "—" },
  ];

  return (
    <MemberLayout title="Meu Desempenho">
      <div className="space-y-6">
        {season && !seasonCountdown.expired && (
          <SeasonCountdown endDate={season.end_date} />
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map((c) => (
            <Card key={c.label}>
              <CardContent className="pt-6">
                <c.icon className="h-5 w-5 text-primary mb-2" />
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="text-2xl font-bold text-foreground">{c.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Conquistas da temporada</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.badges.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma conquista ainda. Continue jogando!</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {stats?.badges.map((b: any) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-lg p-3"
                  >
                    <div className="text-3xl">{b.badge.emoji}</div>
                    <div>
                      <p className="font-semibold text-sm">{b.badge.name}</p>
                      <p className="text-xs text-muted-foreground">{b.badge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MemberLayout>
  );
}
