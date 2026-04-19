import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface DailyVerse {
  verse_id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  theme: string;
}

export const useDailyVerse = () => {
  const { user } = useAuth();
  const [verse, setVerse] = useState<DailyVerse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchVerse = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_or_create_daily_verse");
    if (!error && data && data.length > 0) {
      setVerse(data[0] as DailyVerse);
    }
    setLoading(false);
  }, []);

  const checkSaved = useCallback(async (verseId: string) => {
    if (!user) return setIsSaved(false);
    const { data } = await supabase
      .from("saved_verses")
      .select("id")
      .eq("user_id", user.id)
      .eq("verse_id", verseId)
      .maybeSingle();
    setIsSaved(!!data);
  }, [user]);

  useEffect(() => {
    fetchVerse();
  }, [fetchVerse]);

  useEffect(() => {
    if (verse) checkSaved(verse.verse_id);
  }, [verse, checkSaved]);

  const toggleSave = async () => {
    if (!user || !verse || saving) return false;
    setSaving(true);
    try {
      if (isSaved) {
        await supabase
          .from("saved_verses")
          .delete()
          .eq("user_id", user.id)
          .eq("verse_id", verse.verse_id);
        setIsSaved(false);
      } else {
        await supabase
          .from("saved_verses")
          .insert({ user_id: user.id, verse_id: verse.verse_id });
        setIsSaved(true);
      }
      return true;
    } finally {
      setSaving(false);
    }
  };

  return { verse, loading, isSaved, saving, toggleSave, isLoggedIn: !!user };
};
