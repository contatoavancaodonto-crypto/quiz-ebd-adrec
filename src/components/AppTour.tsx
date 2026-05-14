import React, { useState, useEffect } from "react";
import Joyride, { Step, CallBackProps, STATUS } from "react-joyride";
import { supabase } from "@/integrations/supabase/client";
import { useFullProfile } from "@/hooks/useFullProfile";
import { useQueryClient } from "@tanstack/react-query";

interface AppTourProps {
  forceStart?: boolean;
  onComplete?: () => void;
}

export function AppTour({ forceStart = false, onComplete }: AppTourProps) {
  const { data: profile } = useFullProfile();
  const queryClient = useQueryClient();
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (forceStart) {
      setRun(true);
    } else if (profile && profile.has_seen_tour === false) {
      setRun(true);
    }
  }, [profile, forceStart]);

  const steps: Step[] = [
    {
      target: "body",
      placement: "center",
      title: "Bem-vindo ao ADREC! 🙏",
      content: "Vamos fazer um tour rápido para você conhecer as funções e regras do nosso app.",
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
      target: "[data-tour='rules-card']",
      title: "Regras do Quiz 📏",
      content: "Fique atento: o quiz abre segunda e fecha domingo. O desempate no ranking é sempre pelo tempo de resposta!",
    },
    {
      target: "[data-tour='sidebar-trigger']",
      title: "Menu Lateral ☰",
      content: "Acesse a Comunidade, Harpa Cristã, Regras e muito mais por aqui.",
    },
    {
      target: "body",
      placement: "center",
      title: "Tudo Pronto! 🚀",
      content: "Agora você já sabe como funciona. Que Deus te abençoe em sua jornada de aprendizado!",
    },
  ];

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      if (profile && !profile.has_seen_tour) {
        try {
          await supabase
            .from("profiles")
            .update({ has_seen_tour: true })
            .eq("id", profile.id);
          
          queryClient.invalidateQueries({ queryKey: ["full-profile"] });
        } catch (error) {
          console.error("Error updating tour status:", error);
        }
      }
      if (onComplete) onComplete();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      locale={{
        back: "Anterior",
        close: "Fechar",
        last: "Finalizar",
        next: "Próximo",
        skip: "Pular",
      }}
      styles={{
        options: {
          primaryColor: "#4CC9E0",
          backgroundColor: "#111827",
          textColor: "#FFFFFF",
          arrowColor: "#111827",
          zIndex: 1000,
        },
        tooltipContainer: {
          textAlign: "left",
          borderRadius: "16px",
          padding: "8px",
        },
        buttonNext: {
          borderRadius: "8px",
          fontWeight: "600",
        },
        buttonBack: {
          marginRight: "10px",
          color: "#9CA3AF",
        },
        spotlight: {
          borderRadius: "16px",
        }
      }}
      callback={handleJoyrideCallback}
    />
  );
}
