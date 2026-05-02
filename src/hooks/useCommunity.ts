import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Post {
  id: string;
  user_id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  deleted: boolean;
  church_id: string | null;
  status: "approved" | "pending" | "blocked";
  risk_level: string | null;
  moderation_reason: string | null;
  author?: {
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    church_name?: string;
  };
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
}

export function useCommunity() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "church">("all");
  const [userProfile, setUserProfile] = useState<{ church_id: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;

    // Fetch initial profile
    const fetchProfile = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("church_id")
        .eq("id", user.id)
        .single();
      setUserProfile(profile);
    };
    fetchProfile();

    // Listen for real-time changes to the user's profile (specifically church_id)
    const profileChannel = supabase
      .channel(`user-profile-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && "church_id" in payload.new) {
            setUserProfile({ church_id: payload.new.church_id });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
    };
  }, [user]);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from("posts")
        .select(`
          *,
          author:profiles(
            display_name,
            first_name,
            last_name,
            avatar_url,
            church:churches(
              name
            )
          ),
          likes:post_likes(user_id),
          comments:post_comments(id)
        `)
        .eq("deleted", false);

      if (filter === "church") {
        if (userProfile === null) {
          // If profile is still loading, don't fetch posts yet to avoid flash of "all posts"
          return;
        }
        
        if (userProfile.church_id) {
          query = query.eq("church_id", userProfile.church_id);
        } else {
          // If user has no church, show empty feed for church filter
          setPosts([]);
          setLoading(false);
          return;
        }
      }

      const { data: postsData, error: postsError } = await query
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;

      const formattedPosts = postsData.map((p: any) => ({
        ...p,
        author: {
          ...p.author,
          church_name: p.author?.church?.name
        },
        likes_count: p.likes?.length || 0,
        comments_count: p.comments?.filter((c: any) => !c.deleted).length || 0,
        user_has_liked: p.likes?.some((l: any) => l.user_id === user?.id) || false
      }));

      setPosts(formattedPosts);
    } catch (error: any) {
      console.error("Error fetching posts:", error);
      toast.error("Erro ao carregar postagens");
    } finally {
      setLoading(false);
    }
  }, [user?.id, filter, userProfile?.church_id]);

  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel(`community-posts-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        () => fetchPosts()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_likes" },
        () => fetchPosts()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_comments" },
        () => fetchPosts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosts, filter]);

  const createPost = async (content: string, imageFile?: File) => {
    if (!user) return;
    try {
      let imageUrl = null;
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("community")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage
          .from("community")
          .getPublicUrl(fileName);
        imageUrl = publicUrl;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("church_id")
        .eq("id", user.id)
        .single();

      // Insert as pending by default
      const { data: newPost, error } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          content,
          image_url: imageUrl,
          church_id: profile?.church_id,
          status: "pending"
        })
        .select()
        .single();

      if (error) throw error;

      // Call AI moderation (async, don't block user)
      moderateContent("post", newPost.id, content, imageUrl);

      toast.success("Publicado com sucesso. O conteúdo está em análise.");
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast.error("Erro ao publicar");
    }
  };

  const moderateContent = async (type: "post" | "comment", id: string, content: string, imageUrl?: string | null) => {
    try {
      const { data, error } = await supabase.functions.invoke("community-ai", {
        body: { mode: "moderate", text: content, imageUrl, type, id, userId: user?.id }
      });

      if (error) throw error;

      const { status } = data;

      if (status === "blocked") {
        toast.error("Sua postagem foi bloqueada por conter conteúdo inadequado.");
      }
    } catch (error) {
      console.error("Moderation error:", error);
    }
  };

  const toggleLike = async (postId: string, hasLiked: boolean) => {
    if (!user) return;
    try {
      if (hasLiked) {
        await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("post_likes")
          .insert({ post_id: postId, user_id: user.id });
      }
    } catch (error: any) {
      console.error("Error toggling like:", error);
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from("posts")
        .update({ deleted: true })
        .eq("id", postId);

      if (error) throw error;
      toast.success("Postagem removida");
    } catch (error: any) {
      console.error("Error deleting post:", error);
      toast.error("Erro ao remover postagem");
    }
  };

  const updatePost = async (postId: string, content: string) => {
    try {
      const { error } = await supabase
        .from("posts")
        .update({ content, updated_at: new Date().toISOString() })
        .eq("id", postId);

      if (error) throw error;
      toast.success("Postagem atualizada");
    } catch (error: any) {
      console.error("Error updating post:", error);
      toast.error("Erro ao atualizar postagem");
    }
  };

  const reportPost = async (postId: string, reason: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from("post_reports").insert({
        post_id: postId,
        reporter_id: user.id,
        reason
      });

      if (error) {
        if (error.code === "23505") {
          toast.info("Você já denunciou esta postagem.");
          return;
        }
        throw error;
      }
      // Success feedback handled in component
    } catch (error: any) {
      console.error("Error reporting post:", error);
      toast.error("Erro ao enviar denúncia");
    }
  };

  return {
    posts,
    loading,
    filter,
    setFilter,
    createPost,
    toggleLike,
    deletePost,
    updatePost,
    reportPost,
    refresh: fetchPosts
  };
}
