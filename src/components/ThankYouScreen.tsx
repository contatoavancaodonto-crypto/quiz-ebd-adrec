import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import churchLogo from "@/assets/church-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const WEBHOOK_URL = "https://n8n.falaminhasmanas.shop/webhook-test/3b7c7b18-7b0b-4538-9139-6d26e7c47a43";

interface ThankYouScreenProps {
  participantName: string;
  classId: string;
  className: string;
  score: number;
  totalTimeSeconds: number;
  onContinue: () => void;
}

export function ThankYouScreen({ participantName, classId, className, score, totalTimeSeconds, onContinue }: ThankYouScreenProps) {
  const [show, setShow] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 500);
    return () => clearTimeout(t);
  }, []);

  const sendWebhook = async (event: string, extra: Record<string, unknown> = {}) => {
    try {
      await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event,
          participantName,
          classId,
          className,
          score,
          totalTimeSeconds,
          timestamp: new Date().toISOString(),
          ...extra,
        }),
      });
    } catch (err) {
      console.error("Webhook error:", err);
    }
  };

  const handleSendSuggestion = async () => {
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
    const { error } = await supabase
      .from("suggestions")
      .insert({ class_id: classId, suggestion_text: text });
    setSending(false);
    if (error) {
      toast.error("Erro ao enviar sugestão.");
    } else {
      setSent(true);
      toast.success("Sugestão enviada com sucesso! 🙏");
      sendWebhook("suggestion_sent", { suggestion: text });
    }
  };

  const handleContinue = () => {
    sendWebhook("view_result");
    onContinue();
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
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10 text-center"
      >
        <motion.img
          src={churchLogo}
          alt="Logo ADREC"
          className="w-28 h-28 object-contain mx-auto mb-6 drop-shadow-[0_0_15px_rgba(76,201,224,0.3)]"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        />

        <h1 className="text-2xl font-display font-bold text-foreground mb-2">
          Obrigado, {participantName}! 🙏
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          Agradecemos sua participação no Quiz EBD
        </p>

        <div className="glass-card glow-border p-5 mb-6 text-center space-y-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Pastor Presidente
            </p>
            <p className="text-base font-semibold text-foreground">Pr. Osmael Portilho</p>
          </div>

          <div className="w-12 h-px bg-border mx-auto" />

          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Superintendentes da EBD
            </p>
            <p className="text-base font-semibold text-foreground">PB Maicon</p>
            <p className="text-base font-semibold text-foreground">Irmã Raymara</p>
          </div>

          <div className="w-12 h-px bg-border mx-auto" />

          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Agradecimento Especial
            </p>
            <p className="text-sm text-primary font-medium">
              Equipe de Comunicação da ADREC 📡
            </p>
          </div>
        </div>

        {/* Anonymous suggestion */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card glow-border p-4 mb-6 text-left"
        >
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2 text-center">
            💬 Sugestão anônima para o professor
          </p>
          {sent ? (
            <p className="text-sm text-primary font-medium text-center py-2">
              ✅ Sugestão enviada! Obrigado pelo feedback.
            </p>
          ) : (
            <>
              <textarea
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                placeholder="Deixe uma sugestão para o seu professor (opcional)..."
                maxLength={500}
                rows={3}
                className="w-full bg-background border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">{suggestion.length}/500</span>
                {suggestion.trim().length >= 3 && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendSuggestion}
                    disabled={sending}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold shadow cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {sending ? "Enviando..." : "Enviar"}
                  </motion.button>
                )}
              </div>
            </>
          )}
        </motion.div>

        {show && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleContinue}
            className="w-full py-4 rounded-xl gradient-primary text-primary-foreground font-semibold text-lg shadow-lg cursor-pointer"
          >
            Ver Meu Resultado 🏆
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
