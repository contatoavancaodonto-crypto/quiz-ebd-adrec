import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { ProfileGate } from "./components/ProfileGate";
import { RolesProvider } from "./hooks/useRoles";
import { PageSkeleton } from "./components/PageSkeleton";

// Páginas — imports diretos (eager) para navegação instantânea entre rotas.
// Mantemos lazy APENAS para Bíblia e Harpa (carregam JSONs grandes).
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import QuizPage from "./pages/Quiz";
import Arquivo from "./pages/Arquivo";
import ResultPage from "./pages/Result";
import RankingPage from "./pages/Ranking";
import GabaritoPage from "./pages/Gabarito";
import PreviewTelas from "./pages/PreviewTelas";
import NotFound from "./pages/NotFound";
import Unsubscribe from "./pages/Unsubscribe";
import Oferta from "./pages/Oferta";


// Membro
import MeuPerfil from "./pages/membro/MeuPerfil";
import MeuDesempenho from "./pages/membro/MeuDesempenho";
import Historico from "./pages/membro/Historico";
import Configuracoes from "./pages/membro/Configuracoes";
import Revista from "./pages/membro/Revista";
import Suporte from "./pages/membro/Suporte";
import Comunidade from "./pages/membro/Comunidade";
import { EmBreve } from "./pages/membro/EmBreve";

// Admin
import { AdminLayout } from "./components/admin/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminChurches from "./pages/admin/AdminChurches";
import AdminClasses from "./pages/admin/AdminClasses";
import AdminQuizzes from "./pages/admin/AdminQuizzes";
import AdminSeasons from "./pages/admin/AdminSeasons";
import AdminAttempts from "./pages/admin/AdminAttempts";
import AdminMemberAnswers from "./pages/admin/AdminMemberAnswers";
import AdminMyChurch from "./pages/admin/AdminMyChurch";
import AdminChurchMembers from "./pages/admin/AdminChurchMembers";
import AdminLocalAdmins from "./pages/admin/AdminLocalAdmins";
import AdminBadges from "./pages/admin/AdminBadges";
import AdminVerses from "./pages/admin/AdminVerses";
import AdminMaterials from "./pages/admin/AdminMaterials";
import AdminAuditLog from "./pages/admin/AdminAuditLog";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminSupport from "./pages/admin/AdminSupport";
import AdminCommunity from "./pages/admin/AdminCommunity";

// Lazy SOMENTE para páginas pesadas (JSONs grandes da Bíblia/Harpa)
const Biblia = lazy(() => import("./pages/membro/Biblia"));
const Harpa = lazy(() => import("./pages/membro/Harpa"));

const queryClient = new QueryClient();

const KeepLoggedInGuard = () => {
  useEffect(() => {
    const handler = () => {
      if (localStorage.getItem("keepLoggedIn") === "false") {
        supabase.auth.signOut();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <KeepLoggedInGuard />
        <RolesProvider>
          <ProfileGate />
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<Index />} />
              <Route path="/quiz" element={<QuizPage />} />
              <Route path="/arquivo" element={<Arquivo />} />
              <Route path="/result" element={<ResultPage />} />
              <Route path="/ranking" element={<RankingPage />} />
              <Route path="/gabarito" element={<GabaritoPage />} />
              <Route path="/preview-telas" element={<PreviewTelas />} />
              <Route path="/painel" element={<AdminLayout />}>
                <Route index element={<AdminOverview />} />
                <Route path="minha-igreja" element={<AdminMyChurch />} />
                <Route path="membros" element={<AdminChurchMembers />} />
                <Route path="admins-locais" element={<AdminLocalAdmins />} />
                <Route path="usuarios" element={<AdminUsers />} />
                <Route path="igrejas" element={<AdminChurches />} />
                <Route path="turmas" element={<AdminClasses />} />
                <Route path="quizzes" element={<AdminQuizzes />} />
                <Route path="temporadas" element={<AdminSeasons />} />
                <Route path="tentativas" element={<AdminAttempts />} />
                <Route path="respostas-membros" element={<AdminMemberAnswers />} />
                <Route path="badges" element={<AdminBadges />} />
                <Route path="versiculos" element={<AdminVerses />} />
                <Route path="materiais" element={<AdminMaterials />} />
                <Route path="auditoria" element={<AdminAuditLog />} />
                <Route path="notificacoes" element={<AdminNotifications />} />
                <Route path="suporte" element={<AdminSupport />} />
                <Route path="comunidade" element={<AdminCommunity />} />
              </Route>
              <Route path="/membro" element={<MeuPerfil />} />
              <Route path="/membro/perfil" element={<MeuPerfil />} />
              <Route path="/membro/desempenho" element={<MeuDesempenho />} />
              <Route path="/membro/historico" element={<Historico />} />
              <Route path="/membro/revista" element={<Revista />} />
              <Route path="/membro/comunidade" element={<Comunidade />} />
              <Route path="/membro/biblia" element={<Biblia />} />
              <Route path="/membro/harpa" element={<Harpa />} />
              <Route path="/membro/configuracoes" element={<Configuracoes />} />
              <Route path="/membro/suporte" element={<Suporte />} />
              <Route 
                path="/membro/apoio-professor" 
                element={
                  <EmBreve 
                    title="Apoio ao Professor" 
                    description="Em breve teremos conteúdos exclusivos, planos de aula e materiais de apoio para auxiliar os professores da EBD." 
                  />
                } 
              />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              <Route path="/oferta" element={<Oferta />} />
              <Route path="*" element={<NotFound />} />

            </Routes>
          </Suspense>
        </RolesProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
