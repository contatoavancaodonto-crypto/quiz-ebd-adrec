import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { ProfileGate } from "./components/ProfileGate";
import { RolesProvider } from "./hooks/useRoles";
import { PageSkeleton } from "./components/PageSkeleton";

// Página inicial (entrada do quiz) — eager para LCP rápido
import Index from "./pages/Index";

// Públicas (próximas no funil) — lazy
const Auth = lazy(() => import("./pages/Auth"));
const QuizPage = lazy(() => import("./pages/Quiz"));
const Arquivo = lazy(() => import("./pages/Arquivo"));
const ResultPage = lazy(() => import("./pages/Result"));
const RankingPage = lazy(() => import("./pages/Ranking"));
const GabaritoPage = lazy(() => import("./pages/Gabarito"));
const PreviewTelas = lazy(() => import("./pages/PreviewTelas"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Membro — lazy (Bíblia/Harpa carregam JSONs pesados)
const MeuPerfil = lazy(() => import("./pages/membro/MeuPerfil"));
const MeuDesempenho = lazy(() => import("./pages/membro/MeuDesempenho"));
const Historico = lazy(() => import("./pages/membro/Historico"));
const Configuracoes = lazy(() => import("./pages/membro/Configuracoes"));
const Revista = lazy(() => import("./pages/membro/Revista"));
const Biblia = lazy(() => import("./pages/membro/Biblia"));
const Harpa = lazy(() => import("./pages/membro/Harpa"));

// Admin — lazy (área restrita, raramente acessada por membros)
const AdminLayout = lazy(() =>
  import("./components/admin/AdminLayout").then((m) => ({ default: m.AdminLayout })),
);
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
              <Route path="/painel-ebd-2025" element={<AdminLayout />}>
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
              </Route>
              <Route path="/membro" element={<MeuPerfil />} />
              <Route path="/membro/perfil" element={<MeuPerfil />} />
              <Route path="/membro/desempenho" element={<MeuDesempenho />} />
              <Route path="/membro/historico" element={<Historico />} />
              <Route path="/membro/revista" element={<Revista />} />
              <Route path="/membro/biblia" element={<Biblia />} />
              <Route path="/membro/harpa" element={<Harpa />} />
              <Route path="/membro/configuracoes" element={<Configuracoes />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </RolesProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
