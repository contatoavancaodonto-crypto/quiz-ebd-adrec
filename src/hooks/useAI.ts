import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAI() {
  const [checking, setChecking] = useState(false);
  const lastTextRef = useRef("");
  const timeoutRef = useRef<number | null>(null);

  const spellCheck = useCallback(async (text: string, onUpdate: (corrected: string) => void) => {
    if (!text || text.length < 5 || text === lastTextRef.current) return;
    
    // Clear previous timeout
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    setChecking(true);
    
    timeoutRef.current = window.setTimeout(async () => {
      try {
        const { data, error } = await supabase.functions.invoke("community-ai", {
          body: { mode: "spellcheck", text }
        });

        if (error) throw error;
        
        if (data?.correctedText && data.correctedText !== text) {
          onUpdate(data.correctedText);
        }
      } catch (err) {
        console.error("Spellcheck error:", err);
      } finally {
        setChecking(false);
        lastTextRef.current = text;
      }
    }, 1500) as unknown as number; // Longer debounce for better UX
  }, []);

  return { spellCheck, checking };
}
