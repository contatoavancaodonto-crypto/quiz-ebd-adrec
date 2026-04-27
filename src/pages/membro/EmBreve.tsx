import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { MemberLayout } from "@/components/membro/MemberLayout";

interface EmBreveProps {
  title: string;
  description: string;
}

export function EmBreve({ title, description }: EmBreveProps) {
  return (
    <MemberLayout
      title={title}
      mobileHeader={{ variant: "back", title, backTo: "/" }}
    >
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-card border border-border p-8 text-center max-w-sm w-full"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary text-primary-foreground mb-4 shadow-lg shadow-primary/30">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="text-[10px] uppercase tracking-widest text-primary font-bold mb-1">
            Em breve
          </div>
          <h2 className="text-xl font-display font-extrabold text-foreground mb-2">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </motion.div>
      </div>
    </MemberLayout>
  );
}
