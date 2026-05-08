import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Clock, Medal, Calendar, Church, Users, Globe, Flame, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatTimeMs } from "@/hooks/useTimer";
import { useRealtimeRanking } from "@/hooks/useRealtimeRanking";
import { MemberLayout } from "@/components/membro/MemberLayout";
import { useProfile } from "@/hooks/useProfile";
import { PageShell } from "@/components/ui/page-shell";
import { PageHero } from "@/components/ui/page-hero";
import { useCurrentPeriodLabel } from "@/hooks/useCurrentPeriodLabel";

function formatRankingTime(entry: RankEntry) {
  if (entry.total_time_ms && entry.total_time_ms > 0) {
    return formatTimeMs(entry.total_time_ms);
  }
  const s = entry.total_time_seconds || 0;
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

const medalColors = [
  "from-yellow-400 to-amber-500 top-1-glow",
  "from-gray-300 to-gray-400 top-2-glow",
  "from-orange-400 to-amber-600 top-3-glow",
];

interface RankEntry {
  attempt_id?: string;
  position: number;
  participant_name: string;
  class_id?: string | null;
  class_name: string;
  church_id?: string | null;
  church_name?: string | null;
  score: number;
  total_time_seconds: number;
  total_time_ms?: number;
  accuracy_percentage: number;
  is_retry?: boolean;
  avatar_url?: string | null;
}

type Scope = "general" | "church" | "interchurch";
type Mode = "weekly" | "monthly" | "classic";

const RankingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const state = location.state as { classId?: string; className?: string; churchId?: string } | null;

  const trimesterParam = parseInt(searchParams.get("trimester") || "1", 10);
  const [trimester, setTrimester] = useState<number>(
    [1, 2, 3, 4].includes(trimesterParam) ? trimesterParam : 1
  );
  const rawModeParam = searchParams.get("mode");
  // Backwards-compat: links antigos com ?mode=season caem em monthly
  const normalizedModeParam: Mode =
    rawModeParam === "season" ? "monthly" :
    (["weekly", "monthly", "classic"] as const).includes(rawModeParam as Mode) ? (rawModeParam as Mode) :
    "weekly";
  const [mode, setMode] = useState<Mode>(normalizedModeParam);
  const { profile } = useProfile();
  const [scope, setScope] = useState<Scope>(state?.churchId ? "church" : "general");
  const [selectedChurchId, setSelectedChurchId] = useState<string>(state?.churchId || "");
  const [selectedClassId, setSelectedClassId] = useState<string>(state?.classId || "");

  // Quando o usuário escolhe "Minha igreja", auto-preenche com a igreja do perfil
  useEffect(() => {
    if (scope === "church" && !selectedChurchId && profile?.church_id) {
      setSelectedChurchId(profile.church_id);
    }
  }, [scope, profile?.church_id, selectedChurchId]);

  const handleTrimesterChange = (t: number) => {
    setTrimester(t);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set("trimester", String(t));
      return p;
    });
  };

  const handleModeChange = (m: Mode) => {
    setMode(m);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set("mode", m);
      return p;
    });
  };

  // Active season (para o modo season/weekly)
  const { data: activeSeason } = useQuery({
    queryKey: ["active-season"],
    queryFn: async () => {
      const { data } = await supabase.from("seasons").select("id, name").eq("status", "active").maybeSingle();
      return data;
    },
  });

  const { data: classes } = useQuery({
    queryKey: ["classes-list"],
    queryFn: async () => {
      const { data } = await supabase.from("classes").select("*").order("name");
      return data || [];
    },
  });


  // Modo CLASSIC (legado, ranking_general por trimestre)
  const enabled = scope === "general" || (scope === "church" && !!selectedChurchId);
  const seasonId = activeSeason?.id;
  const isInter = scope === "interchurch";
  const weeklyEnabled = mode === "weekly" && !isInter && (scope === "general" || (scope === "church" && !!selectedChurchId));
  const monthlyEnabled = mode === "monthly" && !isInter && (scope === "general" || (scope === "church" && !!selectedChurchId));
  const classicEnabled = mode === "classic" && !isInter && enabled;
  const interEnabled = isInter;

  const { data: classicData, isLoading: classicLoading } = useQuery({
    queryKey: ["ranking-classic", trimester, scope, selectedChurchId],
    enabled: classicEnabled,
    queryFn: async () => {
      let query = supabase
        .from("ranking_general")
        .select("attempt_id, position, participant_name, class_id, class_name, church_id, church_name, score, streak_bonus, final_score, total_questions, total_time_seconds, total_time_ms, accuracy_percentage, is_retry, trimester, avatar_url")
        .eq("trimester", trimester)
        .order("position")
        .limit(500);
      if (scope === "church" && selectedChurchId) {
        query = query.eq("church_id", selectedChurchId);
      }
      const { data } = await query;
      return (data as any[]) || [];
    },
  });

  const { data: weeklyData, isLoading: weeklyLoading } = useQuery({
    queryKey: ["ranking-weekly", scope, selectedChurchId],
    enabled: weeklyEnabled,
    queryFn: async () => {
      let query = supabase
        .from("ranking_weekly")
        .select("attempt_id, position, participant_name, class_id, class_name, church_id, church_name, score, streak_bonus, final_score, total_questions, total_time_seconds, total_time_ms, accuracy_percentage, week_number, avatar_url")
        .order("position")
        .limit(500);
      if (scope === "church" && selectedChurchId) {
        query = query.eq("church_id", selectedChurchId);
      }
      const { data } = await query;
      return (data as any[]) || [];
    },
  });

  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ["ranking-monthly", scope, selectedChurchId],
    enabled: monthlyEnabled,
    queryFn: async () => {
      let query = supabase
        .from("ranking_monthly")
        .select("position, participant_name, class_id, class_name, church_id, church_name, total_score, total_time_ms, weeks_completed, current_streak, avatar_url")
        .order("position")
        .limit(500);
      if (scope === "church" && selectedChurchId) {
        query = query.eq("church_id", selectedChurchId);
      }
      const { data } = await query;
      return (data as any[]) || [];
    },
  });

  // Entre Igrejas (uma view por modo de tempo)
  const { data: interData, isLoading: interLoading } = useQuery({
    queryKey: ["ranking-interchurch", mode, trimester],
    enabled: interEnabled,
    queryFn: async () => {
      const view =
        mode === "weekly" ? "ranking_churches_weekly" :
        mode === "monthly" ? "ranking_churches_monthly" :
        "ranking_churches_classic";
      let query = supabase
        .from(view as any)
        .select("position, church_id, church_name, pastor_president, avg_score, participants_count" + (mode === "classic" ? ", trimester" : ""))
        .order("position")
        .limit(500);
      if (mode === "classic") {
        query = (query as any).eq("trimester", trimester);
      }
      const { data } = await query;
      return (data as any[]) || [];
    },
  });

  const isLoading = classicLoading || weeklyLoading || monthlyLoading || interLoading;

  // 🔴 Realtime
  const rt1 = useRealtimeRanking(["ranking-classic", trimester, scope, selectedChurchId]);
  const rt2 = useRealtimeRanking(["ranking-weekly", scope, selectedChurchId]);
  const rt3 = useRealtimeRanking(["ranking-monthly", scope, selectedChurchId]);
  const rt4 = useRealtimeRanking(["ranking-interchurch", mode, trimester]);
  const activeRt = isInter ? rt4 : (mode === "classic" ? rt1 : mode === "weekly" ? rt2 : rt3);
  const rtConnected = activeRt.status === "connected";
  const rtReconnecting = activeRt.status === "connecting" || activeRt.status === "reconnecting";

  const ranking = useMemo(() => {
    if (isInter) {
      const raw = interData ?? [];
      return raw.map((e: any, i: number) => ({ ...e, position: i + 1 }));
    }
    const raw =
      mode === "classic" ? classicData :
      mode === "weekly" ? weeklyData :
      monthlyData;
    if (!raw) return [];
    const filtered = selectedClassId ? raw.filter((e: any) => e.class_id === selectedClassId) : raw;
    return filtered.map((e: any, i: number) => ({ ...e, position: i + 1 }));
  }, [isInter, interData, mode, classicData, weeklyData, monthlyData, selectedClassId]);

  const emptyMessage =
    scope === "church" && !selectedChurchId
      ? "Selecione uma igreja acima"
      : isInter
      ? "Nenhuma igreja com participantes neste período."
      : mode === "weekly"
      ? "Nenhum quiz com janela aberta agora. Volte na próxima semana!"
      : mode === "monthly"
      ? "Nenhum participante ainda neste mês."
      : "Nenhum resultado ainda. Seja o primeiro!";

  const enabledForMode = isInter ? interEnabled : (mode === "weekly" ? weeklyEnabled : mode === "monthly" ? monthlyEnabled : classicEnabled);

  return (
    <MemberLayout title="Ranking" mobileHeader={{ variant: "full" }} contentPaddingMobile={false}>
      <PageShell contentClassName="px-4 py-4 max-w-lg mx-auto w-full space-y-4">
        <PageHero
          eyebrow="Classificação · 1º TRI. 2026 - ADREC"
          title="Ranking"
          description={
            mode === "weekly"
              ? "Semana atual"
              : mode === "monthly"
              ? "Mês atual"
              : `${trimester}º Trimestre`
          }
          Icon={Trophy}
          variant="primary"
          actions={
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                rtConnected ? "bg-white/15 border-white/25" : "bg-white/5 border-white/15"
              }`}
            >
              <span className="relative flex h-2 w-2">
                {rtConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    rtConnected
                      ? "bg-white"
                      : rtReconnecting
                      ? "bg-yellow-300 animate-pulse"
                      : "bg-rose-400"
                  }`}
                ></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                {rtConnected ? "Ao vivo" : rtReconnecting ? "..." : "Off"}
              </span>
            </div>
          }
        />

        {/* Mode tabs: Semana / Mensal / Trimestral */}
        <Tabs value={mode} onValueChange={(v) => handleModeChange(v as Mode)} className="mb-3">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weekly">Semanal</TabsTrigger>
            <TabsTrigger value="monthly">Mensal</TabsTrigger>
            <TabsTrigger value="classic">Trimestral</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 1. Trimester (apenas no modo Trimestral) */}
        {mode === "classic" && (
          <div className="mb-3">
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
              <Calendar className="w-3 h-3 inline mr-1" />
              Trimestre
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((t) => (
                <button
                  key={t}
                  onClick={() => handleTrimesterChange(t)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    trimester === t
                      ? "gradient-primary text-primary-foreground shadow-md"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}º Tri.
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2. Scope: Minha Igreja / Geral / Entre Igrejas */}
        <div className="mb-3">
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
            Escopo
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                setScope("church");
                if (profile?.church_id) setSelectedChurchId(profile.church_id);
              }}
              className={`py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                scope === "church"
                  ? "gradient-primary text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Church className="w-4 h-4" />
              Minha Igreja
            </button>
            <button
              onClick={() => { setScope("general"); setSelectedChurchId(""); }}
              className={`py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                scope === "general"
                  ? "gradient-primary text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Globe className="w-4 h-4" />
              Geral
            </button>
            <button
              onClick={() => { setScope("interchurch"); setSelectedChurchId(""); setSelectedClassId(""); }}
              className={`py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                scope === "interchurch"
                  ? "gradient-primary text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Trophy className="w-4 h-4" />
              Entre Igrejas
            </button>
          </div>
        </div>

        {/* 2b. Aviso quando o usuário escolhe Minha Igreja mas o perfil não tem igreja */}
        {scope === "church" && !profile?.church_id && (
          <div className="mb-3 px-3 py-2.5 rounded-xl bg-muted/60 border border-border text-xs text-muted-foreground">
            Você ainda não tem uma igreja vinculada ao seu perfil. Acesse <span className="font-semibold text-foreground">Meu Perfil</span> para configurar.
          </div>
        )}

        {/* 3. Turma (opcional) — escondido em Entre Igrejas */}
        {!isInter && (
          <div className="mb-4">
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
              <Users className="w-3 h-3 inline mr-1" />
              Turma <span className="text-muted-foreground/60 normal-case">(opcional)</span>
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedClassId("")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  !selectedClassId
                    ? "gradient-primary text-primary-foreground shadow"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Todas
              </button>
              {classes?.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClassId(cls.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    selectedClassId === cls.id
                      ? "gradient-primary text-primary-foreground shadow"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cls.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* List */}
        {!enabledForMode ? (
          <div className="text-center py-12 text-muted-foreground text-sm">{emptyMessage}</div>
        ) : isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : !ranking.length ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            {emptyMessage}
          </div>
        ) : (
          <LayoutGroup>
            <motion.div layout className="space-y-2">
              <AnimatePresence initial={false}>
                {ranking.map((entry: any, i) => {
                  // === Modo Entre Igrejas: card de igreja com nota média ===
                  if (isInter) {
                    const interKey = `church-${entry.church_id}`;
                    const avg = Number(entry.avg_score ?? 0);
                    return (
                      <motion.div
                        key={interKey}
                        layout
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{
                          layout: { type: "spring", stiffness: 350, damping: 30 },
                          opacity: { duration: 0.2 },
                        }}
                        className={`glass-card p-4 flex items-center gap-3 ${i < 3 ? "glow-border" : ""}`}
                      >
                        {i < 3 ? (
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${medalColors[i]} flex items-center justify-center shrink-0`}>
                            <Medal className="w-5 h-5 text-foreground" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-muted-foreground">{entry.position}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-foreground truncate flex items-center gap-2">
                            <Church className="w-4 h-4 text-primary shrink-0" />
                            {entry.church_name}
                          </div>
                          {entry.pastor_president && (
                            <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                              Pr. {entry.pastor_president}
                            </div>
                          )}
                          <div className="text-[10px] text-muted-foreground/70 mt-0.5">
                            {entry.participants_count} {entry.participants_count === 1 ? "participante" : "participantes"}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-display font-bold text-primary text-lg">
                            {avg.toFixed(1).replace(".", ",")}
                          </div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            nota média
                          </div>
                        </div>
                      </motion.div>
                    );
                  }

                  const stableKey = entry.attempt_id ?? `${entry.participant_name}-${entry.class_id ?? ""}-${mode}`;
                  const isMonthly = mode === "monthly";
                  const isWeekly = mode === "weekly";
                  const isClassic = mode === "classic";
                  // Para weekly e classic agora usamos final_score (acertos + bônus de streak)
                  const mainScore = isMonthly
                    ? entry.total_score
                    : (entry.final_score ?? entry.score);
                  const baseScore = isWeekly || isClassic ? entry.score : null;
                  const bonus = isWeekly || isClassic ? (entry.streak_bonus ?? 0) : 0;
                  return (
                    <motion.div
                      key={stableKey}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{
                        layout: { type: "spring", stiffness: 350, damping: 30 },
                        opacity: { duration: 0.2 },
                      }}
                      className={`glass-card p-4 flex items-center gap-3 ${i < 3 ? "glow-border" : ""}`}
                    >
                      {i < 3 ? (
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${medalColors[i]} flex items-center justify-center shrink-0 overflow-hidden border border-white/20 relative group`}>
                          {entry.avatar_url ? (
                            <img 
                              src={entry.avatar_url} 
                              alt={entry.participant_name} 
                              className="w-full h-full object-cover transition-opacity group-hover:opacity-30"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                const icon = document.createElement('span');
                                icon.innerHTML = '<svg class="w-5 h-5 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>';
                                (e.target as HTMLImageElement).parentElement!.appendChild(icon.firstChild!);
                              }}
                            />
                          ) : (
                            <Medal className="w-5 h-5 text-foreground" />
                          )}
                          {entry.avatar_url && (
                             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                               <Medal className="w-5 h-5 text-white" />
                             </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden border border-border/50">
                          {entry.avatar_url ? (
                            <img 
                              src={entry.avatar_url} 
                              alt={entry.participant_name} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-sm font-bold text-muted-foreground">${entry.position}</span>`;
                              }}
                            />
                          ) : (
                            <span className="text-sm font-bold text-muted-foreground">{entry.position}</span>
                          )}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground truncate flex items-center gap-2">
                          {entry.participant_name}
                          {isMonthly && entry.current_streak > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-500 border border-orange-500/30">
                              <Flame className="w-3 h-3" />{entry.current_streak}
                            </span>
                          )}
                          {entry.is_retry && (
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-destructive/15 text-destructive border border-destructive/30">
                              2ª tent.
                            </span>
                          )}
                        </div>
                        {entry.church_name && (
                          <div className="text-[11px] text-muted-foreground/70 truncate">{entry.church_name}</div>
                        )}
                        {!selectedClassId && entry.class_name && (
                          <div className="text-xs text-muted-foreground">{entry.class_name}</div>
                        )}
                        {isMonthly && (
                          <div className="text-[10px] text-muted-foreground/80">
                            {entry.weeks_completed} {entry.weeks_completed === 1 ? "semana" : "semanas"} respondidas
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        {isMonthly ? (
                          <div className="font-display font-bold text-primary">{mainScore} pts</div>
                        ) : (
                          <>
                            <div className="font-display font-bold text-primary">
                              {mainScore}/{entry.total_questions || 13}
                            </div>
                            {bonus > 0 && (
                              <div className="text-[10px] text-orange-500">{baseScore} + {bonus}🔥</div>
                            )}
                            <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end font-mono">
                              <Clock className="w-3 h-3" />
                              {formatRankingTime(entry)}
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          </LayoutGroup>
        )}
      </PageShell>
    </MemberLayout>
  );
};

export default RankingPage;
