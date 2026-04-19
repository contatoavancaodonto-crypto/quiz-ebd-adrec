import { useState } from "react";
import { Heart, Share2, BookOpen, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useDailyVerse } from "@/hooks/useDailyVerse";
import { cn } from "@/lib/utils";

export const DailyVerseCard = () => {
  const { verse, loading, isSaved, saving, toggleSave, isLoggedIn } = useDailyVerse();
  const [animateHeart, setAnimateHeart] = useState(false);

  if (loading) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardContent className="p-6 flex items-center justify-center min-h-[160px]">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!verse) return null;

  const reference = `${verse.book} ${verse.chapter}:${verse.verse}`;
  const shareText = `"${verse.text}"\n${reference}`;

  const handleSave = async () => {
    if (!isLoggedIn) {
      toast.info("Faça login para salvar versículos");
      return;
    }
    const wasSaved = isSaved;
    const ok = await toggleSave();
    if (ok) {
      setAnimateHeart(true);
      setTimeout(() => setAnimateHeart(false), 400);
      toast.success(wasSaved ? "Versículo removido" : "Versículo salvo ❤️");
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ text: shareText, title: "Versículo do Dia" });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success("Versículo copiado!");
      }
    } catch (err) {
      // user cancelled share — silent
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-xs font-medium text-primary uppercase tracking-wider">
          <BookOpen className="h-3.5 w-3.5" />
          Versículo do Dia
        </div>

        <blockquote className="text-base sm:text-lg leading-relaxed text-foreground italic">
          "{verse.text}"
        </blockquote>

        <p className="text-sm font-semibold text-primary">{reference}</p>

        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="gap-2"
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-all",
                isSaved && "fill-red-500 text-red-500",
                animateHeart && "scale-125",
              )}
            />
            {isSaved ? "Salvo" : "Salvar"}
          </Button>

          <Button variant="ghost" size="sm" onClick={handleShare} className="gap-2">
            <Share2 className="h-4 w-4" />
            Compartilhar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
