import { useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Clock, ArrowLeft, Medal, Calendar, Church, Users, Globe, Radio } from "lucide-react";
import churchLogo from "@/assets/church-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ThemeToggle } from "@/components/ThemeToggle";
import { formatTimeMs } from "@/hooks/useTimer";
import { useRealtimeRanking } from "@/hooks/useRealtimeRanking";

function formatRankingTime(entry: RankEntry) {
  if (entry.total_time_ms && entry.total_time_ms > 0) {
    return formatTimeMs(entry.total_time_ms);
  }
  const s = entry.total_time_seconds;
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

const medalColors = [
  "from-yellow-400 to-amber-500 top-1-glow",
  "from-gray-300 to-gray-400 top-2-glow",
  "from-orange-400 to-amber-600 top-3-glow",
];

interface RankEntry {
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
}

type Scope = "general" | "church";

const RankingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const state = location.state as { classId?: string; className?: string; churchId?: string } | null;

  const trimesterParam = parseInt(searchParams.get("trimester") || "1", 10);
  const [trimester, setTrimester] = useState<number>(
    [1, 2, 3, 4].includes(trimesterParam) ? trimesterParam : 1
  );
  const [scope, setScope] = useState<Scope>(state?.churchId ? "church" : "general");
  const [selectedChurchId, setSelectedChurchId] = useState<string>(state?.churchId || "");
  const [selectedClassId, setSelectedClassId] = useState<string>(state?.classId || "");

  const handleTrimesterChange = (t: number) => {
    setTrimester(t);
    setSearchParams({ trimester: String(t) });
  };

  const { data: classes } = useQuery({
    queryKey: ["classes-list"],
    queryFn: async () => {
      const { data } = await supabase.from("classes").select("*").order("name");
      return data || [];
    },
  });

  const { data: churches } = useQuery({
    queryKey: ["churches-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("churches")
        .select("id, name")
        .eq("approved", true)
        .order("name");
      return data || [];
    },
  });

  // Fetch tudo do trimestre e filtra no client (mais simples, dados pequenos)
  const enabled = scope === "general" || (scope === "church" && !!selectedChurchId);

  const { data: rawData, isLoading } = useQuery({
    queryKey: ["ranking", trimester, scope, selectedChurchId],
    enabled,
    queryFn: async () => {
      let query = supabase
        .from("ranking_general")
        .select("*")
        .eq("trimester", trimester)
        .order("position")
        .limit(500);
      if (scope === "church" && selectedChurchId) {
        query = query.eq("church_id", selectedChurchId);
      }
      const { data } = await query;
      return (data as RankEntry[]) || [];
    },
  });

  // Filtra por turma e re-numera as posições
  const ranking = useMemo(() => {
    if (!rawData) return [];
    const filtered = selectedClassId
      ? rawData.filter((e) => e.class_id === selectedClassId)
      : rawData;
    return filtered.map((e, i) => ({ ...e, position: i + 1 }));
  }, [rawData, selectedClassId]);

  const emptyMessage =
    scope === "church" && !selectedChurchId
      ? "Selecione uma igreja acima"
      : "Nenhum resultado ainda. Seja o primeiro!";

  return (
    <div className="min-h-screen bg-background p-4 relative">
      <ThemeToggle />

      <div className="max-w-lg mx-auto pt-2">
        {/* Back */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <img src={churchLogo} alt="Logo ADREC" className="w-20 h-20 object-contain mx-auto mb-2 drop-shadow-[0_0_15px_rgba(76,201,224,0.3)]" />
          <h1 className="text-2xl font-display font-bold gradient-text">Ranking</h1>
          <p className="text-xs text-muted-foreground mt-1">{trimester}º Trimestre</p>
        </motion.div>

        {/* 1. Trimester */}
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

        {/* 2. Scope: Geral ou Igreja */}
        <div className="mb-3">
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
            Escopo
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setScope("general"); setSelectedChurchId(""); }}
              className={`py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer flex items-center justify-center gap-2 ${
                scope === "general"
                  ? "gradient-primary text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Globe className="w-4 h-4" />
              Geral
            </button>
            <button
              onClick={() => setScope("church")}
              className={`py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer flex items-center justify-center gap-2 ${
                scope === "church"
                  ? "gradient-primary text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Church className="w-4 h-4" />
              Por Igreja
            </button>
          </div>
        </div>

        {/* 2b. Church select (only when scope=church) */}
        {scope === "church" && (
          <div className="mb-3">
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
              Igreja
            </label>
            <select
              value={selectedChurchId}
              onChange={(e) => setSelectedChurchId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-muted text-sm text-foreground border border-border focus:border-primary outline-none cursor-pointer"
            >
              <option value="">— Selecione a igreja —</option>
              {churches?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* 3. Turma (opcional) */}
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

        {/* List */}
        {!enabled ? (
          <div className="text-center py-12 text-muted-foreground text-sm">{emptyMessage}</div>
        ) : isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : !ranking.length ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Nenhum resultado para esses filtros.
          </div>
        ) : (
          <div className="space-y-2">
            {ranking.map((entry, i) => (
              <motion.div
                key={`${entry.participant_name}-${entry.position}-${i}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
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
                    {entry.participant_name}
                    {entry.is_retry && (
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-destructive/15 text-destructive border border-destructive/30">
                        2ª tentativa
                      </span>
                    )}
                  </div>
                  {entry.church_name && (
                    <div className="text-[11px] text-muted-foreground/70 truncate">{entry.church_name}</div>
                  )}
                  {!selectedClassId && (
                    <div className="text-xs text-muted-foreground">{entry.class_name}</div>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <div className="font-display font-bold text-primary">{entry.score}/{13}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end font-mono">
                    <Clock className="w-3 h-3" />
                    {formatRankingTime(entry)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RankingPage;
