import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, CheckCircle2, ChevronRight, Sparkles, Quote } from "lucide-react";
import { motion } from "framer-motion";
import { WeeklyLesson } from "@/hooks/useWeeklyLessons";
import { useNavigate } from "react-router-dom";

interface WeeklyLessonCardProps {
  lesson: WeeklyLesson;
  index: number;
}

export const WeeklyLessonCard = ({ lesson, index }: WeeklyLessonCardProps) => {
  const navigate = useNavigate();
  
  const dayNames: Record<string, string> = {
    segunda: "Segunda",
    terca: "Terça",
    quarta: "Quarta",
    quinta: "Quinta",
    sexta: "Sexta",
    sabado: "Sábado"
  };

  const getDayDate = (baseDateStr: string | undefined, dayKey: string) => {
    if (!baseDateStr) return null;
    const baseDate = new Date(baseDateStr + "T12:00:00");
    const dayOffsets: Record<string, number> = {
      segunda: 0,
      terca: 1,
      quarta: 2,
      quinta: 3,
      sexta: 4,
      sabado: 5
    };
    
    const offset = dayOffsets[dayKey] ?? 0;
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + offset);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
    >
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 rounded-[2rem] shadow-xl hover:shadow-primary/10 transition-all border-l-4 border-l-primary">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70 block">
                  Lição {lesson.lesson_number}
                </span>
                <h3 className="text-lg font-display font-extrabold text-foreground leading-tight">
                  {lesson.lesson_title}
                </h3>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              {lesson.scheduled_date && (
                <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary text-[10px] px-2 py-1 font-bold rounded-lg">
                  Início: {new Date(lesson.scheduled_date + "T12:00:00").toLocaleDateString('pt-BR')}
                </Badge>
              )}
              {lesson.has_quiz && (
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-none text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Quiz Ativo
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {lesson.reading_theme && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/10 w-fit">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-bold text-primary">{lesson.reading_theme}</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Quote className="w-3 h-3 text-primary/40" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Plano de Leitura Diária (Seg-Sáb)</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Object.keys(dayNames).map((dayKey) => {
                const reference = (lesson.verses as any)[dayKey];
                const dateLabel = getDayDate(lesson.scheduled_date, dayKey);
                
                return (
                  <div key={dayKey} className="p-3 rounded-2xl bg-card border border-primary/5 shadow-sm space-y-1 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-8 h-8 bg-primary/5 rounded-bl-2xl -mr-4 -mt-4 transition-all group-hover:bg-primary/10" />
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-primary/60">
                        {dayNames[dayKey]}
                      </span>
                      {dateLabel && (
                        <span className="text-[9px] font-bold text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-md">
                          {dateLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] leading-relaxed text-foreground/90 line-clamp-2 italic font-medium">
                      {reference || "Não agendado"}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Domingo reservado para o Quiz</span>
            </div>
          </div>

          <div className="pt-2">
            <Button 
              onClick={() => navigate("/quiz")} 
              disabled={!lesson.has_quiz}
              className="w-full gradient-primary text-white font-bold rounded-2xl h-12 shadow-lg shadow-primary/20 gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              <Sparkles className="h-4 w-4" />
              Praticar Lição & Quiz
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
