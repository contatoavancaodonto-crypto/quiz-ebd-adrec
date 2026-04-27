import { useQuery } from "@tanstack/react-query";
import { Trophy, Target, Clock, Building2, Loader2, Sparkles, Award } from "lucide-react";
import { motion } from "framer-motion";
import { MemberLayout } from "@/components/membro/MemberLayout";
import { PageShell, SectionLabel } from "@/components/ui/page-shell";
import { PageHero } from "@/components/ui/page-hero";
import { StatCard } from "@/components/ui/stat-card";
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

      return { general, churchPosition, badges: myBadges };
    },
  });

  if (isLoading)
    return (
      <MemberLayout title="Meu Desempenho">
        <div className="flex justify-center p-8">
          <Loader2 className="animate-spin text-primary" />
        </div>
      </MemberLayout>
    );

  const g = stats?.general;
  const cards = [
    { Icon: Trophy, label: "Posição geral", value: g?.position ? `#${g.position}` : "—", tone: "amber" as const },
    { Icon: Building2, label: "Na igreja", value: stats?.churchPosition ? `#${stats.churchPosition}` : "—", tone: "secondary" as const },
    { Icon: Target, label: "Pontuação", value: g?.score ?? "—", tone: "primary" as const },
    { Icon: Clock, label: "Tempo total", value: g?.total_time_seconds ? `${g.total_time_seconds}s` : "—", tone: "emerald" as const },
  ];

  return (
    <MemberLayout
      title="Meu Desempenho"
      mobileHeader={{ variant: "back", title: "Meu Desempenho", subtitle: "Estatísticas da temporada", backTo: "/" }}
    >
      <PageShell contentClassName="pb-4">
        <PageHero
          eyebrow="Temporada atual"
          title="Meu desempenho"
          description="Sua posição, pontuação e conquistas em tempo real."
          Icon={Trophy}
          variant="primary"
        />

        {season && !seasonCountdown.expired && <SeasonCountdown />}

        <section className="space-y-2">
          <SectionLabel label="Indicadores" color="primary" />
          <div className="grid grid-cols-2 gap-3">
            {cards.map((c, i) => (
              <StatCard
                key={c.label}
                Icon={c.Icon}
                label={c.label}
                value={c.value}
                tone={c.tone}
                index={i}
              />
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <SectionLabel label="Conquistas da temporada" color="warning" />

          {stats?.badges.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-muted/20 p-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-muted mb-2">
                <Sparkles className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">Nenhuma conquista ainda</p>
              <p className="text-xs text-muted-foreground mt-1">
                Continue respondendo os quizzes pra desbloquear medalhas!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {stats?.badges.map((b: any, i: number) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20 rounded-2xl p-3"
                >
                  <div className="text-3xl shrink-0">{b.badge.emoji}</div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{b.badge.name}</p>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{b.badge.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </PageShell>
    </MemberLayout>
  );
}
