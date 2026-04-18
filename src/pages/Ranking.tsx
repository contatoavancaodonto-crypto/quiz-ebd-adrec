import { useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, ArrowLeft, Medal, Calendar, Church } from "lucide-react";
import churchLogo from "@/assets/church-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ThemeToggle } from "@/components/ThemeToggle";
import { formatTimeMs } from "@/hooks/useTimer";

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
  class_name: string;
  church_id?: string | null;
  church_name?: string | null;
  score: number;
  total_time_seconds: number;
  total_time_ms?: number;
  accuracy_percentage: number;
  is_retry?: boolean;
}

type Tab = "general" | "class" | "church";

const RankingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const state = location.state as { classId?: string; className?: string; churchId?: string } | null;
  const [tab, setTab] = useState<Tab>(state?.classId ? "class" : "general");
  const trimesterParam = parseInt(searchParams.get("trimester") || "1", 10);
  const [trimester, setTrimester] = useState<number>(
    [1, 2, 3, 4].includes(trimesterParam) ? trimesterParam : 1
  );

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

  const [selectedClassId, setSelectedClassId] = useState<string>(state?.classId || "");
  const [selectedChurchId, setSelectedChurchId] = useState<string>(state?.churchId || "");

  const { data: classRanking, isLoading: loadingClass } = useQuery({
    queryKey: ["ranking-class", selectedClassId, trimester],
    enabled: tab === "class" && !!selectedClassId,
    queryFn: async () => {
      const { data } = await supabase
        .from("ranking_by_class")
        .select("*")
        .eq("class_id", selectedClassId)
        .eq("trimester", trimester)
        .order("position")
        .limit(50);
      return (data as RankEntry[]) || [];
    },
  });

  const { data: generalRanking, isLoading: loadingGeneral } = useQuery({
    queryKey: ["ranking-general", trimester, selectedChurchId],
    enabled: tab === "general",
    queryFn: async () => {
      let query = supabase
        .from("ranking_general")
        .select("*")
        .eq("trimester", trimester)
        .order("position")
        .limit(100);
      if (selectedChurchId) query = query.eq("church_id", selectedChurchId);
      const { data } = await query;
      return (data as RankEntry[]) || [];
    },
  });

  const { data: churchRanking, isLoading: loadingChurch } = useQuery({
    queryKey: ["ranking-church", selectedChurchId, trimester],
    enabled: tab === "church" && !!selectedChurchId,
    queryFn: async () => {
      const { data } = await supabase
        .from("ranking_general")
        .select("*")
        .eq("trimester", trimester)
        .eq("church_id", selectedChurchId)
        .order("position")
        .limit(50);
      return (data as RankEntry[]) || [];
    },
  });

  const ranking =
    tab === "class" ? classRanking : tab === "church" ? churchRanking : generalRanking;
  const loading =
    tab === "class" ? loadingClass : tab === "church" ? loadingChurch : loadingGeneral;

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

        {/* Trimester selector */}
        <div className="flex gap-2 mb-3">
          {[1, 2, 3, 4].map((t) => (
            <button
              key={t}
              onClick={() => handleTrimesterChange(t)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                trimester === t
                  ? "gradient-primary text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Calendar className="w-3 h-3" />
              {t}º Tri.
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {(["general", "church", "class"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                tab === t
                  ? "gradient-primary text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "class" ? "Por Turma" : t === "church" ? "Por Igreja" : "Geral"}
            </button>
          ))}
        </div>

        {/* Church filter (general + church tab) */}
        {(tab === "general" || tab === "church") && (
          <div className="mb-3">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              <Church className="w-3 h-3 inline mr-1" />
              {tab === "church" ? "Selecione a igreja" : "Filtrar por igreja"}
            </label>
            <select
              value={selectedChurchId}
              onChange={(e) => setSelectedChurchId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-muted text-sm text-foreground border border-border focus:border-primary outline-none cursor-pointer"
            >
              <option value="">{tab === "church" ? "— Selecione —" : "Todas as igrejas"}</option>
              {churches?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Class selector */}
        {tab === "class" && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1 justify-end">
            {classes?.map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedClassId(cls.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedClassId === cls.id
                    ? "gradient-primary text-primary-foreground shadow"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {cls.name}
              </button>
            ))}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : !ranking?.length ? (
          <div className="text-center py-12 text-muted-foreground">
            {tab === "class" && !selectedClassId
              ? "Selecione uma turma acima"
              : tab === "church" && !selectedChurchId
              ? "Selecione uma igreja acima"
              : "Nenhum resultado ainda. Seja o primeiro!"}
          </div>
        ) : (
          <div className="space-y-2">
            {ranking.map((entry, i) => (
              <motion.div
                key={`${entry.participant_name}-${entry.position}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`glass-card p-4 flex items-center gap-3 ${
                  i < 3 ? "glow-border" : ""
                }`}
              >
                {/* Position */}
                {i < 3 ? (
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${medalColors[i]} flex items-center justify-center shrink-0`}
                  >
                    <Medal className="w-5 h-5 text-foreground" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-muted-foreground">
                      {entry.position}
                    </span>
                  </div>
                )}

                {/* Info */}
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
                  {tab === "general" && (
                    <div className="text-xs text-muted-foreground">{entry.class_name}</div>
                  )}
                </div>

                {/* Stats */}
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
