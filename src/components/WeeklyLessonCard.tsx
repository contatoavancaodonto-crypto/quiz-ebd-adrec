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
  
  const dayNames = {
    seg: "Segunda",
    ter: "Terça",
    qua: "Quarta",
    qui: "Quinta",
    sex: "Sexta",
    sab: "Sábado"
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
                <Badge variant="outline" className="bg-white/5 border-primary/20 text-primary text-[9px] px-2 py-0.5 font-bold">
                  {new Date(lesson.scheduled_date + "T00:00:00").toLocaleDateString('pt-BR')}
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
            
            {lesson.weekly_bible_reading && (
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-muted/30 border border-border/50">
                <BookOpen className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">Leitura Principal (Dom)</span>
                  <p className="text-xs font-medium text-foreground leading-snug">
                    {lesson.weekly_bible_reading}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Quote className="w-3 h-3 text-primary/40" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Plano de Leitura Diária (Seg-Sáb)</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(lesson.verses).map(([day, text]) => (
                <div key={day} className="p-3 rounded-2xl bg-card border border-primary/5 shadow-sm space-y-1.5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-8 h-8 bg-primary/5 rounded-bl-2xl -mr-4 -mt-4 transition-all group-hover:bg-primary/10" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-primary/60">
                    {dayNames[day as keyof typeof dayNames]}
                  </span>
                  <p className="text-[11px] leading-relaxed text-foreground/90 line-clamp-2 italic font-medium">
                    {text || "Não agendado"}
                  </p>
                </div>
              ))}
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
