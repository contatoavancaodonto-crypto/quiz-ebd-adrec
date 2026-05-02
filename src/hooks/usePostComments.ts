import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  deleted: boolean;
  author?: {
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}

export function usePostComments(postId: string) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("post_comments")
        .select(`
          *,
          author:profiles(
            display_name,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq("post_id", postId)
        .eq("deleted", false)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setComments((data as any) || []);
    } catch (error: any) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();

    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_comments", filter: `post_id=eq.${postId}` },
        () => fetchComments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchComments, postId]);

  const addComment = async (content: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from("post_comments").insert({
        post_id: postId,
        user_id: user.id,
        content
      });

      if (error) throw error;
    } catch (error: any) {
      console.error("Error adding comment:", error);
      toast.error("Erro ao comentar");
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("post_comments")
        .update({ deleted: true })
        .eq("id", commentId);

      if (error) throw error;
      toast.success("Comentário removido");
    } catch (error: any) {
      console.error("Error deleting comment:", error);
      toast.error("Erro ao remover comentário");
    }
  };

  return { comments, loading, addComment, deleteComment };
}
