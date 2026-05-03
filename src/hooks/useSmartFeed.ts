import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFullProfile } from "@/hooks/useFullProfile";
import { useActiveSeason } from "@/hooks/useActiveSeason";

export interface SmartFeedData {
  hasAnsweredCurrentTrimester: boolean;
  lastAttempt: {
    id: string;
    score: number;
    total_questions: number;
    accuracy_percentage: number;
    total_time_seconds: number;
    finished_at: string | null;
    trimester: number;
  } | null;
  rankPosition: number | null;
  totalParticipants: number;
  latestMaterial: {
    id: string;
    title: string;
    file_url: string;
    trimester: number;
    created_at: string;
  } | null;
  badgesCount: number;
  isHighPerformer: boolean;
}

const ACTIVE_TRIMESTER = 2;

export function useSmartFeed() {
  const { user } = useAuth();
  const { data: profile } = useFullProfile();
  const { data: season } = useActiveSeason();

  return useQuery({
    queryKey: ["smart-feed", user?.id, profile?.first_name, season?.id],
    enabled: !!user && !!profile,
    staleTime: 30_000,
    queryFn: async (): Promise<SmartFeedData> => {
      const fullName = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();

      // Find participant(s) by name
      const { data: participants } = await supabase
        .from("participants")
        .select("id")
        .ilike("name", fullName);
      const participantIds = (participants ?? []).map((p) => p.id);

      let lastAttempt: SmartFeedData["lastAttempt"] = null;
      let hasAnsweredCurrentTrimester = false;
      let badgesCount = 0;

      if (participantIds.length > 0) {
        const { data: attempts } = await supabase
          .from("quiz_attempts")
          .select("id, score, total_questions, accuracy_percentage, total_time_seconds, finished_at, quiz_id, quizzes(trimester)")
          .in("participant_id", participantIds)
          .not("finished_at", "is", null)
          .order("finished_at", { ascending: false })
          .limit(20);

        if (attempts && attempts.length > 0) {
          const a = attempts[0] as any;
          lastAttempt = {
            id: a.id,
            score: a.score,
            total_questions: a.total_questions,
            accuracy_percentage: Number(a.accuracy_percentage),
            total_time_seconds: a.total_time_seconds,
            finished_at: a.finished_at,
            trimester: a.quizzes?.trimester ?? 0,
          };
          hasAnsweredCurrentTrimester = attempts.some(
            (x: any) => x.quizzes?.trimester === ACTIVE_TRIMESTER
          );
        }

        const { count } = await supabase
          .from("user_badges")
          .select("*", { count: "exact", head: true })
          .in("participant_id", participantIds);
        badgesCount = count ?? 0;
      }

      // Ranking position (general)
      let rankPosition: number | null = null;
      let totalParticipants = 0;
      if (lastAttempt) {
        const { data: rankRow } = await supabase
          .from("ranking_general")
          .select("position")
          .eq("attempt_id", lastAttempt.id)
          .maybeSingle();
        rankPosition = (rankRow as any)?.position ?? null;

        const { count } = await supabase
          .from("ranking_general")
          .select("*", { count: "exact", head: true });
        totalParticipants = count ?? 0;
      }

      // Latest material (filtered by user class)
      let latestMaterial: SmartFeedData["latestMaterial"] = null;
      if (profile?.class_id) {
        const { data: mat } = await supabase
          .from("class_materials")
          .select("id, title, file_url, trimester, created_at")
          .eq("class_id", profile.class_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (mat) latestMaterial = mat as any;
      }

      const isHighPerformer = !!lastAttempt && lastAttempt.accuracy_percentage >= 80;

      return {
        hasAnsweredCurrentTrimester,
        lastAttempt,
        rankPosition,
        totalParticipants,
        latestMaterial,
        badgesCount,
        isHighPerformer,
      };
    },
  });
}
