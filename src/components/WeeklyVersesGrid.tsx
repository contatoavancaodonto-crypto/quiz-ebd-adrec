import { useWeeklyVerses } from "@/hooks/useWeeklyVerses";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { BookMarked, Calendar } from "lucide-react";

export const WeeklyVersesGrid = () => {
  const { data: verses, isLoading } = useWeeklyVerses();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!verses || verses.length === 0) return null;

  const daysMap = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  
  // Group verses by day of week (1-7)
  const versesByDay = verses.reduce((acc, v) => {
    const date = new Date(v.scheduled_date + "T12:00:00");
    let dayIndex = date.getDay(); // 0 is Sun
    dayIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Map to 0 (Mon) - 6 (Sun)
    acc[dayIndex] = v;
    return acc;
  }, {} as Record<number, any>);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Versículos da Semana
        </h2>
      </div>

      <div className="flex overflow-x-auto pb-4 gap-3 snap-x scrollbar-hide">
        {daysMap.map((day, index) => {
          const verse = versesByDay[index];
          const isToday = new Date().getDay() === (index === 6 ? 0 : index + 1);

          return (
            <motion.div 
              key={day}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex-shrink-0 w-[160px] snap-start"
            >
              <Card className={`h-full border-primary/10 bg-card/50 backdrop-blur-sm ${isToday ? 'border-primary/40 ring-1 ring-primary/20' : ''} rounded-2xl overflow-hidden shadow-sm`}>
                <CardContent className="p-3 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                      {day}
                    </span>
                    {isToday && (
                      <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3 leading-none uppercase bg-primary/20 text-primary border-none">
                        Hoje
                      </Badge>
                    )}
                  </div>

                  {verse ? (
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="text-[9px] font-bold text-primary truncate uppercase">
                          {verse.theme}
                        </div>
                        <p className="text-[11px] leading-tight text-foreground line-clamp-3 italic">
                          "{verse.text}"
                        </p>
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-[9px] font-bold text-muted-foreground">
                        <BookMarked className="w-2.5 h-2.5" />
                        {verse.book} {verse.chapter}:{verse.verse}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-[10px] text-muted-foreground italic text-center">
                        Sem versículo
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
