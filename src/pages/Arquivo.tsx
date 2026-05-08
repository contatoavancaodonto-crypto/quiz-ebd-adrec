import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar,
  Users,
  Sparkles,
  ChevronRight,
  Lock,
  Archive,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuizStore } from "@/stores/quizStore";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useActiveSeason } from "@/hooks/useActiveSeason";
import { useCountdown } from "@/hooks/useCountdown";
import { MemberLayout } from "@/components/membro/MemberLayout";
import { PageShell } from "@/components/ui/page-shell";
import { PageHero, HeroChip } from "@/components/ui/page-hero";
import { useCurrentPeriodLabel } from "@/hooks/useCurrentPeriodLabel";

const classIcons: Record<string, string> = {
  Adultos: "🤵🏻‍♂️🤵🏻‍♀️",
  Jovens: "🎺",
  Adolescentes: "🙆🏻‍♂️🙆🏻‍♀️",
};

const QUIZ_CLOSED = false;
const AVAILABLE_TRIMESTERS: number[] = [2];
const CLOSED_TRIMESTERS: number[] = [1];

export default function Arquivo() {
  const [selectedClass, setSelectedClass] = useState<{ id: string; name: string } | null>(null);
  const [selectedTrimester, setSelectedTrimester] = useState<number>(2);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setParticipant, setChurch } = useQuizStore();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { data: season } = useActiveSeason();
  const seasonCountdown = useCountdown(season?.end_date);
  const seasonExpired = !!season && seasonCountdown.expired;

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [user, authLoading, navigate]);

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const handleTrimesterClick = (t: number) => {
    if (!AVAILABLE_TRIMESTERS.includes(t) && !CLOSED_TRIMESTERS.includes(t)) {
      toast.info(`📅 ${t}º Trimestre - Disponível em breve!`);
      return;
    }
    setSelectedTrimester(t);
  };

  const isQuizDisabled =
    CLOSED_TRIMESTERS.includes(selectedTrimester) ||
    !AVAILABLE_TRIMESTERS.includes(selectedTrimester);

  const handleStart = async () => {
    if (seasonExpired) return toast.error("Este quiz foi encerrado.");
    if (QUIZ_CLOSED) return toast.error("⏰ Tempo esgotado!");
    if (!profile?.first_name) return toast.error("Perfil incompleto.");
    if (!selectedClass) return toast.error("Selecione uma turma.");
    if (CLOSED_TRIMESTERS.includes(selectedTrimester))
      return toast.info(`🔒 ${selectedTrimester}º Tri. encerrado.`);
    if (!AVAILABLE_TRIMESTERS.includes(selectedTrimester))
      return toast.info(`📅 ${selectedTrimester}º Tri. em breve!`);
    if (selectedClass.name === "Adolescentes")
      return toast.info("🚧 Em construção!");

    setLoading(true);
    try {
      const fullName = `${profile.first_name} ${profile.last_name ?? ""}`.trim();
      setParticipant(fullName, selectedClass.id, selectedClass.name, selectedTrimester);
      if (profile.church_id && profile.church_name) {
        setChurch(profile.church_id, profile.church_name);
      }
      navigate("/quiz");
    } catch {
      toast.error("Erro ao iniciar.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <MemberLayout
      title="Arquivo trimestral"
      mobileHeader={{ variant: "back", title: "Arquivo trimestral", subtitle: "Provões anteriores", backTo: "/" }}
    >
      <PageShell contentClassName="flex flex-col items-center px-4 pt-2 pb-6 space-y-5">
        <div className="w-full max-w-md space-y-5">
          <PageHero
            eyebrow="Provões · 1º TRI. 2026 - ADREC"
            title="Arquivo trimestral"
            description="Refaça os provões de 13 perguntas dos trimestres disponíveis."
            Icon={Archive}
            variant="primary"
          >
            <div className="flex flex-wrap gap-2">
              <HeroChip Icon={Calendar}>
                {AVAILABLE_TRIMESTERS.length} {AVAILABLE_TRIMESTERS.length === 1 ? "trimestre aberto" : "trimestres abertos"}
              </HeroChip>
              {CLOSED_TRIMESTERS.length > 0 && (
                <HeroChip Icon={Lock}>
                  {CLOSED_TRIMESTERS.length} encerrado{CLOSED_TRIMESTERS.length === 1 ? "" : "s"}
                </HeroChip>
              )}
            </div>
          </PageHero>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-5 space-y-4"
          >
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Provões trimestrais
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Acesse o provão de 13 perguntas de cada trimestre. Para o quiz
                semanal de 5 perguntas, volte para a tela inicial.
              </p>
            </div>

            {QUIZ_CLOSED || seasonExpired ? (
              <div className="text-center space-y-2 py-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10">
                  <Lock className="w-6 h-6 text-destructive" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {seasonExpired
                    ? "Temporada encerrada."
                    : "Período de respostas encerrado."}
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-2">
                    <Calendar className="w-3.5 h-3.5 inline mr-1" />
                    Trimestre
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((t) => {
                      const closed = CLOSED_TRIMESTERS.includes(t);
                      const available = AVAILABLE_TRIMESTERS.includes(t);
                      const selectable = available || closed;
                      const active = selectedTrimester === t && selectable;
                      return (
                        <motion.button
                          key={t}
                          whileHover={{ scale: selectable ? 1.05 : 1 }}
                          whileTap={{ scale: selectable ? 0.95 : 1 }}
                          onClick={() => handleTrimesterClick(t)}
                          className={`py-2.5 rounded-xl border-2 transition-all text-center cursor-pointer ${
                            active
                              ? "border-primary bg-primary/10 shadow-md"
                              : selectable
                              ? "border-border bg-muted/50 hover:border-primary/40"
                              : "border-border bg-muted/30 opacity-60"
                          }`}
                        >
                          <div className="text-sm font-bold text-foreground">
                            {t}º
                          </div>
                          <div className="text-[9px] text-muted-foreground">
                            {closed ? "Encerrado" : available ? "Tri." : "Em breve"}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-2">
                    <Users className="w-3.5 h-3.5 inline mr-1" />
                    Turma
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {classes?.map((cls) => (
                      <motion.button
                        key={cls.id}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setSelectedClass({ id: cls.id, name: cls.name })}
                        className={`p-2 rounded-xl border-2 transition-all text-center cursor-pointer flex flex-col items-center justify-center min-h-[80px] ${
                          selectedClass?.id === cls.id
                            ? "border-primary bg-primary/10 shadow-md"
                            : "border-border bg-muted/50 hover:border-primary/40"
                        }`}
                      >
                        <div className="text-base mb-1 leading-none h-5 flex items-center justify-center">
                          {classIcons[cls.name] || "📚"}
                        </div>
                        <div className="text-[11px] font-semibold text-foreground leading-tight">
                          {cls.name}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: isQuizDisabled ? 1 : 1.02 }}
                  whileTap={{ scale: isQuizDisabled ? 1 : 0.98 }}
                  onClick={handleStart}
                  disabled={loading || isQuizDisabled}
                  className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-shadow disabled:opacity-60 disabled:cursor-not-allowed ${
                    isQuizDisabled
                      ? "bg-muted text-muted-foreground"
                      : "gradient-primary text-primary-foreground hover:shadow-lg cursor-pointer"
                  }`}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : isQuizDisabled ? (
                    <>
                      <Lock className="w-4 h-4" />
                      {selectedTrimester}º Tri. Encerrado
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Iniciar {selectedTrimester}º Tri.
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </>
            )}
          </motion.div>
        </div>
      </PageShell>
    </MemberLayout>
  );
}
