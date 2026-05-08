import { motion } from "framer-motion";
import { Award, Loader2, Sparkles } from "lucide-react";
import { MemberLayout } from "@/components/membro/MemberLayout";
import { useAuth } from "@/hooks/useAuth";
import { useAllBadges } from "@/hooks/useBadges";
import { useFullProfile } from "@/hooks/useFullProfile";

export default function Conquistas() {
  const { user } = useAuth();
  const { data: profile } = useFullProfile();
  const { data: badges, isLoading } = useAllBadges(profile?.id);

  return (
    <MemberLayout
      title="Minhas Conquistas"
      mobileHeader={{ variant: "back", title: "Conquistas" }}
    >
      <div className="space-y-6">
        <header>
          <h2 className="text-2xl font-display font-extrabold text-foreground flex items-center gap-2">
            <Award className="w-8 h-8 text-primary" />
            Galeria de Troféus
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Aqui você encontra todas as medalhas e reconhecimentos que conquistou em sua jornada na EBD.
          </p>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando suas conquistas...</p>
          </div>
        ) : !badges || badges.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-12 text-center space-y-4"
          >
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto text-4xl">
              🎯
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground">Ainda não há conquistas</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Participe dos quizzes semanais e alcance as melhores pontuações para desbloquear medalhas exclusivas!
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.map((b, i) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card glow-border p-5 relative group overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Sparkles className="w-12 h-12 text-primary" />
                </div>
                
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-4xl shrink-0 shadow-inner">
                    {b.badge.emoji}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h3 className="font-display font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                      {b.badge.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {b.badge.description}
                    </p>
                    <div className="pt-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        Conquistada em {new Date(b.earned_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </MemberLayout>
  );
}
