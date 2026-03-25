import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Clock, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import churchLogo from "@/assets/church-logo.png";

interface EvaluationBreakProps {
  classId: string;
  elapsedFormatted: string;
  onContinue: () => void;
}

export function EvaluationBreak({ classId, elapsedFormatted, onContinue }: EvaluationBreakProps) {
  const [suggestion, setSuggestion] = useState("");
  const [sending, setSending] = useState(false);

  const sendWebhook = async (text: string) => {
    try {
      await fetch("https://webhook.falaminhasmanas.shop/webhook/6a72c185-8673-4a5b-8b97-7f1256501225", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "suggestion_sent",
          classId,
          suggestion_text: text,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.error("Webhook error:", err);
    }
  };

  const handleSend = async () => {
    const text = suggestion.trim();
    if (!text || text.length < 3) {
      toast.error("Digite uma sugestão com pelo menos 3 caracteres.");
      return;
    }
    if (text.length > 500) {
      toast.error("A sugestão deve ter no máximo 500 caracteres.");
      return;
    }
    setSending(true);
    const { error } = await supabase.from("suggestions").insert({ class_id: classId, suggestion_text: text });
    setSending(false);
    if (error) {
      toast.error("Erro ao enviar sugestão.");
    } else {
      sendWebhook(text);
      toast.success("Sugestão enviada com sucesso! 🙏");
      onContinue();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-6">
          <motion.img
            src={churchLogo}
            alt="Logo ADREC"
            className="w-20 h-20 object-contain mx-auto mb-4 drop-shadow-[0_0_15px_rgba(76,201,224,0.3)]"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          />
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">⏸️ Pausa para Avaliação</h1>
          <p className="text-muted-foreground text-sm">O cronômetro está pausado. Aproveite para deixar seu feedback!</p>
        </div>

        {/* Timer paused indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-2 mb-6 text-lg font-mono font-bold text-yellow-500 bg-yellow-500/10 px-4 py-3 rounded-xl border border-yellow-500/20 w-fit mx-auto"
        >
          <Clock className="w-5 h-5" />
          <span>{elapsedFormatted}</span>
          <span className="text-xs font-sans font-normal text-yellow-500/70 ml-1">PAUSADO</span>
        </motion.div>

        {/* Feedback area */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card glow-border p-5 mb-6"
        >
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3 text-center">
            💬 Avaliação anônima para o professor
          </p>
          <textarea
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            placeholder="Deixe uma sugestão ou avaliação para o seu professor (opcional)..."
            maxLength={500}
            rows={4}
            className="w-full bg-background border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">{suggestion.length}/500</span>
          </div>

          {suggestion.trim().length >= 3 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSend}
              disabled={sending}
              className="w-full mt-3 py-3.5 rounded-xl gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {sending ? "Enviando..." : "Enviar Avaliação"}
            </motion.button>
          )}
        </motion.div>

        {/* Skip button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onContinue}
          className="w-full py-3.5 rounded-xl border-2 border-border bg-card text-foreground font-semibold flex items-center justify-center gap-2 hover:border-primary/40 transition-colors cursor-pointer"
        >
          Pular e Voltar ao Quiz
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </motion.div>
    </div>
  );
}
