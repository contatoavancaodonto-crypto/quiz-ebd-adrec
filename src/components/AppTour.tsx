import React, { useState, useEffect } from "react";
import { Joyride, STATUS, TooltipRenderProps } from "react-joyride";
import type { Step } from "react-joyride";
import { supabase } from "@/integrations/supabase/client";
import { useFullProfile } from "@/hooks/useFullProfile";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

interface AppTourProps {
  forceStart?: boolean;
  onComplete?: () => void;
}

const CustomTooltip = ({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
  size,
  isLastStep,
}: TooltipRenderProps) => {
  return (
    <div
      {...tooltipProps}
      className="max-w-[320px] glass-card glow-border p-6 relative animate-scale-in"
    >
      <button
        {...closeProps}
        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X size={18} />
      </button>
      
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-primary/80">
            Passo {index + 1} de {size}
          </div>
          <h3 className="text-xl font-display font-bold gradient-text leading-tight">
            {step.title}
          </h3>
        </div>
        
        <p className="text-sm text-foreground/80 leading-relaxed">
          {step.content}
        </p>
        
        <div className="flex items-center justify-between pt-2">
          {index > 0 ? (
            <Button
              {...backProps}
              variant="ghost"
              size="sm"
              className="text-xs h-8 px-2"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>
          ) : (
            <div />
          )}
          
          <div className="flex gap-2">
            {!isLastStep && (
              <Button
                {...closeProps}
                variant="ghost"
                size="sm"
                className="text-xs h-8 px-2 text-muted-foreground"
              >
                Pular
              </Button>
            )}
            <Button
              {...primaryProps}
              size="sm"
              className="h-8 px-4 text-xs font-bold gradient-primary border-none shadow-lg hover:opacity-90 transition-opacity"
            >
              {isLastStep ? "Finalizar" : "Próximo"}
              {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export function AppTour({ forceStart = false, onComplete }: AppTourProps) {
  const { data: profile } = useFullProfile();
  const queryClient = useQueryClient();
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (forceStart) {
      setRun(true);
    } else if (profile && (profile as any).has_seen_tour === false) {
      setRun(true);
    }
  }, [profile, forceStart]);

  const steps: Step[] = [
    {
      target: "body",
      placement: "center",
      title: "Bem-vindo ao Quiz EBD! 🙏",
      content: "Vamos fazer um tour rápido para você conhecer as funções e regras do nosso app.",
      disableBeacon: true,
    },
    {
      target: "[data-tour='weekly-quiz-hero']",
      title: "Quiz da Semana 📝",
      content: "Aqui você responde as 5 perguntas da lição vigente. O quiz abre segunda 00:00 e fecha domingo 23:59 (BRT).",
    },
    {
      target: "[data-tour='streak-badge']",
      title: "Seu Fogo (Streak) 🔥",
      content: "Responda o quiz toda semana para manter seu fogo aceso! Mostra quantas semanas seguidas você participou.",
    },
    {
      target: "[data-tour='daily-reading']",
      title: "Leitura Diária 📖",
      content: "Acompanhe a leitura da semana e marque o 'check-in' ao concluir para ganhar pontos extras!",
    },
    {
      target: "[data-tour='nav-ranking']",
      title: "Rankings 🏆",
      content: "Acompanhe sua posição no Ranking da sua Classe e no Geral. O critério de desempate é o menor tempo!",
    },
    {
      target: "[data-tour='nav-biblia']",
      title: "Bíblia Online 📚",
      content: "Acesse a Bíblia completa para seus estudos e consultas rápidas.",
    },
    {
      target: "[data-tour='nav-conquistas']",
      title: "Conquistas 🏅",
      content: "Ganhe medalhas especiais ao atingir marcos no app, como 5 acertos ou participar várias semanas.",
    },
    {
      target: "[data-tour='nav-perfil']",
      title: "Seu Perfil 👤",
      content: "Aqui você gerencia seus dados e pode rever este tour quando quiser.",
    },
    {
      target: "[data-tour='sidebar-trigger']",
      title: "Menu Lateral ☰",
      content: "Abra o menu lateral para acessar a Comunidade, Harpa Cristã, Regras & Pontuação e muito mais.",
    },
    {
      target: "[data-tour='menu-regras']",
      title: "Regras & Pontuação 📏",
      content: "Aqui você consulta todas as regras do quiz: horários (seg 00:00 → dom 23:59), critério de desempate (menor tempo) e como funciona a pontuação.",
    },
    {
      target: "body",
      placement: "center",
      title: "Tudo Pronto! 🚀",
      content: "Agora você já sabe como funciona. Que Deus te abençoe em sua jornada de aprendizado!",
    },
  ];

  const handleJoyrideCallback = async (data: any) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      if (profile && !(profile as any).has_seen_tour) {
        try {
          await supabase
            .from("profiles")
            .update({ has_seen_tour: true } as any)
            .eq("id", profile.id);
          
          queryClient.invalidateQueries({ queryKey: ["full-profile"] });
        } catch (error) {
          console.error("Error updating tour status:", error);
        }
      }
      if (onComplete) onComplete();
    }
  };

  const JoyrideComponent = (Joyride as any).default || Joyride;

  return (
    <JoyrideComponent
      steps={steps}
      run={run}
      continuous
      scrollToFirstStep
      disableScrolling={false}
      tooltipComponent={CustomTooltip}
      styles={{
        options: {
          zIndex: 10000,
          overlayColor: "rgba(0, 0, 0, 0.7)",
        },
        spotlight: {
          borderRadius: 20,
          backgroundColor: "transparent",
          boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 15px rgba(76, 201, 224, 0.5)",
        }
      }}
      callback={handleJoyrideCallback}
    />
  );
}

