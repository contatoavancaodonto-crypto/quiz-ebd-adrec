import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuizStore } from "@/stores/quizStore";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Trophy, FileText, BarChart3, Loader2 } from "lucide-react";

/**
 * Rota oculta para visualizar/editar Result, Ranking e Gabarito sem precisar fazer o quiz.
 * Acesse em: /preview-telas
 *
 * Estratégia:
 * 1. Busca a última tentativa finalizada no banco (qualquer participante).
 * 2. Popula o quizStore com os dados reais dessa tentativa.
 * 3. Permite navegar para /result, /ranking ou /gabarito.
 */
const PreviewTelas = () => {
  const navigate = useNavigate();
  const store = useQuizStore();
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [info, setInfo] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      // Busca a tentativa mais recente finalizada na view ranking_general (já tem todos os campos)
      const { data, error } = await supabase
        .from("ranking_general")
        .select(
          "attempt_id, participant_name, score, total_time_seconds, total_time_ms, church_id, church_name, class_id, class_name, trimester"
        )
        .order("finished_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data || !data.attempt_id) {
        setInfo("Nenhuma tentativa finalizada encontrada no banco.");
        setLoading(false);
        return;
      }

      // Busca participant_id e quiz_id da tentativa
      const { data: attempt } = await supabase
        .from("quiz_attempts")
        .select("participant_id, quiz_id")
        .eq("id", data.attempt_id)
        .maybeSingle();

      store.reset();
      store.setParticipant(
        data.participant_name ?? "Aluno Demo",
        data.class_id ?? "",
        data.class_name ?? "Turma Demo",
        data.trimester ?? 1
      );
      store.setChurch(data.church_id ?? "", data.church_name ?? "Igreja Demo");
      store.setAttemptId(data.attempt_id);
      if (attempt?.participant_id) store.setParticipantId(attempt.participant_id);
      if (attempt?.quiz_id) store.setQuizId(attempt.quiz_id);
      store.finishQuiz(data.score ?? 0, data.total_time_ms ?? (data.total_time_seconds ?? 0) * 1000);

      setInfo(
        `Carregado: ${data.participant_name} • ${data.score}/13 • ${data.class_name ?? ""}`
      );
      setReady(true);
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buttons = [
    { label: "Resultado", icon: Trophy, path: "/result" },
    { label: "Gabarito", icon: FileText, path: "/gabarito" },
    { label: "Ranking", icon: BarChart3, path: "/ranking" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <ThemeToggle />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            Preview de Telas
          </h1>
          <p className="text-sm text-muted-foreground">
            Acesse Resultado, Gabarito e Ranking sem fazer o quiz.
          </p>
        </div>

        {loading ? (
          <div className="glass-card glow-border p-6 text-center">
            <Loader2 className="w-6 h-6 text-primary mx-auto mb-2 animate-spin" />
            <p className="text-sm text-muted-foreground">Carregando dados de exemplo...</p>
          </div>
        ) : (
          <>
            <div className="glass-card glow-border p-4 mb-6 text-center">
              <p className="text-xs text-muted-foreground">{info}</p>
            </div>

            {ready && (
              <div className="space-y-3">
                {buttons.map((b) => (
                  <button
                    key={b.path}
                    onClick={() =>
                      navigate(b.path, {
                        state: {
                          classId: store.classId,
                          className: store.className,
                          churchId: store.churchId,
                        },
                      })
                    }
                    className="w-full py-4 rounded-xl gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-transform cursor-pointer"
                  >
                    <b.icon className="w-5 h-5" />
                    Abrir {b.label}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PreviewTelas;
