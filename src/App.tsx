import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { ProfileGate } from "./components/ProfileGate";
import { RolesProvider } from "./hooks/useRoles";
import { ClassSwitcherProvider } from "./hooks/useClassSwitcher";
import { PageSkeleton } from "./components/PageSkeleton";
import { AdminLayout } from "./components/admin/AdminLayout";

// Páginas — imports dinâmicos (lazy) para reduzir o bundle inicial e otimizar o carregamento.
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const QuizPage = lazy(() => import("./pages/Quiz"));
const Arquivo = lazy(() => import("./pages/Arquivo"));
const ResultPage = lazy(() => import("./pages/Result"));
const RankingPage = lazy(() => import("./pages/Ranking"));
const GabaritoPage = lazy(() => import("./pages/Gabarito"));
const PreviewTelas = lazy(() => import("./pages/PreviewTelas"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const Oferta = lazy(() => import("./pages/Oferta"));
const RegrasPontuacao = lazy(() => import("./pages/RegrasPontuacao"));

// Membro
const MeuPerfil = lazy(() => import("./pages/membro/MeuPerfil"));
const MeuDesempenho = lazy(() => import("./pages/membro/MeuDesempenho"));
const Historico = lazy(() => import("./pages/membro/Historico"));
const Configuracoes = lazy(() => import("./pages/membro/Configuracoes"));
const Revista = lazy(() => import("./pages/membro/Revista"));
const Suporte = lazy(() => import("./pages/membro/Suporte"));
const Comunidade = lazy(() => import("./pages/membro/Comunidade"));
const Conquistas = lazy(() => import("./pages/membro/Conquistas"));
const EmBreve = lazy(() => import("./pages/membro/EmBreve").then(m => ({ default: m.EmBreve })));

// Admin
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminChurches = lazy(() => import("./pages/admin/AdminChurches"));
const AdminClasses = lazy(() => import("./pages/admin/AdminClasses"));
const AdminQuizzes = lazy(() => import("./pages/admin/AdminQuizzes"));
const AdminSeasons = lazy(() => import("./pages/admin/AdminSeasons"));
const AdminAttempts = lazy(() => import("./pages/admin/AdminAttempts"));
const AdminMemberAnswers = lazy(() => import("./pages/admin/AdminMemberAnswers"));
const AdminMyChurch = lazy(() => import("./pages/admin/AdminMyChurch"));
const AdminChurchMembers = lazy(() => import("./pages/admin/AdminChurchMembers"));
const AdminLocalAdmins = lazy(() => import("./pages/admin/AdminLocalAdmins"));
const AdminBadges = lazy(() => import("./pages/admin/AdminBadges"));
const AdminVerses = lazy(() => import("./pages/admin/AdminVerses"));
const AdminMaterials = lazy(() => import("./pages/admin/AdminMaterials"));
const AdminAuditLog = lazy(() => import("./pages/admin/AdminAuditLog"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const AdminSupport = lazy(() => import("./pages/admin/AdminSupport"));
const AdminCommunity = lazy(() => import("./pages/admin/AdminCommunity"));
const AdminEmails = lazy(() => import("./pages/admin/AdminEmails"));

// Bíblia e Harpa
const Biblia = lazy(() => import("./pages/membro/Biblia"));
const Harpa = lazy(() => import("./pages/membro/Harpa"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 segundos
      gcTime: 1000 * 60 * 5, // 5 minutos
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});


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
          <ClassSwitcherProvider>
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
                <Route path="emails" element={<AdminEmails />} />
              </Route>
              <Route path="/membro" element={<MeuPerfil />} />
              <Route path="/membro/perfil" element={<MeuPerfil />} />
              <Route path="/membro/desempenho" element={<MeuDesempenho />} />
              <Route path="/membro/historico" element={<Historico />} />
              <Route path="/membro/conquistas" element={<Conquistas />} />
              <Route path="/membro/revista" element={<Revista />} />

              <Route path="/membro/conta" element={<Navigate to="/membro/perfil" replace />} />
              <Route path="/revistas" element={<Navigate to="/membro/revista" replace />} />
              <Route path="/Revistas" element={<Navigate to="/membro/revista" replace />} />

              <Route path="/membro/comunidade" element={<Comunidade />} />
              <Route path="/membro/biblia" element={<Biblia />} />
              <Route path="/membro/harpa" element={<Harpa />} />
              <Route path="/membro/configuracoes" element={<Configuracoes />} />
              <Route path="/membro/suporte" element={<Suporte />} />
              <Route 
                path="/membro/loja" 
                element={
                  <EmBreve 
                    title="Loja EBD" 
                    description="Em breve você poderá adquirir materiais, revistas e outros recursos exclusivos para sua classe diretamente em nossa loja." 
                  />
                } 
              />
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
          </ClassSwitcherProvider>
        </RolesProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
