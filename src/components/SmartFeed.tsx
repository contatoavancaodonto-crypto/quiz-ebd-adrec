import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Trophy,
  BookOpen,
  FileText,
  Download,
  CheckCircle2,
  Clock,
  Target,
  Flame,
  Award,
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import { useSmartFeed } from "@/hooks/useSmartFeed";
import { useActiveSeason } from "@/hooks/useActiveSeason";
import { useCountdown } from "@/hooks/useCountdown";

interface SmartFeedProps {
  onStartQuiz?: () => void;
  quizDisabled?: boolean;
}

const fmtTime = (s: number) => {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r.toString().padStart(2, "0")}s`;
};

export function SmartFeed({ onStartQuiz, quizDisabled }: SmartFeedProps) {
  const navigate = useNavigate();
  const { data, isLoading } = useSmartFeed();
  const { data: season } = useActiveSeason();
  const countdown = useCountdown(season?.end_date);

  if (isLoading || !data) {
    return (
      <div className="space-y-3">
        <div className="h-32 rounded-xl bg-muted/30 animate-pulse" />
        <div className="h-24 rounded-xl bg-muted/30 animate-pulse" />
      </div>
    );
  }

  const {
    hasAnsweredCurrentTrimester,
    lastAttempt,
    rankPosition,
    latestMaterial,
    badgesCount,
    isHighPerformer,
  } = data;

  // Urgência: < 7 dias para encerrar
  const showUrgency =
    !!season &&
    !countdown.expired &&
    countdown.days <= 7 &&
    !hasAnsweredCurrentTrimester;

  const cards: React.ReactNode[] = [];

  // 🔴 Urgência leve — final de temporada
  if (showUrgency) {
    cards.push(
      <FeedCard
        key="urgency"
        gradient="from-amber-500/10 to-orange-500/10"
        border="border-amber-500/30"
        icon={<Clock className="w-5 h-5 text-amber-500" />}
        title="A temporada está chegando ao fim"
        description="Aproveite para revisar e concluir sua participação."
        accent={
          <div className="flex items-center gap-2 text-xs font-mono text-amber-600 dark:text-amber-400">
            <span>{countdown.days}d</span>
            <span>{countdown.hours}h</span>
            <span>{countdown.minutes}m</span>
          </div>
        }
      />
    );
  }

  // 🟢 1. Ainda não respondeu o quiz ativo
  if (!hasAnsweredCurrentTrimester) {
    cards.push(
      <FeedCard
        key="invite"
        gradient="from-primary/10 to-secondary/10"
        border="border-primary/30"
        icon={<Sparkles className="w-5 h-5 text-primary" />}
        title="Que tal testar seu conhecimento no quiz desta semana?"
        description="Leva poucos minutos e ajuda a fixar o aprendizado."
        action={{
          label: "Responder Quiz",
          icon: <ChevronRight className="w-4 h-4" />,
          onClick: () => onStartQuiz?.(),
          disabled: quizDisabled,
          primary: true,
        }}
      />
    );
  } else if (lastAttempt) {
    // 🟡 2. Já respondeu
    const isPerfect = lastAttempt.score === lastAttempt.total_questions;
    cards.push(
      <FeedCard
        key="completed"
        gradient="from-emerald-500/10 to-teal-500/10"
        border="border-emerald-500/30"
        icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
        title={isPerfect ? "Pontuação perfeita! 🎉" : "Parabéns por concluir o quiz!"}
        description="Continue acompanhando seu desempenho e revisando o conteúdo."
        stats={[
          { label: "Acertos", value: `${lastAttempt.score}/${lastAttempt.total_questions}` },
          { label: "Precisão", value: `${Math.round(lastAttempt.accuracy_percentage)}%` },
          { label: "Tempo", value: fmtTime(lastAttempt.total_time_seconds) },
        ]}
        action={{
          label: "Ver resultado completo",
          icon: <ChevronRight className="w-4 h-4" />,
          onClick: () => navigate(`/gabarito?attempt=${lastAttempt.id}`),
        }}
      />
    );

    // 🟣 3. Bom desempenho
    if (isHighPerformer) {
      cards.push(
        <FeedCard
          key="high-performer"
          gradient="from-purple-500/10 to-fuchsia-500/10"
          border="border-purple-500/30"
          icon={<Flame className="w-5 h-5 text-purple-500" />}
          title="Ótimo desempenho! Continue firme nos estudos."
          description={
            badgesCount > 0
              ? `Você já conquistou ${badgesCount} ${badgesCount === 1 ? "conquista" : "conquistas"}.`
              : "Seu esforço está fazendo a diferença."
          }
          action={
            badgesCount > 0
              ? {
                  label: "Ver minhas conquistas",
                  icon: <Award className="w-4 h-4" />,
                  onClick: () => navigate("/membro/desempenho"),
                }
              : undefined
          }
        />
      );
    }
  }

  // 🔵 4. Foco em aprendizado — sempre presente
  cards.push(
    <FeedCard
      key="learning"
      gradient="from-sky-500/10 to-blue-500/10"
      border="border-sky-500/30"
      icon={<GraduationCap className="w-5 h-5 text-sky-500" />}
      title="Aprofunde seus estudos"
      description="Materiais para apoiar sua jornada de aprendizado."
      buttons={[
        ...(lastAttempt
          ? [
              {
                label: "Ver gabarito",
                icon: <Target className="w-4 h-4" />,
                onClick: () => navigate(`/gabarito?attempt=${lastAttempt.id}`),
              },
            ]
          : []),
        {
          label: "Revista da classe",
          icon: <FileText className="w-4 h-4" />,
          onClick: () => navigate("/membro/revista"),
        },
        {
          label: "Bíblia",
          icon: <BookOpen className="w-4 h-4" />,
          onClick: () => navigate("/membro/biblia"),
        },
      ]}
    />
  );

  // 🟠 6. Novo material disponível (últimos 14 dias)
  if (latestMaterial) {
    const daysAgo =
      (Date.now() - new Date(latestMaterial.created_at).getTime()) / 86_400_000;
    if (daysAgo <= 14) {
      cards.push(
        <FeedCard
          key="new-material"
          gradient="from-orange-500/10 to-rose-500/10"
          border="border-orange-500/30"
          icon={<FileText className="w-5 h-5 text-orange-500" />}
          title="Nova revista disponível para estudo"
          description={latestMaterial.title}
          action={{
            label: "Baixar PDF",
            icon: <Download className="w-4 h-4" />,
            onClick: () => window.open(latestMaterial.file_url, "_blank"),
          }}
        />
      );
    }
  }

  // 🏆 Posição no ranking (neutra)
  if (rankPosition) {
    cards.push(
      <FeedCard
        key="rank"
        gradient="from-yellow-500/10 to-amber-500/10"
        border="border-yellow-500/30"
        icon={<Trophy className="w-5 h-5 text-yellow-500" />}
        title={`Sua posição atual: ${rankPosition}º lugar`}
        description="Acompanhe o ranking como referência da sua jornada."
        action={{
          label: "Ver ranking completo",
          icon: <ChevronRight className="w-4 h-4" />,
          onClick: () => navigate("/ranking"),
        }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {cards.map((c, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
        >
          {c}
        </motion.div>
      ))}
    </div>
  );
}

interface FeedCardProps {
  gradient: string;
  border: string;
  icon: React.ReactNode;
  title: string;
  description?: string;
  stats?: { label: string; value: string }[];
  action?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    primary?: boolean;
  };
  buttons?: { label: string; icon?: React.ReactNode; onClick: () => void }[];
  accent?: React.ReactNode;
}

function FeedCard({
  gradient,
  border,
  icon,
  title,
  description,
  stats,
  action,
  buttons,
  accent,
}: FeedCardProps) {
  return (
    <div className={`rounded-xl border ${border} bg-gradient-to-br ${gradient} backdrop-blur p-4 space-y-3`}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-9 h-9 rounded-lg bg-background/60 flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground leading-snug">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
          )}
        </div>
        {accent}
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="bg-background/40 rounded-lg p-2 text-center">
              <div className="text-sm font-bold text-foreground">{s.value}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {action && (
        <button
          onClick={action.onClick}
          disabled={action.disabled}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            action.primary
              ? "gradient-primary text-primary-foreground shadow-lg hover:shadow-xl"
              : "bg-background/60 text-foreground hover:bg-background/80 border border-border"
          }`}
        >
          {action.icon}
          {action.label}
        </button>
      )}

      {buttons && (
        <div className="flex flex-wrap gap-2">
          {buttons.map((b) => (
            <button
              key={b.label}
              onClick={b.onClick}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-background/60 text-foreground hover:bg-background/80 border border-border transition-all"
            >
              {b.icon}
              {b.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
