import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useBibliaData } from "./useBibliaData";

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
  const { data: books } = useBibliaData();

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
    // Try to find correct abbrev if book_name is full name
    let bookAbbrev = verse.book_abbrev;
    if (books && (verse.book_name.length > 5 || verse.book_abbrev.length > 5)) {
      const found = books.find(b => 
        b.name.toLowerCase() === verse.book_name.toLowerCase() || 
        b.abbrev.toLowerCase() === verse.book_abbrev.toLowerCase() ||
        b.name.toLowerCase() === verse.book_abbrev.toLowerCase()
      );
      if (found) {
        bookAbbrev = found.abbrev;
      }
    }

    const existing = favorites?.find(
      (f) =>
        (f.book_abbrev.toLowerCase() === bookAbbrev.toLowerCase()) &&
        f.chapter === verse.chapter &&
        f.verse_number === verse.verse_number
    );

    if (existing) {
      await removeFavorite.mutateAsync(existing.id);
    } else {
      await addFavorite.mutateAsync({
        ...verse,
        book_abbrev: bookAbbrev
      });
    }
  };

  const isFavorite = (bookAbbrev: string, chapter: number, verseNumber: number) => {
    // Try to find correct abbrev to compare
    let targetAbbrev = bookAbbrev;
    if (books && bookAbbrev.length > 5) {
      const found = books.find(b => 
        b.name.toLowerCase() === bookAbbrev.toLowerCase() || 
        b.abbrev.toLowerCase() === bookAbbrev.toLowerCase()
      );
      if (found) targetAbbrev = found.abbrev;
    }

    return !!favorites?.find(
      (f) =>
        (f.book_abbrev.toLowerCase() === targetAbbrev.toLowerCase() || f.book_name.toLowerCase() === targetAbbrev.toLowerCase()) &&
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
