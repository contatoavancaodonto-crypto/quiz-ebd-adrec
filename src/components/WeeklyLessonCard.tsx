import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle2, ChevronRight, Sparkles, Quote, X, BookMarked } from "lucide-react";
import { motion } from "framer-motion";
import { WeeklyLesson } from "@/hooks/useWeeklyLessons";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface WeeklyLessonCardProps {
  lesson: WeeklyLesson;
  index: number;
}

const dayNames: Record<string, string> = {
  segunda: "Segunda",
  terca: "Terça",
  quarta: "Quarta",
  quinta: "Quinta",
  sexta: "Sexta",
  sabado: "Sábado",
};

const dayOffsets: Record<string, number> = {
  segunda: 0, terca: 1, quarta: 2, quinta: 3, sexta: 4, sabado: 5,
};

const getDayDate = (baseDateStr: string | undefined | null, dayKey: string) => {
  if (!baseDateStr) return null;
  const baseDate = new Date(baseDateStr + "T12:00:00");
  const date = new Date(baseDate);
  date.setDate(baseDate.getDate() + (dayOffsets[dayKey] ?? 0));
  return date;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const WeeklyLessonCard = ({ lesson, index }: WeeklyLessonCardProps) => {
  const navigate = useNavigate();
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [readDays, setReadDays] = useState<Record<string, boolean>>({});

  const storageKey = `lesson-read-${lesson.id}`;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setReadDays(JSON.parse(stored));
    } catch {}
  }, [storageKey]);

  const toggleRead = (dayKey: string) => {
    const next = { ...readDays, [dayKey]: !readDays[dayKey] };
    setReadDays(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
  };

  const today = new Date();

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
            {lesson.has_quiz && (
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-none text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Quiz Ativo
              </Badge>
            )}
          </div>

          {lesson.reading_theme && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/10 w-fit">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold text-primary">{lesson.reading_theme}</span>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Quote className="w-3 h-3 text-primary/40" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Plano de Leitura Diária (Seg-Sáb)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Object.keys(dayNames).map((dayKey) => {
                const verse = (lesson.verses as any)[dayKey] as { referencia: string | null; texto: string | null };
                const dayDate = getDayDate(lesson.scheduled_date, dayKey);
                const dateLabel = dayDate?.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
                const isToday = dayDate ? isSameDay(dayDate, today) : false;
                const isRead = !!readDays[dayKey];
                const hasContent = !!verse?.referencia;

                return (
                  <button
                    key={dayKey}
                    type="button"
                    onClick={() => hasContent && setOpenDay(dayKey)}
                    disabled={!hasContent}
                    className={cn(
                      "p-3 rounded-2xl bg-card shadow-sm space-y-1 relative overflow-hidden text-left transition-all",
                      "border-2",
                      isRead
                        ? "border-emerald-500/70 shadow-emerald-500/10"
                        : isToday
                          ? "border-amber-400 shadow-[0_0_20px_-5px_hsl(45_95%_55%/0.5)] ring-2 ring-amber-400/30"
                          : "border-primary/5",
                      hasContent ? "hover:scale-[1.02] cursor-pointer" : "opacity-60 cursor-default"
                    )}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-widest",
                        isToday ? "text-amber-400" : isRead ? "text-emerald-500" : "text-primary/60"
                      )}>
                        {dayNames[dayKey]}
                      </span>
                      {dateLabel && (
                        <span className={cn(
                          "text-[9px] font-bold px-1.5 py-0.5 rounded-md",
                          isToday
                            ? "bg-amber-400/20 text-amber-400"
                            : isRead
                              ? "bg-emerald-500/15 text-emerald-500"
                              : "bg-muted/50 text-muted-foreground"
                        )}>
                          {dateLabel}
                        </span>
                      )}
                    </div>
                    <p className={cn(
                      "text-[11px] leading-relaxed line-clamp-2 italic font-medium",
                      isRead ? "text-emerald-500/90" : "text-foreground/90"
                    )}>
                      {verse?.referencia || "Não agendado"}
                    </p>
                    {isRead && (
                      <div className="absolute top-1.5 right-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                Domingo reservado para o Quiz
              </span>
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

      <Dialog open={!!openDay} onOpenChange={(o) => !o && setOpenDay(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          {openDay && (() => {
            const verse = (lesson.verses as any)[openDay] as { referencia: string | null; texto: string | null };
            const dayDate = getDayDate(lesson.scheduled_date, openDay);
            const dateLabel = dayDate?.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
            const isRead = !!readDays[openDay];
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <BookMarked className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70 block">
                        {dayNames[openDay]} {dateLabel && `· ${dateLabel}`}
                      </span>
                      <DialogTitle className="text-lg font-display font-extrabold">
                        {verse?.referencia}
                      </DialogTitle>
                    </div>
                  </div>
                  <DialogClose className="absolute right-4 top-4 rounded-full p-1.5 bg-muted hover:bg-muted/80 transition-colors">
                    <X className="w-4 h-4" />
                  </DialogClose>
                </DialogHeader>
                <div className="rounded-xl bg-muted/40 border border-border/50 p-4 my-2">
                  <p className="text-sm leading-relaxed text-foreground italic">
                    {verse?.texto || "Texto do versículo não disponível."}
                  </p>
                </div>
                <Button
                  onClick={() => toggleRead(openDay)}
                  className={cn(
                    "w-full font-bold rounded-xl h-11 gap-2 transition-all",
                    isRead
                      ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border border-emerald-500/40"
                      : "gradient-primary text-white shadow-lg shadow-primary/20"
                  )}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isRead ? "Marcado como lido" : "Marcar como lido"}
                </Button>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
