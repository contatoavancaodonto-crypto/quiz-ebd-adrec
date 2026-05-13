import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, MessageCircle, Heart, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RecentPost {
  id: string;
  content: string | null;
  created_at: string;
  user_id: string;
  author_name: string | null;
  author_avatar: string | null;
  likes_count: number;
  comments_count: number;
}

const useRecentPosts = () => {
  return useQuery({
    queryKey: ["community-recent-posts"],
    staleTime: 60_000,
    queryFn: async (): Promise<RecentPost[]> => {
      const { data: posts } = await supabase
        .from("posts")
        .select("id, content, created_at, user_id")
        .eq("deleted", false)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(2);

      if (!posts || posts.length === 0) return [];

      const userIds = posts.map((p) => p.user_id);
      const postIds = posts.map((p) => p.id);

      const [{ data: profiles }, { data: likes }, { data: comments }] = await Promise.all([
        supabase.from("profiles").select("id, first_name, last_name, avatar_url").in("id", userIds),
        supabase.from("post_likes").select("post_id").in("post_id", postIds),
        supabase.from("post_comments").select("post_id").in("post_id", postIds).eq("deleted", false),
      ]);

      return posts.map((p) => {
        const profile = profiles?.find((pr) => pr.id === p.user_id);
        return {
          ...p,
          author_name: profile
            ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "Membro"
            : "Membro",
          author_avatar: profile?.avatar_url ?? null,
          likes_count: likes?.filter((l) => l.post_id === p.id).length ?? 0,
          comments_count: comments?.filter((c) => c.post_id === p.id).length ?? 0,
        };
      });
    },
  });
};

export const CommunityShortcutCard = () => {
  const navigate = useNavigate();
  const { data: posts, isLoading } = useRecentPosts();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-5 space-y-4 shadow-lg shadow-primary/5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground leading-tight">Comunidade EBD</h3>
            <p className="text-[11px] text-muted-foreground">Veja o que está rolando</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/membro/comunidade")}
          className="text-primary hover:text-primary text-xs gap-1 h-8"
        >
          Ver tudo
          <ArrowRight className="w-3 h-3" />
        </Button>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <>
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </>
        ) : posts && posts.length > 0 ? (
          posts.map((post) => (
            <button
              key={post.id}
              type="button"
              onClick={() => navigate("/membro/comunidade")}
              className="w-full text-left p-3 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold overflow-hidden shrink-0">
                  {post.author_avatar ? (
                    <img src={post.author_avatar} alt={post.author_name ?? ""} className="w-full h-full object-cover" />
                  ) : (
                    (post.author_name ?? "M").charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground truncate">{post.author_name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              </div>
              {post.content && (
                <p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed">{post.content}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3" /> {post.likes_count}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" /> {post.comments_count}
                </span>
              </div>
            </button>
          ))
        ) : (
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground mb-3">Ainda não há postagens.</p>
            <Button
              size="sm"
              onClick={() => navigate("/membro/comunidade")}
              className="gradient-primary text-white rounded-xl"
            >
              Seja o primeiro a postar
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
