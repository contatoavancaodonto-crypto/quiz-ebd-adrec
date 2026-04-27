import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import churchLogo from "@/assets/church-logo.webp";

export function SeasonClosedScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <img src={churchLogo} alt="ADREC" className="w-28 h-28 mx-auto mb-6" />
        <div className="glass-card glow-border p-8 rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-display font-bold mb-3">Quiz encerrado</h1>
          <p className="text-muted-foreground">
            Este quiz foi encerrado. Aguarde a próxima temporada.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
