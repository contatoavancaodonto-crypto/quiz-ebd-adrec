import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FavoriteVerse {
  id: string;
  user_id: string;
  book_name: string;
  book_abbrev: string;
  chapter: number;
  verse_number: number;
  verse_text: string;
  created_at: string;
}

export function useFavoriteVerses() {
  const queryClient = useQueryClient();

  const { data: favorites, isLoading } = useQuery({
    queryKey: ["favorite-verses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorite_verses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as FavoriteVerse[];
    },
  });

  const addFavorite = useMutation({
    mutationFn: async (verse: Omit<FavoriteVerse, "id" | "user_id" | "created_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("favorite_verses")
        .upsert({
          user_id: user.id,
          ...verse,
        }, { onConflict: "user_id, book_abbrev, chapter, verse_number" })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite-verses"] });
      toast.success("Versículo favoritado!");
    },
    onError: (error) => {
      console.error("Error adding favorite:", error);
      toast.error("Erro ao favoritar versículo.");
    },
  });

  const removeFavorite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("favorite_verses")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite-verses"] });
      toast.success("Versículo removido dos favoritos.");
    },
    onError: (error) => {
      console.error("Error removing favorite:", error);
      toast.error("Erro ao remover dos favoritos.");
    },
  });

  const toggleFavorite = async (verse: Omit<FavoriteVerse, "id" | "user_id" | "created_at">) => {
    const existing = favorites?.find(
      (f) =>
        f.book_abbrev === verse.book_abbrev &&
        f.chapter === verse.chapter &&
        f.verse_number === verse.verse_number
    );

    if (existing) {
      await removeFavorite.mutateAsync(existing.id);
    } else {
      await addFavorite.mutateAsync(verse);
    }
  };

  const isFavorite = (bookAbbrev: string, chapter: number, verseNumber: number) => {
    return !!favorites?.find(
      (f) =>
        f.book_abbrev === bookAbbrev &&
        f.chapter === chapter &&
        f.verse_number === verseNumber
    );
  };

  return {
    favorites,
    isLoading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
  };
}
