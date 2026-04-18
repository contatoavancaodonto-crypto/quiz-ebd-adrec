import { motion } from "framer-motion";
import { Award } from "lucide-react";
import { useBadgesForAttempt } from "@/hooks/useBadges";

interface BadgesShowcaseProps {
  attemptId: string | null;
  participantId: string | null;
}

export function BadgesShowcase({ attemptId, participantId }: BadgesShowcaseProps) {
  const { data: badges, isLoading } = useBadgesForAttempt(attemptId, participantId);

  if (isLoading || !badges || badges.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="glass-card glow-border p-4 mb-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Award className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          Conquistas {badges.length > 1 && <span className="text-muted-foreground">({badges.length})</span>}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {badges.map((b, i) => (
          <motion.div
            key={b.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6 + i * 0.1, type: "spring", stiffness: 200 }}
            className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg p-2"
          >
            <div className="text-2xl shrink-0">{b.badge.emoji}</div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{b.badge.name}</p>
              <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">
                {b.badge.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
