import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Loader2, FileSearch, Trophy, Calendar, Clock, ChevronRight, History as HistoryIcon } from "lucide-react";
import { motion } from "framer-motion";
import { MemberLayout } from "@/components/membro/MemberLayout";
import { PageShell } from "@/components/ui/page-shell";
import { PageHero } from "@/components/ui/page-hero";
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

  return (
    <MemberLayout
      title="Histórico"
      mobileHeader={{ variant: "back", title: "Histórico", subtitle: "Suas tentativas concluídas", backTo: "/" }}
    >
      <PageShell contentClassName="pb-4">
        <PageHero
          eyebrow="Suas tentativas"
          title={
            isLoading
              ? "—"
              : `${history?.length ?? 0} ${(history?.length ?? 0) === 1 ? "quiz concluído" : "quizzes concluídos"}`
          }
          description="Veja seu gabarito e posição em cada tentativa."
          Icon={HistoryIcon}
          variant="emerald"
        />

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : !history || history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-muted mb-2">
              <HistoryIcon className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground">Nada por aqui ainda</p>
            <p className="text-xs text-muted-foreground mt-1">
              Complete um quiz pra ele aparecer aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {history.map((h: any, i: number) => (
              <motion.button
                key={h.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => navigate(`/gabarito?attempt=${h.id}`)}
                className="w-full text-left rounded-2xl bg-card border border-border p-4 active:scale-[0.99] transition-all hover:border-primary/40 hover:shadow-md flex items-center gap-3"
              >
                <div className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/15 border border-primary/20 flex flex-col items-center justify-center">
                  <span className="text-lg font-display font-extrabold text-primary leading-none">
                    {h.score}
                  </span>
                  <span className="text-[8px] uppercase tracking-wide text-muted-foreground font-bold">pts</span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">
                    {h.seasons?.name ?? "Temporada"}
                  </p>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                    <Calendar className="w-3 h-3" />
                    {new Date(h.finished_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {h.generalPosition && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        <Trophy className="w-2.5 h-2.5" /> Geral #{h.generalPosition}
                      </span>
                    )}
                    {h.churchPosition && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
                        Igreja #{h.churchPosition}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1 text-muted-foreground">
                  <FileSearch className="w-4 h-4" />
                  <ChevronRight className="w-4 h-4" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </PageShell>
    </MemberLayout>
  );
}
