import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFullProfile } from "./useFullProfile";
import { useActiveSeason } from "./useActiveSeason";

export interface NotaSemanal {
  semana: number;
  licao: number;
  tema: string;
  nota?: number;
  status: 'concluido' | 'pendente' | 'nao_enviado' | 'em_analise';
  observacao?: string;
  tempo_ms?: number;
}

export interface ProvaoFinal {
  nota?: number;
  peso: number;
  status: 'concluido' | 'pendente' | 'nao_realizado';
  observacao?: string;
}

export interface TrimestreAcademico {
  trimestre: string;
  semanas: NotaSemanal[];
  provaFinal?: ProvaoFinal;
  ranking?: number;
  mediaSemanal: number;
  mediaFinal: number;
  participacao: number;
  frequencia: number;
  tempoTotalMs: number;
  comentariosProfessor?: any[];
}

export interface HistoricoAcademico {
  membroId: string;
  membroNome: string;
  turmaAtual?: string;
  trimestres: TrimestreAcademico[];
}

export function useAcademicHistory() {
  const { data: profile } = useFullProfile();
  const { data: season } = useActiveSeason();

  return useQuery({
    queryKey: ["academic-history", profile?.id, season?.id],
    enabled: !!profile?.id && !!season?.id,
    queryFn: async (): Promise<HistoricoAcademico> => {
      // 0. Fetch comments that are not scheduled for future or are already sent
      const now = new Date().toISOString();
      const { data: comments } = await supabase
        .from("academic_comments")
        .select(`
          id,
          content,
          created_at,
          is_read,
          sender:profiles!academic_comments_sender_id_fkey(display_name, first_name, last_name)
        `)
        .or(`recipient_id.eq.${profile!.id},type.eq.global_collective,and(type.eq.church_collective,church_id.eq.${profile!.church_id})`)
        .or(`scheduled_for.is.null,scheduled_for.lte.${now}`)
        .order("created_at", { ascending: false });

      const formattedComments = (comments ?? []).map((c: any) => ({
        id: c.id,
        comentario: c.content,
        criadoEm: c.created_at,
        lido: c.is_read,
        professorNome: c.sender?.display_name || `${c.sender?.first_name ?? ""} ${c.sender?.last_name ?? ""}`.trim() || "Professor"
      }));
      const { data: quizzes, error: quizzesError } = await supabase
        .from("quizzes")
        .select("*")
        .eq("class_id", profile!.class_id!)
        .eq("season_id", season!.id)
        .eq("active", true)
        .order("week_number", { ascending: true });

      if (quizzesError) throw quizzesError;

      // 2. Fetch all quiz attempts for the user in this season
      // We need to match attempts with quizzes via participants table user_id
      const { data: attempts, error: attemptsError } = await supabase
        .from("quiz_attempts")
        .select(`
          *,
          participants!inner(user_id)
        `)
        .eq("participants.user_id", profile!.id)
        .eq("season_id", season!.id);

      if (attemptsError) throw attemptsError;

      // 3. Fetch ranking
      const { data: rankingData } = await supabase
        .from("ranking_season_accumulated")
        .select("position")
        .eq("season_id", season!.id)
        .ilike("participant_name", `${profile!.first_name} ${profile!.last_name}`.trim())
        .maybeSingle();

      const ranking = rankingData?.position ? Number(rankingData.position) : undefined;

      // 4. Group by trimester
      const trimestresMap = new Map<number, TrimestreAcademico>();

      quizzes.forEach((quiz) => {
        const triNum = quiz.trimester || 1;
        if (!trimestresMap.has(triNum)) {
          trimestresMap.set(triNum, {
            trimestre: `${triNum}º TRI`,
            semanas: [],
            ranking,
            mediaSemanal: 0,
            mediaFinal: 0,
            participacao: 0,
            frequencia: 0,
            tempoTotalMs: 0,
            comentariosProfessor: formattedComments
          });
        }

        const tri = trimestresMap.get(triNum)!;
        const attempt = attempts?.find(a => a.quiz_id === quiz.id);

        if (quiz.quiz_kind === 'weekly') {
          tri.semanas.push({
            semana: quiz.week_number || 0,
            licao: quiz.lesson_number || 0,
            tema: quiz.lesson_title || quiz.title || "Sem tema",
            nota: attempt ? Number(attempt.accuracy_percentage) : undefined,
            status: attempt ? 'concluido' : 'pendente',
            tempo_ms: attempt ? Number(attempt.total_time_ms) : 0
          });
        } else if (quiz.quiz_kind === 'trimestral') {
          tri.provaFinal = {
            nota: attempt ? Number(attempt.accuracy_percentage) : undefined,
            status: attempt ? 'concluido' : 'pendente',
            peso: 0.3
          };
        }
      });

      // 5. Calculate stats for each trimester
      const resultTrimestres = Array.from(trimestresMap.values()).map(tri => {
        const weeklyNotas = tri.semanas.filter(s => s.nota !== undefined).map(s => s.nota!);
        const mediaSemanal = weeklyNotas.length > 0 ? weeklyNotas.reduce((a, b) => a + b, 0) / weeklyNotas.length : 0;
        
        const totalSemanas = tri.semanas.length;
        const concluidas = tri.semanas.filter(s => s.status === 'concluido').length;
        const participacao = totalSemanas > 0 ? (concluidas / totalSemanas) * 100 : 0;
        
        // Frequencia calculation: for now, using the same as participation or a slightly different logic
        const frequencia = participacao; 

        const notaFinal = tri.provaFinal?.nota !== undefined
          ? (mediaSemanal * 0.7) + (tri.provaFinal.nota * 0.3)
          : mediaSemanal;

        const tempoTotalMs = tri.semanas.reduce((acc, s) => acc + (s.tempo_ms || 0), 0);

        return {
          ...tri,
          mediaSemanal,
          mediaFinal: notaFinal,
          participacao,
          frequencia,
          tempoTotalMs
        };
      });

      return {
        membroId: profile!.id,
        membroNome: `${profile!.first_name} ${profile!.last_name}`,
        turmaAtual: profile!.class_id ? "Minha Turma (Adultos)" : undefined, // Alterado de "Sua Turma" por solicitação do usuário
        trimestres: resultTrimestres
      };
    }
  });
}
