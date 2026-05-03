import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, CheckCircle2, ChevronRight, Sparkles } from "lucide-react";
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="overflow-hidden border-primary/20 bg-card/50 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-primary/5 transition-all">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Calendar className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                Lição {lesson.lesson_number}
              </span>
            </div>
            {lesson.has_quiz && (
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-none text-[8px] px-1.5 py-0 h-4">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Prova Disponível
              </Badge>
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground leading-tight">
              {lesson.lesson_title}
            </h3>
            {lesson.weekly_bible_reading && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                Leitura: {lesson.weekly_bible_reading}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {Object.entries(lesson.verses).map(([day, text]) => (
              <div key={day} className="p-2 rounded-xl bg-muted/40 border border-border/50 space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  {dayNames[day as keyof typeof dayNames]}
                </span>
                <p className="text-[10px] leading-tight text-foreground line-clamp-2 italic italic">
                  {text || "Não agendado"}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Button 
              onClick={() => navigate("/quiz")} 
              disabled={!lesson.has_quiz}
              className="w-full gradient-primary text-white font-bold rounded-2xl h-10 text-xs shadow-md shadow-primary/10 gap-2"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Ver Lição & Quiz
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
