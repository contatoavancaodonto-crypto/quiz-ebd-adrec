import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useReadingProgress = (lessonId: string) => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const { data: progress = {}, isLoading } = useQuery({
    queryKey: ["reading-progress", lessonId, session?.user?.id],
    enabled: !!session?.user?.id && !!lessonId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_reading_progress")
        .select("day_key, is_read")
        .eq("user_id", session!.user.id)
        .eq("lesson_id", lessonId);

      if (error) throw error;

      return (data || []).reduce((acc: Record<string, boolean>, curr) => {
        acc[curr.day_key] = curr.is_read;
        return acc;
      }, {});
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ dayKey, isRead }: { dayKey: string; isRead: boolean }) => {
      if (!session?.user?.id) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("user_reading_progress")
        .upsert(
          {
            user_id: session.user.id,
            lesson_id: lessonId,
            day_key: dayKey,
            is_read: isRead,
          },
          { onConflict: "user_id,lesson_id,day_key" }
        );

      if (error) throw error;
      return { dayKey, isRead };
    },
    onMutate: async ({ dayKey, isRead }) => {
      await queryClient.cancelQueries({ queryKey: ["reading-progress", lessonId, session?.user?.id] });
      const previousProgress = queryClient.getQueryData(["reading-progress", lessonId, session?.user?.id]);
      
      queryClient.setQueryData(["reading-progress", lessonId, session?.user?.id], (old: any) => ({
        ...old,
        [dayKey]: isRead,
      }));

      return { previousProgress };
    },
    onError: (err, variables, context) => {
      if (context?.previousProgress) {
        queryClient.setQueryData(["reading-progress", lessonId, session?.user?.id], context.previousProgress);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["reading-progress", lessonId, session?.user?.id] });
    },
  });

  return {
    progress,
    isLoading,
    toggleProgress: (dayKey: string, isRead: boolean) => toggleMutation.mutate({ dayKey, isRead }),
  };
};
