import { useWeeklyReading } from "@/hooks/useWeeklyReading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, ArrowRight, Sparkles, Quote } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export const WeeklyReadingCard = () => {
  const { data: reading, isLoading } = useWeeklyReading();
  const navigate = useNavigate();

  if (isLoading) {
    return <Skeleton className="w-full h-[160px] rounded-3xl" />;
  }

  if (!reading || reading.type === "none") {
    return null;
  }

  const isQuizDay = reading.type === "quiz_cta";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`overflow-hidden border-primary/20 bg-gradient-to-br ${
        isQuizDay 
          ? "from-primary/10 via-background to-background border-primary/30" 
          : "from-secondary/5 via-background to-background"
      } rounded-3xl shadow-lg shadow-primary/5`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${isQuizDay ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'}`}>
                {isQuizDay ? <Sparkles className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {reading.dayName}
              </span>
            </div>
            {reading.lessonTitle && (
              <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-medium truncate max-w-[150px]">
                {reading.lessonTitle}
              </span>
            )}
          </div>

          <div className="space-y-3">
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isQuizDay ? 'text-primary' : 'text-foreground'}`}>
              {reading.title}
            </h3>

            {isQuizDay ? (
              <div className="space-y-4">
                <p className="text-base font-medium text-foreground leading-relaxed">
                  Hoje é dia de testar seus conhecimentos! O quiz semanal está disponível.
                </p>
                <Button 
                  onClick={() => {
                    const el = document.getElementById("quiz-semanal-section");
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                    else navigate("/");
                  }} 
                  className="w-full gradient-primary text-white font-bold rounded-2xl h-11 shadow-lg shadow-primary/20 gap-2"
                >
                  Responder Quiz Agora
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                {reading.content && (
                  <div className="relative">
                    <Quote className="absolute -top-2 -left-2 h-8 w-8 text-primary/10 -z-0" />
                    <p className="text-lg font-display font-bold text-foreground leading-tight relative z-10 italic">
                      "{reading.content}"
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-primary uppercase tracking-widest">
                      <Sparkles className="h-3 w-3" /> Devocional de hoje
                    </div>
                  </div>
                )}

                {reading.weeklyBibleReading && (
                  <div className={`p-4 rounded-2xl bg-muted/50 border border-border/50`}>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-secondary uppercase tracking-widest mb-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      Leitura Bíblica Semanal
                    </div>
                    <p className="text-sm text-foreground">
                      {reading.weeklyBibleReading}
                    </p>
                  </div>
                )}
                
                {!reading.content && !reading.weeklyBibleReading && (
                  <p className="text-muted-foreground italic text-sm text-center py-4">
                    Nenhum conteúdo agendado para hoje.
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};