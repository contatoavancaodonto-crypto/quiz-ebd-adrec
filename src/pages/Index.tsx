import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Sparkles, ChevronRight, Trophy, Lock, Calendar } from "lucide-react";
import churchLogo from "@/assets/church-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useQuizStore } from "@/stores/quizStore";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";

const classIcons: Record<string, string> = {
  Adultos: "🤵🏻‍♂️🤵🏻‍♀️",
  Jovens: "🎺",
  Adolescentes: "🙆🏻‍♂️🙆🏻‍♀️",
};

const classSubtitles: Record<string, string> = {
  Adolescentes: "Geração JC",
  Adultos: "Homens de valor & Mulheres de fé",
  Jovens: "Maranata",
};

const QUIZ_CLOSED = false;

const Index = () => {
  const [name, setName] = useState("");
  const [selectedClass, setSelectedClass] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setParticipant } = useQuizStore();

  const handleTrimester = (trimester: number) => {
    if (trimester === 1) {
      navigate("/ranking?trimester=1");
    } else if (trimester === 2) {
      navigate("/ranking?trimester=2");
    } else {
      toast.info(`📅 ${trimester}º Trimestre - Disponível em breve!`);
    }
  };

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const handleStart = async () => {
    if (QUIZ_CLOSED) {
      toast.error("⏰ Tempo esgotado! O quiz não aceita mais respostas.");
      return;
    }
    if (!name.trim()) {
      toast.error("Por favor, informe seu nome.");
      return;
    }
    if (!selectedClass) {
      toast.error("Por favor, selecione uma turma.");
      return;
    }
    if (selectedClass.name === "Adolescentes") {
      toast.info("🚧 Classe em construção, disponível no próximo trimestre!");
      return;
    }
    setLoading(true);
    try {
      setParticipant(name.trim(), selectedClass.id, selectedClass.name);
      navigate("/quiz");
    } catch {
      toast.error("Erro ao iniciar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <ThemeToggle />

      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-28 h-28 rounded-2xl bg-background mb-4">
            <img src={churchLogo} alt="Logo ADREC" className="w-24 h-24 object-contain drop-shadow-[0_0_15px_rgba(76,201,224,0.3)]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold gradient-text glow-text mb-2">
            Quiz EBD
          </h1>
          <p className="text-muted-foreground text-sm font-semibold">
            1º TRI. 2026 - ADREC
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="glass-card glow-border p-6 space-y-5"
        >
          {QUIZ_CLOSED ? (
            <div className="text-center space-y-4 py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-2">
                <Lock className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Tempo Esgotado!</h2>
              <p className="text-muted-foreground text-sm">
                O período para responder o quiz foi encerrado. Confira o ranking abaixo para ver os resultados!
              </p>
            </div>
          ) : (
            <>
              {/* Name input */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Seu nome
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Digite seu nome completo"
                  maxLength={100}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {/* Class selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Escolha sua turma
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {classes?.map((cls) => (
                    <motion.button
                      key={cls.id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedClass({ id: cls.id, name: cls.name })}
                      className={`p-3 rounded-xl border-2 transition-all text-center cursor-pointer ${
                        selectedClass?.id === cls.id
                          ? "border-primary bg-primary/10 shadow-lg"
                          : "border-border bg-muted/50 hover:border-primary/40"
                      }`}
                    >
                      <div className="text-2xl mb-1">{classIcons[cls.name] || "📚"}</div>
                      <div className="text-xs font-medium text-foreground">{cls.name}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{classSubtitles[cls.name] || ""}</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Start button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStart}
                disabled={loading}
                className="w-full py-4 rounded-xl gradient-primary text-primary-foreground font-semibold text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Iniciar Quiz
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </>
          )}

          {/* Ranking button - always visible, highlighted when closed */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/ranking")}
            className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 cursor-pointer transition-all ${
              QUIZ_CLOSED
                ? "gradient-primary text-primary-foreground shadow-lg hover:shadow-xl animate-pulse"
                : "bg-muted text-foreground border border-border hover:border-primary/40"
            }`}
          >
            <Trophy className="w-5 h-5" />
            🏆 Ver Ranking
          </motion.button>

          {/* Trimester results */}
          <div className="pt-2">
            <label className="block text-sm font-medium text-foreground mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Resultados por Trimestre
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((t) => (
                <motion.button
                  key={t}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleTrimester(t)}
                  className="py-3 rounded-xl border-2 border-border bg-muted/50 hover:border-primary/40 transition-all text-center cursor-pointer"
                >
                  <div className="text-sm font-bold text-foreground">{t}º</div>
                  <div className="text-[10px] text-muted-foreground">Tri.</div>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Index;
